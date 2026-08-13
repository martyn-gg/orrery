/* Orrery — offline cache.
 *
 * Strategy matters here. An earlier version was cache-first for
 * everything, which meant a freshly deployed index.html was ignored until
 * the *second* reload: the page you were looking at had already been
 * rendered from the stale copy. That is the classic way a static site
 * appears not to deploy.
 *
 * So: HTML is network-first (fall back to cache only when genuinely
 * offline), and everything else — icons, images — is cache-first, since
 * those are versioned by the cache name and rarely change.
 */
const CACHE = 'orrery-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './og-image.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const isHTML = req =>
  req.mode === 'navigate' ||
  (req.headers.get('accept') || '').includes('text/html');

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  if (isHTML(req)) {
    // Network first: always show the newest deploy when there is a network.
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then(hit => hit || caches.match('./index.html'))
        )
    );
    return;
  }

  // Everything else: cache first, refreshed quietly in the background.
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});