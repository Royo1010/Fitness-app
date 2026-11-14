const SCOPE = new URL('./', self.location.href);
const PREFIX = `ritme:${SCOPE.pathname}:`;
const CACHE = PREFIX + 'v2.2-ux-updates-20261114';
const BUILD = { version: '2.2.0', commit: null, contentHash: null };
const ASSETS = ['./', './index.html', './styles.css', './training.css', './app.mjs', './core.mjs', './progress.mjs', './storage.mjs', './program.json', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './exercise-guides.mjs', './build-info.mjs', './updates.mjs'];
const PATHS = new Set(ASSETS.map(asset => new URL(asset, SCOPE).pathname));
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS.map(asset => new Request(new URL(asset, SCOPE), { cache: 'reload' })));
    if (BUILD.contentHash) {
      const info = await cache.match(new URL('build-info.mjs', SCOPE));
      const match = info && /^export const BUILD = (\{.+\});\s*$/.exec(await info.text());
      if (!match || JSON.parse(match[1]).contentHash !== BUILD.contentHash) throw new Error('Onvolledige publicatie: build-identiteit wijkt af.');
    }
    // One-time transition: the previous app only notices controllerchange.
    // Activate without reloading it, so its existing safe update banner becomes visible.
    // Once migrated, later versions wait for the explicit Install button.
    if (self.registration?.active) {
      for (const key of await caches.keys()) {
        if (!key.startsWith(PREFIX) || key === CACHE) continue;
        const old = await caches.open(key);
        if (await old.match(new URL('index.html', SCOPE)) && !await old.match(new URL('build-info.mjs', SCOPE))) { await self.skipWaiting(); break; }
      }
    }
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'RITME_BUILD') event.ports[0]?.postMessage(BUILD);
  if (event.data?.type === 'ACTIVATE_UPDATE' && event.source?.url?.startsWith(SCOPE.href)) event.waitUntil(self.skipWaiting());
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
  // release.json and sw.js always go to the network; never serve cached build metadata.
  if (['release.json', 'sw.js'].some(file => url.pathname === new URL(file, SCOPE).pathname)) return;
  if (!PATHS.has(url.pathname) && request.mode !== 'navigate') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (request.mode === 'navigate') return await cache.match(new URL('index.html', SCOPE));
    return fetch(request);
  })());
});
