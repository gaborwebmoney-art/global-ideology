"""Embed the world map into index.html: terrain/terrain.json (territory paths, 1024x596) + terrain/map.webp (2048x1192, no borders/labels).
usage: python3 tools/embed-map.py   (then: node tools/i18n-build.js && python3 tools/csp.py)
The image is inlined as a data: URI so every flavour (web, itch zip, Android www) works offline with no extra files."""
import json, base64, re
T = json.load(open('terrain/terrain.json'))
img = 'data:image/webp;base64,' + base64.b64encode(open('terrain/map.webp', 'rb').read()).decode()
obj = {'w': T['w'], 'h': T['h'], 'img': img, 'territories': T['territories']}
line = '  const TERRAIN = ' + json.dumps(obj, separators=(',', ':')) + ';'
h = open('index.html', encoding='utf-8').read()
new, n = re.subn(r'^  const TERRAIN = \{.*\};$', lambda m: line, h, count=1, flags=re.M)
assert n == 1, 'TERRAIN line not found'
open('index.html', 'w', encoding='utf-8').write(new)
print('map embedded:', len(line) // 1024, 'KB')
