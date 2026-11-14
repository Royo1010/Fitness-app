import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:net';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const profile=await mkdtemp(path.join(tmpdir(),'ritme22-browser-'));
const legacyProgram=JSON.parse(await readFile(new URL('../tests/fixtures/program-v2.1.json',import.meta.url)));
let server,context,url=process.env.RITME_BROWSER_URL;
const errors=[];
const launch=()=>chromium.launchPersistentContext(profile,{executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,timezoneId:'Europe/Amsterdam',args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const watch=p=>p.on('pageerror',e=>errors.push(e.message));
const card=(p,id)=>p.locator(`[data-exercise-id="${id}"]`);
const state=p=>p.evaluate(async()=>{const {LocalStore}=await import('./storage.mjs');const store=await new LocalStore().open();try{return await store.load()}finally{store.db.close()}});
const settled=p=>p.waitForTimeout(350);
async function selectStoredTheme(p, theme) {
 await p.locator('#theme').selectOption(theme);
 await p.locator('#theme').blur();
 // Poll from Node: waitForFunction in Playwright 1.56 treats an async predicate
 // as a truthy Promise, even when that Promise eventually resolves to false.
 const deadline=Date.now()+10000;
 let stored;
 do {
  stored=await p.evaluate(async()=>{
   const {LocalStore}=await import('./storage.mjs');
   const store=await new LocalStore().open();
   try { return {theme:(await store.load()).settings.theme,pending:window.themeWritesPending}; }
   finally { store.db.close(); }
  });
  if(stored.theme===theme && stored.pending===0){
   assert.equal(await p.locator('html').getAttribute('data-theme'),theme);
   return;
  }
  await p.waitForTimeout(25);
 } while(Date.now()<deadline);
 assert.fail(`Thema ${theme} niet volledig opgeslagen: ${JSON.stringify(stored)}`);
}
async function pageReady(p){await p.locator('h1').waitFor();}
async function finish(p){for(const id of await p.locator('.exercise-card').evaluateAll(elements=>elements.map(e=>e.dataset.exerciseCard))){const checkbox=p.locator(`[data-exercise-card="${id}"] .set-check`);if(await checkbox.getAttribute('aria-pressed')==='false'){await checkbox.click();await settled(p);}}assert.ok(await p.locator('.checklist-complete').isVisible());await p.locator('[data-action="finish"]').click();await settled(p);}
async function settings(p){await p.locator('.mobile-nav [data-page="more"]').click();await p.locator('.more-list [data-page="settings"]').click();}
async function download(p,action){const pending=p.waitForEvent('download');await p.locator(`[data-action="${action}"]`).click();const result=await pending;const filename=await result.path();return {result,text:await readFile(filename,'utf8'),filename};}
try{
 if(!url){const socket=createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));const port=socket.address().port;await new Promise(r=>socket.close(r));url=`http://127.0.0.1:${port}/Fitness-app/`;
  server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,PORT:String(port),RITME_TEST_DATE:process.env.RITME_BROWSER_DATE||'2026-11-14T12:00:00Z'},stdio:['ignore','pipe','pipe']});
  await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Testserver start niet')),10000);server.once('error',reject);server.once('exit',c=>{clearTimeout(t);reject(Error('Testserver gestopt: '+c))});server.stdout.once('data',()=>{clearTimeout(t);resolve()});});
 }
 context=await launch();let p=await context.newPage();watch(p);await p.goto(url);await pageReady(p);
 assert.match(await p.locator('h1').textContent(),/^Upper A2?$/);assert.equal(await p.locator('.set-row').count(),8);assert.equal(await p.locator('.topbar,.warmup-compact,.training-notes').count(),0);
 assert.equal(await card(p,'flat_db_press').locator('.set-check').isEnabled(),true); // Werkt ook vóór 30 november.
 await p.setViewportSize({width:320,height:700});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.setViewportSize({width:390,height:844});
 const flat=card(p,'flat_db_press');await flat.locator('[data-set-field="kg"]').fill('20');await flat.locator('[data-set-field="reps"]').fill('10');
 const plus=flat.locator('[data-field="kg"][data-direction="1"]'),minus=flat.locator('[data-field="kg"][data-direction="-1"]');
 await plus.evaluate(el=>window.testStepButton=el);assert.equal(await plus.evaluate(el=>getComputedStyle(el).touchAction),'manipulation');
 const scale=await p.evaluate(()=>visualViewport.scale),point=await plus.boundingBox();await p.touchscreen.tap(point.x+point.width/2,point.y+point.height/2);await p.touchscreen.tap(point.x+point.width/2,point.y+point.height/2);await settled(p);
 assert.equal(await flat.locator('[data-set-field="kg"]').inputValue(),'25');assert.equal(await plus.evaluate(el=>el===window.testStepButton),true);assert.equal(await p.evaluate(()=>visualViewport.scale),scale);
 await minus.click();assert.equal(await flat.locator('[data-set-field="kg"]').inputValue(),'22,5');
 await flat.locator('[data-set-field="kg"]').fill('62,5');await plus.click();assert.equal(await flat.locator('[data-set-field="kg"]').inputValue(),'65');assert.equal(await flat.locator('.set-check').getAttribute('aria-pressed'),'false');
 const checkPoint=await flat.locator('.set-check').boundingBox();await p.touchscreen.tap(checkPoint.x+checkPoint.width/2,checkPoint.y+checkPoint.height/2);await p.touchscreen.tap(checkPoint.x+checkPoint.width/2,checkPoint.y+checkPoint.height/2);await settled(p);assert.equal(await p.evaluate(()=>visualViewport.scale),scale);assert.equal(await p.locator('.exercise-done').count(),1);
 await flat.locator('[data-set-field="kg"]').fill('');assert.equal(await flat.locator('.set-check').getAttribute('aria-pressed'),'true');await flat.locator('[data-set-field="kg"]').fill('65');
 await p.reload();await pageReady(p);assert.notEqual(await p.locator('.exercise-card').first().getAttribute('data-exercise-id'),'flat_db_press');
 await context.close();context=await launch();p=await context.newPage();watch(p);await p.goto(url);await pageReady(p);
 assert.notEqual(await p.locator('.exercise-card').first().getAttribute('data-exercise-id'),'flat_db_press');assert.equal(await card(p,'flat_db_press').locator('[data-set-field="kg"]').inputValue(),'65');
 await card(p,'flat_db_press').locator('.set-check').click();await settled(p);assert.equal(await p.locator('.exercise-card').first().getAttribute('data-exercise-id'),'flat_db_press');
 await finish(p);assert.match(await p.locator('h1').textContent(),/^Lower A2?$/);assert.equal(await p.locator('.set-row').count(),7);
 // Dezelfde keuzeplek bewaart beide oefening-ID's en vraagt bevestiging bij eerdere invoer.
 await p.locator('[data-choice-index="0"]').selectOption('barbell_bent_over_row');await settled(p);assert.equal(await p.locator('[data-exercise-id="conventional_deadlift"]').count(),0);
 await card(p,'barbell_bent_over_row').locator('[data-set-field="kg"]').fill('40');await card(p,'barbell_bent_over_row').locator('[data-set-field="reps"]').fill('10');
 await p.locator('[data-choice-index="0"]').selectOption('conventional_deadlift');await p.locator('#modal [data-action="close-modal"]').first().click();await settled(p);assert.equal(await p.locator('[data-choice-index="0"]').inputValue(),'barbell_bent_over_row');
 await p.locator('[data-choice-index="0"]').selectOption('conventional_deadlift');await p.locator('[data-action="confirm-choice"]').click();await settled(p);
 await card(p,'conventional_deadlift').locator('[data-set-field="kg"]').fill('80');await card(p,'conventional_deadlift').locator('[data-set-field="reps"]').fill('6');
 await p.locator('[data-choice-index="0"]').selectOption('barbell_bent_over_row');await p.locator('[data-action="confirm-choice"]').click();await settled(p);assert.equal(await card(p,'barbell_bent_over_row').locator('[data-set-field="kg"]').inputValue(),'40');
 await p.reload();await pageReady(p);assert.equal(await p.locator('[data-choice-index="0"]').inputValue(),'barbell_bent_over_row');assert.equal(await card(p,'barbell_bent_over_row').locator('[data-set-field="kg"]').inputValue(),'40');
 await finish(p);assert.match(await p.locator('h1').textContent(),/^Upper B2?$/);assert.equal(await p.locator('.set-row').count(),7);
 const hang=card(p,'dead_hang');await hang.locator('[data-set-field="seconds"]').fill('20');await hang.locator('[data-direction="1"][data-field="seconds"]').click();assert.equal(await hang.locator('[data-set-field="seconds"]').inputValue(),'21');
 await finish(p);assert.match(await p.locator('h1').textContent(),/^Lower B2?$/);
 const carry=card(p,'farmers_carry');await carry.locator('[data-set-field="kg"]').fill('30');await carry.locator('[data-set-field="meters"]').fill('25');
 await finish(p);assert.match(await p.locator('h1').textContent(),/week is compleet/);let data=await state(p);assert.equal(data.sessions.filter(s=>s.status==='completed').length,4);
 // Statistieken, grafiekknoppen, schema en alle instructieknoppen.
 await p.locator('.mobile-nav [data-page="schema"]').click();assert.equal(await p.locator('.schema-row .schema-index.done').count(),4);await p.locator('[data-action="week"][data-offset="-1"]').click();await p.locator('[data-action="week"][data-offset="1"]').click();await p.locator('[data-action="week"][data-offset="1"]').click();await p.locator('[data-action="this-week"]').click();
 await p.locator('.mobile-nav [data-page="stats"]').click();await p.locator('#stats-exercise').selectOption('barbell_bent_over_row');assert.match(await p.locator('.stat-grid').textContent(),/40/);await p.locator('#stats-exercise').selectOption('conventional_deadlift');assert.match(await p.locator('.stat-grid').textContent(),/80/);
 for(const metric of ['max','volume','reps','average'])await p.locator(`[data-action="chart-metric"][data-metric="${metric}"]`).click();await p.locator('.point').first().click();assert.match(await p.locator('#chart-detail').textContent(),/80/);
 await p.locator('.mobile-nav [data-page="library"]').click();await p.locator('#exercise-search').fill('row');assert.ok(await p.locator('.library-item:visible').count()>0);await p.locator('#exercise-search').fill('');
 const ids=await p.locator('.library-item').evaluateAll(elements=>elements.map(e=>e.dataset.exercise));
 for(const id of ids){await p.locator(`.library-item[data-exercise="${id}"]`).click();assert.ok(await p.locator('#modal .instruction').count()>=5);await p.locator('#modal [data-action="close-modal"]').first().click();}
 await p.locator('[data-filter="libraryFilter"]').selectOption('1:lower_a');assert.equal(await p.locator('.library-item:visible').count(),8);
 await settings(p);
 // Make this race reproducible on fast local machines as well as CI.
 await p.evaluate(async()=>{
  const {LocalStore}=await import('./storage.mjs'),save=LocalStore.prototype.save;
  window.themeWritesPending=0;window.themeWritesStarted=0;
  window.restoreThemeSave=()=>{LocalStore.prototype.save=save;};
  LocalStore.prototype.save=async function(...args){window.themeWritesPending++;window.themeWritesStarted++;try{await new Promise(resolve=>setTimeout(resolve,200));return await save.apply(this,args);}finally{window.themeWritesPending--;}};
 });
 await selectStoredTheme(p,'dark');await selectStoredTheme(p,'light');
 const writesBeforeExport=await p.evaluate(()=>window.themeWritesStarted);
 const beforeExport=await state(p),analysis=await download(p,'export-analysis'),report=JSON.parse(analysis.text);assert.equal(report.format,'ritme-progress-analysis');assert.equal(report.sessions.length,4);assert.equal(report.summary.recordedSets,5);
 assert.equal(report.exercises.find(e=>e.exerciseId==='barbell_bent_over_row').personalRecord.kg,40);assert.equal(report.exercises.find(e=>e.exerciseId==='conventional_deadlift').personalRecord.kg,80);
 const backup=await download(p,'export');assert.equal(JSON.parse(backup.text).format,'ritme-backup');const csv=await download(p,'csv');assert.match(csv.text,/barbell_bent_over_row/);assert.match(csv.text,/conventional_deadlift/);assert.deepEqual(await state(p),beforeExport);assert.equal(await p.evaluate(()=>window.themeWritesStarted),writesBeforeExport);await p.evaluate(()=>{window.restoreThemeSave();delete window.restoreThemeSave;});
 await p.locator('[data-action="choose-import"]').click();await p.locator('#import-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(backup.text)});await p.locator('[data-action="confirm-import"]').click();await settled(p);assert.equal((await state(p)).sessions.length,4);
 await p.locator('[data-action="safety"]').click();await p.locator('#modal [data-action="close-modal"]').first().click();await p.locator('[data-action="install"]').click();await p.locator('#modal [data-action="close-modal"]').first().click();
 const originalAnchor=(await state(p)).settings.anchorMonday;await p.locator('#week-anchor').fill('2026-11-15');await p.locator('[data-action="save-anchor"]').click();assert.equal((await state(p)).settings.anchorMonday,originalAnchor);
 await p.locator('#week-anchor').fill('2026-11-09');await p.locator('[data-action="save-anchor"]').click();await settled(p);assert.equal((await state(p)).settings.anchorMonday,'2026-11-09');
 // Historische multi-setfixture in het tijdelijke profiel, niet in gebruikersopslag.
 const historical=await p.evaluate(async program=>{const core=await import('./core.mjs'),{LocalStore}=await import('./storage.mjs');const old=core.createSession(program,'upper_b',1,core.localDate());old.id='legacy-fixture';old.status='completed';old.completedAt=old.updatedAt;old.title='Oorspronkelijk Upper B';old.note='Bestaande notitie';old.exercises[0].sets.forEach((s,i)=>Object.assign(s,{kg:40+i*20,reps:12-i*2,completed:true}));const store=await new LocalStore().open(),state=await store.load();state.sessions.push(old);await store.save(state,state.revision);store.db.close();return old},legacyProgram);
 await p.reload();await pageReady(p);await p.locator('.mobile-nav [data-page="more"]').click();await p.locator('.more-list [data-page="history"]').click();await p.locator('[data-id="legacy-fixture"][data-action="open-session"]').click();await p.locator('.exercise-info').first().click();assert.ok(await p.locator('.legacy-sets').isVisible());await p.locator('#modal [data-action="close-modal"]').first().click();assert.deepEqual((await state(p)).sessions.find(s=>s.id==='legacy-fixture'),historical);
 await p.locator('[data-action="reopen"]').click();await p.locator('[data-exercise-card="0"] [data-set-field="kg"]').fill('');assert.equal(await p.locator('[data-exercise-card="0"] .set-check').getAttribute('aria-pressed'),'true');await settled(p);await p.evaluate(()=>{window.originalTx=IDBDatabase.prototype.transaction;IDBDatabase.prototype.transaction=function(...args){if(args[1]==='readwrite')throw Error('Testopslagfout');return window.originalTx.apply(this,args)}});await p.locator('[data-exercise-card="0"] [data-set-field="kg"]').fill('41');await p.locator('#storage-error [role="alert"]').waitFor();await p.evaluate(()=>IDBDatabase.prototype.transaction=window.originalTx);await p.locator('[data-action="retry-save"]').click();await p.waitForFunction(()=>!document.querySelector('#storage-error [role="alert"]'));
 await p.locator('[data-action="session-options"]').click();await p.locator('[data-action="delete-session"]').click();await p.locator('#modal [data-action="close-modal"]').first().click();assert.ok((await state(p)).sessions.some(s=>s.id==='legacy-fixture'));
 await p.locator('[data-action="finish"]').click();await p.locator('[data-action="confirm-finish"]').click();await settled(p);assert.equal((await state(p)).sessions.find(s=>s.id==='legacy-fixture').status,'completed');
 await p.locator('[data-action="session-options"]').click();const recovery=await download(p,'export');await p.locator('[data-action="edit-date"]').click();await p.locator('[data-action="confirm-date"]').click();await settled(p);
 await p.locator('[data-action="session-options"]').click();await p.locator('[data-action="delete-session"]').click();await p.locator('[data-action="confirm-delete-session"]').click();await settled(p);assert.equal((await state(p)).sessions.some(s=>s.id==='legacy-fixture'),false);
 await settings(p);await p.locator('#import-file').setInputFiles({name:'recovery.json',mimeType:'application/json',buffer:Buffer.from(recovery.text)});await p.locator('[data-action="confirm-import"]').click();await settled(p);assert.equal((await state(p)).sessions.length,5);
 await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await p.reload();await pageReady(p);await settings(p);const offlineReport=await download(p,'export-analysis');assert.equal(JSON.parse(offlineReport.text).sessions.length,5);
 await p.locator('.mobile-nav [data-page="library"]').click();await p.locator('.library-item[data-exercise="standing_calf"]').click();assert.ok(await p.locator('.exercise-illustration img').evaluate(img=>img.complete&&img.naturalWidth>0));await p.locator('#modal [data-action="close-modal"]').first().click();
 await p.locator('.mobile-nav [data-page="home"]').click();await p.screenshot({path:process.env.RITME_SCREENSHOT||'/tmp/ritme22-mobile.png',fullPage:true});await p.screenshot({path:'/tmp/ritme22-viewport.png'});assert.deepEqual(errors,[]);
 console.log('Browser v2.2 geslaagd: snelle plus/min, dubbel-tap zonder zoom, checklist, herstart, vier trainingen/keuze, PR-scheiding, alle oefendetails, navigatie, thema, anker, downloads/import, opslagfout en offline export.');
}finally{await context?.close();server?.kill();await rm(profile,{recursive:true,force:true});}
