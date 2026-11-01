"""v10.33: pixel CRT globe (art direction B). Regenerates the app icon set, Play store graphics and Android launcher/splash resources from one drawing.
Original artwork (map outline from the game's own TERRAIN data + amber influence rings). To use different artwork, replace the
`icon_svg()` / `fg_svg()` functions or drop finished PNGs over the outputs listed below.
usage: python3 tools/make-assets.py
writes: icons/icon.svg icons/icon-192.png icons/icon-512.png icons/icon-maskable-512.png
        store/icon-512.png store/feature-1024x500.png
        android-res/ (mipmap-*, drawable*/splash.png, values/ic_launcher_background.xml)   (copied into android/ by tools/android-prepare.js)"""
import json, math, os, re, sys, tempfile
from playwright.sync_api import sync_playwright
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
CHROME = os.environ.get('GI_CHROME', '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
INK, AMBER = '#0b151c', '#f2a541'
T = json.loads(re.search(r'const TERRAIN = (\{.*?\});\n', open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read(), re.S).group(1))
# v10.33 art (direction B, chosen by Pavel): a pixel-art globe on a dark CRT screen, the player's amber influence spreading over it.
# The land is the game's own 16 countries (TERRAIN.territories) wrapped onto a sphere, quantised to a coarse grid with 3 light levels.
OCEAN = ['#0e2a47', '#14395e', '#1c4b78']
LAND = ['#3b6a58', '#4f8a6e', '#72ad86']
RIM = '#3d86b0'
GLOW = ['#8f5418', '#d1862a', '#f2a541', '#ffd889']
N = 22                     # cells across the globe: chunky enough to read at 48 px
LON0, SRC = math.radians(50), (math.radians(62), math.radians(30))   # view centre, influence origin (lon, lat)
_mask = None


def land_mask(page):
    """Renders the map's countries white on black once; returns a lookup land(u, v) for map coordinates 0..1."""
    global _mask
    if _mask is None:
        w, h = T['w'], T['h']
        paths = ''.join(f'<path d="{d}"/>' for d in T['territories'].values())
        page.set_viewport_size({'width': w, 'height': h})
        page.set_content(f'<!doctype html><body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}"><rect width="{w}" height="{h}" fill="#000"/><g fill="#fff">{paths}</g></svg>')
        page.wait_for_timeout(200)
        f = os.path.join(tempfile.mkdtemp(), 'mask.png'); page.screenshot(path=f, clip={'x': 0, 'y': 0, 'width': w, 'height': h})
        _mask = Image.open(f).convert('L')
    m = _mask
    return lambda u, v: m.getpixel((min(m.width - 1, max(0, int(u * m.width))), min(m.height - 1, max(0, int(v * m.height))))) > 128


CELLS = None


def cells(page):
    """[(i, j, colour)] for the globe grid, computed once."""
    global CELLS
    if CELLS is not None: return CELLS
    land = land_mask(page); out = []
    for j in range(-1, N + 1):
        for i in range(-1, N + 1):
            x = (i + .5) / N * 2 - 1; y = 1 - (j + .5) / N * 2; r2 = x * x + y * y
            if r2 > 1:
                if r2 <= (1 + 2.2 / N) ** 2: out.append((i, j, RIM + '|.55'))   # atmosphere: one cell of light around the disc
                continue
            z = math.sqrt(1 - r2); lat = math.asin(y); lon = LON0 + math.atan2(x, z)
            u = ((math.degrees(lon) + 180) % 360) / 360; v = 0.06 + (90 - math.degrees(lat)) / 180 * 0.88
            light = -0.5 * x + 0.55 * y + 0.68 * z          # light from the upper left
            lv = 0 if light < 0.35 else 1 if light < 0.75 else 2
            d = math.acos(max(-1, min(1, math.sin(lat) * math.sin(SRC[1]) + math.cos(lat) * math.cos(SRC[1]) * math.cos(lon - SRC[0]))))
            if land(u, v):
                if d < 0.22: c = GLOW[3]
                elif d < 0.5: c = GLOW[2] if lv else GLOW[1]
                elif d < 0.62 and (i + j) % 2 == 0: c = GLOW[1] if lv else GLOW[0]     # dithered front: the idea is spreading
                else: c = LAND[lv]
            else:
                c = OCEAN[lv]
            out.append((i, j, c))
    CELLS = out
    return out


def globe(page, size, frac=0.8, scan=True, clip_round=False):
    """SVG group: the pixel globe centred in a size x size square, diameter = frac x size, plus CRT scanlines over it."""
    cell = size * frac / N; off = (size - N * cell) / 2
    def r(i, j, c):
        col, _, op = c.partition('|')
        return f'<rect x="{off + i * cell:.2f}" y="{off + j * cell:.2f}" width="{cell + .35:.2f}" height="{cell + .35:.2f}" fill="{col}"' + (f' opacity="{op}"' if op else '') + '/>'
    g = ''.join(r(i, j, c) for i, j, c in cells(page))
    if scan:
        step = max(2.0, size / 128)
        g += f'<g opacity=".28">' + ''.join(f'<rect y="{y:.1f}" width="{size}" height="{step / 2.4:.2f}" fill="#000"/>' for y in [k * step for k in range(int(size / step) + 1)]) + '</g>'
    return g


def background(size):
    c = size / 2
    return (f'<defs><radialGradient id="bg" cx="50%" cy="46%" r="70%"><stop offset="0" stop-color="#1b2b35"/><stop offset=".6" stop-color="#0d1820"/><stop offset="1" stop-color="#05090c"/></radialGradient>'
            f'<radialGradient id="glow" cx="58%" cy="40%" r="50%"><stop offset="0" stop-color="{AMBER}" stop-opacity=".28"/><stop offset="1" stop-color="{AMBER}" stop-opacity="0"/></radialGradient></defs>'
            f'<rect width="{size}" height="{size}" fill="url(#bg)"/><circle cx="{c}" cy="{c}" r="{size * .48:.1f}" fill="url(#glow)"/>')


def icon_svg(page, size=512):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}">{background(size)}{globe(page, size, .80)}</svg>'


