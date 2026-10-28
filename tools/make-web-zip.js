#!/usr/bin/env node
// v10.24: builds the web game as an upload zip for a hosted portal.  Usage: node tools/make-web-zip.js [itch]
// Output: dist/global-ideology-<platform>-v<VERSION>.zip with index.html at the root (itch.io's rule), relative paths only.
// The flavour is written into <meta name="gi-platform">; on itch the offline service worker and the PWA manifest are left out
// (an itch iframe origin is shared by many games; a worker there would only serve stale copies).
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
const platform = process.argv[2] || 'itch';
if (!['itch'].includes(platform)) { console.error('[x] unknown platform: ' + platform); process.exit(1); }
const ver = fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim();
const stage = path.join(root, 'dist', platform), zip = path.join(root, 'dist', `global-ideology-${platform}-v${ver}.zip`);
fs.rmSync(stage, { recursive: true, force: true }); fs.mkdirSync(stage, { recursive: true });

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const meta = '<meta name="gi-platform" content="web">';
if (!html.includes(meta)) { console.error('[x] gi-platform meta not found in index.html'); process.exit(1); }
html = html.replace(meta, `<meta name="gi-platform" content="${platform}">`);
html = html.replace(/<link rel="manifest"[^>]*>\s*/g, '');                       // no install prompt inside a portal iframe
html = html.replace(/<small id="giVer">[^<]*<\/small>/, `<small id="giVer">v${ver}</small>`);
if (/\shref="\/|\ssrc="\//.test(html)) { console.error('[x] absolute paths found; itch needs relative ones'); process.exit(1); }
fs.writeFileSync(path.join(stage, 'index.html'), html);
for (const d of ['fonts', 'icons', 'audio']) fs.cpSync(path.join(root, d), path.join(stage, d), { recursive: true });

// limits from itch.io's HTML5 docs: <= 1000 files, <= 240-char paths, <= 200 MB per file, <= 500 MB in all
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : files.push(p); } })(stage);
const total = files.reduce((a, f) => a + fs.statSync(f).size, 0);
const longest = Math.max(...files.map(f => path.relative(stage, f).length));
if (files.length > 1000 || longest > 240 || total > 500e6) { console.error('[x] over itch.io limits', files.length, longest, total); process.exit(1); }
fs.rmSync(zip, { force: true });
execFileSync('zip', ['-q', '-r', '-X', zip, '.'], { cwd: stage });
console.log(`[ok] ${path.relative(root, zip)}  ${files.length} files, ${(total / 1048576).toFixed(2)} MB unpacked, ${(fs.statSync(zip).size / 1048576).toFixed(2)} MB zipped`);
