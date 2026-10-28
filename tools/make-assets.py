"""Regenerates the app icon set, Play store graphics and Android launcher/splash resources from one drawing.
Original artwork (map outline from the game's own TERRAIN data + amber influence rings). To use different artwork, replace the
`icon_svg()` / `fg_svg()` functions or drop finished PNGs over the outputs listed below.
usage: python3 tools/make-assets.py
writes: icons/icon.svg icons/icon-192.png icons/icon-512.png icons/icon-maskable-512.png
        store/icon-512.png store/feature-1024x500.png
        android-res/ (mipmap-*, drawable*/splash.png, values/ic_launcher_background.xml)   (copied into android/ by tools/android-prepare.js)"""
import json, os, re, sys, tempfile
from playwright.sync_api import sync_playwright
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
CHROME = os.environ.get('GI_CHROME', '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
INK, AMBER = '#0d1820', '#f2a541'
T = json.loads(re.search(r'const TERRAIN = (\{.*?\});\n', open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read(), re.S).group(1))
CX, CY, CROP = 610, 250, 640            # map point that sits at the icon centre, and the map width shown across the icon


def terrain(size, shelf=True):
    k = size / CROP
    tr = f'translate({size / 2 - CX * k:.2f} {size / 2 - CY * k:.2f}) scale({k:.4f})'
    sw = 1 / k
    return (f'<g transform="{tr}">'
            + (f'<path d="{T["shelf1"]}" fill="none" stroke="#2b4a60" stroke-width="{2.4 * sw:.2f}"/>' if shelf else '')
            + f'<path d="{T["land"]}" fill="#26424f" fill-rule="evenodd" stroke="#5b8196" stroke-width="{2.2 * sw:.2f}" stroke-linejoin="round"/></g>')


def rings(size, scale=1.0):
    c, u = size / 2, size / 512 * scale
    return (f'<circle cx="{c}" cy="{c}" r="{170 * u}" fill="none" stroke="{AMBER}" stroke-width="{9 * u}" opacity=".28" stroke-dasharray="{26 * u} {18 * u}"/>'
            f'<circle cx="{c}" cy="{c}" r="{118 * u}" fill="none" stroke="{AMBER}" stroke-width="{13 * u}" opacity=".6"/>'
            f'<circle cx="{c}" cy="{c}" r="{68 * u}" fill="none" stroke="{AMBER}" stroke-width="{16 * u}" opacity=".95"/>'
            f'<circle cx="{c}" cy="{c}" r="{26 * u}" fill="{AMBER}"/>')


def grid(size):
    q = size / 4
    return f'<g fill="none" stroke="#1c3140" stroke-width="{size / 128}">' + ''.join(f'<path d="M{q * i} 0V{size}M0 {q * i}H{size}"/>' for i in (1, 2, 3)) + '</g>'


def icon_svg(size=512):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}"><defs>'
            f'<radialGradient id="g" cx="50%" cy="50%" r="75%"><stop offset="0" stop-color="#1d3646"/><stop offset="1" stop-color="#091218"/></radialGradient></defs>'
            f'<rect width="{size}" height="{size}" fill="url(#g)"/>{grid(size)}{terrain(size)}{rings(size)}</svg>')


def fg_svg(size):
    """Adaptive-icon foreground: transparent, artwork inside the 66/108 safe disc."""
    r = size * 33 / 108
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}"><defs><clipPath id="c"><circle cx="{size / 2}" cy="{size / 2}" r="{r}"/></clipPath></defs>'
            f'<circle cx="{size / 2}" cy="{size / 2}" r="{r}" fill="#122431"/><g clip-path="url(#c)">{terrain(size * 0.64 / 0.64, False)}</g>'
            f'<g transform="translate({size / 2 * (1 - 0.6):.2f} {size / 2 * (1 - 0.6):.2f}) scale(.6)">{rings(size)}</g></svg>')


def legacy_svg(size, round_):
    body = icon_svg(512)
    clip = '<circle cx="256" cy="256" r="256"/>' if round_ else '<rect width="512" height="512" rx="96"/>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="{size}" height="{size}"><defs><clipPath id="m">{clip}</clipPath></defs>'
            f'<g clip-path="url(#m)">{body.split("</defs>", 1)[1].rsplit("</svg>", 1)[0].replace("url(#g)", "url(#g2)")}</g>'
            f'<defs><radialGradient id="g2" cx="50%" cy="50%" r="75%"><stop offset="0" stop-color="#1d3646"/><stop offset="1" stop-color="#091218"/></radialGradient></defs></svg>')


