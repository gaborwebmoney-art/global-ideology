// Upgrade rebuild test (2026-10-19): fixed partners vs a synergy for every legal pair, plus two lock variants.
// usage: node v10-pairs-bot.js [gamesPerStart]
const S = require('./sim.js');
const { play, BUILDS } = require('./v10-bot.js');
const PER_START = +(process.argv[2] || 8);
const PAIRS = ['Ideo+Dip', 'Eco+Mil', 'Ideo+Mil', 'Eco+Dip'];
// 3-branch builds: the pair plus the branch opposed to its first branch
Object.assign(BUILDS, { 'Ideo+Dip+Eco': ['ideo', 'dip', 'eco'], 'Eco+Mil+Ideo': ['eco', 'mil', 'ideo'], 'Ideo+Mil+Eco': ['ideo', 'mil', 'eco'], 'Eco+Dip+Ideo': ['eco', 'dip', 'ideo'],
  'Ideo+Dip+Mil': ['ideo', 'dip', 'mil'], 'Eco+Mil+Dip': ['eco', 'mil', 'dip'], 'Ideo+Mil+Dip': ['ideo', 'mil', 'dip'], 'Eco+Dip+Mil': ['eco', 'dip', 'mil'] });
const THREE = Object.keys(BUILDS).filter(b => b.split('+').length === 3);
const base = { capNeeds: false, rush: true, v10t: { pnr: 66, courtWeeks: 8, pushMul: .6 } };
const CONFIGS = [
  ['A0 old: fixed partners', { pairs: false }, PAIRS],
  ['A1 new: pair synergies', {}, PAIRS],
  ['A2 new + minor 3rd branch', { minor: true }, [...PAIRS, ...THREE]],
  ['B  new + soft lock', { softLock: true }, [...PAIRS, ...THREE]]
];
const pct = (n, d) => Math.round(100 * n / d);
const win = r => r.over === 'win' || r.over === 'collapse';
for (const sharp of [true, false]) {
  console.log(`\n=== ${sharp ? 'SHARP' : 'CASUAL'} bot, ${S.COUNTRIES.length * PER_START} games per build ===`);
  for (const [name, cfg, builds] of CONFIGS) {
    const res = {};
    for (const b of builds) {
      const r = []; S.COUNTRIES.forEach(c => { for (let k = 1; k <= PER_START; k++) r.push(play(c.id, k * 101 + 7, Object.assign({}, base, cfg), b, sharp)); });
      res[b] = { w: pct(r.filter(win).length, r.length), t4: pct(r.filter(x => x.t4).length, r.length), wk: Math.round(r.filter(win).reduce((a, x) => a + x.week, 0) / (r.filter(win).length || 1)) };
    }
    const pw = PAIRS.map(b => res[b].w), avg = Math.round(pw.reduce((a, x) => a + x, 0) / pw.length);
    console.log(`\n${name}  | pairs avg ${avg}%, spread ${Math.max(...pw) - Math.min(...pw)}pp`);
    for (const b of builds) console.log('  ' + b.padEnd(14), `win ${String(res[b].w).padStart(3)}%  T4 used ${String(res[b].t4).padStart(3)}%  win week ${res[b].wk}`);
  }
}
