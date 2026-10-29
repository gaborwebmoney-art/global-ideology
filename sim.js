// SIM-START
// ---------- Global Ideology: simulation core (pure, UI-free) ----------
const TYPES = ['eco', 'mil', 'dip', 'ideo'];
const TYPE_LABEL = { eco: 'Economic', mil: 'Military', dip: 'Diplomatic', ideo: 'Ideological' };

// Countries from Pavel's countries.docx (Sep 2025). Resistances map 100 -> .15, 200 -> .35, 300 -> .55, 400 -> .75.
// Celestia, Tavaro, Kestria and Pinguinia fill map gaps (Western Europe, Middle East, Africa, the pole).
const COUNTRIES = [
  { id: 'borealis',   name: 'Borealis',   pop: 38,   x: 170, y: 144,  res: { mil: .55, eco: .55, dip: .55, ideo: .55 }, traits: ['Federal', 'Resource-rich'], desc: 'A sprawling northern dominion of vast wilderness. Tolerant, decentralised and hard to influence as a single entity.' },
  { id: 'aethelgard', name: 'Aethelgard', pop: 330,  x: 186, y: 231, res: { mil: .75, eco: .75, dip: .75, ideo: .15 }, traits: ['Superpower', 'Divided politics'], desc: 'A sprawling federation with a powerful, sometimes divided, government. Strong on every front except ideas: it will try any of them once.' },
  { id: 'laplata',    name: 'La Plata',   pop: 46,   x: 321, y: 434, res: { mil: .55, eco: .15, dip: .15, ideo: .15 }, traits: ['Agricultural wealth', 'Unstable'], desc: 'Great natural beauty, vast farmland and a long history of political turmoil. Very open to a good economic offer.' },
  { id: 'isolde',     name: 'Isolde',     pop: 0.4,  x: 433, y: 109,  res: { mil: .15, eco: .55, dip: .35, ideo: .35 }, traits: ['Island', 'Close-knit'], desc: 'A remote island of fire and ice. Small, self-reliant and proud of its heritage.' },
  { id: 'guldor',     name: 'Guldor',     pop: 68,   x: 480, y: 173, res: { mil: .35, eco: .35, dip: .75, ideo: .35 }, traits: ['Island', 'Old money'], desc: 'An ancient kingdom of trade and exploration. Its power rests on centuries of relationships and very old treaties.' },
  { id: 'celestia',   name: 'Celestia',   pop: 67,   x: 472, y: 236, res: { mil: .30, eco: .40, dip: .60, ideo: .60 }, traits: ['Cultural power'], desc: 'Philosophers, painters and strikes. Soft power, soft army.' },
  { id: 'helvetia',   name: 'Helvetia',   pop: 9,    x: 534, y: 198, res: { mil: .15, eco: .75, dip: .55, ideo: .35 }, traits: ['Neutral', 'Financial centre'], desc: 'A neutral, prosperous alpine republic. Its banks are everywhere; its opinions, officially, nowhere.' },
  { id: 'pannonia',   name: 'Pannonia',   pop: 10,   x: 565, y: 208, res: { mil: .15, eco: .15, dip: .35, ideo: .35 }, traits: ['Landlocked', 'Unpredictable'], desc: 'A landlocked state with a proud history and a distinct identity, often at odds with its own alliances.' },
  { id: 'koryn',      name: 'Koryn',      pop: 145,  x: 684, y: 159,  res: { mil: .55, eco: .35, dip: .35, ideo: .55 }, traits: ['Authoritarian', 'Resource-rich'], desc: 'A vast, resource-rich nation with a centralised government and a proud military history.' },
  { id: 'tavaro',     name: 'Tavaro',     pop: 90,   x: 614, y: 255, res: { mil: .60, eco: .70, dip: .40, ideo: .60 }, traits: ['Crossroads', 'Oil'], desc: 'A desert crossroads sitting on the world’s favourite resource.' },
  { id: 'kestria',    name: 'Kestria',    pop: 220,  x: 541, y: 324, res: { mil: .30, eco: .30, dip: .30, ideo: .40 }, traits: ['Young population'], desc: 'The youngest population on the map. Ideas spread here fast.', growthMul: 1.25 },
  { id: 'bharat',     name: 'Bharat',     pop: 900,  x: 718, y: 295, res: { mil: .55, eco: .35, dip: .35, ideo: .55 }, traits: ['Colossal democracy', 'Tech boom'], desc: 'A colossal democracy of vibrant cultures and a booming tech sector. Its diversity is both a strength and a way in.' },
  { id: 'sinopeia',   name: 'Sinopeia',   pop: 900,  x: 790, y: 230, res: { mil: .55, eco: .75, dip: .55, ideo: .55 }, traits: ['Authoritarian', 'Manufacturing giant'], desc: 'A vast, ancient empire with a disciplined, centrally run society. Nothing enters without paperwork.' },
  { id: 'juche',      name: 'Juche',      pop: 26,   x: 848, y: 223, res: { mil: .15, eco: .15, dip: .15, ideo: .75 }, traits: ['Isolated', 'Personality cult'], desc: 'A fiercely isolated nation built around one leader’s portrait. Unmoved by any idea but the official one.' },
  { id: 'nippon',     name: 'Nippon',     pop: 125,  x: 881, y: 248, res: { mil: .55, eco: .75, dip: .75, ideo: .55 }, traits: ['Island', 'Hyper-advanced'], desc: 'An island nation with a hyper-advanced economy and a disciplined, ageing society.' },
  { id: 'pinguinia',  name: 'Pinguinia',  pop: 0.05, x: 864, y: 471, res: { mil: .10, eco: .20, dip: .90, ideo: .90 }, traits: ['Remote', 'Research stations'], desc: 'Fifty thousand scientists, a vast empty interior and considerably more penguins than expected.' }
];
const BORDERS = [
  ['borealis', 'aethelgard'], ['celestia', 'helvetia'], ['helvetia', 'pannonia'], ['celestia', 'pannonia'],
  ['pannonia', 'koryn'], ['koryn', 'tavaro'], ['koryn', 'sinopeia'], ['koryn', 'juche'], ['sinopeia', 'juche'],
  ['sinopeia', 'bharat'], ['bharat', 'tavaro'], ['tavaro', 'kestria']
];
const TRADE = [
  ['aethelgard', 'guldor'], ['guldor', 'celestia'], ['isolde', 'guldor'], ['isolde', 'borealis'],
  ['aethelgard', 'laplata'], ['laplata', 'kestria'], ['celestia', 'kestria'], ['bharat', 'kestria'],
  ['nippon', 'sinopeia'], ['nippon', 'juche'], ['helvetia', 'guldor'], ['bharat', 'pinguinia'], ['tavaro', 'celestia']
];

