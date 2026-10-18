// SIM-START
// ---------- Global Ideology: simulation core (pure, UI-free) ----------
const TYPES = ['eco', 'mil', 'dip', 'ideo'];
const TYPE_LABEL = { eco: 'Economic', mil: 'Military', dip: 'Diplomatic', ideo: 'Ideological' };

// Countries from Pavel's countries.docx (Sep 2025). Resistances map 100 -> .15, 200 -> .35, 300 -> .55, 400 -> .75.
// Celestia, Tavaro, Kestria and Pinguinia fill map gaps (Western Europe, Middle East, Africa, the pole).
const COUNTRIES = [
  { id: 'borealis',   name: 'Borealis',   pop: 38,   x: 150, y: 95,  res: { mil: .55, eco: .55, dip: .55, ideo: .55 }, traits: ['Federal', 'Resource-rich'], desc: 'A sprawling northern dominion of vast wilderness. Tolerant, decentralised and hard to influence as a single entity.' },
  { id: 'aethelgard', name: 'Aethelgard', pop: 330,  x: 205, y: 220, res: { mil: .75, eco: .75, dip: .75, ideo: .15 }, traits: ['Superpower', 'Divided politics'], desc: 'A sprawling federation with a powerful, sometimes divided, government. Strong on every front except ideas: it will try any of them once.' },
  { id: 'laplata',    name: 'La Plata',   pop: 46,   x: 290, y: 450, res: { mil: .55, eco: .15, dip: .15, ideo: .15 }, traits: ['Agricultural wealth', 'Unstable'], desc: 'Great natural beauty, vast farmland and a long history of political turmoil. Very open to a good economic offer.' },
  { id: 'isolde',     name: 'Isolde',     pop: 0.4,  x: 395, y: 55,  res: { mil: .15, eco: .55, dip: .35, ideo: .35 }, traits: ['Island', 'Close-knit'], desc: 'A remote island of fire and ice. Small, self-reliant and proud of its heritage.' },
  { id: 'guldor',     name: 'Guldor',     pop: 68,   x: 430, y: 128, res: { mil: .35, eco: .35, dip: .75, ideo: .35 }, traits: ['Island', 'Old money'], desc: 'An ancient kingdom of trade and exploration. Its power rests on centuries of relationships and very old treaties.' },
  { id: 'celestia',   name: 'Celestia',   pop: 67,   x: 480, y: 240, res: { mil: .30, eco: .40, dip: .60, ideo: .60 }, traits: ['Cultural power'], desc: 'Philosophers, painters and strikes. Soft power, soft army.' },
  { id: 'helvetia',   name: 'Helvetia',   pop: 9,    x: 555, y: 205, res: { mil: .15, eco: .75, dip: .55, ideo: .35 }, traits: ['Neutral', 'Financial centre'], desc: 'A neutral, prosperous alpine republic. Its banks are everywhere; its opinions, officially, nowhere.' },
  { id: 'pannonia',   name: 'Pannonia',   pop: 10,   x: 615, y: 155, res: { mil: .15, eco: .15, dip: .35, ideo: .35 }, traits: ['Landlocked', 'Unpredictable'], desc: 'A landlocked state with a proud history and a distinct identity, often at odds with its own alliances.' },
  { id: 'koryn',      name: 'Koryn',      pop: 145,  x: 755, y: 95,  res: { mil: .55, eco: .35, dip: .35, ideo: .55 }, traits: ['Authoritarian', 'Resource-rich'], desc: 'A vast, resource-rich nation with a centralised government and a proud military history.' },
  { id: 'tavaro',     name: 'Tavaro',     pop: 90,   x: 665, y: 305, res: { mil: .60, eco: .70, dip: .40, ideo: .60 }, traits: ['Crossroads', 'Oil'], desc: 'A desert crossroads sitting on the world’s favourite resource.' },
  { id: 'kestria',    name: 'Kestria',    pop: 220,  x: 545, y: 430, res: { mil: .30, eco: .30, dip: .30, ideo: .40 }, traits: ['Young population'], desc: 'The youngest population on the map. Ideas spread here fast.', growthMul: 1.25 },
  { id: 'bharat',     name: 'Bharat',     pop: 900,  x: 780, y: 340, res: { mil: .55, eco: .35, dip: .35, ideo: .55 }, traits: ['Colossal democracy', 'Tech boom'], desc: 'A colossal democracy of vibrant cultures and a booming tech sector. Its diversity is both a strength and a way in.' },
  { id: 'sinopeia',   name: 'Sinopeia',   pop: 900,  x: 860, y: 225, res: { mil: .55, eco: .75, dip: .55, ideo: .55 }, traits: ['Authoritarian', 'Manufacturing giant'], desc: 'A vast, ancient empire with a disciplined, centrally run society. Nothing enters without paperwork.' },
  { id: 'juche',      name: 'Juche',      pop: 26,   x: 935, y: 120, res: { mil: .15, eco: .15, dip: .15, ideo: .75 }, traits: ['Isolated', 'Personality cult'], desc: 'A fiercely isolated nation built around one leader’s portrait. Unmoved by any idea but the official one.' },
  { id: 'nippon',     name: 'Nippon',     pop: 125,  x: 962, y: 292, res: { mil: .55, eco: .75, dip: .75, ideo: .55 }, traits: ['Island', 'Hyper-advanced'], desc: 'An island nation with a hyper-advanced economy and a disciplined, ageing society.' },
  { id: 'pinguinia',  name: 'Pinguinia',  pop: 0.05, x: 470, y: 540, res: { mil: .10, eco: .20, dip: .90, ideo: .90 }, traits: ['Polar', 'Research stations'], desc: 'Fifty thousand scientists and considerably more penguins.' }
];
const BORDERS = [
  ['borealis', 'aethelgard'], ['celestia', 'helvetia'], ['helvetia', 'pannonia'], ['celestia', 'pannonia'],
  ['pannonia', 'koryn'], ['koryn', 'tavaro'], ['koryn', 'sinopeia'], ['koryn', 'juche'], ['sinopeia', 'juche'],
  ['sinopeia', 'bharat'], ['bharat', 'tavaro'], ['tavaro', 'kestria']
];
const TRADE = [
  ['aethelgard', 'guldor'], ['guldor', 'celestia'], ['isolde', 'guldor'], ['isolde', 'borealis'],
  ['aethelgard', 'laplata'], ['laplata', 'kestria'], ['celestia', 'kestria'], ['bharat', 'kestria'],
  ['nippon', 'sinopeia'], ['nippon', 'juche'], ['helvetia', 'guldor'], ['laplata', 'pinguinia'], ['tavaro', 'celestia']
];

