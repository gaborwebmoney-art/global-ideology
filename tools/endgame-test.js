// Step 9.1 functional check (v10.19): Breakup, capitulation timing, Terms, both win paths, losses before/after the Breakup,
// old saves. usage: node tools/endgame-test.js
const S = require('../sim.js'); const assert = require('assert');
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
const ids = S.COUNTRIES.map(c => c.id);
const mk = (lv, start) => S.createState(start || 'pannonia', 7, { v10: true, level: lv || 'normal', random: false });
// a running World Order with the treaty hopeless for 25 weeks; `low` stay below the signing line so the step can count to 26
function nearBreakup(lv) {
  const s = mk(lv); s.notoriety = 30; S.step(s); assert(s.coalition, 'WO should convene');
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
  const k = S.createState('pannonia', 7, { v10: true, level: 'normal', random: false, winShare: .8 }); ids.forEach(id => { k.inf[id] = 85; }); k.inf.pinguinia = 5; k.legit = 90; S.step(k);
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
console.log('endgame ok (' + n + ' checks)');
