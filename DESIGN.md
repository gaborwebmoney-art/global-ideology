# Design decisions log

## Direction for the v0 rebuild

### Game model
The game follows the Plague Inc. model. The player is a spreading movement with no home base to defend. The opponent is the world reacting to it: a World Order coalition driven by notoriety, not a rival AI playing by the same rules.

### Core rules
- **Autonomous spread.** Influence grows inside a country and spreads to neighbours and along trade links. The player shapes how it spreads instead of placing it by hand.
- **Opponent.** A World Order coalition that reacts to notoriety and races to finish a Containment Treaty. A rival bloc is deferred.
- **Distinct levers:**
  - Economic: income and dependency
  - Military: breaks military resistance, loud
  - Diplomatic: spreads over land borders
  - Ideological: grows support inside a population
  - Faith: crosses borders and oceans
  - Covert Ops: lowers resistance, very loud
- **Controls.** Global upgrades plus a few targeted operations with cooldowns. No hand-management of each country.
- **Win condition.** Align 70% of the world's population before the treaty completes.
- **Monetisation.** Not in the core game. Decide it after the core loop is fun.

### Content and tone
- The Covert Ops tree is non-violent: Sleeper Agents → Leaked Dossiers → Orchestrated Unrest → Shadow Government. Military ends in a Blockade.
- Satire targets bureaucracy and summits, media and PR, lobbying and corporate spin, influencer culture and personality cults. There is no satire of violence or religion; Faith is played straight.
- Platform: an HTML/JS prototype first. Port to Godot 4 once the core loop is fun.

## Prototype v1
File: `index.html` in this repo.

### Map
- 15 fictional countries, total population about 2.3bn. Sinan (900M, 38% of the world) is effectively required to win.
- 15 land borders and 10 trade routes.

### Spread and resistance
- Growth inside a country is logistic, scaled by (1 − resistance).
- Spread over borders and trade routes starts once the source country passes 8%.
- Each country has 4 resistance types: economic, military, diplomatic and ideological. Upgrades cut each type by up to 85%.

### Economy
- **Clout** comes from a small passive income that scales with world share, plus bubbles you click on the map.
- Each upgrade owned makes the next one 15% dearer.

### Upgrades and operations
- **Upgrades:** 7 branches × 4, linear within each branch.
- **Operations** (one country, then a cooldown):
  - Summit
  - Trade Deal
  - Snap Exercise
  - Leaked Dossiers

### World Order
- **Notoriety** rises with world share, the number of countries reached, and loud upgrades.
- The **World Order** activates at Notoriety 15.
- The **Containment Treaty** drafts faster as Notoriety rises. The Spin tree slows it down.
- A **counter-campaign** runs every 12–24 weeks. It hits your biggest country.

### Balance
Run `node balance-bot.js`: 90 games per strategy.

| Strategy | Win rate | Game length |
|---|---|---|
| Idle | 0% | Loses around week 370 |
| Casual | ~77% | Wins around week 250 |
| Careful | ~99% | Wins around week 240 |
| Loud-first | ~14% | Loses around week 225 |

## Prototype v2: the World Order as a visible opponent
- **Convenes at Notoriety 8.** Its HQ is the most diplomatic country far from your start. It begins with 2 founding members next to the HQ.
- **Face:** Secretary-General Horatio Quorum, quoted on the news wire.
- **Moves:** every 4–9 weeks (faster as Notoriety rises) it announces one move, 6 weeks ahead. It is shown on the map as an agent travelling from HQ, plus a countdown badge.
  - **Signing ceremony:** a member signs if your support there is below 60%.
  - **Membership invitation:** a country joins if your support is below 50%. Members get +15% resistance.
  - **Sanctions:** closes a trade route for 30 weeks.
  - **Awareness campaign:** −10 support and extra resistance in your biggest foothold.
- **Treaty:** the draft (0–100%) caps how many signatures can be collected, one per 12.5%. **You lose when 8 of 15 countries sign.** A signed country withdraws once your support there reaches 70%.
- **Counterplay:**
  - **Summit** in a targeted country cancels the planned move.
  - **Leaked Dossiers** makes a member (not the HQ) leave and tear up its signature.
  - The **Spin** tree slows the draft.

