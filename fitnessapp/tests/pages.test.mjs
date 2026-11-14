import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { buildPages } from '../scripts/build-pages.mjs';

test('Pages-build is herhaalbaar, cache verandert bij gewijzigde bron, opslag blijft intact', async () => {
  const temp = await mkdtemp(path.join(tmpdir(), 'ritme-pages-'));
  try {
    const source = path.join(temp, 'source'), output = path.join(temp, 'site');
    await cp(new URL('../dist/', import.meta.url), source, { recursive: true });
    const originalWorker = await readFile(path.join(source, 'sw.js'), 'utf8');
    const first = await buildPages(source, output, 'commit-one');
    const firstWorker = await readFile(path.join(output, 'sw.js'), 'utf8');
    assert.equal(await buildPages(source, output, 'commit-two'), first);
    assert.equal(await readFile(path.join(output, 'sw.js'), 'utf8'), firstWorker);
    await writeFile(path.join(output, 'stale.txt'), 'obsolete');
    await writeFile(path.join(source, 'training.css'), '\n/* gewijzigde stijl */\n', { flag: 'a' });
    const second = await buildPages(source, output, 'commit-three');
    assert.notEqual(second, first);
    await assert.rejects(readFile(path.join(output, 'stale.txt')), { code: 'ENOENT' });
    const worker = await readFile(path.join(output, 'sw.js'), 'utf8');
    assert.notEqual(worker, firstWorker);
    assert.equal(await readFile(path.join(source, 'sw.js'), 'utf8'), originalWorker);
    for (const file of ['storage.mjs', 'core.mjs', 'program.json', 'manifest.webmanifest']) {
      assert.deepEqual(await readFile(path.join(output, file)), await readFile(path.join(source, file)));
    }
    assert.deepEqual(JSON.parse(await readFile(path.join(output, 'release.json'))), { version: '2.2.0', commit: 'commit-three', contentHash: second });
    assert.equal(await readFile(path.join(output, '.nojekyll'), 'utf8'), '');
    // Voer de gegenereerde worker uit: alle offline-assets bestaan onder het Pages-subpad.
    const events = {}; let requests, pending;
    vm.runInNewContext(worker, { URL, Request, Set, self: {
      location: { href: 'https://royo1010.github.io/Fitness-app/sw.js' },
      addEventListener: (type, fn) => events[type] = fn, skipWaiting: async () => {}
    }, caches: { open: async () => ({ addAll: async value => requests = value }) } });
    events.install({ waitUntil: promise => pending = promise }); await pending;
    assert.ok(requests.length >= 12);
    for (const request of requests) {
      const url = new URL(request.url);
      assert.ok(url.pathname.startsWith('/Fitness-app/'));
      await readFile(path.join(output, url.pathname.slice('/Fitness-app/'.length) || 'index.html'));
    }
    assert.doesNotMatch(worker, /indexedDB|deleteDatabase/);
  } finally { await rm(temp, { recursive: true, force: true }); }
});

test('Pages-build weigert broncode als uitvoermap', async () => {
  const source = new URL('../dist/', import.meta.url).pathname;
  await assert.rejects(buildPages(source, source), /gescheiden/);
  await assert.rejects(buildPages(source, path.join(source, 'output')), /gescheiden/);
});
