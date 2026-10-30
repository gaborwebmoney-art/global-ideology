"""itch.io screenshots: the real game, played by the v10 bot inside the page, captured at 10 stages (1920x1080).
usage: python3 tools/make-itch-shots.py [outdir] [start] [seed]   (default store/itch, borealis, 7)"""
import os, re, socket, subprocess, sys, time
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'store', 'itch')
START = sys.argv[2] if len(sys.argv) > 2 else 'borealis'
SEED = int(sys.argv[3]) if len(sys.argv) > 3 else 7
CHROME = os.environ.get('GI_CHROME', '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
os.makedirs(OUT, exist_ok=True)

# bot source, turned into a per-tick driver over the page's own state
bot = open(os.path.join(ROOT, 'v10-bot.js')).read()
bot = bot.split("const T = { courtWeeks")[0]
bot = bot.replace("const S = require('./sim.js');", "")
bot = bot.replace("const PER_START = +(process.argv[2] || 6);", "")
bot = re.sub(r"function play\(start, seed, cfg, build, sharp\) \{\n  const s = S\.createState\([^\n]*\n",
             "function play(s, cfg, build, sharp, until) {\n", bot)
assert 'function play(s, cfg' in bot
bot = bot.replace("while (!s.over && s.week < (cfg.maxWeeks || 1500)) {", "while (!s.over && s.week < (cfg.maxWeeks || 1500) && !until(s)) {")
bot = bot.replace("if (s.pending) { let c = 'a';", "if (s.pending && !cfg.keepPending) { let c = 'a';")
bot = bot[:bot.index("  const log = s.actLog")] + "  return s;\n}\n"
INSTALL = """(src) => {
  const names = ['UPGRADES','ACTIONS','COUNTRIES','V10','PAIRS','actCost','canAct','actEff','gcMember','ruleAt','step','canChoose','resolveDecision','collectBubble','pairOn','buyUpgrade','doAct','ratified','unrestOn','overOn','heldIds','aided','legitOn','legitOf','baseOf','canGuard','buyGuard','canReloc','baseEstablished','canPlan','buyPlan','startReloc','legitFrozen','alignedShare','gcOn','gcActEffect','gcBorder','capActive','capWhy','ultimatumOk'];
  const S = {}; for (const n of names) { try { S[n] = eval(n); } catch (e) { /* not in this build */ } }
  window.__BOT = new Function('S', src + '; return { play };')(S);
}"""


def poll(page, expr, secs=30):
    end = time.time() + secs
    while time.time() < end:
        try:
            if page.evaluate(expr): return True
        except Exception:
            pass
        time.sleep(0.15)
    raise SystemExit('timeout: ' + expr)


def close_coach(pg):
    if pg.is_visible('#endOv'): return
    for _ in range(10):
        if pg.evaluate("document.getElementById('coachOv').hidden"): return
        if pg.is_visible('#coachClose'): pg.click('#coachClose'); pg.wait_for_timeout(150); return
        pg.click('#coachSheet [data-pnext]'); pg.wait_for_timeout(120)


def play_until(pg, cond, keep_pending=False, max_weeks=900):
    pg.evaluate("""([cond, kp, mw]) => { const s = __GI.S; const until = new Function('s', 'return ' + cond);
      let guard = 0; while (!s.over && !until(s) && guard++ < mw) { __BOT.play(s, { maxWeeks: s.week + 1, keepPending: kp }, 'Ideo+Dip', true, until); if (s.pending && kp) break; if (s.week % 6 === 0) __GI.render(); }
      __GI.render(); }""", [cond, keep_pending, max_weeks])
    pg.wait_for_timeout(500)


port = (lambda s: (s.bind(('127.0.0.1', 0)), s.getsockname()[1], s.close())[1])(socket.socket())
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
errs = []
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
        ctx = b.new_context(viewport={'width': 1280, 'height': 720}, device_scale_factor=1.5, bypass_csp=True, locale='en-US')
        ctx.route(re.compile(r'https://[^/]+\.supabase\.co/.*'), lambda r: r.fulfill(status=200, body='[]', headers={'content-type': 'application/json', 'access-control-allow-origin': '*'}))
        pg = ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(f'http://127.0.0.1:{port}/index.html?debug'); poll(pg, "window.__GI && !document.getElementById('authOv').hidden")
        pg.evaluate("localStorage.clear(); localStorage.setItem('gi.level', 'casual')"); pg.reload(); poll(pg, "window.__GI && !document.getElementById('authOv').hidden")
        pg.add_style_tag(content='#teleDbg{display:none!important}')
        shot = lambda n: (pg.evaluate("document.querySelectorAll('g.ping').forEach(e => e.remove())"), pg.screenshot(path=os.path.join(OUT, n + '.png')))
        pg.click('#authGuest'); poll(pg, "!document.getElementById('introOv').hidden"); pg.wait_for_timeout(500)
        shot('01-briefing')
        pg.evaluate("document.getElementById('introGo').click()"); pg.wait_for_timeout(300)
        pg.evaluate(f"__gi.select('{START}')"); pg.wait_for_timeout(500)
        shot('02-choose-country')
        pg.evaluate(f"(c) => {{ __GI.startGame(c); __GI.setSpeed(0); }}", START); pg.wait_for_timeout(400)
        close_coach(pg)
        pg.evaluate(INSTALL, bot)
        pg.evaluate("Math.random = (() => { let x = %d; return () => ((x = (x * 16807) %% 2147483647) / 2147483647); })()" % SEED)
        play_until(pg, "s.week >= 18"); close_coach(pg)
        # dossier of a neighbour with the action tiles
        nb = pg.evaluate("() => { const s = __GI.S; const ids = BORDERS.filter(e => e.includes(baseOf(s))).map(e => e[0] === baseOf(s) ? e[1] : e[0]); return ids.sort((a, b) => s.inf[b] - s.inf[a])[0]; }")
        pg.evaluate(f"__gi.select('{nb}')"); pg.wait_for_timeout(300)
        if pg.query_selector('#side [data-adom="ideo"]'): pg.click('#side [data-adom="ideo"]'); pg.wait_for_timeout(300)
        pg.evaluate("document.getElementById('alerts').innerHTML = ''")
        shot('03-early-actions')
        play_until(pg, "s.owned.length >= 4"); close_coach(pg)
        pg.click('#openTree'); pg.wait_for_timeout(600)
        shot('04-upgrades')
        pg.click('#closeTree'); pg.wait_for_timeout(300)
        play_until(pg, "!!s.pending", keep_pending=True); pg.wait_for_timeout(500)
        shot('05-decision') if pg.is_visible('#decOv') else None
        if pg.evaluate("!!__GI.S.pending"):
            pg.evaluate("() => { const s = __GI.S; if (!canChoose(s, 'a').ok) resolveDecision(s, 'b'); else resolveDecision(s, 'a'); __GI.render(); }")
            pg.evaluate("document.getElementById('decOv').hidden = true")
        close_coach(pg)
        play_until(pg, "(s.wo.court || []).length > 0 || Object.keys(s.wo.members).length >= 3"); close_coach(pg)
        pg.evaluate("() => { const s = __GI.S; const c = (s.wo.court || [])[0]; const id = c ? c.target : Object.keys(s.wo.members)[0]; if (id) __gi.select(id); __GI.render(); }"); pg.wait_for_timeout(400)
        shot('06-world-order')
        play_until(pg, "alignedShare(s) >= .45"); close_coach(pg)
        pg.evaluate(f"__gi.select('{START}')"); pg.wait_for_timeout(300)
        shot('07-midgame')
        play_until(pg, "alignedShare(s) >= .72")
        pg.wait_for_timeout(300)
        close_coach(pg); pg.evaluate("document.getElementById('alerts').innerHTML = ''"); pg.click('#newsFab') if pg.is_visible('#newsFab') else None; pg.wait_for_timeout(300)
        shot('08-late-game')
        pg.evaluate("document.getElementById('newsOv').hidden = true")
        play_until(pg, "!!s.over || !document.getElementById('endOv').hidden", max_weeks=1200)
        pg.wait_for_timeout(800)
        if not pg.evaluate("document.getElementById('coachOv').hidden"): close_coach(pg)
        shot('09-result')
        if pg.is_visible('#stay'):
            pg.click('#stay'); pg.wait_for_timeout(600); close_coach(pg); pg.wait_for_timeout(300); close_coach(pg)
            pg.evaluate(f"__gi.select('{START}')"); pg.wait_for_timeout(400)
            pg.evaluate("document.getElementById('alerts').innerHTML = ''")
            shot('10-final-map')
        print('state', pg.evaluate("() => ({ week: __GI.S.week, over: __GI.S.over, win: __GI.S.winType, share: alignedShare(__GI.S), ov: [...document.querySelectorAll('.overlay')].filter(e => !e.hidden).map(e => e.id) })"))
        b.close()
finally:
    srv.terminate()
print('errors', errs[:5])