### Balance (v2)
| Strategy | Win rate | Game length |
|---|---|---|
| Idle | 0% | Loses around week 310 |
| Casual | ~76% | Wins around week 295 |
| Careful | ~94% | Wins around week 245 |
| Loud-first | ~29% | Loses around week 205 |

## Prototype v3: doctrines
- **Three opposed pairs:** Faith or Military, Diplomacy or Covert Ops, Ideology or Economy. Spin is open to every doctrine. That gives 8 possible builds.
- **Lock at tier 2.** The first upgrade of every branch is open to all. Buying the second upgrade in a branch closes its opposite for the rest of the game.
- **Rebrand:** once per game. It refunds 50% of the committed branch's tiers 2–4, costs 10 Clout and adds 15 Notoriety, then opens the opposite branch.
- **Operations follow doctrine.** Faith closes Snap Exercise. Diplomacy closes Leaked Dossiers.
- **The loud paths got a unique edge against the World Order:**
  - **Military shield:** countries need 15 + 10 points less of your support to refuse invitations and signings. Military also gets some ideological reach.
  - **Covert sabotage:** 50% of World Order campaigns and sanctions fail, and Shadow Government slows the treaty draft.
- **Second way to win: treaty collapse.** If the World Order cannot reach 8 possible signatures for 26 weeks in a row, it dissolves. This also fixes stalemates where you held most countries while the HQ blocked 70%.
- **Campaign rotation:** the same country cannot be campaigned against again within 20 weeks.
- **Balance** (`node doctrine-bot.js`: 60 games per build; casual / careful win rates):

| Build | Casual | Careful |
|---|---|---|
| Faith + Diplomacy + Ideology | 77% | 90% |
| Faith + Diplomacy + Economy | 70% | 87% |
| Faith + Covert + Ideology | 70% | 92% |
| Faith + Covert + Economy | 48% | 77% |
| Military + Diplomacy + Ideology | 55% | 57% |
| Military + Diplomacy + Economy | 57% | 65% |
| Military + Covert + Ideology | 73% | 70% |
| Military + Covert + Economy | 73% | 68% |

Military is the harder, faster doctrine. An idle player still loses every game.

## Prototype v4: rebuilt on the original skill tree (Sep 2025 design)
Source: `skilltree 10092025.xlsx` and `countries.docx` in the `game` repo.
- **Countries:** the 12 from countries.docx (Aethelgard, Guldor, Koryn, Sinopeia, Juche, Bharat, La Plata, Pannonia, Helvetia, Nippon, Isolde, Borealis), with resistances mapped 100→.15 … 400→.75. Celestia, Tavaro, Kestria and Pinguinia fill map gaps. Sinopeia and Bharat are both 900M.
- **Opposed pairs (original):**
  - Ideology ⟂ Economy
  - Military ⟂ Diplomacy
  - The lock applies at tier 2, with one Rebrand.
- **Partner bonuses (original):** each branch is boosted by its partner's tier 3, and its tier-4 capstone needs that tier 3.
  - Ideology ← Sanctions Hammer
  - Diplomacy ← Social Engineering
  - Military ← Monopolization
  - Economy ← Sovereign Intervention
  - Faith ↔ Covert Ops
- **Capstones are one-off special actions, retargeted at the World Order:**
  - **Utopia:** 26 weeks of double growth and income, no operations
  - **Government Bribe:** a member quits, and +25 support there
  - **Stoppage Order:** freezes the World Order for 10 weeks
  - **Alliance Breaker:** a member quits, and all resistances −8% permanently
  - **Believe!:** the HQ quits, a new HQ takes over, and the draft drops 15
  - **Hybrid Threat:** lifts sanctions, cancels planned moves, and no sanctions for 40 weeks