// Pavel's skill tree (skilltree 10092025.xlsx), adapted to the World Order model.
// Opposed pairs lock at tier 2: Ideology vs Economy, Military vs Diplomacy.
// Each branch is boosted by the tier-3 upgrade of its partner, and its tier-4 capstone needs it:
// Ideology <- Diplomacy, Diplomacy <- Ideology, Military <- Economy, Economy <- Military, Grassroots <-> Covert Ops.
const BRANCHES = [
  { id: 'ideo', name: 'Ideology', blurb: 'Grows support inside countries.', partner: 'dip' },
  { id: 'eco', name: 'Economy', blurb: 'Spreads along trade routes. Earns Clout.', partner: 'mil' },
  { id: 'mil', name: 'Military', blurb: 'Breaks resistance and makes countries refuse the World Order. Loud.', partner: 'eco' },
  { id: 'dip', name: 'Diplomacy', blurb: 'Spreads across land borders. Blunts the World Order.', partner: 'ideo' },
  { id: 'faith', name: 'Grassroots', blurb: 'Crosses oceans and borders on its own.', partner: 'covert', unlock: 'reach' },
  { id: 'covert', name: 'Covert Ops', blurb: 'Weakens every defence. Very loud.', partner: 'faith', unlock: 'wo' },
  { id: 'under', name: 'Back Channels', blurb: 'Quiet deals and dirty tricks. Destabilises everyone. Loud, and notorious.' },
  { id: 'spin', name: 'Spin', blurb: 'Keeps the World Order busy.' }
];
const UPGRADES = [
  { id: 'i1', b: 'ideo', name: 'Charismatic Leadership', cost: 5, fx: { growth: .025 }, boost: { growth: .01 }, text: 'Internal growth +25%. Pamphlets give +1 support', btext: 'another +10%' },
  { id: 'i2', b: 'ideo', name: 'Doctrinal Purity', cost: 9, fx: { growth: .025, pen: { ideo: .15 } }, boost: { pen: { ideo: .05 } }, text: 'Internal growth +25%. Ideological resistance −15%. Youth Movement lasts 35 weeks', btext: 'another −5% ideological' },
  { id: 'i3', b: 'ideo', name: 'Social Engineering', cost: 15, fx: { growth: .035, income: 1 }, boost: { growth: .025, income: .5 }, text: 'Internal growth +35%. Clout income up. Martyr Narrative recharges 15 weeks faster', btext: 'more growth and income' },
  { id: 'i4', b: 'ideo', name: 'Popular Uprising', cost: 16, special: 'utopia', text: 'Unlocks Popular Uprising, the Ideology tier-4 action' },

  { id: 'e1', b: 'eco', name: 'Trade Deals', cost: 5, fx: { income: .7, trade: .02 }, boost: { trade: .015 }, text: 'Clout income up a lot. Market Access: Clout bubbles also appear in countries that trade with one you hold 25%+, and collecting a bubble gives +1 support there. Foreign Investment costs 1 Clout less', btext: 'trade spread up more' },
  { id: 'e2', b: 'eco', name: 'Resource Leverage', cost: 9, fx: { trade: .01, pen: { eco: .2 } }, boost: { pen: { eco: .1 }, trade: .01 }, text: 'Economic resistance −20%. Sanction-proof contracts: routes opened by Trade Deal can no longer be closed by sanctions or strikes. Trade Deal recharges 10 weeks faster', btext: 'another −10% economic, more trade spread' },
  { id: 'e3', b: 'eco', name: 'Monopolization', cost: 14, fx: { income: .4, pen: { eco: .2, dip: .1 } }, boost: { income: .6 }, text: 'Economic resistance −20%, diplomatic −10%. Dependency: World Order members that trade with a country you hold 50%+ cannot sign the treaty. Buyout also gives +3 support in the target’s trade partners', btext: 'more income' },
  { id: 'e4', b: 'eco', name: 'Run on the Bank', cost: 16, special: 'bribe', text: 'Unlocks Run on the Bank, the Economy tier-4 action' },

  { id: 'm1', b: 'mil', name: 'Military Parade', cost: 5, fx: { pen: { mil: .2, ideo: .05 }, border: .01, loud: .01 }, boost: { pen: { mil: .1 }, border: .01 }, text: 'Military resistance −20%, ideological −5%. Louder. Show of Force needs only a 10% neighbour', btext: 'another −10% military, more border spread' },
  { id: 'm2', b: 'mil', name: 'Cyber Operations', cost: 9, fx: { pen: { dip: .1 }, growth: .03, border: .02, sabotage: .2 }, boost: { sabotage: .1 }, text: 'Diplomatic resistance −10%. Growth and border spread up. 20% of World Order campaigns and sanctions fail. Snap Exercise knocks courtships back 50% harder', btext: 'another 10% fail' },
  { id: 'm3', b: 'mil', name: 'Sovereign Intervention', cost: 14, fx: { border: .03, pen: { mil: .2 }, shield: 15, loud: .01 }, boost: { shield: 10 }, text: 'Border spread up. Countries need 15 points less of your support to refuse the World Order. Louder. Proxy Garrison blocks courtship for 25 weeks', btext: '10 points more' },
  { id: 'm4', b: 'mil', name: 'Regime Change', cost: 16, special: 'stoppage', text: 'Unlocks Regime Change, the Military tier-4 action' },

  { id: 'd1', b: 'dip', name: 'Consulates', cost: 4, fx: { border: .02 }, boost: { border: .015 }, text: 'Border spread up. Your Embassy action now makes a country resist 15% less for good (instead of 10%)', btext: 'more border spread' },
  { id: 'd2', b: 'dip', name: 'Summit Circuit', cost: 9, fx: { border: .03, pen: { dip: .15 } }, boost: { pen: { dip: .1 } }, text: 'Border spread up. Diplomatic resistance −15%. Summit lasts 35 weeks', btext: 'another −10% diplomatic' },
  { id: 'd3', b: 'dip', name: 'Sanctions Hammer', cost: 14, fx: { border: .02, vis: -.1, fcRed: .3 }, boost: { fcRed: .2, border: .01 }, text: 'Border spread up. Notoriety grows 10% slower. World Order campaigns hit 30% softer. Non-Aligned Pact blocks courtship for 30 weeks', btext: '20% softer again' },
  { id: 'd4', b: 'dip', name: 'Endless Negotiations', cost: 16, special: 'breaker', text: 'Unlocks Endless Negotiations, the Diplomacy tier-4 action' },

  { id: 'f1', b: 'faith', name: 'Word of Mouth', cost: 6, fx: { reach: .007, pen: { ideo: .1 } }, boost: { reach: .002 }, text: 'Can take root in distant countries. Ideological resistance −10%', btext: 'further reach' },
  { id: 'f2', b: 'faith', name: 'Local Chapters', cost: 10, fx: { reach: .008, growth: .01, trade: .02, income: 1 }, boost: { income: .5 }, text: 'Distant reach up. Growth, trade spread and Clout income up a little', btext: 'more income' },
  { id: 'f3', b: 'faith', name: 'Travelling Speakers', cost: 15, fx: { growth: .03, pen: { ideo: .15 }, opDiscount: 1 }, boost: { opDiscount: 1 }, text: 'Internal growth +30%. Ideological resistance −15%. Operations cost 1 Clout less', btext: '1 Clout less again' },
  { id: 'f4', b: 'faith', name: 'Rally Cry', cost: 16, special: 'believe', text: 'Special action: the World Order HQ loses confidence in the treaty. It quits, a new HQ takes over, and the draft drops 15%' },

  { id: 'c1', b: 'covert', name: 'Sleeper Agents', cost: 6, fx: { pen: { eco: .05, mil: .05, dip: .05, ideo: .05 }, loud: .02 }, once: { seed: 2 }, boost: { pen: { eco: .03, mil: .03, dip: .03, ideo: .03 } }, text: 'Plants support in 2 random countries. All resistances −5%', btext: 'another −3% everywhere' },
  { id: 'c2', b: 'covert', name: 'Asset Degradation', cost: 10, fx: { hiCut: .1, loud: .03, dossierDiscount: 4 }, boost: { hiCut: .05 }, text: 'Every country’s strongest resistance drops by 10 points. Leaked Dossiers cost less', btext: '5 points more' },
  { id: 'c3', b: 'covert', name: 'Orchestrated Unrest', cost: 16, fx: { pen: { eco: .08, mil: .08, dip: .08, ideo: .08 }, sabotage: .4, loud: .07 }, boost: { sabotage: .15 }, text: 'All resistances −8%. 40% of World Order campaigns and sanctions fall apart. Much louder', btext: '15% more fall apart' },
  { id: 'c4', b: 'covert', name: 'Hybrid Threat', cost: 16, special: 'hybrid', text: 'Special action: every sanction is lifted, every planned World Order move is cancelled, and it cannot sanction you for 40 weeks' },

  { id: 'u1', b: 'under', name: 'Contractor Network', cost: 6, fx: { pen: { mil: .15, ideo: .05 }, border: .015, loud: .02 }, text: 'Military resistance −15%, ideological −5%. Border spread up. Louder' },
  { id: 'u2', b: 'under', name: 'Offshore Accounts', cost: 10, fx: { income: 1, pen: { dip: .15 }, growth: .02, loud: .03 }, text: 'Clout income up. Diplomatic resistance −15%. Internal growth up a little. Louder' },
  { id: 'u3', b: 'under', name: 'Shadow Logistics', cost: 15, fx: { border: .035, pen: { eco: .15, mil: .05, dip: .05, ideo: .05 }, loud: .04, vis: .15 }, text: 'Border spread up. Economic resistance −15%, all others −5%. Notoriety grows 15% faster' },
  { id: 'u4', b: 'under', name: 'Engineered Collapse', cost: 18, special: 'collapse', text: 'Special action: for 20 weeks every country\u2019s resistance falls by 40%. Adds 8 Notoriety' },

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
// v10 (cfg.pairs !== false): every non-opposed core branch is a partner. A branch is boosted by the tier-3 upgrade of
// either partner, and each of the 4 legal pairs has its own pair bonus once both branches are doctrines (tier 2 owned).
// Switches for testing: cfg.minor (opposed branch open up to tier 2 at +50% cost), cfg.softLock (no lock: opposed
// upgrades past tier 1 cost +50% and add Notoriety).
const CORE = ['ideo', 'eco', 'mil', 'dip'];
const PAIRS = [
  { id: 'ecodip', a: 'eco', b: 'dip', name: 'Dollar Diplomacy', text: 'Trade routes also carry border spread. Clout income strengthens Diplomacy actions' },
  { id: 'ideomil', a: 'ideo', b: 'mil', name: 'Revolutionary Guard', text: 'Military actions also lift internal growth in the target for 20 weeks, and are half as loud' },
  { id: 'ideodip', a: 'ideo', b: 'dip', name: 'Soft Power', text: 'Diplomacy actions also lift internal growth in the target for 20 weeks. Diplomatic strength adds to Ideology actions' },
  { id: 'ecomil', a: 'eco', b: 'mil', name: 'War Economy', text: 'Military actions cost 25% less. Military strength adds to Clout income' }
];
const upg = id => UPGRADES.find(x => x.id === id);
function v10Pairs(s) { return !!(s.cfg && s.cfg.v10 && s.cfg.pairs !== false); }
function synergyOf(s, b) { return v10Pairs(s) && CORE.includes(b) ? CORE.filter(x => x !== b && x !== OPPOSITE[b]).map(x => x[0] + '3') : SYNERGY[b] ? [SYNERGY[b]] : []; }
function hasT2(s, b) { return s.owned.some(id => { const u = upg(id); return u.b === b && u.tier >= 1; }); }
// the doctrine of an opposed pair: whichever of the two branches reached tier 2 first
function doctrineOf(s, b) { const o = OPPOSITE[b]; if (!o) return null; for (const id of s.owned) { const u = upg(id); if (u.tier >= 1 && (u.b === b || u.b === o)) return u.b; } return null; }
// tier index from which branch b is closed, or null when open
function closedFrom(s, b) { const o = OPPOSITE[b]; if (!o || s.cfg.softLock || doctrineOf(s, b) !== o) return null; return s.cfg.minor ? 2 : 1; }
// an upgrade in the branch opposed to your doctrine (allowed only by cfg.minor or cfg.softLock)
function offDoctrine(s, u) { const o = OPPOSITE[u.b]; return !!(o && u.tier >= 1 && (s.cfg.minor || s.cfg.softLock) && doctrineOf(s, u.b) === o); }
function pairOn(s, pid) {
  if (!v10Pairs(s)) return false;
  const p = PAIRS.find(x => x.id === pid);
  const doc = b => s.cfg.softLock ? hasT2(s, b) : doctrineOf(s, b) === b;
  return doc(p.a) && doc(p.b);
}
const SPECIALS = {
  utopia: { name: 'Utopia', target: false },
  bribe: { name: 'Government Bribe', target: true },
  stoppage: { name: 'Stoppage Order', target: false },
  breaker: { name: 'Alliance Breaker', target: true },
  believe: { name: 'Rally Cry', target: false },
  hybrid: { name: 'Hybrid Threat', target: false },
  collapse: { name: 'Engineered Collapse', target: false }
};
const REBRAND_COST = 10, REBRAND_NOTORIETY = 15;
const FAITH_UNLOCK_COUNTRIES = 4;

const OPS = [
  { id: 'summit', name: 'Summit', branch: 'Diplomacy', cost: 6, cd: 30, text: 'All resistances here −40% for 25 weeks, and derails any World Order move planned here. Quiet.' },
  { id: 'trade', name: 'Trade Deal', branch: 'Economy', cost: 8, cd: 40, text: 'Opens a trade route from your strongest country.' },
  { id: 'snap', name: 'Snap Exercise', branch: 'Military', cost: 8, cd: 30, text: 'Pushes +10% support next to a country you hold 25%+ of, and cancels any World Order move planned there. Loud.' },
  { id: 'dossier', name: 'Leaked Dossiers', branch: 'Covert Ops', cost: 10, cd: 45, text: 'Diplomatic and ideological resistance here drop to 0 for 20 weeks. A World Order member walks out and tears up its signature. Very loud.' }
];


// ---- v10 prototype (cfg.v10): widened resistance profiles, domain power, 16 actions, World Order courtships ----
const V10_RES = {
  borealis: { eco: .80, mil: .45, dip: .60, ideo: .15 }, aethelgard: { eco: .80, mil: .90, dip: .60, ideo: .10 },
  laplata: { eco: .10, mil: .60, dip: .25, ideo: .40 }, isolde: { eco: .55, mil: .10, dip: .35, ideo: .80 },
  guldor: { eco: .60, mil: .45, dip: .90, ideo: .25 }, celestia: { eco: .40, mil: .15, dip: .65, ideo: .85 },
  helvetia: { eco: .90, mil: .10, dip: .60, ideo: .30 }, pannonia: { eco: .20, mil: .25, dip: .30, ideo: .60 },
  koryn: { eco: .35, mil: .85, dip: .20, ideo: .70 }, tavaro: { eco: .85, mil: .60, dip: .25, ideo: .55 },
  kestria: { eco: .25, mil: .40, dip: .35, ideo: .15 }, bharat: { eco: .40, mil: .55, dip: .30, ideo: .60 },
  sinopeia: { eco: .85, mil: .65, dip: .30, ideo: .60 }, juche: { eco: .10, mil: .65, dip: .10, ideo: .95 },
  nippon: { eco: .85, mil: .30, dip: .70, ideo: .55 }, pinguinia: { eco: .10, mil: .05, dip: .85, ideo: .85 }
};
// tuning knobs for the prototype (the bot overrides some via cfg.v10t)
const V10 = { edEff: 1.5, edTrade: 1.5, offCost: 1.5, offNoto: 3, courtWeeks: 13, drain: 4, knockMul: 1, pushMul: 0.6, pnr: 66, t4Up: 10,
  // Enforcement: growth malus per signature before ratification; weekly drains and income cut once ratified
  sigGrowth: .04, enfSigned: 1.5, enfMember: .75, enfOther: .5, enfIncome: .6, enfLoss: 'allSigned', enfShareFloor: .03, enfLimit: 0, enfCourtMul: 1, baseGrowth: .042, enfSlot: 0, enfRamp: .075, costs: [4, 7, 10, 14], cds: [15, 30, 45, 80],
  // Economy action strengths (step 5 balance knobs)
  eco1Amt: 3.5, eco1Knock: 5, eco2Amt: 2, eco2Knock: 0, eco3Amt: 12, eco3Knock: 45, eco3Res: .5, eco4Treaty: 15, eco4Weeks: 25, eco4Income: .7, ecoTrade: 2,
  // step 5 (2026-10-19): v10-only economy and World Order pace (v9 keeps TUNE); Trade Deals income .7 -> 1.5
  income: 2.5, costGrow: .04, planBase: 5, upFx: { e1: { income: 1.5 } }, collapseFloor: .4,
  // v10.9 difficulty: World Order uses perks of member countries you hold below CONTROL (inverted); extra announced campaigns
  woPerks: 0, crackAmt: 0, crackGap: 8, crackN: 2,
  // v10.12 Step 8.1 unrest: gain multiplier per level (old saves without a level = casual)
  unrestMul: 1, legitMul: 1,
  // v10.14 Step 8.3 relocation: weeks the move takes
  relocWeeks: 8,
  // v10.15 Step 8.4 overextension: upkeep multiplier per level
  upkeepMul: 1 };
// Difficulty levels (v10.9). Each level is a set of V10 knob overrides; cfg.v10t (bot experiments) still wins.
const LEVELS = {
  casual: { v10t: { woPerks: 1, unrestMul: .85, legitMul: .7, relocWeeks: 6, upkeepMul: .6 } },
  // v10.19: Normal crackAmt 5 -> 8, Brutal 12 -> 14. v10.21 (Step 9.2 adds the endgame threat): Normal 8 -> 6. After Step 9.1 the Breakup almost always leads to a win, so Normal's difficulty lives before it (bot 81% -> 66%).
  normal: { v10t: { woPerks: 1, legitMul: 1, crackAmt: 6, crackGap: 8, crackN: 2 } },
  brutal: { v10t: { woPerks: 1, unrestMul: 1.15, legitMul: 1.15, relocWeeks: 10, upkeepMul: 1.2, crackAmt: 14, crackGap: 7, crackN: 2, courtWeeks: 8, planBase: 3 } }
};
const LEVEL_IDS = ['casual', 'normal', 'brutal'];
function levelOf(s) { return (s.cfg && LEVELS[s.cfg.level]) ? s.cfg.level : 'casual'; }
function v10t(s, k) { if (s.cfg.v10t && s.cfg.v10t[k] !== undefined) return s.cfg.v10t[k]; const L = s.cfg.level && LEVELS[s.cfg.level]; return (L && L.v10t[k] !== undefined) ? L.v10t[k] : V10[k]; }
function baseRes(s, id) { return s.cfg && s.cfg.v10 ? V10_RES[id] : byId(id).res; }
// Share of the world's strength in a domain that you hold: progressive in support, weighted by sqrt(pop).
function domainPower(s, t) {
  let num = 0, den = 0;
  COUNTRIES.forEach(c => { const w = Math.sqrt(c.pop) * resOf(s, c.id)[t]; den += w; num += w * Math.pow(s.inf[c.id] / 100, 1.5); });
  return den ? Math.min(1, num / den) : 0;
}
// Tier frame: T1 poke, T2 timed rule change, T3 protect/deny, T4 turn the tide (needs the branch's tier-4 upgrade).
const ACTIONS = [
  { id: 'eco1', dom: 'eco', tier: 1, name: 'Foreign Investment', text: '+support (can seed). Slight courtship knock-back' },
  { id: 'eco2', dom: 'eco', tier: 2, name: 'Trade Deal', text: 'Opens a trade route into the target from your strongest country' },
  { id: 'eco3', dom: 'eco', tier: 3, name: 'Buyout', text: 'Economic resistance halved 30 wk, +support, courtship −45' },
  { id: 'eco4', dom: 'eco', tier: 4, name: 'Run on the Bank', text: 'Treaty −15, every courtship at half speed for 25 wk. Your income −30% for 15 wk', global: true },
  { id: 'mil1', dom: 'mil', tier: 1, name: 'Show of Force', text: '+support next to a 15%+ country. Slight courtship knock-back' },
  { id: 'mil2', dom: 'mil', tier: 2, name: 'Snap Exercise', text: '+support, courtship −25. Loud' },
  { id: 'mil3', dom: 'mil', tier: 3, name: 'Proxy Garrison', text: 'Courtship −50 and half speed 15 wk; no new courtship 15 wk; +support. Loud' },
  { id: 'mil4', dom: 'mil', tier: 4, name: 'Regime Change', text: 'Support to at least 50%, leaves the WO, signature void. +10 Notoriety, neighbours resist +20% for 30 wk' },
  { id: 'dip1', dom: 'dip', tier: 1, name: 'Embassy', text: '+support (can seed); this country resists 10% less for good (once per country). Slight courtship knock-back' },
  { id: 'dip2', dom: 'dip', tier: 2, name: 'Summit', text: 'All resistance down a lot 25 wk, courtship −30. Quiet' },
  { id: 'dip3', dom: 'dip', tier: 3, name: 'Non-Aligned Pact', text: 'Target and neighbours: courtship −40, no new courtship 20 wk' },
  { id: 'dip4', dom: 'dip', tier: 4, name: 'Endless Negotiations', text: 'Courtship here at 1/3 speed, and no new courtships anywhere, for 30 wk' },
  { id: 'ideo1', dom: 'ideo', tier: 1, name: 'Pamphlets', text: '+support (can seed). Slight courtship knock-back' },
  { id: 'ideo2', dom: 'ideo', tier: 2, name: 'Youth Movement', text: 'Growth here x(1+effect) 25 wk, courtship −10' },
  { id: 'ideo3', dom: 'ideo', tier: 3, name: 'Martyr Narrative', text: 'Growth up and immune to campaigns 40 wk, courtship −30' },
  { id: 'ideo4', dom: 'ideo', tier: 4, name: 'Popular Uprising', text: 'Courtship wiped, country cannot be courted 40 wk, +15 support' }
];
ACTIONS.forEach(a => { a.cost = V10.costs[a.tier - 1]; a.cd = V10.cds[a.tier - 1]; });
const own = (s, id) => s.owned.includes(id);
// upgrade -> action hooks, listed on the action detail screen when owned
const HOOKS = { e1: ['eco1', 'costs 1 Clout less'], e2: ['eco2', 'recharges 10 weeks faster'], e3: ['eco3', '+3 support in the target\u2019s trade partners'],
  m1: ['mil1', 'needs only a 10% neighbour'], m2: ['mil2', 'knocks courtships back 50% harder'], m3: ['mil3', 'blocks courtship for 25 weeks'],
  d1: ['dip1', 'resistance \u221215% for good'], d2: ['dip2', 'lasts 35 weeks'], d3: ['dip3', 'blocks courtship for 30 weeks'],
  i1: ['ideo1', '+1 support'], i2: ['ideo2', 'lasts 35 weeks'], i3: ['ideo3', 'recharges 15 weeks faster'] };
function hooksFor(s, aid) { return Object.entries(HOOKS).filter(([u, [a]]) => a === aid && own(s, u)).map(([u, [, t]]) => ({ up: upg(u).name, text: t })); }
function actCost(s, a) { const c = v10t(s, 'costs')[a.tier - 1] - (a.id === 'eco1' && own(s, 'e1') ? 1 : 0); return Math.max(1, (a.dom === 'mil' && pairOn(s, 'ecomil') ? Math.max(1, Math.round(c * .75)) : c) - (rulesOn(s) ? perk(s).opDisc : 0)); }
function actCd(s, a) { return Math.max(5, v10t(s, 'cds')[a.tier - 1] - (a.id === 'eco2' && own(s, 'e2') ? 10 : 0) - (a.id === 'ideo3' && own(s, 'i3') ? 15 : 0) - (rulesOn(s) ? perk(s).opCd : 0)); }
function actEff(s, a, target) {
  const pair = a.dom === 'dip' && pairOn(s, 'ecodip') ? 1 + v10t(s, 'edEff') * domainPower(s, 'eco') : a.dom === 'ideo' && pairOn(s, 'ideodip') ? 1 + .5 * domainPower(s, 'dip') : 1;
  return (1 - resBreakdown(s, target)[a.dom]) * (1 + domainPower(s, a.dom)) * pair;
}
function hasMod(s, id, kind) { return s.mods.some(m => m.id === id && m.kind === kind && m.until > s.week); }
function modMul(s, id, kind) { return s.mods.filter(m => m.id === id && m.kind === kind && m.until > s.week).reduce((a, m) => a * m.mul, 1); }
function cdKey(s, a, target) { return s.cfg && (s.cfg.cdMode === 'country' || s.cfg.cdMode === 'hybrid') ? a.id + '@' + target : a.id; }
function nbMax(s, id) { return Math.max(0, ...neighbours(id).map(n => s.inf[n])); }
function courtOn(s, id) { return ((s.wo && s.wo.court) || []).find(c => c.target === id); }
function joinLimit(s, id) { return TUNE.joinBelow - s.stats.shield + (Q(s, id).recruitDelta || 0); }
// past the point of no return (pnr) only a T4 or support above the refuse line stops a courtship
function knock(s, id, pts, a) { const k = ruleKind(s, id, a.dom); if (k === 'noKnock') return; const c = courtOn(s, id); if (c && c.prog < v10t(s, 'pnr')) c.prog = Math.max(0, c.prog - pts * v10t(s, 'knockMul') * (1 + domainPower(s, a.dom)) * (k === 'knock2' ? 2 : 1)); }
function canAct(s, aid, target) {
  const a = ACTIONS.find(x => x.id === aid);
  if (s.over) return { ok: false, why: 'Game over' };
  if (!target && !a.global) return { ok: false, why: 'Pick a country' };
  const k = cdKey(s, a, target); s.acd = s.acd || {};
  if ((s.acd[k] || 0) > s.week) return { ok: false, why: `Ready in ${s.acd[k] - s.week} wk` };
  if (s.cfg.cdMode === 'hybrid' && (s.acd['g:' + a.id] || 0) > s.week) return { ok: false, why: `Ready in ${s.acd['g:' + a.id] - s.week} wk` };
  if (s.clout < actCost(s, a)) return { ok: false, why: 'Not enough Clout' };
  if (s.week < s.utopiaUntil) return { ok: false, why: 'Utopia: no operations' };
  const nOwned = s.owned.filter(id => UPGRADES.find(u => u.id === id).b === a.dom).length;
  if (a.tier === 4 && !s.owned.includes(a.dom[0] + '4') && !(a.dom === 'ideo' && s.owned.includes('i4'))) return { ok: false, why: `Needs the tier-4 ${TYPE_LABEL[a.dom]} upgrade` };
  if (s.cfg.gate !== false && a.tier < 4 && nOwned < a.tier) return { ok: false, why: `Needs ${a.tier} ${TYPE_LABEL[a.dom]} upgrade${a.tier > 1 ? 's' : ''}` };
  if (a.global) return { ok: true };
  const rl = ruleAt(s, target, a.dom);
  if (rl && rl.kind === 'ban') return { ok: false, why: `${rl.name}: no ${TYPE_LABEL[a.dom]} actions here` };
  const v = s.inf[target], W = s.wo, ct = courtOn(s, target) || (rl && rl.kind === 'anyNb');
  const gar = unrestOn(s) && a.dom === 'mil' && a.tier < 4 && v >= CONTROL, calm = unrestOn(s) && aid === 'ideo1' && v >= UNREST.min;
  const bAct = baseActOk(s, a, target);
  if (['eco1', 'eco3', 'mil1', 'mil2', 'mil3', 'ideo1'].includes(aid) && v >= 95 && !((gar || calm) && unrestOf(s, target) >= UNREST.busyAt) && !bAct && !aidOk(s, aid, target)) return { ok: false, why: 'Already yours' };
  if (aid === 'eco2') {
    const src = strongest(s, target);
    if (s.inf[src.id] < 10) return { ok: false, why: 'Need 10%+ somewhere else first' };
    if (tradeLinks(s, target).includes(src.id)) return { ok: false, why: 'Already trades with ' + src.name };
  }
  if (aid === 'mil1' && nbMax(s, target) < (own(s, 'm1') ? 10 : 15) && !ct && !gar && !bAct) return { ok: false, why: `Needs a neighbour at ${own(s, 'm1') ? 10 : 15}%+` };
  if ((aid === 'mil2' || aid === 'mil3') && nbMax(s, target) < 25 && !ct && !gar && !bAct) return { ok: false, why: 'Needs a neighbour at 25%+' };
  if (aid === 'mil4' && nbMax(s, target) < 50 && !(gcMember(s, target) && tradeLinks(s, target).some(n => s.inf[n] >= 50))) return { ok: false, why: 'Needs a neighbour at 50%+' };
  if (aid === 'mil4' && v >= 50 && !W.members[target] && !W.signed[target] && !gcMember(s, target)) return { ok: false, why: 'Already 50%+ and outside the World Order' };
  if ((aid === 'ideo2' || aid === 'ideo3' || aid === 'eco3') && v <= 0) return { ok: false, why: 'No foothold here' };
  if (aid === 'dip4' && !ct && !(ratified(s) && W.signed[target])) return { ok: false, why: 'Only where the World Order is courting, or a signed country during Enforcement' };
  if (aid === 'ideo4' && !ct) return { ok: false, why: 'Only where the World Order is courting' };
  return { ok: true };
}
function pushSupport(s, id, amt) { amt *= v10t(s, 'pushMul'); if (amt <= 0) return; if (s.inf[id] <= 0) seed(s, id, 0.5, null); s.inf[id] = Math.min(100, s.inf[id] + amt); }
function doAct(s, aid, target) {
  const chk = canAct(s, aid, target); if (!chk.ok) return chk;
  const m0 = s.mods.length;
  const a = ACTIONS.find(x => x.id === aid), W = s.wo, e = target ? actEff(s, a, target) : 0;
  const cost0 = actCost(s, a); s.clout -= cost0; s.acd[cdKey(s, a, target)] = s.week + actCd(s, a);
  if (s.cfg.cdMode === 'hybrid') s.acd['g:' + a.id] = s.week + Math.round(actCd(s, a) / 3);
  s.actLog = s.actLog || []; s.actLog.push(aid);
  const leave = id => { delete W.members[id]; delete W.signed[id]; W.queue = W.queue.filter(q => q.target !== id); W.court = (W.court || []).filter(c => c.target !== id); };
  const noto = n => addNoto(s, a.dom === 'mil' && pairOn(s, 'ideomil') ? n / 2 : n);
  const block = (id, wk) => s.mods.push({ id, kind: 'noCourt', until: s.week + wk });
  const rl = target ? ruleAt(s, target, a.dom) : null, before = target ? s.inf[target] : 0, paid = cost0;
  if (rl && rl.kind === 'fizzle' && rng(s) < .5) { addNews(s, `${a.name} in ${byId(target).name} fizzles. ${rl.name}: nobody turns up. The Clout is spent.`, 'wo'); flag(s, 'ping', target, rl.name); addLegit(s, -LEGIT.fizzle, 'fizzle'); tagMods(s, m0, a.name); return { ok: true, fizzled: true }; }
  if (target && ((a.dom === 'mil' && pairOn(s, 'ideomil')) || (a.dom === 'dip' && pairOn(s, 'ideodip')))) s.mods.push({ id: target, kind: 'growth', mul: 1.3, until: s.week + 20 });
  let terms = false;
  switch (aid) {
    case 'eco1': pushSupport(s, target, v10t(s, 'eco1Amt') * e); knock(s, target, v10t(s, 'eco1Knock'), a); break;
    case 'eco2': { const src = strongest(s, target); s.trade.push([src.id, target]); s.deals = (s.deals || []).concat([src.id + '|' + target]); pushSupport(s, target, v10t(s, 'eco2Amt') * e); if (v10t(s, 'eco2Knock')) knock(s, target, v10t(s, 'eco2Knock'), a); noto(1); break; }
    case 'eco3': resMod(s, target, v10t(s, 'eco3Res'), 30, ['eco']); pushSupport(s, target, v10t(s, 'eco3Amt') * e); knock(s, target, v10t(s, 'eco3Knock'), a); if (own(s, 'e3')) tradeLinks(s, target).forEach(id => pushSupport(s, id, 3)); break;
    case 'eco4': s.treaty = Math.max(0, s.treaty - v10t(s, 'eco4Treaty')); s.woBankUntil = s.week + v10t(s, 'eco4Weeks'); if (v10t(s, 'eco4Income') < 1) timed(s, 'incomeMul', 15, v10t(s, 'eco4Income')); break;
    case 'mil1': pushSupport(s, target, 3 * e); knock(s, target, 5, a); noto(1); break;
    case 'mil2': if (ultimatumOk(s, target)) { capitulate(s, target, 'ultimatum'); terms = true; neighbours(target).forEach(n => addUnrest(s, n, ENDGAME.ultUnrest)); break; }   // v10.20 Ultimatum
      pushSupport(s, target, 8 * e); knock(s, target, own(s, 'm2') ? 37.5 : 25, a); noto(3); break;
    case 'mil3': knock(s, target, 50, a); s.mods.push({ id: target, kind: 'courtSlow', mul: .5, until: s.week + 15 }); block(target, own(s, 'm3') ? 25 : 15); pushSupport(s, target, 6 * e); noto(3); break;
    case 'mil4': s.inf[target] = Math.max(s.inf[target], 50); if (W.members[target] && target !== W.hq) leave(target); delete W.signed[target]; W.court = (W.court || []).filter(c => c.target !== target);
      neighbours(target).forEach(n => resMod(s, n, 1.2, 30)); noto(10); break;
    case 'dip1': pushSupport(s, target, 2 * e); if (!hasMod(s, target, 'embassy')) { s.mods.push({ id: target, kind: 'embassy', until: 1e9 }); resMod(s, target, own(s, 'd1') ? .85 : .9, 1e9); }
      knock(s, target, 5, a); break;
    case 'dip2': if (target !== baseOf(s) && !capWhy(s, target)) { capitulate(s, target, 'terms'); terms = true; break; }   // Step 9.1 Terms
      resMod(s, target, Math.max(.3, 1 - .4 * e), own(s, 'd2') ? 35 : 25); knock(s, target, 30, a); noto(.5); break;
    case 'dip3': [target, ...neighbours(target)].forEach(id => { knock(s, id, 40, a); block(id, own(s, 'd3') ? 30 : 20); }); break;
    case 'dip4': if (ratified(s) && W.signed[target] && !courtOn(s, target)) { delete W.signed[target]; block(target, 30); s.woNoNewUntil = s.week + 30; addNews(s, `${byId(target).name}'s signature goes back to committee. Nobody expects it back soon.`, 'you'); break; }
      s.mods.push({ id: target, kind: 'courtSlow', mul: 1 / 3, until: s.week + 30 }); s.woNoNewUntil = s.week + 30; break;
    case 'ideo1': pushSupport(s, target, 2.5 * e); if (own(s, 'i1')) s.inf[target] = Math.min(100, s.inf[target] + 1); knock(s, target, 5, a); break;
    case 'ideo2': s.mods.push({ id: target, kind: 'growth', mul: 1 + e, until: s.week + (own(s, 'i2') ? 35 : 25) }); knock(s, target, 10, a); break;
    case 'ideo3': s.mods.push({ id: target, kind: 'noCampaign', until: s.week + 40 }, { id: target, kind: 'growth', mul: 1 + .3 * e, until: s.week + 40 }); W.queue = W.queue.filter(q => !(q.target === target && q.kind === 'campaign')); knock(s, target, 30, a); break;
    case 'ideo4': W.court = W.court.filter(c => c.target !== target); block(target, 40); pushSupport(s, target, 15); noto(4); break;
  }
  const hl = actHeadline(s, aid, target, aid === 'eco2' && s.trade.length ? s.trade[s.trade.length - 1][0] : null);
  if (terms) { /* the capitulation is the news */ } else if (hl) addNews(s, hl, 'you'); else addNews(s, `${a.name}${target ? ': ' + byId(target).name : ''}.${aid === 'eco4' ? ` Every courtship at half speed for ${v10t(s, 'eco4Weeks')} weeks, treaty draft \u2212${v10t(s, 'eco4Treaty')}.` : aid === 'dip4' ? ' No new World Order courtships anywhere for 30 weeks.' : ''}`, 'you');
  if (rl && !terms && !(target === baseOf(s) && legitOn(s) && rl.kind === 'reverse')) applyRule(s, rl, a, target, before, paid);
  if (target && unrestOn(s) && !terms) unrestOnAct(s, a, target, before, rl);
  if (target && legitOn(s)) legitOnAct(s, a, target, rl);
  if (target && overOn(s)) overOnAct(s, a, target, before);
  const gcRes = gcOn(s) ? gcOnAct(s, a, target, before) : null;
  allianceOnAct(s, a, target);
  if ((terms || gcRes === 'split') && s.wary) s.wary[target] = 0;   // capitulated / split off by Regime Change: not wary of you   // a capitulated country is not wary of you; neighbours still are
  tagMods(s, m0, a.name);
  return { ok: true, capitulated: terms || undefined };
}
// World Order courtships: one target at a time (two from Notoriety 50). Progress fills each week; it drains while
// your support there is above the refuse line. At 100 the country joins (invite) or signs (sign).
// ---- Enforcement (v10): 8 signatures ratify the treaty. While ratified (8+ signed), support drains weekly and income drops.
// Falling back under 8 (withdrawal at 70%, Regime Change) suspends it. After the first ratification the draft is complete:
// every member may be courted to sign. Loss: extinction, or every populated country signed.
// country rules that fire after an action resolves (weak spot or wall)
function applyRule(s, rl, a, target, before, paid) {
  const c = byId(target), gain = s.inf[target] - before;
  switch (rl.kind) {
    case 'echo': if (gain > 0) { const ns = neighboursOrTrade(s, target); ns.forEach(id => { if (s.inf[id] <= 0) seed(s, id, gain * .5, target); else s.inf[id] = Math.min(100, s.inf[id] + gain * .5); }); if (ns.length) { addNews(s, `${rl.name}: ${a.name} in ${c.name} echoes into ${ns.length} more countr${ns.length === 1 ? 'y' : 'ies'}.`, 'you'); flag(s, 'ping', target, rl.name); } } break;
    case 'lock': s.mods.push({ id: target, kind: 'noCourt', until: s.week + 20, src: rl.name }); addNews(s, `${rl.name}: the World Order cannot court ${c.name} for 20 weeks.`, 'you'); flag(s, 'ping', target, rl.name); break;
    case 'refund': { const r = Math.max(1, Math.floor(paid / 2)); s.clout += r; addNews(s, `${rl.name}: ${a.name} in ${c.name} pays back ${r} Clout.`, 'you'); break; }
    case 'bubble': spawnBubble(s, target, 2); break;
    case 'knock2': if (courtOn(s, target)) addNews(s, `${rl.name}: ${a.name} hits the World Order’s courtship of ${c.name} twice as hard.`, 'you'); break;
    case 'harden': resMod(s, target, 1.25, 20, [a.dom], { src: rl.name }); addNews(s, `${rl.name}: ${c.name} digs in. ${TYPE_LABEL[a.dom]} resistance +25% for 20 weeks.`, 'wo'); flag(s, 'ping', target, rl.name); break;
    case 'loud': s.notoriety = Math.min(100, s.notoriety + 4); addNews(s, `${rl.name}: ${a.name} in ${c.name} makes headlines. +4 Notoriety.`, 'wo'); break;
    case 'reverse': s.inf[target] = Math.max(0, Math.min(s.inf[target], before) - 5); addNews(s, `${rl.name}: ${a.name} backfires in ${c.name}. −5 support.`, 'wo'); flag(s, 'ping', target, rl.name); addLegit(s, -LEGIT.reverse, 'reverse'); break;
  }
}
function ratified(s) { return !!(s.cfg.v10 && s.wo.ratifiedAt && signedCount(s) >= SIGNATURES_TO_LOSE); }
function populated() { return COUNTRIES.filter(c => c.pop >= 1); }
function sigGrowthMul(s) { return s.cfg.v10 ? Math.max(0, 1 - v10t(s, 'sigGrowth') * Math.min(SIGNATURES_TO_LOSE, signedCount(s))) : 1; }
function enforcementTick(s) {
  const W = s.wo, n = signedCount(s);
  if (n >= SIGNATURES_TO_LOSE) {
    if (!W.ratifiedAt) { W.ratifiedAt = s.week; addNews(s, `Containment Treaty ratified by ${n} nations. Enforcement begins: your movement is squeezed everywhere the treaty reaches.`, 'wo'); flag(s, 'critical', null, 'Treaty ratified'); }
    else if (W.suspended) { W.suspended = false; addNews(s, 'Enough signatures again. Enforcement resumes.', 'wo'); flag(s, 'critical', null, 'Enforcement resumes'); }
    s.enfWeeks = (s.enfWeeks || 0) + 1;
    const ramp = 1 + v10t(s, 'enfRamp') * s.enfWeeks; // enforcement tightens the longer it runs (cumulative weeks)
    COUNTRIES.forEach(c => {
      const dr = ramp * (W.signed[c.id] ? v10t(s, 'enfSigned') : W.members[c.id] ? v10t(s, 'enfMember') : v10t(s, 'enfOther'));
      if (dr && s.inf[c.id] > 0) s.inf[c.id] = Math.max(0, s.inf[c.id] - dr);
    });
  } else if (W.ratifiedAt && !W.suspended) {
    W.suspended = true; s.comebacks = (s.comebacks || 0) + 1;
    addNews(s, `Signatures fall to ${n}. Enforcement is suspended while ${SG} recounts.`, 'you'); flag(s, 'important', null, 'Enforcement suspended');
  }
}
function enforcementLost(s) {
  if (!ratified(s)) return false;
  if (v10t(s, 'enfLoss') === 'allSigned' || v10t(s, 'enfLoss') === 'both') { if (populated().every(c => s.wo.signed[c.id])) return true; }
  if (v10t(s, 'enfShareFloor') && alignedShare(s) < v10t(s, 'enfShareFloor')) return true;
  return false;
}
function courtSlots(s) { return 1 + (s.notoriety >= 50 ? 1 : 0) + (ratified(s) ? v10t(s, 'enfSlot') : 0); }
// while ratified, the World Order may court any country below enfLimit (if set) and ignores 'never joins' quirks
function cSignLim(s, id) { return ratified(s) ? Math.max(signLimit(s, id), v10t(s, 'enfLimit')) : signLimit(s, id); }
function cJoinLim(s, id) { return ratified(s) ? Math.max(joinLimit(s, id), v10t(s, 'enfLimit')) : joinLimit(s, id); }
function courtOpen(s) {
  const W = s.wo; W.court = W.court || [];
  if (W.court.length >= courtSlots(s) || s.week < (s.woNoNewUntil || 0)) return false;
  const busy = new Set([...W.court.map(c => c.target), ...W.queue.map(q => q.target)]);
  const ok = id => !busy.has(id) && !hasMod(s, id, 'noCourt');
  if (signedCount(s) + W.court.filter(c => c.kind === 'sign').length < signCapacity(s)) {
    const c = Object.keys(W.members).filter(id => !W.signed[id] && ok(id) && !hasMod(s, id, 'noSign') && s.inf[id] < cSignLim(s, id) - 10).sort((a, b) => s.inf[a] - s.inf[b])[0];
    if (c) { W.court.push({ target: c, kind: 'sign', prog: 0 }); addNews(s, `${SG} starts courting ${byId(c).name} to sign the treaty.`, 'wo'); flag(s, 'important', c, 'Courting: sign'); return true; }
  }
  const rec = COUNTRIES.filter(c => !W.members[c.id] && ok(c.id) && (ratified(s) || !Q(s, c.id).noRecruit) && s.inf[c.id] < cJoinLim(s, c.id) - 10 && c.pop >= 1).sort((a, b) => b.pop - a.pop);
  if (rec.length) { const c = rec[Math.floor(rng(s) * Math.min(3, rec.length))]; W.court.push({ target: c.id, kind: 'invite', prog: 0 }); addNews(s, `${SG} starts courting ${c.name} to join the World Order.`, 'wo'); flag(s, 'important', c.id, 'Courting: join'); return true; }
  return false;
}
function courtTick(s) {
  const W = s.wo; W.court = W.court || [];
  W.court.forEach(c => {
    const lim = c.kind === 'sign' ? cSignLim(s, c.target) : cJoinLim(s, c.target), v = s.inf[c.target];
    if (c.kind === 'sign' && !W.members[c.target]) { c.done = true; return; }
    if (v >= lim) c.prog -= v10t(s, 'drain');
    else if (c.kind === 'sign' && hasMod(s, c.target, 'noSign')) { /* dependent on your trade: the pen hovers */ }
    else {
      let sp = (100 / v10t(s, 'courtWeeks')) * (0.6 + s.notoriety / 100) * (1 + .03 * memberCount(s)) * (1 - 0.7 * v / lim) * modMul(s, c.target, 'courtSlow') * (s.week < (s.woBankUntil || 0) ? .5 : 1) * (ratified(s) ? v10t(s, 'enfCourtMul') : 1) * (c.kind === 'invite' ? allyCourtMul(s, c.target) : 1);
      if (Q(s, c.target).woFail) sp *= 1 - Q(s, c.target).woFail;
      c.prog += sp;
    }
    const nm = byId(c.target).name;
    if (c.prog >= 100) {
      c.done = true;
      if (c.kind === 'sign') { W.signed[c.target] = true; addNews(s, `${nm} signs the Containment Treaty. ${signedCount(s)} of ${SIGNATURES_TO_LOSE} signatures.`, 'wo'); flag(s, 'critical', c.target, 'Signed treaty'); }
      else { W.members[c.target] = true; addNews(s, `${nm} joins the World Order.`, 'wo'); flag(s, 'critical', c.target, 'Joined World Order'); }
    } else if (c.prog <= 0 && v >= lim) { c.done = true; addNews(s, `${nm} turns the World Order down. Too many of its people agree with you.`, 'you'); flag(s, 'important', c.target, 'Courtship failed'); }
    c.prog = Math.max(0, c.prog);
  });
  W.court = W.court.filter(c => !c.done);
}

// v10.19 (Step 9.1): win = every country held (CONTROL%+, base included) at the same time, or WIN_SHARE of the world aligned.
// The treaty collapse is no longer a win: it is the Breakup (the World Order dissolves) and the game goes on.
const WIN_SHARE = 0.90;
// v10.17: after "Continue playing" the game ends only at a (near) perfect world, or on a real loss.
const PERFECT_SHARE = 0.99;
// Step 9.1 knobs. capAt: share that turns capitulation on before the Breakup. A country capitulates after capWeeks in a row
// eligible (not your base, below CONTROL, not allied, not a World Order member, support >= capMin, wariness < capWary).
// Summit (Diplomacy tier 2) on an eligible country = Terms: it capitulates at once. Breakup: notoriety -breakNoto, freed members wary freedWary.
const ENDGAME = { capAt: .75, capMin: 40, capWary: 30, capWeeks: 6, capTo: 90, breakNoto: 20, freedWary: 50, hopeless: 26, ultUnrest: 10,
  // v10.21 Step 9.2 Grand Coalition (GC): forms at the Breakup from the holdouts (below CONTROL, not your base) when there are gcMin+.
  // Members resist together (+gcRes on every resistance). gcDecay < 0 = the coalition slowly regains cohesion when left alone.
  // Cohesion: -gcDecay/wk, -gcWin/wk per member at gcWinAt%+; Diplomacy on a member -gcDip, Ideology -gcIdeo, Military on a member +gcMil
  // (rallies), Military on a country you hold next to / trading with a member -gcBorder (-gcBorderM3 with Sovereign Intervention),
  // Regime Change on a member splits it off (-gcRegime). Below gcBreak it breaks. World Unity loss: cohesion >= gcUnityAt for gcUnityWeeks.
  // Crackdowns every gcGap weeks on the 2 biggest contested countries (up to -gcAmt support, +UNREST.crack). A held country below gcRejoin% joins.
  gcMin: 2, gcDecay: -.4, gcWin: .3, gcWinAt: 50, gcDip: 8, gcIdeo: 5, gcMil: 8, gcBorder: 4, gcBorderM3: 6, gcRegime: 15, gcBreak: 20,
  gcUnityAt: 60, gcUnityWeeks: 40, gcGap: 8, gcAmt: 8, gcRejoin: 50, gcLead: 6, gcRes: .3 };
// per-level ENDGAME overrides (cfg.eg still wins)
// Brutal World Unity 35 weeks (Pavel agreed 30; at 30 the bot wins 15% on Brutal, below the 20-30% target)
const LEVEL_EG = { casual: { gcUnityWeeks: 50, gcAmt: 5, gcGap: 10 }, normal: {}, brutal: { gcUnityWeeks: 35, gcGap: 8, gcAmt: 10 } };
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
  borealis:   { quirk: 'Federal: the World Order can only recruit it below 20% support.', q: { recruitDelta: -20 }, perkName: 'Resource-rich', perk: 'Clout income up a little', fx: { income: .5 }, woPerk: 'your Clout income down a little' },
  aethelgard: { quirk: 'Divided politics: random support swings of 4–10 points.', q: { swing: .015 }, perkName: 'Superpower ally', perk: 'World Order campaigns hit 30% softer', fx: { fc: .3 }, woPerk: 'World Order campaigns hit you 30% harder' },
  laplata:    { quirk: 'Unstable: frequent support swings, up or down.', q: { swing: .02 }, perkName: 'Breadbasket', perk: 'Trade spread +15%', fx: { trade: 1.15 }, woPerk: 'your trade spread −15%' },
  isolde:     { quirk: 'Remote: the World Order never recruits it.', q: { noRecruit: true }, perkName: 'Hideout', perk: 'Clout income up a little', fx: { income: .2 }, woPerk: 'your Clout income down a little' },
  guldor:     { quirk: 'Old money: ideas travel out of Guldor 50% faster.', q: { outMul: 1.5 }, perkName: 'Financier', perk: 'Clout income up', fx: { income: 1 }, woPerk: 'your Clout income down' },
  celestia:   { quirk: 'Cultural power: ideas travel out of Celestia 40% faster.', q: { outMul: 1.4 }, perkName: 'Soft power', perk: 'Notoriety grows 10% slower', fx: { vis: -.1 }, woPerk: 'Notoriety grows 10% faster' },
  helvetia:   { quirk: 'Neutral: the World Order cannot run campaigns here.', q: { immuneAt: 1 }, perkName: 'Discreet banking', perk: 'Operations cost 1 Clout less', fx: { opDisc: 1 }, woPerk: 'your actions cost 1 Clout more' },
  pannonia:   { quirk: 'Unpredictable: 40% of World Order moves here fall through.', q: { woFail: .4 }, perkName: 'Landlocked hub', perk: 'Border spread +10%', fx: { border: 1.1 }, woPerk: 'your border spread −10%' },
  koryn:      { quirk: 'Authoritarian: slow to convert (−15% growth), but immune to campaigns once you hold 50%.', q: { gMul: .85, immuneAt: 50 }, perkName: 'Resource-rich', perk: 'Clout income up a little', fx: { income: .5 }, woPerk: 'your Clout income down a little' },
  tavaro:     { quirk: 'Crossroads: spread through Tavaro is 40% faster out, 20% faster in.', q: { outMul: 1.4, inMul: 1.2 }, perkName: 'Oil', perk: 'Clout income up', fx: { income: 1 }, woPerk: 'your Clout income down' },
  kestria:    { quirk: 'Young population: +25% internal growth.', q: {}, perkName: 'Youth movement', perk: 'More opportunity bubbles', fx: { bubble: .06 }, woPerk: 'fewer opportunity bubbles' },
  bharat:     { quirk: 'Colossal democracy: slow to convert (−15% growth), and needs 10 points less support to refuse a signing.', q: { gMul: .85, signDelta: -10 }, perkName: 'Digital reach', perk: 'Internal growth +10% everywhere', fx: { growth: 1.1 }, woPerk: 'your internal growth −10% everywhere' },
  sinopeia:   { quirk: 'Paperwork: spread into Sinopeia is halved, but out of it +30%.', q: { inMul: .5, outMul: 1.3 }, perkName: 'Manufacturing giant', perk: 'Clout income up', fx: { income: 1 }, woPerk: 'your Clout income down' },
  juche:      { quirk: 'Isolated: no trade spread in, border spread halved, but Leaked Dossiers break every defence.', q: { inMul: .5, tradeInMul: 0, dossierAll: true }, perkName: 'Fanatics', perk: 'Treaty drafting 5% slower', fx: { treatySlow: .05 }, woPerk: 'treaty drafting 5% faster' },
  nippon:     { quirk: 'Hyper-connected: +15% internal growth.', q: { gMul: 1.15 }, perkName: 'Hyper-advanced', perk: 'Every cooldown 6 weeks shorter', fx: { opCd: 6 }, woPerk: 'your cooldowns 6 weeks longer' },
  pinguinia:  { quirk: 'Remote: nothing happens here, for now.', q: {}, perkName: 'Neutral scientists', perk: 'World Order members resist 5 points less', fx: { memberRes: .05 }, woPerk: 'World Order members resist 5 points more' }
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
// ---- v10.8 (Step 7): country asymmetry. Every country has a weak spot (one domain whose actions get an extra rule there),
// a wall (one domain whose actions misfire there) and a base bonus (when you start there). Applies to v10 games (cfg.rules !== false).
// weak kinds: echo, knock2, lock, refund, anyNb, bubble.  wall kinds: harden, loud, fizzle, noKnock, ban, reverse.
// base kinds: free (first upgrade of a branch free), clout, upSwings, quiet, perk (held-perk active from week 0), seedNb, start8, noCourt, noCampaign.
const RULES = {
  borealis:   { weak: ['ideo', 'echo', 'Provincial politics', 'Ideology actions here also spread half their gain to neighbours and trade partners.'],
                wall: ['eco', 'harden', 'Resource nationalism', 'Economy actions here raise its economic resistance by 25% for 20 weeks.'],
                base: ['free', 'Your first Ideology upgrade is free.', 'ideo'] },
  aethelgard: { weak: ['ideo', 'knock2', 'Culture wars', 'Ideology actions here knock World Order courtships back twice as hard.'],
                wall: ['mil', 'loud', 'Superpower pride', 'Military actions here cost +4 Notoriety.'],
                base: ['clout', 'You start with 15 Clout instead of 5.'] },
  laplata:    { weak: ['eco', 'refund', 'Commodity boom', 'Economy actions here refund half their Clout cost.'],
                wall: ['dip', 'fizzle', 'Revolving governments', 'Diplomacy actions here fail half the time. The Clout is spent anyway.'],
                base: ['upSwings', 'Support swings in your base only go up.'] },
  isolde:     { weak: ['dip', 'lock', 'Close-knit', 'Diplomacy actions here also stop World Order courtship for 20 weeks.'],
                wall: ['ideo', 'harden', 'Proud heritage', 'Ideology actions here raise its ideological resistance by 25% for 20 weeks.'],
                base: ['quiet', 'Notoriety grows 20% slower.'] },
  guldor:     { weak: ['eco', 'echo', 'Old money', 'Economy actions here also spread half their gain to neighbours and trade partners.'],
                wall: ['dip', 'noKnock', 'Ancient treaties', 'Diplomacy actions here do not slow World Order courtships.'],
                base: ['perk', 'Financier is active from the start: Clout income up.'] },
  celestia:   { weak: ['mil', 'anyNb', 'Soft army', 'Military actions here need no neighbour support.'],
                wall: ['ideo', 'harden', 'Philosophers', 'Ideology actions here raise its ideological resistance by 25% for 20 weeks. Someone always writes a rebuttal.'],
                base: ['free', 'Your first Diplomacy upgrade is free.', 'dip'] },
  helvetia:   { weak: ['dip', 'refund', 'Neutral venue', 'Diplomacy actions here refund half their Clout cost.'],
                wall: ['mil', 'ban', 'Armed neutrality', 'No Military actions here.'],
                base: ['perk', 'Discreet banking is active from the start: every action costs 1 Clout less.'] },
  pannonia:   { weak: ['eco', 'knock2', 'Pragmatists', 'Economy actions here knock World Order courtships back twice as hard.'],
                wall: ['dip', 'fizzle', 'Contrarian', 'Diplomacy actions here fail half the time. The Clout is spent anyway.'],
                base: ['seedNb', 'You start with 2% support in every neighbour.'] },
  koryn:      { weak: ['mil', 'lock', 'Respects strength', 'Military actions here also stop World Order courtship for 20 weeks.'],
                wall: ['eco', 'harden', 'Sanction-hardened', 'Economy actions here raise its economic resistance by 25% for 20 weeks.'],
                base: ['free', 'Your first Military upgrade is free.', 'mil'] },
  tavaro:     { weak: ['mil', 'refund', 'Defence expo', 'Military actions here refund half their Clout cost.'],
                wall: ['eco', 'loud', 'Oil consortium', 'Economy actions here cost +4 Notoriety.'],
                base: ['perk', 'Oil is active from the start: Clout income up.'] },
  kestria:    { weak: ['ideo', 'bubble', 'Viral', 'Ideology actions here drop a 2-Clout bubble.'],
                wall: ['mil', 'reverse', 'Youth protests', 'Military actions here cost you 5 support instead of adding it.'],
                base: ['start8', 'You start with 8% support instead of 3%.'] },
  bharat:     { weak: ['dip', 'knock2', 'Coalition politics', 'Diplomacy actions here knock World Order courtships back twice as hard.'],
                wall: ['eco', 'fizzle', 'Red tape', 'Economy actions here fail half the time. The Clout is spent anyway.'],
                base: ['perk', 'Digital reach is active from the start: internal growth +10% everywhere.'] },
  sinopeia:   { weak: ['dip', 'echo', 'Face', 'Diplomacy actions here also spread half their gain to neighbours and trade partners.'],
                wall: ['ideo', 'ban', 'Great Firewall', 'No Ideology actions here.'],
                base: ['noCourt', 'The World Order can never court your base.'] },
  juche:      { weak: ['mil', 'anyNb', 'Brittle regime', 'Military actions here need no neighbour support.'],
                wall: ['ideo', 'reverse', 'Portrait backlash', 'Ideology actions here cost you 5 support instead of adding it.'],
                base: ['noCampaign', 'The World Order cannot run campaigns in your base.'] },
  nippon:     { weak: ['ideo', 'echo', 'Trendsetters', 'Ideology actions here also spread half their gain to neighbours and trade partners.'],
                wall: ['mil', 'reverse', 'Pacifist constitution', 'Military actions here cost you 5 support instead of adding it.'],
                base: ['perk', 'Hyper-advanced is active from the start: every action recharges 6 weeks faster.'] },
  pinguinia:  { weak: ['eco', 'bubble', 'Research grants', 'Economy actions here drop a 2-Clout bubble.'],
                wall: ['mil', 'ban', 'Antarctic Treaty', 'No Military actions here.'],
                base: ['free', 'Your first Economy upgrade is free.', 'eco'] }
};
function rulesOn(s) { return !!(s && s.cfg && s.cfg.v10 && s.cfg.rules !== false); }
// the rule a domain meets in a country: { side: 'weak'|'wall', kind, name, text } or null
function ruleAt(s, id, dom) {
  if (!rulesOn(s) || !id || !RULES[id]) return null;
  for (const side of ['weak', 'wall']) { const r = RULES[id][side]; if (r[0] === dom) return { side, dom, kind: r[1], name: r[2], text: r[3] }; }
  return null;
}
const ruleKind = (s, id, dom) => { const r = ruleAt(s, id, dom); return r ? r.kind : null; };
function baseRule(s) { return rulesOn(s) && RULES[baseOf(s)] ? RULES[baseOf(s)].base : null; }
const MULT_KEYS = ['growth', 'trade', 'border'];
function Q(s, id) { return (s.cfg && s.cfg.traits === false) ? {} : ((TRAITS[id] && TRAITS[id].q) || {}); }
function perk(s) {
  const p = { income: 0, growth: 1, trade: 1, border: 1, vis: 0, fc: 0, opDisc: 0, opCd: 0, bubble: 0, treatySlow: 0, memberRes: 0, plan: 0 };
  const add = fx => Object.entries(fx || {}).forEach(([k, v]) => { if (MULT_KEYS.includes(k)) p[k] *= v; else p[k] += v; });
  if (!s.cfg || s.cfg.traits !== false) COUNTRIES.forEach(c => { if (TRAITS[c.id] && (s.inf[c.id] >= CONTROL || (c.id === baseOf(s) && (baseRule(s) || [])[0] === 'perk'))) add(TRAITS[c.id].fx); });
  woPerkIds(s).forEach(id => Object.entries(TRAITS[id].fx).forEach(([k, v]) => { if (MULT_KEYS.includes(k)) p[k] /= v; else p[k] -= v; }));
  (s.cond || []).forEach(id => add(CONDITIONS.find(c => c.id === id).fx));
  return p;
}
// Countries whose perk the World Order turns against you: members you hold below CONTROL.
function woPerkIds(s) {
  if (!s.cfg || !s.cfg.v10 || s.cfg.traits === false || !s.wo || !v10t(s, 'woPerks')) return [];
  return COUNTRIES.filter(c => TRAITS[c.id] && TRAITS[c.id].woPerk && s.wo.members[c.id] && s.inf[c.id] < CONTROL).map(c => c.id);
}
function resOf(s, id) { return (s.res && s.res[id]) || baseRes(s, id); }
function signLimit(s, id) { return TUNE.signBelow - s.stats.shield + (Q(s, id).signDelta || 0); }

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function createState(startId, seed, opts) {
  const cfg = Object.assign({ traits: true, random: true }, opts || {});
  const s = {
    cfg, res: null, cond: [],
    v: opts && opts.v10 ? 6 : 5, pending: null, ev: { next: 18, nextDecision: 70, fx: {}, temp: [], seen: {}, log: [], endorsed: null, loudOp: null }, seed: seed >>> 0, rngCalls: 0, week: 0, clout: 5, startId,
    inf: {}, mods: [], trade: TRADE.map(t => t.slice()),
    stats: { growth: cfg.v10 ? ((cfg.v10t && cfg.v10t.baseGrowth) || V10.baseGrowth) : .05, border: .02, trade: .015, reach: 0, income: 0, vis: 1, loud: 0, treatySlow: 0, fcRed: 0, summitCd: 0, snapBoost: 0, dossierDiscount: 0, shield: 0, sabotage: 0, hiCut: 0, opDiscount: 0, pen: { eco: 0, mil: 0, dip: 0, ideo: 0 } },
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
        const b0 = baseRes(s, c.id)[t]; let v = b0 * (1 + (rng(s) - .5) * .3);
        if (c.id === 'sinopeia' || c.id === 'bharat') v = Math.min(v, b0 + .03);
        s.res[c.id][t] = Math.round(Math.min(.9, Math.max(.05, v)) * 100) / 100;
      });
    });
    const pool = CONDITIONS.slice();
    for (let i = 0; i < 2; i++) s.cond.push(pool.splice(Math.floor(rng(s) * pool.length), 1)[0].id);
    addNews(s, `World conditions this game: ${s.cond.map(id => CONDITIONS.find(c => c.id === id).name).join(' and ')}.`, 'world');
  }
  applyBase(s);
  return s;
}
function applyBase(s) {
  const b = baseRule(s); if (!b) return;
  const id = s.startId, src = 'Base: ' + byId(id).name;
  if (b[0] === 'free') s.freeUp = b[2];
  if (b[0] === 'clout') s.clout = 15;
  if (b[0] === 'quiet') { s.base.vis -= .2; s.stats.vis -= .2; }
  if (b[0] === 'start8') s.inf[id] = 8;
  if (b[0] === 'seedNb') neighbours(id).forEach(n => { s.inf[n] = 2; s.flags['seed_' + n] = true; });
  if (b[0] === 'noCourt' || b[0] === 'noCampaign') s.mods.push({ id, kind: b[0], until: 1e9, src });
  addNews(s, `Base bonus, ${byId(id).name}: ${b[1]}`, 'you');
}
function rng(s) { const r = mulberry32(s.seed + s.rngCalls * 7919)(); s.rngCalls++; return r; }
function byId(id) { return COUNTRIES.find(c => c.id === id); }
// current base (v10.14 relocation); startId stays the original start for scoring, best results and unlock goals
function baseOf(s) { return s.baseId || s.startId; }
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
  const add = (active.filter(m => m.kind === 'counter').length ? 0.25 : 0) + (s.wo && s.wo.members[id] ? Math.max(0, TUNE.memberRes - perk(s).memberRes) : 0) + (s.gc && !s.gc.broke && s.gc.members.includes(id) ? egk(s, 'gcRes') : 0);
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
    const g = st.growth * (c.growthMul || 1) * (Q(s, c.id).gMul || 1) * pk.growth * (1 - R[c.id]) * (s.week < s.utopiaUntil ? 2 : 1) * (fxOn(s, 'growthMul') || 1) * modMul(s, c.id, 'growth') * (s.cfg.v10 ? (1 + .5 * domainPower(s, 'ideo')) * sigGrowthMul(s) : 1);
    d[c.id] += g * v * (1 - v / 100) + 0.04 * (1 - R[c.id]);
  });
  // 1b. Quirk: support swings (unstable countries)
  COUNTRIES.forEach(c => {
    const sw = Q(s, c.id).swing; if (!sw || s.inf[c.id] < 8) return;
    if (rng(s) < sw) {
      const delta = (rng(s) < .5 && !(c.id === baseOf(s) && (baseRule(s) || [])[0] === 'upSwings') ? -1 : 1) * (4 + 6 * rng(s));
      d[c.id] += delta;
      if (delta < 0 && c.id === baseOf(s)) addLegit(s, -LEGIT.scandal, 'scandal');
      if (s.inf[c.id] >= 5) { addNews(s, delta > 0 ? `A populist wave in ${c.name} lifts your movement.` : `A scandal in ${c.name} knocks your movement back.`, delta > 0 ? 'you' : 'wo'); flag(s, 'ping', c.id, delta > 0 ? 'Swing up' : 'Swing down'); }
    }
  });
  // 2. Spread over borders and trade routes
  const spread = (a, b, rate, kind) => {
    [[a, b], [b, a]].forEach(([src, dst]) => {
      const sv = s.inf[src]; if (sv < 8) return;
      const inward = s.mods.some(m => m.id === src && m.inward && m.until > s.week) ? .5 : 1;
      const qIn = kind === 'trade' && Q(s, dst).tradeInMul !== undefined ? Q(s, dst).tradeInMul : (Q(s, dst).inMul || 1);
      const pull = rate * inward * qIn * (kind === 'trade' ? modMul(s, dst, 'tradeIn') : 1) * (Q(s, src).outMul || 1) * (sv / 100) * (1 - R[dst]);
      if (s.inf[dst] <= 0) {
        if (rng(s) < pull * 3) seed(s, dst, 1, src);
      } else if (s.inf[dst] < sv) {
        d[dst] += pull * TUNE.pressure;
      }
    });
  };
  BORDERS.forEach(([a, b]) => spread(a, b, st.border * pk.border, 'border'));
  s.trade.forEach(([a, b]) => { if (!isBlocked(s, a, b)) spread(a, b, (st.trade * pk.trade + (pairOn(s, 'ecodip') ? v10t(s, 'edTrade') * st.border * pk.border : 0)) * (fxOn(s, 'tradeMul') || 1) * (s.cfg.v10 ? 1 + v10t(s, 'ecoTrade') * domainPower(s, 'eco') : 1), 'trade'); });
  // 3. Grassroots reach: distant seeding
  if (st.reach > 0) COUNTRIES.forEach(c => {
    if (s.inf[c.id] <= 0 && rng(s) < st.reach * (1 + 6 * alignedShare(s)) * (1 - R[c.id])) seed(s, c.id, 1, null);
  });
  COUNTRIES.forEach(c => { s.inf[c.id] = Math.max(0, Math.min(100, s.inf[c.id] + d[c.id])); });

  const share = alignedShare(s); s.peakShare = Math.max(s.peakShare, share);
  trackRun(s);
  // 4. Clout income + opportunity bubbles
  s.clout += (1 - upkeepOf(s).frac) * (s.cfg.v10 ? v10t(s, 'income') : TUNE.income) * Math.max(0.05, 0.12 + 0.06 * (st.income + pk.income)) * (1 + TUNE.shareIncome * share) * (s.week < s.utopiaUntil ? 2 : 1) * (fxOn(s, 'incomeMul') || 1) * (s.cfg.v10 ? (1 + domainPower(s, 'eco')) * (pairOn(s, 'ecomil') ? 1 + .5 * domainPower(s, 'mil') : 1) * (ratified(s) ? v10t(s, 'enfIncome') : 1) : 1);
  s.bubbles = s.bubbles.filter(b => b.until > s.week);
  const held = COUNTRIES.filter(c => s.inf[c.id] > 0 || (own(s, 'e1') && tradeLinks(s, c.id).some(h => s.inf[h] >= 25 && !isBlocked(s, c.id, h))));
  if (held.length && rng(s) < 0.16 + 0.1 * share + pk.bubble) {
    const c = held[Math.floor(rng(s) * held.length)];
    spawnBubble(s, c.id, 1 + (rng(s) < 0.35 ? 1 : 0));
  }
  // 5. Notoriety and the World Order
  const vis = Math.max(0.2, st.vis + pk.vis);
  s.notoriety = Math.min(100, s.notoriety + vis * (0.01 + TUNE.noto * share + TUNE.reachNoto * COUNTRIES.filter(c => s.inf[c.id] >= 5).length / COUNTRIES.length) + st.loud);
  if (!s.coalition && !s.broken && s.notoriety >= TUNE.coalitionAt) woActivate(s);
  if (s.coalition && s.week < s.frozenUntil) { s.wo.queue.forEach(q => { q.at++; q.planned++; }); s.wo.nextPlan++; }
  else if (s.coalition) {
    s.treaty = Math.min(100, Math.max(0, s.treaty + TUNE.treaty * (0.35 + s.notoriety / 100) * (1 - Math.min(.8, st.treatySlow + pk.treatySlow))));
    treatyNews(s);
    woTick(s);
  }
  if (s.cfg.v10 && s.coalition) enforcementTick(s);
  // Step 9.1: a treaty that stays hopeless for 26 weeks no longer ends the game. The World Order breaks up.
  if (s.coalition && (s.wo.hopeless || 0) >= egk(s, 'hopeless') && !(s.cfg.v10 && s.wo.ratifiedAt)) breakup(s);
  if (s.coalition || s.broken) allianceTick(s);
  if (s.gc) gcTick(s);
  if (s.coalition) dependencyTick(s);
  milestoneNews(s, share);
  eventsTick(s);
  unrestTick(s);
  legitTick(s);
  overTick(s);
  capTick(s);
  s.mods = s.mods.filter(m => m.until > s.week);
  s.blocked = s.blocked.filter(b => b.until > s.week);
  // 6. End conditions
  if (s.cont && share >= PERFECT_SHARE) { s.over = 'perfect'; addNews(s, 'Not a single country disagrees. A committee is formed to find out how this happened.', 'you'); }
  else if (!s.cont && (allHeld(s) || share >= winShareOf(s))) {
    s.over = 'win'; s.winType = allHeld(s) ? 'held' : 'share';
    addNews(s, s.winType === 'held' ? `All ${COUNTRIES.length} countries are yours at once. The world wakes up aligned. Nobody remembers agreeing to it.` : 'The world wakes up aligned. Nobody remembers agreeing to it.', 'you');
  }
  // the treaty / Enforcement loss exists only while the World Order does (before the Breakup)
  else if (!s.broken && (s.cfg.v10 ? enforcementLost(s) : signedCount(s) >= SIGNATURES_TO_LOSE)) { s.over = 'treaty'; addNews(s, `Containment Treaty ratified by ${SIGNATURES_TO_LOSE} nations. ${SG} weeps with joy into a fountain pen.`, 'wo'); }
  else if (gcOn(s) && s.gc.unityWk >= egk(s, 'gcUnityWeeks')) { s.over = 'unity'; addNews(s, 'World Unity: the Grand Coalition stays together long enough to write a constitution. Your movement becomes a footnote in it.', 'wo'); }
  else if (legitOn(s) && legitEnd(s)) { /* s.over set by legitEnd */ }
  else if (COUNTRIES.every(c => s.inf[c.id] <= 0)) { s.over = 'extinct'; addNews(s, 'Your movement has vanished. Historians shrug.', 'wo'); }
}

