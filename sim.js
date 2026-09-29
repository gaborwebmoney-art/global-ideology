// SIM-START
// ---------- Global Ideology: simulation core (pure, UI-free) ----------
const TYPES = ['eco', 'mil', 'dip', 'ideo'];
const TYPE_LABEL = { eco: 'Economic', mil: 'Military', dip: 'Diplomatic', ideo: 'Ideological' };

const COUNTRIES = [
  { id: 'borealis',   name: 'Borealis',   pop: 38,   x: 150, y: 105, res: { eco: .40, mil: .40, dip: .50, ideo: .50 }, traits: ['Federal', 'Resource-rich'], desc: 'Vast northern dominion. Polite, decentralised, hard to rally around anything.' },
  { id: 'aethelgard', name: 'Aethelgard', pop: 330,  x: 205, y: 235, res: { eco: .60, mil: .80, dip: .50, ideo: .30 }, traits: ['Superpower', 'Media-saturated'], desc: 'Loud, rich and armed. Will believe almost anything if it trends.' },
  { id: 'marisol',    name: 'Marisol',    pop: 210,  x: 285, y: 395, res: { eco: .30, mil: .30, dip: .40, ideo: .40 }, traits: ['Emerging economy'], desc: 'Fast-growing coastal republic with a weakness for grand promises.' },
  { id: 'isolde',     name: 'Isolde',     pop: 4,    x: 405, y: 65,  res: { eco: .50, mil: .20, dip: .60, ideo: .80 }, traits: ['Island', 'Close-knit'], desc: 'Volcanic island of 4 million people who all know each other.' },
  { id: 'atlantica',  name: 'Atlantica',  pop: 68,   x: 410, y: 200, res: { eco: .60, mil: .60, dip: .30, ideo: .40 }, traits: ['Island', 'Trade hub'], desc: 'Island financial centre. Neutral in public, available in private.' },
  { id: 'guldor',     name: 'Guldor',     pop: 84,   x: 525, y: 150, res: { eco: .50, mil: .40, dip: .70, ideo: .40 }, traits: ['Old money'], desc: 'Ancient kingdom run by very old treaties and very old families.' },
  { id: 'celestia',   name: 'Celestia',   pop: 67,   x: 505, y: 255, res: { eco: .40, mil: .30, dip: .60, ideo: .60 }, traits: ['Cultural power'], desc: 'Philosophers, painters and strikes. Soft power, soft army.' },
  { id: 'elysia',     name: 'Elysia',     pop: 10,   x: 605, y: 90,  res: { eco: .50, mil: .20, dip: .70, ideo: .70 }, traits: ['Green state'], desc: 'Small, principled and fully recycled.' },
  { id: 'vesperia',   name: 'Vesperia',   pop: 45,   x: 625, y: 215, res: { eco: .30, mil: .50, dip: .50, ideo: .80 }, traits: ['Tech society'], desc: 'Hyper-educated tech state. Sceptical of everything except its own apps.' },
  { id: 'uralia',     name: 'Uralia',     pop: 145,  x: 745, y: 130, res: { eco: .40, mil: .80, dip: .30, ideo: .60 }, traits: ['Authoritarian', 'Militarised'], desc: 'Rugged, disciplined, and on permanent military exercise.' },
  { id: 'kestria',    name: 'Kestria',    pop: 220,  x: 560, y: 410, res: { eco: .30, mil: .40, dip: .30, ideo: .40 }, traits: ['Young population'], desc: 'The youngest population on the map. Ideas spread here fast.', growthMul: 1.25 },
  { id: 'tavaro',     name: 'Tavaro',     pop: 90,   x: 715, y: 320, res: { eco: .70, mil: .60, dip: .40, ideo: .60 }, traits: ['Resource-rich', 'Crossroads'], desc: 'Desert crossroads sitting on the world’s favourite resource.' },
  { id: 'koryn',      name: 'Koryn',      pop: 125,  x: 875, y: 165, res: { eco: .50, mil: .70, dip: .50, ideo: .70 }, traits: ['Proud history'], desc: 'Old empire, long memory, suspicious of new ideas.' },
  { id: 'sinan',      name: 'Sinan',      pop: 900,  x: 860, y: 330, res: { eco: .60, mil: .60, dip: .60, ideo: .80 }, traits: ['Authoritarian', 'Manufacturing giant'], desc: 'The workshop of the world. Nothing enters without paperwork.' },
  { id: 'pinguinia',  name: 'Pinguinia',  pop: 0.05, x: 470, y: 535, res: { eco: .20, mil: .10, dip: .90, ideo: .90 }, traits: ['Polar', 'Research stations'], desc: 'Fifty thousand scientists and considerably more penguins.' }
];
const BORDERS = [
  ['borealis', 'aethelgard'], ['aethelgard', 'marisol'],
  ['guldor', 'celestia'], ['guldor', 'elysia'], ['celestia', 'vesperia'], ['elysia', 'vesperia'],
  ['elysia', 'uralia'], ['vesperia', 'uralia'], ['vesperia', 'tavaro'], ['uralia', 'tavaro'],
  ['uralia', 'koryn'], ['koryn', 'sinan'], ['tavaro', 'sinan'], ['tavaro', 'kestria'], ['uralia', 'sinan']
];
const TRADE = [
  ['aethelgard', 'atlantica'], ['atlantica', 'guldor'], ['isolde', 'guldor'], ['isolde', 'borealis'],
  ['marisol', 'kestria'], ['atlantica', 'marisol'], ['celestia', 'kestria'], ['sinan', 'kestria'],
  ['marisol', 'pinguinia'], ['aethelgard', 'guldor']
];

