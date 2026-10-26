/* LingoArena service worker: makes the app installable and lets lessons work offline.
 * - App shell (index.html + its hashed JS/CSS) is precached on install.
 * - /assets/* are immutable (hashed names): cache-first.
 * - Page navigations: network-first, falling back to the cached app shell when offline.
 * - /api/* and cross-origin requests are never cached (AI calls need the network; the
 *   on-device Whisper model is cached separately by Transformers.js).
 */
const VERSION = "v2";
const SHELL = `lingoarena-shell-${VERSION}`;
const ASSETS = `lingoarena-assets-${VERSION}`;
const STATIC = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const shell = await caches.open(SHELL);
    await shell.addAll(STATIC);
    // Precache the JS/CSS the current index.html references, so the very first visit works offline next time.
    const html = await (await fetch("/", { cache: "no-store" })).text();
    const files = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
    if (files.length) await (await caches.open(ASSETS)).addAll(files);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (!key.endsWith(VERSION)) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        if (fresh.ok) (await caches.open(SHELL)).put("/", fresh.clone());
        return fresh;
      } catch {
        return (await caches.match("/", { ignoreVary: true })) || Response.error();
      }
    })());
    return;
  }

  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/")) {
    event.respondWith((async () => {
      // ignoreVary: module scripts carry an Origin header the install-time fetch did not.
      const cached = await caches.match(request, { ignoreVary: true, ignoreSearch: true });
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) (await caches.open(ASSETS)).put(request, response.clone());
      return response;
    })());
  }
});
