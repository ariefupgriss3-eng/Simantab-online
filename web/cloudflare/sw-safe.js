/* SIMANTAB_CLOUDFLARE_SAFE_SW_V8
   Operational rule: no personal data, authenticated HTML, API or document is ever cached. */
const VERSION = '8';
const CACHE = 'simantab-offline-public-v8';
const OFFLINE = '/offline.html';
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.add(new Request(OFFLINE, {cache: 'reload'}))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('simantab-') && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', event => {
  // No persistent caching of authenticated SIMANTAB, Supabase, uploads or API.
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate') return;
  const target = new URL(event.request.url);
  if (target.origin !== self.location.origin) return;
  event.respondWith(fetch(event.request, {cache: 'no-store'}).catch(() => caches.match(OFFLINE)));
});