- **Faith** opens when you are in 4 countries. **Covert Ops** opens when the World Order convenes. Neither is paid.
- **Operations:**
  - The Military doctrine closes Summit; its counters are Sovereign Intervention's shield and Snap Exercise.
  - The Diplomacy doctrine closes Snap Exercise.
  - Snap Exercise now also cancels World Order moves in its target.
- **Economy fix:** v1–v3 players only ever reached about 5 upgrades and never tier 3. Upgrades are now weaker individually (fxScale .4), Clout is richer (×3) and escalation is 3% per upgrade. Players now own about 12 upgrades, including 3+ tier-3s. The World Order is stronger to match: it plans every 6 weeks and drafts at 2.6.
- **Balance** (60 games per build; casual / careful):

| Build | + Faith | + Covert |
|---|---|---|
| Ideology + Diplomacy (synergy) | 70% / 87% | 78% / 98% |
| Economy + Military (synergy) | 73% / 93% | 77% / 98% |
| Ideology + Military (hybrid) | 58% / 68% | 72% / 92% |
| Economy + Diplomacy (hybrid) | 62% / 72% | 68% / 83% |

An idle player still loses every game.

## Prototype v5: world events and decisions
Built on the Sep 2025 event list (see `prior-work/original-events-sep2025.md` in the project), extended to 24 background events and 10 decisions.

### Background events
- One every 12–20 weeks, announced on the news wire (▲ good, ▼ bad, briefly highlighted).
- 12 good: Viral Moment, Economic Boom, Foreign Aid, Parliamentary Gridlock, Celebrity Endorsement, Treaty Typo, Audit of Audits, Tourism Wave, Election Upset, Whistleblower, Tech Breakthrough, Sabbatical.
- 12 bad: Civil Unrest, Natural Disaster, Political Crisis, New Alliance, State of Emergency, Old Posts Resurface, Fact-Check, Market Crash, Customs Crackdown, Fast-Track Ratification, Splinter Group, Influencer Backlash.
- Odds of a bad event: 65% base, +0.5 pt per Notoriety point above 30, −12 pts while the World Order is ahead; clamped to 30–80%.
- Events do not add Notoriety before the World Order convenes, so they cannot wake it early.
- Timed effects (income, trade, growth multipliers; World Order paused or half speed) show as chips above the World Order card.

### Decisions
- First at week 70, then every 25–35 weeks after the previous one is resolved. Each can appear at most twice per game.
- The game pauses until you pick A or B. A costs Clout when marked; it is disabled if you cannot pay.
- Peace Talks, Emergency Summit, Official Scandal, Snap Election, Viral Campaign, Defence Pact, Ultimatum, Defector, Talk Show, Image Consultant.

### Balance (v5, 60 games per build; casual / careful)
| Build | + Faith | + Covert |
|---|---|---|
| Ideology + Diplomacy | 72% / 82% | 82% / 87% |
| Economy + Military | 63% / 88% | 73% / 97% |
| Ideology + Military | 65% / 80% | 72% / 88% |
| Economy + Diplomacy | 65% / 78% | 65% / 83% |

Idle: 0% (loses around week 286). Within about ±10 points of v4.

## Prototype v6.1: accounts, autosave, security hardening
### How it works
- **Online accounts (Supabase project `global-ideology`, Frankfurt):** email + password log in, register, forgot password. No email verification yet.
  - Passwords are handled only by Supabase Auth (bcrypt hashes in `auth.users`); the game never stores them. Traffic is HTTPS.
  - Rules enforced by the server: at least 8 characters, letters and digits. The page checks the same rules first.
  - Saves: `public.saves`, one row per user. Row-level security: each user reads and writes only their own row. `anon` has no access.
  - Limits: a save is at most ~200 KB and must be a JSON object; the week must be 0–5000; the server sets `updated_at`.
  - The page contains only the project URL and the **publishable** key (public by design). It refuses secret / `service_role` keys.
