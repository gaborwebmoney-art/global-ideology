const S = require('./sim.js');
const PRIO = {
  human: ['i1','d1','e1','i2','d2','s1','e2','i3','f1','d3','m1','e3','s2','i4','d4','c1','s3','f2','e4','m2','f3'],
  smart: ['d1','i1','e1','s1','i2','d2','e2','f1','s2','d3','i3','e3','s3','f2','m1','d4','i4','c1','s4','e4','f3','f4','m2','m3','c2'],
  loud: ['m1','i1','c1','d1','m2','c2','i2','m3','c3','e1','d2','m4','c4','i3','i4','e2','d3','d4'],
  quiet: ['s1','d1','i1','e1','d2','i2','s2','d3','e2','s3','f1','i3','e3','s4','d4','f2','e4','f3','f4','i4']
};
function play(start, seed, strat, maxW = 1500) {
  const s = S.createState(start, seed);
  const prio = PRIO[strat] || [];
  while (!s.over && s.week < maxW) {
    S.step(s);
    if (strat === 'idle') continue;
    if (strat==='human') { s.bubbles.slice().forEach(b => { if (b.until - s.week <= 1 || Math.random()<0.15) { if (!b.tried) { b.tried=1; if (Math.random()<0.6) S.collectBubble(s,b.key);} } }); if (s.week%6) continue; }
    else s.bubbles.slice().forEach(b => S.collectBubble(s, b.key));
    for (const id of prio) { if (!s.owned.includes(id)) { const r = S.buyUpgrade(s, id); if (!r.ok) break; } }
    if (s.clout > 12) {
      const cands = S.COUNTRIES.filter(c => s.inf[c.id] < 50).sort((a,b)=>b.pop-a.pop);
      for (const c of cands) { if (S.doOp(s,'summit',c.id).ok) break; }
      for (const c of cands) { if (S.doOp(s,'trade',c.id).ok) break; }
      if (strat==='loud') for (const c of cands) { if (S.doOp(s,'snap',c.id).ok || S.doOp(s,'dossier',c.id).ok) break; }
    }
  }
  return { over: s.over || 'timeout', week: s.week, share: S.alignedShare(s), N: s.notoriety, T: s.treaty, owned: s.owned.length };
}
const starts = S.COUNTRIES.map(c=>c.id);
for (const strat of ['idle','human','smart','quiet','loud']) {
  const res = []; for (const st of starts) for (let seed=1; seed<=6; seed++) res.push({st, ...play(st, seed*101, strat)});
  const cnt = k => res.filter(r=>r.over===k).length;
  const wins = res.filter(r=>r.over==='win'); const avg = a => a.length? Math.round(a.reduce((x,r)=>x+r.week,0)/a.length):'-';
  console.log(strat.padEnd(6), 'win',cnt('win'),'treaty',cnt('treaty'),'extinct',cnt('extinct'),'timeout',cnt('timeout'),'| avg win wk',avg(wins),'| avg loss wk',avg(res.filter(r=>r.over!=='win')));
  if (strat==='smart') { const by={}; res.forEach(r=>{by[r.st]=(by[r.st]||'')+(r.over==='win'?'W':r.over[0])}); console.log(by); }
}
