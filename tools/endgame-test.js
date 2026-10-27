// Endgame functional check: 9.1 (v10.19) Breakup, capitulation timing, Terms, both win paths, losses before/after the Breakup,
// old saves; v10.20 Ultimatum + notoriety until the Breakup; 9.2 (v10.21) Grand Coalition. usage: node tools/endgame-test.js
// Sections 1-9 run with the Grand Coalition off (cfg.eg.gcMin 99) so they test 9.1 rules alone.
const S = require('../sim.js'); const assert = require('assert');
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
const ids = S.COUNTRIES.map(c => c.id);
const mk = (lv, start, gc) => S.createState(start || 'pannonia', 7, Object.assign({ v10: true, level: lv || 'normal', random: false }, gc ? {} : { eg: { gcMin: 99 } }));
// a running World Order with the treaty hopeless for 25 weeks; `low` stay below the signing line so the step can count to 26
function nearBreakup(lv, gc) {
  const s = mk(lv, null, gc); s.notoriety = 30; S.step(s); assert(s.coalition, 'WO should convene');
  const low = ['sinopeia', 'juche', 'bharat'];
  ids.forEach(id => { s.inf[id] = low.includes(id) ? 30 : 70; });
  s.wo.signed = {}; s.wo.hopeless = 25; s.legit = 90; s.wary = s.wary || {};
  return s;
}

