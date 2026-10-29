"""Telemetry tests (v10.18, v10.19 endgame fields): crash capture, run data, bug report, opt-out, missing tables.
Starts a local web server, drives index.html in Chromium (Playwright), and intercepts every call to *.supabase.co.
usage:  python3 tools/telemetry-test.py            (exit code 0 = all passed)
Needs Playwright for Python and Chromium; the browser path below is the one used in the handover."""
import json, os, re, subprocess, sys, time, socket, uuid
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CHROME = os.environ.get('GI_CHROME', '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
UUID_RE = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.I)
CORS = {'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, apikey, content-type, prefer, x-client-info', 'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS'}
USER_ID = str(uuid.uuid4())
EMAIL = 'tester.private@example.com'
results = []


def check(name, cond, extra=''):
    results.append((name, bool(cond)))
    print(('PASS  ' if cond else 'FAIL  ') + name + ((' -- ' + str(extra)) if (extra and not cond) else ''))


class Mock:
    """Fake Supabase. mode[table] = 'ok' | 404 | 400 | 'abort'. Records every POST to /rest/v1/gi_*."""
    def __init__(self):
        self.reqs = []
        self.mode = {}
        self.default = 'ok'
        self.other = []   # any other supabase call (auth, saves)

    def handler(self, route, request):
        u = request.url
        if request.method == 'OPTIONS':
            return route.fulfill(status=204, headers=CORS)
        m = re.search(r'/rest/v1/(gi_\w+)', u)
        if m and request.method == 'POST':
            t = m.group(1)
            try:
                body = json.loads(request.post_data or 'null')
            except Exception:
                body = None
            self.reqs.append({'t': t, 'body': body, 'headers': request.headers, 'raw': request.post_data or ''})
            mode = self.mode.get(t, self.default)
            if mode == 'nocol':   # server without the v10.19 columns of gi_runs
                if any(isinstance(r, dict) and 'breakup_week' in r for r in (body or [])):
                    return route.fulfill(status=400, headers=dict(CORS, **{'content-type': 'application/json'}), body=json.dumps({'code': 'PGRST204', 'message': "Could not find the 'breakup_week' column"}))
                mode = 'ok'
            if mode == 'ok':
                return route.fulfill(status=201, headers=CORS, body='')
            if mode == 'abort':
                return route.abort()
            code = {404: 'PGRST205', 400: '23514'}.get(mode, '')
            return route.fulfill(status=int(mode), headers=dict(CORS, **{'content-type': 'application/json'}), body=json.dumps({'code': code, 'message': 'mock'}))
        self.other.append((request.method, u))
        if '/auth/v1/settings' in u:
            return route.fulfill(status=200, headers=dict(CORS, **{'content-type': 'application/json'}), body='{}')
        if '/auth/v1/token' in u:
            return route.fulfill(status=200, headers=dict(CORS, **{'content-type': 'application/json'}),
                                 body=json.dumps({'access_token': 'mock-access-token', 'refresh_token': 'r', 'expires_in': 3600, 'user': {'id': USER_ID, 'email': EMAIL}}))
        if '/rest/v1/saves' in u:
            return route.fulfill(status=200 if request.method == 'GET' else 201, headers=dict(CORS, **{'content-type': 'application/json'}), body='[]' if request.method == 'GET' else '')
        return route.fulfill(status=200, headers=CORS, body='{}')

    def of(self, t, event=None):
        out = []
        for r in self.reqs:
            if r['t'] != t or not isinstance(r['body'], list):
                continue
            for row in r['body']:
                if event is None or row.get('event') == event:
                    out.append(row)
        return out

    def count(self, t=None):
        return len([r for r in self.reqs if t is None or r['t'] == t])


def wait(page, expr, timeout=20000):
    """Poll a JS expression with page.evaluate (wait_for_function can trip over the page's CSP)."""
    end = time.time() + timeout / 1000.0
    while time.time() < end:
        if page.evaluate("() => !!(" + expr + ")"):
            return
        page.wait_for_timeout(100)
    raise TimeoutError('timed out waiting for: ' + expr)


def free_port():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); p = s.getsockname()[1]; s.close(); return p