// Pavel's skill tree (skilltree 10092025.xlsx), adapted to the World Order model.
// Opposed pairs lock at tier 2: Ideology vs Economy, Military vs Diplomacy.
// Each branch is boosted by the tier-3 upgrade of its partner, and its tier-4 capstone needs it:
// Ideology <- Diplomacy, Diplomacy <- Ideology, Military <- Economy, Economy <- Military, Faith <-> Covert Ops.
const BRANCHES = [
  { id: 'ideo', name: 'Ideology', blurb: 'Grows support inside countries.', partner: 'dip' },
  { id: 'eco', name: 'Economy', blurb: 'Spreads along trade routes. Earns Clout.', partner: 'mil' },
  { id: 'mil', name: 'Military', blurb: 'Breaks resistance and makes countries refuse the World Order. Loud.', partner: 'eco' },
  { id: 'dip', name: 'Diplomacy', blurb: 'Spreads across land borders. Blunts the World Order.', partner: 'ideo' },
  { id: 'faith', name: 'Faith', blurb: 'Crosses oceans and borders on its own.', partner: 'covert', unlock: 'reach' },
  { id: 'covert', name: 'Covert Ops', blurb: 'Weakens every defence. Very loud.', partner: 'faith', unlock: 'wo' },
  { id: 'spin', name: 'Spin', blurb: 'Keeps the World Order busy.' }
];
const UPGRADES = [
  { id: 'i1', b: 'ideo', name: 'Charismatic Leadership', cost: 5, fx: { growth: .025 }, boost: { growth: .01 }, text: 'Internal growth +25%', btext: 'another +10%' },
  { id: 'i2', b: 'ideo', name: 'Doctrinal Purity', cost: 9, fx: { growth: .025, pen: { ideo: .15 } }, boost: { pen: { ideo: .05 } }, text: 'Internal growth +25%. Ideological resistance −15%', btext: 'another −5% ideological' },
  { id: 'i3', b: 'ideo', name: 'Social Engineering', cost: 15, fx: { growth: .035, income: 1 }, boost: { growth: .025, income: .5 }, text: 'Internal growth +35%. Clout income up', btext: 'more growth and income' },
  { id: 'i4', b: 'ideo', name: 'Utopia', cost: 16, special: 'utopia', text: 'Special action: for 26 weeks internal growth and Clout income double, but you cannot run operations' },

  { id: 'e1', b: 'eco', name: 'Trade Deals', cost: 5, fx: { income: .7, trade: .02 }, boost: { trade: .015 }, text: 'Clout income up. Trade spread up', btext: 'trade spread up more' },
  { id: 'e2', b: 'eco', name: 'Resource Leverage', cost: 9, fx: { trade: .03, pen: { eco: .2 } }, boost: { pen: { eco: .1 }, trade: .01 }, text: 'Trade spread up. Economic resistance −20%', btext: 'another −10% economic, more trade spread' },
  { id: 'e3', b: 'eco', name: 'Monopolization', cost: 14, fx: { income: 1, pen: { eco: .2, dip: .1 } }, boost: { income: .6 }, text: 'Clout income up a lot. Economic resistance −20%, diplomatic −10%', btext: 'more income' },
  { id: 'e4', b: 'eco', name: 'Government Bribe', cost: 16, special: 'bribe', text: 'Special action: a World Order member of your choice (not the HQ) quits, tears up its signature, and gives you +25% support there' },

  { id: 'm1', b: 'mil', name: 'Military Parade', cost: 5, fx: { pen: { mil: .2, ideo: .05 }, border: .01, loud: .01 }, boost: { pen: { mil: .1 }, border: .01 }, text: 'Military resistance −20%, ideological −5%. Louder', btext: 'another −10% military, more border spread' },
  { id: 'm2', b: 'mil', name: 'Cyber Operations', cost: 9, fx: { pen: { dip: .1 }, growth: .03, border: .02, snapBoost: 1 }, boost: { sabotage: .25 }, text: 'Diplomatic resistance −10%. Growth and border spread up. Snap Exercises push 50% harder', btext: '25% of World Order campaigns and sanctions fail' },
  { id: 'm3', b: 'mil', name: 'Sovereign Intervention', cost: 14, fx: { border: .03, pen: { mil: .2 }, shield: 15, loud: .01 }, boost: { shield: 10 }, text: 'Border spread up. Countries need 15 points less of your support to refuse the World Order. Louder', btext: '10 points more' },
  { id: 'm4', b: 'mil', name: 'Stoppage Order', cost: 16, special: 'stoppage', text: 'Special action: freezes the World Order for 10 weeks. No drafting, no new moves, and planned moves wait' },

  { id: 'd1', b: 'dip', name: 'Embassy', cost: 4, fx: { border: .02 }, boost: { border: .015 }, text: 'Border spread up', btext: 'more border spread' },
  { id: 'd2', b: 'dip', name: 'Regional Summit', cost: 9, fx: { border: .03, pen: { dip: .15 }, summitCd: 12 }, boost: { pen: { dip: .1 } }, text: 'Border spread up. Diplomatic resistance −15%. Summits recharge faster', btext: 'another −10% diplomatic' },
  { id: 'd3', b: 'dip', name: 'Sanctions Hammer', cost: 14, fx: { border: .02, vis: -.1, fcRed: .3 }, boost: { fcRed: .2, border: .01 }, text: 'Border spread up. Notoriety grows 10% slower. World Order campaigns hit 30% softer', btext: '20% softer again' },
  { id: 'd4', b: 'dip', name: 'Alliance Breaker', cost: 16, special: 'breaker', text: 'Special action: a World Order member of your choice (not the HQ) leaves, and every resistance in the world drops 8% for good' },

  { id: 'f1', b: 'faith', name: 'Word of God', cost: 6, fx: { reach: .007, pen: { ideo: .1 } }, boost: { reach: .002 }, text: 'Can take root in distant countries. Ideological resistance −10%', btext: 'further reach' },
  { id: 'f2', b: 'faith', name: 'Congregations', cost: 10, fx: { reach: .008, growth: .01, trade: .02, income: 1 }, boost: { income: .5 }, text: 'Distant reach up. Growth, trade spread and Clout income up a little', btext: 'more income' },
  { id: 'f3', b: 'faith', name: 'Pilgrim Prophets', cost: 15, fx: { growth: .03, pen: { ideo: .15 }, opDiscount: 1 }, boost: { opDiscount: 1 }, text: 'Internal growth +30%. Ideological resistance −15%. Operations cost 1 Clout less', btext: '1 Clout less again' },
  { id: 'f4', b: 'faith', name: 'Believe!', cost: 16, special: 'believe', text: 'Special action: the World Order HQ loses its faith in the treaty. It quits, a new HQ takes over, and the draft drops 15%' },

  { id: 'c1', b: 'covert', name: 'Sleeper Agents', cost: 6, fx: { pen: { eco: .05, mil: .05, dip: .05, ideo: .05 }, loud: .02 }, once: { seed: 2 }, boost: { pen: { eco: .03, mil: .03, dip: .03, ideo: .03 } }, text: 'Plants support in 2 random countries. All resistances −5%', btext: 'another −3% everywhere' },
  { id: 'c2', b: 'covert', name: 'Asset Degradation', cost: 10, fx: { hiCut: .1, loud: .03, dossierDiscount: 4 }, boost: { hiCut: .05 }, text: 'Every country’s strongest resistance drops by 10 points. Leaked Dossiers cost less', btext: '5 points more' },
  { id: 'c3', b: 'covert', name: 'Orchestrated Unrest', cost: 16, fx: { pen: { eco: .08, mil: .08, dip: .08, ideo: .08 }, sabotage: .4, loud: .07 }, boost: { sabotage: .15 }, text: 'All resistances −8%. 40% of World Order campaigns and sanctions fall apart. Much louder', btext: '15% more fall apart' },
  { id: 'c4', b: 'covert', name: 'Hybrid Threat', cost: 16, special: 'hybrid', text: 'Special action: every sanction is lifted, every planned World Order move is cancelled, and it cannot sanction you for 40 weeks' },

  { id: 's1', b: 'spin', name: 'Plausible Deniability', cost: 5, fx: { vis: -.15 }, text: 'Notoriety grows 15% slower' },
  { id: 's2', b: 'spin', name: 'Friendly Fact-Checkers', cost: 9, fx: { fcRed: .5 }, text: 'World Order counter-campaigns hit half as hard' },
  { id: 's3', b: 'spin', name: 'Subcommittee on Subcommittees', cost: 14, fx: { treatySlow: .25 }, text: 'Treaty drafting 25% slower' },
  { id: 's4', b: 'spin', name: 'Lobbyist Weekend Retreat', cost: 20, fx: { treatySlow: .15 }, once: { treaty: -20 }, text: 'Treaty progress −20 points. Drafting 15% slower' }
];
UPGRADES.forEach((u, i) => { const prev = UPGRADES[i - 1]; u.req = prev && prev.b === u.b ? prev.id : null; u.tier = UPGRADES.slice(0, i).filter(x => x.b === u.b).length; });
const OPPOSITE = { ideo: 'eco', eco: 'ideo', mil: 'dip', dip: 'mil' };
// the tier-3 upgrade that boosts each branch (and gates its capstone)
const SYNERGY = { ideo: 'd3', dip: 'i3', mil: 'e3', eco: 'm3', faith: 'c3', covert: 'f3' };
const CAPSTONE_NEEDS = { i4: 'd3', d4: 'i3', m4: 'e3', e4: 'm3' };
const SPECIALS = {
  utopia: { name: 'Utopia', target: false },
  bribe: { name: 'Government Bribe', target: true },
  stoppage: { name: 'Stoppage Order', target: false },
  breaker: { name: 'Alliance Breaker', target: true },
  believe: { name: 'Believe!', target: false },
  hybrid: { name: 'Hybrid Threat', target: false }
};
const REBRAND_COST = 10, REBRAND_NOTORIETY = 15;
const FAITH_UNLOCK_COUNTRIES = 4;

const OPS = [
  { id: 'summit', name: 'Summit', branch: 'Diplomacy', cost: 6, cd: 30, text: 'All resistances here −40% for 25 weeks, and derails any World Order move planned here. Quiet.' },
  { id: 'trade', name: 'Trade Deal', branch: 'Economy', cost: 8, cd: 40, text: 'Opens a trade route from your strongest country.' },
  { id: 'snap', name: 'Snap Exercise', branch: 'Military', cost: 8, cd: 30, text: 'Pushes +10% support next to a country you hold 25%+ of, and cancels any World Order move planned there. Loud.' },
  { id: 'dossier', name: 'Leaked Dossiers', branch: 'Covert Ops', cost: 10, cd: 45, text: 'Diplomatic and ideological resistance here drop to 0 for 20 weeks. A World Order member walks out and tears up its signature. Very loud.' }
];

const WIN_SHARE = 0.70;
const SIGNATURES_TO_LOSE = 8;
const SG = 'Secretary-General Horatio Quorum';
const TUNE = { evBad: .65, evGap: 12, milNoSummit: true, fxScale: 0.4, treaty: 2.6, memberRes: 0.15, signBelow: 60, joinBelow: 50, withdrawAt: 70, lead: 6, planBase: 6, founders: 2, noto: 1.5, reachNoto: 0.12, pressure: 6, coalitionAt: 8, costGrow: 0.03, income: 3, shareIncome: 1.5 };
const CONTROL = 60; // % support at which a country counts as "held"

