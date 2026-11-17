import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { positionAtEdge, scrollLayout, assertScrollLayout } from './scroll-layout.mjs';
import { startupProxy, assertStartupSurface } from './test-startup.mjs';

// Real Linux WebKitGTK via its W3C driver. Not Safari's native iOS/PWA shell.
// Start WebKitWebDriver separately; no Selenium dependency or personal profile.
const driver = process.env.WEBKIT_WEBDRIVER_URL || 'http://127.0.0.1:9515';
const url = process.env.RITME_BROWSER_URL || 'http://127.0.0.1:4173/Fitness-app/';
let session, proxy;
async function call(method, endpoint, data) {
  const response = await fetch(driver + endpoint, {
    method, headers: { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data), signal: AbortSignal.timeout(45000),
  });
  const { value } = await response.json();
  if (!response.ok || value?.error) throw new Error(JSON.stringify(value));
  return value;
}
const command = (method, endpoint, data) => call(method, `/session/${session}${endpoint}`, data);
const evaluate = (fn, arg) => command('POST', '/execute/sync', { script: `return (${fn.toString()})(arguments[0]);`, args: [arg ?? null] });
async function asyncEvaluate(fn) {
  const value = await command('POST', '/execute/async', {
    script: `const done=arguments[arguments.length-1];Promise.resolve((${fn.toString()})()).then(result=>done({result}),error=>done({error:String(error)}));`, args: [],
  });
  if (value.error) throw new Error(value.error);
  return value.result;
}
async function click(selector) {
  const element = await command('POST', '/element', { using: 'css selector', value: selector });
  await command('POST', `/element/${element['element-6066-11e4-a52e-4f735466cecf']}/click`, {});
}
async function waitFor(fn) {
  const deadline = Date.now() + 15000;
  do { if (await evaluate(fn)) return; await new Promise(r => setTimeout(r, 50)); } while (Date.now() < deadline);
  throw new Error('WebKit-proef wachtte te lang op: ' + fn.toString());
}
async function screenshot(path) { await writeFile(path, Buffer.from(await command('GET', '/screenshot'), 'base64')); }