// ---- Step 8.1 (v10.12): unrest + uprisings. Countries you have a stake in (>= UNREST.min) but have not settled
// (< settled) build unrest; at 100 they rise: support drops, neighbours get restless. Not in your base (8.2 legitimacy).
// Counterplay: Military action on a held country = Garrison; Pamphlets = Calm; Martyr Narrative = no unrest gain; Ideology power speeds decay.
const UNREST = { min: 25, settled: 85, contested: 80, base: .2, notoDiv: 300, wo: .4, isolated: .25, swingMul: 1.5, decay: 1, lowDecay: 2,
  warnAt: 75, markAt: 50, busyAt: 40, crack: 15, milHit: 2, garrison: 60, garrisonWeeks: 30, garrisonNoto: 2, reverseHit: 15, calm: 30,
  rise: 25, floor: 10, after: 30, contagion: 15 };
function unrestOn(s) { return !!(s.cfg && s.cfg.v10 && s.cfg.unrest !== false); }
function unrestOf(s, id) { return (s.unrest && s.unrest[id]) || 0; }
function addUnrest(s, id, n) { if (!unrestOn(s) || id === baseOf(s) || s.inf[id] < UNREST.min) return; s.unrest = s.unrest || {}; s.unrest[id] = Math.max(0, Math.min(100, unrestOf(s, id) + n)); }
function isolated(s, id) {
  if (neighbours(id).includes(baseOf(s))) return false;
  return !neighbours(id).some(n => s.inf[n] >= CONTROL) && !tradeLinks(s, id).some(n => s.inf[n] >= CONTROL && !isBlocked(s, id, n));
}
// weekly change and its parts (the UI shows the parts as causes)
function unrestParts(s, id) {
  const v = s.inf[id], U = UNREST, P = [];
  if (!unrestOn(s) || id === baseOf(s)) return { net: 0, parts: P, frozen: false };
  if (v < U.min) return { net: -U.lowDecay, parts: [['low', -U.lowDecay]], frozen: false };
  const frozen = hasMod(s, id, 'garrison') || hasMod(s, id, 'noUnrest');
  const mul = v10t(s, 'unrestMul') * (Q(s, id).swing ? U.swingMul : 1);
  if (!frozen) {
    if (v < U.contested) P.push(['contested', U.base * mul]);
    if (s.notoriety > 0) P.push(['noto', s.notoriety / U.notoDiv * mul]);
    if (s.wo && (s.wo.members[id] || courtOn(s, id))) P.push(['wo', U.wo * mul]);
    if (isolated(s, id)) P.push(['isolated', U.isolated * mul]);
  }
  if (v >= U.settled) P.push(['settled', -U.decay * (1 + domainPower(s, 'ideo'))]);
  return { net: P.reduce((a, p) => a + p[1], 0), parts: P, frozen, mul };
}
function unrestEta(s, id) { const p = unrestParts(s, id); if (p.net <= 0 || p.frozen) return null; return Math.ceil((100 - unrestOf(s, id)) / p.net); }
function unrestTick(s) {
  if (!unrestOn(s)) return;
  s.unrest = s.unrest || {}; s.uprisings = s.uprisings || [];
  COUNTRIES.forEach(c => {
    const id = c.id, u0 = unrestOf(s, id);
    if (id === baseOf(s)) { delete s.unrest[id]; return; }
    const p = unrestParts(s, id);
    if (!u0 && p.net <= 0) return;
    const u = Math.max(0, Math.min(100, u0 + p.net));
    if (u <= 0) { delete s.unrest[id]; return; }
    s.unrest[id] = u;
    if (u0 < UNREST.warnAt && u >= UNREST.warnAt) {
      const eta = unrestEta(s, id);
      addNews(s, `Unrest in ${c.name}${eta ? `: uprising in about ${eta} weeks` : ''}. Garrison it (any Military action) or calm it (Pamphlets).`, 'wo');
      flag(s, 'important', id, 'Unrest'); s.news[0].unrest = id;
    }
    if (u >= 100) uprising(s, id);
  });
}
function uprising(s, id) {
  const c = byId(id), U = UNREST, before = s.inf[id];
  s.inf[id] = Math.max(Math.min(before, U.floor), before - U.rise);
  s.unrest[id] = U.after;
  const ns = neighbours(id).filter(n => n !== baseOf(s) && s.inf[n] >= U.min);
  ns.forEach(n => addUnrest(s, n, U.contagion));
  const lost = before >= CONTROL - LOST_MARGIN && s.inf[id] < CONTROL - LOST_MARGIN && s.held && s.held[id];
  s.uprisings.push({ id, week: s.week, from: Math.round(before), lost: !!lost });
  addLegit(s, -LEGIT.uprising, 'uprising');
  addNews(s, `Uprising in ${c.name}. Your local office is now a souvenir shop. Support −${Math.round(before - s.inf[id])}${ns.length ? `, ${ns.length === 1 ? 'a neighbour grows' : 'neighbours grow'} restless` : ''}.${lost ? ' It counts as a lost country.' : ''}`, 'wo');
  flag(s, 'critical', id, 'Uprising'); s.news[0].unrest = id;
}
// after one of your actions: Military on a held country = Garrison; elsewhere Military breeds resentment; Pamphlets calm
function unrestOnAct(s, a, target, before, rl) {
  const c = byId(target);
  if (a.dom === 'mil' && a.tier < 4 && before >= CONTROL && target !== baseOf(s)) {
    if (rl && rl.kind === 'reverse') { addUnrest(s, target, UNREST.reverseHit); addNews(s, `${rl.name}: soldiers in ${c.name} make things worse. Unrest +${UNREST.reverseHit}.`, 'wo'); return; }
    s.unrest = s.unrest || {}; if (s.unrest[target]) s.unrest[target] = Math.max(0, s.unrest[target] - UNREST.garrison);
    s.mods.push({ id: target, kind: 'garrison', until: s.week + UNREST.garrisonWeeks });
    addNoto(s, UNREST.garrisonNoto);
    addNews(s, `Garrison in ${c.name}: unrest −${UNREST.garrison}, no new unrest for ${UNREST.garrisonWeeks} weeks. The tanks are mostly decorative.`, 'you');
    s.calmed = (s.calmed || 0) + 1;
  } else if (a.dom === 'mil' && target !== baseOf(s)) addUnrest(s, target, UNREST.milHit);
  if (a.id === 'ideo1' && unrestOf(s, target) > 0) { s.unrest[target] = Math.max(0, s.unrest[target] - UNREST.calm); s.calmed = (s.calmed || 0) + 1; }
  if (a.id === 'ideo3') s.mods.push({ id: target, kind: 'noUnrest', until: s.week + 40 });
}
// ---- Step 8.2 (v10.13): base legitimacy + coup. Your base has its own meter instead of unrest. Victories and prosperity
// raise it; uprisings, lost countries, casualties abroad, failed actions, scandals and the World Order wear it down.
// Legitimacy 0 = coup (unless Loyal Guard, once). Base support below lostAt after the base was established = base lost.
// Counterplay = core 4 actions on your own base (allowed at any support while legitimacy < actBelow).
const LEGIT = { start: 60, settled: 85, home: .15, eco: .2, wo: .1, sig: .03, held: 3, shares: [.25, .5], shareGain: 5,
  uprising: 6, lost: 4, milAbroad: 1.5, regime: 5, fizzle: 3, reverse: 3, scandal: 5, badEvent: 4, reverseBase: 10,
  warnAt: 30, coachAt: 50, actBelow: 70, gain: { eco1: 8, eco3: 15, ideo1: 8, ideo2: 12, dip1: 6, dip2: 10 },
  martialWeeks: 20, martialAfter: 10, martialNoto: 3, shieldWeeks: 40, summitWeeks: 25,
  guardCost: 25, guardTo: 30, guardNoto: 10, estAt: 60, riskAt: 45, lostAt: 35, lostWeeks: 10 };