// ---- v9: country traits and per-run world conditions ----
// Every country has a quirk (an always-on rule that changes how you play there) and a perk
// (a bonus you get while you hold it at CONTROL% or more). q keys: gMul (internal growth), inMul/outMul (spread into/out of),
// tradeInMul (trade spread into), swing (weekly chance of a +/- support swing), recruitDelta (World Order recruits it only below
// joinBelow-10+delta), noRecruit, signDelta (signing threshold shift), immuneAt (no campaigns once support >= it), woFail
// (chance a World Order move there falls through), dossierAll (Leaked Dossiers zero all four resistances).
// fx keys: income (+Clout points), growth/trade/border (multipliers), vis (notoriety growth, added), fc (campaign softening),
// opDisc (Clout off each operation), opCd (weeks off each cooldown), bubble (+bubble chance), treatySlow, memberRes (World Order member resistance reduction).
const TRAITS = {
  borealis:   { quirk: 'Federal: the World Order can only recruit it below 20% support.', q: { recruitDelta: -20 }, perkName: 'Resource-rich', perk: 'Clout income up a little', fx: { income: .5 } },
  aethelgard: { quirk: 'Divided politics: random support swings of 4–10 points.', q: { swing: .015 }, perkName: 'Superpower ally', perk: 'World Order campaigns hit 30% softer', fx: { fc: .3 } },
  laplata:    { quirk: 'Unstable: frequent support swings, up or down.', q: { swing: .02 }, perkName: 'Breadbasket', perk: 'Trade spread +15%', fx: { trade: 1.15 } },
  isolde:     { quirk: 'Remote: the World Order never recruits it.', q: { noRecruit: true }, perkName: 'Hideout', perk: 'Clout income up a little', fx: { income: .2 } },
  guldor:     { quirk: 'Old money: ideas travel out of Guldor 50% faster.', q: { outMul: 1.5 }, perkName: 'Financier', perk: 'Clout income up', fx: { income: 1 } },
  celestia:   { quirk: 'Cultural power: ideas travel out of Celestia 40% faster.', q: { outMul: 1.4 }, perkName: 'Soft power', perk: 'Notoriety grows 10% slower', fx: { vis: -.1 } },
  helvetia:   { quirk: 'Neutral: the World Order cannot run campaigns here.', q: { immuneAt: 1 }, perkName: 'Discreet banking', perk: 'Operations cost 1 Clout less', fx: { opDisc: 1 } },
  pannonia:   { quirk: 'Unpredictable: 40% of World Order moves here fall through.', q: { woFail: .4 }, perkName: 'Landlocked hub', perk: 'Border spread +10%', fx: { border: 1.1 } },
  koryn:      { quirk: 'Authoritarian: slow to convert (−15% growth), but immune to campaigns once you hold 50%.', q: { gMul: .85, immuneAt: 50 }, perkName: 'Resource-rich', perk: 'Clout income up a little', fx: { income: .5 } },
  tavaro:     { quirk: 'Crossroads: spread through Tavaro is 40% faster out, 20% faster in.', q: { outMul: 1.4, inMul: 1.2 }, perkName: 'Oil', perk: 'Clout income up', fx: { income: 1 } },
  kestria:    { quirk: 'Young population: +25% internal growth.', q: {}, perkName: 'Youth movement', perk: 'More opportunity bubbles', fx: { bubble: .06 } },
  bharat:     { quirk: 'Colossal democracy: slow to convert (−15% growth), and needs 10 points less support to refuse a signing.', q: { gMul: .85, signDelta: -10 }, perkName: 'Digital reach', perk: 'Internal growth +10% everywhere', fx: { growth: 1.1 } },
  sinopeia:   { quirk: 'Paperwork: spread into Sinopeia is halved, but out of it +30%.', q: { inMul: .5, outMul: 1.3 }, perkName: 'Manufacturing giant', perk: 'Clout income up', fx: { income: 1 } },
  juche:      { quirk: 'Isolated: no trade spread in, border spread halved, but Leaked Dossiers break every defence.', q: { inMul: .5, tradeInMul: 0, dossierAll: true }, perkName: 'Fanatics', perk: 'Treaty drafting 5% slower', fx: { treatySlow: .05 } },
  nippon:     { quirk: 'Hyper-connected: +15% internal growth.', q: { gMul: 1.15 }, perkName: 'Hyper-advanced', perk: 'Every cooldown 6 weeks shorter', fx: { opCd: 6 } },
  pinguinia:  { quirk: 'Polar: nothing happens here, for now.', q: {}, perkName: 'Neutral scientists', perk: 'World Order members resist 5 points less', fx: { memberRes: .05 } }
};
// Two of these are drawn for every game.
const CONDITIONS = [
  { id: 'tradeboom', name: 'Trade boom', text: 'Trade spread +30%', fx: { trade: 1.3 } },
  { id: 'closed', name: 'Closed borders', text: 'Border spread −25%', fx: { border: .75 } },
  { id: 'media', name: 'Media storm', text: 'More bubbles, Notoriety grows 20% faster', fx: { bubble: .08, vis: .2 } },
  { id: 'hawk', name: 'Hawkish world', text: 'The World Order plans a week faster', fx: { plan: 1 } },
  { id: 'fragmented', name: 'Fragmented diplomacy', text: 'Treaty drafting 15% slower', fx: { treatySlow: .15 } },
  { id: 'austerity', name: 'Austerity', text: 'Clout income −30%', fx: { income: -.5 } }
];
const MULT_KEYS = ['growth', 'trade', 'border'];
function Q(s, id) { return (s.cfg && s.cfg.traits === false) ? {} : ((TRAITS[id] && TRAITS[id].q) || {}); }
function perk(s) {
  const p = { income: 0, growth: 1, trade: 1, border: 1, vis: 0, fc: 0, opDisc: 0, opCd: 0, bubble: 0, treatySlow: 0, memberRes: 0, plan: 0 };
  const add = fx => Object.entries(fx || {}).forEach(([k, v]) => { if (MULT_KEYS.includes(k)) p[k] *= v; else p[k] += v; });
  if (!s.cfg || s.cfg.traits !== false) COUNTRIES.forEach(c => { if (s.inf[c.id] >= CONTROL && TRAITS[c.id]) add(TRAITS[c.id].fx); });
  (s.cond || []).forEach(id => add(CONDITIONS.find(c => c.id === id).fx));
  return p;
}
function resOf(s, id) { return (s.res && s.res[id]) || byId(id).res; }
function signLimit(s, id) { return TUNE.signBelow - s.stats.shield + (Q(s, id).signDelta || 0); }

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function createState(startId, seed, opts) {
  const cfg = Object.assign({ traits: true, random: true }, opts || {});
  const s = {
    cfg, res: null, cond: [],
    v: 5, pending: null, ev: { next: 18, nextDecision: 70, fx: {}, temp: [], seen: {}, log: [], endorsed: null, loudOp: null }, seed: seed >>> 0, rngCalls: 0, week: 0, clout: 5, startId,
    inf: {}, mods: [], trade: TRADE.map(t => t.slice()),
    stats: { growth: .05, border: .02, trade: .015, reach: 0, income: 0, vis: 1, loud: 0, treatySlow: 0, fcRed: 0, summitCd: 0, snapBoost: 0, dossierDiscount: 0, shield: 0, sabotage: 0, hiCut: 0, opDiscount: 0, pen: { eco: 0, mil: 0, dip: 0, ideo: 0 } },
    specials: {}, utopiaUntil: 0, frozenUntil: 0, noSanctionUntil: 0,
    owned: [], rebranded: false, ready: {}, notoriety: 0, treaty: 0, coalition: false, nextCounter: 0,
    wo: { hq: null, members: {}, signed: {}, queue: [], nextPlan: 0, seq: 0 }, blocked: [],
    bubbles: [], bubbleSeq: 0, news: [], flags: {}, over: null, peakShare: 0
  };
  s.base = JSON.parse(JSON.stringify(s.stats));
  COUNTRIES.forEach(c => { s.inf[c.id] = 0; });
  s.inf[startId] = 3;
  s.flags['seed_' + startId] = true;
  addNews(s, `Unknown movement stirs in ${byId(startId).name}. Local officials call it “a phase”.`, 'you');
  if (cfg.random) {
    // per-run variation: every country's defences shift by up to +/-15%, and two world conditions apply.
    // Sinopeia and Bharat (the two giants you need to win) can never end up much harder than their base values.
    s.res = {};
    COUNTRIES.forEach(c => {
      s.res[c.id] = {};
      TYPES.forEach(t => {
        let v = c.res[t] * (1 + (rng(s) - .5) * .3);
        if (c.id === 'sinopeia' || c.id === 'bharat') v = Math.min(v, c.res[t] + .03);
        s.res[c.id][t] = Math.round(Math.min(.9, Math.max(.05, v)) * 100) / 100;
      });
    });
    const pool = CONDITIONS.slice();
    for (let i = 0; i < 2; i++) s.cond.push(pool.splice(Math.floor(rng(s) * pool.length), 1)[0].id);
    addNews(s, `World conditions this game: ${s.cond.map(id => CONDITIONS.find(c => c.id === id).name).join(' and ')}.`, 'world');
  }
  return s;
}
function rng(s) { const r = mulberry32(s.seed + s.rngCalls * 7919)(); s.rngCalls++; return r; }
function byId(id) { return COUNTRIES.find(c => c.id === id); }
function addNews(s, text, kind) { s.newsSeq = (s.newsSeq || 0) + 1; s.news.unshift({ week: s.week, text, kind: kind || 'world', seq: s.newsSeq }); if (s.news.length > 40) s.news.pop(); }
// Mark the latest news item for the UI: level 'important' | 'critical' raises an alert; id pins it to a country; tag is the short map label.
function newsCountry(text) { let best = null, at = 1e9; COUNTRIES.forEach(c => { const i = text.indexOf(c.name); if (i >= 0 && i < at) { at = i; best = c.id; } }); return best; }
function flag(s, level, id, tag) { const n = s.news[0]; if (!n) return; n.level = level; if (id) n.id = id; if (tag) n.tag = tag; }
function worldPop() { return COUNTRIES.reduce((a, c) => a + c.pop, 0); }
function alignedShare(s) { return COUNTRIES.reduce((a, c) => a + c.pop * s.inf[c.id] / 100, 0) / worldPop(); }
function neighbours(id) { return BORDERS.filter(e => e.includes(id)).map(e => e[0] === id ? e[1] : e[0]); }
function tradeLinks(s, id) { return s.trade.filter(e => e.includes(id)).map(e => e[0] === id ? e[1] : e[0]); }

function resBreakdown(s, id) {
  const c = byId(id); const out = {};
  const active = s.mods.filter(m => m.id === id && m.until > s.week);
  const mul = active.filter(m => m.kind === 'summit').length ? 0.6 : 1;
  const add = (active.filter(m => m.kind === 'counter').length ? 0.25 : 0) + (s.wo && s.wo.members[id] ? Math.max(0, TUNE.memberRes - perk(s).memberRes) : 0);
  const zero = active.filter(m => m.kind === 'dossier').length ? (Q(s, id).dossierAll ? TYPES : ['dip', 'ideo']) : [];
  const base = resOf(s, id);
  const hi = TYPES.reduce((a, t) => (base[t] > base[a] ? t : a), TYPES[0]);
  TYPES.forEach(t => {
    let v = zero.includes(t) ? 0 : Math.max(0, base[t] - (t === hi ? s.stats.hiCut : 0)) * (1 - Math.min(.85, s.stats.pen[t]));
    active.filter(m => m.kind === 'res' && (!m.types || m.types.includes(t))).forEach(m => { v *= m.mul; });
    v = Math.min(.95, Math.max(0, v * mul + add));
    out[t] = v;
  });
  return out;
}
function effRes(s, id) { const b = resBreakdown(s, id); return (b.eco + b.mil + b.dip + b.ideo) / 4; }

