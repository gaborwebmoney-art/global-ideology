// Step 8.4 probe: per level, overextension off / on but ignored (blind) / handled (Development aid). usage: node tools/over-probe.js [seeds] [levels]
const S = require('../sim.js'); const { play, BUILDS } = require('../v10-bot.js');
const N = +(process.argv[2] || 3), LV = (process.argv[3] || 'casual,normal,brutal').split(','), MODES = (process.argv[4] || 'off,blind,handled').split(',');
if (process.env.GI_LEGIT) { const p = JSON.parse(process.env.GI_LEGIT); Object.keys(p).forEach(k => { if (typeof p[k] === 'object' && !Array.isArray(p[k])) Object.assign(S.LEGIT[k], p[k]); else S.LEGIT[k] = p[k]; }); }
const extra = process.env.GI_V10T ? JSON.parse(process.env.GI_V10T) : {};
const med = a => { a = a.slice().sort((x, y) => x - y); return a.length ? a[a.length >> 1] : 0; };
const cfgs = { off: { over: false }, blind: { overBlind: true }, handled: {} };
for (const level of LV) for (const mode of MODES) {
  const r = [];
  for (const b of Object.keys(BUILDS)) S.COUNTRIES.forEach(c => { for (let k = 1; k <= N; k++) r.push(play(c.id, k * 101 + 7, Object.assign({ rush: true, level, v10t: extra }, cfgs[mode]), b, true)); });
  const w = r.filter(x => x.res.win), pc = f => Math.round(100 * r.filter(f).length / r.length);
  const st = [1, 2, 3].map(n => w.filter(x => x.res.stars === n).length);
  console.log(`${level.padEnd(7)} ${mode.padEnd(8)} n ${r.length} win ${pc(x => x.res.win)}% medWk ${med(w.map(x => x.week))} aids/run ${(r.reduce((a, x) => a + x.aids, 0) / r.length).toFixed(1)} clout@end ${Math.round(med(r.map(x => x.clout)))} stars ${st.join('/')}`);
}
