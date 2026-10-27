// Step 9 probe (v10.19: Breakup, capitulation, Terms, win = all 16 held or winShare aligned).
// usage: node tools/endgame-probe.js [seeds] [levels] [maxWeeks]     env: GI_EG='{"capWeeks":4}' (ENDGAME knobs), GI_WS=0.9 (winShare),
//        GI_V10T='{...}' (V10 knobs), GI_NOTERMS=1 / GI_NOULT=1 (bot never uses Terms / Ultimatum), GI_SLOW=1 (bot acts every 4 weeks), GI_GCBLIND=1 (bot ignores the Grand Coalition), GI_JSON=path (dump per-run rows)
const S = require('../sim.js'); const { play, BUILDS } = require('../v10-bot.js');
const N = +(process.argv[2] || 2), LV = (process.argv[3] || 'casual,normal,brutal').split(','), MAXW = +(process.argv[4] || 600);
const eg = process.env.GI_EG ? JSON.parse(process.env.GI_EG) : undefined, ws = process.env.GI_WS ? +process.env.GI_WS : undefined;
const v10t = process.env.GI_V10T ? JSON.parse(process.env.GI_V10T) : undefined;
const q = (a, p) => { a = a.slice().sort((x, y) => x - y); return a.length ? a[Math.min(a.length - 1, Math.floor(p * a.length))] : 0; };
const med = a => q(a, .5), pc = (n, d) => d ? Math.round(100 * n / d) + '%' : '-';
const dump = [];
for (const level of LV) {
  const r = [], byB = {};
  for (const b of Object.keys(BUILDS)) S.COUNTRIES.forEach(c => { for (let k = 1; k <= N; k++) { const x = play(c.id, k * 101 + 7, { rush: true, level, maxWeeks: MAXW, eg, winShare: ws, v10t, noTerms: !!process.env.GI_NOTERMS, noUltimatum: !!process.env.GI_NOULT, gcBlind: !!process.env.GI_GCBLIND }, b, !process.env.GI_SLOW); x.build = b; x.start = c.id; x.level = level; r.push(x); (byB[b] = byB[b] || []).push(x); } });
  dump.push(...r.map(x => ({ level, build: x.build, start: x.start, over: x.over, week: x.week, win: x.res.win, winType: x.winType, brk: x.brk, brkShare: x.brkShare, capA: x.capA, capT: x.capT, capU: x.capU, share: x.share, held: x.held, stars: x.res.stars, avgNoto: x.res.avgNoto })));
  const w = r.filter(x => x.res.win), br = r.filter(x => x.brk), n = r.length;
  const st = [1, 2, 3].map(k => w.filter(x => x.res.stars === k).length);
  console.log(`${level.padEnd(7)} n ${n} win ${pc(w.length, n)} (held ${w.filter(x => x.winType === 'held').length}, share ${w.filter(x => x.winType === 'share').length}) medWinWk ${med(w.map(x => x.week))} p25/p75 ${q(w.map(x => x.week), .25)}/${q(w.map(x => x.week), .75)}`
    + ` | breakup ${pc(br.length, n)} medWk ${med(br.map(x => x.brk))} share@brk p10/50/90 ${[.1, .5, .9].map(p => Math.round(100 * q(br.map(x => x.brkShare), p))).join('/')}`
    + ` | share@win p10/50/90 ${[.1, .5, .9].map(p => Math.round(100 * q(w.map(x => x.share), p))).join('/')} | capit/run auto ${(r.reduce((a, x) => a + x.capA, 0) / n).toFixed(2)} terms ${(r.reduce((a, x) => a + x.capT, 0) / n).toFixed(2)} ultimatum ${(r.reduce((a, x) => a + (x.capU || 0), 0) / n).toFixed(2)} | avgNoto(win) med ${med(w.map(x => x.res.avgNoto))}`
    + ` | stalled(${MAXW}wk) ${pc(r.filter(x => x.over === 'timeout').length, n)} (after breakup ${r.filter(x => x.over === 'timeout' && x.brk).length}) | stars1/2/3 ${st.join('/')} | overs ${JSON.stringify(r.reduce((a, x) => (a[x.over] = (a[x.over] || 0) + 1, a), {}))}`);
  const g = r.filter(x => x.gc), gb = g.filter(x => x.gc.broke), afterBrk = br.filter(x => x.over !== 'win');
  console.log(`        GC formed ${pc(g.length, n)} (size med ${med(g.map(x => x.gc.size))}) broken ${pc(gb.length, g.length)} (med ${med(gb.map(x => x.gc.broke - x.gc.formed))} wk after forming) | World Unity losses ${pc(r.filter(x => x.over === 'unity').length, n)} | post-Breakup loss ${pc(afterBrk.length, br.length)} ${JSON.stringify(afterBrk.reduce((a, x) => (a[x.over] = (a[x.over] || 0) + 1, a), {}))} | Breakup->win med ${med(w.filter(x => x.brk).map(x => x.week - x.brk))} p10/p90 ${q(w.filter(x => x.brk).map(x => x.week - x.brk), .1)}/${q(w.filter(x => x.brk).map(x => x.week - x.brk), .9)}`);
  console.log('        by build: ' + Object.entries(byB).map(([b, a]) => `${b} ${pc(a.filter(x => x.res.win).length, a.length)} (stall ${pc(a.filter(x => x.over === 'timeout').length, a.length)})`).join(', '));
}
if (process.env.GI_JSON) require('fs').writeFileSync(process.env.GI_JSON, JSON.stringify(dump));