function step(s) {
  if (s.over || s.pending) return;
  s.week++;
  const R = {}; COUNTRIES.forEach(c => { R[c.id] = effRes(s, c.id); });
  const d = {}; COUNTRIES.forEach(c => { d[c.id] = 0; });
  const st = s.stats;
  const pk = perk(s);
  // 1. Internal growth (logistic)
  COUNTRIES.forEach(c => {
    const v = s.inf[c.id]; if (v <= 0) return;
    const g = st.growth * (c.growthMul || 1) * (Q(s, c.id).gMul || 1) * pk.growth * (1 - R[c.id]) * (s.week < s.utopiaUntil ? 2 : 1) * (fxOn(s, 'growthMul') || 1);
    d[c.id] += g * v * (1 - v / 100) + 0.04 * (1 - R[c.id]);
  });
  // 1b. Quirk: support swings (unstable countries)
  COUNTRIES.forEach(c => {
    const sw = Q(s, c.id).swing; if (!sw || s.inf[c.id] < 8) return;
    if (rng(s) < sw) {
      const delta = (rng(s) < .5 ? -1 : 1) * (4 + 6 * rng(s));
      d[c.id] += delta;
      if (s.inf[c.id] >= 5) { addNews(s, delta > 0 ? `A populist wave in ${c.name} lifts your movement.` : `A scandal in ${c.name} knocks your movement back.`, delta > 0 ? 'you' : 'wo'); flag(s, 'ping', c.id, delta > 0 ? 'Swing up' : 'Swing down'); }
    }
  });
  // 2. Spread over borders and trade routes
  const spread = (a, b, rate, kind) => {
    [[a, b], [b, a]].forEach(([src, dst]) => {
      const sv = s.inf[src]; if (sv < 8) return;
      const inward = s.mods.some(m => m.id === src && m.inward && m.until > s.week) ? .5 : 1;
      const qIn = kind === 'trade' && Q(s, dst).tradeInMul !== undefined ? Q(s, dst).tradeInMul : (Q(s, dst).inMul || 1);
      const pull = rate * inward * qIn * (Q(s, src).outMul || 1) * (sv / 100) * (1 - R[dst]);
      if (s.inf[dst] <= 0) {
        if (rng(s) < pull * 3) seed(s, dst, 1, src);
      } else if (s.inf[dst] < sv) {
        d[dst] += pull * TUNE.pressure;
      }
    });
  };
  BORDERS.forEach(([a, b]) => spread(a, b, st.border * pk.border, 'border'));
  s.trade.forEach(([a, b]) => { if (!isBlocked(s, a, b)) spread(a, b, st.trade * pk.trade * (fxOn(s, 'tradeMul') || 1), 'trade'); });
  // 3. Faith reach: distant seeding
  if (st.reach > 0) COUNTRIES.forEach(c => {
    if (s.inf[c.id] <= 0 && rng(s) < st.reach * (1 + 6 * alignedShare(s)) * (1 - R[c.id])) seed(s, c.id, 1, null);
  });
  COUNTRIES.forEach(c => { s.inf[c.id] = Math.max(0, Math.min(100, s.inf[c.id] + d[c.id])); });

  const share = alignedShare(s); s.peakShare = Math.max(s.peakShare, share);
  // 4. Clout income + opportunity bubbles
  s.clout += TUNE.income * Math.max(0.05, 0.12 + 0.06 * (st.income + pk.income)) * (1 + TUNE.shareIncome * share) * (s.week < s.utopiaUntil ? 2 : 1) * (fxOn(s, 'incomeMul') || 1);
  s.bubbles = s.bubbles.filter(b => b.until > s.week);
  const held = COUNTRIES.filter(c => s.inf[c.id] > 0);
  if (held.length && rng(s) < 0.16 + 0.1 * share + pk.bubble) {
    const c = held[Math.floor(rng(s) * held.length)];
    spawnBubble(s, c.id, 1 + (rng(s) < 0.35 ? 1 : 0));
  }
  // 5. Notoriety and the World Order
  const vis = Math.max(0.2, st.vis + pk.vis);
  s.notoriety = Math.min(100, s.notoriety + vis * (0.01 + TUNE.noto * share + TUNE.reachNoto * COUNTRIES.filter(c => s.inf[c.id] >= 5).length / COUNTRIES.length) + st.loud);
  if (!s.coalition && s.notoriety >= TUNE.coalitionAt) woActivate(s);
  if (s.coalition && s.week < s.frozenUntil) { s.wo.queue.forEach(q => { q.at++; q.planned++; }); s.wo.nextPlan++; }
  else if (s.coalition) {
    s.treaty = Math.min(100, Math.max(0, s.treaty + TUNE.treaty * (0.35 + s.notoriety / 100) * (1 - Math.min(.8, st.treatySlow + pk.treatySlow))));
    treatyNews(s);
    woTick(s);
  }
  milestoneNews(s, share);
  eventsTick(s);
  s.mods = s.mods.filter(m => m.until > s.week);
  s.blocked = s.blocked.filter(b => b.until > s.week);
  // 6. End conditions
  if (share >= WIN_SHARE) { s.over = 'win'; addNews(s, 'The world wakes up aligned. Nobody remembers agreeing to it.', 'you'); }
  else if (s.coalition && s.wo.hopeless >= 26) { s.over = 'collapse'; addNews(s, 'The Containment Treaty collapses. The World Order rebrands as a book club.', 'you'); }
  else if (signedCount(s) >= SIGNATURES_TO_LOSE) { s.over = 'treaty'; addNews(s, `Containment Treaty ratified by ${SIGNATURES_TO_LOSE} nations. ${SG} weeps with joy into a fountain pen.`, 'wo'); }
  else if (COUNTRIES.every(c => s.inf[c.id] <= 0)) { s.over = 'extinct'; addNews(s, 'Your movement has vanished. Historians shrug.', 'wo'); }
}

function seed(s, id, amount, src) {
  s.inf[id] = Math.max(s.inf[id], amount);
  if (!s.flags['seed_' + id]) {
    s.flags['seed_' + id] = true;
    const c = byId(id);
    addNews(s, src ? `Your ideas reach ${c.name} from ${byId(src).name}.` : `Your ideas appear in ${c.name}. Nobody is sure how.`, 'you'); flag(s, 'ping', c.id, 'New foothold');
    spawnBubble(s, id, 2);
  }
}
function spawnBubble(s, id, value) { s.bubbles.push({ key: ++s.bubbleSeq, id, value, until: s.week + 7 }); }
function collectBubble(s, key) {
  const i = s.bubbles.findIndex(b => b.key === key); if (i < 0) return 0;
  const v = s.bubbles[i].value; s.bubbles.splice(i, 1); s.clout += v; return v;
}

function counterCampaign(s, target) {
  const fc = Math.min(.9, s.stats.fcRed + perk(s).fc);
  const t = byId(target);
  s.inf[t.id] = Math.max(0, s.inf[t.id] - 10 * (1 - fc));
  s.mods.push({ id: t.id, kind: 'counter', until: s.week + Math.round(25 * (1 - fc / 2)) });
  const lines = [
    `World Order launches awareness campaign in ${t.name}. Leaflets feature a stern owl.`,
    `Fact-checkers descend on ${t.name}. Your slogans rated \u201cmostly vibes\u201d.`,
    `World Order funds ${t.name} civics classes. Attendance: mandatory, enthusiasm: optional.`,
    `${t.name} bans your pamphlets, then prints more to explain the ban.`
  ];
  addNews(s, lines[Math.floor(rng(s) * lines.length)], 'wo');
}

