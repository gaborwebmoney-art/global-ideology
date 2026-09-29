# Global Ideology

A Plague Inc.–style strategy game prototype. You lead a movement that wants the whole world to agree with it. Spread across 15 fictional countries over land borders and trade routes, and align 70% of the world before the World Order signs its Containment Treaty.

**Play:** open `index.html` in any browser. It is a single file with no build step and no dependencies.

## How it plays
- Support grows inside a country by itself and spills over borders and trade routes once it passes 8%.
- Spend **Clout** on upgrades (7 branches: Ideology, Economy, Diplomacy, Faith, Military, Covert Ops, Spin) and on targeted operations (Summit, Trade Deal, Snap Exercise, Leaked Dossiers).
- Loud tactics raise **Notoriety**. At 15 the World Order wakes up and starts drafting its treaty. You lose at 100%.
- Controls: Space pauses, keys 1, 2 and 3 set the speed.

## Files
| File | What it is |
|---|---|
| `index.html` | The game: UI, with the simulation inlined |
| `sim.js` | The simulation core, the same code as inside `index.html`, as a Node module |
| `balance-bot.js` | Automated balance test: `node balance-bot.js` plays 90 games per strategy |
| `DESIGN.md` | Design decisions log |
| `REVIEW-v0.md` | Review of the earlier v0 prototype |
| `RESEARCH.md` | Market research on Plague Inc.–like games |

## Balance (v1)
| Strategy | Win rate | Typical game |
|---|---|---|
| Idle | 0% | Loses around week 370 |
| Casual | ~77% | Wins around week 250 |
| Careful | ~99% | Wins around week 240 |
| Loud-first | ~14% | Loses around week 225 |

A game lasts about 10 minutes at normal speed.