try {
  const alwaysMatch = { browserName: 'MiniBrowser', pageLoadStrategy:'eager' };
  if (process.env.WEBKIT_BROWSER_BINARY) alwaysMatch['webkitgtk:browserOptions'] = { binary: process.env.WEBKIT_BROWSER_BINARY, args: ['--automation'] };
  const result = await call('POST', '/session', { capabilities: { alwaysMatch } });
  session = result.sessionId;
  await command('POST', '/window/rect', { width: 390, height: 844 });
  proxy = await startupProxy(url);
  const startup = [];
  for (const theme of ['light','dark']) {
    proxy.hold();
    await command('POST','/url',{url:proxy.url+'?startupTheme='+theme+'#schema'});
    await waitFor(()=>Boolean(document.querySelector('.boot')) && window.startupFrames?.length > 0);
    const frames = await evaluate(()=>window.startupFrames);
    assert.ok(frames.length > 0,'WebKit heeft vóór interactie startframes gemeten');
    for (const frame of frames) assertStartupSurface(frame,theme,47);
    assert.deepEqual(await evaluate(()=>window.startupScrollCalls),[]);
    proxy.release(); await waitFor(()=>Boolean(document.querySelector('.exercise-card')));
    const saved = await asyncEvaluate(async()=>{
      const {LocalStore}=await import('./storage.mjs'); const store=await new LocalStore().open();
      try {
        const state=await store.load();
        state.settings.theme=new URLSearchParams(location.search).get('startupTheme')==='dark'?'light':'dark';
        await store.save(state,state.revision); return await store.load();
      } finally { store.db.close(); }
    });
    proxy.hold(); await command('POST','/refresh',{});
    await waitFor(()=>Boolean(document.querySelector('.boot')) && window.startupFrames?.length > 0);
    const reloadedFrames = await evaluate(()=>window.startupFrames);
    for (const frame of reloadedFrames) assertStartupSurface(frame,theme,47);
    proxy.release(); await waitFor(()=>Boolean(document.querySelector('.exercise-card')));
    assertStartupSurface(await evaluate(()=>window.startupSurface()),saved.settings.theme,47);
    assert.deepEqual(await evaluate(()=>window.startupScrollCalls),[]);
    assert.deepEqual(await asyncEvaluate(async()=>{
      const {LocalStore}=await import('./storage.mjs');const store=await new LocalStore().open();
      try{return await store.load();}finally{store.db.close();}
    }),saved,'WebKit-start bewaart de volledige opgeslagen staat');
    startup.push({theme,frames:frames.length,reloadedFrames:reloadedFrames.length});
  }
  await proxy.close(); proxy = null;
  await command('POST', '/url', { url }); await waitFor(() => Boolean(document.querySelector('.exercise-card')));
  const actualViewport = await evaluate(() => ({ width: innerWidth, height: innerHeight }));
  const build = await asyncEvaluate(async () => (await import('./build-info.mjs')).BUILD);
  const readState = () => asyncEvaluate(async () => {
    const { LocalStore } = await import('./storage.mjs'); const store = await new LocalStore().open();
    try { return await store.load(); } finally { store.db.close(); }
  });
  const before = await readState();
  for (const top of [0, 47]) {
    // GTK has no iPhone notch. This tests CSS geometry under a synthetic inset,
    // not native env() values or the iOS system's scroll-edge compositing.
    await evaluate(top => document.documentElement.style.setProperty('--safe-top', top + 'px'), top);
    for (const theme of ['light', 'dark']) {
      for (const [page, selector] of [['home','.exercise-name'],['schema','.schema-row strong'],['stats','h1'],['library','.library-item h3'],['more','.more-list strong']]) {
        await click(`.mobile-nav [data-page="${page}"]`);
        await evaluate(theme => document.documentElement.dataset.theme = theme, theme);
        assert.equal(await evaluate(() => scrollY), 0, 'Navigeren reset de document-scrollpositie');
        for (const offset of [2,-3]) {
          await evaluate(positionAtEdge, {selector,offset});
          assertScrollLayout(await evaluate(scrollLayout, {selector}), top);
        }
        if (page === 'home') await screenshot(`/tmp/ritme-webkit-scroll-${theme}-${top}.png`);
      }
      await click('.more-list [data-page="settings"]');
      await evaluate(theme => document.documentElement.dataset.theme = theme, theme);
      await evaluate(positionAtEdge, {selector:'.settings-grid h2',offset:-3});
      assertScrollLayout(await evaluate(scrollLayout, {selector:'.settings-grid h2'}), top);
      await click('.mobile-nav [data-page="library"]');
      await evaluate(theme => document.documentElement.dataset.theme = theme, theme);
      await click('.library-item');
      const backgroundY = await evaluate(() => scrollY);
      await evaluate(() => { document.querySelector('#modal').scrollTop = 500; });
      const modal = await evaluate(() => {
        const el = document.querySelector('#modal'), header = el.querySelector('.modal-head');
        return { top:el.getBoundingClientRect().top, header:header.getBoundingClientRect().top, scroll:el.scrollTop, root:scrollY, blur:getComputedStyle(el,'::backdrop').backdropFilter || 'none' };
      });
      assert.ok(modal.top >= top && modal.header >= top); assert.ok(modal.scroll > 0);
      assert.equal(modal.root,backgroundY); assert.equal(modal.blur,'none');
      await click('#modal [data-action="close-modal"]');
      assert.equal(await evaluate(() => scrollY), backgroundY);
    }
  }
  await click('.mobile-nav [data-page="home"]');
  const viewports = [];
  for (const requested of [{width:320,height:568},{width:390,height:500},{width:844,height:390},{width:390,height:844}]) {
    await command('POST','/window/rect',requested);
    viewports.push(await evaluate(() => ({width:innerWidth,height:innerHeight})));
    await evaluate(positionAtEdge,{selector:'.exercise-name',offset:-3});
    assertScrollLayout(await evaluate(scrollLayout,{selector:'.exercise-name'}),47);
  }
  await evaluate(() => { window.scrollTo(0,0);document.querySelector('#app').focus({preventScroll:true}); });
  await command('POST','/actions',{actions:[{type:'key',id:'keyboard',actions:[{type:'keyDown',value:'\uE00F'},{type:'keyUp',value:'\uE00F'}]}]});
  await waitFor(() => scrollY > 0);
  assert.equal(await evaluate(() => document.querySelector('#app').scrollTop),0);
  await evaluate(() => { document.querySelector('input[data-set-field]:last-of-type')?.focus(); });
  assert.equal(await evaluate(() => document.querySelector('#app').scrollTop),0);
  assert.deepEqual(await readState(),before,'Weergave-/scrollproef verandert geen opgeslagen gegevens');
  console.log(JSON.stringify({ engine:'WebKitGTK', capabilities:result.capabilities, startup, actualViewport, viewports, build, checks:'startframes via testproxy; nul startup-scrollaanroepen; native document-scrolling; viewport-rand; 0/47px; zes schermen; licht/donker; dialoog; toetsenbord/focus; resize; gegevensbehoud', limitation:'Linux WebKitGTK; geen native iOS Safari of geïnstalleerde iPhone-PWA. GTK kan een minimale vensterbreedte afdwingen.' }));
} finally { if (session) await command('DELETE',''); if (proxy) await proxy.close(); }