// Upgrade effects: add to stats; pen.* reduces that resistance type everywhere.
const BRANCHES = [
  { id: 'ideo', name: 'Ideology', blurb: 'Grows support inside countries.' },
  { id: 'eco', name: 'Economy', blurb: 'Spreads along trade routes. Earns Clout.' },
  { id: 'dip', name: 'Diplomacy', blurb: 'Spreads across land borders.' },
  { id: 'faith', name: 'Faith', blurb: 'Crosses oceans and borders on its own.' },
  { id: 'mil', name: 'Military', blurb: 'Breaks military resistance. Loud.' },
  { id: 'covert', name: 'Covert Ops', blurb: 'Weakens every defence. Very loud.' },
  { id: 'spin', name: 'Spin', blurb: 'Keeps the World Order busy.' }
];
const UPGRADES = [
  { id: 'i1', b: 'ideo', name: 'Viral Manifesto', cost: 5, fx: { growth: .025 }, text: 'Internal growth +25%' },
  { id: 'i2', b: 'ideo', name: 'Podcast Tour', cost: 9, fx: { growth: .025, pen: { ideo: .15 } }, text: 'Internal growth +25%. Ideological resistance −15%' },
  { id: 'i3', b: 'ideo', name: 'Leader’s Portrait in Every Office', cost: 15, fx: { growth: .035, loud: .03 }, text: 'Internal growth +35%. Slightly louder' },
  { id: 'i4', b: 'ideo', name: 'Mandatory Birthday Celebrations', cost: 24, fx: { growth: .045, pen: { ideo: .2 }, loud: .05 }, text: 'Internal growth +45%. Ideological resistance −20%. Louder' },

  { id: 'e1', b: 'eco', name: 'Strategic Synergy Alignment', cost: 5, fx: { income: 1, trade: .02 }, text: 'Clout income up. Trade spread up' },
  { id: 'e2', b: 'eco', name: 'Supply Chain Dependency', cost: 9, fx: { trade: .03, pen: { eco: .2 } }, text: 'Trade spread up. Economic resistance −20%' },
  { id: 'e3', b: 'eco', name: 'Too Big to Question', cost: 14, fx: { income: 1.5, pen: { eco: .2 } }, text: 'Clout income up a lot. Economic resistance −20%' },
  { id: 'e4', b: 'eco', name: 'Sovereign Wealth Hug', cost: 22, fx: { trade: .05, income: 1 }, text: 'Trade spread way up. Clout income up' },

  { id: 'd1', b: 'dip', name: 'Embassy Canapés', cost: 4, fx: { border: .02 }, text: 'Border spread up' },
  { id: 'd2', b: 'dip', name: 'Regional Summit Circuit', cost: 9, fx: { border: .03, pen: { dip: .2 }, summitCd: 12 }, text: 'Border spread up. Diplomatic resistance −20%. Summits recharge faster' },
  { id: 'd3', b: 'dip', name: 'Photo-Op Handshake Doctrine', cost: 14, fx: { border: .04, vis: -.1 }, text: 'Border spread up. You look harmless: notoriety grows 10% slower' },
  { id: 'd4', b: 'dip', name: 'Alliance Architecture', cost: 22, fx: { border: .05, pen: { dip: .2 } }, text: 'Border spread way up. Diplomatic resistance −20%' },

  { id: 'f1', b: 'faith', name: 'Missionary Networks', cost: 6, fx: { reach: .004, pen: { ideo: .1 } }, text: 'Can take root in distant countries. Ideological resistance −10%' },
  { id: 'f2', b: 'faith', name: 'Pilgrimage Routes', cost: 10, fx: { reach: .006, trade: .02 }, text: 'Distant reach up. Trade spread up' },
  { id: 'f3', b: 'faith', name: 'Shared Holy Days', cost: 15, fx: { growth: .02, pen: { ideo: .15 } }, text: 'Internal growth +20%. Ideological resistance −15%' },
  { id: 'f4', b: 'faith', name: 'Common Creed', cost: 22, fx: { reach: .01, pen: { ideo: .1, dip: .1 } }, text: 'Distant reach way up. Ideological and diplomatic resistance −10%' },

  { id: 'm1', b: 'mil', name: 'Military Parade', cost: 5, fx: { pen: { mil: .2 }, loud: .03 }, text: 'Military resistance −20%. Louder' },
  { id: 'm2', b: 'mil', name: 'Snap Exercises', cost: 9, fx: { pen: { mil: .1 }, snapBoost: 1 }, text: 'Snap Exercise operations push 50% harder. Military resistance −10%' },
  { id: 'm3', b: 'mil', name: 'Security Guarantees', cost: 14, fx: { border: .03, pen: { mil: .2 }, loud: .03 }, text: 'Border spread up. Military resistance −20%. Louder' },
  { id: 'm4', b: 'mil', name: 'Blockade', cost: 22, fx: { pen: { mil: .15, eco: .15 }, loud: .06 }, text: 'Military and economic resistance −15%. Much louder' },

  { id: 'c1', b: 'covert', name: 'Sleeper Agents', cost: 6, fx: { pen: { eco: .05, mil: .05, dip: .05, ideo: .05 }, loud: .03, seed: 2 }, text: 'Plants support in 2 random countries. All resistances −5%' },
  { id: 'c2', b: 'covert', name: 'Leaked Dossiers', cost: 10, fx: { pen: { dip: .15 }, loud: .04, dossierDiscount: 4 }, text: 'Diplomatic resistance −15%. Leak operations cost less' },
  { id: 'c3', b: 'covert', name: 'Orchestrated Unrest', cost: 16, fx: { pen: { eco: .1, mil: .1, dip: .1, ideo: .1 }, loud: .08 }, text: 'All resistances −10%. Much louder' },
  { id: 'c4', b: 'covert', name: 'Shadow Government', cost: 24, fx: { growth: .03, pen: { eco: .1, mil: .1, dip: .1, ideo: .1 }, loud: .1 }, text: 'Internal growth +30%. All resistances −10%. Very loud' },

  { id: 's1', b: 'spin', name: 'Plausible Deniability', cost: 5, fx: { vis: -.15 }, text: 'Notoriety grows 15% slower' },
  { id: 's2', b: 'spin', name: 'Friendly Fact-Checkers', cost: 9, fx: { fcRed: .5 }, text: 'World Order counter-campaigns hit half as hard' },
  { id: 's3', b: 'spin', name: 'Subcommittee on Subcommittees', cost: 14, fx: { treatySlow: .25 }, text: 'Treaty drafting 25% slower' },
  { id: 's4', b: 'spin', name: 'Lobbyist Weekend Retreat', cost: 20, fx: { treatySlow: .15, treaty: -20 }, text: 'Treaty progress −20 points. Drafting 15% slower' }
];
UPGRADES.forEach((u, i) => { const prev = UPGRADES[i - 1]; u.req = prev && prev.b === u.b ? prev.id : null; });