def open_game(browser, mock, base, query='?debug', ctx=None, keep_intro=False):
    ctx = ctx or browser.new_context(viewport={'width': 1100, 'height': 760})
    ctx.route(re.compile(r'https://[^/]+\.supabase\.co/.*'), mock.handler)
    page = ctx.new_page()
    errors, consoles = [], []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: consoles.append((m.type, m.text, (m.location or {}).get('url', ''))))
    page.goto(base + '/index.html' + query)
    wait(page, "window.__GI && window.GITele && !document.getElementById('authOv').hidden", 20000)
    page.click('#authGuest')
    if not keep_intro:
        page.evaluate("document.getElementById('introOv').hidden = true")
    page.errors, page.consoles = errors, consoles
    return page


def start(page, country='isolde'):
    page.evaluate("document.getElementById('endOv').hidden = true")   # the picker normally closes the end screen first
    page.evaluate("(c) => __GI.startGame(c)", country)
    page.evaluate("__GI.setSpeed(0)")


def flush(page):
    page.evaluate("GITele.flush({ force: true })")
    page.wait_for_timeout(250)


def force_win(page):
    page.evaluate("""() => { const s = __GI.S; COUNTRIES.forEach(c => { s.inf[c.id] = 100; }); for (let i = 0; i < 6 && !s.over; i++) step(s); __GI.render(); }""")


def force_loss(page):
    page.evaluate("""() => { const s = __GI.S; s.week = Math.max(s.week, 5); COUNTRIES.forEach(c => { s.inf[c.id] = 0; }); for (let i = 0; i < 6 && !s.over; i++) step(s); __GI.render(); }""")


def run_all():
    port = free_port()
    server = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    base = 'http://127.0.0.1:%d' % port
    time.sleep(1.0)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
            t_errors(browser, base)
            t_runs(browser, base)
            t_abandoned(browser, base)
            t_pagehide(browser, base)
            t_optout(browser, base)
            t_report(browser, base)
            t_userid(browser, base)
            t_missing(browser, base)
            t_offline_cap(browser, base)
            browser.close()
    finally:
        server.terminate()
    bad = [n for n, ok in results if not ok]
    print('\n%d checks, %d failed' % (len(results), len(bad)))
    return 1 if bad else 0


# ---------------------------------------------------------------- crashes
def t_errors(browser, base):
    print('\n[crashes]')
    mock = Mock(); page = open_game(browser, mock, base)
    page.evaluate("setTimeout(() => { throw new Error('boom-test') }, 0)")
    page.wait_for_timeout(300)
    flush(page)
    rows = mock.of('gi_errors')
    check('forced error: exactly one POST to gi_errors', mock.count('gi_errors') == 1 and len(rows) == 1, (mock.count('gi_errors'), len(rows)))
    r = rows[0] if rows else {}
    check('error row: message, src, version, channel', r.get('message') == 'boom-test' and r.get('src') == 'onerror' and r.get('version') == '10.25' and r.get('channel') == 'dev', r)
    check('error row: stack, ua, screen, lang', bool(r.get('stack')) and 'Mozilla' in (r.get('ua') or '') and re.match(r'^\d+x\d+$', r.get('screen') or '') and r.get('lang') == 'en', r)
    check('error row: anon_id and id are uuids, user_id null', UUID_RE.match(r.get('anon_id', '')) and UUID_RE.match(r.get('id', '')) and r.get('user_id') is None, r)
    check('error row: no game yet -> level/start/week null', r.get('level') is None and r.get('start_country') is None and r.get('week') is None, r)
    check('error request: apikey header, no Authorization (anonymous)', mock.reqs[0]['headers'].get('apikey', '').startswith('sb_publishable_') and 'authorization' not in mock.reqs[0]['headers'])
    check('anon id stored at gi.anon and equals the one sent', page.evaluate("localStorage.getItem('gi.anon')") == r.get('anon_id'))
    # same message again: skipped. A game error carries level, start country and week.
    start(page); page.evaluate("step(__GI.S); step(__GI.S)")
    page.evaluate("setTimeout(() => { throw new Error('boom-test') }, 0)")
    page.evaluate("setTimeout(() => { Promise.reject(new Error('rejected-test')) }, 0)")
    page.wait_for_timeout(300); flush(page)
    msgs = [x['message'] for x in mock.of('gi_errors')]
    check('same message skipped within the session', msgs.count('boom-test') == 1, msgs)
    rej = [x for x in mock.of('gi_errors') if x['message'] == 'rejected-test']
    check('unhandledrejection captured with game context', len(rej) == 1 and rej[0]['src'] == 'unhandledrejection' and rej[0]['start_country'] == 'isolde' and rej[0]['level'] and rej[0]['week'] == 2, rej)
    # at most 20 per session
    page.evaluate("for (let i = 0; i < 40; i++) GITele.error('test', new Error('flood ' + i))")
    flush(page)
    check('max 20 errors per session', len(mock.of('gi_errors')) == 20, len(mock.of('gi_errors')))
    # an exception inside the main loop is reported and does not stop the loop
    page2 = open_game(browser, Mock(), base)
    m2 = Mock(); page3 = open_game(browser, m2, base)
    start(page3)
    page3.evaluate("""() => { window.__orig = window.GITele.tick; let n = 0; window.GITele.tick = function (s) { if (n++ < 3) throw new Error('loop-test'); return window.__orig(s); }; __GI.setSpeed(3); }""")
    page3.wait_for_timeout(2500)
    wk = page3.evaluate("__GI.S.week")
    flush(page3)
    le = [x for x in m2.of('gi_errors') if x['message'] == 'loop-test']
    check('loop exception: reported once as src=loop, game keeps running', len(le) == 1 and le[0]['src'] == 'loop' and wk >= 1, (le, wk))
    check('no email or password-like field in any error payload', 'email' not in ''.join(r['raw'] for r in mock.reqs).lower())
    page.context.close(); page2.context.close(); page3.context.close()


