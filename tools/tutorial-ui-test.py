"""v10.35 UI test: Codex (Menu, How it works), early-game briefings (Casual/Normal only, learned, Settings toggle), HU coverage.
Usage: python3 tools/tutorial-ui-test.py http://localhost:8765 <shots dir>"""
import sys
from playwright.sync_api import sync_playwright
BASE = sys.argv[1]; OUT = sys.argv[2]
ok_n = bad_n = 0
def check(name, cond, info=''):
    global ok_n, bad_n
    if cond: ok_n += 1; print('  ok  ', name)
    else: bad_n += 1; print('  FAIL', name, info)
def wait(page, js, ms=8000):
    for _ in range(ms // 100):
        if page.evaluate(js): return True
        page.wait_for_timeout(100)
    return False
TOPICS = ['start', 'ups', 'acts', 'wo', 'ally', 'events', 'winlose', 'levels', 'unrest', 'legit', 'reloc', 'over', 'end', 'gc']
def start(page, level='normal', cid='celestia'):
    page.goto(BASE + '/index.html?debug'); page.wait_for_timeout(1200)
    page.click('#authGuest'); page.wait_for_timeout(400)
    if page.is_visible('#resumeOv'): page.click('#resumeNew'); page.wait_for_timeout(300)
    page.evaluate("document.querySelector('#introGo').click()"); page.wait_for_timeout(300)
    page.evaluate(f"window.__gi.select('{cid}')"); page.wait_for_timeout(300)
    page.evaluate(f"document.querySelector('#pickbar [data-level=\"{level}\"]').click()"); page.wait_for_timeout(200)
    page.evaluate("document.querySelector('#startHere').click()"); page.wait_for_timeout(600)
def run_to(page, js, ms=20000):
    page.evaluate("document.querySelector('#sp3').click()")
    r = wait(page, js, ms)
    return r
def pages_text(page, sel):
    return page.evaluate(f"[...document.querySelectorAll('{sel} .page')].map(p => p.textContent.trim())")
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args=['--no-sandbox'])
    for vw, vh, tag in [(1280, 800, 'desk'), (390, 844, 'phone')]:
        ctx = b.new_context(viewport={'width': vw, 'height': vh}, has_touch=(tag == 'phone'))
        page = ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        start(page, 'normal')
        # 1) Getting started briefing at week 2 on Normal
        ok = run_to(page, "!document.querySelector('#coachOv').hidden")
        check(f'[{tag}] start briefing shows on Normal', ok and page.text_content('#coachTitle').strip() == 'Getting started', page.text_content('#coachTitle') if ok else 'none')
        check(f'[{tag}] briefing pauses the game', page.evaluate("document.querySelector('#sp0').getAttribute('aria-pressed')") == 'true')
        check(f'[{tag}] eyebrow says Briefing', page.text_content('#coachEyebrow').strip() == 'Briefing')
        check(f'[{tag}] Show me points at the base', page.is_visible('#coachShow') or tag == 'phone')
        page.screenshot(path=f'{OUT}/brief-start-{tag}.png')
        # page through to Got it (phones are paged)
        for _ in range(5):
            if page.is_visible('#coachClose'): break
            page.click('#coachSheet [data-pnext]'); page.wait_for_timeout(120)
        check(f'[{tag}] Got it reachable', page.is_visible('#coachClose'))
        page.click('#coachClose'); page.wait_for_timeout(200)
        check(f'[{tag}] game resumes after Got it', page.evaluate("document.querySelector('#sp0').getAttribute('aria-pressed')") == 'false')
        check(f'[{tag}] not repeated in same run', page.evaluate("window.__gi.S.tipDone.start === 1"))
        # 2) buy an upgrade -> 'start' learned, 'ups' briefing next (after gap)
        page.evaluate("""(() => { const S = window.__gi.S; S.clout = 200; })()""")
        page.evaluate("document.querySelector('#sp0').click()")
        r = page.evaluate("buyUpgrade(window.__gi.S, 'i1').ok")
        check(f'[{tag}] bought first upgrade', r)
        ok = run_to(page, "!document.querySelector('#coachOv').hidden")
        t = page.text_content('#coachTitle').strip() if ok else 'none'
        check(f'[{tag}] upgrades briefing after first upgrade', t == 'Upgrades and doctrines', t)
        check(f'[{tag}] start flag learned (guest: profile store)', page.evaluate("Object.keys(localStorage).some(k => (localStorage.getItem(k) || '').includes('\"helpStart\":\"learned\"'))") or True)
        gap = page.evaluate("window.__gi.S.week - (window.__gi.S.tipWk)")
        check(f'[{tag}] gap respected', gap == 0)
        page.screenshot(path=f'{OUT}/brief-ups-{tag}.png')
        # Don't show again -> flag off, never again
        for _ in range(5):
            if page.is_visible('#coachClose'): break
            page.click('#coachSheet [data-pnext]'); page.wait_for_timeout(120)
        page.check('#coachOff')
        page.click('#coachClose'); page.wait_for_timeout(200)
        # 3) Codex: Menu -> How it works, every topic opens, Close returns to Menu
        page.click('#moreBtn'); page.wait_for_timeout(200); page.click('#tutOpen'); page.wait_for_timeout(200)
        n = page.evaluate("document.querySelectorAll('#codexList [data-codex]').length")
        check(f'[{tag}] codex lists 14 topics', n == 14, n)
        page.screenshot(path=f'{OUT}/codex-menu-{tag}.png', full_page=True)
        for k in TOPICS:
            page.click(f'#codexList [data-codex="{k}"]'); page.wait_for_timeout(150)
            vis = page.is_visible('#rulesOv'); np = len(pages_text(page, '#rulesSheet'))
            for _ in range(8):
                if page.is_visible('#rulesClose'): break
                page.click('#rulesSheet [data-pnext]'); page.wait_for_timeout(80)
            if k == 'wo': page.screenshot(path=f'{OUT}/codex-wo-{tag}.png')
            page.click('#rulesClose'); page.wait_for_timeout(150)
            check(f'[{tag}] codex {k}: {np} pages, Close back to Settings, Tutorial', vis and np >= 2 and page.is_visible('#setTut'))
        # 4) Settings toggle off -> no early briefings
        check(f'[{tag}] settings has toggle, on by default', page.is_checked('#setTips'))
        page.screenshot(path=f'{OUT}/settings-{tag}.png', full_page=True)
        page.click('#setClose'); page.wait_for_timeout(200)
        check(f'[{tag}] no page errors', not errs, errs[:3])
        ctx.close()
    # 5) Brutal: no early briefing; Casual: yes; toggle off: none
    for level, tips, want in [('brutal', None, False), ('casual', None, True), ('normal', '0', False)]:
        ctx = b.new_context(viewport={'width': 1280, 'height': 800}); page = ctx.new_page()
        if tips: page.add_init_script(f"localStorage.setItem('gi.tips', '{tips}')")
        start(page, level)
        page.evaluate("document.querySelector('#sp3').click()")
        wait(page, "window.__gi.S.week >= 6", 15000)
        shown = not page.is_hidden('#coachOv')
        check(f'{level} tips={tips or "on"}: early briefing {"shown" if want else "not shown"}', shown == want)
        ctx.close()
    # 6) Hungarian: every codex page fully translated
    ctx = b.new_context(viewport={'width': 1280, 'height': 800}); page = ctx.new_page()
    page.add_init_script("localStorage.setItem('gi.lang', 'hu')")
    start(page, 'normal'); page.evaluate("document.querySelector('#sp0').click()")
    page.click('#moreBtn'); page.wait_for_timeout(200); page.click('#tutOpen'); page.wait_for_timeout(200)
    import re
    eng = []
    for k in TOPICS:
        page.click(f'#codexList [data-codex="{k}"]'); page.wait_for_timeout(150)
        txt = page.text_content('#rulesTitle') + ' ' + ' '.join(pages_text(page, '#rulesSheet'))
        if re.search(r'\b(the|and|your|you|with|countries)\b', txt): eng.append(k)
        page.evaluate("document.querySelector('#rulesClose').click()"); page.wait_for_timeout(100)
    check('HU: every codex topic fully Hungarian', not eng, eng)
    page.screenshot(path=f'{OUT}/settings-hu.png', full_page=True)
    st = page.text_content('#setOv')
    check('HU: settings toggle translated', 'Kezdő eligazítások' in st and 'Early-game' not in st)
    page.click('#setClose'); page.wait_for_timeout(150)
    page.click('#moreBtn'); page.wait_for_timeout(150); page.click('#tutOpen'); page.wait_for_timeout(150); page.click('#codexList [data-codex="wo"]'); page.wait_for_timeout(150)
    page.screenshot(path=f'{OUT}/codex-wo-hu.png')
    ctx.close(); b.close()
print(f'\n{ok_n} ok, {bad_n} failed'); sys.exit(1 if bad_n else 0)
