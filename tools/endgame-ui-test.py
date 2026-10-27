"""Step 9.1 browser walkthrough (v10.19): phone + desktop, EN + HU. Forces a game through __GI to just before the Breakup, then
Breakup alert + briefing -> a country capitulates by itself -> Terms on another -> win popup -> Continue -> End game.
usage: python3 tools/endgame-ui-test.py [shots_dir]     (exit code 0 = all passed; screenshots per step)"""
import os, re, sys, subprocess, socket, time
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CHROME = os.environ.get('GI_CHROME', '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'shots')
os.makedirs(OUT, exist_ok=True)
results = []


def check(name, cond, extra=''):
    results.append((name, bool(cond)))
    print(('PASS  ' if cond else 'FAIL  ') + name + ((' -- ' + str(extra)) if (extra and not cond) else ''))


def free_port():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); p = s.getsockname()[1]; s.close(); return p


SETUP = """() => {
  const S = __GI.S; __GI.setSpeed(0);
  S.notoriety = 30; for (let i = 0; i < 3 && !S.coalition; i++) step(S);
  const low = ['sinopeia', 'juche', 'bharat'];
  COUNTRIES.forEach(c => { S.inf[c.id] = low.includes(c.id) ? 30 : 70; });
  S.wo.signed = {}; S.wo.queue = []; S.wo.court = []; S.wo.hopeless = 25; S.legit = 90; S.wary = S.wary || {};
  S.owned.push('d1', 'd2'); S.clout = 200; S.acd = {}; S.pending = null;
  __GI.render(); return { coalition: S.coalition, hopeless: S.wo.hopeless };
}"""


def close_coach(page):
    # phones page through the card: press Next until "Got it" shows, like a player would
    for _ in range(8):
        if page.evaluate("document.getElementById('coachOv').hidden"): return
        if page.is_visible('#coachClose'): page.click('#coachClose'); page.wait_for_timeout(150); return
        page.click('#coachSheet [data-pnext]'); page.wait_for_timeout(120)