const LEGIT_WHY = { held: 'Victory', share: 'Milestone', uprising: 'Uprising', lost: 'Lost country', mil: 'Casualties abroad', regime: 'Regime change',
  fizzle: 'Failed action', reverse: 'Backfire', scandal: 'Scandal at home', event: 'Bad news at home', martialEnd: 'Martial law ends', act: 'Your action', guard: 'Loyal Guard', reloc: 'New base' };
function legitOn(s) { return !!(s.cfg && s.cfg.v10 && s.cfg.legit !== false); }
function legitOf(s) { return s.legit === undefined ? LEGIT.start : s.legit; }
function legitFrozen(s) { return !!s.reloc || hasMod(s, baseOf(s), 'martial') || hasMod(s, baseOf(s), 'legitShield'); }
function addLegit(s, n, why) {
  if (!legitOn(s) || !n || s.over) return;
  if (n < 0) { if (legitFrozen(s)) return; n *= v10t(s, 'legitMul'); }
  const v0 = legitOf(s); s.legit = Math.max(0, Math.min(100, v0 + n)); if (s.legit <= 0) s.coupDue = true;
  s.legitLog = [{ week: s.week, n: Math.round((s.legit - v0) * 10) / 10, why }].concat(s.legitLog || []).slice(0, 6);
  legitWarn(s, v0);
}
function baseEstablished(s) { return !!(s.held && s.held[baseOf(s)]); }
// weekly drift and its parts (shown as causes in the base dossier)
function legitParts(s) {
  const L = LEGIT, P = [], id = baseOf(s);
  if (!legitOn(s)) return { net: 0, parts: P, frozen: false };
  const frozen = legitFrozen(s);
  if (s.inf[id] >= L.settled) P.push(['home', L.home]);
  if (domainPower(s, 'eco') > 0) P.push(['eco', L.eco * domainPower(s, 'eco')]);
  if (!frozen && s.coalition && !hasMod(s, id, 'noWoDrift')) {
    P.push(['wo', -L.wo * v10t(s, 'legitMul')]);
    const n = signedCount(s); if (n) P.push(['sig', -L.sig * n * v10t(s, 'legitMul')]);
  }
  return { net: P.reduce((a, p) => a + p[1], 0), parts: P, frozen };
}
function legitEta(s) { const p = legitParts(s); if (p.net >= 0 || p.frozen) return null; return Math.ceil(legitOf(s) / -p.net); }
function legitWarn(s, v0) {
  const v = legitOf(s), c = byId(baseOf(s));
  if (v0 >= LEGIT.warnAt && v < LEGIT.warnAt) {
    const eta = legitEta(s);
    addNews(s, `Coup plot in ${c.name}: generals were seen measuring the palace curtains${eta && eta <= 100 ? `. Coup in about ${eta} weeks at this rate` : ''}. Raise legitimacy with an action on your base.`, 'wo');
    flag(s, 'critical', baseOf(s), 'Coup plot'); s.news[0].legit = 1;
  }
}
function legitTick(s) {
  if (!legitOn(s)) return;
  if (s.legit === undefined) s.legit = LEGIT.start;
  relocTick(s);
  const p = legitParts(s), v0 = s.legit;
  s.legit = Math.max(0, Math.min(100, s.legit + p.net)); if (s.legit <= 0) s.coupDue = true; legitWarn(s, v0);
  if (s.martialEnd && s.week >= s.martialEnd) { s.martialEnd = 0; addLegit(s, -LEGIT.martialAfter / v10t(s, 'legitMul'), 'martialEnd'); addNews(s, `${byId(baseOf(s)).name}: martial law ends. The curfew is lifted; the grudges are not. Legitimacy −${LEGIT.martialAfter}.`, 'wo'); }
  const v = s.inf[baseOf(s)];
  if (baseEstablished(s) && v < LEGIT.riskAt && !s.baseRisk && !s.reloc) { s.baseRisk = true; addNews(s, `Your base ${byId(baseOf(s)).name} is slipping: ${Math.round(v)}% support. Below ${LEGIT.lostAt}% the movement loses its home and the game.`, 'wo'); flag(s, 'critical', baseOf(s), 'Base at risk'); s.news[0].legit = 2; }
  if (v >= LEGIT.riskAt + 5) s.baseRisk = false;
  if (baseEstablished(s) && v < LEGIT.lostAt && !s.reloc) {
    if (!s.baseLowSince) { s.baseLowSince = s.week; addNews(s, `${byId(baseOf(s)).name} is falling: your base is under ${LEGIT.lostAt}% support. Get it back above ${LEGIT.lostAt}% within ${LEGIT.lostWeeks} weeks or lose the game.`, 'wo'); flag(s, 'critical', baseOf(s), 'Base falling'); s.news[0].legit = 2; }
  } else s.baseLowSince = 0;
}
function baseLostIn(s) { return s.baseLowSince ? Math.max(0, s.baseLowSince + LEGIT.lostWeeks - s.week) : null; }
// returns true (and sets s.over) when the base falls
function legitEnd(s) {
  if (s.reloc) { s.coupDue = false; if (s.legit <= 0) s.legit = 1; return false; }
  if (legitOf(s) <= 0 || s.coupDue) {
    s.coupDue = false;
    if (s.guard && !s.guardUsed) {
      s.guardUsed = true; s.legit = LEGIT.guardTo; addNoto(s, LEGIT.guardNoto);
      s.legitLog = [{ week: s.week, n: LEGIT.guardTo, why: 'guard' }].concat(s.legitLog || []).slice(0, 6);
      addNews(s, `${byId(baseOf(s)).name} sees a coup attempt! The Loyal Guard holds the palace and the plotters are reassigned to stamp counting. Legitimacy ${LEGIT.guardTo}, +${LEGIT.guardNoto} Notoriety.`, 'you');
      flag(s, 'critical', baseOf(s), 'Coup crushed'); s.news[0].legit = 1;
      return false;
    }
    s.over = 'coup'; addNews(s, `${byId(baseOf(s)).name} falls to a coup. The new junta promises stability, elections and a slightly larger flag.`, 'wo'); return true;
  }
  if (baseEstablished(s) && s.baseLowSince && s.week - s.baseLowSince >= LEGIT.lostWeeks) { s.over = 'baseLost'; addNews(s, `${byId(baseOf(s)).name} is lost: your movement has no home. The headquarters is now a co-working space.`, 'wo'); return true; }
  return false;
}
// is this action on your base a legitimacy action? (lifts "Already yours" and neighbour checks)
function baseActOk(s, a, target) {
  return legitOn(s) && target === baseOf(s) && legitOf(s) < LEGIT.actBelow && (LEGIT.gain[a.id] !== undefined || a.id === 'ideo3' || (a.dom === 'mil' && a.tier < 4));
}
function legitActLine(s, aid, target) {
  if (!legitOn(s) || target !== baseOf(s)) return null;
  const a = ACTIONS.find(x => x.id === aid), rl = ruleAt(s, target, a.dom);
  if (rl && rl.kind === 'reverse' && (LEGIT.gain[aid] !== undefined || a.dom === 'mil')) return `${rl.name}: legitimacy −${LEGIT.reverseBase}`;
  if (LEGIT.gain[aid] !== undefined) return `${({ eco: 'Prosperity', ideo: 'Rally', dip: 'Recognition' })[a.dom]}: legitimacy +${LEGIT.gain[aid]}${aid === 'dip2' ? `, no World Order drain ${LEGIT.summitWeeks} wk` : ''}`;
  if (aid === 'ideo3') return `Legitimacy cannot fall for ${LEGIT.shieldWeeks} wk`;
  if (a.dom === 'mil' && a.tier < 4) return `Martial law: legitimacy frozen ${LEGIT.martialWeeks} wk, then −${LEGIT.martialAfter}. +${LEGIT.martialNoto} Notoriety`;
  return null;
}
function legitOnAct(s, a, target, rl) {
  const c = byId(target);
  if (target !== baseOf(s)) {
    if (a.dom === 'mil') addLegit(s, -(a.tier === 4 ? LEGIT.regime : LEGIT.milAbroad), a.tier === 4 ? 'regime' : 'mil');
    return;
  }
  const g = LEGIT.gain[a.id], isMil = a.dom === 'mil' && a.tier < 4;
  if (rl && rl.kind === 'reverse' && (g !== undefined || isMil)) {
    s.inf[target] = Math.max(0, s.inf[target] - 5);
    addLegit(s, -LEGIT.reverseBase / v10t(s, 'legitMul'), 'reverse');
    addNews(s, `${a.name} at home backfires on you (${rl.name}). Legitimacy −${LEGIT.reverseBase}, support −5.`, 'wo'); flag(s, 'ping', target, rl.name); return;
  }
  if (g !== undefined) {
    const v0 = legitOf(s); s.legit = Math.min(100, v0 + g);
    s.legitLog = [{ week: s.week, n: Math.round(s.legit - v0), why: 'act' }].concat(s.legitLog || []).slice(0, 6);
    if (a.id === 'dip2') s.mods.push({ id: target, kind: 'noWoDrift', until: s.week + LEGIT.summitWeeks });
    addNews(s, `${({ eco: 'Prosperity', ideo: 'Rally', dip: 'Recognition' })[a.dom]} in ${c.name}: legitimacy +${Math.round(s.legit - v0)}.`, 'you');
    s.legitActs = (s.legitActs || 0) + 1;
  } else if (a.id === 'ideo3') {
    s.mods.push({ id: target, kind: 'legitShield', until: s.week + LEGIT.shieldWeeks });
    addNews(s, `Martyr Narrative at home: legitimacy cannot fall for ${LEGIT.shieldWeeks} weeks.`, 'you'); s.legitActs = (s.legitActs || 0) + 1;
  } else if (isMil) {
    s.mods.push({ id: target, kind: 'martial', until: s.week + LEGIT.martialWeeks }); s.martialEnd = s.week + LEGIT.martialWeeks;
    addNoto(s, LEGIT.martialNoto);
    addNews(s, `Martial law in ${c.name}: legitimacy frozen for ${LEGIT.martialWeeks} weeks, −${LEGIT.martialAfter} when it ends. The anthem now plays every hour.`, 'you');
    s.legitActs = (s.legitActs || 0) + 1;
  }
}
// Loyal Guard: a standalone upgrade outside the branches (no doctrine, no branch lock, does not raise other prices)
function guardCost(s) { return Math.round(LEGIT.guardCost * (1 + v10t(s, 'costGrow') * s.owned.length)); }
function canGuard(s) {
  if (!legitOn(s)) return { ok: false, why: 'Off' };
  if (s.guard) return { ok: false, why: s.guardUsed ? 'Used' : 'Owned' };
  if (s.over) return { ok: false, why: 'Game over' };
  if (s.clout < guardCost(s)) return { ok: false, why: 'Not enough Clout' };
  return { ok: true };
}
function buyGuard(s) {
  const chk = canGuard(s); if (!chk.ok) return chk;
  s.clout -= guardCost(s); s.guard = true;
  addNews(s, `${byId(baseOf(s)).name} swears in a Loyal Guard. Their oath fits on a business card.`, 'you');
  return { ok: true };
}
// ---- Overextension (v10.15, Step 8.4): holding many countries costs Clout income. Counterplay: Economy power, settled countries,
// Development aid (Economy tier 1 / 3 on a country you hold).
const OVER = { free: 4, rate: .06, cap: .5, settled: .5, settledAt: 85, aidWeeks: 25, aidUnrest: 20, ecoCut: .1, ecoCutMax: .5, warnAt: 6, critAt: 10 };
function overOn(s) { return !!(s.cfg && s.cfg.v10 && s.cfg.over !== false); }
function heldIds(s) { return COUNTRIES.filter(c => c.id !== baseOf(s) && s.inf[c.id] >= CONTROL).map(c => c.id); }
function aided(s, id) { return hasMod(s, id, 'aid'); }
// weight of one held country: aided 0, settled half, otherwise 1
function upkeepWeight(s, id) { return aided(s, id) ? 0 : s.inf[id] >= OVER.settledAt ? OVER.settled : 1; }
function upkeepOf(s) {
  if (!overOn(s)) return { frac: 0, n: 0, units: 0, free: OVER.free, cut: 0 };
  const ids = heldIds(s), units = ids.reduce((a, id) => a + upkeepWeight(s, id), 0);
  const cut = Math.min(OVER.ecoCutMax, OVER.ecoCut * domainPower(s, 'eco'));
  const frac = Math.min(OVER.cap, OVER.rate * Math.max(0, units - OVER.free) * (1 - cut) * v10t(s, 'upkeepMul'));
  return { frac, n: ids.length, units, free: OVER.free, cut };
}
// Development aid: Economy tier 1 or 3 on a held country (before the action) that is not already aided
function aidOk(s, aid, target) { return overOn(s) && (aid === 'eco1' || aid === 'eco3') && s.inf[target] >= CONTROL && target !== baseOf(s) && !aided(s, target); }
function overOnAct(s, a, target, before) {
  if (!(a.id === 'eco1' || a.id === 'eco3') || before < CONTROL || target === baseOf(s) || aided(s, target)) return;
  s.mods.push({ id: target, kind: 'aid', until: s.week + OVER.aidWeeks });
  const u = unrestOf(s, target); if (s.unrest && u > 0) s.unrest[target] = Math.max(0, u - OVER.aidUnrest);
  s.aids = (s.aids || 0) + 1;
  addNews(s, `Development aid in ${byId(target).name}: unrest −${OVER.aidUnrest}, upkeep waived for ${OVER.aidWeeks} weeks. The roads are almost finished.`, 'you');
}
function overTick(s) {
  if (!overOn(s)) return;
  const n = heldIds(s).length, lvl = s.overLvl || 0;
  if (n < OVER.warnAt - 1) s.overLvl = 0;
  else if (n >= OVER.critAt && lvl < 2) {
    s.overLvl = 2; const u = upkeepOf(s);
    addNews(s, `Overstretched: ${n} countries held and the paperwork is eating the movement. Upkeep takes ${Math.round(u.frac * 100)}% of your Clout income. Development aid waives it per country.`, 'wo');
    flag(s, 'critical', null, 'Overstretched'); s.news[0].over = 1;
  } else if (n >= OVER.warnAt && lvl < 1) {
    s.overLvl = 1; const u = upkeepOf(s);
    addNews(s, `Your administration is stretched: ${n} countries held, ${OVER.free} are free. Upkeep takes ${Math.round(u.frac * 100)}% of your Clout income. Economy power, settled countries and Development aid cut it.`, 'wo');
    flag(s, 'important', null, 'Stretched'); s.news[0].over = 1;
  }
}
// ---- Relocation (v10.14, Step 8.3): Contingency Plan (standalone upgrade, needs Summit Circuit) + move the base to a held country
const RELOC = { planCost: 20, cost: 15, noto: 5, newLegit: 50, abandonUnrest: 20, minSupport: 60, abortBelow: 55, maxUnrest: 50, needs: 'd2' };
function planCost(s) { return Math.round(RELOC.planCost * (1 + v10t(s, 'costGrow') * s.owned.length)); }
function relocCost(s) { return Math.round(RELOC.cost * (1 + v10t(s, 'costGrow') * s.owned.length)); }
function canPlan(s) {
  if (!legitOn(s)) return { ok: false, why: 'Off' };
  if (s.plan) return { ok: false, why: 'Owned' };
  if (s.over) return { ok: false, why: 'Game over' };
  if (!s.owned.includes(RELOC.needs)) return { ok: false, why: 'Needs ' + upg(RELOC.needs).name };
  if (s.clout < planCost(s)) return { ok: false, why: 'Not enough Clout' };
  return { ok: true };
}
function buyPlan(s) {
  const chk = canPlan(s); if (!chk.ok) return chk;
  s.clout -= planCost(s); s.plan = true;
  addNews(s, 'Your movement drafts a Contingency Plan. Page one: a second headquarters. Page two: a van.', 'you');
  return { ok: true };
}
// can the base move to country id right now?
function canReloc(s, id) {
  if (!legitOn(s) || !s.plan) return { ok: false, why: 'Needs Contingency Plan' };
  if (s.over) return { ok: false, why: 'Game over' };
  if (s.reloc) return { ok: false, why: 'Already relocating' };
  if (s.relocUsed) return { ok: false, why: 'Used' };
  if (id === baseOf(s)) return { ok: false, why: 'Already your base' };
  if (s.inf[id] < RELOC.minSupport) return { ok: false, why: `Needs ${RELOC.minSupport}% support` };
  if (unrestOn(s) && unrestOf(s, id) >= RELOC.maxUnrest) return { ok: false, why: 'Too much unrest' };
  if (s.clout < relocCost(s)) return { ok: false, why: 'Not enough Clout' };
  return { ok: true };
}
function relocEta(s) { return s.reloc ? Math.max(0, s.reloc.end - s.week) : null; }
function startReloc(s, id) {
  const chk = canReloc(s, id); if (!chk.ok) return chk;
  s.clout -= relocCost(s); addNoto(s, RELOC.noto);
  const w = v10t(s, 'relocWeeks'), from = baseOf(s);
  s.reloc = { to: id, from, start: s.week, end: s.week + w }; s.relocUsed = true; s.baseLowSince = 0; s.baseRisk = false;
  addNews(s, `${byId(from).name}: the headquarters leaves in a van marked "documents". Next stop: ${byId(id).name}, in ${w} weeks.`, 'you');
  flag(s, 'important', id, 'Relocating'); s.news[0].reloc = 1;
  return { ok: true };
}
function relocTick(s) {
  const R = s.reloc; if (!R) return;
  if (s.inf[R.to] < RELOC.abortBelow) {
    s.reloc = null; s.relocUsed = false;
    addNews(s, `The move to ${byId(R.to).name} collapses: support there fell below ${RELOC.abortBelow}%. The van turns around. The Clout is gone, the old base stays.`, 'wo');
    flag(s, 'critical', R.to, 'Move aborted'); s.news[0].reloc = 2; return;
  }
  if (s.week >= R.end) completeReloc(s);
}
function completeReloc(s) {
  const R = s.reloc, from = R.from, to = R.to;
  // base rules: continuous ones follow the base, one-shot ones do not re-fire
  const oldB = (rulesOn(s) && RULES[from] ? RULES[from].base : null) || [], newB = (rulesOn(s) && RULES[to] ? RULES[to].base : null) || [];
  s.mods = s.mods.filter(m => !(m.src && m.src.indexOf('Base: ') === 0) && !(m.id === from && (m.kind === 'martial' || m.kind === 'legitShield')));
  if (oldB[0] === 'quiet') s.base.vis += .2;
  if (newB[0] === 'quiet') s.base.vis -= .2;
  if (newB[0] === 'noCourt' || newB[0] === 'noCampaign') s.mods.push({ id: to, kind: newB[0], until: 1e9, src: 'Base: ' + byId(to).name });
  s.baseId = to; s.reloc = null; s.martialEnd = 0;
  s.legit = RELOC.newLegit; s.coupDue = false; s.baseLowSince = 0; s.baseRisk = false;
  s.legitLog = [{ week: s.week, n: RELOC.newLegit, why: 'reloc' }].concat(s.legitLog || []).slice(0, 6);
  s.relocFrom = s.relocFrom || {}; s.relocFrom[from] = true;
  s.relocLog = (s.relocLog || []).concat([{ week: s.week, from, to }]);
  if (s.unrest) { delete s.unrest[to]; if (unrestOn(s) && s.inf[from] >= UNREST.min) s.unrest[from] = RELOC.abandonUnrest; }
  recomputeStats(s);
  addNews(s, `${byId(to).name} is now the home of the movement. ${byId(from).name} is told the headquarters "will be back in a minute". Legitimacy ${RELOC.newLegit}.`, 'you');
  flag(s, 'critical', to, 'Base moved'); s.news[0].reloc = 3;
}
// Score + stars (v10.10). A country counts as lost once you held it (>= CONTROL) and it later fell below CONTROL - LOST_MARGIN.
// Notoriety in the score is the run average: peak notoriety hits 100 in most Normal/Brutal wins, so it would not tell runs apart.
// v10.21: re-measured after Step 9.2 (bot median win week, 192 runs/level; v10.19 197 / 249 / 249, v10.10 175 / 213 / 245)
const PAR = { casual: 202, normal: 247, brutal: 266 };
const SCORE_BASE = { casual: 1000, normal: 1500, brutal: 2500 };
const LOST_MARGIN = 5; // dips of a few points around 60% are noise, not a lost country
function trackRun(s) {
  s.held = s.held || {}; s.lost = s.lost || {};
  s.peakNoto = Math.max(s.peakNoto || 0, s.notoriety); s.notoSum = (s.notoSum || 0) + s.notoriety;
  COUNTRIES.forEach(c => {
    const v = s.inf[c.id];
    if (v >= CONTROL) { if (!s.held[c.id] && legitOn(s)) addLegit(s, LEGIT.held, 'held'); s.held[c.id] = true; }
    else if (s.held[c.id] && v < CONTROL - LOST_MARGIN && !s.lost[c.id] && !(s.relocFrom && s.relocFrom[c.id]) && !(s.reloc && s.reloc.from === c.id)) { s.lost[c.id] = true; addLegit(s, -LEGIT.lost, 'lost'); }
  });
  if (legitOn(s)) LEGIT.shares.forEach(x => { const k = 'legitShare' + x; if (!s.flags[k] && alignedShare(s) >= x) { s.flags[k] = true; addLegit(s, LEGIT.shareGain, 'share'); } });
}
function runResult(s) {
  const level = levelOf(s), win = s.over === 'win' || s.over === 'collapse' || s.over === 'perfect';
  const lostN = Object.keys(s.lost || {}).length, peakNoto = Math.round(s.peakNoto || s.notoriety || 0), par = PAR[level];
  // v10.20: average notoriety counts only while the World Order exists (until the Breakup): afterwards nobody is watching,
  // and the long mop-up would otherwise push every average up (Ghost goal, score).
  const nb = s.notoAtBreak, avgNoto = nb ? Math.round(nb.sum / Math.max(1, nb.weeks)) : Math.round((s.notoSum || 0) / Math.max(1, s.week));
  const r = { avgNotoUntil: nb ? 'breakup' : null, avgNoto, level, win, over: s.over, weeks: s.week, par, lostN, peakNoto, stars: 0, score: 0, parts: null, winType: win ? (s.winType || (s.over === 'collapse' ? 'collapse' : s.over === 'perfect' && s.cont ? s.cont.result && s.cont.result.winType : null) || null) : null };
  if (!win) return r;
  r.stars = 1 + (s.week <= par ? 1 : 0) + (s.week <= par && !lostN ? 1 : 0);
  const parts = { base: SCORE_BASE[level], speed: Math.max(0, par - s.week) * 10, noto: -avgNoto * 10, lost: -lostN * 50 };
  r.parts = parts; r.score = Math.max(0, parts.base + parts.speed + parts.noto + parts.lost);
  return r;
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
  const v = s.bubbles[i].value, bid = s.bubbles[i].id; s.bubbles.splice(i, 1); s.clout += v;
  if (s.cfg.v10 && own(s, 'e1') && bid) { if (s.inf[bid] <= 0) seed(s, bid, 1, null); else s.inf[bid] = Math.min(100, s.inf[bid] + 1); }
  return v;
}

