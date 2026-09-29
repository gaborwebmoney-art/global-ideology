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

### Next
- Make loud play a real alternative, not a trap
- Upgrade combos and refunds
- Random world events
- Difficulty levels and scenarios
- GDP as a second weight
- Real-looking map shapes
- Save/load
- Sound
