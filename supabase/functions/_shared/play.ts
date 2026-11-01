// Shared helpers for the Google Play Edge Functions (Deno). No third-party imports.
// Secrets (Supabase → Edge Functions → Secrets): PLAY_SERVICE_ACCOUNT (the service account JSON key, whole file),
// PLAY_PACKAGE (app.globalideology.game). SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.

export const PRODUCTS: Record<string, string[]> = {
  'gi.branches.all': ['covert', 'spin', 'faith', 'under'],
  'gi.branch.covert': ['covert'],
  'gi.branch.spin': ['spin'],
  'gi.branch.grassroots': ['faith'],
  'gi.branch.backchannels': ['under'],
};

export const env = (k: string): string => {
  const v = Deno.env.get(k);
  if (!v) throw new Error('missing secret ' + k);
  return v;
};

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const b64url = (b: ArrayBuffer | Uint8Array | string) => {
  const bytes = typeof b === 'string' ? new TextEncoder().encode(b) : b instanceof Uint8Array ? b : new Uint8Array(b);
  let s = ''; bytes.forEach((x) => (s += String.fromCharCode(x)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export async function sha256hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

let cached: { token: string; exp: number } | null = null;

/** OAuth access token for the Play Developer API from the service account key (JWT bearer grant, RS256). */
export async function googleToken(): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const sa = JSON.parse(env('PLAY_SERVICE_ACCOUNT'));
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: sa.token_uri || 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const pem = String(sa.private_key).replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(head + '.' + claim));
  const r = await fetch(sa.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: head + '.' + claim + '.' + b64url(sig) }),
  });
  if (!r.ok) throw new Error('google token ' + r.status + ' ' + (await r.text()).slice(0, 200));
  const d = await r.json();
  cached = { token: d.access_token, exp: Date.now() + (d.expires_in || 3600) * 1000 };
  return cached.token;
}

export const PLAY = (path: string) =>
  `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(env('PLAY_PACKAGE'))}/${path}`;

/** PostgREST call with the service role (bypasses RLS; only these functions hold it). */
export async function db(path: string, init: RequestInit = {}): Promise<Response> {
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  return fetch(env('SUPABASE_URL') + '/rest/v1/' + path, {
    ...init,
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
}

/** Branches and products a user owns through active purchases. */
export async function owned(uid: string): Promise<{ branches: string[]; products: string[] }> {
  const now = encodeURIComponent(new Date().toISOString());   // free grants (gi_admin_grant) can expire
  const r = await db(`gi_entitlements?select=product&user_id=eq.${uid}&state=eq.active&or=(expires_at.is.null,expires_at.gt.${now})`);
  const rows: { product: string }[] = r.ok ? await r.json() : [];
  const products = [...new Set(rows.map((x) => x.product))].sort();
  const branches = [...new Set(products.flatMap((p) => PRODUCTS[p] || []))].sort();
  return { branches, products };
}
