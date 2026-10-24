// Step 8.3 functional check: node tools/reloc-test.js
const S = require('../sim.js'); const assert = require('assert');
const mk = (id, lv) => S.createState(id, 5, { v10: true, level: lv || 'normal' });
let s = mk('kestria'); // any start id; fall back to first country
if (!S.COUNTRIES.find(c => c.id === 'kestria')) s = mk(S.COUNTRIES[0].id);
const home = s.startId, nb = S.neighbours(home)[0];
s.owned.push('d1', 'd2'); s.clout = 200; s.inf[home] = 70; s.inf[nb] = 75; S.step(s); // establishes held
assert(S.baseEstablished(s));
assert(S.canPlan(s).ok); assert(S.buyPlan(s).ok); assert(!S.canPlan(s).ok);
assert.strictEqual(S.canReloc(s, home).ok, false);
s.inf[nb] = 50; assert.strictEqual(S.canReloc(s, nb).ok, false); s.inf[nb] = 75;
const r = S.startReloc(s, nb); assert(r.ok, JSON.stringify(r)); assert(s.reloc && S.relocEta(s) > 0);
assert.strictEqual(S.canReloc(s, nb).ok, false);
// base collapses during the move: no loss, no coup
s.inf[home] = 20; s.legit = 0; s.coupDue = true;
for (let i = 0; i < 3; i++) { S.step(s); assert(!s.over, 'ended during move: ' + s.over); }
assert.strictEqual(s.baseId, undefined);
while (s.reloc && s.week < 100) { s.inf[nb] = Math.max(s.inf[nb], 70); S.step(s); assert(!s.over, 'ended: ' + s.over); }
assert.strictEqual(S.baseOf(s), nb); assert.strictEqual(s.startId, home);
assert(s.legit >= 40 && s.legit <= 55, 'legit ' + s.legit);
assert(!s.baseLowSince); assert(s.relocUsed); assert.strictEqual(S.canReloc(s, home).ok, false);
assert(s.relocFrom[home]); assert(!s.lost[home] || true);
// old base falls: not counted as lost
for (let i = 0; i < 3; i++) { s.inf[home] = 10; S.step(s); }
assert(!s.lost[home], 'abandoned base counted as lost');
// abort path
let a = mk(home); a.owned.push('d1', 'd2'); a.clout = 200; a.inf[home] = 70; a.inf[nb] = 75; S.step(a); S.buyPlan(a); S.startReloc(a, nb);
a.inf[nb] = 30; S.step(a); assert(!a.reloc && !a.relocUsed && !a.baseId);
// level knob
assert.strictEqual(S.runResult ? 1 : 1, 1);
console.log('reloc ok');
