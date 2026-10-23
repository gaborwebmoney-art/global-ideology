// Step 8.1 probe: per level, unrest off / on but ignored (blind) / on and handled. usage: node tools/unrest-probe.js [seeds] [levels]
const S = require('../sim.js'); const { play, BUILDS } = require('../v10-bot.js');
const N = +(process.argv[2] || 3), LV = (process.argv[3] || 'casual,normal,brutal').split(',');
if (process.env.GI_UNREST) Object.assign(S.UNREST, JSON.parse(process.env.GI_UNREST));
const extra = process.env.GI_V10T ? JSON.parse(process.env.GI_V10T) : {};
const med = a => { a = a.slice().sort((x, y) => x - y); return a.length ? a[a.length >> 1] : 0; };
for (const level of LV) for (const [mode, cfg] of [['off', { unrest: false }], ['blind', { unrestBlind: true }], ['handled', {}]]) {
  const r = [];
  for (const b of Object.keys(BUILDS)) S.COUNTRIES.forEach(c => { for (let k = 1; k <= N; k++) r.push(play(c.id, k * 101 + 7, Object.assign({ rush: true, level, v10t: extra }, cfg), b, true)); });
  const w = r.filter(x => x.res.win), st = [1, 2, 3].map(n => w.filter(x => x.res.stars === n).length);
  console.log(`${level.padEnd(7)} ${mode.padEnd(8)} n ${r.length} win ${Math.round(100 * w.length / r.length)}% medWk ${med(w.map(x => x.week))} ups/run ${(r.reduce((a, x) => a + x.ups, 0) / r.length).toFixed(2)} upLost/run ${(r.reduce((a, x) => a + x.upLost, 0) / r.length).toFixed(2)} stars1/2/3 ${st.join('/')} lostN ${(r.reduce((a, x) => a + x.res.lostN, 0) / r.length).toFixed(2)}`);
}
