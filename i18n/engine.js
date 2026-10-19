// Language layer. The game code stays English; text is translated as it reaches the page.
// Data (exact strings + {}-patterns) is injected by tools/i18n-build.js from i18n/hu.tsv.
(() => {
  const DATA = /*I18N_DATA*/ null;
  const EXACT = new Map(Object.entries(DATA.exact));
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const PATS = DATA.pat.map(([en, hu]) => ({ re: new RegExp('^' + en.split('{}').map(esc).join('([\\s\\S]+?)') + '$'), hu, len: en.replace(/\{\}/g, '').length }))
    .sort((a, b) => b.len - a.len);
  const ATTRS = ['title', 'aria-label', 'placeholder', 'alt'];
  const KEY = 'gi.lang';
  let lang = 'en';
  try { const v = localStorage.getItem(KEY); lang = v === 'hu' || v === 'en' ? v : (/^hu/i.test(navigator.language || '') ? 'hu' : 'en'); } catch (e) { /* storage blocked */ }

  const NAME = /^[A-Z][A-Za-z’']*( [A-Z][A-Za-z’']*)*$/;
  const cache = new Map(), misses = new Set();
  function core(s) {
    if (EXACT.has(s)) return EXACT.get(s);
    for (const p of PATS) { const m = p.re.exec(s); if (m) return p.hu.replace(/\{(\d+)\}/g, (_, i) => tr(m[i])); }
    if (!/[A-Za-z]{2}/.test(s)) return s;
    const dots = s.split(' · ');
    if (dots.length > 1) { const o = dots.map(tr); if (o.some((x, i) => x !== dots[i])) return o.join(' · '); }
    const pre = /^([▲▼★] )([\s\S]+)$/.exec(s);
    if (pre) { const r = tr(pre[2]); if (r !== pre[2]) return pre[1] + r; }
    const col = /^([^:.!?]{2,60}): ([\s\S]+)$/.exec(s);
    if (col) { const a = tr(col[1]); if (a !== col[1]) return a + ': ' + tr(col[2]); }
    const sents = s.split(/(?<=[.!?”])\s+(?=[A-Z“"–−+(\d])/);
    if (sents.length > 1) { const o = sents.map(tr); if (o.some((x, i) => x !== sents[i])) return o.join(' '); }
    const ands = s.split(' and ');
    if (ands.length > 1) { const o = ands.map(tr); if (o.some((x, i) => x !== ands[i]) && o.every((x, i) => x !== ands[i] || NAME.test(ands[i]))) return o.join(' és '); if (ands.every(x => NAME.test(x))) return ands.join(' és '); }
    return null;
  }
  function tr(str) {
    if (!str) return str;
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(str); const c = m[2].replace(/\s+/g, ' '); if (!c) return str;
    let r = cache.get(c);
    if (r === undefined) { r = core(c); if (r === null) { misses.add(c); r = c; } cache.set(c, r); }
    return m[1] + r + m[3];
  }
  const T = s => (lang === 'hu' ? tr(s) : s);

  const textRec = new WeakMap(), attrRec = new WeakMap();
  function xText(n) {
    const v = n.nodeValue, rec = textRec.get(n);
    if (rec && rec.out === v) return;
    const p = n.parentNode; if (p && (p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE')) return;
    if (!v || !v.trim()) return;
    const out = tr(v); textRec.set(n, { en: v, out }); if (out !== v) n.nodeValue = out;
  }
  function xAttrs(el) {
    if (!el.getAttribute) return;
    for (const a of ATTRS) {
      const v = el.getAttribute(a); if (v == null) continue;
      let m = attrRec.get(el); if (!m) { m = {}; attrRec.set(el, m); }
      const rec = m[a]; if (rec && rec.out === v) continue;
      const out = tr(v); m[a] = { en: v, out }; if (out !== v) el.setAttribute(a, out);
    }
  }
  function walk(root, fn) {
    if (root.nodeType === 3) return fn.t(root);
    if (root.nodeType !== 1) return;
    fn.a(root);
    const w = document.createTreeWalker(root, 5); let n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) fn.t(n); else fn.a(n); }
  }
  const toHu = { t: xText, a: xAttrs };
  const toEn = {
    t(n) { const r = textRec.get(n); if (r && r.out === n.nodeValue && r.en !== r.out) n.nodeValue = r.en; textRec.delete(n); },
    a(el) { const m = attrRec.get(el); if (!m) return; for (const a in m) { if (el.getAttribute(a) === m[a].out && m[a].en !== m[a].out) el.setAttribute(a, m[a].en); } attrRec.delete(el); }
  };
  let obs = null;
  function watch(on) {
    if (obs) { obs.disconnect(); obs = null; }
    if (!on) return;
    obs = new MutationObserver(list => {
      for (const m of list) {
        if (m.type === 'childList') m.addedNodes.forEach(n => walk(n, toHu));
        else if (m.type === 'characterData') xText(m.target);
        else if (m.type === 'attributes') xAttrs(m.target);
      }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  function paint() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  }
  function setLang(l, save) {
    if (l !== 'en' && l !== 'hu') return;
    const was = lang; lang = l;
    if (save !== false) { try { localStorage.setItem(KEY, l); } catch (e) { /* ignore */ } }
    watch(false);
    walk(document.body, l === 'hu' ? toHu : toEn);
    document.title = l === 'hu' ? tr(document.title) : 'Global Ideology';
    watch(l === 'hu'); paint();
    if (was !== l) window.dispatchEvent(new CustomEvent('gi-lang', { detail: l }));
  }
  window.GI_I18N = { setLang, lang: () => lang, tr: T, misses };
  const boot = () => {
    document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-lang]'); if (b) setLang(b.dataset.lang); });
    paint(); if (lang === 'hu') { walk(document.body, toHu); watch(true); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
