const S = require('./sim.js');
const CFG = process.env.GI_CFG ? JSON.parse(process.env.GI_CFG) : undefined;
function botDecide(S, s, passive) {
  if (!s.pending) return;
  if (passive) { S.resolveDecision(s, 'b'); return; }
  const id = s.pending.id; let c = 'a';
  if (id === 'viralcamp' && s.notoriety > 50) c = 'b';
  if (id === 'talkshow' && s.notoriety > 40) c = 'b';
  if (!S.canChoose(s, c).ok) c = c === 'a' ? 'b' : 'a';
  S.resolveDecision(s, c);
}

const T = (b,t)=>S.UPGRADES.filter(u=>u.b===b&&u.tier===t).map(u=>u.id);
const BUILDS = { 'Ideology+Diplomacy':['ideo','dip'], 'Economy+Military':['eco','mil'], 'Ideology+Military':['ideo','mil'], 'Economy+Diplomacy':['eco','dip'] };
function prio(core, extra){ const p=[]; for(let t=0;t<4;t++){ core.forEach(b=>p.push(...T(b,t))); if(t<3) p.push(...T('spin',t)); extra.forEach(b=>{ if(t<3) p.push(...T(b,t)); }); } p.push(...T('spin',3)); return p; }
function useSpecials(s){
  const sp=s.specials, W=s.wo; if(!s.coalition) { if(sp.utopia==='ready') S.useSpecial(s,'utopia'); return; }
  if(sp.utopia==='ready') S.useSpecial(s,'utopia');
  const tgt = Object.keys(W.members).filter(id=>id!==W.hq).sort((a,b)=>(W.signed[b]?1:0)-(W.signed[a]?1:0) || s.inf[a]-s.inf[b])[0];
  if(tgt && S.signedCount(s)>=2){ if(sp.bribe==='ready') S.useSpecial(s,'bribe',tgt); else if(sp.breaker==='ready') S.useSpecial(s,'breaker',tgt); }
  if(sp.stoppage==='ready' && (S.signedCount(s)>=4 || W.queue.some(q=>q.kind==='sign'))) S.useSpecial(s,'stoppage');
  if(sp.believe==='ready' && s.treaty>50) S.useSpecial(s,'believe');
  if(sp.hybrid==='ready' && (s.blocked.length>=2 || W.queue.filter(q=>q.kind==='sign').length)) S.useSpecial(s,'hybrid');
}
function play(start, seed, core, extra, careful){
  const s=S.createState(start,seed,CFG); const p=prio(core, extra);
  let rnd=seed*7+3; const R=()=>{rnd=(rnd*16807)%2147483647; return rnd/2147483647;};
  while(!s.over&&s.week<1500){ S.step(s); botDecide(S, s, false);
    if(careful) s.bubbles.slice().forEach(b=>S.collectBubble(s,b.key));
    else { s.bubbles.slice().forEach(b=>{ if(!b.tried && (b.until-s.week<=1||R()<0.15)){ b.tried=1; if(R()<0.6) S.collectBubble(s,b.key);} }); if(s.week%6) continue; }
    for(const id of p){ if(!s.owned.includes(id)){ const r=S.buyUpgrade(s,id); if(!r.ok && !/Opens when/.test(r.why)) break; } }
    useSpecials(s);
    for (const q of s.wo.queue) { if (q.kind==='sign'||q.kind==='invite') if (S.doOp(s,'summit',q.target).ok || S.doOp(s,'snap',q.target).ok) break; }
    if (extra.includes('covert')) { const m=Object.keys(s.wo.signed).find(id=>id!==s.wo.hq); if(m) S.doOp(s,'dossier',m); }
    if (s.clout>12){ const cands=S.COUNTRIES.filter(c=>s.inf[c.id]<50).sort((a,b)=>b.pop-a.pop);
      for(const c of cands){ if(S.doOp(s,'trade',c.id).ok) break; }
      if (core.includes('mil')) for(const c of cands){ if(S.doOp(s,'snap',c.id).ok) break; } }
  }
  return { win: s.over==='win'||s.over==='collapse', week: s.week };
}
const starts=S.COUNTRIES.map(c=>c.id).filter(id=>id!=='pinguinia');
const extras = process.argv[2] ? [process.argv[2].split(',')] : [['faith'],['covert']];
for (const [name, core] of Object.entries(BUILDS)) for (const extra of extras) {
  const r={}; for (const careful of [false,true]){ let w=0,n=0,wk=0; for(const st of starts) for(let sd=1;sd<=4;sd++){ n++; const g=play(st,sd*101,core,extra,careful); if(g.win){w++; wk+=g.week;} } r[careful?'careful':'casual']=Math.round(100*w/n)+'% @'+(w?Math.round(wk/w):'-'); }
  console.log((name+' +'+extra.join('+')).padEnd(32), JSON.stringify(r));
}
