// اسم الكاش
const CACHE_NAME = 'payments-pwa-v1';

// الملفات التي سنخزنها للعمل دون اتصال
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  // أيقونات (تأكد من وجود هذه الملفات فعلاً)
  '/icons/logo-192.png',
  '/icons/logo-512.png',
  '/icons/maskable-512.png',
  // مكتبة حفظ الصورة
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// تثبيت الخدمة: تخزين الأصول
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// تفعيل: تنظيف الكاشات القديمة
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// استراتيجية الجلب: شبكة أولاً، ثم كاش كاحتياطي
self.addEventListener('fetch', event => {
  const { request } = event;

  // تجاهل طلبات غير GET
  if (request.method !== 'GET') return;

  event.respondWith(
    fetch(request)
      .then(response => {
        // خزّن نسخة من الرد في الكاش
        const respClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, respClone));
        return response;
      })
      .catch(() => caches.match(request).then(cached => cached || caches.match('/index.html')))
  );
});
