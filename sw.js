const CACHE_NAME = "decisiones-v5";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./src/app.js",
  "./src/game.js",
  "./src/ui.js",
  "./src/api.js",
  "./src/config.js",
  "./src/storage.js",
  "./src/utils.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  // Pre-cache the core shell. New versions wait until the user explicitly updates.
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("message", (event) => {
  if (event?.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
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

const isCacheableRequest = (request) => {
  try {
    const url = new URL(request.url);
    return (url.protocol === "http:" || url.protocol === "https:") && url.origin === self.location.origin;
  } catch {
    return false;
  }
};

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Some requests (e.g., injected extension resources) use unsupported schemes for Cache API.
  if (!isCacheableRequest(event.request)) {
    event.respondWith(fetch(event.request));
    return;
  }

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
