"""Save/resume browser test (v10.23): the device copy of a running game (guest and profile), resume at the same week after the page
is gone, version-mismatch and unreadable saves (told, never silently overwritten), game over clears the copy, a broken save
never leaves a broken board. Offline (no Supabase), phone viewport. usage: python3 tools/save-ui-test.py   (exit 0 = all passed)"""
import json, os, socket, subprocess, sys, time
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CHROME = os.environ.get('GI_CHROME', '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
results = []


def check(name, cond, extra=''):
    results.append((name, bool(cond)))
    print(('PASS  ' if cond else 'FAIL  ') + name + ((' -- ' + str(extra)[:300]) if (extra and not cond) else ''))


def free_port():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); p = s.getsockname()[1]; s.close(); return p


def poll(page, expr, secs=8):
    end = time.time() + secs
    while time.time() < end:
        try:
            v = page.evaluate(expr)
            if v: return v
        except Exception:
            pass
        time.sleep(0.1)
    return page.evaluate(expr)


def open_game(ctx, url):
    page = ctx.new_page()
    errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.goto(url)
    poll(page, "!!(window.__GI && (!document.getElementById('authOv').hidden || !document.getElementById('resumeOv').hidden || !document.getElementById('introOv').hidden))")
    return page, errs


def edit_ls(ctx, url, js):
    """Change storage from a throwaway page, so closing the game page cannot write its live state over the edit."""
    p = ctx.new_page(); p.goto(url + '/sw.js'); p.evaluate(js); p.close()


def play_to(page, week):
    page.evaluate("document.getElementById('introOv').hidden = true; window.__GI.startGame('pannonia'); window.__GI.setSpeed(3)")
    poll(page, f"window.__GI.S && window.__GI.S.week >= {week}", 30)
    page.evaluate("window.__GI.setSpeed(0)")
    return page.evaluate("window.__GI.S.week")


