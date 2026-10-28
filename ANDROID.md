# Global Ideology on Android

The game is one web page. It runs on a phone three ways. Do them in this order.

## 1. Test on your phone now (no install)
On your computer, in this folder:
```bash
./serve.sh
```
It prints a `Phone:` URL. Open it in Chrome on your phone (same Wi-Fi). Rotate the phone: both portrait and landscape have their own layout.

## 2. Install it like an app (PWA)
Chrome only offers install and offline mode on HTTPS or `localhost`. Two ways:
- **USB:** enable USB debugging, plug the phone in, then `adb reverse tcp:8765 tcp:8765` and open `http://localhost:8765/index.html` in phone Chrome. Menu → Install app.
- **Hosted:** publish the folder to any HTTPS host (GitHub Pages works), open the URL in phone Chrome, Menu → Install app.

Installed, it runs fullscreen and works offline (fonts are bundled). Online accounts still need a connection.

## 3. Build the Play bundle (Capacitor 8)
Needs Node 22+, JDK 21 and the Android SDK. Easiest: let GitHub build it, see `docs/PLAY.md` (workflow `Android release`, signed with your upload key from the repo secrets).

Locally:
```bash
npm install
npx cap add android            # once: creates android/ (not committed)
npm run android:aab            # web -> cap sync -> tools/android-prepare.js -> gradlew bundleRelease
```
`tools/android-prepare.js` copies the icons/splash (`android-res/`), sets version (VERSION file, `GI_VERSION_CODE`) and, when `GI_KEYSTORE*` env vars are set, release signing. Output: `android/app/build/outputs/bundle/release/app-release.aab`.
Debug APK instead: `cd android && ./gradlew assembleDebug`.

## Before publishing on Google Play
Follow `docs/PLAY.md` (key, listing text, declarations, closed test).
- `appId` (`app.globalideology.game`) is permanent once uploaded.
- Art: `python3 tools/make-assets.py` regenerates icons from one drawing; `python3 tools/make-screenshots.py` regenerates the store screenshots; `python3 tools/make-privacy.py` the privacy pages.

## Editing notes
- Phone layouts are the last CSS block in `index.html` ("Phone and touch").
- The page has a hash-based Content-Security-Policy. After editing any inline `<script>`, run `python3 tools/csp.py`, or the browser will block the script.
- `sw.js` caches files: bump `CACHE` when you change a cached file, or phones keep the old version.
