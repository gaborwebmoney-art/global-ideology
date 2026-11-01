"""v10.33 Android app test: server-side unlock-goal progress, paid branches (Google Play mocked), Back button, background pause.
The page runs as the Android app (window.Capacitor stub with mocked GIBilling and App plugins); Supabase is mocked in memory
(same rules as tools/supabase-v10.33.sql and the play-verify Edge Function). Also checks the web build stays free of the paywall.
usage: python3 tools/store-ui-test.py [shots_dir]   (exit code 0 = all passed)"""
import json, os, re, socket, subprocess, sys, time, uuid
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CHROME = os.environ.get('GI_CHROME', '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'shots')
os.makedirs(OUT, exist_ok=True)
CORS = {'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, apikey, content-type, prefer, x-client-info', 'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS'}
PRODUCTS = {'gi.branches.all': ['covert', 'faith', 'spin', 'under'], 'gi.branch.covert': ['covert'], 'gi.branch.spin': ['spin'], 'gi.branch.grassroots': ['faith'], 'gi.branch.backchannels': ['under']}
results = []


def check(name, cond, extra=''):
    results.append((name, bool(cond)))
    print(('PASS  ' if cond else 'FAIL  ') + name + ((' -- ' + str(extra)[:400]) if (extra and not cond) else ''))


class Server:
    def __init__(self):
        self.uid = str(uuid.uuid4()); self.runs = []; self.imp = None; self.ent = {}; self.calls = []; self.verify_fail = False

    def state(self):
        best = {}
        for r in self.runs: k = r['p_start'] + '|' + r['p_level']; best[k] = max(best.get(k, 0), r['p_stars'])
        ghost = sum(1 for r in self.runs if r['p_level'] in ('normal', 'brutal') and r['p_avg_noto'] <= 25)
        if self.imp:
            for k, v in self.imp['best'].items(): best[k] = max(best.get(k, 0), v)
            ghost += self.imp['ghost']
        return dict(ok=True, best=best, ghost=ghost, imported=self.imp is not None)

    def owned(self):
        prods = sorted({e['product'] for e in self.ent.values() if e['state'] == 'active'})
        return dict(branches=sorted({b for p in prods for b in PRODUCTS[p]}), products=prods)

    def rpc(self, fn, a):
        self.calls.append((fn, a))
        if fn == 'gi_goal_state': return self.state()
        if fn == 'gi_goal_record':
            if not any(r['p_run'] == a['p_run'] for r in self.runs): self.runs.append(a)
            return dict(ok=True)
        if fn == 'gi_goal_import':
            if self.imp: return dict(ok=False, why='done')
            self.imp = dict(best={k: min(3, int(v)) for k, v in (a.get('p_best') or {}).items()}, ghost=min(10, a.get('p_ghost') or 0)); return dict(ok=True)
        if fn == 'gi_my_branches': return dict(ok=True, **self.owned())
        if fn in ('gi_my_player',): return None
        return dict(ok=True)

    def handler(self, route, request):
        u, m = request.url, request.method
        if m == 'OPTIONS': return route.fulfill(status=204, headers=CORS)
        J = dict(CORS, **{'content-type': 'application/json'})
        if '/auth/v1/token' in u or '/auth/v1/signup' in u:
            return route.fulfill(status=200, headers=J, body=json.dumps({'access_token': 'tok', 'refresh_token': 'r', 'expires_in': 3600, 'user': {'id': self.uid, 'email': 'buyer@example.com'}}))
        if '/auth/v1/user' in u: return route.fulfill(status=200, headers=J, body=json.dumps({'id': self.uid, 'email': 'buyer@example.com'}))
        if '/auth/v1/' in u: return route.fulfill(status=200, headers=J, body='{}')
        if '/functions/v1/play-verify' in u:
            b = json.loads(request.post_data or '{}'); self.calls.append(('play-verify', b))
            if 'Bearer tok' not in (request.headers.get('authorization') or ''): return route.fulfill(status=401, headers=J, body='{"ok":false,"why":"login"}')
            if self.verify_fail: return route.fulfill(status=502, headers=J, body='{"ok":false,"why":"google"}')
            if b.get('productId') not in PRODUCTS: return route.fulfill(status=400, headers=J, body='{"ok":false,"why":"bad"}')
            self.ent[b['token']] = dict(product=b['productId'], state='active')
            return route.fulfill(status=200, headers=J, body=json.dumps(dict(ok=True, state='active', **self.owned())))
        mm = re.search(r'/rest/v1/rpc/(\w+)', u)
        if mm:
            out = self.rpc(mm.group(1), json.loads(request.post_data or '{}'))
            return route.fulfill(status=200, headers=J, body=json.dumps(out))
        if '/rest/v1/saves' in u: return route.fulfill(status=200 if m == 'GET' else 201, headers=J, body='[]' if m == 'GET' else '')
        if '/rest/v1/gi_' in u: return route.fulfill(status=201, headers=CORS, body='')
        return route.fulfill(status=200, headers=J, body='{}')


# Android stub: GIBilling answers like Play (test card: always approves); App collects the Back listener.
NATIVE = """
window.__play = { buys: [], owned: [], mode: 'approve', backCb: null, exited: 0 };
window.Capacitor = {
  isNativePlatform: () => true, getPlatform: () => 'android',
  Plugins: {
    GIBilling: {
      getProducts: async ({ ids }) => ({ products: ids.map(id => ({ id, price: id === 'gi.branches.all' ? '1 190 Ft' : '390 Ft' })) }),
      purchase: async ({ id, account }) => {
        __play.buys.push({ id, account });
        if (__play.mode === 'cancel') return { state: 'cancelled' };
        if (__play.mode === 'pending') return { state: 'pending', purchase: { token: 'pend-' + id, products: [id], state: 'pending' } };
        const p = { token: 'tok-' + id + '-' + __play.buys.length, products: [id], state: 'purchased', acknowledged: false, account };
        __play.owned.push(p); return { state: 'purchased', purchase: p };
      },
      queryPurchases: async () => ({ purchases: __play.owned }),
      addListener: () => ({ remove() {} })
    },
    App: { addListener: (ev, cb) => { if (ev === 'backButton') __play.backCb = cb; return { remove() {} }; }, exitApp: () => { __play.exited++; } }
  },
  registerPlugin: n => window.Capacitor.Plugins[n]
};
"""


def wait(page, expr, t=20):
    end = time.time() + t
    while not page.evaluate(expr):
        if time.time() > end: raise RuntimeError('timeout: ' + expr)
        page.wait_for_timeout(150)


WIN = """() => { const s = __GI.S; s.week = 230; COUNTRIES.forEach(c => { s.inf[c.id] = 97; }); s.legit = 90; s.pending = null; step(s); __GI.render(); return s.over; }"""


def login(page):
    page.fill('#authEmail', 'buyer@example.com'); page.fill('#authPw', 'abcdefg12'); page.click('#authGo')
    wait(page, "!!(window.GIAccounts.session() && document.getElementById('authOv').hidden)"); page.wait_for_timeout(600)


def start(page, cid='pannonia'):
    page.evaluate(f"['resumeOv','introOv','endOv'].forEach(k => {{ document.getElementById(k).hidden = true; }}); __GI.startGame('{cid}'); __GI.setSpeed(0)")


def open_branch(page, bid):
    page.evaluate("document.getElementById('openTree').click()"); page.wait_for_timeout(300)
    page.evaluate(f"document.querySelector('#tree [data-b=\"{bid}\"]').click()"); page.wait_for_timeout(300)


def android(browser, base, lang):
    tag = f'android-{lang}'; print(f'\n[{tag}]')
    ctx = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    srv = Server(); ctx.route(re.compile(r'https://[^/]+\.supabase\.co/.*'), srv.handler)
    ctx.add_init_script(NATIVE)
    # progress earned on this device before v10.33 for this account (to be uploaded once)
    ctx.add_init_script("try { if (!localStorage.getItem('seeded')) { localStorage.setItem('seeded', '1'); localStorage.setItem('gi.best.%s', JSON.stringify({ 'kestria|normal': { stars: 2, score: 1500, weeks: 230, plays: 1 }, _: { ghost: 1 } })); } } catch (e) {}" % srv.uid)
    page = ctx.new_page(); errs = []; page.on('pageerror', lambda e: errs.append(str(e)))
    shot = lambda n: page.screenshot(path=os.path.join(OUT, f'store-{tag}-{n}.png'))
    page.goto(base + '/index.html?debug'); wait(page, "!!(window.__GI && !document.getElementById('authOv').hidden)")
    page.evaluate(f"GI_I18N.setLang('{lang}')"); page.wait_for_timeout(150)
    check(f'{tag}: version tagged -android', page.evaluate("window.GITele.VERSION") == '10.33-android', page.evaluate("window.GITele.VERSION"))
    # --- guest: branch locked, offer asks for an account, no buy button
    page.click('#authGuest'); page.wait_for_timeout(200); start(page)
    check(f'{tag}: guest: extra branches locked', page.evaluate("__GI.S.cfg.locked.slice().sort().join()") == 'covert,faith,spin,under', page.evaluate("__GI.S.cfg.locked"))
    open_branch(page, 'covert')
    check(f'{tag}: guest: offer asks for an account, no buy button', page.evaluate("!!document.querySelector('#tree [data-payacct]') && !document.querySelector('#tree [data-buy]')"))
    shot('01-guest-offer')
    # --- Back button: closes the sheet, then pauses, then asks twice to leave
    page.evaluate("__play.backCb()"); page.wait_for_timeout(150)
    check(f'{tag}: Back goes up one level in Upgrades', page.evaluate("!document.getElementById('treeOv').hidden && !!document.querySelector('#tree .tiles-branches')"))
    page.evaluate("__play.backCb()"); page.wait_for_timeout(150)
    check(f'{tag}: Back closes Upgrades', page.evaluate("document.getElementById('treeOv').hidden"))
    if page.evaluate("document.getElementById('side').classList.contains('open')"):
        page.evaluate("__play.backCb()"); page.wait_for_timeout(150)
        check(f'{tag}: Back closes the phone dossier', page.evaluate("!document.getElementById('side').classList.contains('open')"))
    page.evaluate("__GI.setSpeed(2)"); page.evaluate("__play.backCb()"); page.wait_for_timeout(100)
    check(f'{tag}: Back pauses a running game', page.evaluate("document.getElementById('sp0').getAttribute('aria-pressed') === 'true'"))
    page.evaluate("__play.backCb()"); page.wait_for_timeout(100)
    check(f'{tag}: first Back on a paused game only warns', page.evaluate("__play.exited === 0 && !document.getElementById('giToast').hidden"), page.evaluate("document.getElementById('giToast') && document.getElementById('giToast').textContent"))
    page.evaluate("__play.backCb()"); page.wait_for_timeout(100)
    check(f'{tag}: second Back leaves the app', page.evaluate("__play.exited") == 1)
    page.evaluate("__GI.setSpeed(3); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); delete document.visibilityState"); page.wait_for_timeout(100)
    check(f'{tag}: game comes back paused after the app was in the background', page.evaluate("document.getElementById('sp0').getAttribute('aria-pressed') === 'true'"))
    # --- log in: device progress uploaded once, server state used
    page.evaluate("document.getElementById('pickbar').hidden = true; document.getElementById('logout').click()"); page.wait_for_timeout(300)
    if not page.is_visible('#authEmail'): page.evaluate("document.getElementById('authOv').hidden = false")
    login(page)
    wait(page, "!!localStorage.getItem('gi.goalsrv.%s')" % srv.uid)
    imp = [c for c in srv.calls if c[0] == 'gi_goal_import']
    check(f'{tag}: device progress uploaded once', len(imp) == 1 and imp[0][1]['p_best'] == {'kestria|normal': 2} and imp[0][1]['p_ghost'] == 1, imp)
    # --- a win is recorded on the server and counts at once
    start(page)
    check(f'{tag}: online win', page.evaluate(WIN) == 'win')
    wait(page, "!document.getElementById('endOv').hidden"); page.wait_for_timeout(800)
    rec = [c for c in srv.calls if c[0] == 'gi_goal_record']
    check(f'{tag}: win sent to gi_goal_record with plausible values', len(rec) == 1 and rec[0][1]['p_start'] == 'pannonia' and rec[0][1]['p_weeks'] >= 60 and rec[0][1]['p_version'] == '10.33-android', rec)
    st = page.evaluate("JSON.parse(localStorage.getItem('gi.goalsrv.%s'))" % srv.uid)
    check(f'{tag}: server state cached (import + win)', st and st['best'].get('kestria|normal') == 2 and st['best'].get('pannonia|normal', 0) >= 1, st)
    # Android trusts the server copy: a forged local record does not count
    page.evaluate("localStorage.setItem('gi.best.%s', JSON.stringify({ 'a|brutal': { stars: 3 }, 'b|brutal': { stars: 3 }, 'c|brutal': { stars: 3 }, 'd|brutal': { stars: 3 }, _: { ghost: 9 } }))" % srv.uid)
    page.evaluate("document.getElementById('endOv').hidden = true"); start(page)
    check(f'{tag}: forged device progress does not unlock on Android', page.evaluate("__GI.S.cfg.locked.includes('under') && __GI.S.cfg.locked.includes('covert')"), page.evaluate("__GI.S.cfg.locked"))
    # --- buy one branch
    open_branch(page, 'spin'); page.wait_for_timeout(400)
    btxt = page.evaluate("[...document.querySelectorAll('#tree [data-buy]')].map(b => b.dataset.buy + '=' + b.textContent)")
    check(f'{tag}: two offers with Play prices (single + bundle)', len(btxt) == 2 and 'gi.branch.spin=' in btxt[0] and '390' in btxt[0] and 'gi.branches.all' in btxt[1] and '1' in btxt[1], btxt)
    shot('02-offer')
    page.evaluate("__play.mode = 'cancel'"); page.click('#tree [data-buy="gi.branch.spin"]'); page.wait_for_timeout(500)
    check(f'{tag}: cancelled purchase: still locked, nothing verified', page.evaluate("__GI.S.cfg.locked.includes('spin')") and not any(c[0] == 'play-verify' for c in srv.calls))
    page.evaluate("__play.mode = 'approve'"); page.click('#tree [data-buy="gi.branch.spin"]')
    wait(page, "!__GI.S.cfg.locked.includes('spin')")
    acct = page.evaluate("__play.buys[__play.buys.length - 1].account")
    check(f'{tag}: checkout carries the account hash (64 hex)', bool(re.fullmatch(r'[0-9a-f]{64}', acct or '')), acct)
    ver = [c for c in srv.calls if c[0] == 'play-verify']
    check(f'{tag}: token verified on the server', len(ver) == 1 and ver[0][1]['productId'] == 'gi.branch.spin', ver)
    check(f'{tag}: bought branch opens in the running game', page.evaluate("!__GI.S.cfg.locked.includes('spin') && __GI.S.cfg.locked.includes('covert')"))
    page.wait_for_timeout(300); shot('03-bought-spin')
    # --- pending payment: no unlock, message
    page.evaluate("document.getElementById('closeTree').click()"); page.wait_for_timeout(100)
    open_branch(page, 'under'); page.evaluate("__play.mode = 'pending'"); page.click('#tree [data-buy="gi.branch.backchannels"]'); page.wait_for_timeout(500)
    check(f'{tag}: pending payment: still locked, message shown', page.evaluate("__GI.S.cfg.locked.includes('under') && !!document.querySelector('#tree .paynote')"), page.evaluate("(document.querySelector('#tree .paynote') || {}).textContent"))
    # --- bundle
    page.evaluate("__play.mode = 'approve'"); page.click('#tree [data-buy="gi.branches.all"]')
    wait(page, "__GI.S.cfg.locked.length === 0")
    check(f'{tag}: bundle opens all four', page.evaluate("__GI.S.cfg.locked.length") == 0)
    page.evaluate("document.getElementById('closeTree').click()"); page.wait_for_timeout(100)
    check(f'{tag}: no lock chips left on the branch tiles', page.evaluate("document.getElementById('openTree').click(), ![...document.querySelectorAll('#tree .tiles-branches .chip')].some(c => /Locked|Zárolva/.test(c.textContent))"))
    page.evaluate("document.getElementById('closeTree').click()")
    # --- new game: still unlocked; goals list shows bought
    start(page, 'kestria')
    check(f'{tag}: next game: nothing locked', page.evaluate("__GI.S.cfg.locked.length") == 0)
    page.evaluate("document.getElementById('moreBtn').click()"); page.wait_for_timeout(300)
    gl = page.evaluate("document.getElementById('goalList').innerText")
    check(f'{tag}: unlock goals list marks bought branches', ('bought' in gl) or ('megvásárolva' in gl), gl[:300])
    shot('04-goals')
    # --- restore on a fresh install (empty storage): owned branches come back from the server
    page.evaluate("document.getElementById('setOpen').click()"); page.wait_for_timeout(200)
    check(f'{tag}: Settings shows Restore purchases', page.is_visible('#setRestore'))
    page.evaluate(f"localStorage.removeItem('gi.owned.{srv.uid}')")
    page.click('#setRestore'); wait(page, "!document.getElementById('setRestore').disabled && /4/.test(document.getElementById('restoreNote').textContent)")
    check(f'{tag}: restore re-verifies Play purchases and reports 4 of 4', '4' in page.evaluate("document.getElementById('restoreNote').textContent"), page.evaluate("document.getElementById('restoreNote').textContent"))
    shot('05-restore')
    if lang == 'hu':
        miss = [m for m in page.evaluate("[...GI_I18N.misses]") if re.search(r'(unlock|branch|purchase|Google|Restore|Back|Paused|account)', m, re.I)]
        check(f'{tag}: new strings translated', not miss, miss)
    check(f'{tag}: no page errors', not errs, errs)
    ctx.close()
    return srv


def web_after_android(browser, base, srv):
    tag = 'web'; print(f'\n[{tag}]')
    ctx = browser.new_context(viewport={'width': 1280, 'height': 800})
    ctx.route(re.compile(r'https://[^/]+\.supabase\.co/.*'), srv.handler)
    page = ctx.new_page(); errs = []; page.on('pageerror', lambda e: errs.append(str(e)))
    page.goto(base + '/index.html?debug'); wait(page, "!!(window.__GI && !document.getElementById('authOv').hidden)")
    check(f'{tag}: version untagged', page.evaluate("window.GITele.VERSION") == '10.33')
    page.click('#authGuest'); page.wait_for_timeout(200); start(page)
    open_branch(page, 'covert')
    check(f'{tag}: guest on the web: no paywall at all', page.evaluate("!document.querySelector('#tree .paybox')"))
    page.evaluate("document.getElementById('closeTree').click(); document.getElementById('pickbar').hidden = true; document.getElementById('logout').click()"); page.wait_for_timeout(300)
    if not page.is_visible('#authEmail'): page.evaluate("document.getElementById('authOv').hidden = false")
    login(page)
    wait(page, "!!localStorage.getItem('gi.owned.%s')" % srv.uid)
    start(page)
    check(f'{tag}: branches bought on Android open on the web for the same account', page.evaluate("__GI.S.cfg.locked.length") == 0, page.evaluate("__GI.S.cfg.locked"))
    check(f'{tag}: no page errors', not errs, errs)
    ctx.close()


if __name__ == '__main__':
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
    srvp = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(0.8)
        with sync_playwright() as p:
            b = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
            base = f'http://127.0.0.1:{port}'
            srv = android(b, base, 'en')
            android(b, base, 'hu')
            web_after_android(b, base, srv)
            b.close()
    finally:
        srvp.terminate()
    fails = [n for n, ok in results if not ok]
    print(f'\n{len(results) - len(fails)}/{len(results)} passed')
    sys.exit(1 if fails else 0)