// ---- The World Order: a visible opponent ----
function signedCount(s) { return Object.keys(s.wo.signed).length; }
function memberCount(s) { return Object.keys(s.wo.members).length; }
function isBlocked(s, a, b) { return s.blocked.some(x => (x.a === a && x.b === b) || (x.a === b && x.b === a)); }
function signCapacity(s) { return Math.floor(s.treaty / (100 / SIGNATURES_TO_LOSE)); }
function pendingOn(s, id) { return s.wo.queue.filter(q => q.target === id); }
function woActivate(s) {
  s.coalition = true;
  // HQ: the most diplomatic country far from your start
  const start = byId(s.startId);
  const cands = COUNTRIES.filter(c => c.id !== s.startId && c.pop >= 1).map(c => ({ c, score: resOf(s, c.id).dip * 2 + Math.hypot(c.x - start.x, c.y - start.y) / 400 - s.inf[c.id] / 50 }));
  const hq = cands.sort((a, b) => b.score - a.score)[0].c;
  s.wo.hq = hq.id; s.wo.members[hq.id] = true; s.wo.nextPlan = s.week + 3;
  // founding members: the HQ's neighbours and trade partners that resist you most
  const near = [...new Set([...neighbours(hq.id), ...tradeLinks(s, hq.id)])].filter(id => s.inf[id] < TUNE.joinBelow && byId(id).pop >= 1).sort((a, b) => s.inf[a] - s.inf[b]).slice(0, TUNE.founders);
  near.forEach(id => { s.wo.members[id] = true; });
  addNews(s, `The World Order convenes in ${hq.name}${near.length ? ' with ' + near.map(id => byId(id).name).join(' and ') : ''}. ${SG}: \u201cWe are deeply concerned, and have formed a committee to be concerned more efficiently.\u201d`, 'wo'); flag(s, 'critical', hq.id, 'World Order HQ');
}
function woPlan(s) {
  const W = s.wo; const lead = TUNE.lead;
  const busy = new Set(W.queue.map(q => q.target));
  const members = Object.keys(W.members);
  const pendingSigns = W.queue.filter(q => q.kind === 'sign').length;
  const push = (kind, target, extra) => { W.queue.push(Object.assign({ key: ++W.seq, kind, target, at: s.week + lead, planned: s.week }, extra || {})); };
  // 1. Signatures, as far as the draft allows
  if (signedCount(s) + pendingSigns < signCapacity(s)) {
    const c = members.filter(id => !W.signed[id] && !busy.has(id) && s.inf[id] < signLimit(s, id)).sort((a, b) => s.inf[a] - s.inf[b])[0];
    if (c) { push('sign', c); addNews(s, `${SG} schedules a signing ceremony in ${byId(c).name} in ${lead} weeks. Commemorative pens ordered.`, 'wo'); flag(s, 'important', c, `Signing in ${lead} wk`); return; }
  }
  // 2. Recruit members: biggest country that still resists you
  const r = rng(s);
  const recruits = COUNTRIES.filter(c => !W.members[c.id] && !busy.has(c.id) && !Q(s, c.id).noRecruit && s.inf[c.id] < TUNE.joinBelow - s.stats.shield - 10 + (Q(s, c.id).recruitDelta || 0) && c.pop >= 1).sort((a, b) => b.pop - a.pop);
  if (recruits.length && (r < 0.55 || memberCount(s) < SIGNATURES_TO_LOSE)) {
    const c = recruits[Math.floor(rng(s) * Math.min(3, recruits.length))];
    push('invite', c.id); addNews(s, `World Order invites ${c.name} to join. RSVP in ${lead} weeks.`, 'wo'); flag(s, 'important', c.id, `Invitation in ${lead} wk`); return;
  }
  // 3. Sanctions: cut a trade route you are using
  const routes = s.trade.filter(([a, b]) => !isBlocked(s, a, b) && Math.max(s.inf[a], s.inf[b]) >= 20 && Math.min(s.inf[a], s.inf[b]) < 60);
  if (routes.length && r < 0.75 && s.week >= s.noSanctionUntil) {
    const [a, b] = routes[Math.floor(rng(s) * routes.length)];
    const target = s.inf[a] < s.inf[b] ? a : b;
    if (!busy.has(target)) { push('sanction', target, { route: [a, b] }); addNews(s, `World Order drafts sanctions on the ${byId(a).name}\u2013${byId(b).name} trade route. Effective in ${lead} weeks.`, 'wo'); flag(s, 'important', a, `Sanctions in ${lead} wk`); return; }
  }
  // 4. Awareness campaign on your biggest foothold
  W.lastCampaign = W.lastCampaign || {};
  const cc = COUNTRIES.filter(c => s.inf[c.id] >= 5 && s.inf[c.id] < 97 && !busy.has(c.id) && !(W.lastCampaign[c.id] > s.week - 20) && !(Q(s, c.id).immuneAt && s.inf[c.id] >= Q(s, c.id).immuneAt));
  if (cc.length) {
    const t = cc.reduce((a, c) => (c.pop * s.inf[c.id] > a.pop * s.inf[a.id] ? c : a));
    push('campaign', t.id); addNews(s, `World Order announces an awareness campaign for ${t.name} in ${lead} weeks.`, 'wo'); flag(s, 'important', t.id, `Campaign in ${lead} wk`);
  }
}
function woExecute(s, q) {
  const W = s.wo; const c = byId(q.target); const v = s.inf[q.target];
  const wf = Q(s, q.target).woFail;
  if (wf && q.kind !== 'sanction' && rng(s) < wf) { addNews(s, `The World Order’s ${q.kind === 'sign' ? 'signing ceremony' : q.kind === 'invite' ? 'invitation' : 'campaign'} in ${c.name} falls through. Nobody can say who was meant to book the room.`, 'you'); flag(s, 'important', q.target, 'Fell through'); return; }
  if (q.kind === 'sign') {
    if (W.members[q.target] && v < signLimit(s, q.target)) { W.signed[q.target] = true; addNews(s, `${c.name} signs the Containment Treaty. ${signedCount(s)} of ${SIGNATURES_TO_LOSE} signatures.`, 'wo'); flag(s, 'critical', q.target, 'Signed treaty'); }
    else { addNews(s, `${c.name} refuses to sign. Your supporters there hid the pens.`, 'you'); flag(s, 'important', q.target, 'Refused to sign'); }
  }
  if (q.kind === 'invite') {
    if (v < TUNE.joinBelow - s.stats.shield + (Q(s, q.target).recruitDelta || 0)) { W.members[q.target] = true; addNews(s, `${c.name} joins the World Order. Membership includes a lanyard.`, 'wo'); flag(s, 'critical', q.target, 'Joined World Order'); }
    else { addNews(s, `${c.name} declines the World Order\u2019s invitation. Too many of its people agree with you.`, 'you'); flag(s, 'important', q.target, 'Declined invitation'); }
  }
  if ((q.kind === 'sanction' || q.kind === 'campaign') && s.stats.sabotage && rng(s) < s.stats.sabotage) { addNews(s, `The World Order\u2019s ${q.kind === 'sanction' ? 'sanctions' : 'campaign'} in ${c.name} collapses amid mysterious scheduling conflicts.`, 'you'); return; }
  if (q.kind === 'sanction') { s.blocked.push({ a: q.route[0], b: q.route[1], until: s.week + 30 }); addNews(s, `Sanctions close the ${byId(q.route[0]).name}\u2013${byId(q.route[1]).name} trade route for 30 weeks.`, 'wo'); flag(s, 'critical', q.route[0], 'Route closed'); }
  if (q.kind === 'campaign') { counterCampaign(s, q.target); W.lastCampaign = W.lastCampaign || {}; W.lastCampaign[q.target] = s.week; }
}
function possibleSignatures(s) { return signedCount(s) + COUNTRIES.filter(c => !s.wo.signed[c.id] && s.inf[c.id] < signLimit(s, c.id)).length; }
function woTick(s) {
  const W = s.wo;
  // Treaty collapse: if the World Order can no longer reach 8 signatures for 26 weeks, it dissolves.
  if (possibleSignatures(s) < SIGNATURES_TO_LOSE) {
    W.hopeless = (W.hopeless || 0) + 1;
    if (W.hopeless === 1) addNews(s, `${SG} counts the remaining undecided nations and asks for a glass of water. Unless 8 signatures become possible within 26 weeks, the treaty collapses.`, 'you'); flag(s, 'important', null, 'Treaty failing');
  } else if (W.hopeless) { W.hopeless = 0; addNews(s, 'The World Order finds enough undecided nations to keep the treaty alive.', 'wo'); flag(s, 'important'); }
  // withdrawals: signed countries that turned to you
  Object.keys(W.signed).forEach(id => { if (s.inf[id] >= TUNE.withdrawAt) { delete W.signed[id]; addNews(s, `${byId(id).name} withdraws its treaty signature. ${SG} is \u201cdisappointed, procedurally\u201d.`, 'you'); flag(s, 'important', id, 'Signature withdrawn'); } });
  W.queue.filter(q => q.at <= s.week).forEach(q => woExecute(s, q));
  W.queue = W.queue.filter(q => q.at > s.week);
  if (fxOn(s, 'woPause')) W.nextPlan = Math.max(W.nextPlan, s.week + 1);
  else if (s.week >= W.nextPlan) { woPlan(s); W.nextPlan = s.week + Math.max(4, Math.round(TUNE.planBase - s.notoriety / 15) - perk(s).plan) * (fxOn(s, 'woSlow') ? 2 : 1); }
}

function treatyNews(s) {
  const steps = [
    [10, 'Treaty working group forms a subcommittee to agree the name of the working group.'],
    [25, 'Containment Treaty draft reaches 400 pages. Font size under negotiation.'],
    [50, 'Treaty halfway done. Delegates agree on the coffee; the verbs are next.'],
    [75, 'Treaty enters final reading. Pens are being ceremonially polished.'],
    [90, 'Signing ceremony booked. Venue: extremely neutral.']
  ];
  steps.forEach(([v, t]) => { if (s.treaty >= v && !s.flags['t' + v]) { s.flags['t' + v] = true; addNews(s, t, 'wo'); flag(s, 'important'); } });
}
function milestoneNews(s, share) {
  const steps = [
    [0.05, 'Pollsters notice your movement. Pollsters also notice lunch.'],
    [0.15, 'Your slogan is now a popular ringtone in several capitals.'],
    [0.30, 'Think tanks publish 11 reports on your rise. They disagree on everything but the fonts.'],
    [0.50, 'Half the world now agrees with you. The other half is typing.'],
    [0.62, 'Your leader’s face appears on a stamp. Philatelists divided.']
  ];
  steps.forEach(([v, t]) => { if (share >= v && !s.flags['m' + v]) { s.flags['m' + v] = true; addNews(s, t, 'you'); flag(s, 'important'); } });
  const nsteps = [[40, 'Notoriety high: foreign ministers now mention you by name.'], [70, 'Notoriety critical: you are the lead story on every channel.']];
  nsteps.forEach(([v, t]) => { if (s.notoriety >= v && !s.flags['n' + v]) { s.flags['n' + v] = true; addNews(s, t, 'wo'); flag(s, 'important'); } });
}