# ---------------------------------------------------------------- runs
def t_runs(browser, base):
    print('\n[runs]')
    mock = Mock(); page = open_game(browser, mock, base)
    start(page)
    # buy two upgrades in order so the doctrine path is recorded
    got = page.evaluate("""() => { const s = __GI.S; s.clout = 500; const ids = UPGRADES.filter(u => u.tier === 0).slice(0, 2).map(u => u.id); ids.forEach(id => buyUpgrade(s, id)); __GI.render(); return ids; }""")
    flush(page)
    st = mock.of('gi_runs', 'run_start')
    check('run_start posted when a game starts', len(st) == 1 and st[0]['start_country'] == 'isolde' and st[0]['level'] and st[0]['lang'] == 'en' and st[0]['seed'] is not None, st)
    rid = st[0]['run_id'] if st else None
    check('run_start: run_id uuid, version, channel, no outcome', st and UUID_RE.match(rid) and st[0]['version'] == '10.25' and st[0]['outcome'] is None and st[0]['weeks'] == 0, st)
    force_win(page)
    flush(page)
    en = mock.of('gi_runs', 'run_end')
    check('win: run_end posted once', len(en) == 1, len(en))
    e = en[0] if en else {}
    check('win: same run_id, outcome win/collapse/perfect', e.get('run_id') == rid and e.get('outcome') in ('win', 'collapse', 'perfect'), e)
    check('win: weeks, stars, score, held, peak share, notoriety fields', e.get('weeks', 0) >= 1 and e.get('stars') >= 1 and e.get('score') is not None and e.get('held') >= 1 and 0 < e.get('peak_share', 0) <= 1 and e.get('avg_noto') is not None and e.get('peak_noto') is not None, e)
    check('win: uprisings/coups/relocations/used_continue/session_min present', all(k in e for k in ('uprisings', 'coups', 'relocations', 'used_continue', 'session_min')) and e['used_continue'] is False, e)
    check('win: upgrades in the order bought', e.get('upgrades') == got, (e.get('upgrades'), got))
    check('v10.19: breakup_week / cap_auto / cap_terms / win_type on run_end', all(k in e for k in ('breakup_week', 'cap_auto', 'cap_terms', 'win_type', 'cap_ultimatum', 'gc_size', 'gc_broke_week')) and e.get('win_type') in ('held', 'share'), e)
    check('v10.19: run_start sends the new fields as null', all(k in st[0] and st[0][k] is None for k in ('breakup_week', 'cap_auto', 'cap_terms', 'win_type', 'cap_ultimatum', 'gc_size', 'gc_broke_week')), st)
    # continue playing -> run_continue, then the run ends again with run_final
    page.evaluate("document.getElementById('contPlay') && !document.getElementById('contPlay').hidden && document.getElementById('contPlay').click()")
    page.wait_for_timeout(200); flush(page)
    cn = mock.of('gi_runs', 'run_continue')
    check('Continue playing: run_continue posted with used_continue true', len(cn) == 1 and cn[0]['run_id'] == rid and cn[0]['used_continue'] is True, cn)
    page.evaluate("""() => { const s = __GI.S; s.week += 3; endEarly(s); __GI.render(); }""")
    flush(page)
    fi = mock.of('gi_runs', 'run_final')
    check('after Continue: run_final posted, run_end not repeated', len(fi) == 1 and fi[0]['run_id'] == rid and len(mock.of('gi_runs', 'run_end')) == 1, fi)
    # a loss
    start(page, 'bharat')
    check('second run gets a new run_id', page.evaluate("__GI.S.tele.id") != rid)
    force_loss(page)
    flush(page)
    runs = mock.of('gi_runs')
    loss = [x for x in runs if x['event'] == 'run_end' and x['outcome'] not in ('win', 'collapse', 'perfect', None) and x['start_country'] == 'bharat']
    check('loss: run_start + run_end posted, outcome is a loss cause', len([x for x in runs if x['event'] == 'run_start']) == 2 and len(loss) == 1 and loss[0]['stars'] == 0, [(x['event'], x['outcome']) for x in runs])
    check('loss outcome is one of the known causes', loss and loss[0]['outcome'] in ('extinct', 'treaty', 'coup', 'baseLost'), loss)
    check('no email in run payloads', 'email' not in ''.join(r['raw'] for r in mock.reqs).lower())
    page.context.close()