def feature_html():
    font = 'file://' + os.path.join(ROOT, 'fonts', 'big-shoulders-display-latin-800-normal.woff2')
    mono = 'file://' + os.path.join(ROOT, 'fonts', 'ibm-plex-mono-latin-500-normal.woff2')
    art = icon_svg(500).replace('width="500" height="500"', 'width="500" height="500"')
    return f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:BS;src:url({font});font-weight:800}} @font-face{{font-family:PM;src:url({mono});font-weight:500}}
html,body{{margin:0;width:1024px;height:500px;background:{INK};overflow:hidden}}
.wrap{{position:relative;width:1024px;height:500px;background:linear-gradient(90deg,#0a141b 0%,#0d1820 45%,#13232d 100%)}}
.art{{position:absolute;right:0;top:0;width:500px;height:500px;-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 38%);}}
.t{{position:absolute;left:56px;top:128px;color:#e8eef2}}
h1{{font:800 108px/0.92 BS;letter-spacing:.01em;margin:0;text-transform:uppercase}}
p{{font:500 26px/1.35 PM;color:#f2a541;margin:22px 0 0;letter-spacing:.02em}}
</style><div class="wrap"><div class="art">{art}</div><div class="t"><h1>Global<br>Ideology</h1><p>Spread an idea across the world.</p></div></div>'''


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
            png(pg, icon_svg(512).replace('width="512" height="512"', f'width="{size}" height="{size}"'), size, size, os.path.join(ROOT, out))
        open(os.path.join(ROOT, 'icons', 'icon.svg'), 'w').write(icon_svg(512).replace(' width="512" height="512"', ''))
        # Play feature graphic
        html = feature_html(); f = os.path.join(tmp, 'feature.html'); open(f, 'w').write(html)
        pg.set_viewport_size({'width': 1024, 'height': 500}); pg.goto('file://' + f); pg.wait_for_timeout(500)
        pg.screenshot(path=os.path.join(ROOT, 'store', 'feature-1024x500.png'), clip={'x': 0, 'y': 0, 'width': 1024, 'height': 500})
        # Android launcher resources
        res = os.path.join(ROOT, 'android-res')
        for dens, base in [('mdpi', 48), ('hdpi', 72), ('xhdpi', 96), ('xxhdpi', 144), ('xxxhdpi', 192)]:
            d = os.path.join(res, f'mipmap-{dens}')
            png(pg, legacy_svg(base, False), base, base, os.path.join(d, 'ic_launcher.png'), True)
            png(pg, legacy_svg(base, True), base, base, os.path.join(d, 'ic_launcher_round.png'), True)
            fgs = base * 108 // 48
            png(pg, fg_svg(fgs), fgs, fgs, os.path.join(d, 'ic_launcher_foreground.png'), True)
        os.makedirs(os.path.join(res, 'values'), exist_ok=True)
        open(os.path.join(res, 'values', 'ic_launcher_background.xml'), 'w').write(f'<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">{INK}</color>\n</resources>\n')
        # splash: dark ground, the icon in the middle (same sizes the Capacitor template uses)
        mark = os.path.join(tmp, 'mark.png'); png(pg, fg_svg(432), 432, 432, mark, True)
        mk = Image.open(mark).convert('RGBA')
        for d, (w, h) in {'drawable': (480, 320), 'drawable-land-mdpi': (480, 320), 'drawable-land-hdpi': (800, 480), 'drawable-land-xhdpi': (1280, 720), 'drawable-land-xxhdpi': (1600, 960), 'drawable-land-xxxhdpi': (1920, 1280),
                          'drawable-port-mdpi': (320, 480), 'drawable-port-hdpi': (480, 800), 'drawable-port-xhdpi': (720, 1280), 'drawable-port-xxhdpi': (960, 1600), 'drawable-port-xxxhdpi': (1280, 1920)}.items():
            im = Image.new('RGBA', (w, h), INK); s = int(min(w, h) * 0.66); m2 = mk.resize((s, s), Image.LANCZOS)
            im.alpha_composite(m2, ((w - s) // 2, (h - s) // 2)); os.makedirs(os.path.join(res, d), exist_ok=True); im.convert('RGB').save(os.path.join(res, d, 'splash.png'), optimize=True)
        b.close()
    print('assets written')


if __name__ == '__main__':
    main()
