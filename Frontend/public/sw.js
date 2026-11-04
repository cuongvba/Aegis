/**
 * Aegis Self-Cleaning Service Worker
 * Tự động hủy đăng ký và dọn sạch toàn bộ cache cũ để bảo đảm trình duyệt
 * tải tài nguyên trực tiếp từ Nginx, giải quyết triệt để lỗi Stale Chunk và vòng lặp refresh.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.map((name) => caches.delete(name)));
    }).then(() => self.clients.claim()).then(() => {
      return self.registration.unregister();
    })
  );
});

// Pass-through: không can thiệp fetch requests để Nginx phục vụ trực tiếp
self.addEventListener('fetch', () => {
  return;
});
