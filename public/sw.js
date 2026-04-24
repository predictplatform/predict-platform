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

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));
