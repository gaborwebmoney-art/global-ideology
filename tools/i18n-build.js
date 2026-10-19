#!/usr/bin/env node
// Builds the language layer into index.html.  Usage: node tools/i18n-build.js   (then: python3 tools/csp.py)
// Source of truth: i18n/engine.js (code) and i18n/hu.tsv (English<TAB>Hungarian, one pair per line).
// "{}" in the English side matches any text; the Hungarian side refers to captures as {1}, {2}, ...
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const rows = fs.readFileSync(path.join(root, 'i18n/hu.tsv'), 'utf8').split('\n').filter(l => l && !l.startsWith('#')).map(l => l.split('\t'));
const exact = {}, pat = [], errs = [];
const add = (en, hu) => {
  const n = (en.match(/\{\}/g) || []).length, m = new Set((hu.match(/\{(\d+)\}/g) || []));
  if (m.size > n || [...m].some(x => +x.slice(1, -1) > n)) errs.push('placeholder mismatch: ' + en);
  if (n) pat.push([en, hu]); else exact[en] = hu;
};
for (const [en, hu] of rows) {
  if (!en || hu === undefined) { errs.push('bad row: ' + en); continue; }
  add(en, hu);
  const sa = 'Special action: ', hsa = 'Különleges akció: ';   // the UI strips this prefix before display
  if (en.startsWith(sa) && hu.startsWith(hsa)) add(en.slice(sa.length), hu.slice(hsa.length));
}
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
const data = JSON.stringify({ exact, pat }).replace(/<\/script/gi, '<\\/script');
const code = fs.readFileSync(path.join(root, 'i18n/engine.js'), 'utf8').replace('/*I18N_DATA*/ null', () => data);
const block = '<!--I18N-START--><script>\n' + code + '</script><!--I18N-END-->';
let out;
if (html.includes('<!--I18N-START-->')) out = html.replace(/<!--I18N-START-->[\s\S]*?<!--I18N-END-->/, () => block);
else out = html.replace(/<script>\n\/\/ Android\/PWA glue/, m => block + '\n' + m);
if (out === html && !html.includes('<!--I18N-START-->')) { console.error('insertion point not found'); process.exit(1); }
fs.writeFileSync(path.join(root, 'index.html'), out);
console.log('i18n: %d exact, %d patterns, %d bytes', Object.keys(exact).length, pat.length, data.length);
