// Run after `cap add android` / `cap sync android`: puts the project's own icons, splash and release settings into android/.
//   env: GI_VERSION_CODE (integer, default 1)   GI_VERSION_NAME (default: VERSION file)
//        GI_KEYSTORE (path to the upload keystore)  GI_KEYSTORE_PASSWORD  GI_KEY_ALIAS  GI_KEY_PASSWORD   (all four or none; none = unsigned bundle)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), and = path.join(root, 'android'), res = path.join(and, 'app', 'src', 'main', 'res');
const fail = m => { console.error('android-prepare: ' + m); process.exit(1); };
if (!fs.existsSync(and)) fail('android/ is missing. Run `npx cap add android` first.');

// 1. launcher icons + splash from android-res/ (tools/make-assets.py)
fs.cpSync(path.join(root, 'android-res'), res, { recursive: true });
// adaptive icon background colour: the template keeps a white drawable; point it at our colour resource
const bgXml = path.join(res, 'drawable', 'ic_launcher_background.xml');
if (fs.existsSync(bgXml)) fs.rmSync(bgXml);
for (const f of ['mipmap-anydpi-v26/ic_launcher.xml', 'mipmap-anydpi-v26/ic_launcher_round.xml']) {
  const p = path.join(res, f); if (!fs.existsSync(p)) continue;
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/@drawable\/ic_launcher_background/g, '@color/ic_launcher_background').replace(/@drawable\/ic_launcher_foreground|@mipmap\/ic_launcher_foreground/g, '@mipmap/ic_launcher_foreground'));
}
const vec = path.join(res, 'drawable-v24', 'ic_launcher_foreground.xml'); if (fs.existsSync(vec)) fs.rmSync(vec);   // template vector would shadow our PNG foreground
// the Capacitor template also ships a values/ic_launcher_background.xml; ours was copied over it above

// 2. version, signing, bundle options in app/build.gradle (idempotent)
const gp = path.join(and, 'app', 'build.gradle'); let g = fs.readFileSync(gp, 'utf8');
const vname = process.env.GI_VERSION_NAME || fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim();
const vcode = parseInt(process.env.GI_VERSION_CODE || '1', 10); if (!(vcode > 0)) fail('GI_VERSION_CODE must be a positive integer');
g = g.replace(/versionCode\s+\d+/, `versionCode ${vcode}`).replace(/versionName\s+"[^"]*"/, `versionName "${vname}"`);
const ks = process.env.GI_KEYSTORE;
if (ks) {
  for (const k of ['GI_KEYSTORE_PASSWORD', 'GI_KEY_ALIAS', 'GI_KEY_PASSWORD']) if (!process.env[k]) fail(k + ' is required with GI_KEYSTORE');
  if (!fs.existsSync(ks)) fail('keystore not found: ' + ks);
  if (!g.includes('// GI-SIGNING')) {
    g = g.replace('    buildTypes {', `    // GI-SIGNING (written by tools/android-prepare.js; the secrets come from the environment, never from a file in the repo)
    signingConfigs {
        release {
            storeFile file(System.getenv('GI_KEYSTORE'))
            storePassword System.getenv('GI_KEYSTORE_PASSWORD')
            keyAlias System.getenv('GI_KEY_ALIAS')
            keyPassword System.getenv('GI_KEY_PASSWORD')
        }
    }
    buildTypes {`).replace("proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'", "proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'\n            signingConfig signingConfigs.release");
  }
}
fs.writeFileSync(gp, g);

// 3. manifest: portrait + landscape both allowed (the game has both layouts); no extra permissions beyond INTERNET
const mp = path.join(and, 'app', 'src', 'main', 'AndroidManifest.xml'); let m = fs.readFileSync(mp, 'utf8');
m = m.replace(/\s*android:allowBackup="true"/, '\n        android:allowBackup="false"');   // saves live on the device and in the account; no Auto Backup of web storage
fs.writeFileSync(mp, m);
console.log(`android/ prepared: version ${vname} (${vcode}), ${ks ? 'signed release' : 'unsigned'}`);