function counterCampaign(s, target, amt, by) {   // by 'gc': a Grand Coalition crackdown (v10.21)
  const fc = Math.min(.9, s.stats.fcRed + perk(s).fc);
  const t = byId(target);
  s.inf[t.id] = Math.max(0, s.inf[t.id] - (amt || 10) * (1 - fc));
  s.mods.push({ id: t.id, kind: 'counter', src: by === 'gc' ? 'Grand Coalition crackdown' : 'World Order campaign', until: s.week + Math.round(25 * (1 - fc / 2)) });
  const lines = by === 'gc' ? [
    `Grand Coalition crackdown in ${t.name}. Leaflets feature a stern owl and several flags.`,
    `Fact-checkers descend on ${t.name}. Your slogans rated \u201cmostly vibes\u201d.`,
    `The Grand Coalition funds ${t.name} civics classes. Attendance: mandatory, enthusiasm: optional.`,
    `${t.name} bans your pamphlets, then prints more to explain the ban.`
  ] : [
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
// Resource Leverage: routes opened by Trade Deal cannot be closed
function immuneRoute(s, a, b) { return own(s, 'e2') && (s.deals || []).some(k => k === a + '|' + b || k === b + '|' + a); }
function isBlocked(s, a, b) { return s.blocked.some(x => (x.a === a && x.b === b) || (x.a === b && x.b === a)); }
function signCapacity(s) { return s.cfg && s.cfg.v10 && s.wo.ratifiedAt ? COUNTRIES.length : Math.floor(s.treaty / (100 / SIGNATURES_TO_LOSE)); }
function pendingOn(s, id) { return s.wo.queue.filter(q => q.target === id); }
function woActivate(s) {
  s.coalition = true;
  // HQ: the most diplomatic country far from your start
  const start = byId(baseOf(s));
  const cands = COUNTRIES.filter(c => c.id !== baseOf(s) && c.pop >= 1).map(c => ({ c, score: resOf(s, c.id).dip * 2 + Math.hypot(c.x - start.x, c.y - start.y) / 400 - s.inf[c.id] / 50 }));
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
  let r;
  if (s.cfg.v10) { if (courtOpen(s)) return; r = rng(s); } else {
  // 1. Signatures, as far as the draft allows
  if (signedCount(s) + pendingSigns < signCapacity(s)) {
    const c = members.filter(id => !W.signed[id] && !busy.has(id) && !hasMod(s, id, 'noSign') && s.inf[id] < signLimit(s, id)).sort((a, b) => s.inf[a] - s.inf[b])[0];
    if (c) { push('sign', c); addNews(s, `${SG} schedules a signing ceremony in ${byId(c).name} in ${lead} weeks. Commemorative pens ordered.`, 'wo'); flag(s, 'important', c, `Signing in ${lead} wk`); return; }
  }
  // 2. Recruit members: biggest country that still resists you
  r = rng(s);
  const recruits = COUNTRIES.filter(c => !W.members[c.id] && !busy.has(c.id) && !hasMod(s, c.id, 'noInvite') && !Q(s, c.id).noRecruit && s.inf[c.id] < TUNE.joinBelow - s.stats.shield - 10 + (Q(s, c.id).recruitDelta || 0) && c.pop >= 1).sort((a, b) => b.pop - a.pop);
  if (recruits.length && (r < 0.55 || memberCount(s) < SIGNATURES_TO_LOSE)) {
    const c = recruits[Math.floor(rng(s) * Math.min(3, recruits.length))];
    push('invite', c.id); addNews(s, `World Order invites ${c.name} to join. RSVP in ${lead} weeks.`, 'wo'); flag(s, 'important', c.id, `Invitation in ${lead} wk`); return;
  }
  }
  // 3. Sanctions: cut a trade route you are using
  const routes = s.trade.filter(([a, b]) => !isBlocked(s, a, b) && !(immuneRoute(s, a, b) && (s.bounced || []).includes(a + '|' + b)) && Math.max(s.inf[a], s.inf[b]) >= 20 && Math.min(s.inf[a], s.inf[b]) < 60);
  if (routes.length && r < 0.75 && s.week >= s.noSanctionUntil) {
    const [a, b] = routes[Math.floor(rng(s) * routes.length)];
    const target = s.inf[a] < s.inf[b] ? a : b;
    if (!busy.has(target)) { push('sanction', target, { route: [a, b] }); addNews(s, `World Order drafts sanctions on the ${byId(a).name}\u2013${byId(b).name} trade route. Effective in ${lead} weeks.`, 'wo'); flag(s, 'important', a, `Sanctions in ${lead} wk`); return; }
  }
  // 4. Awareness campaign on your biggest foothold
  W.lastCampaign = W.lastCampaign || {};
  const cc = COUNTRIES.filter(c => s.inf[c.id] >= 5 && s.inf[c.id] < 97 && !busy.has(c.id) && !hasMod(s, c.id, 'noCampaign') && !(W.lastCampaign[c.id] > s.week - 20) && !(Q(s, c.id).immuneAt && s.inf[c.id] >= Q(s, c.id).immuneAt));
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
    if (hasMod(s, q.target, 'noSign')) { addNews(s, `${c.name} cannot risk its trade with you and skips the signing ceremony.`, 'you'); flag(s, 'important', q.target, 'Refused to sign'); }
    else if (W.members[q.target] && v < signLimit(s, q.target)) { W.signed[q.target] = true; addNews(s, `${c.name} signs the Containment Treaty. ${signedCount(s)} of ${SIGNATURES_TO_LOSE} signatures.`, 'wo'); flag(s, 'critical', q.target, 'Signed treaty'); }
    else { addNews(s, `${c.name} refuses to sign. Your supporters there hid the pens.`, 'you'); flag(s, 'important', q.target, 'Refused to sign'); }
  }
  if (q.kind === 'invite') {
    if (v < TUNE.joinBelow - s.stats.shield + (Q(s, q.target).recruitDelta || 0)) { W.members[q.target] = true; addNews(s, `${c.name} joins the World Order. Membership includes a lanyard.`, 'wo'); flag(s, 'critical', q.target, 'Joined World Order'); }
    else { addNews(s, `${c.name} declines the World Order\u2019s invitation. Too many of its people agree with you.`, 'you'); flag(s, 'important', q.target, 'Declined invitation'); }
  }
  if ((q.kind === 'sanction' || q.kind === 'campaign') && s.stats.sabotage && rng(s) < s.stats.sabotage) { addNews(s, `The World Order\u2019s ${q.kind === 'sanction' ? 'sanctions' : 'campaign'} in ${c.name} collapses amid mysterious scheduling conflicts.`, 'you'); return; }
  if (q.kind === 'sanction' && immuneRoute(s, q.route[0], q.route[1])) { s.bounced = (s.bounced || []).concat([q.route[0] + '|' + q.route[1]]); addNews(s, `Sanctions on the ${byId(q.route[0]).name}\u2013${byId(q.route[1]).name} route bounce off your contracts. The lawyers send their regards.`, 'you'); flag(s, 'important', q.route[1], 'Sanctions bounced'); return; }
  if (q.kind === 'sanction') { s.blocked.push({ a: q.route[0], b: q.route[1], until: s.week + 30 }); addNews(s, `Sanctions close the ${byId(q.route[0]).name}\u2013${byId(q.route[1]).name} trade route for 30 weeks.`, 'wo'); flag(s, 'critical', q.route[0], 'Route closed'); }
  if (q.kind === 'campaign') { counterCampaign(s, q.target, q.amt); if (q.crack) addUnrest(s, q.target, UNREST.crack); W.lastCampaign = W.lastCampaign || {}; W.lastCampaign[q.target] = s.week; }
}
function possibleSignatures(s) { return signedCount(s) + COUNTRIES.filter(c => !s.wo.signed[c.id] && s.inf[c.id] < signLimit(s, c.id)).length; }
function woTick(s) {
  const W = s.wo;
  // Treaty hopeless: if the World Order can no longer reach 8 signatures for 26 weeks, it breaks up (Step 9.1: the Breakup, not a win).
  // v10: the treaty can only collapse while you hold at least collapseFloor of the world (no idle collapse wins)
  if (!(s.cfg.v10 && W.ratifiedAt) && possibleSignatures(s) < SIGNATURES_TO_LOSE && !(s.cfg.v10 && alignedShare(s) < v10t(s, 'collapseFloor'))) {
    W.hopeless = (W.hopeless || 0) + 1;
    if (W.hopeless === 1) addNews(s, `${SG} counts the remaining undecided nations and asks for a glass of water. Unless 8 signatures become possible within 26 weeks, the World Order breaks up.`, 'you'); flag(s, 'important', null, 'Treaty failing');
  } else if (W.hopeless) { W.hopeless = 0; addNews(s, 'The World Order finds enough undecided nations to keep the treaty alive.', 'wo'); flag(s, 'important'); }
  // withdrawals: signed countries that turned to you
  Object.keys(W.signed).forEach(id => { if (s.inf[id] >= TUNE.withdrawAt) { delete W.signed[id]; addNews(s, `${byId(id).name} withdraws its treaty signature. ${SG} is \u201cdisappointed, procedurally\u201d.`, 'you'); flag(s, 'important', id, 'Signature withdrawn'); } });
  if (s.cfg.v10) courtTick(s);
  if (s.cfg.v10) { woCrackdown(s); woPerkNews(s); }
  W.queue.filter(q => q.at <= s.week).forEach(q => woExecute(s, q));
  W.queue = W.queue.filter(q => q.at > s.week);
  if (fxOn(s, 'woPause')) W.nextPlan = Math.max(W.nextPlan, s.week + 1);
  else if (s.week >= W.nextPlan) { woPlan(s); W.nextPlan = s.week + Math.max(4, Math.round((s.cfg.v10 ? v10t(s, 'planBase') : TUNE.planBase) - s.notoriety / 15) - perk(s).plan + (s.cfg.v10 ? Math.round(3 * domainPower(s, 'dip')) : 0)) * (fxOn(s, 'woSlow') ? 2 : 1); }
}

// v10.9: extra announced campaigns on your two largest contested footholds (never your base). Ideology softens them by up to half.
function woCrackdown(s) {
  const W = s.wo; if (!s.coalition || !v10t(s, 'crackAmt') || s.week < (W.nextCrack || 0)) return;
  W.nextCrack = s.week + v10t(s, 'crackGap');
  const busy = new Set(W.queue.map(q => q.target));
  const cand = COUNTRIES.filter(c => c.id !== baseOf(s) && c.pop >= 1 && s.inf[c.id] >= 15 && s.inf[c.id] < 95 && !busy.has(c.id) && !hasMod(s, c.id, 'noCampaign') && !(Q(s, c.id).immuneAt && s.inf[c.id] >= Q(s, c.id).immuneAt))
    .sort((a, b) => b.pop * s.inf[b.id] - a.pop * s.inf[a.id]).slice(0, v10t(s, 'crackN'));
  cand.forEach(c => {
    const amt = Math.round(v10t(s, 'crackAmt') * (1 - .5 * domainPower(s, 'ideo')));
    W.queue.push({ key: ++W.seq, kind: 'campaign', target: c.id, at: s.week + TUNE.lead, planned: s.week, amt, crack: true });
    addNews(s, `World Order schedules a crackdown in ${c.name} in ${TUNE.lead} weeks: up to −${amt} support. Volunteers are being volunteered.`, 'wo'); flag(s, 'important', c.id, `Crackdown in ${TUNE.lead} wk`);
  });
}
// News when the World Order starts or stops using a country's perk against you.
function woPerkNews(s) {
  const now = woPerkIds(s), prev = s.wo.perks || [];
  now.filter(id => !prev.includes(id)).forEach(id => { addNews(s, `The World Order now uses ${byId(id).name}’s ${TRAITS[id].perkName} against you: ${TRAITS[id].woPerk}.`, 'wo'); flag(s, 'important', id, 'WO perk'); });
  prev.filter(id => !now.includes(id)).forEach(id => { addNews(s, `The World Order loses ${byId(id).name}’s ${TRAITS[id].perkName}. Its staff are reassigned to a working group.`, 'you'); flag(s, 'important', id, 'WO perk lost'); });
  s.wo.perks = now;
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
function upCost(s, u) { if (s.freeUp && s.freeUp === u.b && u.tier === 0) return 0; const base = s.cfg.v10 && u.special && CORE.includes(u.b) ? v10t(s, 't4Up') : u.cost; return Math.round(base * (1 + (s.cfg.v10 ? v10t(s, 'costGrow') : TUNE.costGrow) * s.owned.length) * (offDoctrine(s, u) ? v10t(s, 'offCost') : 1)); }
function canBuy(s, u) {
  if (s.owned.includes(u.id)) return { ok: false, why: 'Owned' };
  if (u.req && !s.owned.includes(u.req)) return { ok: false, why: 'Needs ' + UPGRADES.find(x => x.id === u.req).name };
  const opp = OPPOSITE[u.b], cf = closedFrom(s, u.b);
  if (cf !== null && u.tier >= cf) return { ok: false, why: cf === 2 ? 'Minor branch: tiers 1\u20132 only' : 'Closed: you chose ' + BRANCHES.find(b => b.id === opp).name };
  const lock = branchLock(s, u.b); if (lock) return { ok: false, why: lock };
  if (CAPSTONE_NEEDS[u.id] && !(s.cfg.v10 && s.cfg.capNeeds !== true) && !s.owned.includes(CAPSTONE_NEEDS[u.id])) return { ok: false, why: 'Needs ' + UPGRADES.find(x => x.id === CAPSTONE_NEEDS[u.id]).name };
  if (s.clout < upCost(s, u)) return { ok: false, why: 'Not enough Clout' };
  return { ok: true };
}
function branchLock(s, b) {
  const br = BRANCHES.find(x => x.id === b);
  if (br.unlock === 'reach' && COUNTRIES.filter(c => s.inf[c.id] >= 5).length < FAITH_UNLOCK_COUNTRIES && !s.owned.some(id => id[0] === 'f')) return `Opens when your movement is in ${FAITH_UNLOCK_COUNTRIES} countries`;
  if (br.unlock === 'wo' && !s.coalition && !s.broken && !s.owned.some(id => id[0] === 'c')) return 'Opens when the World Order convenes';
  return null;
}
function boosted(s, u) { return synergyOf(s, u.b).some(id => s.owned.includes(id)); }
function recomputeStats(s) {
  const st = JSON.parse(JSON.stringify(s.base));
  const add = fx => Object.entries(fx || {}).forEach(([k, v]) => {
    if (k === 'pen') Object.entries(v).forEach(([t, p]) => { st.pen[t] += p; });
    else st[k] += (['growth', 'border', 'trade', 'reach'].includes(k) ? v * TUNE.fxScale : v);
  });
  s.owned.forEach(id => { const u = UPGRADES.find(x => x.id === id), vf = s.cfg.v10 && v10t(s, 'upFx')[id]; add(vf ? Object.assign({}, u.fx, vf) : u.fx); if (boosted(s, u)) add(u.boost); });
  s.stats = st;
}
function committed(s, b) { return s.cfg && s.cfg.softLock ? hasT2(s, b) : doctrineOf(s, b) === b; }
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
  const off = offDoctrine(s, u), pairsBefore = PAIRS.filter(p => pairOn(s, p.id)).map(p => p.id);
  s.clout -= upCost(s, u); s.owned.push(id); if (s.freeUp === u.b) s.freeUp = null;
  if (off && s.cfg.softLock) addNoto(s, v10t(s, 'offNoto'));
  if (u.once && u.once.treaty) s.treaty = Math.max(0, s.treaty + u.once.treaty);
  if (u.once && u.once.seed) { const zeros = COUNTRIES.filter(c => s.inf[c.id] <= 0); for (let i = 0; i < u.once.seed && zeros.length; i++) seed(s, zeros.splice(Math.floor(rng(s) * zeros.length), 1)[0].id, 2, null); }
  if (u.special && s.cfg.v10 && TYPES.includes(u.b)) { const a = ACTIONS.find(x => x.dom === u.b && x.tier === 4); addNews(s, `${a.name} is ready: a tier-4 action. Find it under Actions.`, 'you'); }
  else if (u.special) { s.specials[u.special] = 'ready'; addNews(s, `${u.name} is ready. Use it when the moment is right: it works once.`, 'you'); }
  recomputeStats(s);
  const bn = b => BRANCHES.find(x => x.id === b).name;
  BRANCHES.filter(b => b.id !== u.b && synergyOf(s, b.id).includes(id) && s.owned.some(x => upg(x).b === b.id)).forEach(b => addNews(s, `${u.name} strengthens your ${b.name} upgrades.`, 'you'));
  if (u.tier === 1 && OPPOSITE[u.b] && !off) {
    const o = bn(OPPOSITE[u.b]);
    addNews(s, `You commit to ${bn(u.b)}. ` + (s.cfg.softLock ? `${o} upgrades past tier 1 now cost 50% more and draw attention.` : s.cfg.minor ? `${o} stays open as a minor branch, tiers 1\u20132 at 50% more.` : `${o} is off the table.`), 'you');
  }
  PAIRS.filter(p => pairOn(s, p.id) && !pairsBefore.includes(p.id)).forEach(p => addNews(s, `${bn(p.a)} and ${bn(p.b)} combine: ${p.name}. ${p.text}.`, 'you'));
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
  const m0 = s.mods.length;
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
  tagMods(s, m0, OPS.find(o => o.id === opId).name);
  return { ok: true };
}
function canSpecial(s, key, target) {
  if (s.over) return { ok: false, why: 'Game over' };
  if (s.specials[key] !== 'ready') return { ok: false, why: s.specials[key] === 'used' ? 'Already used' : 'Not owned' };
  const needsWo = ['bribe', 'breaker', 'believe', 'stoppage', 'hybrid'].includes(key);
  if (needsWo && !s.coalition) return { ok: false, why: s.broken ? 'The World Order has broken up' : 'The World Order has not convened yet' };
  if (SPECIALS[key].target) {
    if (!target) return { ok: false, why: 'Pick a country' };
    if (!s.wo.members[target]) return { ok: false, why: 'Only works on a World Order member' };
    if (target === s.wo.hq) return { ok: false, why: 'Not on the HQ' };
  }
  if (key === 'believe' && memberCount(s) < 2) return { ok: false, why: 'Needs another member to take over as HQ' };
  return { ok: true };
}
function useSpecial(s, key, target) {
  const m0 = s.mods.length;
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
    addNews(s, `${byId(old).name} loses confidence in the treaty and leaves. The World Order moves its HQ to ${byId(next).name}, losing 15% of the draft in the removal van.`, 'you');
  }
  if (key === 'collapse') { COUNTRIES.forEach(c => resMod(s, c.id, .6, 20)); s.notoriety = Math.min(100, s.notoriety + 8); addNews(s, 'Engineered Collapse: every government wakes to rumours, shortages and unmarked vans. Resistance falls everywhere for 20 weeks.', 'you'); }
  if (key === 'hybrid') { s.blocked = []; W.queue = []; s.noSanctionUntil = s.week + 40; if (s.owned.includes('f3')) s.treaty = Math.max(0, s.treaty - 10); addNews(s, 'Hybrid Threat: nobody at the World Order can agree who is threatening whom. Every plan is shelved and sanctions are lifted.', 'you'); s.notoriety = Math.min(100, s.notoriety + 6); }
  tagMods(s, m0, key === 'collapse' ? 'Engineered Collapse' : key);
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
// label every timed effect added since index `from` with its source (shown on the map and in the dossier)
function tagMods(s, from, src) { for (let i = from; i < s.mods.length; i++) if (!s.mods[i].src) s.mods[i].src = src; }
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
  { id: 'strike', good: false, name: 'General Strike', ok: s => yours(s, 10).length > 0,
    fire: s => { const id = pick(s, yours(s, 10)); s.inf[id] *= .75; return `Strikes in ${nm(id)}. Everyone blames everyone, including you. Support there falls by a quarter.`; } },
  { id: 'disaster', good: false, name: 'Natural Disaster', ok: s => true,
    fire: s => { const id = pick(s, COUNTRIES.filter(c => c.pop >= 1)).id; resMod(s, id, 1.2, 20, null, { inward: true }); return `Floods in ${nm(id)}. Politics postponed: it resists and stops passing ideas on for 20 weeks.`; } },
  { id: 'crisis', good: false, name: 'Diplomatic Crisis', ok: s => yours(s, 10).length > 0,
    fire: s => { const id = pick(s, yours(s, 10)); resMod(s, id, 1.2, 20); return `${nm(id)} recalls its ambassadors over a seating plan. Resistance there rises for 20 weeks.`; } },
  { id: 'alliance', good: false, name: 'Defensive Alliance', ok: s => s.coalition && COUNTRIES.some(c => allyFree(s, c.id) && (s.wary && s.wary[c.id] || 0) >= 25 && COUNTRIES.some(o => o.id !== c.id && allyFree(s, o.id) && isNear(s, c.id, o.id) && (s.wary[o.id] || 0) >= 15)),
    fire: s => { const f = COUNTRIES.filter(c => allyFree(s, c.id) && (s.wary[c.id] || 0) >= 25).sort((a, b) => s.wary[b.id] - s.wary[a.id])[0].id;
      COUNTRIES.forEach(o => { if (o.id !== f && allyFree(s, o.id) && isNear(s, f, o.id)) s.wary[o.id] = Math.max(s.wary[o.id] || 0, ALLY.thr[stanceOf(o.id)] * ALLY.partner); });
      const al = formAlliance(s, f); return al ? `${nm(f)} rallies its neighbours into a mutual-concern pact. Concern is mutual.` : `${nm(f)} calls its neighbours about you. Nobody picks up.`; } },
  { id: 'emergency', good: false, name: 'State of Emergency', ok: s => yours(s, 20).length > 0,
    fire: s => { const id = pick(s, yours(s, 20)); s.inf[id] *= .5; resMod(s, id, 1.25, 30, ['mil']); return `${nm(id)} declares a state of emergency. Your posters are declared “non-essential”. Support there halves.`; } },
  { id: 'posts', good: false, name: 'Old Posts Resurface', ok: s => s.coalition,
    fire: s => { addNoto(s, 8); return 'Your spokesperson’s 2009 posts resurface. Several involve fonts. Notoriety +8.'; } },
  { id: 'factcheck', good: false, name: 'Fact-Check Goes Viral', ok: s => yours(s, 10).length > 0,
    fire: s => { const id = biggest(s); s.inf[id] = Math.max(0, s.inf[id] - 8); return `A fact-check about you gets more views in ${nm(id)} than you do. Support there −8.`; } },
  { id: 'crash', good: false, name: 'Market Crash', ok: s => true,
    fire: s => { timed(s, 'incomeMul', 15, .5); timed(s, 'tradeMul', 15, .5); return 'Markets fall. Analysts blame “vibes”. Clout income and trade spread halve for 15 weeks.'; } },
  { id: 'customs', good: false, name: 'Customs Strike', ok: s => yours(s, 10).some(id => routesOf(s, id).length),
    fire: s => { const id = pick(s, yours(s, 10).filter(id => routesOf(s, id).length)); routesOf(s, id).filter(([a, b]) => !immuneRoute(s, a, b)).forEach(([a, b]) => s.blocked.push({ a, b, until: s.week + 20 })); return `Customs officers in ${nm(id)} strike over the colour of their stamps. Its trade routes close for 20 weeks.`; } },
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
    b: s => { const routes = s.trade.filter(([a, b]) => Math.max(s.inf[a], s.inf[b]) >= 10 && !isBlocked(s, a, b) && !immuneRoute(s, a, b)).slice(0, 2); routes.forEach(([a, b]) => s.blocked.push({ a, b, until: s.week + 30 })); return `The summit ends in sanctions: ${routes.map(([a, b]) => nm(a) + '–' + nm(b)).join(' and ') || 'nothing left to sanction'}.`; } },
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
    b: s => { const mine = s.trade.filter(([a, b]) => Math.max(s.inf[a], s.inf[b]) >= 10 && !isBlocked(s, a, b) && !immuneRoute(s, a, b)); mine.slice(0, Math.ceil(mine.length / 2)).forEach(([a, b]) => s.blocked.push({ a, b, until: s.week + 20 })); return 'You defy the ultimatum. Sanctions close half your trade routes for 20 weeks.'; } },
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
    if (pool.length) { const e = pick(s, pool); const m0 = s.mods.length; const text = e.fire(s); tagMods(s, m0, e.name); addNews(s, `${e.name}: ${text}`, good ? 'you' : 'wo'); s.news[0].ev = good ? 'good' : 'bad'; flag(s, 'important', newsCountry(text), e.name); E.log.unshift({ week: s.week, id: e.id, good }); if (!good && newsCountry(text) === baseOf(s)) addLegit(s, -LEGIT.badEvent, 'event'); }
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
  const m0 = s.mods.length; const text = d[choice](s, p); tagMods(s, m0, p.name);
  addNews(s, `${p.name}: ${text}`, 'you'); s.news[0].ev = 'dec'; flag(s, 'important', p.target || newsCountry(text), p.name);
  s.pending = null; s.ev.nextDecision = s.week + 25 + Math.floor(rng(s) * 11);
  return { ok: true, text };
}