const OPS = [
  { id: 'summit', name: 'Summit', branch: 'Diplomacy', cost: 6, cd: 30, text: 'All resistances here −40% for 25 weeks. Quiet.' },
  { id: 'trade', name: 'Trade Deal', branch: 'Economy', cost: 8, cd: 40, text: 'Opens a trade route from your strongest country.' },
  { id: 'snap', name: 'Snap Exercise', branch: 'Military', cost: 8, cd: 30, text: 'Pushes +10% support next to a country you hold 25%+ of. Loud.' },
  { id: 'dossier', name: 'Leaked Dossiers', branch: 'Covert Ops', cost: 10, cd: 45, text: 'Diplomatic and ideological resistance here drop to 0 for 20 weeks. Very loud.' }
];

const WIN_SHARE = 0.70;
const TUNE = { fxScale: 0.8, treaty: 1.0, noto: 1.5, reachNoto: 0.12, pressure: 8, coalitionAt: 15, costGrow: 0.15, income: 1, shareIncome: 1.5 };
const CONTROL = 60; // % support at which a country counts as "held"

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function createState(startId, seed) {
  const s = {
    seed: seed >>> 0, rngCalls: 0, week: 0, clout: 5, startId,
    inf: {}, mods: [], trade: TRADE.map(t => t.slice()),
    stats: { growth: .05, border: .02, trade: .015, reach: 0, income: 0, vis: 1, loud: 0, treatySlow: 0, fcRed: 0, summitCd: 0, snapBoost: 0, dossierDiscount: 0, pen: { eco: 0, mil: 0, dip: 0, ideo: 0 } },
    owned: [], ready: {}, notoriety: 0, treaty: 0, coalition: false, nextCounter: 0,
    bubbles: [], bubbleSeq: 0, news: [], flags: {}, over: null, peakShare: 0
  };
  COUNTRIES.forEach(c => { s.inf[c.id] = 0; });
  s.inf[startId] = 3;
  s.flags['seed_' + startId] = true;
  addNews(s, `Unknown movement stirs in ${byId(startId).name}. Local officials call it “a phase”.`, 'you');
  return s;
}
function rng(s) { const r = mulberry32(s.seed + s.rngCalls * 7919)(); s.rngCalls++; return r; }
function byId(id) { return COUNTRIES.find(c => c.id === id); }
function addNews(s, text, kind) { s.news.unshift({ week: s.week, text, kind: kind || 'world' }); if (s.news.length > 40) s.news.pop(); }
function worldPop() { return COUNTRIES.reduce((a, c) => a + c.pop, 0); }
function alignedShare(s) { return COUNTRIES.reduce((a, c) => a + c.pop * s.inf[c.id] / 100, 0) / worldPop(); }
function neighbours(id) { return BORDERS.filter(e => e.includes(id)).map(e => e[0] === id ? e[1] : e[0]); }
function tradeLinks(s, id) { return s.trade.filter(e => e.includes(id)).map(e => e[0] === id ? e[1] : e[0]); }