- **Device profiles (fallback):** used when no server is configured or it cannot be reached, including inside the claude.ai artifact. A profile name, no password, saved in this browser. The UI says plainly that anyone using the browser can open them. (The earlier browser-only passwords gave a false sense of security and were removed; old `gi.users` data is deleted on load.)
- **Guest:** "Play without saving".
- **Autosave:** at game start, every 10 game weeks, when the tab is hidden or closed (keepalive request), and on log out. A finished game deletes its save. On log in: Continue or New game.

### Password reset
"Forgot password?" → Supabase emails a link back to the game page (redirect allow-list: `https://gaborwebmoney-art.github.io/global-ideology/**`). The page reads the recovery token from the URL fragment, removes it from the address bar and asks for a new password. The answer is the same whether or not the email exists.
- Supabase's built-in mail server has a small hourly limit and, on the free plan, only delivers to addresses of the Supabase organisation's team members. For real players, add custom SMTP (Authentication → Emails → SMTP), for example Resend, Brevo or Amazon SES.

### Browser hardening (`index.html`)
- Content-Security-Policy: scripts only from hashes of the page's own inline scripts (and Cloudflare Turnstile); network only to the Supabase project; no forms, frames (except Turnstile), plugins or `<base>`. `build.py` computes the hashes.
- News text and decision labels are HTML-escaped before display.
- `referrer` policy `no-referrer`.

### CAPTCHA (ready, off)
The code supports Cloudflare Turnstile on register, log in and password reset. To switch it on: Cloudflare → Turnstile → add widget for `gaborwebmoney-art.github.io` → put the **site key** in `GI_BACKEND.turnstile` (via `build.py`) and the **secret key** in Supabase → Authentication → Attack Protection → Enable CAPTCHA protection (Turnstile). Both steps must happen together, or log in stops working.

### Not yet
Email verification, custom SMTP, leaked-password protection (Supabase Pro plan), anti-cheat (the game runs in the browser, so a player can edit their own save).

### Build
`python3 build.py global-ideology.html <supabase_url> <publishable_key> [turnstile_site_key]` writes the artifact page and `index.html` (with CSP).

## Prototype v7: world map and alerts
### Map
- A generated fictional world behind the country circles: continents, islands, polar ice, an inland sea, mountain ranges and offshore depth lines. Each country has a territory.
- The geography follows the game rules: land borders are exactly the game's 12 border pairs (checked by `terrain/gen.py`), trade routes cross sea, Pannonia is landlocked, Guldor/Isolde/Nippon are islands, Pinguinia is polar. An inland sea separates Koryn/Tavaro/Bharat/Sinopeia so only the allowed pairs touch.
- Territories fill amber with your support (up to 55% opacity at 100%). World Order members get a blue outline, signatories a thicker one. Territories are clickable (bigger targets than the circles). The thin land-border lines between circles were removed; trade routes stay.
- Positions moved: Guldor (455,135 → 430,128), Nippon (950,270 → 962,292); Pannonia, Tavaro, Kestria by 5 px. No balance impact (the simulation uses links, not coordinates; doctrine win rates unchanged).
- Phone: "Whole map" / "Zoom in" toggle (whole map by default, remembered per browser). Zoomed view centres on the selected country.
- Regenerate: `python3 terrain/gen.py` (numpy, scipy, scikit-image), then `build.py`.

### Alerts
- News items carry a level: ping (map only), important (alert), critical (alert that stays until dismissed).
  - Critical: World Order convenes, a country signs the treaty, joins the World Order, sanctions close a route.
  - Important: World Order moves announced, random events, decision outcomes, refusals, withdrawn signatures, treaty/share/Notoriety milestones.
  - Ping: your ideas reach a new country.
- Alerts: top-right of the map (bottom of the screen on phones), at most 3 (2 on phones); important ones disappear after 6 s. Colour: amber good, blue World Order, red bad. Clicking one opens that country's dossier.
- Map pings: an expanding ring on the country plus a short label (e.g. "Signed treaty", "Campaign in 6 wk", event name) for 4 s.

### Next
- Make loud play a real alternative, not a trap
- Upgrade combos and refunds
- Difficulty levels and scenarios
- GDP as a second weight
- Real-looking map shapes
- Save/load
- Sound
