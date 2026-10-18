"""Recompute the inline-script hashes in index.html's Content-Security-Policy.
Run after ANY edit to an inline <script> in index.html:  python3 tools/csp.py"""
import re, base64, hashlib
p = 'index.html'; s = open(p).read()
hashes = ["'sha256-%s'" % base64.b64encode(hashlib.sha256(m.encode()).digest()).decode() for m in re.findall(r'<script>([\s\S]*?)</script>', s)]
m = re.search(r'(script-src )((?:\'sha256-[^\']+\' )+)(https://challenges\.cloudflare\.com)', s)
assert m, 'script-src not found'
s = s[:m.start()] + m.group(1) + ' '.join(hashes) + ' ' + m.group(3) + s[m.end():]
s = s.replace('style-src \'unsafe-inline\' https://fonts.googleapis.com; font-src https://fonts.gstatic.com;', "style-src 'unsafe-inline'; font-src 'self';")
if 'manifest-src' not in s:
    s = s.replace("base-uri 'none';", "manifest-src 'self'; worker-src 'self'; base-uri 'none';", 1)
open(p, 'w').write(s); print(len(hashes), 'script hashes written')
