# Plague Inc–like games (2012+): comparison and solo side-gig feasibility

Research date: 2026-09-28. Revenue is **sourced** where marked (S) and a third-party Steam model or my estimate (E) otherwise. Mobile revenue is almost never disclosed.

## Baseline: Plague Inc. (2012, Ndemic Creations)
- 190M+ players; top-paid mobile game 13 years running (Ndemic 2025–26 report card)
- Original budget: under $5K. James Vaughan designed the systems in Excel in his spare time (2011) and used a freelance programmer, artist and sound designer. It earned the cost back within hours of launch.
- Steam (Evolved): about $43.6M gross / $26.9M net, 3.9–4M owners (E, GameRevenueData)
- COVID spike: $6–7M in a few months in 2020, mostly from China, then the game was pulled there (S, mobilegamer.biz)

## Top 10 comparison

| # | Game (year, dev) | Core loop / platform | $ made | Player base | Complexity | Solo + Claude feasibility | Est. $ investment (solo) | Est. time (side gig, ~12 h/wk) | Monetization | Notes / risk |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Rebel Inc.** (2018, Ndemic) | Counter-insurgency world-map sim; iOS/Android/PC/console | Steam ~$2.7M gross (E); mobile not disclosed | 14M Android downloads + iOS; 230–260K Steam owners | High | Medium-low | $15–40K | 18–30 mo | Premium + DLC (mobile F2P+IAP) | Hidden-state systems need heavy balancing; had the Plague Inc. brand behind it |
| 2 | **After Inc.** (2024, Ndemic) | Rebuild after the pandemic: world map + city building; mobile | Not disclosed; likely several $M (E) | 3.5M players (S) | Medium-high | Medium-low | $15–40K | 24–36 mo | $2 iOS / F2P+ads Android, $15 expansion | 3 years of studio development; top-5 paid in UK/DE |
| 3 | **Infection Free Zone** (2024, Jutsu Games) | Zombie survival RTS on real-world maps (OSM); PC, now console | ~$15.2M gross / $8.5M net (E) | 780–880K owners | Very high (3D, real geodata) | Low | $80–250K+ | 36+ mo | Premium $25, Early Access | Best recent commercial result; needs a studio and a publisher (Games Operators) |
| 4 | **Cell to Singularity** (2018, Computer Lunch) | Evolution idle clicker; mobile/PC/web | Not disclosed; ads ≈ half of revenue (S) | 36M Android downloads, >1M MAU (S) | Low mechanics, high content | High (core); content is the bottleneck | $5–20K | 6–12 mo MVP, then ongoing live-ops | F2P, ads + IAP | 2 founders grew to 10 FTE; LiveOps is a treadmill |
| 5 | **Democracy 4** (2020 EA, Positech) | Policy/voter network sim; PC/console | ~$2.8M net (E); $800K gross in first 2 months (S) | 205–232K Steam owners | High (systems), low (graphics) | Medium: proven solo-led model | $10–40K (excluding own time; stated budget $357K incl. salary) | 18–24 mo | Premium $27–30 | Cliff Harris runs Positech solo and uses contractors. A UI-driven sim with no real-time map suits Claude well |
| 6 | **Doomsday Clicker** (2016, PikPok) | Destroy-the-world idle/tycoon; mobile | Not disclosed | 6.4M Android downloads | Low | High | $3–15K | 4–9 mo | F2P, ads + IAP | Idle market is saturated; needs UA spend to scale |
| 7 | **Bio Inc. Redemption** (2018, DryGin Studios) | Disease-vs-doctor sim on a human body map; PC/mobile | Steam ~$918K gross / $532K net (E) | 87–105K Steam owners; 2.9M Android downloads | Medium | **High: closest template** | $5–25K | 12–18 mo | Premium $13 PC; F2P+ads mobile | A small indie proved a Plague-style twist sells. Energy and paywall changes hurt its reviews |
| 8 | **Infectonator 3: Apocalypse** (2018, Toge Productions) | Zombie outbreak world-map sim, pixel art; PC/Mac | ~$423K gross / $245K net (E) | 40–49K Steam owners | Medium | Medium-high | $5–20K | 12–18 mo | Premium $13 | Published by Armor Games. Shows the ceiling for a niche premium release without a hook |
| 9 | **Bacterial Takeover** (2017, SIA Fufla) | Bacteria-conquer-planets idle; mobile/PC | Not disclosed; likely low 6 figures/yr (E) | 3.4M Android downloads | Low | Very high | $2–10K | 3–6 mo | F2P, ads + IAP | Micro-studio from Latvia; long tail but only ~13 downloads/day now |
| 10 | **Pandemic: The Board Game** (2013, Asmodee Digital) | Co-op digital board game; PC/mobile/console | Not disclosed | Not disclosed; delisted 2022 | Medium | N/A (licensed IP) | Licence + $30K+ | — | Premium | Shows that a licensed port dies once support stops. Not replicable solo |