// ---------- v10.6: alliances (the world fights back in blocs) ----------
// Countries grow wary of a loud movement next door. Wary neighbours band together into small fixed alliances;
// attacking a member (Economy or Military actions) triggers collective retaliation. Diplomacy and Ideology
// actions erode an alliance's cohesion; below SPLIT it dissolves. The World Order is the one bloc that grows:
// it can poach alliance members, more easily as their alliance's cohesion falls.
const STANCE = { aethelgard: 'aligned', guldor: 'aligned', borealis: 'aligned', nippon: 'aligned', celestia: 'aligned',
  juche: 'isolationist', helvetia: 'isolationist', isolde: 'isolationist', pinguinia: 'isolationist' };   // everyone else: neutral
const ALLY = { wk: 2.2, decay: .985, thr: { aligned: 45, neutral: 60 }, mult: { aligned: 1.3, neutral: 1, isolationist: .6 },
  partner: .6, maxMembers: 4, freeBelow: 40, leaveAt: 60, cohBase: .25, cohSize: .1, cohConvert: .5, split: 20,
  dipHit: 14, ideoHit: 9, retRes: 1.12, retWeeks: 12, retGap: 8, retNoto: 2, milWary: 100, milSpill: 30, nearDist: 320 };
const ALLIANCE_NAMES = ['League of Mild Alarm', 'Pact of Concerned Neighbours', 'Coalition of the Wary', 'Axis of Caution',
  'Mutual Unease Treaty', 'Committee for Continued Concern', 'Alliance of Raised Eyebrows', 'Union of Second Thoughts'];
