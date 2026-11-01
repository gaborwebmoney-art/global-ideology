// Global Ideology: verify a Google Play purchase for the signed-in player, store it and acknowledge it.
// POST { token, productId } with the player's Supabase access token → { ok, state, branches, products }.
// Deploy: supabase functions deploy play-verify   (JWT verification on: only signed-in players)
import { PRODUCTS, cors, json, env, sha256hex, googleToken, PLAY, db, owned } from '../_shared/play.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ ok: false, why: 'method' }, 405);
  try {
    // 1. who is asking
    const auth = req.headers.get('Authorization') || '';
    const u = await fetch(env('SUPABASE_URL') + '/auth/v1/user', { headers: { apikey: env('SUPABASE_ANON_KEY'), Authorization: auth } });
    if (!u.ok) return json({ ok: false, why: 'login' }, 401);
    const uid: string = (await u.json()).id;
    if (!uid) return json({ ok: false, why: 'login' }, 401);

    // 2. what they bought
    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === 'string' ? body.token : '';
    const productId = typeof body.productId === 'string' ? body.productId : '';
    if (!token || token.length > 4096 || !PRODUCTS[productId]) return json({ ok: false, why: 'bad' }, 400);

    // 3. ask Google
    const g = await googleToken();
    const path = `purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(token)}`;
    const pr = await fetch(PLAY(path), { headers: { Authorization: 'Bearer ' + g } });
    if (pr.status === 404 || pr.status === 400 || pr.status === 410) return json({ ok: false, why: 'unknown' }, 400);
    if (!pr.ok) return json({ ok: false, why: 'google', status: pr.status }, 502);
    const p = await pr.json();
    // purchaseState: 0 purchased, 1 cancelled, 2 pending. The account hash must be this player's (set by the app at checkout).
    if (p.obfuscatedExternalAccountId && p.obfuscatedExternalAccountId !== (await sha256hex(uid))) return json({ ok: false, why: 'account' }, 403);
    const state = p.purchaseState === 0 ? 'active' : p.purchaseState === 2 ? 'pending' : 'revoked';

    // 4. store (a token belongs to one player for good)
    const ex = await db(`gi_entitlements?select=user_id&purchase_token=eq.${encodeURIComponent(token)}`);
    const rows = ex.ok ? await ex.json() : [];
    if (rows.length && rows[0].user_id !== uid) return json({ ok: false, why: 'account' }, 403);
    const row = { user_id: uid, product: productId, order_id: p.orderId || null, purchase_token: token, state,
      purchased_at: p.purchaseTimeMillis ? new Date(+p.purchaseTimeMillis).toISOString() : null, updated_at: new Date().toISOString() };
    const up = await db('gi_entitlements?on_conflict=purchase_token', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row) });
    if (!up.ok) return json({ ok: false, why: 'store', detail: (await up.text()).slice(0, 200) }, 500);

    // 5. acknowledge (Google refunds purchases left unacknowledged for 3 days)
    if (state === 'active' && p.acknowledgementState === 0) {
      const ack = await fetch(PLAY(path + ':acknowledge'), { method: 'POST', headers: { Authorization: 'Bearer ' + g, 'Content-Type': 'application/json' }, body: '{}' });
      if (!ack.ok && ack.status !== 400) return json({ ok: false, why: 'ack', status: ack.status }, 502);   // 400 = already acknowledged
    }
    return json({ ok: true, state, ...(await owned(uid)) });
  } catch (e) {
    return json({ ok: false, why: 'server', detail: String((e as Error).message || e).slice(0, 200) }, 500);
  }
});