def t_abandoned(browser, base):
    print('\n[abandoned]')
    mock = Mock(); page = open_game(browser, mock, base)
    start(page); page.evaluate("for (let i = 0; i < 12; i++) step(__GI.S); __GI.render()")
    flush(page)
    rid = mock.of('gi_runs', 'run_start')[0]['run_id']
    page.click('#moreBtn'); page.click('#quitGame'); page.click('#quitYes')
    page.wait_for_timeout(200); flush(page)
    ab = [x for x in mock.of('gi_runs', 'run_end') if x['outcome'] == 'abandoned']
    check('New game mid-run sends abandoned (reason new_game, same run_id, weeks)', len(ab) == 1 and ab[0]['run_id'] == rid and ab[0]['reason'] == 'new_game' and ab[0]['weeks'] == 12, ab)
    # a finished game followed by New game must not send abandoned
    start(page); force_win(page); flush(page)
    page.click('#again'); page.wait_for_timeout(200); flush(page)
    ab2 = [x for x in mock.of('gi_runs', 'run_end') if x['outcome'] == 'abandoned']
    check('New game after a finished run does not send abandoned', len(ab2) == 1, len(ab2))
    # starting a game over a running one (replace)
    start(page); start(page, 'bharat'); flush(page)
    ab3 = [x for x in mock.of('gi_runs', 'run_end') if x['outcome'] == 'abandoned' and x['reason'] == 'replaced']
    check('a game replaced by another start sends abandoned (replaced)', len(ab3) == 1, ab3)
    page.context.close()


