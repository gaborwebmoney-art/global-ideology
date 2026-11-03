"""v10.36 UI test: guided walkthrough (9 steps, real clicks only, blocked clicks elsewhere, skip, Military path, HU) and action animations.
Usage: python3 tools/walkthrough-ui-test.py http://localhost:8765 <shots dir>"""
import sys
from playwright.sync_api import sync_playwright
BASE = sys.argv[1]; OUT = sys.argv[2]
ok_n = bad_n = 0
def check(name, cond, info=''):
    global ok_n, bad_n
    if cond: ok_n += 1; print('  ok  ', name)
    else: bad_n += 1; print('  FAIL', name, info)
def wait(page, js, ms=6000):
    for _ in range(ms // 100):
        if page.evaluate(js): return True
        page.wait_for_timeout(100)
    return False
STEP = "+(document.querySelector('#wtStep').textContent.match(/\\d+/)||[0])[0]"
def at(page, n): return wait(page, f"!document.querySelector('#wtLayer').hidden && {STEP}==={n}")
def tap_xy(page, x, y, tag):
    if tag == 'phone': page.touchscreen.tap(x, y)
    else: page.mouse.click(x, y)
    page.wait_for_timeout(400)
def tap(page, sel, tag):
    loc = page.locator(sel).first
    bb = loc.bounding_box()
    tap_xy(page, bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2, tag)
def country_xy(page, cid):
    return page.evaluate(f"(()=>{{const r=window.__gi.nodeBox('{cid}');return [r.x+r.width/2,r.y+r.height/2]}})()")
def run(b, tag, vw, vh, branch, base='celestia', lang='en'):
    ctx = b.new_context(viewport={'width': vw, 'height': vh}, has_touch=(tag == 'phone'), is_mobile=(tag == 'phone'))
    page = ctx.new_page(); errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.add_init_script(f"localStorage.setItem('gi.wt','replay'); localStorage.setItem('gi.lang','{lang}')")
    page.goto(BASE + '/index.html?debug'); page.wait_for_timeout(1200)
    page.click('#authGuest'); page.wait_for_timeout(400)
    page.evaluate("document.querySelector('#introGo').click()")
    T = f'[{tag}/{branch}/{base}{"/" + lang if lang != "en" else ""}]'
    check(f'{T} walkthrough starts at the pick screen', at(page, 1))
    page.screenshot(path=f'{OUT}/{tag}-{branch}-1.png')
    x, y = country_xy(page, base); tap_xy(page, x, y, tag)
    check(f'{T} step 2 after tapping a country', at(page, 2))
    page.wait_for_timeout(300); page.screenshot(path=f'{OUT}/{tag}-{branch}-2.png')
    page.evaluate("document.querySelector('#moreBtn').click()"); page.wait_for_timeout(200)
    check(f'{T} clicks outside the spotlight are blocked', page.is_hidden('#moreOv'))
    tap(page, '#startHere', tag)
    check(f'{T} step 3: game started paused, bubble worth 4', at(page, 3) and page.evaluate("window.__gi.S.bubbles.some(b=>b.value===4&&b.until>1e8)") and page.evaluate("document.querySelector('#sp0').getAttribute('aria-pressed')") == 'true')
    page.wait_for_timeout(300); page.screenshot(path=f'{OUT}/{tag}-{branch}-3.png')
    c0 = page.evaluate("window.__gi.S.clout")
    key = page.evaluate("window.__gi.wt.bubble")
    tap(page, f'.bubble[data-key="{key}"]', tag)
    check(f'{T} step 4 after the bubble (+4 Clout)', at(page, 4) and page.evaluate("window.__gi.S.clout") >= c0 + 4)
    tap(page, '#openTree', tag)
    check(f'{T} step 5 with Upgrades open', at(page, 5))
    page.wait_for_timeout(300); page.screenshot(path=f'{OUT}/{tag}-{branch}-5a.png')
    tap(page, f'#tree [data-b="{branch}"]', tag)
    up = page.evaluate(f"window.__gi.S && (UPGRADES.find(u=>u.b==='{branch}').id)")
    tap(page, f'#tree [data-up="{up}"]', tag)
    page.wait_for_timeout(300); page.screenshot(path=f'{OUT}/{tag}-{branch}-5c.png')
    tap(page, '#buyUp', tag)
    check(f'{T} step 6 after buying, Upgrades closed', at(page, 6) and page.is_hidden('#treeOv'))
    tgt = page.evaluate("window.__gi.wt.target")
    page.wait_for_timeout(500); page.screenshot(path=f'{OUT}/{tag}-{branch}-6.png')
    x, y = country_xy(page, tgt); tap_xy(page, x, y, tag)
    check(f'{T} step 7 after tapping target {tgt}', at(page, 7))
    page.wait_for_timeout(800); page.screenshot(path=f'{OUT}/{tag}-{branch}-7.png')
    if branch == 'mil':
        check(f'{T} Military path: read step with Next', page.is_visible('#wtNext'))
        page.click('#wtNext'); page.wait_for_timeout(300)
    else:
        tap(page, f'[data-adom="{branch}"]', tag)
        check(f'{T} step 8', at(page, 8))
        page.wait_for_timeout(700)
        tap(page, f'[data-aact="{branch}1"]', tag); page.wait_for_timeout(700)
        page.screenshot(path=f'{OUT}/{tag}-{branch}-8.png')
        tap(page, '[data-ago]', tag)
        page.wait_for_timeout(450)
        check(f'{T} action animation drawn on the map, card out of the way', page.evaluate("document.querySelector('.actfx').childNodes.length") > 0 and page.is_hidden('#wtLayer'))
        page.screenshot(path=f'{OUT}/{tag}-{branch}-anim.png')
        page.wait_for_timeout(500); page.screenshot(path=f'{OUT}/{tag}-{branch}-anim2.png')
    check(f'{T} step 9', at(page, 9) if branch == 'mil' else wait(page, f"!document.querySelector('#wtLayer').hidden && {STEP}===9", 5000))
    page.wait_for_timeout(1800); page.screenshot(path=f'{OUT}/{tag}-{branch}-9.png')
    if lang == 'hu':
        txt = page.text_content('#wtCard')
        check(f'{T} card in Hungarian', 'Step' not in txt and 'Loud' not in txt and 'Skip' not in txt, txt[:160])
    tap(page, '#sp1', tag)
    check(f'{T} done: layer hidden, game running, remembered', wait(page, "document.querySelector('#wtLayer').hidden") and page.evaluate("localStorage.getItem('gi.wt')") == 'done' and page.evaluate("document.querySelector('#sp1').getAttribute('aria-pressed')") == 'true')
    check(f'{T} no page errors', not errs, errs[:3])
    ctx.close()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args=['--no-sandbox'])
    run(b, 'desk', 1280, 800, 'ideo')
    run(b, 'phone', 390, 844, 'eco', base='laplata')
    run(b, 'desk', 1280, 800, 'mil', base='borealis')
    run(b, 'phone', 390, 844, 'dip', base='celestia', lang='hu')
    # skip, then Settings, Tutorial, Replay
    ctx = b.new_context(viewport={'width': 1280, 'height': 800}); page = ctx.new_page()
    page.add_init_script("if(!sessionStorage.getItem('x')){localStorage.setItem('gi.wt','replay');sessionStorage.setItem('x','1')}")
    page.goto(BASE + '/index.html?debug'); page.wait_for_timeout(1200); page.click('#authGuest'); page.wait_for_timeout(300)
    page.evaluate("document.querySelector('#introGo').click()"); at(page, 1)
    page.click('#wtSkip'); page.wait_for_timeout(300)
    check('skip hides it and remembers', page.is_hidden('#wtLayer') and page.evaluate("localStorage.getItem('gi.wt')") == 'skipped')
    page.evaluate("window.__gi.select('celestia')"); page.wait_for_timeout(200); page.click('#startHere'); page.wait_for_timeout(500)
    check('after skip the game starts at normal speed', page.evaluate("document.querySelector('#sp0').getAttribute('aria-pressed')") == 'false')
    page.click('#moreBtn'); page.wait_for_timeout(200); page.click('#tutOpen'); page.wait_for_timeout(200)
    check('Menu, Tutorial opens Settings on the Tutorial page', page.is_visible('#setTut') and page.is_hidden('#setGen'))
    page.screenshot(path=f'{OUT}/settings-tutorial.png', full_page=True)
    page.click('#setWt'); page.wait_for_timeout(200)
    check('Replay is queued for the next new game', page.evaluate("localStorage.getItem('gi.wt')") == 'replay' and 'next new game' in page.text_content('#setWtNote'))
    ctx.close(); b.close()
print(f'\n{ok_n} ok, {bad_n} failed'); sys.exit(1 if bad_n else 0)
