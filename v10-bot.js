// v10 prototype balance test: domain power + 16 actions.
// Compares action cooldown per action (global) vs per action+country, with and without upgrade gating.
// usage: node v10-bot.js [gamesPerStart]
const S = require('./sim.js');
const PER_START = +(process.argv[2] || 6);

const BUILDS = { 'Ideo+Dip': ['ideo', 'dip'], 'Eco+Mil': ['eco', 'mil'], 'Ideo+Mil': ['ideo', 'mil'], 'Eco+Dip': ['eco', 'dip'] };
const prioFor = ([a, b]) => { const ids = t => S.UPGRADES.filter(u => u.b === t).map(u => u.id); const A = ids(a), B = ids(b); return [0, 1, 2, 3].flatMap(i => [A[i], B[i]]); };

// rough "support-equivalent" of each action, used by the greedy bot to compare options
const AMT = { eco1: 3, ideo1: 3, mil1: 4, eco2: 6, dip1: 4, mil2: 10, dip2: 9, ideo2: 8, eco3: 9, ideo3: 5, eco4: 16, mil4: 25, ideo4: 30 };
const NEEDS_FOOTHOLD = { ideo2: 1, ideo3: 1, dip1: 1, dip2: 1, eco3: 1, eco4: 1 };

function bestAction(s) {
  let best = null;
  for (const a of S.ACTIONS) {
    if (!AMT[a.id] || s.clout < a.cost + 3) continue;
    for (const c of S.COUNTRIES) {
      const v = s.inf[c.id];
      if (v >= 85) continue;
      if (NEEDS_FOOTHOLD[a.id] && (v < 3 || v > 80)) continue;
      if (!S.canAct(s, a.id, c.id).ok) continue;
      const score = AMT[a.id] * S.actEff(s, a, c.id) * Math.sqrt(c.pop) * (1 - v / 100) / a.cost;
      if (!best || score > best.score) best = { a: a.id, t: c.id, score };
    }
  }
  return best;
}
const RESPONSE = { sign: ['dip4', 'mil3', 'dip2', 'mil2'], invite: ['dip3', 'mil3', 'dip2', 'mil2'] };

function play(start, seed, cfg, build, sharp) {
  const s = S.createState(start, seed, Object.assign({ v10: true }, cfg));
  const prio = prioFor(BUILDS[build]);
  while (!s.over && s.week < 1500) {
    S.step(s);
    if (s.pending) { let c = 'a'; if (!S.canChoose(s, c).ok) c = 'b'; S.resolveDecision(s, c); }
    s.bubbles.slice().forEach(b => { if (sharp || Math.random() < 0.6) S.collectBubble(s, b.key); });
    if (!sharp && s.week % 4) continue;
    for (const id of prio) { if (s.owned.includes(id)) continue; const r = S.buyUpgrade(s, id); if (!r.ok && r.why === 'Not enough Clout') break; }
    for (const q of s.wo.queue.filter(q => RESPONSE[q.kind]).sort((a, b) => a.at - b.at)) {
      for (const aid of RESPONSE[q.kind]) if (S.doAct(s, aid, q.target).ok) break;
    }
    for (let i = 0; i < 4; i++) { const b = bestAction(s); if (!b || b.score <= 0) break; S.doAct(s, b.a, b.t); }
  }
  const log = s.actLog || [];
  const tiers = [1, 2, 3, 4].map(t => log.filter(id => +id.slice(-1) === t).length);
  const byId = {}; log.forEach(id => { byId[id] = (byId[id] || 0) + 1; });
  return { over: s.over || 'timeout', week: s.week, acts: log.length, tiers, top: Math.max(0, ...Object.values(byId)) };
}

const CONFIGS = [
  ['global cd', { cdMode: 'global' }], ['per-country cd', { cdMode: 'country' }], ['hybrid cd', { cdMode: 'hybrid' }],
  ['global cd + gate', { cdMode: 'global', gate: true }], ['per-country cd + gate', { cdMode: 'country', gate: true }], ['hybrid cd + gate', { cdMode: 'hybrid', gate: true }]
];
const pct = (n, d) => Math.round(100 * n / d) + '%';
for (const sharp of [true, false]) {
  console.log(`\n=== ${sharp ? 'SHARP bot (acts every week)' : 'CASUAL bot (acts every 4 weeks)'} ===`);
  console.log('config'.padEnd(24), 'win  ', 'treaty', 'timeout', 'winWk', 'acts/game', 'T1/T2/T3/T4 share', 'most-used action/game', '| win by build');
  for (const [name, cfg] of CONFIGS) {
    const all = [], perBuild = {};
    for (const build of Object.keys(BUILDS)) {
      const r = [];
      S.COUNTRIES.forEach(c => { for (let k = 1; k <= PER_START; k++) r.push(play(c.id, k * 101 + 7, cfg, build, sharp)); });
      perBuild[build] = pct(r.filter(x => x.over === 'win' || x.over === 'collapse').length, r.length);
      all.push(...r);
    }
    const n = all.length, wins = all.filter(x => x.over === 'win' || x.over === 'collapse');
    const avg = (a, f) => a.length ? (a.reduce((x, r) => x + f(r), 0) / a.length) : 0;
    const tsum = [0, 1, 2, 3].map(i => all.reduce((x, r) => x + r.tiers[i], 0)), tt = tsum.reduce((a, b) => a + b, 0) || 1;
    console.log(name.padEnd(24), pct(wins.length, n).padEnd(5), pct(all.filter(x => x.over === 'treaty').length, n).padEnd(6), pct(all.filter(x => x.over === 'timeout').length, n).padEnd(7),
      String(Math.round(avg(wins, r => r.week))).padEnd(5), avg(all, r => r.acts).toFixed(0).padEnd(9), tsum.map(x => pct(x, tt)).join('/').padEnd(17), avg(all, r => r.top).toFixed(0).padEnd(21), '|', Object.entries(perBuild).map(([b, w]) => b + ' ' + w).join(', '));
  }
}
