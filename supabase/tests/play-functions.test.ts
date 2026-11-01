// Offline test of the Play Edge Functions with Google and Supabase mocked. usage: deno run -A supabase/tests/play-functions.test.ts
const kp = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const der = new Uint8Array(await crypto.subtle.exportKey('pkcs8', kp.privateKey));
const pem = '-----BEGIN PRIVATE KEY-----\n' + btoa(String.fromCharCode(...der)).replace(/(.{64})/g, '$1\n') + '\n-----END PRIVATE KEY-----\n';
const ENV: Record<string, string> = { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'svc', PLAY_PACKAGE: 'app.globalideology.game', CRON_SECRET: 'cron',
  PLAY_SERVICE_ACCOUNT: JSON.stringify({ client_email: 'sa@x.iam.gserviceaccount.com', private_key: pem, token_uri: 'https://oauth2.googleapis.com/token' }) };
Deno.env.get = (k: string) => ENV[k];
const UID = '11111111-2222-4333-8444-555555555555', OTHER = '99999999-2222-4333-8444-555555555555';
const hex = async (s: string) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map((x) => x.toString(16).padStart(2, '0')).join('');
const ACC = await hex(UID);
const purchases: Record<string, any> = {
  good: { purchaseState: 0, acknowledgementState: 0, obfuscatedExternalAccountId: ACC, orderId: 'GPA.1', purchaseTimeMillis: '1730000000000' },
  acked: { purchaseState: 0, acknowledgementState: 1, obfuscatedExternalAccountId: ACC, orderId: 'GPA.2' },
  pending: { purchaseState: 2, acknowledgementState: 0, obfuscatedExternalAccountId: ACC },
  stolen: { purchaseState: 0, acknowledgementState: 0, obfuscatedExternalAccountId: 'f'.repeat(64) },
};
const ents: any[] = []; const acks: string[] = []; let jwtOk = false;
globalThis.fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const url = String(input); const h = new Headers(init.headers);
  const J = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json' } });
  if (url.startsWith('https://oauth2.googleapis.com/token')) {
    const a = new URLSearchParams(String(init.body)).get('assertion')!; const [hd, cl, sg] = a.split('.');
    const b64 = (x: string) => Uint8Array.from(atob(x.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((x.length + 3) % 4)), (c) => c.charCodeAt(0));
    jwtOk = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', kp.publicKey, b64(sg), new TextEncoder().encode(hd + '.' + cl)) && JSON.parse(new TextDecoder().decode(b64(cl))).scope.includes('androidpublisher');
    return J({ access_token: 'g', expires_in: 3600 });
  }
  if (url.endsWith('/auth/v1/user')) { const t = h.get('Authorization'); return t === 'Bearer u1' ? J({ id: UID }) : t === 'Bearer u2' ? J({ id: OTHER }) : J({}, 401); }
  const m = url.match(/purchases\/products\/([^/]+)\/tokens\/([^/:]+)(:acknowledge)?$/);
  if (m) { if (h.get('Authorization') !== 'Bearer g') return J({}, 401); const p = purchases[decodeURIComponent(m[2])]; if (!p) return J({}, 404); if (m[3]) { acks.push(m[2]); p.acknowledgementState = 1; return J({}); } return J(p); }
  if (url.includes('/voidedpurchases')) return J({ voidedPurchases: [{ purchaseToken: 'good' }] });
  if (url.includes('/rest/v1/gi_entitlements')) {
    if (h.get('Authorization') !== 'Bearer svc') return J({}, 401);
    if (init.method === 'POST') { const r = JSON.parse(String(init.body)); const i = ents.findIndex((e) => e.purchase_token === r.purchase_token); if (i >= 0) ents[i] = { ...ents[i], ...r }; else ents.push(r); return new Response(null, { status: 201 }); }
    if (init.method === 'PATCH') { const toks = decodeURIComponent(url).match(/in\.\(([^)]*)\)/)![1].split(',').map((x) => x.replace(/"/g, '')); const out = ents.filter((e) => toks.includes(e.purchase_token) && e.state !== 'revoked'); out.forEach((e) => (e.state = 'revoked')); return J(out); }
    const tok = url.match(/purchase_token=eq\.([^&]+)/); if (tok) return J(ents.filter((e) => e.purchase_token === decodeURIComponent(tok[1])).map((e) => ({ user_id: e.user_id })));
    const uid = url.match(/user_id=eq\.([^&]+)/)![1]; return J(ents.filter((e) => e.user_id === uid && e.state === 'active').map((e) => ({ product: e.product })));
  }
  return J({ unexpected: url }, 599);
}) as typeof fetch;
let handler: (r: Request) => Promise<Response>;
(Deno as any).serve = (h: any) => { handler = h; return {} as any; };
await import('../functions/play-verify/index.ts'); const verify = handler!;
await import('../functions/play-voided/index.ts'); const voided = handler!;
const res: [string, boolean, unknown][] = []; const ok = (n: string, c: boolean, x?: unknown) => res.push([n, c, x]);
const call = async (tok: string, body: unknown) => { const r = await verify(new Request('https://f/play-verify', { method: 'POST', headers: { Authorization: 'Bearer ' + tok }, body: JSON.stringify(body) })); return { s: r.status, d: await r.json() }; };
let r = await call('bad', { token: 'good', productId: 'gi.branch.spin' }); ok('no login → 401', r.s === 401, r);
r = await call('u1', { token: 'good', productId: 'gi.free' }); ok('unknown product → 400', r.s === 400 && r.d.why === 'bad', r);
r = await call('u1', { token: 'nope', productId: 'gi.branch.spin' }); ok('unknown token → 400', r.s === 400 && r.d.why === 'unknown', r);
r = await call('u1', { token: 'good', productId: 'gi.branch.spin' }); ok('valid purchase stored + acknowledged', r.s === 200 && r.d.ok && r.d.state === 'active' && JSON.stringify(r.d.branches) === '["spin"]' && acks.includes('good') && ents.length === 1, r);
ok('JWT to Google signed with the service key', jwtOk);
r = await call('u1', { token: 'good', productId: 'gi.branch.spin' }); ok('repeat is idempotent, not acknowledged twice', r.s === 200 && ents.length === 1 && acks.filter((x) => x === 'good').length === 1, r);
r = await call('u2', { token: 'good', productId: 'gi.branch.spin' }); ok('another player cannot claim the token', r.s === 403 && r.d.why === 'account', r);
r = await call('u1', { token: 'stolen', productId: 'gi.branches.all' }); ok('account hash mismatch → 403, not stored', r.s === 403 && !ents.some((e) => e.purchase_token === 'stolen'), r);
r = await call('u1', { token: 'pending', productId: 'gi.branch.covert' }); ok('pending stored, not acknowledged, not owned', r.s === 200 && r.d.state === 'pending' && !acks.includes('pending') && JSON.stringify(r.d.branches) === '["spin"]', r);
r = await call('u1', { token: 'acked', productId: 'gi.branches.all' }); ok('bundle → all four; already acknowledged not re-acked', r.s === 200 && JSON.stringify(r.d.branches) === '["covert","faith","spin","under"]' && !acks.includes('acked'), r);
let v = await voided(new Request('https://f/play-voided', { method: 'POST' })); ok('voided: needs the cron secret', v.status === 401);
v = await voided(new Request('https://f/play-voided', { method: 'POST', headers: { 'x-cron-secret': 'cron' } })); const vd = await v.json();
ok('voided purchase revoked', v.status === 200 && vd.revoked === 1 && ents.find((e) => e.purchase_token === 'good').state === 'revoked', vd);
r = await call('u1', { token: 'acked', productId: 'gi.branches.all' }); ok('revoked single gone, bundle still owns all', JSON.stringify(r.d.products) === '["gi.branches.all"]', r);
let f = 0; for (const [n, c, x] of res) { console.log((c ? 'PASS  ' : 'FAIL  ') + n + (c ? '' : ' -- ' + JSON.stringify(x))); if (!c) f++; }
console.log(`${res.length - f}/${res.length} passed`); Deno.exit(f ? 1 : 0);
