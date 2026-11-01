# Google Play release kit: Global Ideology

Everything Claude prepared is in this repo. Everything only you can do is marked **YOU**.

## 0. Account type (decided 2026-11-01: organization account via the egyéni vállalkozó)
- **Organization account** (chosen): needs a D-U-N-S number for the business (free, up to 30 days) and Google's verification (1-3 weeks). No 12-tester rule. The EV must be active before it can earn (reactivate it before the payments profile goes live).
- Personal accounts created after 13 Nov 2023 would need a closed test with 12+ testers for 14 continuous days before production; not our path.

## 0b. Paid branches (v10.33)
Products (Play Console -> Monetize -> Products -> **One-time products**; all *managed / non-consumable*, status Active):
| Product ID | Name | Price (base, USD) |
|---|---|---|
| `gi.branches.all` | All 4 extra branches | 2.99 |
| `gi.branch.covert` | Covert Ops | 0.99 |
| `gi.branch.spin` | Spin | 0.99 |
| `gi.branch.grassroots` | Grassroots | 0.99 |
| `gi.branch.backchannels` | Back Channels | 0.99 |
Let Play convert to local prices (HUF etc.). The IDs are fixed in code (`Store` in index.html, `supabase/functions/_shared/play.ts`, the SQL check constraint).
Products can only be created after an AAB with the BILLING permission is uploaded (any track); v10.33+ bundles have it.

**Server side (YOU, once):**
1. Supabase SQL Editor: run `tools/supabase-v10.33.sql` (goal progress + purchases tables and functions; safe to re-run).
2. Google Cloud: create a service account (no roles needed in Cloud), create a JSON key. Play Console -> Users and permissions -> invite the service account email -> app permissions: **View financial data**, **Manage orders and subscriptions**. (Play Developer API must be enabled in that Cloud project.)
3. Supabase -> Edge Functions -> Secrets: `PLAY_SERVICE_ACCOUNT` = the whole JSON key file, `PLAY_PACKAGE` = `app.globalideology.game`, `CRON_SECRET` = a long random string.
4. Deploy (Supabase CLI, from the repo root): `supabase functions deploy play-verify` and `supabase functions deploy play-voided --no-verify-jwt` (or ask Claude to deploy them with the Supabase connector).
5. Daily refund check: Supabase -> Integrations -> Cron -> new job, daily 03:17, type HTTP request, POST `https://<project>.supabase.co/functions/v1/play-voided`, header `x-cron-secret: <CRON_SECRET>`.
6. Test purchases: Play Console -> Settings -> **License testing**: add tester Google accounts (they pay with test cards: always approves / declines / slow). Install from the internal or closed track.
Offline tests: `deno run -A supabase/tests/play-functions.test.ts` (Edge Functions), `tools/goals-sql-test.mjs` (SQL), `tools/store-ui-test.py` (app flow with Play mocked).

## 1. One-time setup (YOU)
1. `./tools/make-upload-key.sh` on your computer. It makes `~/global-ideology-keys/upload.jks` and offers to set the 4 GitHub secrets. Back the key file up. Never commit it.
2. Play Console -> Create app. Name **Global Ideology**, default language English (United States) (add Hungarian later), App, Free. Accept declarations.
3. The package name `app.globalideology.game` is fixed from the first upload. Play rejects it at upload if someone else owns it (it could not be checked from here: Play pages are not reachable). If it is taken, change `appId` in `capacitor.config.json` and `namespace`/`applicationId` handling in `tools/android-prepare.js` before the first upload, never after.
4. Setup -> App signing: keep **Play App Signing** on (default). Your upload key is the one from step 1.

## 2. Build the bundle
- GitHub -> Actions -> **Android release** -> Run workflow (the file must be on `main`; after the first deploy of v10.23 to live, or ask Claude to merge it). Leave version code empty (run number + 100). Download the artifact `global-ideology-release-aab`.
- Self-test: any push to a branch named `android/...` builds with a throw-away key and checks package, target API 36, version code, signature, music files, the BILLING permission and that the GIBilling and App plugins are registered. Nothing is published.
- Later uploads can be automated: add secret `PLAY_SERVICE_ACCOUNT_JSON` (Play Console -> Setup -> API access) and tick **upload**. The **first** upload must be manual in Console.

## 3. Closed test (YOU)
Testing -> Closed testing -> Create track (or use "Alpha") -> Create release -> upload the `.aab` -> release name `10.23` -> release notes (below) -> Testers: create an email list or a Google Group with 12+ testers -> Save, send for review. Share the opt-in link with testers; each must open it, opt in and install. Keep 12+ opted in for 14 days.

## 4. Store listing (copy/paste)
**App name:** Global Ideology
**Short description (80):** Spread an idea across the world. Persuade, don't conquer.
**Short description HU:** Terjessz el egy eszmét a világban. Meggyőzés, nem hódítás.
**Full description (EN):**
You lead a movement that wants the whole world to agree with it. Nobody has to be conquered. They just have to be convinced.

