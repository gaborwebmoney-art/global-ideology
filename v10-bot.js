// v10 prototype balance test: domain power, 16 actions on the tier frame, World Order courtship bars.
// Global cooldown per action + upgrade gating (decided). T4 needs the branch's tier-4 upgrade.
// usage: node v10-bot.js [gamesPerStart]
const S = require('./sim.js');
const PER_START = +(process.argv[2] || 6);

const BUILDS = { 'Ideo+Dip': ['ideo', 'dip'], 'Eco+Mil': ['eco', 'mil'], 'Ideo+Mil': ['ideo', 'mil'], 'Eco+Dip': ['eco', 'dip'] };
const prioFor = ([a, b], rush) => { const ids = t => S.UPGRADES.filter(u => u.b === t).map(u => u.id); const A = ids(a), B = ids(b);
  return rush ? [A[0], B[0], A[1], A[2], A[3], B[1], B[2], B[3]] : [0, 1, 2, 3].flatMap(i => [A[i], B[i]]); };

// support-equivalent of the support-pushing actions, for the greedy spender
const AMT = { eco1: 2.5, ideo1: 2.5, mil1: 3, eco2: 6, dip1: 4, mil2: 8, dip2: 9, ideo2: 8, eco3: 10, ideo3: 6 };
const NEEDS_FOOTHOLD = { ideo2: 1, ideo3: 1, dip1: 1, dip2: 1, eco3: 1 };
// answers to a courtship, by how far it has got
const PNR = s => (s.cfg.v10t && s.cfg.v10t.pnr) || 66;
const ANSWER = [
  [66, ['ideo4', 'mil4', 'dip4', 'mil3', 'dip3', 'eco3', 'ideo3', 'dip2', 'mil2']],
  [40, ['mil3', 'dip3', 'eco3', 'ideo3', 'dip2', 'mil2']],
  [20, ['dip2', 'mil2', 'ideo2']]
];

function bestAction(s) {
  let best = null;
  for (const a of S.ACTIONS) {
    const cost = S.actCost(s, a);
    const reserve = ['e4', 'm4', 'd4', 'i4'].some(id => s.owned.includes(id)) ? 14 : 4;
    if (!AMT[a.id] || s.clout < cost + reserve) continue;
    for (const c of S.COUNTRIES) {
      const v = s.inf[c.id];
      if (v >= 85) continue;
      if (NEEDS_FOOTHOLD[a.id] && (v < 3 || v > 80)) continue;
      if (!S.canAct(s, a.id, c.id).ok) continue;
      const score = AMT[a.id] * S.actEff(s, a, c.id) * Math.sqrt(c.pop) * (1 - v / 100) / cost;
      if (!best || score > best.score) best = { a: a.id, t: c.id, score };
    }
  }
  return best;
}

function play(start, seed, cfg, build, sharp) {
  const s = S.createState(start, seed, Object.assign({ v10: true, cdMode: 'global', gate: true }, cfg));
  const prio = prioFor(BUILDS[build], cfg.rush);
  let w4 = 0, crisis = 0;
  while (!s.over && s.week < 1500) {
    S.step(s);
    if (s.pending) { let c = 'a'; if (!S.canChoose(s, c).ok) c = 'b'; S.resolveDecision(s, c); }
    s.bubbles.slice().forEach(b => { if (sharp || Math.random() < 0.6) S.collectBubble(s, b.key); });
    if (!w4 && ['e4', 'm4', 'd4', 'i4'].some(id => s.owned.includes(id))) w4 = s.week;
    if ((s.wo.court || []).some(c => c.prog >= 66)) crisis++;
    if (!sharp && s.week % 4) continue;
    for (const id of prio) { if (s.owned.includes(id)) continue; const r = S.buyUpgrade(s, id); if (!r.ok && r.why === 'Not enough Clout') break; }
    // answer courtships
    for (const c of (s.wo.court || []).slice().sort((a, b) => b.prog - a.prog)) {
      const row = ANSWER.find(([min]) => c.prog >= min); if (!row) continue;
      for (const aid of row[1]) if (S.doAct(s, aid, c.target).ok) break;
    }
    if (s.treaty > 70 || (s.wo.court || []).reduce((x, c) => x + c.prog, 0) > 120) S.doAct(s, 'eco4');
    for (let i = 0; i < 4; i++) { const b = bestAction(s); if (!b || b.score <= 0) break; S.doAct(s, b.a, b.t); }
  }
  const log = s.actLog || [];
  const tiers = [1, 2, 3, 4].map(t => log.filter(id => +id.slice(-1) === t).length);
  return { over: s.over || 'timeout', week: s.week, acts: log.length, tiers, t4: tiers[3] > 0, w4, crisis };
}

const T = { courtWeeks: 8, pushMul: 0.6 };
const CONFIGS = [
  ['tuned, no point-of-no-return', { v10t: T }],
  ['tuned + no-return at 66%', { v10t: Object.assign({ pnr: 66 }, T) }],
  ['tuned + no-return 66% + T4 w/o partner', { capNeeds: false, v10t: Object.assign({ pnr: 66 }, T) }]
];
module.exports = { play, BUILDS };
if (require.main === module) {
const pct = (n, d) => Math.round(100 * n / d) + '%';
for (const sharp of [true, false]) {
  console.log(`\n=== ${sharp ? 'SHARP bot (acts every week)' : 'CASUAL bot (acts every 4 weeks)'} ===`);
  console.log('config'.padEnd(40), 'win  ', 'treaty', 'winWk', 'lossWk', 'acts', 'T1/T2/T3/T4 share   ', 'games w/ T4', '| win by build');
  for (const [name, cfg] of CONFIGS) {
    const all = [], perBuild = {};
    for (const build of Object.keys(BUILDS)) {
      const r = [];
      S.COUNTRIES.forEach(c => { for (let k = 1; k <= PER_START; k++) r.push(play(c.id, k * 101 + 7, cfg, build, sharp)); });
      perBuild[build] = pct(r.filter(x => x.over === 'win' || x.over === 'collapse').length, r.length);
      all.push(...r);
    }
    const n = all.length, wins = all.filter(x => x.over === 'win' || x.over === 'collapse'), loss = all.filter(x => !wins.includes(x));
    const avg = (a, f) => a.length ? (a.reduce((x, r) => x + f(r), 0) / a.length) : 0;
    const tsum = [0, 1, 2, 3].map(i => all.reduce((x, r) => x + r.tiers[i], 0)), tt = tsum.reduce((a, b) => a + b, 0) || 1;
    console.log(name.padEnd(40), pct(wins.length, n).padEnd(5), pct(all.filter(x => x.over === 'treaty').length, n).padEnd(6),
      String(Math.round(avg(wins, r => r.week))).padEnd(5), String(Math.round(avg(loss, r => r.week))).padEnd(6), avg(all, r => r.acts).toFixed(0).padEnd(4),
      tsum.map(x => pct(x, tt)).join('/').padEnd(21), pct(all.filter(r => r.t4).length, n).padEnd(11), '|', Object.entries(perBuild).map(([b, w]) => b + ' ' + w).join(', '));
  }
}
}