def fg_svg(page, size):
    """Adaptive-icon foreground: transparent, the globe inside the 66/108 safe zone (launchers crop to circles, squircles...)."""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}">{globe(page, size, 0.60, scan=False)}</svg>'


def legacy_svg(page, size, round_):
    clip = f'<circle cx="{size / 2}" cy="{size / 2}" r="{size / 2}"/>' if round_ else f'<rect width="{size}" height="{size}" rx="{size * .19:.1f}"/>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}"><defs><clipPath id="m">{clip}</clipPath></defs>'
            f'<g clip-path="url(#m)">{background(size)}{globe(page, size, .78, scan=size >= 96)}</g></svg>')


def feature_html(page):
    font = 'file://' + os.path.join(ROOT, 'fonts', 'big-shoulders-display-latin-800-normal.woff2')
    mono = 'file://' + os.path.join(ROOT, 'fonts', 'ibm-plex-mono-latin-500-normal.woff2')
    art = f'<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">{globe(page, 500, .84, scan=False)}</svg>'
    scan = ''.join(f'<i style="top:{y}px"></i>' for y in range(0, 500, 4))
    return f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:BS;src:url({font});font-weight:800}} @font-face{{font-family:PM;src:url({mono});font-weight:500}}
html,body{{margin:0;width:1024px;height:500px;overflow:hidden;background:#05090c}}
.wrap{{position:relative;width:1024px;height:500px;background:radial-gradient(ellipse 70% 90% at 72% 45%,#1b2b35 0%,#0d1820 55%,#05090c 100%)}}
.glow{{position:absolute;right:-4px;top:0;width:500px;height:500px;background:radial-gradient(circle at 58% 40%,rgba(242,165,65,.30),rgba(242,165,65,0) 60%)}}
.art{{position:absolute;right:-4px;top:0;width:500px;height:500px}}
.scan i{{position:absolute;left:0;width:1024px;height:2px;background:rgba(0,0,0,.22)}}
.t{{position:absolute;left:56px;top:118px;color:#e8eef2}}
h1{{font:800 112px/0.9 BS;letter-spacing:.015em;margin:0;text-transform:uppercase;text-shadow:0 0 18px rgba(242,165,65,.18)}}
p{{font:500 22px/1.35 PM;color:#f2a541;margin:24px 0 0;letter-spacing:.02em}}
</style><div class="wrap"><div class="glow"></div><div class="art">{art}</div><div class="scan">{scan}</div><div class="t"><h1>Global<br>Ideology</h1><p>Spread an idea across the world.</p></div></div>'''


def png(page, html, w, h, path, transparent=False):
    page.set_viewport_size({'width': w, 'height': h})
    page.set_content(html if html.lstrip().startswith('<!doctype') else f'<!doctype html><body style="margin:0;background:{"transparent" if transparent else INK}">{html}</body>')
    page.wait_for_timeout(250)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    page.screenshot(path=path, omit_background=transparent, clip={'x': 0, 'y': 0, 'width': w, 'height': h})


def main():
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox', '--allow-file-access-from-files'])
        pg = b.new_page(device_scale_factor=1)
        tmp = tempfile.mkdtemp()
        # web / PWA / store icons: full-bleed squares (the store and the launcher apply their own mask)
        for size, out in [(512, 'icons/icon-512.png'), (192, 'icons/icon-192.png'), (512, 'icons/icon-maskable-512.png'), (512, 'store/icon-512.png')]:
            png(pg, icon_svg(pg, size), size, size, os.path.join(ROOT, out))
        open(os.path.join(ROOT, 'icons', 'icon.svg'), 'w').write(icon_svg(pg, 512).replace(' width="512" height="512"', ''))
        # Play feature graphic
        html = feature_html(pg); f = os.path.join(tmp, 'feature.html'); open(f, 'w').write(html)
        pg.set_viewport_size({'width': 1024, 'height': 500}); pg.goto('file://' + f); pg.wait_for_timeout(500)
        pg.screenshot(path=os.path.join(ROOT, 'store', 'feature-1024x500.png'), clip={'x': 0, 'y': 0, 'width': 1024, 'height': 500})
        # Android launcher resources
        res = os.path.join(ROOT, 'android-res')
        for dens, base in [('mdpi', 48), ('hdpi', 72), ('xhdpi', 96), ('xxhdpi', 144), ('xxxhdpi', 192)]:
            d = os.path.join(res, f'mipmap-{dens}')
            png(pg, legacy_svg(pg, base, False), base, base, os.path.join(d, 'ic_launcher.png'), True)
            png(pg, legacy_svg(pg, base, True), base, base, os.path.join(d, 'ic_launcher_round.png'), True)
            fgs = base * 108 // 48
            png(pg, fg_svg(pg, fgs), fgs, fgs, os.path.join(d, 'ic_launcher_foreground.png'), True)
        os.makedirs(os.path.join(res, 'values'), exist_ok=True)
        open(os.path.join(res, 'values', 'ic_launcher_background.xml'), 'w').write(f'<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">{INK}</color>\n</resources>\n')
        # splash: dark ground, the icon in the middle (same sizes the Capacitor template uses)
        mark = os.path.join(tmp, 'mark.png'); png(pg, fg_svg(pg, 432), 432, 432, mark, True)
        mk = Image.open(mark).convert('RGBA')
        for d, (w, h) in {'drawable': (480, 320), 'drawable-land-mdpi': (480, 320), 'drawable-land-hdpi': (800, 480), 'drawable-land-xhdpi': (1280, 720), 'drawable-land-xxhdpi': (1600, 960), 'drawable-land-xxxhdpi': (1920, 1280),
                          'drawable-port-mdpi': (320, 480), 'drawable-port-hdpi': (480, 800), 'drawable-port-xhdpi': (720, 1280), 'drawable-port-xxhdpi': (960, 1600), 'drawable-port-xxxhdpi': (1280, 1920)}.items():
            im = Image.new('RGBA', (w, h), INK); s = int(min(w, h) * 0.66); m2 = mk.resize((s, s), Image.LANCZOS)
            im.alpha_composite(m2, ((w - s) // 2, (h - s) // 2)); os.makedirs(os.path.join(res, d), exist_ok=True); im.convert('RGB').save(os.path.join(res, d, 'splash.png'), optimize=True)
        b.close()
    print('assets written')


if __name__ == '__main__':
    main()
