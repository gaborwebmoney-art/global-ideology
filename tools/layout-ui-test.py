"""Phone portrait layout test (v10.23): no empty gap between the map and the bottom meters. The default zoomed view fills the free height
(or, on short phones, the old minimum size), the whole-map view is centred and fills the frame, the choice is remembered, nothing
overflows sideways. usage: python3 tools/layout-ui-test.py   (exit 0 = all passed)"""
import os, socket, subprocess, sys, time
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CHROME = os.environ.get('GI_CHROME', '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
results = []


def check(name, cond, extra=''):
    results.append((name, bool(cond)))
    print(('PASS  ' if cond else 'FAIL  ') + name + ((' -- ' + str(extra)[:300]) if (extra and not cond) else ''))


BOXES = """() => { const r = s => { const e = document.querySelector(s); const b = e.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, h: b.height, w: b.width }; };
  return { wrap: r('#mapwrap'), map: r('#map'), hud: r('.hud'), vw: innerWidth, sw: document.documentElement.scrollWidth, fit: document.getElementById('mapwrap').classList.contains('fit') }; }"""


def run(p, url):
    b = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
    for w, h in [(390, 844), (412, 915), (360, 780), (375, 667), (360, 640), (320, 568)]:
        ctx = b.new_context(viewport={'width': w, 'height': h}, is_mobile=True, has_touch=True)
        pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(url + '/index.html?debug'); time.sleep(1.2)
        pg.click('#authGuest'); time.sleep(0.2)
        pg.evaluate("document.getElementById('introOv').hidden = true; window.__GI.startGame('pannonia'); window.__GI.setSpeed(0)"); time.sleep(0.6)
        a = pg.evaluate(BOXES); tag = f'{w}x{h}'
        check(f'{tag}: zoomed view is the default', not a['fit'])
        free = a['wrap']['h']
        # the map fills the frame, or is the old minimum size (441 px) when the frame is shorter than that
        check(f'{tag}: map fills the free height (map {a["map"]["h"]:.0f} of {free:.0f}px frame)', a['map']['h'] >= min(free - 60, 441) - 1 and a['map']['h'] >= 441 - 1, a)
        check(f'{tag}: frame reaches the meters (gap <= 12px)', a['hud']['top'] - a['wrap']['bottom'] <= 12, a)
        check(f'{tag}: page does not scroll sideways', a['sw'] <= a['vw'], a)
        check(f'{tag}: map is centred on the base, not stuck at the left edge', pg.evaluate("document.getElementById('mapwrap').scrollLeft") > 0)
        pg.click('#fitMap'); time.sleep(0.3)
        f = pg.evaluate(BOXES)
        check(f'{tag}: Whole map view fits the width', f['fit'] and abs(f['map']['w'] - f['wrap']['w']) < 4 and f['sw'] <= f['vw'], f)
        mid_gap = (f['wrap']['h'] - f['map']['h']) / 2
        check(f'{tag}: Whole map view is centred in the frame', abs((f['map']['top'] - f['wrap']['top']) - mid_gap) < 3, f)
        check(f'{tag}: the choice is remembered', pg.evaluate("localStorage.getItem('gi.view')") == 'fit')
        pg.reload(); time.sleep(1.0)
        check(f'{tag}: reload keeps the chosen view', pg.evaluate("document.getElementById('mapwrap').classList.contains('fit')"))
        pg.evaluate("document.getElementById('fitMap').click()"); time.sleep(0.2)
        check(f'{tag}: switching back to zoom is remembered', pg.evaluate("localStorage.getItem('gi.view')") == 'zoom' and not pg.evaluate("document.getElementById('mapwrap').classList.contains('fit')"))
        check(f'{tag}: no page errors', not errs, errs)
        ctx.close()
    # landscape phone keeps its own layout
    ctx = b.new_context(viewport={'width': 844, 'height': 390}, is_mobile=True, has_touch=True)
    pg = ctx.new_page(); pg.goto(url + '/index.html?debug'); time.sleep(1.0)
    a = pg.evaluate("() => { const b = document.querySelector('#mapwrap').getBoundingClientRect(); return { h: b.height, w: b.width, sw: document.documentElement.scrollWidth, vw: innerWidth }; }")
    check('landscape: map frame unchanged in kind (fills its cell, no sideways scroll)', a['h'] > 150 and a['sw'] <= a['vw'], a)
    ctx.close(); b.close()


if __name__ == '__main__':
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
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