def walk(browser, base, device, lang):
    tag = f'{device}-{lang}'
    print(f'\n[{tag}]')
    if device == 'phone':
        ctx = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    else:
        ctx = browser.new_context(viewport={'width': 1280, 'height': 800})
    CORS = {'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, apikey, content-type, prefer, x-client-info', 'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS', 'content-type': 'application/json'}
    ctx.route(re.compile(r'https://[^/]+\.supabase\.co/.*'), lambda r: r.fulfill(status=204 if r.request.method == 'OPTIONS' else 201 if '/rest/v1/gi_' in r.request.url else 200, headers=CORS, body='' if r.request.method == 'OPTIONS' or '/rest/v1/gi_' in r.request.url else ('[]' if '/rest/v1/' in r.request.url else '{}')))
    page = ctx.new_page(); errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.goto(base + '/index.html?debug')
    end = time.time() + 20   # wait_for_function trips over the page's CSP: poll with evaluate
    while not page.evaluate("!!(window.__GI && !document.getElementById('authOv').hidden)"):
        if time.time() > end: raise RuntimeError('game did not load: ' + str(errs[:3]) + ' ' + str(page.evaluate("[typeof window.__GI, document.getElementById('authOv') && document.getElementById('authOv').hidden, location.href]")))
        page.wait_for_timeout(200)
    page.evaluate(f"GI_I18N.setLang('{lang}')")
    page.click('#authGuest')
    page.evaluate("document.getElementById('introOv').hidden = true; __GI.startGame('pannonia'); __GI.setSpeed(0)")
    shot = lambda n: page.screenshot(path=os.path.join(OUT, f'{tag}-{n}.png'))
    st = page.evaluate(SETUP)
    check(f'{tag}: WO running, treaty hopeless 25 wk', st['coalition'] and st['hopeless'] == 25, st)
    page.wait_for_timeout(200)
    for _ in range(3):   # setup holds 14 countries: the Overextension briefing opens first, as it would in play
        page.evaluate("__GI.render()"); page.wait_for_timeout(150); close_coach(page)
    shot('01-before-breakup')
    # Breakup
    page.evaluate("() => { step(__GI.S); __GI.render(); }"); page.wait_for_timeout(500)
    S = page.evaluate("() => ({ broken: __GI.S.broken, over: __GI.S.over, coach: !document.getElementById('coachOv').hidden, title: document.getElementById('coachTitle').textContent, alert: [...document.querySelectorAll('#alerts .alert')].map(a => a.textContent).join(' | '), q: !!document.querySelector('#alerts [data-ehelp]'), held: document.getElementById('heldVal').textContent, note: document.getElementById('treatyNote').textContent })")
    check(f'{tag}: Breakup happened, game goes on', S['broken'] and not S['over'], S)
    check(f'{tag}: briefing card opens', S['coach'] and S['title'] in ('The endgame', 'A végjáték'), S['title'])
    check(f'{tag}: critical alert with ?', S['q'], S['alert'])
    check(f'{tag}: HUD Held n / 16', ('/16' in S['held']), S['held'])
    shot('02-breakup-briefing')
    close_coach(page); page.wait_for_timeout(200)
    shot('03-breakup-alert')
    # rulebook page via the alert "?"
    if page.query_selector('#alerts [data-ehelp]'):
        page.click('#alerts [data-ehelp]'); page.wait_for_timeout(200)
        check(f'{tag}: "?" on the alert opens the endgame card', page.evaluate("!document.getElementById('coachOv').hidden"))
        close_coach(page)
    # dossier line on an eligible country
    page.evaluate("() => { const S = __GI.S; S.inf.kestria = 45; S.wary.kestria = 0; S.al = { list: [], next: 1 }; __gi.select('kestria'); __GI.render(); }")
    page.wait_for_timeout(200)
    if page.query_selector('#side [data-sec="status"]'):
        page.click('#side [data-sec="status"]'); page.wait_for_timeout(200)
    txt = page.evaluate("document.getElementById('side').innerText")
    check(f'{tag}: dossier shows "Capitulates in N wk"', ('Capitulates in' in txt) or ('Kapitulál' in txt and 'hét' in txt), txt[:300])
    shot('04-dossier-capitulates-in')
    # 6 weeks later it capitulates by itself
    page.evaluate("() => { const S = __GI.S; for (let i = 0; i < 6; i++) { S.inf.kestria = Math.min(S.inf.kestria, 45); S.wary.kestria = 0; step(S); } __GI.render(); }")
    page.wait_for_timeout(400)
    cap = page.evaluate("() => ({ v: __GI.S.inf.kestria, auto: (__GI.S.capit || {}).auto, alert: [...document.querySelectorAll('#alerts .alert')].map(a => a.textContent).join(' | ') })")
    check(f'{tag}: Kestria capitulated by itself', cap['v'] >= 90 and cap['auto'] == 1, cap)
    shot('05-capitulated-auto')
    # Terms on Tavaro through the dossier
    page.evaluate("() => { const S = __GI.S; S.inf.tavaro = 44; S.wary.tavaro = 0; S.acd = {}; S.clout = 200; __gi.select('tavaro'); __GI.render(); }")
    page.wait_for_timeout(200)
    back = page.query_selector('#side [data-sec] ~ * [data-aback], #side .secview [data-aback]')
    page.evaluate("() => { const b = document.querySelector('#side .sec-back, #side [data-secback]'); if (b) b.click(); }")
    page.click('#side [data-adom="dip"]'); page.wait_for_timeout(150)
    page.click('#side [data-aact="dip2"]'); page.wait_for_timeout(150)
    txt = page.evaluate("document.getElementById('side').innerText")
    check(f'{tag}: Summit detail shows the Terms line', ('Terms:' in txt) or ('Feltételek:' in txt), txt[:400])
    shot('06-terms-detail')
    page.click('#side [data-ago]'); page.wait_for_timeout(400)
    tr = page.evaluate("() => ({ v: __GI.S.inf.tavaro, terms: (__GI.S.capit || {}).terms })")
    check(f'{tag}: Terms capitulates Tavaro at once', tr['v'] >= 90 and tr['terms'] == 1, tr)
    shot('07-terms-done')
    # win: every country held
    page.evaluate("() => { const S = __GI.S; COUNTRIES.forEach(c => { S.inf[c.id] = Math.max(S.inf[c.id], 75); }); S.legit = 90; step(S); __GI.render(); }")
    page.wait_for_timeout(500)
    w = page.evaluate("() => ({ over: __GI.S.over, type: __GI.S.winType, end: !document.getElementById('endOv').hidden, title: document.getElementById('endTitle').textContent, text: document.getElementById('endText').textContent, cont: !document.getElementById('contPlay').hidden })")
    check(f'{tag}: win popup (all held)', w['over'] == 'win' and w['type'] == 'held' and w['end'] and w['cont'], w)
    if lang == 'hu':
        t = page.evaluate("document.getElementById('endText').textContent")
        check(f'{tag}: HU win text fully translated, in order', t.startswith('A(z)') and 'Notoriety' not in t and 'upgrades' not in t and 'Világrend' in t, t)
    shot('08-win-popup')
    page.click('#contPlay'); page.wait_for_timeout(400)
    c = page.evaluate("() => ({ over: __GI.S.over, cont: !!__GI.S.cont, note: document.getElementById('shareNote').textContent })")
    check(f'{tag}: Continue playing keeps going', c['over'] is None and c['cont'], c)
    page.evaluate("__GI.setSpeed(0)")
    shot('09-continued')
    page.click('#moreBtn'); page.wait_for_timeout(200)
    shot('10-more-rulebook-button')
    page.click('#endGame'); page.wait_for_timeout(150); page.click('#quitYes'); page.wait_for_timeout(500)
    e = page.evaluate("() => ({ over: __GI.S.over, win: runResult(__GI.S).win, end: !document.getElementById('endOv').hidden, title: document.getElementById('endTitle').textContent })")
    check(f'{tag}: End game after Continue = the earned win', e['over'] == 'win' and e['win'] and e['end'], e)
    shot('11-end-game')
    # rulebook page
    page.evaluate("document.getElementById('endOv').hidden = true")
    page.evaluate("document.getElementById('moreBtn').click()"); page.wait_for_timeout(150)
    page.click('#rulesEnd'); page.wait_for_timeout(200)
    rt = page.evaluate("document.getElementById('rulesTitle').textContent + ' :: ' + document.getElementById('rulesPages').innerText")
    check(f'{tag}: rulebook page "The endgame"', rt.startswith('The endgame') or rt.startswith('A végjáték'), rt[:120])
    shot('12-rulebook')
    if lang == 'hu':
        miss = page.evaluate("[...GI_I18N.misses || []].filter(m => /capitul|Capitul|Breakup|Terms|Held|endgame|broke up|breaks up/.test(m))")
        check(f'{tag}: no untranslated endgame strings', not miss, miss)
    check(f'{tag}: no page errors', not errs, errs)
    ctx.close()


def main():
    port = free_port()
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(0.8)
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
            for device in ('phone', 'desktop'):
                for lang in ('en', 'hu'):
                    try:
                        walk(browser, f'http://127.0.0.1:{port}', device, lang)
                    except Exception as ex:
                        check(f'{device}-{lang}: walkthrough ran', False, ex)
            browser.close()
    finally:
        srv.terminate()
    bad = [n for n, ok in results if not ok]
    print(f'\n{len(results)} checks, {len(bad)} failed')
    sys.exit(1 if bad else 0)


main()
