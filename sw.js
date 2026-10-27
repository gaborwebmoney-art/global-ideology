// v10.3
// Offline cache for the PWA. The deploy workflow stamps CACHE with the commit, so every deploy (or rollback) refreshes phones.
const CACHE = 'gi-v10';  // replaced at deploy
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
  'fonts/big-shoulders-display-latin-600-normal.woff2', 'fonts/big-shoulders-display-latin-800-normal.woff2',
  'fonts/ibm-plex-sans-latin-400-normal.woff2', 'fonts/ibm-plex-sans-latin-500-normal.woff2', 'fonts/ibm-plex-sans-latin-600-normal.woff2',
  'fonts/ibm-plex-mono-latin-400-normal.woff2', 'fonts/ibm-plex-mono-latin-500-normal.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// Same-origin files: the page itself is network-first (so a new version shows on the next launch; falls back to the cache offline or on a slow
// connection), everything else cache first with a background refresh. Anything else (Supabase) goes straight to the network.
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // the live game's worker leaves the beta channel (/beta/) to its own worker
  if (!self.registration.scope.includes('/beta/') && u.pathname.includes('/beta/')) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(new Promise(res => {
      let done = false; const fall = () => caches.match('index.html', { ignoreSearch: true }).then(h => { if (!done && h) { done = true; res(h); } });
      const t = setTimeout(fall, 3000);
      fetch(e.request).then(r => { clearTimeout(t); if (done) return; done = true; if (r.ok) caches.open(CACHE).then(c => c.put('index.html', r.clone())); res(r); })
        .catch(() => { clearTimeout(t); if (!done) fall().then(() => { if (!done) { done = true; caches.match('index.html').then(h => res(h || Response.error())); } }); });
    }));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => {
    const net = fetch(e.request).then(r => { if (r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r; }).catch(() => hit);
    return hit || net;
  }));
});
// deploy trigger: live -> v10.4 (2026-10-20)
// deploy trigger: beta -> v10.5 (2026-10-20)
// deploy trigger: live -> v10.5 (2026-10-20)
// deploy trigger: beta -> v10.6 (2026-10-20)
// deploy trigger: live -> v10.6 (2026-10-20)
// deploy trigger: beta -> v10.7 (2026-10-20)
