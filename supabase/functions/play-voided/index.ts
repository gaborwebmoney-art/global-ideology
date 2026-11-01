// Global Ideology: revoke refunded / charged-back purchases. Run daily (Supabase cron → HTTP POST with header x-cron-secret).
// Secrets: CRON_SECRET (any long random string), plus the ones in _shared/play.ts.
// Deploy: supabase functions deploy play-voided --no-verify-jwt
import { cors, json, env, googleToken, PLAY, db } from '../_shared/play.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.headers.get('x-cron-secret') !== env('CRON_SECRET')) return json({ ok: false, why: 'auth' }, 401);
  try {
    const g = await googleToken();
    const since = Date.now() - 30 * 24 * 3600 * 1000;   // Google keeps voided purchases for 30 days
    const tokens: string[] = [];
    let page = '';
    for (let i = 0; i < 20; i++) {
      const r = await fetch(PLAY(`purchases/voidedpurchases?startTime=${since}&type=0&maxResults=1000${page ? '&token=' + encodeURIComponent(page) : ''}`), { headers: { Authorization: 'Bearer ' + g } });
      if (!r.ok) return json({ ok: false, why: 'google', status: r.status }, 502);
      const d = await r.json();
      (d.voidedPurchases || []).forEach((v: { purchaseToken: string }) => tokens.push(v.purchaseToken));
      page = d.tokenPagination && d.tokenPagination.nextPageToken;
      if (!page) break;
    }
    let revoked = 0;
    for (let i = 0; i < tokens.length; i += 100) {
      const list = tokens.slice(i, i + 100).map((t) => '"' + t.replace(/"/g, '') + '"').join(',');
      const r = await db(`gi_entitlements?purchase_token=in.(${encodeURIComponent(list)})&state=neq.revoked`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ state: 'revoked', updated_at: new Date().toISOString() }) });
      if (r.ok) revoked += (await r.json()).length;
    }
    return json({ ok: true, voided: tokens.length, revoked });
  } catch (e) {
    return json({ ok: false, why: 'server', detail: String((e as Error).message || e).slice(0, 200) }, 500);
  }
});
