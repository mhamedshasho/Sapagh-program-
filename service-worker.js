/* Simple but robust service worker for PWA caching */

/* اسم الكاش */
const CACHE_NAME = 'payments-pwa-v1';

/* الملفات التي سيتم تخزينها عند التثبيت */
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/logo-192.png',
  './icons/logo-512.png',
  './icons/maskable-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

/* تثبيت: تخزين الأصول الأساسية */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .catch(err => console.warn('SW install: cache failed', err))
  );
  self.skipWaiting();
});

/* تفعيل: إزالة الكاشات القديمة */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
          return Promise.resolve();
        })
      )
    )
  );
  self.clients.claim();
});

/* سياسة الجلب: محاولة الشبكة أولاً مع حفظ استجابة صحيحة في الكاش، والعودة للكاش عند الفشل */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // إذا الاستجابة صالحة (status 200) فقط نخزنها في الكاش
        if (!response || !response.ok || response.type === 'opaque' && event.request.url.startsWith('http')) {
          // لطلبات CDNs التي تعيد opaque responses نتحفظ بعدم محاولة وضعها في الكاش بنفس الطريقة
          return response;
        }

        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone).catch(() => {/* تجاهل أخطاء التخزين */});
        });
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(cached => {
          // إن لم يوجد تطابق مباشر نعيد index.html لتدفق SPA (أو صفحة افتراضية)
          return cached || caches.match('./index.html');
        })
      )
  );
});
