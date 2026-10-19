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

## 3. Build the APK / Play Store bundle (Capacitor)
Needs Node 20+, JDK 17+ and Android Studio (for the SDK).
```bash
npm install
npm run android:add      # once: creates android/
npm run android:open     # opens Android Studio
```
In Android Studio: plug in the phone and press Run, or Build → Generate Signed Bundle / APK for Play Store (`.aab`).
After any change to the game: `npm run android:sync`.

CLI debug build instead: `cd android && ./gradlew assembleDebug` → `android/app/build/outputs/apk/debug/app-debug.apk`. Copy it to the phone and open it (allow "install unknown apps").

## Before publishing on Google Play
- `appId` in `capacitor.config.json` (`app.globalideology.game`) is permanent once published. Change it first if you want another.
- Create your own signing key and keep it safe: `keytool -genkey -v -keystore release.jks -alias gi -keyalg RSA -keysize 2048 -validity 10000`. It is gitignored.
- Play needs a privacy policy URL because accounts collect email, and a 512 px icon and screenshots.
- Replace `icons/icon.svg` (placeholder artwork) with real art, then regenerate the PNGs.

## Editing notes
- Phone layouts are the last CSS block in `index.html` ("Phone and touch").
- The page has a hash-based Content-Security-Policy. After editing any inline `<script>`, run `python3 tools/csp.py`, or the browser will block the script.
- `sw.js` caches files: bump `CACHE` when you change a cached file, or phones keep the old version.
