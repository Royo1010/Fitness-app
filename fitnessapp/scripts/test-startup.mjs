import assert from 'node:assert/strict';
import { createServer } from 'node:http';

// WebDriver has no portable addInitScript API. A loopback-only test proxy adds
// the observer to the served production HTML; all other app assets stay intact.
// Synthetic inset/media/standalone flags test JS/CSS, not native iOS behavior.
export async function startupProxy(source) {
  let releaseProgram;
  let hold = new Promise(resolve=>{ releaseProgram=resolve; });
  const server = createServer(async (req,res) => {
    try {
      const target = new URL(req.url,source);
      if (target.pathname.endsWith('/sw.js')) { res.writeHead(404); res.end(); return; }
      const response = await fetch(target);
      const type = response.headers.get('content-type') || 'application/octet-stream';
      let body = Buffer.from(await response.arrayBuffer());
      if (type.includes('text/html')) {
        const setup = `const media=window.matchMedia.bind(window);window.matchMedia=query=>{const result=media(query);if(query==='(prefers-color-scheme: dark)')Object.defineProperty(result,'matches',{value:new URLSearchParams(location.search).get('startupTheme')==='dark'});return result;};Object.defineProperty(navigator,'standalone',{value:true});`;
        body = Buffer.from(body.toString().replace('<head>',`<head><script>${setup}(${observeStartup.toString()})();</script><style>html{--safe-top:47px!important}</style>`));
      }
      if (target.pathname.endsWith('/program.json')) await hold;
      res.writeHead(response.status,{'Content-Type':type,'Cache-Control':'no-store'}); res.end(body);
    } catch (error) { res.writeHead(502); res.end(String(error)); }
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  return {
    url:`http://127.0.0.1:${server.address().port}${new URL(source).pathname}`,
    hold:()=>{hold=new Promise(resolve=>{releaseProgram=resolve;});}, release:()=>releaseProgram(),
    close:()=>new Promise(resolve=>{releaseProgram();server.close(resolve);server.closeAllConnections();}),
  };
}

// Runs before the document's scripts in an isolated browser profile. Observes
// startup only; never moves the page or changes application storage.
export function observeStartup() {
  window.startupScrollCalls = [];
  for (const [object, key] of [[window,'scrollTo'], [window,'scrollBy'], [Element.prototype,'scrollIntoView'], [Element.prototype,'scrollTo'], [Element.prototype,'scrollBy']]) {
    const original = object[key];
    if (original) object[key] = function (...args) {
      window.startupScrollCalls.push(key);
      return original.apply(this, args);
    };
  }
  const scrollTop = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTop');
  Object.defineProperty(Element.prototype, 'scrollTop', { ...scrollTop, set(value) {
    window.startupScrollCalls.push('scrollTop:' + this.id);
    scrollTop.set.call(this, value);
  } });
  window.startupSurface = () => {
    const app = document.querySelector('#app'), root = document.documentElement;
    return {
      y: scrollY, rootOverflow: getComputedStyle(root).overflowY,
      bodyPosition: getComputedStyle(document.body).position,
      appPosition: getComputedStyle(app).position, appOverflow: getComputedStyle(app).overflowY,
      appTop: app.getBoundingClientRect().top,
      rootHeight: document.scrollingElement.clientHeight,
      rootScrollHeight: document.scrollingElement.scrollHeight,
      appHeight: app.clientHeight, appScroll: app.scrollTop, viewportHeight: innerHeight,
      cap: getComputedStyle(document.body,'::before').content,
      bg: getComputedStyle(root).backgroundColor,
      themeColor: document.querySelector('meta[name="theme-color"]').content,
      theme: root.dataset.theme,
    };
  };
  window.startupFrames = [];
  const observe = () => {
    if (document.querySelector('#app') && getComputedStyle(document.documentElement).getPropertyValue('--field')) {
      window.startupFrames.push(window.startupSurface());
    }
    if (!document.querySelector('.exercise-card')) requestAnimationFrame(observe);
  };
  requestAnimationFrame(observe);
}

export function assertStartupSurface(surface, theme, inset) {
  const hex = theme === 'dark' ? '#131917' : '#eef2f5';
  const rgb = `rgb(${[1,3,5].map(i => parseInt(hex.slice(i,i+2),16)).join(', ')})`;
  assert.equal(surface.y, 0, 'Geen scrollbeweging nodig bij het openen');
  assert.equal(surface.bodyPosition, 'fixed', 'Herstelde viewport staat vanaf openen vast');
  assert.equal(surface.appPosition, 'absolute');
  assert.equal(surface.appOverflow, 'auto', 'App is vanaf openen het begrensde scrollvlak');
  assert.equal(surface.rootOverflow, 'hidden', 'Document schuift niet onder de iOS-statusbalk');
  assert.ok(surface.rootScrollHeight <= surface.rootHeight, 'Root krijgt ook tijdens laden geen scrollruimte');
  assert.equal(surface.appScroll,0);
  assert.ok(Math.abs(surface.appTop - inset) < 1, 'Scrollvlak begint onder de statusbalk');
  assert.ok(Math.abs(surface.appHeight + inset - surface.viewportHeight) < 1);
  assert.equal(surface.cap,'none','Geen afdeklaag bij opstarten');
  if (theme !== 'boot') assert.equal(surface.theme, theme);
  assert.equal(surface.bg, rgb, 'Kleurenpalet van vóór PR #11 blijft behouden');
  assert.equal(surface.themeColor.toLowerCase(),'#1d4239','PWA-themametadata van vóór de regressie blijft behouden');
}

export async function testStartup(browser, url) {
  for (const colorScheme of ['light','dark']) {
    const context = await browser.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, colorScheme, serviceWorkers:'block' });
    try {
      const page = await context.newPage();
      await page.addInitScript(observeStartup);
      // Exercise the app's standalone launch path. This flag does NOT create
      // Safari's native iOS shell or emulate its compositor.
      await page.addInitScript(() => Object.defineProperty(navigator,'standalone',{value:true,configurable:true}));
      const cdp = await context.newCDPSession(page);
      await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{top:47,bottom:34,left:0,right:0}});
      let releaseProgram, requestedProgram;
      let hold = new Promise(resolve => { releaseProgram = resolve; });
      let requested = new Promise(resolve => { requestedProgram = resolve; });
      await page.route('**/program.json',async route => { requestedProgram(); await hold; await route.continue(); });
      const navigation = page.goto(url + '#schema');
      await requested;
      await page.locator('.boot').waitFor();
      await page.waitForFunction(() => window.startupFrames.length > 0);
      for (const frame of await page.evaluate(() => window.startupFrames)) assertStartupSurface(frame,'boot',47);
      assert.deepEqual(await page.evaluate(() => window.startupScrollCalls),[]);
      releaseProgram(); await navigation;
      await page.locator('.exercise-card').first().waitFor();
      assertStartupSurface(await page.evaluate(() => window.startupSurface()),'light',47);
      // The standalone path opens Training, regardless of the old hash.
      assert.equal(await page.locator('.mobile-nav [data-page="home"]').getAttribute('aria-current'),'page');
      assert.deepEqual(await page.evaluate(() => window.startupScrollCalls),[]);
      const savedTheme = colorScheme === 'light' ? 'dark' : 'light';
      const saved = await page.evaluate(async theme => {
        const {LocalStore} = await import('./storage.mjs'); const store = await new LocalStore().open();
        try { const state = await store.load(); state.settings.theme = theme; await store.save(state,state.revision); return await store.load(); }
        finally { store.db.close(); }
      },savedTheme);
      // Reload with a saved preference opposite to the OS. Observe both the
      // boot surface and the later, asynchronous IndexedDB preference.
      hold = new Promise(resolve => { releaseProgram = resolve; });
      requested = new Promise(resolve => { requestedProgram = resolve; });
      const reload = page.reload(); await requested;
      await page.waitForFunction(() => window.startupFrames.length > 0);
      assertStartupSurface(await page.evaluate(() => window.startupSurface()),'boot',47);
      releaseProgram(); await reload; await page.locator('.exercise-card').first().waitFor();
      assertStartupSurface(await page.evaluate(() => window.startupSurface()),savedTheme,47);
      assert.deepEqual(await page.evaluate(() => window.startupScrollCalls),[],'Ook heropenen gebruikt geen scrolltruc');
      assert.deepEqual(await page.evaluate(async () => {
        const {LocalStore} = await import('./storage.mjs'); const store = await new LocalStore().open();
        try { return await store.load(); } finally { store.db.close(); }
      }),saved,'Openen behoudt bestaande opgeslagen gegevens exact');
    } finally { await context.close(); }
  }
  console.log('Startproef geslaagd: vóór interactie, vertraagd programma, opgeslagen thema, hersteld app-scrollvlak vanaf eerste frame, geen root-scrollruimte/afdeklaag en nul automatische scrollaanroepen. Standalone-JS-pad; geen native iOS-shell.');
}
