"""Build the artifact page and the standalone index.html (with a hash-based Content-Security-Policy).
usage: python3 build.py [out.html] [supabase_url] [publishable_key] [turnstile_site_key]"""
import sys, re, base64, hashlib, json
args = sys.argv[1:] + [None] * 4
out, url, key, ts = args[0] or 'global-ideology.html', args[1] or '', args[2] or '', args[3] or ''
sim = open('sim.js').read(); code = sim[sim.index('// SIM-START'):sim.index('// SIM-END')]
acc = open('accounts.js').read()
cfg = "const GI_BACKEND = { url: '', key: '', turnstile: '' };"
assert cfg in acc
if url: acc = acc.replace(cfg, 'const GI_BACKEND = ' + json.dumps({'url': url, 'key': key, 'turnstile': ts}) + ';')
T = json.load(open('terrain/terrain.json'))
terrain = 'const TERRAIN = ' + json.dumps({k: T[k] for k in ('land', 'shelf1', 'shelf2', 'territories', 'borders', 'peaks')}, separators=(',', ':')) + ';'
page = open('template.html').read().replace('/*SIM*/', code).replace('/*ACCOUNTS*/', acc).replace('/*TERRAIN*/', terrain)
open(out, 'w').write(page)
if out == 'global-ideology.html':
    hashes = ["'sha256-%s'" % base64.b64encode(hashlib.sha256(m.encode()).digest()).decode() for m in re.findall(r'<script>([\s\S]*?)</script>', page)]
    connect = url or "'none'"
    csp = ("default-src 'none'; script-src %s https://challenges.cloudflare.com; style-src 'unsafe-inline' https://fonts.googleapis.com; "
           "font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src %s; frame-src https://challenges.cloudflare.com; "
           "base-uri 'none'; form-action 'none'; object-src 'none'") % (' '.join(hashes), connect)
    i = page.index('</style>') + len('</style>')
    head = ('<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            '<meta http-equiv="Content-Security-Policy" content="%s">\n<meta name="referrer" content="no-referrer">\n' % csp)
    open('index.html', 'w').write(head + page[:i] + '\n</head>\n<body>\n' + page[i:].lstrip() + '\n</body>\n</html>\n')
