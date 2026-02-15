// Minimal service worker for PWA installability (Android / iPhone "Add to Home Screen")
// Does not cache API or heavy assets – app stays network-first to avoid stale data and freezes.

const CACHE_NAME = 'autonautics-v1';

self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (event) {
  event.respondWith(fetch(event.request).catch(function () {
    return caches.match(event.request);
  }));
});
