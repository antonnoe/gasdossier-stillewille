// SW-Bieb service worker — network-first.
const CACHE = 'swbieb-v1'; // ophogen forceert een schone sweep bij activate

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    try {
      const fresh = await fetch(req);               // netwerk eerst → verse deploy wint altijd
      if (fresh && fresh.status === 200) {
        (await caches.open(CACHE)).put(req, fresh.clone());
      }
      return fresh;
    } catch (err) {
      const cached = await caches.match(req);        // alleen offline terugval
      if (cached) return cached;
      throw err;
    }
  })());
});