function resBreakdown(s, id) {
  const c = byId(id); const out = {};
  const active = s.mods.filter(m => m.id === id && m.until > s.week);
  const mul = active.filter(m => m.kind === 'summit').length ? 0.6 : 1;
  const add = active.filter(m => m.kind === 'counter').length ? 0.25 : 0;
  const zero = active.filter(m => m.kind === 'dossier').length ? ['dip', 'ideo'] : [];
  TYPES.forEach(t => {
    let v = zero.includes(t) ? 0 : c.res[t] * (1 - Math.min(.85, s.stats.pen[t]));
    v = Math.min(.95, Math.max(0, v * mul + add));
    out[t] = v;
  });
  return out;
}
function effRes(s, id) { const b = resBreakdown(s, id); return (b.eco + b.mil + b.dip + b.ideo) / 4; }

function step(s) {
  if (s.over) return;
  s.week++;
  const R = {}; COUNTRIES.forEach(c => { R[c.id] = effRes(s, c.id); });
  const d = {}; COUNTRIES.forEach(c => { d[c.id] = 0; });
  const st = s.stats;
  // 1. Internal growth (logistic)
  COUNTRIES.forEach(c => {
    const v = s.inf[c.id]; if (v <= 0) return;
    const g = st.growth * (c.growthMul || 1) * (1 - R[c.id]);
    d[c.id] += g * v * (1 - v / 100) + 0.04 * (1 - R[c.id]);
  });
  // 2. Spread over borders and trade routes
  const spread = (a, b, rate) => {
    [[a, b], [b, a]].forEach(([src, dst]) => {
      const sv = s.inf[src]; if (sv < 8) return;
      const pull = rate * (sv / 100) * (1 - R[dst]);
      if (s.inf[dst] <= 0) {
        if (rng(s) < pull * 3) seed(s, dst, 1, src);
      } else if (s.inf[dst] < sv) {
        d[dst] += pull * TUNE.pressure;
      }
    });
  };
  BORDERS.forEach(([a, b]) => spread(a, b, st.border));
  s.trade.forEach(([a, b]) => spread(a, b, st.trade));
  // 3. Faith reach: distant seeding
  if (st.reach > 0) COUNTRIES.forEach(c => {
    if (s.inf[c.id] <= 0 && rng(s) < st.reach * (1 + 6 * alignedShare(s)) * (1 - R[c.id])) seed(s, c.id, 1, null);
  });
  COUNTRIES.forEach(c => { s.inf[c.id] = Math.max(0, Math.min(100, s.inf[c.id] + d[c.id])); });

  const share = alignedShare(s); s.peakShare = Math.max(s.peakShare, share);
  // 4. Clout income + opportunity bubbles
  s.clout += TUNE.income * (0.12 + 0.06 * st.income) * (1 + TUNE.shareIncome * share);
  s.bubbles = s.bubbles.filter(b => b.until > s.week);
  const held = COUNTRIES.filter(c => s.inf[c.id] > 0);
  if (held.length && rng(s) < 0.16 + 0.1 * share) {
    const c = held[Math.floor(rng(s) * held.length)];
    spawnBubble(s, c.id, 1 + (rng(s) < 0.35 ? 1 : 0));
  }
  // 5. Notoriety and the World Order
  const vis = Math.max(0.2, st.vis);
  s.notoriety = Math.min(100, s.notoriety + vis * (0.01 + TUNE.noto * share + TUNE.reachNoto * COUNTRIES.filter(c => s.inf[c.id] >= 5).length / COUNTRIES.length) + st.loud);
  if (!s.coalition && s.notoriety >= TUNE.coalitionAt) {
    s.coalition = true; s.nextCounter = s.week + 12;
    addNews(s, 'World Order convenes emergency session. Catering described as “adequate”.', 'wo');
  }
  if (s.coalition) {
    s.treaty = Math.max(0, s.treaty + TUNE.treaty * (0.35 + s.notoriety / 100) * (1 - Math.min(.8, st.treatySlow)));
    treatyNews(s);
    if (s.week >= s.nextCounter) counterCampaign(s);
  }
  milestoneNews(s, share);
  s.mods = s.mods.filter(m => m.until > s.week);
  // 6. End conditions
  if (share >= WIN_SHARE) { s.over = 'win'; addNews(s, 'The world wakes up aligned. Nobody remembers agreeing to it.', 'you'); }
  else if (s.treaty >= 100) { s.over = 'treaty'; addNews(s, 'Containment Treaty ratified. Your movement is now a footnote.', 'wo'); }
  else if (COUNTRIES.every(c => s.inf[c.id] <= 0)) { s.over = 'extinct'; addNews(s, 'Your movement has vanished. Historians shrug.', 'wo'); }
}

