# v35 Tutorial: Build Proposal

Status: DRAFT for review. Docs only. Nothing in the game is changed by this PR.

Review target: a fresh session should read this file, then the current code, then challenge the plan. Pavel wants pushback, not agreement.

## 0. Context for the reviewer

- Game: Global Ideology, a Plague Inc-style strategy game. Prototype in HTML/JS. Godot port later.
- Audience at launch: 30+ players, nostalgic for old games (Fallout 1-2, Plague Inc fans). "No rush" players who pause, think and save. Casual 2-3h/day. Normal campaign under 1h.
- Launch: itch.io public, target Wed 4 Nov 2026 ~16:00 CET, or later if the tutorial is not ready. Web is free, Android free with $2.99 unlock.
- Live is `main`, beta is the newer release branch. Per Pavel's rule: UI changes go to a test branch first, are played on his phone, and merge to main only after his explicit OK. Do not push to live.
- Pavel's hard rule: no one-time-only coach cards. A player who closes one by mistake must be able to get the info back.
- Pavel's rule: proposal first, then build. This file is the proposal.
- Hungarian and English are both supported. All new strings need both.

## 1. Goal

A new player understands:
1. The core loop: spread influence, pick a branch, watch the world react.
2. Opposed upgrade locks, and that each legal branch pair has its own synergy.

They learn this inside the first Casual campaign without losing info if they close a tip.

## 2. Scope (decided)

| Item | Decision |
|---|---|
| First-encounter hints | Casual only |
| Guided first campaign | Casual only, skippable, replayable from Settings |
| Codex (help screen) | All difficulties. Always available. |
| Normal and Brutal | No hints, no guided campaign. Codex only. |
| Tutorial toggle and tip reset | In Settings |

Interpretation note: Pavel's answers were "1) casual only, 2) casual only, 3) no". Q1 was "hints on all difficulties, or Casual only?". Q3 was "should Brutal start with hints off?". Under Q1, Brutal has no hints, which means Brutal hints are off. Q3 "no" then reads as "do not turn Brutal hints off separately", which is redundant with Q1. **Reviewer: confirm this reading with Pavel before build.** If he meant Brutal should keep hints on, Scope changes.

## 3. Components

### 3.1 Codex (help screen)
- Reachable from the Menu at any time (desktop: Menu A header button, phone: Menu).
- One entry per mechanic: Economy, Military, Diplomacy, Ideology, Underworld, opposed locks, synergies, notoriety, alliances, World Order, country traits, win and lose conditions, difficulty levels.
- Long entries paginated with Back and Next. Close button on the last page. (Matches the backlog item.)
- Nothing in the Codex ever expires or is gated.
- Each hint's text is stored as a Codex entry. Dismissing a hint loses nothing.

### 3.2 First-encounter hints
- Fire once per player, the first time a mechanic appears on Casual. Triggers (proposed): first upgrade lock, first news or event, first World Order action, first notoriety rise, first alliance.
- Short text, dismissible. Dismissal records the tip as seen. The text stays in the Codex.
- "Seen" state stored locally. Reset tips in Settings clears it.
- Must never block input.

### 3.3 Guided first campaign (Casual only)
- Offered on new game start on Casual. Skip button always visible. Replayable from Settings.
- About 5 steps: pick a country (traits are shown) → spread influence → open one branch → see an opposed lock appear → watch the country reaction.
- Each step waits for the player's real action. No forced clicks off-script. If the player wanders, the step text stays until the action happens or the player skips.
- Guided campaign does not change game balance. It runs on the normal engine.

### 3.4 Country traits on pick screen
- Already on the backlog. Counts as a lesson for later mechanics. Needs the same text in both languages.

## 4. Rules (non-negotiable)

- Nothing blocks input permanently.
- Every tip has a Codex entry.
- Tutorial toggle and tip reset live in Settings.
- Desktop layout: the approved 3-column layout (alerts and news left, map centre, dossier right, bottom meter panel) is unchanged. The only addition is the Codex button in the Menu A header.
- Phone layout: tiles, Back at every level. Do not change the map. The map stays as in v10.27 for UI-only changes.
- Bottom sheets and confirm screens: no scrolling to reach Confirm (already a rule from v10.34).
- Any new copy: EN and HU keys in `i18n/`. No hard-coded English. (The v10.x bug where part of a news card stayed English is the cautionary example.)
- Balance is not touched. Tutorial and hints must not change any numbers.

## 5. Files likely touched (reviewer: verify against code)

- `i18n/*` for all new strings (EN and HU).
- Menu code (desktop header and phone menu) for the Codex button.
- Settings screen for the toggle and tip reset.
- Event or HUD code for hook points. Find the event feed and where upgrade locks and WO actions are resolved.
- New module suggested: `tutorial.js` (hint triggers, seen-state, guided script). Keep it decoupled from game logic. Hooks only read state.
- `sw.js` and `VERSION` bump on release. Not part of the proposal's build; flag at release.

Not to touch: `sim.js`, `balance-bot.js`, `doctrine-bot.js`. These are simulation and balance tools.

## 6. Build plan (steps)

1. Reviewer: read `DESIGN.md`, `REVIEW-v0.md`, and the current Menu, Settings and event code. Confirm hook points. Revise this file if they don't exist as assumed.
2. Create `tutorial.js` with the seen-state store and the hint trigger API. No UI yet.
3. Codex screen: static entries from `i18n`. Reachable from Menu. Paginated for phone.
4. Hint UI: non-blocking card, dismissible, text pulled from the same Codex entry.
5. Wire the triggers, Casual only.
6. Guided campaign script on Casual. Skip and replay.
7. Settings: tutorial toggle and tip reset.
8. EN and HU strings for everything above.
9. Deploy to test branch. Pavel plays on his phone (Android PWA) and on desktop.
10. Pavel's OK. Merge to main. Bump `VERSION`.

## 7. Test checklist

- New Casual game: guided campaign offered, skip works, replay works.
- Each hint fires once and only once. Reset tips re-fires it.
- Each hint's text appears in the Codex, identical.
- Normal and Brutal: no hints, no guided campaign. Codex reachable.
- Dismissing or closing a hint never blocks a click.
- No new English strings on the Hungarian build.
- Phone: no scroll needed to confirm. Back at every Codex level.
- Desktop: 3-column layout unchanged. Map unchanged.
- Balance: run `sim.js` before and after, numbers identical.

## 8. Risks

- Hook points may be scattered across the event code. If so, step 2 gets bigger.
- Guided campaign can drift from the real engine. Keep the script to reads and waits, no fake state.
- Too many hints overload a first session. Cap the Casual hint count at a small number (proposal: 6), then stop firing hints.
- Launch timing: if the tutorial is not tested by launch, launch as is and ship the tutorial as v35 after early feedback. Decide at launch day, not before.

## 9. Open questions

1. Confirm the Brutal hint reading in Section 2.
2. Hint cap on Casual: 6 proposed. OK?
3. Codex button placement on phone: inside Menu, or its own header icon?
4. Should the guided campaign count toward the 4-branch unlock goals? Proposal: no. It must not change progress.