const stanceOf = id => STANCE[id] || 'neutral';
function alInit(s) { if (!s.al) s.al = { list: [], next: 1 }; if (!s.wary) s.wary = {}; return s.al; }
function allianceOf(s, id) { return s.al ? s.al.list.find(a => a.members.includes(id)) : null; }
function distOf(a, b) { const A = byId(a), B = byId(b); return Math.hypot(A.x - B.x, A.y - B.y); }
function isNear(s, a, b) { return neighbours(a).includes(b) || tradeLinks(s, a).includes(b) || distOf(a, b) < ALLY.nearDist; }
// how close a country is to the movement: 1 next to a country you hold, less along trade, little across the map
function proximity(s, id) {
  let p = 0;
  COUNTRIES.forEach(h => {
    if (h.id === id || s.inf[h.id] < 25) return;
    const q = neighbours(id).includes(h.id) ? 1 : tradeLinks(s, id).includes(h.id) ? .7 : Math.max(0, 1 - distOf(id, h.id) / 450) * .6;
    p = Math.max(p, q);
  });
  return p;
}
const allyFree = (s, id) => !allianceOf(s, id) && !s.wo.members[id] && s.inf[id] < ALLY.freeBelow && byId(id).pop >= 1 && stanceOf(id) !== 'isolationist';
function formAlliance(s, founder, reason) {
  const A = alInit(s), thr = ALLY.thr[stanceOf(founder)];
  const partners = COUNTRIES.filter(c => c.id !== founder && allyFree(s, c.id) && isNear(s, founder, c.id) && (s.wary[c.id] || 0) >= ALLY.thr[stanceOf(c.id)] * ALLY.partner)
    .sort((a, b) => (s.wary[b.id] || 0) - (s.wary[a.id] || 0)).slice(0, ALLY.maxMembers - 1).map(c => c.id);
  if (!partners.length) return null;
  const members = [founder, ...partners], name = ALLIANCE_NAMES[(A.next - 1) % ALLIANCE_NAMES.length];
  const leader = members.slice().sort((a, b) => byId(b).pop - byId(a).pop)[0];
  const al = { id: 'a' + A.next++, name, leaderId: leader, members, cohesion: 100, formed: s.week, retUntil: 0 };
  A.list.push(al);
  members.forEach(m => { s.wary[m] = Math.max(s.wary[m] || 0, thr); });
  addNews(s, `New alliance: ${name} (${members.map(nm).join(', ')}). Their stated goal: keeping an eye on you.`, 'wo');
  flag(s, 'critical', leader, 'Alliance formed');
  return al;
}
function leaveAlliance(s, al, id, text) {
  al.members = al.members.filter(m => m !== id);
  if (text) { addNews(s, text, 'you'); flag(s, 'important', id, 'Left alliance'); }
  if (al.members.length < 2) dissolveAlliance(s, al, null);
}
function dissolveAlliance(s, al, text) {
  s.al.list = s.al.list.filter(a => a !== al);
  addNews(s, text || `The ${al.name} quietly dissolves. Nobody can find the minutes.`, 'you');
  flag(s, 'important', al.leaderId, 'Alliance dissolved');
}
function allianceTick(s) {
  const A = alInit(s);
  // wariness: notoriety × proximity × stance, decaying
  COUNTRIES.forEach(c => {
    const w = s.wary[c.id] || 0;
    const gain = s.inf[c.id] >= ALLY.freeBelow || s.wo.members[c.id] ? 0 : (s.notoriety / 100) * proximity(s, c.id) * ALLY.mult[stanceOf(c.id)] * ALLY.wk;
    s.wary[c.id] = Math.min(100, w * ALLY.decay + gain);
  });
  // members leave: won over by you, or recruited by the World Order
  A.list.slice().forEach(al => {
    al.members.slice().forEach(m => {
      if (!A.list.includes(al)) return;
      if (s.wo.members[m]) leaveAlliance(s, al, m, `${nm(m)} trades the ${al.name} for the World Order.`);
      else if (s.inf[m] >= ALLY.leaveAt) leaveAlliance(s, al, m, `${nm(m)} now mostly agrees with you and walks out of the ${al.name}.`);
    });
  });
  // cohesion
  A.list.slice().forEach(al => {
    const converting = al.members.filter(m => s.inf[m] >= 40).length;
    al.cohesion -= ALLY.cohBase + ALLY.cohSize * al.members.length + ALLY.cohConvert * converting;
    if (al.cohesion < ALLY.split) dissolveAlliance(s, al, `The ${al.name} falls apart over who pays for the coffee.`);
  });
  // formation: the warier the country, the sooner it looks for friends
  const founder = COUNTRIES.filter(c => allyFree(s, c.id) && (s.wary[c.id] || 0) >= ALLY.thr[stanceOf(c.id)])
    .sort((a, b) => s.wary[b.id] - s.wary[a.id])[0];
  if (founder) formAlliance(s, founder.id);
}
// called from doAct after the action resolved
function allianceOnAct(s, a, target) {
  if (!target) return;
  const A = alInit(s);
  if (a.dom === 'mil') {   // a show of force alarms the target and its neighbours
    s.wary[target] = Math.max(s.wary[target] || 0, ALLY.milWary);
    neighbours(target).forEach(n => { s.wary[n] = Math.min(100, (s.wary[n] || 0) + ALLY.milSpill); });
  }
  const al = allianceOf(s, target); if (!al) return;
  if (a.dom === 'dip' || a.dom === 'ideo') {
    al.cohesion -= a.dom === 'dip' ? ALLY.dipHit : ALLY.ideoHit;
    addNews(s, a.dom === 'dip' ? `Your envoys in ${nm(target)} sow doubt about the ${al.name}. Cohesion ${Math.max(0, Math.round(al.cohesion))}%.` : `${nm(target)} argues about the ${al.name} on prime-time television. Cohesion ${Math.max(0, Math.round(al.cohesion))}%.`, 'you');
    flag(s, 'ping', target, 'Cohesion down');
    if (al.cohesion < ALLY.split) dissolveAlliance(s, al, `The ${al.name} falls apart. Its members blame each other, then you, then each other again.`);
  } else if (s.week >= al.retUntil) {   // Economy or Military against a member: everyone responds
    al.retUntil = s.week + ALLY.retGap;
    al.members.forEach(m => resMod(s, m, ALLY.retRes, ALLY.retWeeks, null, { src: al.name }));
    addNoto(s, ALLY.retNoto);
    addNews(s, `The ${al.name} closes ranks behind ${nm(target)}. Resistance rises in every member country for ${ALLY.retWeeks} weeks.`, 'wo');
    flag(s, 'important', target, 'Retaliation');
  }
}
// World Order courtship of an alliance member: loyal while the bloc is solid, eager when it is sinking (Pavel, option C)
function allyCourtMul(s, id) { const al = allianceOf(s, id); return al ? .5 + 1.5 * (1 - Math.max(0, al.cohesion) / 100) : 1; }