function seed(s, id, amount, src) {
  s.inf[id] = Math.max(s.inf[id], amount);
  if (!s.flags['seed_' + id]) {
    s.flags['seed_' + id] = true;
    const c = byId(id);
    addNews(s, src ? `Your ideas reach ${c.name} from ${byId(src).name}.` : `Your ideas appear in ${c.name}. Nobody is sure how.`, 'you');
    spawnBubble(s, id, 2);
  }
}
function spawnBubble(s, id, value) { s.bubbles.push({ key: ++s.bubbleSeq, id, value, until: s.week + 7 }); }
function collectBubble(s, key) {
  const i = s.bubbles.findIndex(b => b.key === key); if (i < 0) return 0;
  const v = s.bubbles[i].value; s.bubbles.splice(i, 1); s.clout += v; return v;
}

function counterCampaign(s) {
  const fc = s.stats.fcRed;
  const cands = COUNTRIES.filter(c => s.inf[c.id] >= 5 && s.inf[c.id] < 97);
  s.nextCounter = s.week + Math.max(12, 24 - Math.floor(s.notoriety / 10));
  if (!cands.length) return;
  const t = cands.reduce((a, c) => (c.pop * s.inf[c.id] > a.pop * s.inf[a.id] ? c : a));
  s.inf[t.id] = Math.max(0, s.inf[t.id] - 10 * (1 - fc));
  s.mods.push({ id: t.id, kind: 'counter', until: s.week + Math.round(25 * (1 - fc / 2)) });
  const lines = [
    `World Order launches awareness campaign in ${t.name}. Leaflets feature a stern owl.`,
    `Fact-checkers descend on ${t.name}. Your slogans rated “mostly vibes”.`,
    `World Order funds ${t.name} civics classes. Attendance: mandatory, enthusiasm: optional.`,
    `${t.name} bans your pamphlets, then prints more to explain the ban.`
  ];
  addNews(s, lines[Math.floor(rng(s) * lines.length)], 'wo');
}

