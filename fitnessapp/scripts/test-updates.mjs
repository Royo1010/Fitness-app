import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:net';
import { buildPages } from './build-pages.mjs';

const stored = p => p.evaluate(async () => {
  const { LocalStore } = await import('./storage.mjs'); const db = await new LocalStore().open();
  try { return await db.load(); } finally { db.db.close(); }
});
const settings = async p => { await p.locator('.mobile-nav [data-page="more"]').click(); await p.locator('.more-list [data-page="settings"]').click(); };
const check = async (p, phase) => {
  await p.locator('[data-action="check-updates"]').click();
  await p.waitForFunction(() => ['latest','available','error'].includes(document.querySelector('[data-update-status]')?.dataset.phase));
  assert.equal(await p.locator('[data-update-status]').getAttribute('data-phase'), phase, await p.locator('[data-update-status]').textContent());
};
async function poll(read, condition, label) {
  const deadline = Date.now() + 10000;
  do { const result = await read(); if (condition(result)) return result; await new Promise(r => setTimeout(r, 25)); } while (Date.now() < deadline);
  assert.fail(label);
}

export async function testUpdates(browser) {
  const temp = await mkdtemp(path.join(tmpdir(), 'ritme-real-update-'));
  const source = path.join(temp, 'source'), output = path.join(temp, 'site');
  let server, context, legacy;
  const errors = [];
  try {
    await cp(new URL('../dist/', import.meta.url), source, { recursive: true });
    const first = await buildPages(source, output, 'update-fixture-a');
    const socket = createServer(); await new Promise(r => socket.listen(0, '127.0.0.1', r));
    const port = socket.address().port; await new Promise(r => socket.close(r));
    const url = `http://127.0.0.1:${port}/Fitness-app/`;
    server = spawn(process.execPath, ['scripts/serve.mjs'], { cwd: fileURLToPath(new URL('../', import.meta.url)),
      env: { ...process.env, PORT: String(port), RITME_SERVE_ROOT: output, RITME_TEST_DATE: '2026-11-14T12:00:00Z' }, stdio: ['ignore', 'pipe', 'pipe'] });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('Updateserver start niet')), 10000);
      server.once('error', reject); server.once('exit', code => { clearTimeout(timer); reject(Error('Updateserver gestopt: ' + code)); });
      server.stdout.once('data', () => { clearTimeout(timer); resolve(); });
    });
    context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, timezoneId: 'Europe/Amsterdam' });
    const p = await context.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.goto(url); await p.locator('h1').waitFor(); await p.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    const flat = p.locator('[data-exercise-id="flat_db_press"]');
    await flat.locator('[data-set-field="kg"]').fill('65'); await flat.locator('[data-set-field="reps"]').fill('10');
    await poll(() => stored(p), s => s.sessions[0]?.exercises[0].sets[0].reps === 10, 'Eerste invoer opgeslagen');
    await p.evaluate(() => localStorage.setItem('ritme-update-fixture', 'behouden'));
    await settings(p); assert.match(await p.locator('.app-build').textContent(), new RegExp(first.slice(0, 12)));
    await check(p, 'latest'); assert.match(await p.locator('[data-update-status]').textContent(), /nieuwste beschikbare versie/);
    await p.locator('#theme').selectOption('dark');
    await poll(() => stored(p), s => s.settings.theme === 'dark', 'Eigen voorkeur opgeslagen');
    const before = await stored(p);
    // A real second production artifact, same origin and a changed content hash.
    await writeFile(path.join(source, 'training.css'), '\n/* update-fixture-b */\n', { flag: 'a' });
    const second = await buildPages(source, output, 'update-fixture-b'); assert.notEqual(first, second);
    await check(p, 'available'); assert.equal(await p.locator('.app-build').textContent(), `Appversie 2.2.0 · build ${first.slice(0, 12)}`);
    assert.deepEqual(await stored(p), before); // Checking never writes training data or reloads.
    await p.locator('.app-updates').screenshot({path:'/tmp/ritme-ux-updates.png'});
    await p.locator('.mobile-nav [data-page="home"]').click();
    // Hold a genuine IndexedDB save open. Installation must not activate or reload yet.
    await p.evaluate(async () => {
      const { LocalStore } = await import('./storage.mjs'), save = LocalStore.prototype.save;
      LocalStore.prototype.save = async function(...args) {
        window.pendingSnapshot = structuredClone(args[0]); window.updateSentinel = true;
        await new Promise(resolve => window.finishPendingSave = resolve);
        return save.apply(this, args);
      };
    });
    await flat.locator('[data-set-field="kg"]').fill('70'); await p.waitForFunction(() => Boolean(window.finishPendingSave));
    const expected = await p.evaluate(() => ({ ...window.pendingSnapshot, revision: window.pendingSnapshot.revision + 1 }));
    await p.locator('[data-action="apply-update"]').click();
    await p.waitForFunction(() => document.querySelector('#app').inert);
    assert.equal(await p.evaluate(() => window.updateSentinel), true);
    assert.equal((await stored(p)).sessions[0].exercises[0].sets[0].kg, 65);
    assert.equal(await p.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration()).waiting)), true);
    const reloaded = p.waitForEvent('load'); await p.evaluate(() => window.finishPendingSave()); await reloaded;
    await p.locator('h1').waitFor(); assert.deepEqual(await stored(p), expected);
    assert.equal(await p.evaluate(() => localStorage.getItem('ritme-update-fixture')), 'behouden');
    assert.equal(await flat.locator('[data-set-field="kg"]').inputValue(), '70');
    await settings(p); assert.match(await p.locator('.app-build').textContent(), new RegExp(second.slice(0, 12)));
    assert.equal(await p.locator('#theme').inputValue(),'dark');
    await check(p, 'latest');
    await context.setOffline(true); await check(p, 'error'); assert.match(await p.locator('[data-update-status]').textContent(), /Geen internet/);
    assert.deepEqual(await stored(p), expected); await context.setOffline(false);
    await context.route('**/release.json?*', route => route.fulfill({ status: 503, body: 'Publicatie tijdelijk niet beschikbaar' }));
    await check(p, 'error'); assert.match(await p.locator('[data-update-status]').textContent(), /niet bereikbaar/);
    await context.unroute('**/release.json?*');
    await context.route('**/release.json?*', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"version":"2.2.0"}' }));
    await check(p, 'error'); assert.match(await p.locator('[data-update-status]').textContent(), /niet worden gelezen/);
    await context.unroute('**/release.json?*');
    // A third build may download in the background, but failed saving must block activation.
    await writeFile(path.join(source, 'training.css'), '\n/* update-fixture-c */\n', { flag: 'a' });
    await buildPages(source, output, 'update-fixture-c'); await check(p, 'available');
    await p.locator('.mobile-nav [data-page="home"]').click();
    await p.evaluate(async () => { const { LocalStore } = await import('./storage.mjs'); window.restoreSave = LocalStore.prototype.save; LocalStore.prototype.save = async () => { throw Error('Testopslagfout'); }; window.noReloadOnFailure = true; });
    await flat.locator('[data-set-field="kg"]').fill('75'); await p.locator('#storage-error [role="alert"]').waitFor();
    await p.locator('[data-action="apply-update"]').click();
    await p.waitForFunction(() => !document.querySelector('#app').inert);
    await settings(p); await p.locator('[data-update-status][data-phase="error"]').waitFor();
    assert.match(await p.locator('[data-update-status]').textContent(), /niet veilig opgeslagen/);
    assert.equal(await p.evaluate(() => window.noReloadOnFailure), true);
    assert.deepEqual(await stored(p), expected);
    await p.evaluate(async () => { const { LocalStore } = await import('./storage.mjs'); LocalStore.prototype.save = window.restoreSave; });
    await p.locator('[data-action="retry-save"]').click();
    await poll(() => stored(p), s => s.sessions[0].exercises[0].sets[0].kg === 75, 'Invoer herstelbaar na geblokkeerde update');
    await context.close(); context = null;

    // Migration from the old cache without build-info: notify the old page without reloading it.
    const legacyAssets = ['index.html','app.mjs','core.mjs','storage.mjs','updates.mjs','exercise-guides.mjs','progress.mjs','styles.css','training.css','manifest.webmanifest','program.json'];
    await writeFile(path.join(output, 'sw.js'), `const CACHE='ritme:/Fitness-app/:legacy-fixture';const ASSETS=${JSON.stringify(legacyAssets)};
      self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
      self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
      self.addEventListener('fetch',e=>{if(e.request.method==='GET')e.respondWith(caches.open(CACHE).then(async c=>(await c.match(e.request,{ignoreSearch:true}))||fetch(e.request)));});`);
    legacy = await browser.newContext({ viewport: { width: 390, height: 844 } }); const old = await legacy.newPage();
    old.on('pageerror', e => errors.push(e.message)); await old.goto(url); await old.locator('h1').waitFor();
    await old.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await old.evaluate(() => { window.originalController = navigator.serviceWorker.controller; window.legacySentinel = true; localStorage.setItem('legacy-marker','intact'); });
    const oldState = await stored(old);
    await writeFile(path.join(source, 'training.css'), '\n/* update-fixture-d */\n', { flag: 'a' });
    const last = await buildPages(source, output, 'update-fixture-d');
    await old.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
    await old.waitForFunction(() => navigator.serviceWorker.controller !== window.originalController);
    const worker = await old.evaluate(async () => (await import('./updates.mjs')).workerBuild(navigator.serviceWorker.controller));
    assert.equal(worker.contentHash, last); assert.equal(await old.evaluate(() => window.legacySentinel), true);
    assert.equal(await old.evaluate(() => localStorage.getItem('legacy-marker')), 'intact'); assert.deepEqual(await stored(old), oldState);
    assert.deepEqual(errors, []);
    console.log('PWA-updates geslaagd: echte builds A→B, nieuwste/offline/503/ongeldige metadata, wachten op IndexedDB, opslagfout blokkeert reload, historie/voorkeuren behouden en oude PWA veilig gemigreerd.');
  } finally { await context?.close(); await legacy?.close(); server?.kill(); await rm(temp, {recursive:true,force:true}); }
}
