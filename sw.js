const CACHE_NAME = "decisiones-v4";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  // Pre-cache the core shell and activate immediately when a new version is found.
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
      await self.clients.claim();

      // Tell all open tabs that a new version is active so they can refresh once.
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      clients.forEach((client) => client.postMessage({ type: "SW_ACTIVATED", version: CACHE_NAME }));
    })()
  );
});

const isNavigationRequest = (request) => request.mode === "navigate" || (request.destination === "document" && request.method === "GET");

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (isNavigationRequest(event.request)) {
    // Network-first for navigation so new HTML is picked up; fall back to cache when offline.
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./") || caches.match("./index.html")))
    );
    return;
  }

  // Cache-first for static assets; populate cache on first fetch.
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request)
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            return response;
          })
          .catch(() => cached)
    )
  );
});
