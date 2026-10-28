"""v10.24 UI test: Menu/Settings, quit to main menu + continue, audio requests, compact header. Usage: python3 tools/settings-ui-test.py http://localhost:8765 <shots dir>"""
import sys, json
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
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
    ctx = b.new_context(viewport={'width': 1280, 'height': 720})
    page = ctx.new_page(); errs = []; reqs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'ERR_TUNNEL' not in m.text and 'Failed to load resource' not in m.text else None)
    page.on('request', lambda r: reqs.append(r.url))
    page.goto(BASE + '/index.html?debug'); page.wait_for_timeout(1500)
    page.click('#authGuest'); page.wait_for_timeout(500)
    if page.is_visible('#resumeOv'): page.click('#resumeNew'); page.wait_for_timeout(300)
    page.click('#introGo'); page.wait_for_timeout(300)
    page.evaluate("window.__gi.select('celestia')"); page.wait_for_timeout(300)
    page.click('#startHere'); page.wait_for_timeout(1500)
    check('game running at default speed 1', page.evaluate("document.querySelector('#sp1').getAttribute('aria-pressed')") == 'true')
    check('music requested after first tap', any('audio/music-main.mp3' in u for u in reqs))
    # menu pauses
    page.click('#moreBtn'); page.wait_for_timeout(200)
    check('menu open', page.is_visible('#moreOv'))
    check('menu pauses game', page.evaluate("document.querySelector('#sp0').getAttribute('aria-pressed')") == 'true')
    check('resume button says Resume', page.inner_text('#menuResume').strip() == 'Resume')
    wk = page.evaluate("window.__gi.S.week"); page.wait_for_timeout(800)
    check('week frozen while menu open', page.evaluate("window.__gi.S.week") == wk)
    page.screenshot(path=OUT + '/menu-1280.png')
    page.click('#setOpen'); page.wait_for_timeout(200)
    check('settings open, menu hidden', page.is_visible('#setOv') and not page.is_visible('#moreOv'))
    page.screenshot(path=OUT + '/settings-1280.png', full_page=True)
    # text size
    page.click('#setTs [data-ts="2"]'); page.wait_for_timeout(100)
    check('text size largest applied', page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--tz').trim()") == '1.3')
    page.click('#setTs [data-ts="0"]')
    # default speed
    page.click('#setSpd [data-spd="2"]')
    check('default speed saved', page.evaluate("localStorage.getItem('gi.spd')") == '2')
    # reduce motion
    page.click('#setCalm'); check('reduce motion class', page.evaluate("document.documentElement.classList.contains('calm')"))
    page.click('#setCalm')
    # music off / volume
    page.click('#setMusic'); check('music off stored', page.evaluate("localStorage.getItem('gi.music')") == '0')
    check('music volume disabled when off', page.evaluate("document.querySelector('#setMusicVol').disabled"))
    page.click('#setMusic')
    page.fill('#setMusicVol', '30') if False else page.evaluate("const r=document.querySelector('#setMusicVol'); r.value=30; r.dispatchEvent(new Event('input',{bubbles:true}))")
    check('music volume stored', page.evaluate("localStorage.getItem('gi.musicVol')") == '30')
    # language HU from settings
    page.click('#setOv [data-lang="hu"]'); page.wait_for_timeout(300)
    check('HU: settings title', page.inner_text('#setTitle').strip().lower() == 'beállítások', page.inner_text('#setTitle'))
    check('HU: sound section', 'Hang' in page.inner_text('#setOv'))
    page.screenshot(path=OUT + '/settings-hu.png', full_page=True)
    page.click('#setOv [data-lang="en"]'); page.wait_for_timeout(200)
    # briefings reset
    page.click('#setCoach'); check('briefings reset note', 'show again' in page.inner_text('#setCoachNote'))
    # back to menu, resume restores speed
    page.click('#setBack'); check('back to menu', page.is_visible('#moreOv'))
    page.click('#menuResume'); page.wait_for_timeout(200)
    check('resume restores speed 1', page.evaluate("document.querySelector('#sp1').getAttribute('aria-pressed')") == 'true')
    page.wait_for_timeout(1500)
    # quit to main menu and continue
    wk = page.evaluate("window.__gi.S.week")
    page.click('#moreBtn'); page.click('#menuQuit'); page.wait_for_timeout(500)
    check('quit shows welcome back', page.is_visible('#resumeOv') and page.is_visible('#resumeGo'))
    check('board cleared', page.evaluate("window.__gi.S === null"))
    page.click('#resumeGo'); page.wait_for_timeout(500)
    check('continue restores same week', page.evaluate("window.__gi.S && window.__gi.S.week") == wk, (wk, page.evaluate("window.__gi.S && window.__gi.S.week")))
    # new game uses default speed 2
    page.click('#moreBtn'); page.click('#quitGame'); page.click('#quitYes'); page.wait_for_timeout(300)
    page.evaluate("window.__gi.select('borealis')"); page.click('#startHere'); page.wait_for_timeout(300)
    check('new game starts at default speed 2', page.evaluate("document.querySelector('#sp2').getAttribute('aria-pressed')") == 'true')
    # end game -> cue
    page.click('#moreBtn'); page.click('#endGame'); page.click('#quitYes'); page.wait_for_timeout(1500)
    check('end screen shown', page.is_visible('#endOv'))
    check('no page errors', not errs, errs[:3])
    ctx.close()
    # compact header
    for name, w, h, mob in [('l640x360', 640, 360, False), ('l844x390', 844, 390, True), ('p390x844', 390, 844, True), ('d1031x580', 1031, 580, False)]:
        c = b.new_context(viewport={'width': w, 'height': h}, is_mobile=mob, has_touch=mob)
        pg = c.new_page(); pe = []; pg.on('pageerror', lambda e: pe.append(str(e)))
        pg.goto(BASE + '/index.html?debug'); pg.wait_for_timeout(1200)
        pg.click('#authGuest'); pg.wait_for_timeout(300)
        if pg.is_visible('#resumeOv'): pg.click('#resumeNew')
        pg.evaluate("document.querySelector('#introGo').click()"); pg.evaluate("window.__gi.select('celestia')"); pg.evaluate("document.querySelector('#startHere').click()"); pg.wait_for_timeout(800)
        over = pg.evaluate("(() => { const b=document.querySelector('header.bar').getBoundingClientRect(); return [...document.querySelectorAll('header.bar > *')].filter(e=>e.offsetParent).map(e=>[e.id||e.className, Math.round(e.getBoundingClientRect().right)]).filter(x=>x[1] > window.innerWidth + 1); })()")
        check(f'{name}: header fits', not over, over)
        check(f'{name}: Upgrades visible', pg.is_visible('#openTree'))
        if name == 'l640x360':
            pg.click('#sp1'); pg.wait_for_timeout(100)
            check('640: tap current speed cycles to 2x', pg.evaluate("document.querySelector('#sp2').getAttribute('aria-pressed')") == 'true')
        pg.screenshot(path=OUT + f'/hdr-{name}.png')
        pg.evaluate("document.querySelector('#side').classList.remove('open')"); pg.click('#moreBtn'); pg.click('#setOpen'); pg.wait_for_timeout(200)
        pg.screenshot(path=OUT + f'/set-{name}.png')
        check(f'{name}: no page errors', not pe, pe[:2])
        c.close()
    b.close()
print(f'{ok_n} ok, {bad_n} failed'); sys.exit(1 if bad_n else 0)
