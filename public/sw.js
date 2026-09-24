/**
 * CivicSync PH service worker — offline caching for v1.
 *
 * Strategies (same shapes as Workbox's, hand-rolled to avoid a build plugin):
 * - Hashed build assets (/_next/static) and icons/fonts: cache-first
 * - Page navigations: network-first, falling back to the last cached copy,
 *   then to /offline
 * - Our API routes: network-first (the Watchlist uses them to check for
 *   fresh status, so a cached copy is only a fallback when offline)
 */
const VERSION = "v1";
const STATIC_CACHE = `civicsync-static-${VERSION}`;
const PAGE_CACHE = `civicsync-pages-${VERSION}`;
const PRECACHE = ["/offline", "/watchlist", "/manifest.json", "/icon.svg", "/icon-192.png"];
const MAX_PAGES = 60;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PAGE_CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (const k of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(k);
}

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok) (await caches.open(STATIC_CACHE)).put(req, res.clone());
  return res;
}

async function networkFirstPage(req) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) {
      cache.put(req, res.clone());
      trim(PAGE_CACHE, MAX_PAGES);
    }
    return res;
  } catch {
    return (await cache.match(req)) || (await cache.match("/offline")) || Response.error();
  }
}

async function networkFirst(req) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req)) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.origin === location.origin) {
    if (url.pathname.startsWith("/_next/static/") || /\.(png|svg|ico|woff2?)$/.test(url.pathname)) {
      event.respondWith(cacheFirst(request));
    } else if (request.mode === "navigate") {
      event.respondWith(networkFirstPage(request));
    } else if (url.pathname.startsWith("/api/")) {
      event.respondWith(networkFirst(request));
    }
  } else if (url.hostname === "fonts.gstatic.com") {
    event.respondWith(cacheFirst(request));
  }
});