def t_pagehide(browser, base):
    print('\n[page close]')
    mock = Mock(); mock.mode['gi_runs'] = 'abort'
    ctx = browser.new_context(viewport={'width': 1100, 'height': 760})
    page = open_game(browser, mock, base, ctx=ctx)
    start(page); page.evaluate("for (let i = 0; i < 7; i++) step(__GI.S); __GI.render()")
    page.evaluate("window.dispatchEvent(new Event('pagehide'))")
    page.wait_for_timeout(300)
    q = json.loads(page.evaluate("localStorage.getItem('gi.tele.q')") or '[]')
    ab = [i['r'] for i in q if i['t'] == 'gi_runs' and i['r'].get('outcome') == 'abandoned']
    check('pagehide mid-run queues abandoned (page_closed) in localStorage', len(ab) == 1 and ab[0]['reason'] == 'page_closed' and ab[0]['weeks'] == 7, ab)
    page.evaluate("window.dispatchEvent(new Event('pagehide'))"); page.wait_for_timeout(200)
    q = json.loads(page.evaluate("localStorage.getItem('gi.tele.q')") or '[]')
    check('a second pagehide in the same week does not duplicate it', len([i for i in q if i['r'].get('outcome') == 'abandoned']) == 1)
    page.close()
    # next load flushes it
    mock.mode['gi_runs'] = 'ok'; before = mock.count('gi_runs')
    page2 = open_game(browser, mock, base, ctx=ctx)
    page2.wait_for_timeout(3500)
    sent = [x for x in mock.of('gi_runs') if x.get('outcome') == 'abandoned']
    check('queued abandoned is flushed on the next load', len(sent) >= 1 and sent[-1]['reason'] == 'page_closed', (mock.count('gi_runs') - before))
    check('queue is empty after the flush', page2.evaluate("GITele.info().queue") == 0)
    ctx.close()


def t_optout(browser, base):
    print('\n[opt-out]')
    mock = Mock(); page = open_game(browser, mock, base, keep_intro=True)
    txt = page.inner_text('#introSheet')
    check('intro tells the player that anonymous gameplay data is collected', 'Anonymous gameplay data is collected' in page.evaluate("document.querySelector('.tele-note').textContent"), '')
    page.evaluate("document.getElementById('introOv').hidden = true")
    page.click('#moreBtn'); page.click('#setOpen')   # v10.24: Menu -> Settings
    check('Settings has the switch, default ON', page.is_checked('#setTele') and page.evaluate("GITele.runsOn()"))
    page.click('#setTele')
    check('switch OFF stores gi.tele=0', page.evaluate("localStorage.getItem('gi.tele')") == '0' and page.evaluate("GITele.runsOn()") is False)
    page.click('#setClose')
    start(page); force_win(page); page.click('#again'); start(page, 'bharat'); page.evaluate("for (let i = 0; i < 3; i++) step(__GI.S)")
    page.click('#moreBtn'); page.click('#quitGame'); page.click('#quitYes')
    page.evaluate("setTimeout(() => { throw new Error('optout-error') }, 0)")
    page.wait_for_timeout(300); flush(page)
    check('opted out: no run events at all (start, end, abandoned)', mock.count('gi_runs') == 0, mock.of('gi_runs'))
    check('opted out: errors still sent', any(x['message'] == 'optout-error' for x in mock.of('gi_errors')))
    start(page)
    page.click('#moreBtn'); page.click('#reportOpen')
    page.fill('#reportText', 'opted-out report'); page.click('#reportSend'); page.wait_for_timeout(500)
    check('opted out: bug reports still sent', any(x['report'] == 'opted-out report' for x in mock.of('gi_reports')))
    page.reload(); wait(page, "window.__GI && !document.getElementById('authOv').hidden")
    page.click('#authGuest'); page.wait_for_timeout(300)
    if page.is_visible('#resumeOv'): page.click('#resumeNew')   # v10.23: the running game left a device copy; this test wants a clean board
    page.evaluate("document.getElementById('introOv').hidden = true"); page.click('#moreBtn'); page.click('#setOpen')
    check('the switch stays OFF after a reload', not page.is_checked('#setTele'))
    page.click('#setTele')
    check('switch back ON', page.evaluate("GITele.runsOn()") is True)
    page.context.close()


