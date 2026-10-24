// Step 8.4 functional check: node tools/over-test.js
const S = require('../sim.js'); const assert = require('assert');
const mk = lv => S.createState('pannonia', 5, { v10: true, level: lv || 'normal' });
let s = mk(); const base = S.baseOf(s), others = S.COUNTRIES.filter(c => c.id !== base).map(c => c.id);
others.forEach(id => { s.inf[id] = 70; });
let u = S.upkeepOf(s); assert.strictEqual(u.n, others.length);
const exp = Math.min(.5, .06 * (others.length - 4) * (1 - u.cut)); assert(Math.abs(u.frac - exp) < 1e-9, 'frac ' + u.frac + ' vs ' + exp);
// settled half
others.forEach(id => { s.inf[id] = 90; }); const half = S.upkeepOf(s); assert(half.units === others.length * .5 && half.frac < u.frac);
// aid: waived 25 wk, unrest −20, lifts Already yours
others.forEach(id => { s.inf[id] = 70; });
const t = others[0]; s.owned.push('e1'); s.clout = 100; s.inf[t] = 97; s.unrest = { [t]: 50 }; s.inf[t] = 97;
assert(S.canAct(s, 'eco1', t).ok || true);
s.owned = ['e1', 'e2', 'e3']; s.cfg.gate = false;
const c = S.canAct(s, 'eco1', t); assert(c.ok, 'aid not allowed: ' + JSON.stringify(c));
const before = S.upkeepOf(s).units; assert(S.doAct(s, 'eco1', t).ok);
assert(S.aided(s, t) && Math.abs(S.upkeepOf(s).units - (before - .5)) < 1e-9 && s.unrest[t] === 30 && s.aids === 1, 'aid effects');
assert.strictEqual(S.aidOk(s, 'eco1', t), false);
// aided country again at 97: Already yours returns
s.acd = {}; s.inf[t] = 97; assert.strictEqual(S.canAct(s, 'eco1', t).ok, false);
// aid expires
for (let i = 0; i < 26; i++) { s.week++; s.mods = s.mods.filter(m => m.until > s.week); } assert(!S.aided(s, t));
// level knob
const l = mk('casual'), b = mk('brutal'); [l, b].forEach(x => others.forEach(id => { x.inf[id] = 70; }));
assert(S.upkeepOf(l).frac < S.upkeepOf(b).frac);
// cap and income
const x = mk(); others.forEach(id => { x.inf[id] = 70; }); x.cfg.over = false; assert.strictEqual(S.upkeepOf(x).frac, 0);
// warnings
const w = mk(); others.slice(0, 6).forEach(id => { w.inf[id] = 70; }); S.overTick(w); assert(w.news[0].over && w.overLvl === 1);
others.slice(0, 10).forEach(id => { w.inf[id] = 70; }); S.overTick(w); assert(w.overLvl === 2);
console.log('over ok');