// ---- Player actions ----
function upCost(s, u) { return Math.round(u.cost * (1 + TUNE.costGrow * s.owned.length)); }
function canBuy(s, u) {
  if (s.owned.includes(u.id)) return { ok: false, why: 'Owned' };
  if (u.req && !s.owned.includes(u.req)) return { ok: false, why: 'Needs ' + UPGRADES.find(x => x.id === u.req).name };
  const opp = OPPOSITE[u.b];
  if (opp && u.tier >= 1 && committed(s, opp)) return { ok: false, why: 'Closed: you chose ' + BRANCHES.find(b => b.id === opp).name };
  const lock = branchLock(s, u.b); if (lock) return { ok: false, why: lock };
  if (CAPSTONE_NEEDS[u.id] && !s.owned.includes(CAPSTONE_NEEDS[u.id])) return { ok: false, why: 'Needs ' + UPGRADES.find(x => x.id === CAPSTONE_NEEDS[u.id]).name };
  if (s.clout < upCost(s, u)) return { ok: false, why: 'Not enough Clout' };
  return { ok: true };
}
function branchLock(s, b) {
  const br = BRANCHES.find(x => x.id === b);
  if (br.unlock === 'reach' && COUNTRIES.filter(c => s.inf[c.id] >= 5).length < FAITH_UNLOCK_COUNTRIES && !s.owned.some(id => id[0] === 'f')) return `Opens when your movement is in ${FAITH_UNLOCK_COUNTRIES} countries`;
  if (br.unlock === 'wo' && !s.coalition && !s.owned.some(id => id[0] === 'c')) return 'Opens when the World Order convenes';
  return null;
}
function boosted(s, u) { return !!(SYNERGY[u.b] && s.owned.includes(SYNERGY[u.b])); }
function recomputeStats(s) {
  const st = JSON.parse(JSON.stringify(s.base));
  const add = fx => Object.entries(fx || {}).forEach(([k, v]) => {
    if (k === 'pen') Object.entries(v).forEach(([t, p]) => { st.pen[t] += p; });
    else st[k] += (['growth', 'border', 'trade', 'reach'].includes(k) ? v * TUNE.fxScale : v);
  });
  s.owned.forEach(id => { const u = UPGRADES.find(x => x.id === id); add(u.fx); if (boosted(s, u)) add(u.boost); });
  s.stats = st;
}
function committed(s, b) { return s.owned.some(id => { const u = UPGRADES.find(x => x.id === id); return u.b === b && u.tier >= 1; }); }
function doctrines(s) { return Object.keys(OPPOSITE).filter(b => committed(s, b)); }
function canRebrand(s, b) {
  if (!committed(s, b)) return { ok: false, why: 'Not your doctrine' };
  if (s.rebranded) return { ok: false, why: 'You can only rebrand once' };
  if (s.clout < REBRAND_COST) return { ok: false, why: 'Not enough Clout' };
  return { ok: true };
}
function rebrand(s, b) {
  const chk = canRebrand(s, b); if (!chk.ok) return chk;
  const drop = UPGRADES.filter(u => u.b === b && u.tier >= 1 && s.owned.includes(u.id));
  s.owned = s.owned.filter(id => !drop.some(u => u.id === id));
  drop.forEach(u => { if (u.special && s.specials[u.special] === 'ready') delete s.specials[u.special]; });
  recomputeStats(s);
  const refund = Math.round(drop.reduce((a, u) => a + u.cost, 0) * 0.5);
  s.clout += refund - REBRAND_COST; s.rebranded = true;
  s.notoriety = Math.min(100, s.notoriety + REBRAND_NOTORIETY);
  const nb = BRANCHES.find(x => x.id === b).name, ob = BRANCHES.find(x => x.id === OPPOSITE[b]).name;
  addNews(s, `Your movement announces it has always stood for ${ob}, never ${nb}. Archives are being updated.`, 'you');
  return { ok: true, refund };
}
function buyUpgrade(s, id) {
  const u = UPGRADES.find(x => x.id === id); const chk = canBuy(s, u); if (!chk.ok) return chk;
  s.clout -= upCost(s, u); s.owned.push(id);
  if (u.once && u.once.treaty) s.treaty = Math.max(0, s.treaty + u.once.treaty);
  if (u.once && u.once.seed) { const zeros = COUNTRIES.filter(c => s.inf[c.id] <= 0); for (let i = 0; i < u.once.seed && zeros.length; i++) seed(s, zeros.splice(Math.floor(rng(s) * zeros.length), 1)[0].id, 2, null); }
  if (u.special) { s.specials[u.special] = 'ready'; addNews(s, `${u.name} is ready. Use it when the moment is right: it works once.`, 'you'); }
  recomputeStats(s);
  const partnerOf = Object.keys(SYNERGY).find(b => SYNERGY[b] === id);
  if (partnerOf && s.owned.some(x => x[0] === partnerOf[0] && UPGRADES.find(y => y.id === x).b === partnerOf)) addNews(s, `${u.name} strengthens your ${BRANCHES.find(b => b.id === partnerOf).name} upgrades.`, 'you');
  if (u.tier === 1 && OPPOSITE[u.b]) addNews(s, `You commit to ${BRANCHES.find(b => b.id === u.b).name}. ${BRANCHES.find(b => b.id === OPPOSITE[u.b]).name} is off the table.`, 'you');
  return { ok: true };
}
function opCost(s, op) { return Math.max(1, (op.id === 'dossier' ? op.cost - s.stats.dossierDiscount : op.cost) - s.stats.opDiscount - perk(s).opDisc); }
function opCooldown(s, op) { return Math.max(8, (op.id === 'summit' ? op.cd - s.stats.summitCd : op.cd) - perk(s).opCd); }
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
  if (s.week < s.utopiaUntil) return { ok: false, why: `Utopia: no operations for ${s.utopiaUntil - s.week} wk` };
  if (opId === 'snap' && committed(s, 'dip')) return { ok: false, why: 'Closed by your Diplomacy doctrine' };
  if (opId === 'summit' && committed(s, 'mil') && TUNE.milNoSummit) return { ok: false, why: 'Closed by your Military doctrine' };
  if (opId === 'snap' && !pendingOn(s, target).length) {
    if (!neighbours(target).some(n => s.inf[n] >= 25)) return { ok: false, why: 'Needs a neighbour at 25%+, or a World Order move planned here' };
    if (s.inf[target] >= 90) return { ok: false, why: 'Already yours' };
  }
  if (opId === 'summit' && s.mods.some(m => m.id === target && m.kind === 'summit' && m.until > s.week)) return { ok: false, why: 'Summit already running' };
  return { ok: true };
}
function doOp(s, opId, target) {
  const chk = canOp(s, opId, target); if (!chk.ok) return chk;
  const op = OPS.find(o => o.id === opId); const c = byId(target);
  s.clout -= opCost(s, op); s.ready[opId] = s.week + opCooldown(s, op);
  if (opId === 'summit') {
    s.mods.push({ id: target, kind: 'summit', until: s.week + 25 }); s.notoriety += 1;
    const derailed = pendingOn(s, target);
    if (derailed.length) { s.wo.queue = s.wo.queue.filter(q => q.target !== target); addNews(s, `Your summit in ${c.name} runs long. The World Order\u2019s plans there are postponed indefinitely.`, 'you'); }
    else addNews(s, `Summit in ${c.name} ends with a handshake that lasts 11 seconds.`, 'you');
  }
  if (opId === 'trade') { const src = strongest(s, target); s.trade.push([src.id, target]); s.notoriety += 1; addNews(s, `${src.name} and ${c.name} sign a trade deal nobody has read.`, 'you'); }
  if (opId === 'snap' || opId === 'dossier') s.ev.loudOp = s.week;
  if (opId === 'snap') {
    if (pendingOn(s, target).length) { s.wo.queue = s.wo.queue.filter(q => q.target !== target); addNews(s, `Snap exercise in ${c.name}: the World Order delegation cannot get past the tanks. Its plans there are cancelled.`, 'you'); }
    const push = 10 * (1 + 0.5 * s.stats.snapBoost); if (s.inf[target] <= 0) seed(s, target, 1, null); s.inf[target] = Math.min(100, s.inf[target] + push); s.notoriety += 3; addNews(s, `Snap exercise on the ${c.name} border. Tanks described as “just visiting”.`, 'you'); }
  if (opId === 'dossier') { s.mods.push({ id: target, kind: 'dossier', until: s.week + 20 }); s.notoriety += 8;
    if (s.wo.members[target] && target !== s.wo.hq) { delete s.wo.members[target]; delete s.wo.signed[target]; s.wo.queue = s.wo.queue.filter(q => q.target !== target); addNews(s, `${c.name} storms out of the World Order after the leaks.`, 'you'); } addNews(s, `Leaked dossiers embarrass ${c.name}’s cabinet. The PDFs were suspiciously well formatted.`, 'wo'); }
  s.notoriety = Math.min(100, s.notoriety);
  return { ok: true };
}
function canSpecial(s, key, target) {
  if (s.over) return { ok: false, why: 'Game over' };
  if (s.specials[key] !== 'ready') return { ok: false, why: s.specials[key] === 'used' ? 'Already used' : 'Not owned' };
  const needsWo = ['bribe', 'breaker', 'believe', 'stoppage', 'hybrid'].includes(key);
  if (needsWo && !s.coalition) return { ok: false, why: 'The World Order has not convened yet' };
  if (SPECIALS[key].target) {
    if (!target) return { ok: false, why: 'Pick a country' };
    if (!s.wo.members[target]) return { ok: false, why: 'Only works on a World Order member' };
    if (target === s.wo.hq) return { ok: false, why: 'Not on the HQ' };
  }
  if (key === 'believe' && memberCount(s) < 2) return { ok: false, why: 'Needs another member to take over as HQ' };
  return { ok: true };
}
function useSpecial(s, key, target) {
  const chk = canSpecial(s, key, target); if (!chk.ok) return chk;
  s.specials[key] = 'used'; const W = s.wo; const c = target ? byId(target) : null;
  const leave = id => { delete W.members[id]; delete W.signed[id]; W.queue = W.queue.filter(q => q.target !== id); };
  if (key === 'utopia') { s.utopiaUntil = s.week + 26; addNews(s, 'Utopia declared. Everyone is happy, by law. Growth and income double for 26 weeks.', 'you'); }
  if (key === 'stoppage') { s.frozenUntil = s.week + 10; addNews(s, `Stoppage Order: ${SG}\u2019s office is surrounded by very polite soldiers. The World Order is frozen for 10 weeks.`, 'you'); s.notoriety = Math.min(100, s.notoriety + 5); }
  if (key === 'bribe') { leave(target); s.inf[target] = Math.min(100, s.inf[target] + 25); addNews(s, `${c.name}\u2019s cabinet discovers a generous consultancy contract and quits the World Order.`, 'you'); }
  if (key === 'breaker') { leave(target); ['eco', 'mil', 'dip', 'ideo'].forEach(t => { s.base.pen[t] += .08; }); recomputeStats(s); addNews(s, `${c.name} walks out of the World Order, and the whole alliance system wobbles. Resistance falls everywhere.`, 'you'); }
  if (key === 'believe') {
    const old = W.hq; leave(old);
    const next = Object.keys(W.members).sort((a, b) => s.inf[a] - s.inf[b])[0];
    W.hq = next; s.treaty = Math.max(0, s.treaty - 15);
    if (s.owned.includes('c3')) s.clout += 15;
    addNews(s, `${byId(old).name} loses faith in the treaty and leaves. The World Order moves its HQ to ${byId(next).name}, losing 15% of the draft in the removal van.`, 'you');
  }
  if (key === 'hybrid') { s.blocked = []; W.queue = []; s.noSanctionUntil = s.week + 40; if (s.owned.includes('f3')) s.treaty = Math.max(0, s.treaty - 10); addNews(s, 'Hybrid Threat: nobody at the World Order can agree who is threatening whom. Every plan is shelved and sanctions are lifted.', 'you'); s.notoriety = Math.min(100, s.notoriety + 6); }
  return { ok: true };
}
// ---- v5: random world events (background) and decision events ----
// Pavel's originals are marked [P]; the rest are new. Timers run in game weeks.
const pick = (s, arr) => arr[Math.floor(rng(s) * arr.length)];
const nm = id => byId(id).name;
const yours = (s, min) => COUNTRIES.filter(c => s.inf[c.id] >= (min || 5)).map(c => c.id);
const biggest = s => COUNTRIES.reduce((a, c) => (c.pop * s.inf[c.id] > a.pop * s.inf[a.id] ? c : a)).id;
const strongestId = s => COUNTRIES.reduce((a, c) => (s.inf[c.id] > s.inf[a.id] ? c : a)).id;
const nonMembers = s => COUNTRIES.filter(c => !s.wo.members[c.id] && c.pop >= 1).map(c => c.id);
const membersNotHq = s => Object.keys(s.wo.members).filter(id => id !== s.wo.hq);
function resMod(s, id, mul, weeks, types, extra) { s.mods.push(Object.assign({ id, kind: 'res', mul, types: types || null, until: s.week + weeks }, extra || {})); }
function notoTxt(s, n, pre) { return s.coalition ? `${pre || ' '}+${n} Notoriety.` : ''; }
function addNoto(s, n) { if (s.coalition) s.notoriety = Math.min(100, s.notoriety + n); }
function timed(s, key, weeks, value) { s.ev.fx[key] = { until: s.week + weeks, value: value === undefined ? true : value }; }
function fxOn(s, key) { const f = s.ev && s.ev.fx[key]; return f && f.until > s.week ? f.value : null; }
function routesOf(s, id) { return s.trade.filter(e => e.includes(id)); }
function neighboursOrTrade(s, id) { return [...new Set([...neighbours(id), ...tradeLinks(s, id)])]; }

