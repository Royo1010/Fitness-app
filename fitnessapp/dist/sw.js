const CACHE = 'ritme-v1-20261111-1';
const ASSETS = ['./', './index.html', './styles.css', './app.mjs', './core.mjs', './storage.mjs', './program.json', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('ritme-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin) return;
  // Only packaged application assets enter the cache. Training data stays in IndexedDB.
  const path = new URL('./', self.location.href).pathname;
  if (!ASSETS.some(asset => new URL(asset, self.location.href).pathname === url.pathname) && request.mode !== 'navigate') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic' && url.pathname.startsWith(path)) await cache.put(request, response.clone());
      return response;
    } catch {
      return await cache.match(request, { ignoreSearch: true }) || (request.mode === 'navigate' ? await cache.match('./index.html') : Response.error());
    }
  })());
});
