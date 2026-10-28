"""Google Play phone screenshots (1080x2160, 2:1) of the real game, in English. Written to store/shot-*.png.
Game state comes from the live game (guest, fixed start, played forward), so they stay in step with the app.
usage: python3 tools/make-screenshots.py"""
import os, socket, subprocess, sys, time
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
CHROME = os.environ.get('GI_CHROME', '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
OUT = os.path.join(ROOT, 'store')


def poll(page, expr, secs=120):
    end = time.time() + secs
    while time.time() < end:
        try:
            if page.evaluate(expr): return True
        except Exception:
            pass
        time.sleep(0.15)
    raise SystemExit('timeout waiting for: ' + expr)


def main():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.8)
    try:
        with sync_playwright() as p:
            b = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
            ctx = b.new_context(viewport={'width': 360, 'height': 720}, is_mobile=True, has_touch=True, device_scale_factor=3, locale='en-US')
            pg = ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.goto(f'http://127.0.0.1:{port}/index.html?debug'); poll(pg, "window.__GI && !document.getElementById('authOv').hidden")
            pg.evaluate("localStorage.clear()"); pg.reload(); poll(pg, "window.__GI && !document.getElementById('authOv').hidden")
            pg.click('#authGuest'); poll(pg, "!document.getElementById('introOv').hidden"); time.sleep(0.6)
            pg.add_style_tag(content='#teleDbg{display:none!important}')
            pg.screenshot(path=f'{OUT}/shot-1-start.png')
            pg.evaluate("document.getElementById('introOv').hidden = true; window.__GI.startGame('pannonia'); window.__GI.setSpeed(0)"); time.sleep(0.6)
            for id_ in ('coachClose',):
                if pg.is_visible('#' + id_): pg.click('#' + id_)
            pg.screenshot(path=f'{OUT}/shot-2-board.png')
            pg.evaluate("window.__GI.setSpeed(3)")
            end = time.time() + 280
            while time.time() < end and pg.evaluate("window.__GI.S.week") < 40:
                for b_ in ('#decA', '#again', '#coachClose', '#contPlay'):
                    if pg.is_visible(b_):
                        pg.click(b_); pg.evaluate("window.__GI.setSpeed(3)")
                pg.evaluate("window.__GI.setSpeed(3)")
                time.sleep(0.3)
            if pg.evaluate("window.__GI.S.week") < 40: raise SystemExit('game did not reach week 40: ' + str(pg.evaluate("[window.__GI.S.week, window.__GI.S.over || '', [...document.querySelectorAll('.overlay')].filter(e => !e.hidden).map(e => e.id)]")))
            pg.evaluate("window.__GI.setSpeed(0)"); time.sleep(0.6)
            pg.evaluate("document.getElementById('alerts').innerHTML = ''")
            pg.screenshot(path=f'{OUT}/shot-3-spread.png')
            pg.click('#openTree'); time.sleep(0.8)
            pg.screenshot(path=f'{OUT}/shot-4-doctrines.png')
            pg.click('#closeTree'); time.sleep(0.4)
            pg.click('#newsFab'); time.sleep(0.6)
            pg.screenshot(path=f'{OUT}/shot-5-news.png')
            print('page errors:', errs)
            b.close()
    finally:
        srv.terminate()


if __name__ == '__main__':
    main()
