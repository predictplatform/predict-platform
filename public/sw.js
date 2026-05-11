// Service Worker — دوري التوقعات
// يستقبل Push Notifications ويعرضها للمستخدم

self.addEventListener('push', function (event) {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'دوري التوقعات', body: event.data.text() };
  }

  const options = {
    body: data.body ?? '',
    icon: data.icon ?? '/icon-192.png',
    badge: '/badge-72.png',
    tag: data.tag ?? 'default',
    renotify: true,
    requireInteraction: false,
    data: { url: data.url ?? '/' },
    actions: data.actions ?? [],
    dir: 'rtl',
    lang: 'ar',
  };

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'دوري التوقعات ⚽', options)
  );
});

// عند الضغط على الإشعار — يفتح الموقع
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const url = event.notification.data?.url ?? '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // إذا الموقع مفتوح، انتقل للصفحة المطلوبة
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // إذا مش مفتوح، افتح نافذة جديدة
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// ═══════════════════════════════════════════════════════════════════
// PWA Caching — دوري التوقعات
// ═══════════════════════════════════════════════════════════════════

const STATIC_CACHE = 'dawri-static-v1'; // ملفات Next.js الثابتة (hashed)
const PAGES_CACHE  = 'dawri-pages-v1';  // صفحات HTML
const ASSETS_CACHE = 'dawri-assets-v1'; // صور وأيقونات

// الأصول المُخزّنة مسبقاً (icons فقط — لا نخزّن HTML أثناء التثبيت)
const PRECACHE = ['/icon-192.png', '/icon-512.png', '/badge-72.png'];

// الكاشات الحالية — أي اسم آخر يُحذف في activate
const KNOWN_CACHES = new Set([STATIC_CACHE, PAGES_CACHE, ASSETS_CACHE]);

// ── install ───────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(ASSETS_CACHE)
      .then((cache) => cache.addAll(PRECACHE).catch(() => { /* icons اختيارية */ }))
      .then(() => self.skipWaiting())
  );
});

// ── activate — مسح الكاشات القديمة ──────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !KNOWN_CACHES.has(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => clients.claim())
  );
});

// ── fetch ─────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // تجاهل: غير GET، خارجي، Supabase، Clerk، API routes، SSR data
  if (
    request.method !== 'GET'                           ||
    url.origin !== self.location.origin                ||
    url.pathname.startsWith('/api/')                   ||
    url.pathname.startsWith('/_next/data/')
  ) return;

  // ── Next.js static assets: /_next/static/ → Cache First ──────────
  // هذه الملفات تحمل content hash — آمنة للتخزين الدائم
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // ── Images & Icons → Cache First with network fallback ───────────
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(ASSETS_CACHE).then((c) => c.put(request, clone));
          }
          return response;
        }).catch(() => cached ?? new Response('', { status: 404 }));
      })
    );
    return;
  }

  // ── HTML navigation → Network First, stale fallback ──────────────
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(PAGES_CACHE).then((c) => c.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request)
            .then((cached) => cached ?? caches.match('/'))
        )
    );
    return;
  }
});
