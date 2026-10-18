# Global Ideology

A Plague Inc.–style strategy game prototype. You lead a movement that wants the whole world to agree with it. Spread across 15 fictional countries over land borders and trade routes, and align 70% of the world before the World Order signs its Containment Treaty.

**Play:** open `index.html` in any browser. It is a single file with no build step and no dependencies. **Phone / Android:** see `ANDROID.md`.

## How it plays
- Support grows inside a country by itself and spills over borders and trade routes once it passes 8%.
- Spend **Clout** on upgrades (7 branches: Ideology, Economy, Diplomacy, Faith, Military, Covert Ops, Spin) and on targeted operations (Summit, Trade Deal, Snap Exercise, Leaked Dossiers).
- Loud tactics raise **Notoriety**. At 8 the **World Order** convenes: a visible opponent led by Secretary-General Horatio Quorum. It recruits member countries, runs awareness campaigns, sanctions trade routes and collects signatures for its Containment Treaty. Every move is announced 6 weeks ahead, and a Summit in the target country derails it.
- You win at 70% of the world's population. You lose when 8 countries sign the treaty. Countries where you hold 60% or more refuse to sign.
- Upgrades follow the original skill tree: opposed doctrines **Ideology or Economy** and **Military or Diplomacy** (the second upgrade in a branch commits you, one Rebrand allowed). Partners boost each other (Ideology and Diplomacy, Economy and Military, Faith and Covert Ops), and each branch ends in a one-off special action against the World Order.
- A second way to win: hold enough countries that the World Order cannot reach 8 signatures for 26 weeks, and the treaty collapses.
- Random world events (good and bad) hit every 12–20 weeks, and every 25–35 weeks you face a decision with two options. The game pauses until you choose.
- Accounts: register or log in with email and password (online, via Supabase), or play under a device profile. The game autosaves and you continue where you left off. See `DESIGN.md` → Prototype v6.1.
- A generated world map: territories fill amber as your support grows; alerts and map pings flag important news.
- Controls: Space pauses, keys 1, 2 and 3 set the speed.

## Files
| File | What it is |
|---|---|
| `index.html` | The game: UI, with the simulation inlined |
| `accounts.js` | Accounts and saves (same code as inside `index.html`) |
| `build.py` | Builds `index.html` from the sources, with the security policy |
| `terrain/gen.py`, `terrain/terrain.json` | World map generator and its output (embedded by `build.py`) |
| `supabase-setup.sql` | One-time database setup for online accounts |
| `sim.js` | The simulation core, the same code as inside `index.html`, as a Node module |
| `balance-bot.js` | Automated balance test: `node balance-bot.js` plays 90 games per strategy |
| `doctrine-bot.js` | Win rate of each doctrine build: `node doctrine-bot.js` |
| `DESIGN.md` | Design decisions log |
| `REVIEW-v0.md` | Review of the earlier v0 prototype |
| `RESEARCH.md` | Market research on Plague Inc.–like games |

## Balance (v5)
Casual / careful win rates by doctrine build (`node doctrine-bot.js`):

| Build | + Faith | + Covert |
|---|---|---|
| Ideology + Diplomacy | 72% / 82% | 82% / 87% |
| Economy + Military | 63% / 88% | 73% / 97% |
| Ideology + Military | 65% / 80% | 72% / 88% |
| Economy + Diplomacy | 65% / 78% | 65% / 83% |

Idle play: 0%.

A game lasts about 10 minutes at normal speed.
