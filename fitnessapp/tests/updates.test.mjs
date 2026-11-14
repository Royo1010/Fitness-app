import test from 'node:test';
import assert from 'node:assert/strict';
import { AppUpdates, releaseInfo } from '../dist/updates.mjs';
const release = char => ({ version: '2.2.0', contentHash: char.repeat(64), commit: 'commit-' + char });
function fixture(options = {}) {
  const current = release('a'), next = release('b'), events = [];
  const container = new EventTarget(), reg = new EventTarget();
  const makeWorker = info => ({ postMessage(message, ports) {
    if (message.type === 'RITME_BUILD') ports[0].postMessage(info);
    if (message.type === 'ACTIVATE_UPDATE') { events.push('activate'); container.controller = this; reg.waiting = null; reg.active = this; container.dispatchEvent(new Event('controllerchange')); }
  } });
  container.controller = reg.active = makeWorker(current); reg.waiting = makeWorker(next);
  reg.update = async () => { events.push('update'); };
  const app = new AppUpdates({ current, registration: Promise.resolve(reg), container, online: () => true,
    fetcher: async (url, init) => { events.push('fetch'); assert.match(url, /release.json\?check=/); assert.equal(init.cache, 'no-store'); return {ok:true,json:async()=>next}; },
    save: async () => { events.push('save'); }, reload: () => events.push('reload'), timeout: 100, ...options });
  return { app, reg, container, current, next, events, makeWorker };
}
test('geen update: echte netwerkcontrole en workercontrole, zonder reload', async () => {
  const f = fixture({fetcher: async () => ({ok:true,json:async()=>release('a')})});
  await f.app.check(); assert.equal(f.app.state.phase, 'latest'); assert.deepEqual(f.events, ['update']);
});
test('nieuwere build wordt gedetecteerd; controleren activeert of herlaadt niet', async () => {
  const f = fixture(); await f.app.check();
  assert.equal(f.app.state.phase, 'available'); assert.equal(f.app.state.target.contentHash, f.next.contentHash);
  assert.deepEqual(f.events, ['fetch', 'update']);
});
test('installatie wacht op bewaren en activeert/herlaadt vervolgens precies eenmaal', async () => {
  let finishSave, saving;
  const started = new Promise(resolve => saving = resolve);
  const f = fixture({save: async () => { saving(); await new Promise(resolve => finishSave = resolve); }});
  await f.app.check(); const install = f.app.install(); await started;
  assert.equal(f.app.state.phase, 'installing'); assert.ok(!f.events.includes('activate')); assert.ok(!f.events.includes('reload'));
  await f.app.install(); finishSave(); await install;
  assert.deepEqual(f.events.slice(-2), ['activate', 'reload']);
  assert.equal(f.events.filter(e => e === 'reload').length, 1);
});
test('opslagfout blokkeert activatie en reload; dezelfde training blijft herstelbaar', async () => {
  const f = fixture({save: async () => {throw new Error('Je invoer is nog niet veilig opgeslagen.');}});
  await f.app.check(); await f.app.install();
  assert.equal(f.app.state.phase, 'error'); assert.match(f.app.state.message, /opgeslagen/);
  assert.ok(!f.events.includes('activate') && !f.events.includes('reload')); assert.ok(f.reg.waiting);
});
test('offline, HTTP-fout, kapotte metadata, netwerkfout en ontbrekende worker zijn duidelijke fouten', async () => {
  for (const options of [
    {online:()=>false}, {fetcher:async()=>({ok:true,json:async()=>{throw new SyntaxError('HTML instead of JSON');}})}, {fetcher:async()=>({ok:false})}, {fetcher:async()=>({ok:true,json:async()=>({version:'2.2.0'})})},
    {fetcher:async()=>{throw new TypeError('network');}}, {container:null}, {current:{version:'2.2.0',contentHash:null}},
  ]) {
    const f = fixture(options); await f.app.check(); assert.equal(f.app.state.phase, 'error');
    assert.ok(f.app.state.message.length > 20); assert.ok(!f.events.includes('reload'));
  }
});
test('een onvolledig uitgerolde worker wordt niet ten onrechte geïnstalleerd', async () => {
  const f = fixture({timeout:20}); f.reg.waiting = null;
  await f.app.check(); assert.equal(f.app.state.phase, 'error'); assert.match(f.app.state.message, /niet volledig/);
  assert.ok(!f.events.includes('reload'));
});
test('publicatie verandert na controleren: installeert de nu gepubliceerde build', async () => {
  const f = fixture(); await f.app.check();
  const newer = release('c'); f.app.fetcher = async () => ({ok:true,json:async()=>newer}); f.reg.waiting = f.makeWorker(newer);
  await f.app.install(); assert.equal(f.container.controller, f.reg.active); assert.ok(f.events.includes('reload'));
});
test('metadata vereist een geldige inhoudshash, niet alleen een handmatig versienummer', () => {
  assert.throws(() => releaseInfo({version:'2.2.0',contentHash:'oud'}));
  assert.deepEqual(releaseInfo(release('a')), release('a'));
});

test('een vastgelopen registratie of scriptcontrole blijft niet eindeloos controleren', async () => {
  for (const where of ['registration','update']) {
    const f=fixture({timeout:20});
    if(where==='registration')f.app.registration=new Promise(()=>{});else f.reg.update=()=>new Promise(()=>{});
    await f.app.check();assert.equal(f.app.state.phase,'error');assert.match(f.app.state.message,/duurt te lang/);assert.ok(!f.events.includes('reload'));
  }
});