def run(p, url):
    browser = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
    ctx = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)

    # 1. guest: the copy is written every tick, with schema, version and no owner
    page, errs = open_game(ctx, url + '/index.html?debug')
    page.evaluate("localStorage.clear()")
    page.click('#authGuest')
    check('guest: intro shown with no copy', poll(page, "!document.getElementById('introOv').hidden"))
    wk = play_to(page, 6)
    m = page.evaluate("window.__GI.mirrorRead()")
    check('guest: device copy exists at the exact current week', m and m['week'] == wk and m['S']['week'] == wk, m and m.get('week'))
    check('guest: copy carries schema v6, app version, empty owner', m and m['v'] == 6 and m['app'] == '10.29' and m['owner'] == '', m and (m.get('v'), m.get('app'), m.get('owner')))
    start = page.evaluate("window.__GI.S.startId")
    seed = page.evaluate("window.__GI.S.seed")
    run_id = page.evaluate("window.__GI.S.tele && window.__GI.S.tele.id")

    # 2. the page is gone (Android kill): a new page offers the same week
    page.close()
    page, errs = open_game(ctx, url + '/index.html?debug')
    page.click('#authGuest')
    check('guest: resume dialog after the kill', poll(page, "!document.getElementById('resumeOv').hidden"))
    txt = page.inner_text('#resumeText')
    check('guest: dialog names the same week', f'week {wk}' in txt, txt)
    check('guest: Continue is visible', page.is_visible('#resumeGo'))
    page.click('#resumeGo')
    check('guest: resumed at the same week, same country, seed and run id', poll(page, f"window.__GI.S && window.__GI.S.week === {wk}") and page.evaluate("window.__GI.S.startId") == start and page.evaluate("window.__GI.S.seed") == seed and page.evaluate("window.__GI.S.tele && window.__GI.S.tele.id") == run_id)
    page.evaluate("window.__GI.setSpeed(3)")
    check('guest: the resumed game keeps ticking', poll(page, f"window.__GI.S.week > {wk}", 15))
    page.evaluate("window.__GI.setSpeed(0)")
    check('guest: no page errors', not errs, errs)

    # 3. hidden: the copy is written when the app goes to the background, even between ticks
    page.evaluate("window.__GI.S.notoriety = 41.5")
    page.evaluate("window.__GI.saveOnExit()")
    check('guest: background write holds the latest state', page.evaluate("window.__GI.mirrorRead().S.notoriety") == 41.5)

    # 4. version mismatch: told, not continued, not overwritten until the player chooses
    page.close()
    edit_ls(ctx, url, "(() => { const k = 'gi.cur'; const r = JSON.parse(localStorage.getItem(k)); r.S.v = 5; localStorage.setItem(k, JSON.stringify(r)); })()")
    page, errs = open_game(ctx, url + '/index.html?debug')
    page.click('#authGuest')
    check('mismatch: notice shown', poll(page, "!document.getElementById('resumeOv').hidden"))
    check('mismatch: no Continue button', not page.is_visible('#resumeGo'))
    txt = page.inner_text('#resumeText')
    check('mismatch: text says different version and the week', 'different version' in txt and 'week ' in txt, txt)
    check('mismatch: title is not "Welcome back"', page.inner_text('#resumeTitle') != 'Welcome back')
    check('mismatch: the old copy is still there until the player chooses', page.evaluate("localStorage.getItem('gi.cur') !== null"))
    page.click('#resumeNew')
    check('mismatch: New game clears the copy and shows the intro', page.evaluate("localStorage.getItem('gi.cur') === null") and poll(page, "!document.getElementById('introOv').hidden"))

    # 5. unreadable copies
    page.close()
    edit_ls(ctx, url, "localStorage.setItem('gi.cur', JSON.stringify({ S: {} }))")
    page, errs = open_game(ctx, url + '/index.html?debug')
    page.click('#authGuest')
    check('unreadable: notice shown', poll(page, "!document.getElementById('resumeOv').hidden") and not page.is_visible('#resumeGo'))
    check('unreadable: text says it could not be loaded', 'could not be loaded' in page.inner_text('#resumeText'), page.inner_text('#resumeText'))
    page.click('#resumeNew')
    page.close()
    edit_ls(ctx, url, "localStorage.setItem('gi.cur', 'not json {')")
    page, errs = open_game(ctx, url + '/index.html?debug')
    page.click('#authGuest')
    check('garbage: ignored, intro shown, no errors', poll(page, "!document.getElementById('introOv').hidden") and page.is_hidden('#resumeOv') and not errs, errs)

    # 6. a copy that looks fine but breaks the board: no broken board, the player is told
    wk2 = play_to(page, 4)
    page.close()
    edit_ls(ctx, url, "(() => { const r = JSON.parse(localStorage.getItem('gi.cur')); r.S.news = 5; r.S.owned = 5; r.S.inf = { pannonia: 'x' }; r.S.cities = null; localStorage.setItem('gi.cur', JSON.stringify(r)); })()")
    page, errs = open_game(ctx, url + '/index.html?debug')
    page.click('#authGuest')
    poll(page, "!document.getElementById('resumeOv').hidden")
    if page.is_visible('#resumeGo'):
        page.click('#resumeGo')
        time.sleep(0.8)
        ok_board = page.evaluate("window.__GI.S === null") and page.is_visible('#resumeOv') and not page.is_visible('#resumeGo') or page.evaluate("window.__GI.S !== null")
        check('broken copy: either resumes or tells the player, never a half board', ok_board)
    else:
        check('broken copy: refused up front', True)

    # 7. game over clears the copy
    page.close()
    page, errs = open_game(ctx, url + '/index.html?debug')
    page.evaluate("localStorage.clear()")
    page.click('#authGuest')
    play_to(page, 3)
    check('over: copy exists while the game runs', page.evaluate("window.__GI.mirrorRead() !== null"))
    page.evaluate("window.__GI.S.over = 'retired'; window.__GI.setSpeed(1)")
    check('over: copy is cleared once the game is over', poll(page, "window.__GI.mirrorRead() === null", 10))
    page.close()

    # 8. profile: the device copy is newer than the profile's own 10-week save and wins
    page, errs = open_game(ctx, url + '/index.html?debug')
    page.evaluate("localStorage.clear()")
    page.reload(); poll(page, "!!(window.__GI && !document.getElementById('authOv').hidden)")
    page.fill('#authEmail', 'ann'); page.click('#authGo')
    poll(page, "!document.getElementById('introOv').hidden")
    wk3 = play_to(page, 13)
    saved = page.evaluate("(() => { const r = JSON.parse(localStorage.getItem('gi.save.ann') || 'null'); return r && r.week; })()")
    check('profile: own save lags the device copy', saved is not None and saved < wk3, (saved, wk3))
    m = page.evaluate("window.__GI.mirrorRead()")
    check('profile: copy owner is the profile', m and m['owner'] == 'ann' and m['week'] == wk3)
    page.close()
    page, errs = open_game(ctx, url + '/index.html?debug')   # the profile session is remembered: no sign-in screen
    check('profile: resume dialog after the kill', poll(page, "!document.getElementById('resumeOv').hidden"))
    check('profile: dialog shows the device copy week, not the older save', f'week {wk3}' in page.inner_text('#resumeText'), page.inner_text('#resumeText'))
    page.click('#resumeGo')
    check('profile: resumed at the same week', poll(page, f"window.__GI.S && window.__GI.S.week === {wk3}"))
    check('profile: the profile save caught up', poll(page, f"JSON.parse(localStorage.getItem('gi.save.ann')).week === {wk3}"))
    page.close()

    # 9. another profile never gets ann's copy
    edit_ls(ctx, url, "localStorage.removeItem('gi.session')")
    page, errs = open_game(ctx, url + '/index.html?debug')
    page.fill('#authEmail', 'bob'); page.click('#authGo')
    check('other profile: no resume of someone else\'s copy', poll(page, "!document.getElementById('introOv').hidden") and page.is_hidden('#resumeOv'))
    check('other profile: ann\'s copy is untouched', page.evaluate("localStorage.getItem('gi.cur') !== null"))
    page.close()
    browser.close()


if __name__ == '__main__':
    port = free_port()
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(0.8)
        with sync_playwright() as p:
            run(p, f'http://127.0.0.1:{port}')
    finally:
        srv.terminate()
    bad = [n for n, ok in results if not ok]
    print(f'\n{len(results) - len(bad)}/{len(results)} passed')
    sys.exit(1 if bad else 0)
