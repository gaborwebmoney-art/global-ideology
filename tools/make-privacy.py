"""Builds the public privacy pages: privacy.html (EN), privacy-hu.html (HU), delete-account.html (EN + HU).
They are plain static files served from the site root (Google Play needs a stable URL for each).
Edit the text here, then: python3 tools/make-privacy.py   (and keep the facts in step with tools/*.sql and the game code).
Facts it states, and where they come from: telemetry = GITele in index.html + tools/supabase-telemetry.sql;
accounts/saves = accounts.js + supabase-setup.sql; ranking = tools/supabase-ranking.sql; deletion = tools/supabase-v10.23.sql."""
import html, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
SITE = 'https://gaborwebmoney-art.github.io/global-ideology/'
UPDATED = '2026-10-28'
RETENTION = '24 months'

CSS = '''
:root{color-scheme:dark}
body{margin:0;background:#0d1820;color:#dfe8ed;font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:46rem;margin:0 auto;padding:28px 18px 64px}
h1{font-size:2rem;line-height:1.15;margin:.2em 0 .1em;letter-spacing:.01em}
h2{font-size:1.15rem;margin:1.8em 0 .4em;color:#f2a541}
p,li{color:#c9d6dd}
a{color:#7fc4e8}
.meta{color:#8aa1ad;font-size:.9rem}
.lang{float:right;font-size:.9rem}
table{border-collapse:collapse;width:100%;margin:.6em 0;font-size:.93rem}
th,td{border:1px solid #243947;padding:7px 9px;text-align:left;vertical-align:top}
th{background:#13232d;color:#e8eef2}
code{background:#13232d;padding:1px 5px;border-radius:3px}
'''

EN = {
    'lang': 'en', 'title': 'Privacy policy', 'other': ('privacy-hu.html', 'Magyarul'), 'updated': 'Last updated',
    'sections': [
        ('Who is responsible', '''<p>Global Ideology is a strategy game, made and run by an individual developer, Pavel Gurishev (Budapest, Hungary), who is the data controller for the data described here. You can reach the developer at the contact email shown on the game's Google Play page, or with <em>More → Report a bug</em> in the game.</p>
<p>This policy covers the Android app, the web game at <a href="''' + SITE + '''">''' + SITE + '''</a> and its beta at <code>/beta/</code>.</p>'''),
        ('The short version', '''<ul>
<li>You can play without an account. Your game then stays on your device.</li>
<li>An account needs an email address and a password, and lets you continue a game on any device. Accounts are for players aged 16 or older.</li>
<li>The game sends anonymous gameplay data (you can switch this off), crash reports, and bug reports only if you send them.</li>
<li>The public ranking is opt-in. Only the ranking name you choose and your scores are shown.</li>
<li>There are no ads, no advertising or analytics SDKs, no tracking across apps or sites, and your data is never sold.</li>
<li>You can delete your account and its data inside the game (<em>More → Account → Delete account</em>) or on the <a href="delete-account.html">account deletion page</a>.</li>
</ul>'''),
        ('What stays on your device', '''<p>The game keeps its save, settings (language, text size, map view, news pause, data-sharing choice) and a random anonymous device ID in the app's local storage. Uninstalling the app or clearing its storage removes all of it. If you play without an account, the running game is also kept there so it can continue after the app is closed.</p>'''),
        ('Data the game sends', '''<table>
<tr><th>What</th><th>Data</th><th>Why</th><th>Your choice</th></tr>
<tr><td>Gameplay data</td><td>Random anonymous device ID, app version, language, difficulty, start country, random seed, the upgrades you buy, outcome, weeks played, score and similar game statistics, minutes of play. If you are logged in, your account's internal ID is attached.</td><td>To balance and fix the game.</td><td>On by default. Switch off in <em>More → Share anonymous gameplay data</em>.</td></tr>
<tr><td>Crash reports</td><td>The error message and technical trace, app version, device/browser identification string, screen size, language, and game context (week, difficulty, start country). Anonymous device ID, plus the account ID if you are logged in.</td><td>To find and fix bugs. Without them crashes would go unnoticed.</td><td>Always sent.</td></tr>
<tr><td>Bug reports</td><td>The text you write, the optional contact you type, a snapshot of the game state, and the same technical context as crash reports.</td><td>To answer and fix what you report.</td><td>Only when you press send.</td></tr>
</table>
<p>None of this includes your name or email address. We do not try to identify you from it.</p>'''),
        ('Accounts', '''<p>If you create an account we store your <strong>email address</strong> and a <strong>hashed password</strong> (we never see or store the password itself), and your <strong>saved game</strong>. The email address is used only to sign you in, to send password-reset emails, and to contact you about your account. Accounts and saves are handled by Supabase (see below).</p>
<p>You must be at least 16 years old to create an account. Younger players can play without one.</p>'''),
        ('Global ranking (optional)', '''<p>You can join the public ranking after logging in. If you do, the ranking shows the <strong>ranking name</strong> you choose (please do not use your real name), an optional <strong>country</strong> you choose, and your winning scores (difficulty, score, stars, weeks, start country). Anyone can see the ranking. Leaving the ranking (<em>More</em>, your ranking name, then <em>Leave the ranking</em>) deletes your ranking name and scores.</p>'''),
        ('Who processes the data', '''<ul>
<li><strong>Supabase</strong> (database and sign-in): accounts, saves, ranking, gameplay data, crash and bug reports. The project is hosted in the EU (Frankfurt, Germany).</li>
<li><strong>GitHub Pages</strong> (hosting of the web game and these pages): GitHub may log technical connection data such as IP addresses when the web game or app loads.</li>
<li><strong>Google Play</strong> distributes the Android app and handles installation data under Google's own policies.</li>
</ul>
<p>We do not share data with anyone else, and we do not sell it.</p>'''),
        ('How long we keep it', '''<ul>
<li>Account, saved game, ranking entry: until you delete your account (or leave the ranking).</li>
<li>Gameplay data, crash reports and bug reports: up to ''' + RETENTION + '''. When you delete your account, any of these still attached to your account ID are detached from it, so they are anonymous afterwards.</li>
<li>Data on your device: until you uninstall the app or clear its storage.</li>
</ul>'''),
        ('Your rights', '''<p>Under the GDPR you have the right to access, correct, delete and port your data, to object to processing, and to withdraw consent. Most of this you can do yourself in the game; for anything else contact the developer. If you think your rights are not respected you can complain to your data protection authority; in Hungary this is the Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH, <a href="https://naih.hu">naih.hu</a>).</p>
<p>Legal bases: the account and save are needed to provide the service you asked for (contract); crash reports and gameplay data serve our legitimate interest in a working, balanced game; the ranking is based on your consent, which you can withdraw by leaving it.</p>'''),
        ('Children', '''<p>The game is not designed for children. Accounts and the ranking are for players aged 16 or older. Without an account no name, email or other identifying data is collected; anonymous gameplay data and crash reports described above still apply unless gameplay data is switched off.</p>'''),
        ('Changes', '''<p>If this policy changes, the new version replaces this page and the date at the top changes. Material changes will also be announced in the game.</p>'''),
    ],
}

