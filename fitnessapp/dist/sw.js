const SCOPE = new URL('./', self.location.href);
const PREFIX = `ritme:${SCOPE.pathname}:`;
const CACHE = PREFIX + 'v2.1-20261113-1';
const ASSETS = ['./', './index.html', './styles.css', './training.css', './app.mjs', './core.mjs', './storage.mjs', './program.json', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './standing-calf.svg'];
const PATHS = new Set(ASSETS.map(asset => new URL(asset, SCOPE).pathname));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(asset => new Request(new URL(asset, SCOPE), { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
      // Old caches were not scoped: remove only this application's assets.
      if (key.startsWith('ritme-v1-')) {
        const old = await caches.open(key);
        for (const request of await old.keys()) if (new URL(request.url).pathname.startsWith(SCOPE.pathname)) await old.delete(request);
      }
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== SCOPE.origin || !url.pathname.startsWith(SCOPE.pathname)) return;
  if (!PATHS.has(url.pathname) && request.mode !== 'navigate') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (request.mode === 'navigate') return await cache.match(new URL('index.html', SCOPE));
    return fetch(request);
  })());
});