const EVENTS = [
  // ---- good for you ----
  { id: 'viral', good: true, name: 'Viral Moment', ok: s => s.inf[strongestId(s)] >= 20,
    fire: s => { const src = strongestId(s); neighboursOrTrade(s, src).forEach(n => { if (s.inf[n] <= 0) seed(s, n, 1, src); s.inf[n] = Math.min(100, s.inf[n] + 4); }); return `Your slogan becomes a dance craze in ${nm(src)}. Nobody knows the steps; its neighbours all know the words.`; } },
  { id: 'boom', good: true, name: 'Economic Boom', ok: s => true,
    fire: s => { const id = pick(s, COUNTRIES).id; resMod(s, id, .75, 20, ['eco']); return `Markets soar in ${nm(id)}. Analysts credit “vibes”. Economic resistance there falls for 20 weeks.`; } },
  { id: 'aid', good: true, name: 'Foreign Aid', ok: s => true,
    fire: s => { s.clout += 10; return 'An anonymous donor sends you 10 Clout and a very long letter.'; } },
  { id: 'gridlock', good: true, name: 'Government Gridlock', ok: s => nonMembers(s).length > 0,
    fire: s => { const id = pick(s, nonMembers(s)); resMod(s, id, .8, 20); return `${nm(id)}’s parliament fails to agree on lunch, then on everything else. Its resistance drops for 20 weeks.`; } },
  { id: 'celebrity', good: true, name: 'Celebrity Endorsement', ok: s => yours(s, 5).length > 0,
    fire: s => { const id = pick(s, yours(s, 5)); s.inf[id] = Math.min(100, s.inf[id] + 8); addNoto(s, 2); s.ev.endorsed = id; return `A pop star in ${nm(id)} wears your badge at an awards show. Support there jumps.`; } },
  { id: 'typo', good: true, name: 'Treaty Typo', ok: s => s.coalition && s.treaty >= 10,
    fire: s => { s.treaty = Math.max(0, s.treaty - 8); return 'Translators render “containment” as “container”. Page 212 now regulates shipping. The treaty draft slips back.'; } },
  { id: 'audit', good: true, name: 'Audit Season', ok: s => s.coalition,
    fire: s => { timed(s, 'woPause', 6); return 'World Order HQ closes for its annual audit of audits. No new moves for 6 weeks.'; } },
  { id: 'tourism', good: true, name: 'Tourism Boom', ok: s => yours(s, 20).length >= 2,
    fire: s => { const ys = yours(s, 20); const a = pick(s, ys); const others = ys.filter(x => x !== a && !tradeLinks(s, a).includes(x)); if (!others.length) { s.clout += 5; return `Tourists flock to ${nm(a)}. The souvenir shops pay you 5 Clout.`; } const b = pick(s, others); s.trade.push([a, b]); s.ev.temp.push({ a, b, until: s.week + 30 }); return `Cheap flights link ${nm(a)} and ${nm(b)} for 30 weeks. So do your pamphlets.`; } },
  { id: 'upset', good: true, name: 'Snap Election Upset', ok: s => COUNTRIES.some(c => s.inf[c.id] >= 40 && s.inf[c.id] < 60),
    fire: s => { const id = pick(s, COUNTRIES.filter(c => s.inf[c.id] >= 40 && s.inf[c.id] < 60)).id; s.inf[id] = Math.min(100, s.inf[id] + 15); return `Your candidate wins in ${nm(id)} after the rivals forget the date. Support +15.`; } },
  { id: 'whistle', good: true, name: 'Whistleblower', ok: s => s.coalition && membersNotHq(s).length > 0,
    fire: s => { const id = pick(s, membersNotHq(s)); delete s.wo.members[id]; delete s.wo.signed[id]; s.wo.queue = s.wo.queue.filter(q => q.target !== id); return `Leaked minutes show the World Order spent more on lanyards than on ${nm(id)}. ${nm(id)} quits.`; } },
  { id: 'tech', good: true, name: 'Tech Breakthrough', ok: s => true,
    fire: s => { timed(s, 'incomeMul', 20, 1.5); return 'Your supporters invent an app. It mostly sends reminders about you. Clout income +50% for 20 weeks.'; } },
  { id: 'sabbatical', good: true, name: 'Sec-Gen on Sabbatical', ok: s => s.coalition,
    fire: s => { timed(s, 'woSlow', 15); return `${SG} takes a sabbatical to write his memoirs, in committee. The World Order moves at half speed for 15 weeks.`; } },

  // ---- bad for you ----
  { id: 'unrest', good: false, name: 'Political Unrest', ok: s => yours(s, 10).length > 0,
    fire: s => { const id = pick(s, yours(s, 10)); s.inf[id] *= .75; return `Strikes in ${nm(id)}. Everyone blames everyone, including you. Support there falls by a quarter.`; } },
  { id: 'disaster', good: false, name: 'Natural Disaster', ok: s => true,
    fire: s => { const id = pick(s, COUNTRIES.filter(c => c.pop >= 1)).id; resMod(s, id, 1.2, 20, null, { inward: true }); return `Floods in ${nm(id)}. Politics postponed: it resists and stops passing ideas on for 20 weeks.`; } },
  { id: 'crisis', good: false, name: 'Diplomatic Crisis', ok: s => yours(s, 10).length > 0,
    fire: s => { const id = pick(s, yours(s, 10)); resMod(s, id, 1.2, 20); return `${nm(id)} recalls its ambassadors over a seating plan. Resistance there rises for 20 weeks.`; } },
  { id: 'alliance', good: false, name: 'Defensive Alliance', ok: s => s.coalition && Object.keys(s.wo.members).some(m => neighbours(m).some(n => !s.wo.members[n] && s.inf[n] < TUNE.joinBelow)),
    fire: s => { const m = pick(s, Object.keys(s.wo.members).filter(m => neighbours(m).some(n => !s.wo.members[n] && s.inf[n] < TUNE.joinBelow)));
      const joiners = neighbours(m).filter(n => !s.wo.members[n] && s.inf[n] < TUNE.joinBelow).slice(0, 2); joiners.forEach(n => { s.wo.members[n] = true; });
      return `${joiners.map(nm).join(' and ')} sign a mutual-concern pact with ${nm(m)} and join the World Order. Concern is mutual.`; } },
  { id: 'emergency', good: false, name: 'State of Emergency', ok: s => yours(s, 20).length > 0,
    fire: s => { const id = pick(s, yours(s, 20)); s.inf[id] *= .5; resMod(s, id, 1.25, 30, ['mil']); return `${nm(id)} declares a state of emergency. Your posters are declared “non-essential”. Support there halves.`; } },
  { id: 'posts', good: false, name: 'Old Posts Resurface', ok: s => s.coalition,
    fire: s => { addNoto(s, 8); return 'Your spokesperson’s 2009 posts resurface. Several involve fonts. Notoriety +8.'; } },
  { id: 'factcheck', good: false, name: 'Fact-Check Goes Viral', ok: s => yours(s, 10).length > 0,
    fire: s => { const id = biggest(s); s.inf[id] = Math.max(0, s.inf[id] - 8); return `A fact-check about you gets more views in ${nm(id)} than you do. Support there −8.`; } },
  { id: 'crash', good: false, name: 'Market Crash', ok: s => true,
    fire: s => { timed(s, 'incomeMul', 15, .5); timed(s, 'tradeMul', 15, .5); return 'Markets fall. Analysts blame “vibes”. Clout income and trade spread halve for 15 weeks.'; } },
  { id: 'customs', good: false, name: 'Customs Strike', ok: s => yours(s, 10).some(id => routesOf(s, id).length),
    fire: s => { const id = pick(s, yours(s, 10).filter(id => routesOf(s, id).length)); routesOf(s, id).forEach(([a, b]) => s.blocked.push({ a, b, until: s.week + 20 })); return `Customs officers in ${nm(id)} strike over the colour of their stamps. Its trade routes close for 20 weeks.`; } },
  { id: 'fasttrack', good: false, name: 'Treaty Fast-Track', ok: s => s.coalition,
    fire: s => { s.treaty = Math.min(100, s.treaty + 8); return `${SG} discovers the “reply all” button. The treaty draft jumps 8 points.`; } },
  { id: 'splinter', good: false, name: 'Splinter Faction', ok: s => yours(s, 60).length > 0,
    fire: s => { const id = pick(s, yours(s, 60)); s.inf[id] = Math.max(0, s.inf[id] - 15); return `Your supporters in ${nm(id)} split into the People’s Front and the Front of the People. Support −15.`; } },
  { id: 'backlash', good: false, name: 'Influencer Backlash', ok: s => yours(s, 10).length > 0,
    fire: s => { const id = s.ev.endorsed && s.inf[s.ev.endorsed] > 0 ? s.ev.endorsed : pick(s, yours(s, 10)); s.ev.endorsed = null; s.inf[id] = Math.max(0, s.inf[id] - 10); return `The celebrity in ${nm(id)} who wore your badge now says it was “ironic”. Support −10.`; } }
];