// 1. Breakup triggers, the game goes on
{
  const s = nearBreakup(); const members = Object.keys(s.wo.members); const noto0 = s.notoriety;
  S.step(s);
  ok(s.broken === s.week && !s.over, 'breakup happens and the game continues: ' + s.over);
  ok(!s.coalition && !Object.keys(s.wo.members).length && !Object.keys(s.wo.signed).length && s.wo.hq === null && s.treaty === 0, 'WO dissolved');
  ok(s.wo.formerMembers.length === members.length && members.every(id => s.wary[id] === 50 || s.wary[id] < 50), 'freed members wary 50 (then decaying)');
  ok(s.notoriety <= Math.max(0, noto0 + 2 - 20) + 1e-9, 'notoriety -20');
  const nw = s.news.find(x => x.tag === 'Breakup'); ok(nw && nw.level === 'critical' && nw.endgame, 'breakup news is critical, GATE tag, endgame flag');
  for (let i = 0; i < 30 && !s.over; i++) { S.step(s); }
  ok(!s.coalition, 'the World Order never reconvenes after the Breakup');
}
// 2. the old 70% win is gone; new wins: every country held, or 90% aligned
{
  const s = mk(); ids.forEach(id => { s.inf[id] = 72; }); s.inf.pinguinia = 10; s.legit = 90; S.step(s);
  ok(S.alignedShare(s) >= .7 && S.alignedShare(s) < .9 && !s.over, '70%+ aligned is no longer a win: ' + s.over);
  const h = mk(); ids.forEach(id => { h.inf[id] = 75; }); h.legit = 90; S.step(h);
  ok(h.over === 'win' && h.winType === 'held', 'all 16 held = win (held), share ' + S.alignedShare(h).toFixed(2));
  const r = S.runResult(h); ok(r.win && r.winType === 'held' && r.stars >= 1, 'runResult win/held');
  const w = mk(); ids.forEach(id => { w.inf[id] = 96; }); w.inf.pinguinia = 5; w.inf.isolde = 5; w.legit = 90; S.step(w);
  ok(w.over === 'win' && w.winType === 'share', 'share >= 90% = win (share) even with countries not held');
  const k = S.createState('pannonia', 7, { v10: true, level: 'normal', random: false, winShare: .8, eg: { gcMin: 99 } }); ids.forEach(id => { k.inf[id] = 85; }); k.inf.pinguinia = 5; k.legit = 90; S.step(k);
  ok(k.over === 'win' && k.winType === 'share', 'cfg.winShare override still works');
}
// 3. capitulation timing (6 weeks in a row eligible), reasons
{
  const s = nearBreakup(); S.step(s); assert(s.broken);
  const t = 'kestria'; s.inf[t] = 42; s.wary[t] = 0; s.al = { list: [], next: 1 };
  ok(S.capWhy(s, t) === null && S.capEta(s, t) === 6, 'eligible, capitulates in 6 wk: ' + S.capWhy(s, t) + ' ' + S.capEta(s, t));
  let wk = null;
  for (let i = 1; i <= 6; i++) { s.inf[t] = Math.min(s.inf[t], 45); s.wary[t] = 0; S.step(s); if (s.inf[t] >= 90 && wk === null) wk = i; }
  ok(wk === 6 && s.capit.auto === 1 && !(s.unrest || {})[t] && s.capLog[0].how === 'auto', 'capitulates on the 6th week: ' + wk);
  ok(s.news.some(x => x.tag === 'Capitulated' && x.id === t), 'capitulation news');
  // the streak resets when the country stops being eligible
  const u = 'tavaro'; s.inf[u] = 45; s.wary[u] = 0; S.step(s); S.step(s); s.wary[u] = 40; S.step(s); s.wary[u] = 0;
  ok(!s.capWk[u], 'streak reset by wariness'); ok(S.capWhy(s, u) === null, 'eligible again');
  s.wary[u] = 31; ok(S.capWhy(s, u) === 'wary', 'wary reason');
  s.inf[u] = 39; s.wary[u] = 0; ok(S.capWhy(s, u) === 'support', 'support reason');
  s.inf[u] = 65; ok(S.capWhy(s, u) === 'held', 'held reason');
  ok(S.capWhy(s, S.baseOf(s)) === 'base', 'base reason');
  s.inf[u] = 45; s.al = { list: [{ id: 'a9', name: 'Test Pact', leaderId: u, members: [u, 'koryn'], cohesion: 90, formed: 0, retUntil: 0 }], next: 10 };
  ok(S.capWhy(s, u) === 'allied', 'allied reason');
  // before the Breakup: off below 75%, on at 75%+, WO members excluded
  const p = mk(); p.notoriety = 30; S.step(p); ids.forEach(id => { p.inf[id] = 20; });
  ok(S.capWhy(p, 'kestria') === 'off', 'off before breakup and below 75%');
  ids.forEach(id => { p.inf[id] = 80; }); p.inf.kestria = 45; p.wary = { kestria: 0 }; const m = Object.keys(p.wo.members)[0]; p.inf[m] = 45;
  ok(S.capActive(p) && S.capWhy(p, 'kestria') === null && S.capWhy(p, m) === 'wo', 'active at 75%+, WO member excluded');
  p.legit = 90; S.step(p); ok(p.capOn && p.news.some(x => x.tag === 'Capitulation'), 'capitulation start news at 75%');
}
// 4. Terms: Summit on an eligible country capitulates it at once, normal cost and cooldown
{
  const s = nearBreakup(); S.step(s); assert(s.broken);
  s.owned.push('d1', 'd2'); s.clout = 100; s.acd = {}; const t = 'tavaro'; s.inf[t] = 44; s.wary[t] = 0; s.al = { list: [], next: 1 };
  const cost = S.actCost(s, S.ACTIONS.find(a => a.id === 'dip2')), c0 = s.clout;
  const r = S.doAct(s, 'dip2', t);
  ok(r.ok && (r.fizzled || (s.inf[t] >= 90 && s.capit.terms === 1)), 'Terms capitulates at once');
  ok(s.clout === c0 - cost && s.acd.dip2 > s.week, 'normal cost and cooldown');
  ok(!s.news.some(x => /^Summit/.test(x.text) && x.week === s.week), 'no extra Summit headline');
  s.acd = {}; const v = 'koryn'; s.inf[v] = 30; const before = s.mods.length;
  S.doAct(s, 'dip2', v); ok(s.inf[v] < 90 && s.mods.length > before && s.capit.terms === 1, 'ineligible country: ordinary Summit');
}
// 5. losses: the treaty/Enforcement loss only before the Breakup; coup still loses after it
{
  const s = mk(); s.notoriety = 30; S.step(s); ids.forEach(id => { s.inf[id] = 20; });
  S.populated().forEach(c => { s.wo.members[c.id] = true; s.wo.signed[c.id] = true; }); s.wo.ratifiedAt = s.week; s.legit = 90;
  S.step(s); ok(s.over === 'treaty', 'Enforcement loss before the Breakup: ' + s.over);
  const b = nearBreakup(); S.step(b); assert(b.broken);
  b.wo.ratifiedAt = 1; S.populated().forEach(c => { b.wo.signed[c.id] = true; }); b.inf.kestria = 1; S.step(b);
  ok(b.over !== 'treaty', 'no treaty loss after the Breakup: ' + b.over);
  b.wo.signed = {}; b.wo.ratifiedAt = 0; b.legit = 0; b.coupDue = true; b.guard = false; S.step(b);
  ok(b.over === 'coup', 'coup still loses after the Breakup: ' + b.over);
}
// 6. Continue playing / End game with the new win
{
  const h = mk(); ids.forEach(id => { h.inf[id] = 75; }); h.legit = 90; S.step(h); assert(h.over === 'win');
  ok(S.canContinue(h) && S.continuePlaying(h).ok && !h.over && h.cont.result.winType === 'held', 'continue after a held win');
  S.step(h); ok(!h.over, 'no instant re-win while continuing');
  ok(S.endEarly(h).ok && h.over === 'win' && S.runResult(h).win, 'End game after Continue = the earned win');
  const p = mk(); ids.forEach(id => { p.inf[id] = 75; }); p.legit = 90; S.step(p); S.continuePlaying(p); ids.forEach(id => { p.inf[id] = 100; }); S.step(p);
  ok(p.over === 'perfect' && S.runResult(p).win && S.runResult(p).winType === 'held', 'perfect after continue keeps the win type');
}
// 7. old saves (v10.17/18 shape): mid-run load does not crash; over='collapse' stays a win
{
  const s = mk(); s.notoriety = 30; for (let i = 0; i < 40; i++) { S.step(s); if (s.pending) S.resolveDecision(s, 'b'); }
  const old = JSON.parse(JSON.stringify(s));
  ['broken', 'capWk', 'capit', 'capLog', 'capOn', 'winType'].forEach(k => delete old[k]); delete old.wary; delete old.al; old.wo.hopeless = 20;
  for (let i = 0; i < 80 && !old.over; i++) { S.step(old); if (old.pending) S.resolveDecision(old, 'b'); }
  ok(old.week >= 120 || old.over, 'old mid-run save steps without crashing');
  ok(typeof S.capWhy(old, 'kestria') === 'string' || S.capWhy(old, 'kestria') === null, 'capWhy on old save');
  const c = JSON.parse(JSON.stringify(s)); c.over = 'collapse'; delete c.winType;
  const r = S.runResult(c); ok(r.win && r.winType === 'collapse' && r.stars >= 1, 'legacy collapse counts as a win');
  ok(S.canContinue(c), 'legacy collapse can continue');
  const cc = JSON.parse(JSON.stringify(s)); cc.cont = { week: 30, over: 'collapse', share: .6, result: S.runResult(c) }; S.endEarly(cc);
  ok(cc.over === 'collapse' && S.runResult(cc).win, 'legacy continued collapse ends as that win');
  // a save made with the treaty already failing reaches the Breakup, not a collapse ending
  const f = nearBreakup(); delete f.capWk; const g = JSON.parse(JSON.stringify(f)); S.step(g); ok(g.broken && !g.over, 'old failing-treaty save breaks up');
}
// 8. v10.20 Ultimatum: Snap Exercise on a capitulation-ready country, wariness does not stop it, not where Military reverses
{
  const s = nearBreakup(); S.step(s); assert(s.broken);
  s.owned.push('m1', 'm2'); s.cfg.gate = false; s.clout = 200; s.acd = {}; s.al = { list: [], next: 1 };
  const t = 'tavaro'; s.inf[t] = 45; s.wary[t] = 80;
  ok(S.capWhy(s, t) === 'wary' && S.ultimatumOk(s, t), 'ultimatum allowed on a wary country');
  const nb = S.neighbours(t).filter(x => s.inf[x] >= 25 && x !== S.baseOf(s)), u0 = nb.map(x => (s.unrest || {})[x] || 0);
  const r = S.doAct(s, 'mil2', t);
  ok(r.ok && s.inf[t] >= 90 && s.capit.ultimatum === 1 && s.wary[t] === 0, 'ultimatum capitulates at once');
  ok(nb.every((x, i) => ((s.unrest || {})[x] || 0) >= u0[i]), 'neighbours get unrest');
  ok(S.capCount(s) === 1 && s.news.some(x => x.tag === 'Capitulated' && /ultimatum/.test(x.text)), 'ultimatum news, counted');
  s.acd = {}; s.inf.kestria = 45; s.wary.kestria = 0;
  ok(!S.ultimatumOk(s, 'kestria'), 'no ultimatum where the Military wall reverses (Kestria)');
  s.inf.koryn = 30; ok(!S.ultimatumOk(s, 'koryn'), 'no ultimatum below 40% support');
  s.acd = {}; s.inf.koryn = 30; const k0 = s.inf.koryn; S.doAct(s, 'mil2', 'koryn'); ok(s.inf.koryn < 90 && s.capit.ultimatum === 1, 'ordinary Snap Exercise elsewhere');
}
// 9. v10.20 average notoriety counts until the Breakup (Ghost goal, score)
{
  const s = nearBreakup(); s.notoSum = 10 * s.week; S.step(s); assert(s.broken);
  const nb = s.notoAtBreak; ok(nb && nb.weeks === s.week, 'notoriety snapshot at the Breakup');
  for (let i = 0; i < 40; i++) { s.notoriety = 100; s.notoSum += 100; s.week++; }
  const r = S.runResult(Object.assign({}, s, { over: 'win' }));
  ok(r.avgNoto === Math.round(nb.sum / nb.weeks) && r.avgNotoUntil === 'breakup', 'avgNoto ignores weeks after the Breakup: ' + r.avgNoto);
  const o = mk(); o.notoSum = 500; o.week = 10; o.over = 'win';
  ok(S.runResult(o).avgNoto === 50 && !S.runResult(o).avgNotoUntil, 'no Breakup: whole-run average (old saves too)');
}
// 10. v10.21 Grand Coalition
{
  const s = nearBreakup('normal', true); S.step(s);
  const G = s.gc;
  ok(G && G.members.length === 3 && ['sinopeia', 'juche', 'bharat'].every(id => G.members.includes(id)) && G.cohesion > 99, 'GC forms at the Breakup from the holdouts');
  ok(G.leader === 'sinopeia' || G.leader === 'bharat', 'leader is the biggest member: ' + G.leader);
  ok(s.news.some(x => x.tag === 'Grand Coalition' && x.level === 'critical'), 'GC news');
  s.inf.sinopeia = 45; s.wary.sinopeia = 0; ok(S.capWhy(s, 'sinopeia') === 'gc' && !S.ultimatumOk(s, 'sinopeia'), 'members cannot capitulate (Terms/Ultimatum)');
  // cohesion: Diplomacy -10, Ideology -6, Military on a member +8
  s.owned.push('d1', 'd2', 'i1', 'i2', 'm1', 'm2'); s.cfg.gate = false; s.clout = 500; s.al = { list: [], next: 1 };
  const c0 = G.cohesion; s.acd = {}; S.doAct(s, 'dip1', 'juche'); ok(Math.abs(G.cohesion - (c0 - 8)) < 1e-9, 'Diplomacy on a member -8: ' + G.cohesion);
  s.acd = {}; S.doAct(s, 'ideo1', 'bharat'); ok(Math.abs(G.cohesion - (c0 - 13)) < 1e-9, 'Ideology on a member -5');
  s.acd = {}; S.doAct(s, 'mil1', 'juche'); ok(Math.abs(G.cohesion - (c0 - 5)) < 1e-9, 'Military on a member rallies +8');
  // A: Military on a country you hold that borders a member
  s.acd = {}; const k0 = G.cohesion; ok(S.gcBorder(s, 'koryn'), 'Koryn borders members'); S.doAct(s, 'mil1', 'koryn');
  ok(Math.abs(G.cohesion - (k0 - 4)) < 1e-9, 'border intimidation -4: ' + G.cohesion);
  s.owned.push('m3'); s.acd = {}; const k1 = G.cohesion; S.doAct(s, 'mil1', 'koryn'); ok(Math.abs(G.cohesion - (k1 - 6)) < 1e-9, 'with Sovereign Intervention -6');
  s.acd = {}; const k2 = G.cohesion; s.inf.helvetia = 70; S.doAct(s, 'eco1', 'helvetia'); ok(G.cohesion === k2, 'Economy elsewhere: no effect');
  // B: Regime Change on a member splits it off
  s.owned.push('m4'); s.acd = {}; s.inf.koryn = 70; const r0 = G.cohesion; const rr = S.doAct(s, 'mil4', 'juche');
  ok(rr.ok && !G.members.includes('juche') && Math.abs(G.cohesion - (r0 - 15)) < 1e-9 && s.wary.juche === 0, 'Regime Change splits a member off: ' + JSON.stringify(rr));
  // islands: a trade partner at 50%+ counts as the neighbour for Regime Change on a member
  const I = nearBreakup('normal', true); ['sinopeia', 'juche', 'bharat'].forEach(id => { I.inf[id] = 70; }); I.inf.nippon = 30; I.inf.pinguinia = 30; I.inf.borealis = 30; S.step(I);
  I.owned.push('m1', 'm2', 'm3', 'm4'); I.cfg.gate = false; I.clout = 500; I.acd = {};
  ok(I.gc && I.gc.members.includes('nippon') && S.canAct(I, 'mil4', 'nippon').ok, 'Regime Change reaches island member via trade: ' + JSON.stringify(S.canAct(I, 'mil4', 'nippon')));
  // members you win over leave; held countries below 50 join
  s.inf.bharat = 65; S.step(s); ok(!G.members.includes('bharat') || G.broke, 'won-over member leaves');
  const J = nearBreakup('normal', true); S.step(J); J.held = J.held || {}; J.held.kestria = true; J.inf.kestria = 45; S.step(J);
  ok(J.gc.members.includes('kestria'), 'held country below 50 joins');
  // break below 20 -> members capitulation-ready (wary 0)
  const B = nearBreakup('normal', true); S.step(B); B.gc.cohesion = 19.5; S.step(B);
  ok(B.gc.broke && !S.gcOn(B) && B.gc.members.every(id => (B.wary[id] || 0) === 0), 'breaks below 20');
  B.inf.sinopeia = 45; ok(S.capWhy(B, 'sinopeia') === null, 'after the break members can capitulate');
  ok(B.news.some(x => x.tag === 'Coalition broken' && x.level === 'critical'), 'break news');
  // fewer than gcMin holdouts: no GC
  const N = nearBreakup('normal', true); ['juche', 'bharat'].forEach(id => { N.inf[id] = 70; }); S.step(N); ok(!N.gc, 'one holdout: no GC');
  // World Unity loss: cohesion >= 60 for 40 weeks (Brutal 30, Casual 50)
  const U = nearBreakup('normal', true); S.step(U); U.gc.cohesion = 100; let wk = 0;
  for (let i = 0; i < 60 && !U.over; i++) { U.gc.cohesion = 100; U.legit = 90; ['sinopeia', 'juche', 'bharat'].forEach(id => { U.inf[id] = 30; }); S.step(U); if (U.pending) S.resolveDecision(U, 'b'); wk++; }
  ok(U.over === 'unity' && U.gc.unityWk === 40, 'World Unity loss after 40 weeks: ' + U.over + ' ' + U.gc.unityWk);
  ok(!S.runResult(U).win, 'World Unity is a loss');
  ok(S.egk(S.createState('pannonia', 1, { v10: true, level: 'brutal' }), 'gcUnityWeeks') === 35 && S.egk(S.createState('pannonia', 1, { v10: true, level: 'casual' }), 'gcUnityWeeks') === 50, 'level knobs');
  // the clock resets below 60
  const V = nearBreakup('normal', true); S.step(V); for (let i = 0; i < 10; i++) { V.gc.cohesion = 100; S.step(V); } V.gc.cohesion = 50; S.step(V); ok(V.gc.unityWk === 0, 'unity clock resets below 60');
  // crackdowns get scheduled and land
  const C = nearBreakup('normal', true); S.step(C); for (let i = 0; i < 20; i++) { C.gc.cohesion = 100; S.step(C); if (C.pending) S.resolveDecision(C, 'b'); }
  ok(C.news.some(x => /Grand Coalition schedules a crackdown/.test(x.text)), 'GC crackdowns scheduled');
  // old v10.20 save after the Breakup (no s.gc) keeps working
  const O = nearBreakup('normal', false); S.step(O); assert(O.broken && !O.gc); O.cfg.eg = undefined; for (let i = 0; i < 20 && !O.over; i++) { S.step(O); if (O.pending) S.resolveDecision(O, 'b'); }
  ok(!O.gc, 'old post-Breakup save: no GC appears later');
}
console.log('endgame ok (' + n + ' checks)');