def t_report(browser, base):
    print('\n[bug report]')
    mock = Mock(); page = open_game(browser, mock, base)
    start(page); page.evaluate("for (let i = 0; i < 9; i++) step(__GI.S); __GI.S.clout = 77; __GI.render()")
    orig = page.evaluate("({ week: __GI.S.week, seed: __GI.S.seed, start: __GI.S.startId, clout: __GI.S.clout, owned: __GI.S.owned, size: JSON.stringify({ S: __GI.S }).length })")
    check('state size is far below the 200 KB table limit', orig['size'] < 120000, orig['size'])
    page.click('#moreBtn'); page.click('#reportOpen')
    check('Report a bug opens from More', page.is_visible('#reportOv') and page.is_disabled('#reportSend'))
    page.fill('#reportText', 'The map froze after I bought Pamphlets. ' + 'x' * 10)
    page.fill('#reportContact', 'discord: tester#1234')
    page.click('#reportSend'); page.wait_for_timeout(500)
    check('report: success message shown', 'was sent' in page.inner_text('#reportMsg'), page.inner_text('#reportMsg'))
    rows = mock.of('gi_reports')
    check('report: exactly one POST to gi_reports', mock.count('gi_reports') == 1 and len(rows) == 1)
    r = rows[0] if rows else {}
    check('report: text, contact, source, seed, week, level, start, lang, ua, screen', r.get('report', '').startswith('The map froze') and r.get('contact') == 'discord: tester#1234' and r.get('source') == 'more'
          and r.get('seed') == orig['seed'] and r.get('week') == 9 and r.get('level') and r.get('start_country') == 'isolde' and r.get('lang') == 'en' and 'Mozilla' in r.get('ua', '') and r.get('screen'), r)
    st = r.get('state') or {}
    check('report: state snapshot attached (same shape as a save)', st.get('fmt') == 1 and st.get('S', {}).get('week') == 9 and st['S'].get('seed') == orig['seed'] and r.get('state_trim') == 'none', list(st.keys()))
    # reverse path: loadReport restores the reported game in a fresh page
    m2 = Mock(); p2 = open_game(browser, m2, base)
    res = p2.evaluate("(j) => __GI.loadReport(j)", json.dumps(r))
    check('loadReport restores the reported state', res.get('ok') and p2.evaluate("({ week: __GI.S.week, seed: __GI.S.seed, start: __GI.S.startId, clout: __GI.S.clout, owned: __GI.S.owned })") == {'week': orig['week'], 'seed': orig['seed'], 'start': orig['start'], 'clout': orig['clout'], 'owned': orig['owned']}, res)
    p2.evaluate("__GI.setSpeed(3)"); p2.wait_for_timeout(1500)
    check('restored game runs on', p2.evaluate("__GI.S.week") > orig['week'])
    p2.evaluate("setTimeout(() => {}, 0)"); flush(p2)
    check('a replayed report sends no run events', m2.count('gi_runs') == 0, m2.of('gi_runs'))
    bad = p2.evaluate("__GI.loadReport('{\"nope\":1}')")
    check('loadReport rejects things that are not a state', bad.get('ok') is False)
    # loadReport exists in debug only
    m3 = Mock(); p3 = open_game(browser, m3, base, query='')
    check('loadReport is not exposed without ?debug', p3.evaluate("typeof __GI.loadReport") == 'undefined')
    # the end screen has the button too
    page.click('#reportCancel')
    start(page); force_win(page)
    page.click('#reportEnd'); page.fill('#reportText', 'end screen report'); page.click('#reportSend'); page.wait_for_timeout(500)
    er = [x for x in mock.of('gi_reports') if x['report'] == 'end screen report']
    check('Report a bug on the end screen sends source=end', len(er) == 1 and er[0]['source'] == 'end', er)
    # empty text refused, long text limited
    page.fill('#reportText', ''); check('empty report cannot be sent', page.is_disabled('#reportSend'))
    page.fill('#reportText', 'y' * 2500)
    check('text field limited to 2000 characters', page.evaluate("document.getElementById('reportText').value.length") == 2000)
    page.context.close(); p2.context.close(); p3.context.close()
    # big state is trimmed to fit
    m4 = Mock(); p4 = open_game(browser, m4, base); start(p4)
    p4.evaluate("""() => { const s = __GI.S; for (let i = 0; i < 4000; i++) s.news.push({ w: i, text: 'filler news line number ' + i + ' with some more text to make it big', k: 'wo' }); }""")
    p4.click('#moreBtn'); p4.click('#reportOpen'); p4.fill('#reportText', 'big state'); p4.click('#reportSend'); p4.wait_for_timeout(600)
    br = m4.of('gi_reports')
    check('an oversized state is trimmed (state_trim=news) and still sent', len(br) == 1 and br[0]['state_trim'] == 'news' and len(json.dumps(br[0]['state'])) < 120000, [(x['state_trim']) for x in br])
    p4.context.close()


