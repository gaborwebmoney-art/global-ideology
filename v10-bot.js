// v10 prototype balance test: domain power, 16 actions on the tier frame, World Order courtship bars.
// Global cooldown per action + upgrade gating (decided). T4 needs the branch's tier-4 upgrade.
// usage: node v10-bot.js [gamesPerStart]
const S = require('./sim.js');
const PER_START = +(process.argv[2] || 6);

const BUILDS = { 'Ideo+Dip': ['ideo', 'dip'], 'Eco+Mil': ['eco', 'mil'], 'Ideo+Mil': ['ideo', 'mil'], 'Eco+Dip': ['eco', 'dip'] };
// an optional 3rd branch (br[2]) is bought after the main two, capped at cap3 upgrades (minor branch = 2)
const prioFor = ([a, b, c], rush, cap3) => { const ids = t => S.UPGRADES.filter(u => u.b === t).map(u => u.id); const A = ids(a), B = ids(b);
  const main = rush ? [A[0], B[0], A[1], A[2], A[3], B[1], B[2], B[3]] : [0, 1, 2, 3].flatMap(i => [A[i], B[i]]);
  return c ? main.concat(ids(c).slice(0, cap3 || 4)) : main; };

// support-equivalent of the support-pushing actions, for the greedy spender
const AMT = { eco1: 2.5, ideo1: 2.5, mil1: 3, eco2: 6, dip1: 4, mil2: 8, dip2: 9, ideo2: 8, eco3: 10, ideo3: 6 };
// eco amounts follow the live knobs (cfg.v10t overrides), so the bot values tuned Economy actions correctly
const knob = (s, k) => (s.cfg.v10t && s.cfg.v10t[k] !== undefined ? s.cfg.v10t[k] : S.V10[k]);
const amt = (s, id) => id === 'eco1' ? knob(s, 'eco1Amt') : id === 'eco3' ? knob(s, 'eco3Amt') : id === 'eco2' ? 4 + knob(s, 'eco2Amt') : AMT[id];
const NEEDS_FOOTHOLD = { ideo2: 1, ideo3: 1, dip1: 1, dip2: 1, eco3: 1 };
// answers to a courtship, by how far it has got
const PNR = s => (s.cfg.v10t && s.cfg.v10t.pnr) || 66;
const ANSWER = [
  [66, ['ideo4', 'mil4', 'dip4', 'mil3', 'dip3', 'eco3', 'ideo3', 'dip2', 'mil2']],
  [40, ['mil3', 'dip3', 'eco3', 'ideo3', 'dip2', 'mil2']],
  [20, ['dip2', 'mil2', 'ideo2']]
];

// v10.8 country rules: a rule-aware bot favours weak spots and avoids walls (cfg.ruleBlind = old behaviour)
const RULE_MUL = { echo: 1.6, refund: 1.5, bubble: 1.3, lock: 1.2, knock2: 1.1, anyNb: 1, harden: .6, loud: .6, fizzle: .5, noKnock: 1, reverse: 0 };
function ruleMul(s, id, dom) { if (s.cfg.ruleBlind || !S.ruleAt) return 1; const r = S.ruleAt(s, id, dom); return r ? RULE_MUL[r.kind] : 1; }
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
      const score = amt(s, a.id) * S.actEff(s, a, c.id) * Math.sqrt(c.pop) * (1 - v / 100) / cost * ruleMul(s, c.id, a.dom);
      if (!best || score > best.score) best = { a: a.id, t: c.id, score };
    }
  }
  return best;
}

function play(start, seed, cfg, build, sharp) {
  const s = S.createState(start, seed, Object.assign({ v10: true, cdMode: 'global', gate: true }, cfg));
  const prio = prioFor(BUILDS[build], cfg.rush, cfg.minor ? 2 : 4);
  let w4 = 0, crisis = 0, pw = 0, t2b = 0;
  while (!s.over && s.week < 1500) {
    S.step(s);
    if (s.pending) { let c = 'a'; if (!S.canChoose(s, c).ok) c = 'b'; S.resolveDecision(s, c); }
    s.bubbles.slice().forEach(b => { if (sharp || Math.random() < 0.6) S.collectBubble(s, b.key); });
    if (!w4 && ['e4', 'm4', 'd4', 'i4'].some(id => s.owned.includes(id))) w4 = s.week;
    if (!pw && S.PAIRS && S.PAIRS.some(p => S.pairOn(s, p.id))) pw = s.week; if (!t2b && s.owned.length >= 6) t2b = s.week;
    if ((s.wo.court || []).some(c => c.prog >= 66)) crisis++;
    if (!sharp && s.week % 4) continue;
    for (const id of prio) { if (s.owned.includes(id)) continue; const r = S.buyUpgrade(s, id); if (!r.ok && r.why === 'Not enough Clout') break; }
    // answer courtships
    for (const c of (s.wo.court || []).slice().sort((a, b) => b.prog - a.prog)) {
      const row = ANSWER.find(([min]) => c.prog >= min); if (!row) continue;
      for (const aid of row[1]) if (S.doAct(s, aid, c.target).ok) break;
    }
    // Enforcement: strip signatures (T4s), then push support in the strongest signed country toward the withdrawal line
    if (S.ratified(s)) {
      const signed = Object.keys(s.wo.signed).sort((a, b) => s.inf[b] - s.inf[a]);
      for (const id of signed) { if (S.doAct(s, 'mil4', id).ok || S.doAct(s, 'dip4', id).ok) break; }
      const top = Object.keys(s.wo.signed).sort((a, b) => s.inf[b] - s.inf[a])[0];
      if (top) for (const aid of ['eco3', 'ideo3', 'dip2', 'mil2', 'ideo2', 'eco1', 'ideo1', 'mil1', 'dip1']) S.doAct(s, aid, top);
    }
    if (s.treaty > 70 || (s.wo.court || []).reduce((x, c) => x + c.prog, 0) > 120) S.doAct(s, 'eco4');
    for (let i = 0; i < 4; i++) { const b = bestAction(s); if (!b || b.score <= 0) break; S.doAct(s, b.a, b.t); }
  }
  const log = s.actLog || [];
  const tiers = [1, 2, 3, 4].map(t => log.filter(id => +id.slice(-1) === t).length);
  const dom = { eco: 0, mil: 0, dip: 0, ideo: 0 }; log.forEach(id => { dom[id.replace(/\d$/, '')]++; });
  return { dom, pw, t2b, owned: s.owned.length, clout: Math.round(s.clout), over: s.over || 'timeout', week: s.week, acts: log.length, tiers, t4: tiers[3] > 0, w4, crisis, ratAt: s.wo.ratifiedAt || 0, cb: s.comebacks || 0 };
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