function treatyNews(s) {
  const steps = [
    [10, 'Treaty working group forms a subcommittee to agree the name of the working group.'],
    [25, 'Containment Treaty draft reaches 400 pages. Font size under negotiation.'],
    [50, 'Treaty halfway done. Delegates agree on the coffee; the verbs are next.'],
    [75, 'Treaty enters final reading. Pens are being ceremonially polished.'],
    [90, 'Signing ceremony booked. Venue: extremely neutral.']
  ];
  steps.forEach(([v, t]) => { if (s.treaty >= v && !s.flags['t' + v]) { s.flags['t' + v] = true; addNews(s, t, 'wo'); } });
}
function milestoneNews(s, share) {
  const steps = [
    [0.05, 'Pollsters notice your movement. Pollsters also notice lunch.'],
    [0.15, 'Your slogan is now a popular ringtone in several capitals.'],
    [0.30, 'Think tanks publish 11 reports on your rise. They disagree on everything but the fonts.'],
    [0.50, 'Half the world now agrees with you. The other half is typing.'],
    [0.62, 'Your leader’s face appears on a stamp. Philatelists divided.']
  ];
  steps.forEach(([v, t]) => { if (share >= v && !s.flags['m' + v]) { s.flags['m' + v] = true; addNews(s, t, 'you'); } });
  const nsteps = [[40, 'Notoriety high: foreign ministers now mention you by name.'], [70, 'Notoriety critical: you are the lead story on every channel.']];
  nsteps.forEach(([v, t]) => { if (s.notoriety >= v && !s.flags['n' + v]) { s.flags['n' + v] = true; addNews(s, t, 'wo'); } });
}