// Decision events: the game pauses; the player picks option A or B.
const DECISIONS = [
  { id: 'peace', name: 'Peace Talks', ok: s => s.coalition && s.treaty >= 40,
    setup: s => ({ text: `${SG} proposes peace talks. Sitting down would slow the treaty, but also you.`,
      a: ['Accept the talks', 'Treaty draft −8. Your growth −25% for 25 weeks.'], b: ['Stall for advantage', '+8 Clout, +6 Notoriety.'] }),
    a: s => { s.treaty = Math.max(0, s.treaty - 8); timed(s, 'growthMul', 25, .75); return 'Peace talks begin. Everyone agrees to meet again to agree on the next meeting.'; },
    b: s => { s.clout += 8; addNoto(s, 6); return 'You stall the talks with a 90-minute opening statement.'; } },
  { id: 'summit', name: 'Global Summit', ok: s => s.coalition && s.ev.loudOp && s.week - s.ev.loudOp <= 10,
    setup: s => ({ text: 'Your recent operation has triggered an emergency global summit about you.',
      a: ['Disrupt the summit', 'Pay 10 Clout. The summit collapses.'], b: ['Ignore it', 'The World Order sanctions 2 of your trade routes for 30 weeks.'], cost: 10 }),
    a: s => { s.clout -= 10; return 'The summit’s interpreters all call in sick. The summit collapses.'; },
    b: s => { const routes = s.trade.filter(([a, b]) => Math.max(s.inf[a], s.inf[b]) >= 10 && !isBlocked(s, a, b)).slice(0, 2); routes.forEach(([a, b]) => s.blocked.push({ a, b, until: s.week + 30 })); return `The summit ends in sanctions: ${routes.map(([a, b]) => nm(a) + '–' + nm(b)).join(' and ') || 'nothing left to sanction'}.`; } },
  { id: 'scandal', name: 'Corruption Scandal', ok: s => s.coalition && membersNotHq(s).length > 0,
    setup: s => { const id = pick(s, membersNotHq(s)); return { target: id, text: `A senior official of World Order member ${nm(id)} is caught expensing a yacht as “stationery”.`,
      a: ['Amplify the scandal', `Pay 12 Clout. ${nm(id)} quits the World Order. +4 Notoriety.`], b: ['Stay quiet', '+3 Clout.'], cost: 12 }; },
    a: (s, d) => { s.clout -= 12; delete s.wo.members[d.target]; delete s.wo.signed[d.target]; s.wo.queue = s.wo.queue.filter(q => q.target !== d.target); addNoto(s, 4); return `The yacht story trends for a week. ${nm(d.target)} leaves the World Order.`; },
    b: s => { s.clout += 3; return 'You keep the file for a rainy day.'; } },
  { id: 'election', name: 'Snap Election', ok: s => COUNTRIES.some(c => s.inf[c.id] >= 30 && s.inf[c.id] <= 60),
    setup: s => { const id = pick(s, COUNTRIES.filter(c => s.inf[c.id] >= 30 && s.inf[c.id] <= 60)).id; return { target: id, text: `${nm(id)} calls a snap election. One candidate quietly shares your views.`,
      a: ['Back the candidate', `Pay 10 Clout. 55% chance: +12 support. 45% chance: −6 support${s.coalition ? ' and +6 Notoriety' : ''}.`], b: ['Stay out', 'Nothing happens.'], cost: 10 }; },
    a: (s, d) => { s.clout -= 10; if (rng(s) < .55) { s.inf[d.target] = Math.min(100, s.inf[d.target] + 12); return `Your candidate wins in ${nm(d.target)}. Support +12.`; } s.inf[d.target] = Math.max(0, s.inf[d.target] - 6); addNoto(s, 6); return `Your candidate loses in ${nm(d.target)}, loudly. Support −6.${notoTxt(s, 6)}`; },
    b: (s, d) => `You watch the ${nm(d.target)} election from a safe distance.` },
  { id: 'viralcamp', name: 'Viral Campaign', ok: s => s.inf[strongestId(s)] >= 80,
    setup: s => { const id = strongestId(s); return { target: id, text: `Your campaign in ${nm(id)} is going viral. You can ride the wave or keep it quiet.`,
      a: ['Ride the wave', `+3 support in every neighbour and trade partner of ${nm(id)}.${notoTxt(s, 5)}`], b: ['Keep it quiet', '+6 Clout.'] }; },
    a: (s, d) => { neighboursOrTrade(s, d.target).forEach(n => { if (s.inf[n] <= 0) seed(s, n, 1, d.target); s.inf[n] = Math.min(100, s.inf[n] + 3); }); addNoto(s, 5); return 'The wave crosses borders. So does the attention.'; },
    b: s => { s.clout += 6; return 'You sell the merchandise instead. +6 Clout.'; } },
  { id: 'defpact', name: 'Defensive Alliance', ok: s => s.coalition && BORDERS.some(([a, b]) => !s.wo.members[a] && !s.wo.members[b] && s.inf[a] < 30 && s.inf[b] < 30 && byId(a).pop >= 1 && byId(b).pop >= 1),
    setup: s => { const [a, b] = pick(s, BORDERS.filter(([a, b]) => !s.wo.members[a] && !s.wo.members[b] && s.inf[a] < 30 && s.inf[b] < 30 && byId(a).pop >= 1 && byId(b).pop >= 1)); return { pair: [a, b], text: `${nm(a)} and ${nm(b)} are negotiating a defensive pact with the World Order.`,
      a: ['Counter-offer', 'Pay 12 Clout. They stay out.'], b: ['Let it happen', `${nm(a)} and ${nm(b)} both join the World Order.`], cost: 12 }; },
    a: (s, d) => { s.clout -= 12; return `Your counter-offer includes better snacks. ${d.pair.map(nm).join(' and ')} stay out.`; },
    b: (s, d) => { d.pair.forEach(id => { s.wo.members[id] = true; }); return `${d.pair.map(nm).join(' and ')} join the World Order.`; } },
  { id: 'ultimatum', name: 'Sanctions Ultimatum', ok: s => s.coalition && memberCount(s) >= 4 && yours(s, 15).length > 0,
    setup: s => { const id = biggest(s); return { target: id, text: `The World Order demands you scale back in ${nm(id)}, or face sanctions.`,
      a: ['Concede', `−10 support in ${nm(id)}.`], b: ['Defy', 'Half of your trade routes close for 20 weeks.'] }; },
    a: (s, d) => { s.inf[d.target] = Math.max(0, s.inf[d.target] - 10); return `You scale back in ${nm(d.target)}. ${SG} calls it “a constructive retreat”.`; },
    b: s => { const mine = s.trade.filter(([a, b]) => Math.max(s.inf[a], s.inf[b]) >= 10 && !isBlocked(s, a, b)); mine.slice(0, Math.ceil(mine.length / 2)).forEach(([a, b]) => s.blocked.push({ a, b, until: s.week + 20 })); return 'You defy the ultimatum. Sanctions close half your trade routes for 20 weeks.'; } },
  { id: 'defector', name: 'World Order Defector', ok: s => s.coalition && s.treaty >= 12,
    setup: s => ({ text: 'A junior World Order clerk offers you the treaty’s working drafts, for a price.',
      a: ['Pay for the secrets', 'Pay 14 Clout. Treaty draft −8.'], b: ['Hand him back', '−5 Notoriety. You look very responsible.'], cost: 14 }),
    a: s => { s.clout -= 14; s.treaty = Math.max(0, s.treaty - 8); return 'The drafts mysteriously go missing. So does the clerk’s stapler.'; },
    b: s => { s.notoriety = Math.max(0, s.notoriety - 5); return 'You return the clerk with a thank-you card. Notoriety −5.'; } },
  { id: 'talkshow', name: 'Talk Show Invitation', ok: s => s.coalition && yours(s, 1).length >= 3,
    setup: s => ({ text: 'A late-night talk show invites your leader. The host has a reputation.',
      a: ['Go on air', '+3 support in 3 countries where you are active. +4 Notoriety.'], b: ['Decline', '−2 Notoriety.'] }),
    a: s => { const ids = yours(s, 1).sort(() => rng(s) - .5).slice(0, 3); ids.forEach(id => { s.inf[id] = Math.min(100, s.inf[id] + 3); }); addNoto(s, 4); return `Your leader’s joke about committees lands in ${ids.map(nm).join(', ')}.`; },
    b: s => { s.notoriety = Math.max(0, s.notoriety - 2); return 'You decline. Mystery suits you.'; } },
  { id: 'consultant', name: 'Rebrand Consultant', ok: s => s.notoriety > 50,
    setup: s => ({ text: 'A consultant offers to make your movement look harmless. She has slides.',
      a: ['Hire her', 'Pay 15 Clout. −10 Notoriety.'], b: ['Decline', 'Nothing happens.'], cost: 15 }),
    a: s => { s.clout -= 15; s.notoriety = Math.max(0, s.notoriety - 10); return 'New logo, same ideas. Notoriety −10.'; },
    b: s => 'You keep your old logo. It has character.' }
];

function eventsTick(s) {
  const E = s.ev;
  E.temp = E.temp.filter(t => { if (t.until > s.week) return true; s.trade = s.trade.filter(([a, b]) => !((a === t.a && b === t.b) || (a === t.b && b === t.a))); return false; });
  if (s.week >= E.next) {
    // bad events likelier when you are loud, good ones likelier when the World Order is ahead
    let pBad = TUNE.evBad + (s.notoriety - 30) / 200 - (s.coalition && (signedCount(s) >= 4 || s.treaty >= 60) ? .12 : 0);
    pBad = Math.min(.8, Math.max(.3, pBad));
    const good = rng(s) >= pBad;
    const pool = EVENTS.filter(e => e.good === good && e.ok(s));
    if (pool.length) { const e = pick(s, pool); const text = e.fire(s); addNews(s, `${e.name}: ${text}`, good ? 'you' : 'wo'); s.news[0].ev = good ? 'good' : 'bad'; flag(s, 'important', newsCountry(text), e.name); E.log.unshift({ week: s.week, id: e.id, good }); }
    E.next = s.week + TUNE.evGap + Math.floor(rng(s) * 9);
  }
  if (!s.pending && s.week >= E.nextDecision) {
    const pool = DECISIONS.filter(d => (E.seen[d.id] || 0) < 2 && d.ok(s));
    if (pool.length) {
      const d = pick(s, pool); const data = d.setup(s);
      s.pending = Object.assign({ id: d.id, name: d.name, week: s.week }, data);
      E.seen[d.id] = (E.seen[d.id] || 0) + 1;
      E.nextDecision = Infinity; // re-armed when resolved
    } else E.nextDecision = s.week + 5;
  }
}
function canChoose(s, choice) {
  const p = s.pending; if (!p) return { ok: false, why: 'Nothing to decide' };
  if (choice === 'a' && p.cost && s.clout < p.cost) return { ok: false, why: `Needs ${p.cost} Clout` };
  return { ok: true };
}
function resolveDecision(s, choice) {
  const chk = canChoose(s, choice); if (!chk.ok) return chk;
  const p = s.pending; const d = DECISIONS.find(x => x.id === p.id);
  const text = d[choice](s, p);
  addNews(s, `${p.name}: ${text}`, 'you'); s.news[0].ev = 'dec'; flag(s, 'important', p.target || newsCountry(text), p.name);
  s.pending = null; s.ev.nextDecision = s.week + 25 + Math.floor(rng(s) * 11);
  return { ok: true, text };
}

// SIM-END
if (typeof module !== 'undefined') module.exports = { TRAITS, CONDITIONS, perk, Q, resOf, EVENTS, DECISIONS, resolveDecision, canChoose, fxOn, useSpecial, canSpecial, branchLock, boosted, SYNERGY, SPECIALS, CAPSTONE_NEEDS, possibleSignatures, committed, doctrines, rebrand, canRebrand, OPPOSITE, BRANCHES, signedCount, memberCount, pendingOn, SIGNATURES_TO_LOSE, upCost, TUNE, COUNTRIES, BORDERS, UPGRADES, OPS, createState, step, buyUpgrade, doOp, canOp, canBuy, collectBubble, alignedShare, effRes, neighbours };
