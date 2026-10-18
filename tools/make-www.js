// Copies the web game into www/ (what Capacitor packages into the APK). Only runtime files, no dev files.
const fs = require('fs'), path = require('path');
const out = path.join(__dirname, '..', 'www'), root = path.join(__dirname, '..');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
['index.html', 'manifest.webmanifest', 'sw.js'].forEach(f => fs.copyFileSync(path.join(root, f), path.join(out, f)));
['fonts', 'icons'].forEach(d => fs.cpSync(path.join(root, d), path.join(out, d), { recursive: true }));
console.log('www/ ready:', fs.readdirSync(out).join(', '));
