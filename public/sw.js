// MKA.P-MS Service Worker — network-first (always fresh, cache fallback offline)
const CACHE_NAME = "mkapms-v5";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  // Network first — toujours charger la dernière version
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Met en cache pour utilisation offline
        if (response.ok && e.request.method === "GET") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