HU = {
    'lang': 'hu', 'title': 'Adatvédelmi nyilatkozat', 'other': ('privacy.html', 'English'), 'updated': 'Utolsó frissítés',
    'sections': [
        ('Ki felel az adatokért', '''<p>A Global Ideology egy stratégiai játék, amelyet egy magánszemély fejlesztő, Gurishev Pavel (Budapest) készít és üzemeltet; ő az itt leírt adatok kezelője. A fejlesztő a játék Google Play oldalán megadott e-mail-címen, vagy a játékban a <em>Továbbiak → Hiba jelentése</em> menüpontban érhető el.</p>
<p>Ez a nyilatkozat az Android-alkalmazásra, a <a href="''' + SITE + '''">''' + SITE + '''</a> címen elérhető webes játékra és annak <code>/beta/</code> változatára vonatkozik.</p>'''),
        ('Röviden', '''<ul>
<li>Fiók nélkül is játszhatsz. Ilyenkor a játékod csak az eszközödön marad.</li>
<li>A fiókhoz e-mail-cím és jelszó kell, és lehetővé teszi, hogy bármelyik eszközön folytasd a játékot. Fiókot 16 éves vagy idősebb játékosok hozhatnak létre.</li>
<li>A játék névtelen játékadatokat (ezt kikapcsolhatod) és összeomlási jelentéseket küld; hibajelentést csak akkor, ha te elküldöd.</li>
<li>A nyilvános ranglistán való részvétel önkéntes. Csak az általad választott ranglistanév és az eredményeid látszanak.</li>
<li>Nincsenek hirdetések, hirdetési vagy analitikai SDK-k, alkalmazások és oldalak közötti követés, és az adataidat soha nem adjuk el.</li>
<li>A fiókodat és adatait törölheted a játékban (<em>Továbbiak → Fiók → Fiók törlése</em>) vagy a <a href="delete-account.html">fióktörlési oldalon</a>.</li>
</ul>'''),
        ('Mi marad az eszközödön', '''<p>A játék az alkalmazás helyi tárhelyén tárolja a mentést, a beállításokat (nyelv, szövegméret, térképnézet, hírek szüneteltetése, adatmegosztási döntés) és egy véletlenszerű, névtelen eszközazonosítót. Az alkalmazás eltávolítása vagy a tárhely törlése mindezt törli. Ha fiók nélkül játszol, a folyamatban lévő játék is itt marad, hogy az alkalmazás bezárása után folytatható legyen.</p>'''),
        ('Milyen adatokat küld a játék', '''<table>
<tr><th>Mit</th><th>Adatok</th><th>Miért</th><th>Te döntesz</th></tr>
<tr><td>Játékadatok</td><td>Véletlenszerű névtelen eszközazonosító, alkalmazásverzió, nyelv, nehézség, kezdőország, véletlen mag, a megvásárolt fejlesztések, kimenetel, lejátszott hetek, pontszám és hasonló játékstatisztikák, játékperc. Ha be vagy jelentkezve, a fiókod belső azonosítója is csatolódik.</td><td>A játék kiegyensúlyozása és javítása.</td><td>Alapból bekapcsolva. Kikapcsolható: <em>Továbbiak → Névtelen játékadatok megosztása</em>.</td></tr>
<tr><td>Összeomlási jelentések</td><td>A hibaüzenet és a technikai nyom, alkalmazásverzió, eszköz/böngésző azonosító szöveg, képernyőméret, nyelv és játékkörnyezet (hét, nehézség, kezdőország). Névtelen eszközazonosító, bejelentkezve a fiók azonosítója is.</td><td>Hibák felderítése és javítása. Nélkülük az összeomlások észrevétlenek maradnának.</td><td>Mindig elküldődnek.</td></tr>
<tr><td>Hibajelentések</td><td>Az általad írt szöveg, az opcionálisan megadott elérhetőség, a játékállás pillanatképe és az összeomlási jelentésekkel megegyező technikai környezet.</td><td>A bejelentett hiba megválaszolása és javítása.</td><td>Csak akkor, ha elküldöd.</td></tr>
</table>
<p>Ezek nem tartalmazzák a neved vagy e-mail-címed, és nem is próbálunk belőlük azonosítani.</p>'''),
        ('Fiókok', '''<p>Ha fiókot hozol létre, eltároljuk az <strong>e-mail-címedet</strong>, a jelszavad <strong>kivonatát</strong> (magát a jelszót sosem látjuk és nem tároljuk) és a <strong>mentett játékodat</strong>. Az e-mail-címet kizárólag a bejelentkeztetéshez, jelszó-visszaállító levelekhez és a fiókoddal kapcsolatos kapcsolatfelvételhez használjuk. A fiókokat és mentéseket a Supabase kezeli (lásd lent).</p>
<p>Fiók létrehozásához legalább 16 évesnek kell lenned. Fiatalabb játékosok fiók nélkül játszhatnak.</p>'''),
        ('Világranglista (önkéntes)', '''<p>Bejelentkezés után csatlakozhatsz a nyilvános ranglistához. Ekkor a ranglista az általad választott <strong>ranglistanevet</strong> (kérjük, ne a valódi neved használd), egy opcionálisan választott <strong>országot</strong> és a győztes eredményeidet (nehézség, pontszám, csillagok, hetek, kezdőország) mutatja. A ranglistát bárki láthatja. A ranglistáról való kilépés (<em>Továbbiak</em>, a ranglistanevedre koppintva, majd <em>Kilépés a ranglistából</em>) törli a ranglistanevedet és az eredményeidet.</p>'''),
        ('Ki dolgozza fel az adatokat', '''<ul>
<li><strong>Supabase</strong> (adatbázis és bejelentkezés): fiókok, mentések, ranglista, játékadatok, összeomlási és hibajelentések. A projekt az EU-ban (Frankfurt, Németország) fut.</li>
<li><strong>GitHub Pages</strong> (a webes játék és ezek az oldalak tárhelye): a GitHub technikai kapcsolati adatokat, például IP-címeket naplózhat, amikor a webes játék vagy az alkalmazás betöltődik.</li>
<li><strong>Google Play</strong> terjeszti az Android-alkalmazást, és a telepítési adatokat a Google saját szabályai szerint kezeli.</li>
</ul>
<p>Más félnek nem adunk át adatot, és nem is adjuk el azokat.</p>'''),
        ('Meddig őrizzük', '''<ul>
<li>Fiók, mentett játék, ranglistabejegyzés: amíg törlöd a fiókodat (vagy kilépsz a ranglistáról).</li>
<li>Játékadatok, összeomlási és hibajelentések: legfeljebb ''' + RETENTION.replace('months', 'hónap') + '''. Fiókod törlésekor az esetleg még a fiókazonosítódhoz kötött ilyen adatok leválnak róla, így utána névtelenek.</li>
<li>Az eszközödön lévő adatok: az alkalmazás eltávolításáig vagy a tárhely törléséig.</li>
</ul>'''),
        ('Jogaid', '''<p>A GDPR alapján jogod van az adataidhoz való hozzáféréshez, azok helyesbítéséhez, törléséhez és hordozásához, az adatkezelés elleni tiltakozáshoz és a hozzájárulás visszavonásához. Ennek nagy részét magad is megteheted a játékban; minden másért fordulj a fejlesztőhöz. Ha úgy érzed, jogaidat nem tartják tiszteletben, panaszt tehetsz az adatvédelmi hatóságnál; Magyarországon ez a Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH, <a href="https://naih.hu">naih.hu</a>).</p>
<p>Jogalapok: a fiók és a mentés a kért szolgáltatás nyújtásához kell (szerződés); az összeomlási jelentések és játékadatok a működő, kiegyensúlyozott játékhoz fűződő jogos érdekünket szolgálják; a ranglista a hozzájárulásodon alapul, amelyet a kilépéssel bármikor visszavonhatsz.</p>'''),
        ('Gyermekek', '''<p>A játék nem gyermekeknek készült. A fiókok és a ranglista 16 éves vagy idősebb játékosoknak szólnak. Fiók nélkül nem gyűjtünk nevet, e-mail-címet vagy más azonosító adatot; a fent leírt névtelen játékadatok és összeomlási jelentések viszont érvényesek, kivéve ha a játékadatok megosztását kikapcsolják.</p>'''),
        ('Változások', '''<p>Ha ez a nyilatkozat módosul, az új változat felváltja ezt az oldalt, és a tetején lévő dátum megváltozik. A lényeges változásokat a játékban is jelezzük.</p>'''),
    ],
}


