const CACHE_NAME = "nihongo-kerja-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./src/app.js",
  "./src/quiz-engine.js",
  "./src/flashcards.js",
  "./src/styles.css",
  "./manifest.webmanifest",
  "./assets/icon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/backgrounds/bg-sakura.jpg",
  "./assets/backgrounds/bg-ninja.jpg",
  "./assets/backgrounds/bg-temple.jpg",
  "./assets/backgrounds/bg-street.jpg",
  "./data/scenarios-work-n5.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          if (new URL(event.request.url).origin === location.origin && response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => {
          if (event.request.mode === "navigate") return caches.match("./index.html");
          return caches.match("./index.html");
        });
    })
  );
});
