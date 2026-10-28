// ---------- accounts & saves ----------
// Online accounts: Supabase project URL + publishable key (public by design; access is enforced by row-level security).
// Optional: a Cloudflare Turnstile site key, if CAPTCHA protection is switched on in Supabase.
// With no URL/key, the game offers device profiles instead (no passwords, saves stay in this browser).
const GI_BACKEND = { url: '', key: '', turnstile: '' };

window.GIAccounts = (() => {
  const MIN_PW = 8;
  // The beta channel (served under /beta/) keeps its profiles and saves apart from the main game and never uses the online server.
  const BETA = /\/beta\//.test(location.pathname), P = BETA ? 'beta.' : '';
  const LS = {
    get(k) { try { return localStorage.getItem(P + k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(P + k, v); return true; } catch { return false; } },
    del(k) { try { localStorage.removeItem(P + k); } catch { /* storage blocked */ } }
  };
  const readJSON = k => { try { return JSON.parse(LS.get(k) || 'null'); } catch { return null; } };
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const norm = e => String(e || '').trim().toLowerCase();
  const checkEmail = e => EMAIL_RE.test(e) ? null : 'Enter a valid email address.';
  const checkPw = pw => { pw = String(pw || ''); return pw.length < MIN_PW ? `Password must be at least ${MIN_PW} characters.` : !/[a-z]/i.test(pw) || !/[0-9]/.test(pw) ? 'Password must contain letters and digits.' : null; };
  const fail = m => { throw new Error(m); };

  // Device profiles: a name, no password. Anyone using this browser can open them, so the UI says so plainly.
  const local = {
    kind: 'local',
    profiles() { return readJSON('gi.profiles') || []; },
    async open(name) {
      name = String(name || '').trim().replace(/\s+/g, ' ');
      if (name.length < 1 || name.length > 24) fail('Use a profile name of 1 to 24 characters.');
      const list = this.profiles();
      if (!list.includes(name)) { list.push(name); if (!LS.set('gi.profiles', JSON.stringify(list))) fail('This browser blocks storage, so profiles cannot be kept here.'); }
      return { kind: 'local', email: name };
    },
    async refresh(s) { return s; },
    async logout() {},
    async load(s) { return readJSON('gi.save.' + s.email); },
    async save(s, rec) { if (!LS.set('gi.save.' + s.email, JSON.stringify(rec))) fail('Browser storage is full or blocked.'); },
    saveSync(s, rec) { LS.set('gi.save.' + s.email, JSON.stringify(rec)); },
    async clear(s) { LS.del('gi.save.' + s.email); },
    // v10.23: deleting a device profile removes its name and its save from this browser
    async remove(s) { LS.del('gi.save.' + s.email); LS.set('gi.profiles', JSON.stringify(this.profiles().filter(n => n !== s.email))); }
  };

  // Online accounts: Supabase Auth (email + password, stored by Supabase as bcrypt hashes) and a `saves` table
  // where row-level security limits every user to their own row.
  function supabase(cfg) {
    const H = token => ({ apikey: cfg.key, Authorization: 'Bearer ' + (token || cfg.key), 'Content-Type': 'application/json' });
    function message(b, status, ctx) {
      const code = (b && (b.error_code || b.code)) || '';
      const m = (b && (b.msg || b.error_description || b.message || b.error)) || '';
      if (ctx === 'register' && (/user_already_exists|email_exists/.test(code) || /already (been )?registered|already exists/i.test(m)))
        return 'Could not register with these details. If you already have an account, log in or reset your password.';
      if (/weak_password/.test(code) || /password.*(weak|short|characters|pwned|leaked)/i.test(m)) return 'Choose a stronger password: at least 8 characters, with letters and digits.';
      if (/invalid_credentials/.test(code) || /invalid login credentials/i.test(m)) return 'Wrong email or password.';
      if (/captcha/i.test(code + m)) return 'Please complete the “I am human” check and try again.';
      if (/email not confirmed/i.test(m)) return 'This account still needs email confirmation.';
      if (/same_password/.test(code)) return 'The new password must differ from the old one.';
      if (status === 429 || /over_.*rate_limit/.test(code)) return 'Too many attempts. Wait a few minutes and try again.';
      if (ctx === 'delete' && (status === 404 || /PGRST202/.test(code))) return 'Account deletion is not available yet. Please try again later.';
      return m || 'Server error ' + status;
    }
    async function call(path, opt, ctx) {
      let r;
      try { r = await fetch(cfg.url + path, opt); } catch { fail('Cannot reach the game server. Check your connection.'); }
      const t = await r.text(); let body = null;
      try { body = t ? JSON.parse(t) : null; } catch { body = null; }
      if (!r.ok) { const e = new Error(message(body, r.status, ctx)); e.status = r.status; throw e; }
      return body;
    }
    const withCaptcha = (body, token) => token ? Object.assign(body, { gotrue_meta_security: { captcha_token: token } }) : body;
    const sess = (d, email) => d && d.access_token ? { kind: 'supabase', email: norm((d.user && d.user.email) || email), uid: d.user && d.user.id, access: d.access_token, refresh: d.refresh_token, exp: Date.now() + (d.expires_in || 3600) * 1000 } : null;
    const upsert = (s, rec) => ({ method: 'POST', headers: Object.assign(H(s.access), { Prefer: 'resolution=merge-duplicates,return=minimal' }), body: JSON.stringify({ user_id: s.uid, state: rec, week: rec.week, updated_at: new Date().toISOString() }) });
    return {
      kind: 'supabase',
      async ping() {
        const c = new AbortController(); const t = setTimeout(() => c.abort(), 5000);
        try { const r = await fetch(cfg.url + '/auth/v1/settings', { headers: { apikey: cfg.key }, signal: c.signal }); return r.ok; }
        catch { return false; } finally { clearTimeout(t); }
      },
      async register(email, pw, captcha) {
        const d = await call('/auth/v1/signup', { method: 'POST', headers: H(), body: JSON.stringify(withCaptcha({ email, password: pw }, captcha)) }, 'register');
        const s = sess(d, email);
        if (s) return s;
        fail('Could not register with these details. If you already have an account, log in or reset your password.');
      },
      async login(email, pw, captcha) { return sess(await call('/auth/v1/token?grant_type=password', { method: 'POST', headers: H(), body: JSON.stringify(withCaptcha({ email, password: pw }, captcha)) }, 'login'), email); },
      async recover(email, redirectTo, captcha) {
        await call('/auth/v1/recover?redirect_to=' + encodeURIComponent(redirectTo), { method: 'POST', headers: H(), body: JSON.stringify(withCaptcha({ email }, captcha)) }, 'recover');
      },
      async user(access) { return call('/auth/v1/user', { headers: H(access) }); },
      async setPassword(s, pw) { await call('/auth/v1/user', { method: 'PUT', headers: H(s.access), body: JSON.stringify({ password: pw }) }, 'reset'); },
      async refresh(s) {
        if (s.exp - Date.now() > 120000) return s;
        return sess(await call('/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: H(), body: JSON.stringify({ refresh_token: s.refresh }) }), s.email);
      },
      async logout(s) { try { await call('/auth/v1/logout', { method: 'POST', headers: H(s.access) }); } catch { /* token already gone */ } },
      async load(s) { const rows = await call('/rest/v1/saves?select=state&user_id=eq.' + encodeURIComponent(s.uid), { headers: H(s.access) }); return rows && rows[0] ? rows[0].state : null; },
      async save(s, rec) { await call('/rest/v1/saves?on_conflict=user_id', upsert(s, rec)); },
      saveSync(s, rec) { try { fetch(cfg.url + '/rest/v1/saves?on_conflict=user_id', Object.assign({ keepalive: true }, upsert(s, rec))).catch(() => {}); } catch { /* page closing */ } },
      async clear(s) { await call('/rest/v1/saves?user_id=eq.' + encodeURIComponent(s.uid), { method: 'DELETE', headers: H(s.access) }); },
      // v10.23: gi_delete_my_account (tools/supabase-v10.23.sql) removes the auth user; saves and the ranking entry go with it
      async remove(s) {
        const r = await call('/rest/v1/rpc/gi_delete_my_account', { method: 'POST', headers: H(s.access), body: '{}' }, 'delete');
        if (!r || r.ok !== true) fail('Could not delete the account. Try again later.');
      }
    };
  }

  // Password-reset links land back on this page with the recovery tokens in the URL fragment.
  function takeRecoveryFromUrl() {
    const h = new URLSearchParams(location.hash.replace(/^#/, ''));
    const q = new URLSearchParams(location.search);
    const clean = () => { try { history.replaceState(null, '', location.pathname); } catch { /* sandboxed */ } };
    if (h.get('error_description') || q.get('error_description')) { const m = h.get('error_description') || q.get('error_description'); clean(); return { error: m.replace(/\+/g, ' ') }; }
    if (h.get('type') === 'recovery' && h.get('access_token')) {
      const d = { access_token: h.get('access_token'), refresh_token: h.get('refresh_token'), expires_in: +h.get('expires_in') || 3600 };
      clean(); return { tokens: d };
    }
    return null;
  }

  let backend = local, session = null, recovery = null;
  const persist = () => { if (session) LS.set('gi.session', JSON.stringify(session)); else LS.del('gi.session'); };
  async function fresh() {
    if (!session) fail('Not logged in.');
    const s = await backend.refresh(session);
    if (s !== session) { session = s; persist(); }
    return session;
  }
  const isSecretKey = k => /^sb_secret_/.test(k) || (() => { try { return JSON.parse(atob(k.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role === 'service_role'; } catch { return false; } })();

  return {
    MIN_PW,
    captchaSiteKey: () => backend.kind === 'supabase' ? GI_BACKEND.turnstile : '',
    async init() {
      let note = 'No online server is set up, so progress is kept as profiles in this browser. Anyone using this browser can open them.';
      LS.del('gi.users'); // accounts from the earlier browser-only version held password hashes; they are no longer used
      if (BETA) note = 'Beta version: progress is kept on this device only, separate from the main game.';
      else if (GI_BACKEND.key && isSecretKey(GI_BACKEND.key)) note = 'This page contains a secret server key, which must never be used in a browser. Replace it with the publishable key. Using device profiles for now.';
      else if (GI_BACKEND.url && GI_BACKEND.key) {
        const b = supabase({ url: GI_BACKEND.url.replace(/\/+$/, ''), key: GI_BACKEND.key });
        if (await b.ping()) { backend = b; note = 'Your progress is saved online, so you can continue on any device.'; }
        else note = 'The online server cannot be reached from here, so progress is kept as profiles in this browser. Anyone using this browser can open them.';
      }
      if (backend.kind === 'supabase') {
        const r = takeRecoveryFromUrl();
        if (r && r.error) recovery = { error: r.error };
        else if (r && r.tokens) {
          try { const u = await backend.user(r.tokens.access_token); recovery = { session: { kind: 'supabase', email: norm(u.email), uid: u.id, access: r.tokens.access_token, refresh: r.tokens.refresh_token, exp: Date.now() + r.tokens.expires_in * 1000 } }; }
          catch { recovery = { error: 'This password reset link has expired or was already used. Request a new one.' }; }
        }
      }
      const saved = readJSON('gi.session');
      if (!recovery && saved && saved.kind === backend.kind && saved.email) {
        session = saved;
        try { await fresh(); } catch (e) { if (e.status) { session = null; persist(); } }
      }
      return { kind: backend.kind, note, session, recovery };
    },
    session: () => session,
    kind: () => backend.kind,
    async openProfile(name) { session = await local.open(name); persist(); return session; },
    profiles: () => local.profiles(),
    async register(email, pw, captcha) { email = norm(email); const v = checkEmail(email) || checkPw(pw); if (v) fail(v); session = await backend.register(email, pw, captcha); persist(); return session; },
    async login(email, pw, captcha) { email = norm(email); const v = checkEmail(email) || (pw ? null : 'Enter your password.'); if (v) fail(v); session = await backend.login(email, pw, captcha); if (!session) fail('Login failed.'); persist(); return session; },
    async recover(email, captcha) {
      email = norm(email); const v = checkEmail(email); if (v) fail(v);
      const back = location.origin + location.pathname;
      try { await backend.recover(email, back, captcha); }
      catch (e) { if (e.status === 429 || /human/.test(e.message)) throw e; /* anything else: same neutral answer */ }
    },
    async finishReset(pw) {
      const v = checkPw(pw); if (v) fail(v);
      if (!recovery || !recovery.session) fail('This password reset link has expired. Request a new one.');
      await backend.setPassword(recovery.session, pw);
      session = recovery.session; recovery = null; persist(); return session;
    },
    async logout() { const s = session; session = null; persist(); if (s) await backend.logout(s); },
    async load() { return backend.load(await fresh()); },
    async save(rec) { return backend.save(await fresh(), rec); },
    saveSync(rec) { if (session) backend.saveSync(session, rec); },
    async clear() { return backend.clear(await fresh()); },
    // v10.23: delete the account and its data (online), or the device profile; then sign out
    async deleteAccount() { const s = await fresh(); await backend.remove(s); session = null; persist(); },
    // v10.22: a fresh access token for the ranking functions (online accounts only)
    async token() { if (!session || backend.kind !== 'supabase') return null; return (await fresh()).access; }
  };
})();