Global Ideology is a strategy game about spreading an idea across a fictional world map. Pick a start country, spend Clout on doctrines, build a base, sign treaties, and keep legitimacy up while governments, rivals and the news cycle push back.

- Real strategy: pick a path through 8 doctrine tracks, each with trade-offs
- A living world: governments, unrest, coalitions, relocation, overextension
- News and events that react to what you do, with a dry sense of humour
- Several start countries and difficulty levels, a global ranking (optional)
- Four extra branches: unlock them free through in-game goals, or buy them (one-time, no ads)
- Play as a guest or with an account; your saved game resumes where you left it
- English and Hungarian

**Full description (HU):**
Egy mozgalmat vezetsz, amely azt akarja, hogy az egész világ egyetértsen vele. Senkit nem kell leigázni, csak meg kell győzni.

A Global Ideology egy stratégiai játék, amelyben egy eszmét terjesztesz egy kitalált világtérképen. Válassz induló országot, költs Befolyást doktrínákra, építs bázist, köss szerződéseket, és tartsd magasan a legitimitásodat, miközben a kormányok, a riválisok és a hírciklus ellened dolgoznak.

- Valódi stratégia: 8 doktrínaág, mindegyikben kompromisszumokkal
- Élő világ: kormányok, elégedetlenség, koalíciók, költözés, túlterjeszkedés
- A tetteidre reagáló hírek és események, száraz humorral
- Több induló ország és nehézségi szint, opcionális globális ranglista
- Négy extra ág: ingyen, játékbeli célokkal oldhatod fel, vagy megveheted őket (egyszeri vásárlás, reklámok nélkül)
- Játssz vendégként vagy fiókkal; a mentett játékod ott folytatódik, ahol abbahagytad
- Magyar és angol nyelv

**Release notes (first test):** First closed test build. Please play a few games, try Resume after closing the app, and report problems with More -> Report a bug.

**Graphics (all in `store/`):** icon `icon-512.png` (512x512), feature graphic `feature-1024x500.png`, phone screenshots `shot-1..5-*.png` (1080x2160). Tablet screenshots are optional. Screenshots are English; regenerate with `python3 tools/make-screenshots.py`. Icon and feature graphic (v10.33, art direction B: pixel CRT globe with the amber idea spreading) are original art generated by `tools/make-assets.py` from the game's own map.

## 5. App content declarations (YOU, Policy -> App content)
- **Privacy policy URL:** `https://gaborwebmoney-art.github.io/global-ideology/privacy.html` (live only after v10.23 is promoted; the beta copy is `/beta/privacy.html`). Hungarian: `privacy-hu.html`.
- **Account deletion:** in-app More -> Account -> Delete account. Web URL: `https://gaborwebmoney-art.github.io/global-ideology/delete-account.html`. Needs `tools/supabase-v10.23.sql` applied in Supabase first.
- **Ads:** No. **App access:** all functionality available without login (guest play). No special credentials needed.
- **Target audience:** 16+ recommended (accounts need 16+). Do **not** select under-13 / Families. Choosing 13-15 adds Families-type obligations.
- **Content rating (IARC questionnaire):** category Game. Violence: none/mild fictional (no depiction of violence); no sexual content; no gambling; no user-to-user chat; **users can interact: ranking names are visible to others** (answer honestly: shared user-chosen name, no free chat); no location sharing; **in-app purchases: yes (digital goods, one-time unlocks; no random items / loot boxes)**. Store listing shows "Contains in-app purchases". Expect a low rating (PEGI 3/12-ish). Political satire theme: answer "No" to real-world hate/discrimination content.
- **Data safety:**
  - Collected & shared: nothing sold; data is processed by Supabase and Cloudflare (service providers, not "sharing").
  - Data collected: **Email address** (account, optional, required for accounts); **User IDs** (account id, anonymous device id); **App interactions** (anonymous gameplay data, optional/opt-out); **Crash logs** and **Diagnostics** (always on); **Other user-generated content** (bug reports, optional); **Name** = ranking name (optional). **Purchase history** (Financial info -> Purchase history: collected, linked to the account, not shared, required for purchases, purpose app functionality). Payment details: none (Google Play processes payments). Photos/Location: none.
  - Encrypted in transit: Yes (HTTPS). **Can users request deletion: Yes** (in-app and web URL above).
  - Purposes: app functionality, account management, analytics (gameplay), fix bugs.
- **Government app / Financial / Health / News apps:** No.
- **Advertising ID:** not used (answer No).

## 6. Things to know
- Target API: 36 (Capacitor 8.5.x, minSdk 24). Required for new apps from 31 Aug 2026.
- The bundle sets `allowBackup=false`: saves live on the device and in the account, not in Android Auto Backup.
- Version code: workflow run number + 100, always growing. Version name = `VERSION` file.
- Retention: the privacy policy promises up to 24 months for gameplay, crash and bug data. There is no automatic purge; the commented queries at the bottom of `tools/supabase-v10.23.sql` do it by hand (monthly).
- Publisher contact email: shown on the Play page (set in Console -> Store settings). The privacy policy points to it, so set a real address you read.
