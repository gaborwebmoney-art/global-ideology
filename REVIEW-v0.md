# Global Ideology v0 (Sep 2025): code review

Source: the original v0 prototype, built with Gemini in September 2025. It has three files: index.html (137 lines), style.css (349 lines) and script.js (613 lines). Plain HTML/CSS/JS with no engine.

## What exists
- Flow: title screen, then pick 1 of 3 random countries, then the main grid with a game log. The AI gets a random country.
- 12 fictional countries, each with 4 resistance stats (military, economic, diplomatic, ideological) from 100 to 400.
- Influence: spend IP on a country using one of the 4 levers. gain% = IP / resistance × 10.
- Income: +1 IP per tick for both sides (tick = 1 s, 0.5 s on fast forward).
- Upgrade tree: 6 branches × 4 tiers, costing 50 to 1,100 IP.
- Shop: Pinguinia country (500 IP) and two extra upgrade trees.
- Retention: a daily bonus (50 to 200 IP) and 12 weekly bonuses, stored in localStorage.
- Win: at least 100% player influence in every country. Loss: the AI reaches 100% in the player's home country.

## Bugs verified in a headless browser (Chromium)
| # | Bug | Effect |
|---|---|---|
| 1 | Upgrades set `active = true`, but no code reads it | The whole upgrade tree does nothing |
| 2 | A negative IP amount is accepted | Entering -5000 gives +5,000 IP: an infinite-money exploit |
| 3 | The AI spends 10 IP per tick but earns only 1 | The AI runs out of IP after about 11 ticks and stays passive |
| 4 | Pinguinia is already in the country list at start | Buying it adds a duplicate |
| 5 | The shop's unlock flags are never checked | Paid trees can be bought without being unlocked |
| 6 | A resistance of 0 divides by zero | Influence becomes Infinity |
| 7 | Influence is never capped at 100 | The bars overflow their tiles |
| 8 | Several weekly bonuses are cosmetic or log the wrong amounts | The rewards mislead the player |
| 9 | Win/loss uses `alert()` | Minor UX issue |

## Design problems
- There is no spread mechanic: influence never grows by itself or passes to neighbouring countries.
- The win condition is a pure IP grind: about 15,000 IP, roughly 4 hours at normal speed.
- There is no map or adjacency, no events, and no counter-play.

## Outcome
v1 is a rebuild, not a patch. See `DESIGN.md`.