def t_userid(browser, base):
    print('\n[logged-in player]')
    mock = Mock(); ctx = browser.new_context(viewport={'width': 1100, 'height': 760})
    ctx.route(re.compile(r'https://[^/]+\.supabase\.co/.*'), mock.handler)
    page = ctx.new_page()
    page.goto(base + '/index.html?debug')
    wait(page, "window.__GI && !document.getElementById('authOv').hidden", 20000)
    page.fill('#authEmail', EMAIL); page.fill('#authPw', 'Passw0rd123'); page.click('#authGo')
    wait(page, "!document.getElementById('introOv').hidden || !document.getElementById('resumeOv').hidden", 10000)
    page.evaluate("document.getElementById('introOv').hidden = true")
    start(page); page.evaluate("for (let i = 0; i < 4; i++) step(__GI.S)")
    page.evaluate("setTimeout(() => { throw new Error('user-error') }, 0)"); page.wait_for_timeout(300)
    page.click('#moreBtn'); page.click('#quitGame'); page.click('#quitYes'); page.wait_for_timeout(200)
    flush(page)
    rr = [r for r in mock.reqs if r['t'] in ('gi_runs', 'gi_errors')]
    check('signed in: rows carry the user_id', rr and all(all(row.get('user_id') == USER_ID for row in r['body']) for r in rr), [(r['t'], [x.get('user_id') for x in r['body']]) for r in rr])
    check('signed in: request uses the player token', all(r['headers'].get('authorization') == 'Bearer mock-access-token' for r in rr), [r['headers'].get('authorization') for r in rr])
    check('the email address is never sent to a telemetry table', EMAIL.lower() not in ''.join(r['raw'] for r in mock.reqs).lower())
    ctx.close()


