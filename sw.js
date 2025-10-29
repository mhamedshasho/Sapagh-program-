const CACHE_NAME = 'payments-app-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/maskable-192.png',
  '/icons/maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // صفحات HTML: network-first مع fallback إلى index.html من الكاش
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req).then(networkResponse => {
        caches.open(CACHE_NAME).then(cache => cache.put(req, networkResponse.clone()));
        return networkResponse;
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // موارد ثابتة: cache-first ثم حفظ نسخة عند الحصول عليها من الشبكة
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200) return networkResponse;
        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        return networkResponse;
      }).catch(() => {
        if (req.destination === 'image') return caches.match('/icons/maskable-192.png');
        return caches.match('/index.html');
      });
    })
  );
});
