/**
 * Aegis Global Sovereign PWA Service Worker (v2.1)
 * Kiến trúc Cache Thông Minh:
 * 1. Network-First cho Navigation & JS/CSS chunks -> Triệt tiêu 100% nguy cơ Stale Chunks.
 * 2. Cache-First cho Tĩnh Phục Vụ (Static Icons, Fonts, Favicons, Web Audio).
 * 3. Network-Only cho API calls (/api/*).
 * 4. Đạt chuẩn W3C/Chromium PWA Installability Criteria (beforeinstallprompt, WebAPK).
 */

const CACHE_NAME = 'aegis-global-pwa-v2.1';
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Tuyệt đối không cache API requests hoặc WebSockets
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/socket.io') || request.method !== 'GET') {
    return;
  }

  // 2. Chế độ Điều hướng (Navigation): Network-First (fallback sang cache hoặc offline trang chủ)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const rootCached = await caches.match('/');
        return rootCached || Response.error();
      })
    );
    return;
  }

  // 3. Tài nguyên Tĩnh (Static Icons, Manifest, Fonts)
  const isStatic = (
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.webmanifest')
  );

  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Trả về cache ngay, đồng thời ngầm cập nhật (stale-while-revalidate)
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          }).catch(() => {});
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 4. Các tài nguyên khác (JS, CSS chunks): Network-First an toàn
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