// ---- Player actions ----
function upCost(s, u) { return Math.round(u.cost * (1 + TUNE.costGrow * s.owned.length)); }
function canBuy(s, u) {
  if (s.owned.includes(u.id)) return { ok: false, why: 'Owned' };
  if (u.req && !s.owned.includes(u.req)) return { ok: false, why: 'Needs ' + UPGRADES.find(x => x.id === u.req).name };
  if (s.clout < upCost(s, u)) return { ok: false, why: 'Not enough Clout' };
  return { ok: true };
}
function buyUpgrade(s, id) {
  const u = UPGRADES.find(x => x.id === id); const chk = canBuy(s, u); if (!chk.ok) return chk;
  s.clout -= upCost(s, u); s.owned.push(id);
  const st = s.stats;
  Object.entries(u.fx).forEach(([k, v]) => {
    if (k === 'pen') Object.entries(v).forEach(([t, p]) => { st.pen[t] += p; });
    else if (k === 'treaty') s.treaty = Math.max(0, s.treaty + v);
    else if (k === 'seed') {
      const zeros = COUNTRIES.filter(c => s.inf[c.id] <= 0);
      for (let i = 0; i < v && zeros.length; i++) seed(s, zeros.splice(Math.floor(rng(s) * zeros.length), 1)[0].id, 2, null);
    } else st[k] += (['growth', 'border', 'trade', 'reach'].includes(k) ? v * TUNE.fxScale : v);
  });
  return { ok: true };
}
function opCost(s, op) { return op.id === 'dossier' ? op.cost - s.stats.dossierDiscount : op.cost; }
function opCooldown(s, op) { return op.id === 'summit' ? op.cd - s.stats.summitCd : op.cd; }
function strongest(s, exclude) {
  return COUNTRIES.filter(c => c.id !== exclude).reduce((a, c) => (s.inf[c.id] > s.inf[a.id] ? c : a), COUNTRIES.find(c => c.id !== exclude));
}
function canOp(s, opId, target) {
  const op = OPS.find(o => o.id === opId);
  if (s.over) return { ok: false, why: 'Game over' };
  if ((s.ready[opId] || 0) > s.week) return { ok: false, why: `Ready in ${s.ready[opId] - s.week} wk` };
  if (s.clout < opCost(s, op)) return { ok: false, why: 'Not enough Clout' };
  if (opId === 'trade') {
    const src = strongest(s, target);
    if (s.inf[src.id] < 10) return { ok: false, why: 'Need 10%+ somewhere else first' };
    if (tradeLinks(s, target).includes(src.id)) return { ok: false, why: 'Already trades with ' + src.name };
  }
  if (opId === 'snap') {
    if (!neighbours(target).some(n => s.inf[n] >= 25)) return { ok: false, why: 'Needs a neighbour at 25%+' };
    if (s.inf[target] >= 90) return { ok: false, why: 'Already yours' };
  }
  if (opId === 'summit' && s.mods.some(m => m.id === target && m.kind === 'summit' && m.until > s.week)) return { ok: false, why: 'Summit already running' };
  return { ok: true };
}
function doOp(s, opId, target) {
  const chk = canOp(s, opId, target); if (!chk.ok) return chk;
  const op = OPS.find(o => o.id === opId); const c = byId(target);
  s.clout -= opCost(s, op); s.ready[opId] = s.week + opCooldown(s, op);
  if (opId === 'summit') { s.mods.push({ id: target, kind: 'summit', until: s.week + 25 }); s.notoriety += 1; addNews(s, `Summit in ${c.name} ends with a handshake that lasts 11 seconds.`, 'you'); }
  if (opId === 'trade') { const src = strongest(s, target); s.trade.push([src.id, target]); s.notoriety += 1; addNews(s, `${src.name} and ${c.name} sign a trade deal nobody has read.`, 'you'); }
  if (opId === 'snap') { const push = 10 * (1 + 0.5 * s.stats.snapBoost); if (s.inf[target] <= 0) seed(s, target, 1, null); s.inf[target] = Math.min(100, s.inf[target] + push); s.notoriety += 5; addNews(s, `Snap exercise on the ${c.name} border. Tanks described as “just visiting”.`, 'you'); }
  if (opId === 'dossier') { s.mods.push({ id: target, kind: 'dossier', until: s.week + 20 }); s.notoriety += 8; addNews(s, `Leaked dossiers embarrass ${c.name}’s cabinet. The PDFs were suspiciously well formatted.`, 'wo'); }
  s.notoriety = Math.min(100, s.notoriety);
  return { ok: true };
}
// SIM-END
if (typeof module !== 'undefined') module.exports = { upCost, TUNE, COUNTRIES, BORDERS, UPGRADES, OPS, createState, step, buyUpgrade, doOp, canOp, canBuy, collectBubble, alignedShare, effRes, neighbours };
