# v35 Tutorial: Build Proposal (revised 2026-11-03)

Status: **APPROVED by Pavel (2026-11-03), built as v10.35 on beta.** Revision 2 replaces the first draft after a review against the code (`release/v10.34`).

## 0. What changed from the first draft, and why

| First draft | Revised | Why |
|---|---|---|
| Hints on Casual only | Briefings on **Casual and Normal**. Brutal: none. Toggle in Settings, default on. | The itch.io pitch steers new players to Normal (campaign under 1h). Casual-only would teach almost nobody. The Q1/Q3 reading question is gone. |
| New `tutorial.js` file | No new file. Built into `index.html` next to the existing briefings. | The CSP (`tools/csp.py`, `build.py`) allows only hashed inline scripts and has no `'self'` in `script-src`, so a separate script file would be blocked. |
| New EN/HU i18n "keys" | English in code + Hungarian rows in `i18n/hu.tsv`. | The language layer has no keys: it translates English text as it reaches the page (`i18n/engine.js`). |
| New Codex screen | **The existing "How it works" rulebook becomes the Codex.** | The game already has a briefing system (v10.12+): `TOPIC` table, coach card (`#coachOv`), rulebook (`#rulesOv`), "Don't show again", Settings, Briefings, "Show all again". It covered only late-game mechanics. v35 adds the early-game topics to the same system. |
| New non-blocking hint cards | Same coach card as the existing briefings: it pauses the game; Close only on the last page. | Same look and behaviour as the briefings Pavel already tested. Pausing suits "no rush" players. Nothing blocks for good: Got it always closes it. |
| Guided first campaign | **Cut from v35.** | Most expensive and riskiest part. Revisit after launch feedback. |
| Hooks in event code, "don't touch sim.js" | All triggers read state from the UI layer. **Simulation untouched** (no edits above the UI code; sim.js unchanged). | No conflict with the sim. Balance cannot move. |

## 1. Goal

A new player understands the core loop (support spreads, Clout, upgrades, actions), opposed doctrines and their synergies, the World Order and alliances, inside the first games. Nothing is one-time-only: closing a briefing loses nothing.

## 2. Scope (built)

| Item | Decision |
|---|---|
| Early-game briefings | Casual and Normal. Not Brutal. |
| Codex | Menu, How it works: 14 topics, all levels, always available, paginated on phones, Close goes back to the Menu. |
| Settings | New "Early-game briefings" switch (default on). Existing "Briefings: Show all again" resets every topic, old and new. |
| Guided campaign | Not in v35. |

## 3. Topics

New (v35): Getting started, Upgrades and doctrines, Actions, The World Order, Alliances, Events and decisions, Winning and losing, Difficulty levels.
Existing: Unrest and uprisings, Your base, Moving your base, Overextension, The endgame, The Grand Coalition.

## 4. Briefing triggers (Casual and Normal)

Each repeats every run until **learned** or switched off with "Don't show again". One at a time, at least 3 game weeks apart. Late-game briefings keep their v10.12–v10.21 behaviour on every level.

| Topic | Shows when | Learned when |
|---|---|---|
| Getting started | week 2, no upgrade bought yet | first upgrade bought |
| Upgrades and doctrines | first upgrade bought, no doctrine committed | a doctrine is committed (2nd upgrade in a branch) |
| Actions | an upgrade owned, no action used yet | first action |
| The World Order | the World Order convenes | an action in a country it is courting |
| Alliances | first alliance forms | a Diplomacy or Ideology action on an alliance member |

Events, Winning and losing and Difficulty levels are Codex-only (no briefing).

## 5. Rules (kept)

- Nothing blocks input for good. Every briefing is also in the Codex, with the same text plus extra detail.
- Desktop 3-column layout and the map unchanged. Phone: Codex buttons in two columns inside the Menu; pages with Back/Next; Close on the last page.
- All new text has Hungarian rows. Test: every Codex page renders fully Hungarian.
- Balance not touched.

## 6. Found and fixed on the way

- Two existing rulebook pages (Moving your base p.3, Overextension p.3) were half English in Hungarian: a `{}` pattern swallowed the whole page. Whole-page HU rows added.
- `tools/store-ui-test.py` and `tools/save-ui-test.py` hard-coded version 10.33. They now read `VERSION`.

## 7. Tests

`tools/tutorial-ui-test.py` (new): briefing order, pause/resume, learned flags, gap, Don't show again, Brutal/toggle-off silence, 14 Codex topics on desktop and phone, Close back to Menu, Hungarian coverage. Existing suites re-run: endgame-ui, layout, store, save, settings, bubble-tap.

## 8. Later (not v35)

- Guided first campaign, if launch feedback says players are lost.
- Telemetry: briefing shown/learned/off counts, to tune the triggers.
