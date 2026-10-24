// Step 9 probe: when does the bot cross 70/80/85/90/95% aligned share, and does it win at a higher WIN_SHARE? usage: node tools/endgame-probe.js [seeds] [levels] [winShare]
const S = require('../sim.js'); const { play, BUILDS } = require('../v10-bot.js');
const N = +(process.argv[2] || 1), LV = (process.argv[3] || 'normal,brutal').split(','), WS = +(process.argv[4] || 0.7);
const med = a => { a = a.slice().sort((x, y) => x - y); return a.length ? a[a.length >> 1] : 0; };
for (const level of LV) {
  const r = [];
  for (const b of Object.keys(BUILDS)) S.COUNTRIES.forEach(c => { for (let k = 1; k <= N; k++) r.push(play(c.id, k * 101 + 7, { rush: true, level, winShare: WS }, b, true)); });
  const row = [.7, .8, .85, .9, .95].map(x => { const a = r.filter(q => q.cr[x]); return `${Math.round(100 * a.length / r.length)}%@wk${med(a.map(q => q.cr[x]))}`; });
  console.log(`${level.padEnd(7)} winShare ${WS} n ${r.length} win ${Math.round(100 * r.filter(q => q.res.win).length / r.length)}% medWinWk ${med(r.filter(q => q.res.win).map(q => q.week))} reach 70/80/85/90/95: ${row.join('  ')}  overs ${JSON.stringify(r.reduce((a, q) => (a[q.over] = (a[q.over] || 0) + 1, a), {}))}`);
}