def t_missing(browser, base):
    print('\n[old gi_runs columns]')
    mock = Mock(); mock.mode['gi_runs'] = 'nocol'
    page = open_game(browser, mock, base)
    start(page); force_win(page); flush(page); flush(page)
    ok_rows = [r for r in mock.reqs if r['t'] == 'gi_runs' and isinstance(r['body'], list) and not any('breakup_week' in x for x in r['body'])]
    ends = [x for r in ok_rows for x in r['body'] if x.get('event') == 'run_end']
    check('server without v10.19 columns: rows resent without them, run_end arrives', len(ends) == 1 and ends[0].get('outcome') == 'win', [(r['t'], len(r['body'])) for r in mock.reqs])
    check('server without v10.19 columns: run data not switched off', page.evaluate("!(JSON.parse(localStorage.getItem('gi.tele.dead') || '{}').gi_runs > Date.now())"))
    page.context.close()
    print('\n[missing tables]')
    mock = Mock(); mock.default = 404
    ctx = browser.new_context(viewport={'width': 1100, 'height': 760})
    page = open_game(browser, mock, base, ctx=ctx)
    start(page); page.evaluate("for (let i = 0; i < 5; i++) step(__GI.S)")
    for i in range(4):
        page.evaluate("(i) => GITele.error('test', new Error('missing-table-error ' + i))", i)
    page.click('#moreBtn'); page.click('#reportOpen'); page.fill('#reportText', 'report while tables are missing'); page.click('#reportSend'); page.wait_for_timeout(500)
    for _ in range(5):
        flush(page)
    page.click('#reportCancel')
    force_win(page); flush(page)
    page.evaluate("setTimeout(() => { throw new Error('later error') }, 0)"); page.wait_for_timeout(300)
    for _ in range(3):
        flush(page)
    per = {t: mock.count(t) for t in ('gi_errors', 'gi_runs', 'gi_reports')}
    check('404: one request per table, then silence (no retry loop)', all(v <= 1 for v in per.values()) and sum(per.values()) >= 2, per)
    check('404: items for the missing tables were dropped', sorted(set(i['t'] for i in json.loads(page.evaluate("localStorage.getItem('gi.tele.q')") or '[]')) - {'gi_reports'}) == [], page.evaluate("GITele.queue()"))
    check('404: the bug report stays queued and the player is told so', 'saved on this device' in page.inner_text('#reportMsg') or page.evaluate("GITele.queue().some(i => i.t === 'gi_reports')"), page.inner_text('#reportMsg'))
    check('404: tables marked off, remembered across reloads', len(page.evaluate("GITele.info().off")) >= 2 and 'gi_errors' in page.evaluate("localStorage.getItem('gi.tele.dead')"))
    page.reload(); wait(page, "window.GITele && !document.getElementById('authOv').hidden")
    page.wait_for_timeout(3500)
    per2 = {t: mock.count(t) for t in ('gi_errors', 'gi_runs', 'gi_reports')}
    check('404: a reload does not retry the missing tables', per2 == per, (per, per2))
    game_msgs = [c for c in page.consoles if c[0] in ('error', 'warning') and 'supabase' not in c[2] and 'favicon' not in c[2] and 'Failed to load resource' not in c[1]]
    net404 = [c for c in page.consoles if 'Failed to load resource' in c[1] and 'gi_' in c[2]]
    check('404: no console output from the game, at most one browser network line per table', not game_msgs and len(net404) <= 3, (game_msgs, len(net404)))
    check('404: no uncaught page errors except the forced one', len([e for e in page.errors if 'later error' not in e]) == 0, page.errors)
    ctx.close()
    # 400 (a constraint rejects the batch): split once, bad items dropped, no loop
    mock = Mock(); mock.mode['gi_errors'] = 400
    page = open_game(browser, mock, base)
    for i in range(3):
        page.evaluate("(i) => GITele.error('test', new Error('bad-row ' + i))", i)
    for _ in range(4):
        flush(page)
    check('400: one batch, then each item once, then nothing (4 requests)', mock.count('gi_errors') == 4, mock.count('gi_errors'))
    check('400: queue empty afterwards', page.evaluate("GITele.info().queue") == 0)
    page.context.close()
    # 500 / offline: items kept, backoff stops the retries
    mock = Mock(); mock.mode['gi_errors'] = 500
    page = open_game(browser, mock, base)
    page.evaluate("GITele.error('test', new Error('server-trouble'))")
    page.evaluate("GITele.flush({ force: true })"); page.wait_for_timeout(300)
    n1 = mock.count('gi_errors')
    for _ in range(5):
        page.evaluate("GITele.flush()")      # not forced: backoff holds
    page.wait_for_timeout(300)
    check('5xx: item kept in the queue and retries wait for the backoff', page.evaluate("GITele.info().queue") == 1 and mock.count('gi_errors') == n1 == 1, (n1, mock.count('gi_errors')))
    mock.mode['gi_errors'] = 'ok'
    page.evaluate("GITele.flush({ force: true })"); page.wait_for_timeout(300)
    check('5xx: delivered once the server is back', page.evaluate("GITele.info().queue") == 0 and any(x['message'] == 'server-trouble' for x in mock.of('gi_errors')))
    page.context.close()


def t_offline_cap(browser, base):
    print('\n[queue]')
    mock = Mock(); mock.default = 'abort'
    page = open_game(browser, mock, base)
    page.evaluate("""() => { for (let i = 0; i < 70; i++) { const s = { startId: 'isolde', seed: i, week: 0, cfg: { level: 'casual' }, owned: [] }; GITele.runStart(s); } }""")
    n = page.evaluate("GITele.info().queue"); stored = len(json.loads(page.evaluate("localStorage.getItem('gi.tele.q')") or '[]'))
    check('queue capped at 50 items (memory and localStorage)', n == 50 and stored == 50, (n, stored))
    page.evaluate("GITele.flush({ force: true })"); page.wait_for_timeout(300)
    check('offline: queue kept after a failed send', page.evaluate("GITele.info().queue") == 50 and 'offline' in page.evaluate("GITele.info().last"))
    check('debug line shows queue length and last result', 'queue=50' in page.inner_text('#teleDbg') and 'offline' in page.inner_text('#teleDbg'), page.inner_text('#teleDbg'))
    page.context.close()


if __name__ == '__main__':
    sys.exit(run_all())