// ---------- v10.7: Economy pilot (upgrades add rules, not just numbers) ----------
// Monopolization / Dependency: World Order members that trade with a country you hold 50%+ cannot sign.
function dependent(s, id) { return own(s, 'e3') && s.wo.members[id] && !s.wo.signed[id] && tradeLinks(s, id).some(h => s.inf[h] >= 50 && !isBlocked(s, id, h)); }
function dependencyTick(s) {
  s.depNews = s.depNews || {};
  COUNTRIES.forEach(c => {
    if (!dependent(s, c.id)) return;
    s.mods.push({ id: c.id, kind: 'noSign', until: s.week + 1, src: 'Monopolization' });
    if (!s.depNews[c.id] || s.week - s.depNews[c.id] > 26) { s.depNews[c.id] = s.week; addNews(s, `${c.name} now depends on trade with you. Its diplomats suddenly cannot find a pen.`, 'you'); flag(s, 'important', c.id, 'Dependent'); }
  });
}
// headline variants for Economy actions: picked from week and target, so no extra random draws
const ACT_NEWS = {
  eco1: ['Foreign Investment: a consortium nobody has heard of buys a stadium in {c}.', 'Foreign Investment: {c} gets a shiny new bridge. The plaque mentions you.', 'Foreign Investment: your venture fund opens an office in {c}. The coffee is free; the ideas are not.'],
  eco2: ['Trade Deal: {src} and {c} sign a deal nobody has read.', 'Trade Deal: container ships from {src} reach {c}, packed with goods and pamphlets.', 'Trade Deal: {c} discovers it cannot live without exports from {src}.'],
  eco3: ['Buyout: you quietly buy the largest newspaper in {c}. Editorials improve overnight.', 'Buyout: the national airline of {c} is now yours. The in-flight magazine is very on-message.', 'Buyout: half the banks in {c} change hands over a long weekend.']
};
function actHeadline(s, aid, target, src) {
  const v = ACT_NEWS[aid]; if (!v || !target) return null;
  const k = (s.week + target.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0)) % v.length;
  return v[k].replace('{c}', nm(target)).replace('{src}', src ? nm(src) : '');
}


// ---- v10.17: leave early / keep playing after a win
// End the game now from the menu. It is not a win or a loss: the results screen shows where the world stood.
function endEarly(s) {
  if (!s || s.over) return { ok: false, why: 'Game over' };
  // After "Continue playing" the win is already earned: ending early finishes it as that win, with its frozen score.
  if (s.cont) { s.over = s.cont.over; addNews(s, 'You call it here. The world is yours and nobody argues.', 'you'); return { ok: true }; }
  s.over = 'retired'; addNews(s, 'You step down. The movement carries on without you, mostly out of habit.', 'you');
  return { ok: true };
}
// After a win (every country held or WIN_SHARE aligned; legacy saves: the treaty collapsing) the player may keep going for the whole world. The win and its
// score are frozen at that moment; from then on only a real loss (Enforcement, a coup, losing the base) or a
// near-perfect world (PERFECT_SHARE) ends the game.
function canContinue(s) { return !!s && !s.cont && (s.over === 'win' || s.over === 'collapse'); }
function continuePlaying(s) {
  if (!canContinue(s)) return { ok: false, why: 'Nothing to continue' };
  s.cont = { week: s.week, over: s.over, share: alignedShare(s), result: runResult(s) };
  s.over = null; s.endShown = false;
  addNews(s, 'The world is yours, and you are not done. From here only a real loss or a perfect world ends the game.', 'you');
  return { ok: true };
}
// ---- v10.19 Step 9.1: Breakup, capitulation, Terms, new win rule
function egk(s, k) { const o = s.cfg && s.cfg.eg; if (o && o[k] !== undefined) return o[k]; const L = LEVEL_EG[levelOf(s)]; return L && L[k] !== undefined ? L[k] : ENDGAME[k]; }
function winShareOf(s) { return (s.cfg && s.cfg.winShare) || WIN_SHARE; }
function heldCount(s) { return COUNTRIES.filter(c => s.inf[c.id] >= CONTROL).length; }
function allHeld(s) { return COUNTRIES.every(c => s.inf[c.id] >= CONTROL); }
// capitulation runs after the Breakup, or earlier once you align capAt of the world
function capActive(s) { return !!s.broken || alignedShare(s) >= egk(s, 'capAt'); }
function waryOf(s, id) { return (s.wary && s.wary[id]) || 0; }
// null when the country can capitulate (Summit = Terms now; by itself after capWeeks), otherwise the reason it cannot
function capWhy(s, id) {
  if (!capActive(s)) return 'off';
  if (id === baseOf(s)) return 'base';
  if (s.inf[id] >= CONTROL) return 'held';
  if (s.wo && s.wo.members[id]) return 'wo';
  if (gcMember(s, id)) return 'gc';
  if (typeof allianceOf === 'function' && allianceOf(s, id)) return 'allied';
  if (s.inf[id] < egk(s, 'capMin')) return 'support';
  if (waryOf(s, id) >= egk(s, 'capWary')) return 'wary';
  return null;
}
function capEta(s, id) { return capWhy(s, id) ? null : Math.max(1, egk(s, 'capWeeks') - ((s.capWk && s.capWk[id]) || 0)); }
function capCount(s) { return s.capit ? (s.capit.auto || 0) + (s.capit.terms || 0) + (s.capit.ultimatum || 0) : 0; }
// v10.20 Ultimatum: Snap Exercise (Military tier 2) on a country that could capitulate makes it capitulate at once, the Military
// builds' answer to Terms (their doctrine locks Diplomacy). It works through fear, so wariness does not stop it. Loud: neighbours get more wary (as any Military action) and +ultUnrest unrest.
// Not where the country's Military wall reverses the action.
function ultimatumOk(s, id) { const w = capWhy(s, id); return id !== baseOf(s) && (!w || w === 'wary') && ruleKind(s, id, 'mil') !== 'reverse'; }
function capitulate(s, id, how) {
  const c = byId(id), to = egk(s, 'capTo');
  s.inf[id] = Math.max(s.inf[id], to);
  if (s.unrest) delete s.unrest[id];
  if (s.wary) s.wary[id] = 0;
  if (s.capWk) delete s.capWk[id];
  if (s.wo) { s.wo.court = (s.wo.court || []).filter(q => q.target !== id); s.wo.queue = (s.wo.queue || []).filter(q => q.target !== id); }
  s.capit = s.capit || { auto: 0, terms: 0, ultimatum: 0 }; s.capit[how] = (s.capit[how] || 0) + 1;
  s.capLog = (s.capLog || []).concat([{ id, week: s.week, how }]);
  addNews(s, how === 'terms'
    ? `${c.name} accepts your terms at the summit and capitulates. Support ${to}%, no unrest. The flags are swapped before lunch.`
    : how === 'ultimatum' ? `${c.name} reads your ultimatum, counts the tanks and capitulates. Support ${to}%. Its neighbours grow restless and wary.`
    : `${c.name} capitulates. It stopped resisting weeks ago; now it is official. Support ${to}%, no unrest.`, 'you');
  flag(s, 'important', id, 'Capitulated'); s.news[0].endgame = 1;
}
function capTick(s) {
  if (!capActive(s)) { if (s.capWk) s.capWk = {}; return; }
  if (!s.broken && !s.capOn) { s.capOn = s.week; addNews(s, `Three quarters of the world agrees with you. Holdouts start to capitulate: support ${egk(s, 'capMin')}%+, not allied, not wary.`, 'you'); flag(s, 'important', null, 'Capitulation'); s.news[0].endgame = 1; }
  s.capWk = s.capWk || {};
  COUNTRIES.forEach(c => {
    if (capWhy(s, c.id)) { delete s.capWk[c.id]; return; }
    s.capWk[c.id] = (s.capWk[c.id] || 0) + 1;
    if (s.capWk[c.id] >= egk(s, 'capWeeks')) capitulate(s, c.id, 'auto');
  });
}
// The treaty went hopeless: the World Order dissolves. Treaty and Enforcement end, members are free (normal support rules,
// wariness freedWary), notoriety drops. The game goes on; the win is still the whole world.
function breakup(s) {
  const W = s.wo, freed = Object.keys(W.members);
  s.notoAtBreak = { sum: s.notoSum || 0, weeks: Math.max(1, s.week) };
  s.broken = s.week; W.brokeAt = s.week; W.brokeShare = alignedShare(s); W.formerHq = W.hq; W.formerMembers = freed;
  if (typeof alInit === 'function') alInit(s);
  s.wary = s.wary || {}; freed.forEach(id => { s.wary[id] = egk(s, 'freedWary'); });
  W.members = {}; W.signed = {}; W.queue = []; W.court = []; W.hq = null; W.hopeless = 0; W.perks = []; W.suspended = false;
  s.treaty = 0; s.coalition = false;
  s.mods = s.mods.filter(m => m.kind !== 'noSign');
  s.notoriety = Math.max(0, s.notoriety - egk(s, 'breakNoto'));
  addNews(s, `The World Order breaks up. ${SG} hands in his lanyard; the treaty goes to a museum of good intentions. Members freed: ${freed.length}. Notoriety −${egk(s, 'breakNoto')}. Now win the rest: hold every country at once, or align ${Math.round(winShareOf(s) * 100)}% of the world.`, 'you');
  flag(s, 'critical', null, 'Breakup'); s.news[0].endgame = 1;
  gcForm(s);
}
// ---- v10.21 Step 9.2: the Grand Coalition
function gcOn(s) { return !!(s.gc && !s.gc.broke && !s.gc.gone); }
function gcMember(s, id) { return gcOn(s) && s.gc.members.includes(id); }
function gcForm(s) {
  const hold = COUNTRIES.filter(c => c.id !== baseOf(s) && s.inf[c.id] < CONTROL).map(c => c.id);
  if (hold.length < egk(s, 'gcMin')) return;
  const leader = hold.slice().sort((a, b) => byId(b).pop - byId(a).pop)[0];
  s.gc = { members: hold, leader, cohesion: 100, formed: s.week, unityWk: 0, nextCrack: s.week + egk(s, 'gcGap'), queue: [], hits: 0, size: hold.length };
  addNews(s, `The holdouts close ranks: ${hold.map(nm).join(', ')} form the Grand Coalition, led by ${nm(leader)}. If they stay united (cohesion ${egk(s, 'gcUnityAt')}+) for ${egk(s, 'gcUnityWeeks')} weeks, World Unity ends your movement.`, 'wo');
  flag(s, 'critical', leader, 'Grand Coalition'); s.news[0].gc = 1;
}
function gcLeave(s, id, text) {
  const G = s.gc; G.members = G.members.filter(m => m !== id);
  G.queue = G.queue.filter(q => q.target !== id);
  if (text) { addNews(s, text, 'you'); flag(s, 'important', id, 'Left coalition'); s.news[0].gc = 1; }
  if (G.leader === id && G.members.length) G.leader = G.members.slice().sort((a, b) => byId(b).pop - byId(a).pop)[0];
  if (G.members.length < 2 && !G.broke) gcBreak(s, true);
}
function gcCohesion(s, n, why) {
  const G = s.gc; if (!gcOn(s) || !n) return;
  G.cohesion = Math.max(0, Math.min(100, G.cohesion + n));
  if (n < 0 && why) G.hits = (G.hits || 0) + 1;
  if (G.cohesion < egk(s, 'gcBreak')) gcBreak(s);
}
function gcBreak(s, empty) {
  const G = s.gc; if (G.broke) return;
  G.broke = s.week; G.queue = [];
  const freed = G.members.slice();
  s.wary = s.wary || {}; freed.forEach(id => { s.wary[id] = 0; });
  addNews(s, empty ? 'The Grand Coalition runs out of members and quietly folds.' : `The Grand Coalition breaks apart. ${freed.length ? freed.map(nm).join(', ') + ' stop resisting together: they can capitulate now.' : ''}`, 'you');
  flag(s, 'critical', null, 'Coalition broken'); s.news[0].gc = 1; s.news[0].endgame = 1;
}
// countries you hold (CONTROL%+) that border or trade with a member: Military there intimidates the coalition (option A)
function gcBorder(s, id) { if (!gcOn(s) || s.inf[id] < CONTROL || gcMember(s, id)) return false; return neighboursOrTrade(s, id).some(n => gcMember(s, n)); }
function gcActEffect(s, a, target, before) {
  if (!gcOn(s) || !target) return 0;
  if (gcMember(s, target)) {
    if (a.id === 'mil4') return -egk(s, 'gcRegime');
    if (a.dom === 'dip') return -egk(s, 'gcDip');
    if (a.dom === 'ideo') return -egk(s, 'gcIdeo');
    if (a.dom === 'mil') return egk(s, 'gcMil');
    return 0;
  }
  if (a.dom === 'mil' && a.tier < 4 && (before === undefined ? s.inf[target] : before) >= CONTROL && gcBorder(s, target)) return -(own(s, 'm3') ? egk(s, 'gcBorderM3') : egk(s, 'gcBorder'));
  return 0;
}
function gcOnAct(s, a, target, before) {
  if (!target || !gcOn(s)) return;
  const n = gcActEffect(s, a, target, before), c = byId(target);
  if (gcMember(s, target) && a.id === 'mil4') {
    gcLeave(s, target, `Regime Change in ${c.name}: the new government quits the Grand Coalition. Cohesion −${egk(s, 'gcRegime')}.`);
    if (s.wary) s.wary[target] = 0;
    gcCohesion(s, n, 'regime'); return 'split';
  }
  if (!n) return;
  gcCohesion(s, n, n < 0 ? a.dom : null);
  if (!gcOn(s)) return;
  const coh = Math.round(s.gc.cohesion);
  addNews(s, n > 0 ? `${a.name} in ${c.name} rallies the Grand Coalition. Cohesion ${coh} (+${n}).`
    : gcMember(s, target) ? `${a.name} in ${c.name} sows doubt inside the Grand Coalition. Cohesion ${coh} (${n}).`
    : `Tanks on parade in ${c.name}, right on the Grand Coalition's doorstep. Cohesion ${coh} (${n}).`, n > 0 ? 'wo' : 'you');
  flag(s, 'ping', target, n > 0 ? 'Coalition rallies' : 'Cohesion down');
}
function gcTick(s) {
  const G = s.gc; if (!gcOn(s)) return;
  // members you win over (CONTROL%+) leave; held countries that fall below gcRejoin join
  G.members.slice().forEach(id => { if (s.inf[id] >= CONTROL) gcLeave(s, id, `${nm(id)} now mostly agrees with you and leaves the Grand Coalition.`); });
  if (!gcOn(s)) return;
  COUNTRIES.forEach(c => {
    if (c.id === baseOf(s) || G.members.includes(c.id) || !(s.held && s.held[c.id]) || s.inf[c.id] >= egk(s, 'gcRejoin')) return;
    G.members.push(c.id); addNews(s, `${c.name} slips away from you and joins the Grand Coalition.`, 'wo'); flag(s, 'important', c.id, 'Joined coalition'); s.news[0].gc = 1;
  });
  // cohesion drift
  const winning = G.members.filter(id => s.inf[id] >= egk(s, 'gcWinAt')).length;
  G.cohesion = Math.max(0, Math.min(100, G.cohesion - egk(s, 'gcDecay') - egk(s, 'gcWin') * winning));
  if (G.cohesion < egk(s, 'gcBreak')) { gcBreak(s); return; }
  // World Unity countdown
  const need = egk(s, 'gcUnityWeeks');
  if (G.cohesion >= egk(s, 'gcUnityAt')) {
    G.unityWk = (G.unityWk || 0) + 1;
    if (G.unityWk === Math.round(need / 2) || G.unityWk === need - 10) { addNews(s, `World Unity in ${need - G.unityWk} weeks: the Grand Coalition holds at cohesion ${Math.round(G.cohesion)}. Push it below ${egk(s, 'gcUnityAt')} to stop the clock.`, 'wo'); flag(s, 'critical', G.leader, 'World Unity'); s.news[0].gc = 1; }
  } else if (G.unityWk) { G.unityWk = 0; addNews(s, `The Grand Coalition squabbles: cohesion ${Math.round(G.cohesion)}. The World Unity clock stops.`, 'you'); flag(s, 'important', G.leader, 'Unity clock stopped'); s.news[0].gc = 1; }
  // crackdowns: announced gcLead weeks ahead; Martyr Narrative / campaign immunity stop them
  G.queue.filter(q => q.at <= s.week).forEach(q => {
    if (hasMod(s, q.target, 'noCampaign')) { addNews(s, `The Grand Coalition's crackdown in ${nm(q.target)} finds only martyrs and cameras. Called off.`, 'you'); return; }
    counterCampaign(s, q.target, q.amt, 'gc'); addUnrest(s, q.target, UNREST.crack);
  });
  G.queue = G.queue.filter(q => q.at > s.week);
  if (s.week >= G.nextCrack) {
    G.nextCrack = s.week + egk(s, 'gcGap');
    const busy = new Set(G.queue.map(q => q.target));
    const amt = Math.round(egk(s, 'gcAmt') * (1 - .5 * domainPower(s, 'ideo')));
    COUNTRIES.filter(c => c.id !== baseOf(s) && c.pop >= 1 && s.inf[c.id] >= 15 && s.inf[c.id] < 95 && !busy.has(c.id) && !G.members.includes(c.id) && !hasMod(s, c.id, 'noCampaign') && !(Q(s, c.id).immuneAt && s.inf[c.id] >= Q(s, c.id).immuneAt))
      .sort((a, b) => b.pop * s.inf[b.id] - a.pop * s.inf[a.id]).slice(0, 2).forEach(c => {
        G.queue.push({ target: c.id, at: s.week + egk(s, 'gcLead'), amt });
        addNews(s, `The Grand Coalition schedules a crackdown in ${c.name} in ${egk(s, 'gcLead')} weeks: up to −${amt} support.`, 'wo'); flag(s, 'important', c.id, `Crackdown in ${egk(s, 'gcLead')} wk`);
      });
  }
}
// SIM-END
if (typeof module !== 'undefined') module.exports = { LEVEL_EG, gcOn, gcMember, gcForm, gcTick, gcBreak, gcCohesion, gcBorder, gcActEffect, ultimatumOk, ENDGAME, WIN_SHARE, egk, winShareOf, heldCount, allHeld, capActive, capWhy, capEta, capCount, capitulate, capTick, breakup, waryOf, PERFECT_SHARE, endEarly, canContinue, continuePlaying, LEGIT, LEGIT_WHY, legitOn, legitOf, legitParts, legitEta, legitFrozen, addLegit, baseEstablished, baseActOk, legitActLine, baseLostIn, guardCost, canGuard, buyGuard, OVER, overOn, heldIds, aided, upkeepOf, aidOk, overTick, baseOf, RELOC, planCost, relocCost, canPlan, buyPlan, canReloc, relocEta, startReloc, UNREST, unrestOn, unrestOf, unrestParts, unrestEta, addUnrest, PAR, SCORE_BASE, runResult, trackRun, LEVELS, LEVEL_IDS, levelOf, woPerkIds, RULES, ruleAt, baseRule, rulesOn, V10, HOOKS, hooksFor, PAIRS, pairOn, synergyOf, doctrineOf, closedFrom, offDoctrine, hasT2, CORE, ratified, enforcementTick, sigGrowthMul, populated, courtOn, actCost, ACTIONS, canAct, doAct, domainPower, actEff, resBreakdown, TRAITS, CONDITIONS, perk, Q, resOf, EVENTS, DECISIONS, resolveDecision, canChoose, fxOn, useSpecial, canSpecial, branchLock, boosted, SYNERGY, SPECIALS, CAPSTONE_NEEDS, possibleSignatures, committed, doctrines, rebrand, canRebrand, OPPOSITE, BRANCHES, signedCount, memberCount, pendingOn, SIGNATURES_TO_LOSE, upCost, TUNE, COUNTRIES, BORDERS, UPGRADES, OPS, createState, step, buyUpgrade, doOp, canOp, canBuy, collectBubble, alignedShare, effRes, neighbours };
