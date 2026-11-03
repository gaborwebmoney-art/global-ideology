# v35 Tutorial: Build Proposal (revised 2026-11-03)

Status: APPROVED by Pavel 2026-11-03. Building as v10.35 on beta (`release/v10.35`). Live stays v10.34 until his phone test and explicit OK.

## 0. What changed in this revision

The draft assumed no help system existed. The code already has one, so v35 extends it instead of building a second:

| Already in v10.34 | Where |
|---|---|
| Briefing pager (pauses, Back/Next, "Got it", "Don't show again") | `#coachOv`, `openCoach()`, `TOPIC` map |
| Rules screens reachable any time | Menu → How it works (`#rulesOv`, `setRules()`) |
| Reset of all briefings | Settings → Briefings → Show all again |
| Per-profile seen flags | `Best.getFlag/setFlag` |
| Intro briefing (6 pages) and "How upgrades work" pager | `#introOv`, `#howOv` |

Existing topics all cover mid/late game: unrest, base/legitimacy, moving the base, overextension, endgame, Grand Coalition. **The gap is the first 15 minutes.** v35 fills that gap.

Other review findings applied:
- `index.html` is edited directly (`build.py`/`template.html` are legacy). Code stays inline; `tools/csp.py` re-hashes. A separate `tutorial.js` would be blocked by the CSP.
- i18n has no keys: English in code, exact rows in `i18n/hu.tsv`, `node tools/i18n-build.js`.
- Hooks read state in the UI layer (`coachCheck()`); the SIM block is not touched.

## 1. Scope (decided)

| Item | Decision |
|---|---|
| New early-game briefings | Casual and Normal. Brutal: none auto (still in Menu). |
| Repeat | Each new briefing shows once per profile. Text stays in Menu → How it works. |
| Settings | New "Show briefings" switch (all automatic briefings, default on). "Show all again" also resets the new ones. |
| Guided first campaign | Cut from v35. Revisit after launch feedback. |
| Launch | itch public Tue 10 Nov 2026 16:00 CET; hard fallback Thu 12 Nov as-is. YouTube outreach in parallel, not a gate. |

## 2. New briefings and triggers

| Topic | Title | Trigger (UI reads state) |
|---|---|---|
| `start` | Getting started | Week ≥ 1 of a new game (week < 10, so old saves are not interrupted) |
| `upg` | Upgrades and doctrines | First time any upgrade is affordable (`canBuy`) |
| `noto` | Notoriety | Notoriety ≥ 5, World Order not yet convened |
| `wo` | The World Order | World Order convenes |
| `win` | How you win | First country other than the base reaches 60% |

Order and rules follow the existing `coachCheck()`: one briefing at a time, never while another sheet is open, game pauses while open and resumes on close. Each one is 2–3 short pages.

## 3. Rules

- Every briefing has a Menu → How it works entry with the same text.
- Desktop 3-column layout and map unchanged; phone layout unchanged (Menu gains buttons in an existing row).
- EN + HU for every new string; `GI_I18N.misses` empty on the new screens.
- Balance untouched: no SIM change.

## 4. Build steps

1. `release/v10.35` from `release/v10.34`.
2. New TOPIC entries + triggers in `coachCheck()`; eyebrow "Briefing" for them.
3. Menu → How it works: 5 new buttons. Settings: "Show briefings" switch.
4. HU rows; `node tools/i18n-build.js && python3 tools/csp.py`.
5. VERSION 10.35, sw.js cache, About line.
6. Headless test (Casual/Normal/Brutal, toggle, reset, HU misses, console errors, SIM block identical).
7. Beta channel → `/beta/`. Pavel tests on phone and desktop → OK → live.

## 5. Later

- Guided first campaign, if launch players report being lost.
- Hint wording pass after first itch comments.
