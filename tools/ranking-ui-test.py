"""Global ranking browser test (v10.22): guest button, 16+ on register, guest end-screen preview, login, score submit, join,
ranking overlay (tabs, me row), More entry, leave. Phone + desktop, EN + HU. Supabase is mocked in memory (same rules as
tools/supabase-ranking.sql). usage: python3 tools/ranking-ui-test.py [shots_dir]   (exit code 0 = all passed)"""
import json, os, re, socket, subprocess, sys, time, uuid
from datetime import datetime, timedelta, timezone
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CHROME = os.environ.get('GI_CHROME', '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'shots')
os.makedirs(OUT, exist_ok=True)
CORS = {'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, apikey, content-type, prefer, x-client-info', 'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS'}
results = []


def check(name, cond, extra=''):
    results.append((name, bool(cond)))
    print(('PASS  ' if cond else 'FAIL  ') + name + ((' -- ' + str(extra)[:400]) if (extra and not cond) else ''))


class Server:
    """In-memory stand-in for Supabase auth + the ranking functions."""
    LIM = {'casual': (1000, 210), 'normal': (1500, 260), 'brutal': (2500, 280)}

    def __init__(self):
        self.uid = str(uuid.uuid4()); self.players = {}; self.scores = []; self.calls = []
        for i in range(120):   # other players this week
            u = 'u%03d' % i
            self.players[u] = {'name': 'Rival%03d' % i, 'country': ['DE', 'PL', None, 'US'][i % 4]}
            self.scores.append({'user': u, 'run': str(uuid.uuid4()), 'level': 'normal', 'score': 1700 - i * 3, 'stars': 2, 'weeks': 230, 'start': 'kestria'})

    def board(self, level, period):
        best = {}
        for s in self.scores:
            if s['level'] != level or s['user'] not in self.players: continue
            if s['user'] not in best or s['score'] > best[s['user']]['score']: best[s['user']] = s
        rows = sorted(best.values(), key=lambda s: (-s['score'], s['weeks']))
        return [dict(rank=i + 1, user=s['user'], name=self.players[s['user']]['name'], country=self.players[s['user']]['country'], score=s['score'], stars=s['stars'], weeks=s['weeks'], start=s['start']) for i, s in enumerate(rows)]

    def rpc(self, fn, a, authed):
        uid = self.uid if authed else None
        self.calls.append((fn, a, authed))
        if fn == 'gi_ranking':
            b = self.board(a['p_level'], a['p_period'])
            rows = [{k: v for k, v in dict(r, you=r['user'] == uid).items() if k != 'user'} for r in b[:100]]
            me = None
            if uid:
                mine = [s for s in self.scores if s['user'] == uid and s['level'] == a['p_level']]
                if mine:
                    m = max(mine, key=lambda s: s['score'])
                    ahead = [r for r in b if r['user'] != uid and r['score'] > m['score']]
                    me = dict(joined=uid in self.players, score=m['score'], stars=m['stars'], weeks=m['weeks'], start=m['start'], rank=1 + len(ahead),
                              ahead=(dict(name=ahead[-1]['name'], score=ahead[-1]['score']) if ahead else None))
                else: me = dict(joined=uid in self.players)
            return dict(ok=True, rows=rows, total=len(b), me=me)
        if fn == 'gi_rank_preview':
            b = [r for r in self.board(a['p_level'], 'week') if r['user'] != uid]
            ahead = [r for r in b if r['score'] > a['p_score']]
            return dict(ok=True, week=1 + len(ahead), all=1 + len(ahead), ahead=(dict(name=ahead[-1]['name'], score=ahead[-1]['score']) if ahead else None))
        if not uid: return None   # 401 below
        if fn == 'gi_my_player':
            p = self.players.get(uid); return dict(name=p['name'], country=p['country']) if p else None
        if fn == 'gi_join_ranking':
            if a.get('p_age16') is not True: return dict(ok=False, why='age')
            if not re.match(r'^[A-Za-z0-9_]{3,20}$', a['p_name'] or ''): return dict(ok=False, why='name')
            if any(p['name'].lower() == a['p_name'].lower() for u, p in self.players.items() if u != uid): return dict(ok=False, why='taken')
            self.players[uid] = dict(name=a['p_name'], country=a.get('p_country')); return dict(ok=True)
        if fn == 'gi_delete_my_account':
            self.players.pop(uid, None); self.scores = [x for x in self.scores if x['user'] != uid]; self.deleted = True; return dict(ok=True)
        if fn == 'gi_leave_ranking':
            self.players.pop(uid, None); self.scores = [s for s in self.scores if s['user'] != uid]; return dict(ok=True)
        if fn == 'gi_submit_score':
            base, par = self.LIM[a['p_level']]
            if a['p_weeks'] < 60: return dict(ok=False, why='weeks')
            if a['p_stars'] >= 2 and a['p_weeks'] > par: return dict(ok=False, why='stars')
            if a['p_score'] > base + 10 * max(0, par - a['p_weeks']): return dict(ok=False, why='score')
            if not any(s['run'] == a['p_run'] for s in self.scores):
                self.scores.append(dict(user=uid, run=a['p_run'], level=a['p_level'], score=a['p_score'], stars=a['p_stars'], weeks=a['p_weeks'], start=a['p_start']))
            return dict(ok=True)
        return dict(ok=False)

    def handler(self, route, request):
        u, m = request.url, request.method
        if m == 'OPTIONS': return route.fulfill(status=204, headers=CORS)
        J = dict(CORS, **{'content-type': 'application/json'})
        if '/auth/v1/settings' in u: return route.fulfill(status=200, headers=J, body='{}')
        if '/auth/v1/token' in u or '/auth/v1/signup' in u:
            self.calls.append(('auth', u.split('/auth/v1/')[1], True))
            return route.fulfill(status=200, headers=J, body=json.dumps({'access_token': 'tok', 'refresh_token': 'r', 'expires_in': 3600, 'user': {'id': self.uid, 'email': 'tester@example.com'}}))
        if '/auth/v1/user' in u: return route.fulfill(status=200, headers=J, body=json.dumps({'id': self.uid, 'email': 'tester@example.com'}))
        if '/auth/v1/logout' in u: return route.fulfill(status=204, headers=CORS)
        mm = re.search(r'/rest/v1/rpc/(\w+)', u)
        if mm:
            authed = 'Bearer tok' in (request.headers.get('authorization') or '')
            out = self.rpc(mm.group(1), json.loads(request.post_data or '{}'), authed)
            if out is None and mm.group(1) not in ('gi_my_player',): return route.fulfill(status=401, headers=J, body='{"message":"jwt"}')
            return route.fulfill(status=200, headers=J, body=json.dumps(out))
        if '/rest/v1/saves' in u: return route.fulfill(status=200 if m == 'GET' else 201, headers=J, body='[]' if m == 'GET' else '')
        if '/rest/v1/gi_' in u: return route.fulfill(status=201, headers=CORS, body='')
        return route.fulfill(status=200, headers=J, body='{}')


def wait(page, expr, t=20):
    end = time.time() + t
    while not page.evaluate(expr):
        if time.time() > end: raise RuntimeError('timeout: ' + expr)
        page.wait_for_timeout(150)


WIN = """() => { const s = __GI.S; s.week = 230; COUNTRIES.forEach(c => { s.inf[c.id] = 97; }); s.legit = 90; s.pending = null; step(s); __GI.render(); return s.over; }"""


def walk(browser, base, device, lang):
    tag = f'{device}-{lang}'; print(f'\n[{tag}]')
    ctx = browser.new_context(**({'viewport': {'width': 390, 'height': 844}, 'device_scale_factor': 2, 'is_mobile': True, 'has_touch': True} if device == 'phone' else {'viewport': {'width': 1280, 'height': 800}}))
    srv = Server(); ctx.route(re.compile(r'https://[^/]+\.supabase\.co/.*'), srv.handler)
    page = ctx.new_page(); errs = []; page.on('pageerror', lambda e: errs.append(str(e)))
    shot = lambda n: page.screenshot(path=os.path.join(OUT, f'rank-{tag}-{n}.png'))
    page.goto(base + '/index.html?debug'); wait(page, "!!(window.__GI && !document.getElementById('authOv').hidden)")
    page.evaluate(f"GI_I18N.setLang('{lang}')"); page.wait_for_timeout(200)
    # 1. guest button visible
    g = page.evaluate("(() => { const b = document.getElementById('authGuest').getBoundingClientRect(); return { h: b.height, w: b.width, vis: b.bottom <= innerHeight + 1 && b.height > 0, txt: document.getElementById('authGuest').textContent }; })()")
    check(f'{tag}: guest button visible, full width, 44px', g['vis'] and g['h'] >= 42 and g['w'] >= 250, g)
    shot('01-login')
    # 2. register asks 16+
    page.click('#authSwitch'); page.wait_for_timeout(150)
    check(f'{tag}: register shows the 16+ box', page.is_visible('#authAge'))
    page.fill('#authEmail', 'kid@example.com'); page.fill('#authPw', 'abcdefg12'); page.fill('#authPw2', 'abcdefg12'); page.click('#authGo'); page.wait_for_timeout(300)
    err = page.evaluate("document.getElementById('authErr').textContent")
    check(f'{tag}: register without 16+ is refused, no signup call', ('16' in err) and not any(c[0] == 'auth' for c in srv.calls), err)
    shot('02-register-16')
    page.click('#authSwitch'); page.wait_for_timeout(100)
    # 3. guest game -> win -> end screen preview
    page.click('#authGuest'); page.wait_for_timeout(200)
    page.evaluate("document.getElementById('introOv').hidden = true; __GI.startGame('pannonia'); __GI.setSpeed(0)")
    check(f'{tag}: guest win', page.evaluate(WIN) == 'win')
    wait(page, "!document.getElementById('endRank').hidden")
    t = page.evaluate("document.getElementById('endRank').innerText")
    check(f'{tag}: guest end screen shows the would-be rank', ('would be #' in t) or ('hely lenne' in t), t)
    check(f'{tag}: guest score not submitted', not any(c[0] == 'gi_submit_score' for c in srv.calls))
    shot('03-guest-end')
    page.click('#endRank [data-rsee]'); wait(page, "document.querySelectorAll('#rankList .rank-row').length > 0")
    n = page.evaluate("document.querySelectorAll('#rankList .rank-row').length")
    foot = page.evaluate("document.getElementById('rankFoot').innerText")
    check(f'{tag}: ranking lists the top 100', n == 100, n)
    check(f'{tag}: guest footer asks to log in (16+)', '16' in foot, foot)
    shot('04-ranking-guest')
    page.click('[data-rpd="all"]'); page.wait_for_timeout(300); page.click('[data-rlv="brutal"]'); page.wait_for_timeout(400)
    last = [c for c in srv.calls if c[0] == 'gi_ranking'][-1][1]
    check(f'{tag}: tabs ask for the right board', last == {'p_level': 'brutal', 'p_period': 'all'}, last)
    check(f'{tag}: empty board message', page.evaluate("document.querySelector('#rankList .rank-msg') !== null"))
    page.click('#rankClose'); page.wait_for_timeout(150)
    # 4. log in, win, submit, join
    page.evaluate("document.getElementById('pickbar').hidden = true; document.getElementById('logout').click()"); page.wait_for_timeout(300)
    if not page.is_visible('#authEmail'):
        page.evaluate("document.getElementById('authOv').hidden = false")
    page.fill('#authEmail', 'tester@example.com'); page.fill('#authPw', 'abcdefg12'); page.click('#authGo')
    wait(page, "!!(window.GIAccounts.session() && document.getElementById('authOv').hidden)"); page.wait_for_timeout(500)
    page.evaluate("['resumeOv','introOv','endOv'].forEach(k => { document.getElementById(k).hidden = true; }); __GI.startGame('pannonia'); __GI.setSpeed(0)")
    w = page.evaluate(WIN)
    check(f'{tag}: logged-in win', w == 'win', page.evaluate("JSON.stringify({ over: __GI.S && __GI.S.over, week: __GI.S && __GI.S.week, sess: !!GIAccounts.session(), ov: ['authOv','resumeOv','introOv','endOv'].filter(k => !document.getElementById(k).hidden) })") if w != 'win' else '')
    wait(page, "!document.getElementById('endRank').hidden")
    sub = [c for c in srv.calls if c[0] == 'gi_submit_score']
    check(f'{tag}: win submitted with plausible values', len(sub) == 1 and sub[0][2] and sub[0][1]['p_level'] in ('casual', 'normal', 'brutal') and sub[0][1]['p_weeks'] >= 60 and sub[0][1]['p_version'] == '10.25', sub)
    check(f'{tag}: server accepted it', any(s['user'] == srv.uid for s in srv.scores), sub)
    t = page.evaluate("document.getElementById('endRank').innerText")
    check(f'{tag}: end screen offers Join', page.evaluate("!!document.querySelector('#endRank [data-rjoin]')"), t)
    shot('05-end-not-joined')
    page.click('#endRank [data-rjoin]'); wait(page, "!document.getElementById('joinOv').hidden")
    page.fill('#joinName', 'Pavel_HU'); page.click('#joinGo'); page.wait_for_timeout(200)
    check(f'{tag}: join needs 16+', '16' in page.evaluate("document.getElementById('joinMsg').textContent"))
    page.check('#joinAge'); page.check('#joinOk'); page.select_option('#joinCountry', 'HU'); shot('06-join')
    page.click('#joinGo'); wait(page, "document.getElementById('joinOv').hidden")
    check(f'{tag}: joined on the server', srv.players.get(srv.uid, {}).get('name') == 'Pavel_HU' and srv.players[srv.uid]['country'] == 'HU', srv.players.get(srv.uid))
    wait(page, "/#\\d+|\\d+\\. hely/.test(document.getElementById('endRank').innerText) && !document.querySelector('#endRank [data-rjoin]')")
    shot('07-end-joined')
    page.click('#endRank [data-rsee]'); wait(page, "!document.getElementById('rankMeRow').hidden")
    me = page.evaluate("document.getElementById('rankMeRow').innerText")
    check(f'{tag}: me row shows you', 'Pavel_HU' in me, me)
    you = page.evaluate("document.querySelectorAll('#rankList .rank-row.you').length")
    check(f'{tag}: your row highlighted in the list (if in top 100)', you in (0, 1), you)
    shot('08-ranking-you')
    page.click('#rankClose'); page.wait_for_timeout(100)
    # 5. More: name line, leave (two taps)
    page.evaluate("document.getElementById('endOv').hidden = true; document.getElementById('pickbar').hidden = true"); page.click('#moreBtn'); wait(page, "!document.getElementById('rankMe').hidden")
    check(f'{tag}: More shows the ranking name', 'Pavel_HU' in page.evaluate("document.getElementById('rankMe').textContent"))
    shot('09-more')
    page.click('#rankMe'); wait(page, "!document.getElementById('joinOv').hidden")
    page.click('#joinLeave'); page.wait_for_timeout(100)
    check(f'{tag}: leave asks again', srv.uid in srv.players)
    page.click('#joinLeave'); page.wait_for_timeout(400)
    check(f'{tag}: leave deletes entry and scores', srv.uid not in srv.players and not any(s['user'] == srv.uid for s in srv.scores))
    if lang == 'hu':
        miss = page.evaluate("[...GI_I18N.misses || []].filter(m => /rank|ranking|guest|account|score|16 or older/i.test(m) && !/^Rival[0-9]+$/.test(m))")
        check(f'{tag}: no untranslated ranking strings', not miss, miss)
    check(f'{tag}: no page errors', not errs, errs)
    ctx.close()


def claim_flow(browser, base):
    print('\n[claim: guest win -> Create account -> score submitted]')
    ctx = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    srv = Server(); ctx.route(re.compile(r'https://[^/]+\.supabase\.co/.*'), srv.handler)
    page = ctx.new_page(); errs = []; page.on('pageerror', lambda e: errs.append(str(e)))
    page.goto(base + '/index.html?debug'); wait(page, "!!(window.__GI && !document.getElementById('authOv').hidden)")
    page.click('#authGuest'); page.wait_for_timeout(200)
    page.evaluate("document.getElementById('introOv').hidden = true; __GI.startGame('kestria'); __GI.setSpeed(0)")
    page.evaluate(WIN); wait(page, "!!document.querySelector('#endRank [data-racct]')")
    run = page.evaluate("__GI.S.tele.id")
    page.click('#endRank [data-racct]'); page.wait_for_timeout(200)
    check('claim: register form opens', page.is_visible('#authPw2'))
    page.fill('#authEmail', 'new@example.com'); page.fill('#authPw', 'abcdefg12'); page.fill('#authPw2', 'abcdefg12'); page.check('#authAge'); page.click('#authGo')
    wait(page, "!document.getElementById('endOv').hidden && !!document.querySelector('#endRank [data-rjoin]')")
    sub = [c for c in srv.calls if c[0] == 'gi_submit_score']
    check('claim: the guest win is submitted for the new account', len(sub) == 1 and sub[0][1]['p_run'] == run, sub)
    # v10.23: delete my account from More (Google Play requirement)
    page.evaluate("document.getElementById('endOv').hidden = true; document.getElementById('pickbar').hidden = true")
    page.click('#moreBtn'); page.click('#setOpen'); page.wait_for_timeout(200)   # v10.24: Menu -> Settings
    check('delete: Account section shows when logged in', page.is_visible('#acctSec') and page.is_visible('#delAcct'))
    page.click('#delAcct'); page.wait_for_timeout(100)
    check('delete: asks first, nothing sent yet', page.is_visible('#delAsk') and not getattr(srv, 'deleted', False))
    page.click('#delNo'); page.wait_for_timeout(100)
    check('delete: Cancel goes back', page.is_visible('#delAcct') and not getattr(srv, 'deleted', False))
    page.click('#delAcct'); page.click('#delYes'); wait(page, "!document.getElementById('authOv').hidden")
    check('delete: server function called with the login token, account removed', getattr(srv, 'deleted', False) and srv.uid not in srv.players)
    check('delete: signed out, back at the login screen, no saved session', page.evaluate("localStorage.getItem('gi.session')") is None and page.evaluate("__GI.S") is None)
    check('delete: no device copy of the game left', page.evaluate("localStorage.getItem('gi.cur')") is None)
    page.click('#authGuest'); page.wait_for_timeout(200); page.evaluate("document.getElementById('introOv').hidden = true"); page.click('#moreBtn'); page.wait_for_timeout(200)
    check('delete: guests have no Account section', not page.is_visible('#acctSec'))
    check('delete: Privacy policy entry is in More', page.is_visible('#privOpen'))
    check('claim: no page errors', not errs, errs)
    ctx.close()


def main():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(0.8)
        with sync_playwright() as p:
            b = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
            for device in ('phone', 'desktop'):
                for lang in ('en', 'hu'):
                    try: walk(b, f'http://127.0.0.1:{port}', device, lang)
                    except Exception as ex: check(f'{device}-{lang}: walkthrough ran', False, ex)
            try: claim_flow(b, f'http://127.0.0.1:{port}')
            except Exception as ex: check('claim flow ran', False, ex)
            b.close()
    finally:
        srv.terminate()
    bad = [n for n, ok in results if not ok]
    print(f'\n{len(results)} checks, {len(bad)} failed'); sys.exit(1 if bad else 0)


main()