def page(d):
    body = ''.join(f'<h2>{html.escape(h)}</h2>{t}' for h, t in d['sections'])
    return f'''<!doctype html>
<html lang="{d['lang']}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Global Ideology: {html.escape(d['title'])}</title><meta name="robots" content="index,follow"><style>{CSS}</style></head>
<body><main><a class="lang" href="{d['other'][0]}">{d['other'][1]}</a>
<h1>Global Ideology<br>{html.escape(d['title'])}</h1><p class="meta">{d['updated']}: {UPDATED}</p>
{body}</main></body></html>
'''


DEL = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Global Ideology: delete your account</title><meta name="robots" content="index,follow"><style>{CSS}</style></head>
<body><main><a class="lang" href="privacy.html">Privacy policy</a>
<h1>Global Ideology<br>Delete your account</h1><p class="meta">Account deletion page for the Global Ideology app (Android) and web game. / Fióktörlés a Global Ideology alkalmazáshoz és webes játékhoz.</p>
<h2>In the game (fastest)</h2>
<ol><li>Log in to your account.</li><li>Open <em>More</em> (the <strong>⋯</strong> button) → <em>Account</em> → <em>Delete account</em>.</li><li>Confirm. Your account is removed immediately and you are logged out.</li></ol>
<h2>If you cannot log in</h2>
<p>Write to the developer from the email address of the account, using the contact email on the game's Google Play page, and ask for the account to be deleted. The request is handled within 30 days.</p>
<h2>What is deleted</h2>
<ul><li>Your account, email address and hashed password.</li><li>Your saved game.</li><li>Your ranking name, country and ranking scores.</li><li>Gameplay data, crash reports and bug reports still attached to your account ID are detached from it, so they are anonymous afterwards. They are removed at the latest after {RETENTION}.</li></ul>
<p>Data kept on your own device is removed by uninstalling the app or clearing its storage.</p>
<h2>Magyarul</h2>
<p><strong>A játékban:</strong> jelentkezz be, majd <em>Továbbiak (⋯) → Fiók → Fiók törlése</em>, és erősítsd meg. A fiók azonnal törlődik. <strong>Ha nem tudsz bejelentkezni:</strong> írj a fiók e-mail-címéről a játék Google Play oldalán megadott kapcsolati e-mail-címre; a kérést 30 napon belül teljesítjük. Törlődik a fiókod, az e-mail-címed, a mentésed, a ranglistanevet és az eredményeid; a még a fiókodhoz kötött játékadatok, összeomlási és hibajelentések leválnak róla (utána névtelenek), és legkésőbb {RETENTION.replace('months', 'hónap')} után törlődnek.</p>
</main></body></html>
'''

if __name__ == '__main__':
    for name, content in [('privacy.html', page(EN)), ('privacy-hu.html', page(HU)), ('delete-account.html', DEL)]:
        open(os.path.join(ROOT, name), 'w', encoding='utf-8').write(content)
    print('privacy pages written')
