// Step 5 balance pass (2026-10-19): live v10 defaults, per build, sharp + casual + idle.
// usage: node v10-balance-bot.js [gamesPerStart] [bots]     bots = comma list of sharp,casual,idle (default all)
// env GI_V10T = JSON merged into cfg.v10t (knob overrides), GI_LABEL = row label
const S = require('./sim.js');
const { play, BUILDS } = require('./v10-bot.js');
const PER_START = +(process.argv[2] || 8);
const BOTS = (process.argv[3] || 'sharp,casual,idle').split(',');
const over = process.env.GI_V10T ? JSON.parse(process.env.GI_V10T) : {};
// env GI_UP = JSON {upgradeId: {fxKey: value}} patches upgrade effects for experiments (not saved)
if (process.env.GI_UP) Object.entries(JSON.parse(process.env.GI_UP)).forEach(([id, fx]) => Object.assign(S.UPGRADES.find(u => u.id === id).fx, fx));
// env GI_TUNE = JSON patch for TUNE (experiments only)
if (process.env.GI_TUNE) Object.assign(S.TUNE, JSON.parse(process.env.GI_TUNE));
const LABEL = process.env.GI_LABEL || 'live defaults';
// live game = { v10: true } with V10 defaults; the bot only adds its own play style (rush one branch first)
const cfg = { rush: true, v10t: over };
const win = r => r.over === 'win' || r.over === 'collapse';
const pct = (n, d) => d ? Math.round(100 * n / d) : 0;

function idle(start, seed) {
  const s = S.createState(start, seed, { v10: true, v10t: over });
  while (!s.over && s.week < 1500) { S.step(s); if (s.pending) { let c = 'a'; if (!S.canChoose(s, c).ok) c = 'b'; S.resolveDecision(s, c); } }
  return { over: s.over || 'timeout', week: s.week };
}

const out = { label: LABEL, over, rows: {} };
for (const bot of BOTS) {
  if (bot === 'idle') {
    const r = []; S.COUNTRIES.forEach(c => { for (let k = 1; k <= PER_START; k++) r.push(idle(c.id, k * 101 + 7)); });
    const lw = r.filter(x => !win(x)).map(x => x.week).sort((a, b) => a - b);
    out.rows.idle = { win: pct(r.filter(win).length, r.length), n: r.length, lossMedWk: lw[lw.length >> 1] || 0 };
    continue;
  }
  const sharp = bot === 'sharp', row = {};
  for (const b of Object.keys(BUILDS)) {
    const r = []; S.COUNTRIES.forEach(c => { for (let k = 1; k <= PER_START; k++) r.push(play(c.id, k * 101 + 7, cfg, b, sharp)); });
    const rat = r.filter(x => x.ratAt), ww = r.filter(win);
    row[b] = { win: pct(ww.length, r.length), t4: pct(r.filter(x => x.t4).length, r.length), winWk: Math.round(ww.reduce((a, x) => a + x.week, 0) / (ww.length || 1)),
      ratified: pct(rat.length, r.length), recovered: pct(rat.filter(win).length, rat.length), timeouts: r.filter(x => x.over === 'timeout').length, owned: +(r.reduce((a, x) => a + x.owned, 0) / r.length).toFixed(1),
      ecoActs: +(r.reduce((a, x) => a + (x.dom ? x.dom.eco : 0), 0) / r.length).toFixed(1), acts: +(r.reduce((a, x) => a + x.acts, 0) / r.length).toFixed(1) };
  }
  const w = Object.values(row).map(x => x.win);
  row._avg = Math.round(w.reduce((a, x) => a + x, 0) / w.length); row._spread = Math.max(...w) - Math.min(...w);
  out.rows[bot] = row;
}
if (process.env.GI_JSON) console.log(JSON.stringify(out));
else {
  console.log(`\n${LABEL} ${JSON.stringify(over)} — ${S.COUNTRIES.length * PER_START} games per build`);
  for (const [bot, row] of Object.entries(out.rows)) {
    if (bot === 'idle') { console.log(`  idle: win ${row.win}%, median loss week ${row.lossMedWk}`); continue; }
    console.log(`  ${bot}: avg ${row._avg}%, spread ${row._spread}pp`);
    for (const [b, x] of Object.entries(row)) if (b[0] !== '_') console.log(`    ${b.padEnd(9)} win ${String(x.win).padStart(3)}%  T4 ${String(x.t4).padStart(3)}%  ratified ${String(x.ratified).padStart(3)}% (recovered ${x.recovered}%)  winWk ${x.winWk}  upgrades ${x.owned}  acts ${x.acts} (eco ${x.ecoActs})  timeouts ${x.timeouts}`);
  }
}