## Takeaways for a solo build (Godot 4 + Claude)
- **Proven solo-scale lanes:** (a) a Bio Inc–style premium systems sim with a novel "map" (body, city, network, economy); (b) an idle/clicker hybrid (Doomsday, Bacterial Takeover, Cell to Singularity). Lane (a) has a higher price and review-driven discovery. Lane (b) earns less per user and needs ad and UA work.
- **Cost is not the barrier.** Plague Inc. cost under $5K. The binding constraints are simulation balancing (spreadsheet-first, as Vaughan did), 2D art direction, and discovery (Steam wishlists, launch timing).
- **Claude is strongest at:** simulation logic, GDScript systems, data-driven balancing tables, UI plumbing, localisation strings and event text. **Weakest at:** final art, audio, game-feel tuning and marketing reach.
- **Theme risk:** real-disease themes were pulled or restricted during COVID (Plague Inc. in China; app stores limited COVID-themed apps). A non-medical twist such as misinformation, a cyber-worm, an invasive species or a financial contagion avoids that risk and the direct comparison with Ndemic.

## Investment assumptions (solo, own time unpaid)
Godot (free); Claude plan $20–200/mo; contracted 2D art $2–15K; audio $0.5–3K; store fees (Steam $100/app, Apple $99/yr, Google $25 once); marketing/trailer/capsule art $1–10K. Idle F2P needs extra UA budget ($5K+) to scale.

## Sources
- Ndemic 2025–26 report card: https://www.ndemiccreations.com/en/news/246-ndemic-creations-2025-2026-report-card-after-inc-updates-and-plague-inc-outbreaks
- Ndemic 2024–25 report card: https://www.ndemiccreations.com/en/news/223-ndemic-creations-2024-2025-report-card-after-inc-is-out
- PocketGamer.biz, Plague vs Pandemic: https://www.pocketgamer.biz/plague-vs-pandemic-how-james-vaughans-ios-hit-plague-inc-took-the-market-from-its-inspiration/
- mobilegamer.biz, pandemic spike: https://mobilegamer.biz/what-happens-to-a-game-about-pandemics-when-theres-an-actual-pandemic/
- GameRevenueData (Plague Inc Evolved, Rebel Inc Escalation, Infection Free Zone, Bio Inc Redemption, Infectonator 3, Democracy 4)
- AppBrain (Rebel Inc, Bio Inc Redemption, Cell to Singularity, Doomsday Clicker, Bacterial Takeover)
- Cliffski's blog, Democracy 4 EA: https://www.positech.co.uk/cliffsblog/2020/12/03/democracy-4-in-early-access-after-2-months/
- Google AdMob story, Computer Lunch: https://www.google.com/ads/publisher/stories/computer_lunch_games/
- GamesRadar, After Inc $2 price: https://www.gamesradar.com/games/strategy/plague-incs-city-building-sequel-is-more-happy-and-optimistic-than-its-predecessor-even-if-its-creator-thinks-its-usd2-price-tag-is-a-huge-gamble/
- PC Gamer, Pandemic delisting: https://www.pcgamer.com/digital-board-game-pandemic-has-been-delisted-from-steam-without-explanation/
