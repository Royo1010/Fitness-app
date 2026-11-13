// Run with Playwright installed outside the app; see TESTVERSLAG-2.1.md.
import assert from 'node:assert/strict';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:net';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const profile=await mkdtemp(path.join(tmpdir(),'ritme-checklist-browser-'));
let server, url=process.env.RITME_BROWSER_URL;
const launch=()=>chromium.launchPersistentContext(profile,{executablePath:process.env.CHROMIUM_PATH || undefined,headless:true,viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,timezoneId:'Europe/Amsterdam',args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
let context;
const errors=[];
const watch=p=>p.on('pageerror',e=>errors.push(e.message));
const state=p=>p.evaluate(async()=>{const db=await new Promise((res,rej)=>{const r=indexedDB.open('ritme-fitness',1);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});try{return await new Promise((res,rej)=>{const r=db.transaction('data').objectStore('data').get('state');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});}finally{db.close()}});
async function saved(p){await p.waitForFunction(()=>!document.querySelector('[data-set-field]:invalid'));await p.waitForTimeout(250);}
try{
 if(!url){
  const socket=createServer();await new Promise(resolve=>socket.listen(0,'127.0.0.1',resolve));const port=socket.address().port;await new Promise(resolve=>socket.close(resolve));
  url=`http://127.0.0.1:${port}/Fitness-app/`;
  server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,PORT:String(port),RITME_TEST_DATE:'2026-11-30T12:00:00Z'},stdio:['ignore','pipe','pipe']});
  await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Testserver start niet')),10000);server.once('error',reject);server.once('exit',code=>{clearTimeout(timeout);reject(new Error(`Testserver stopt: ${code}`));});server.stdout.once('data',()=>{clearTimeout(timeout);resolve();});});
 }
 context=await launch();let p=await context.newPage();watch(p);
 await p.goto(url);await p.locator('.exercise-card').first().waitFor();
 assert.equal(await p.locator('h1').textContent(),'Lower A1');
 assert.equal(await p.locator('.topbar,.warmup-compact,.training-notes').count(),0);
 assert.equal(await p.locator('.set-row').count(),8);
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.setViewportSize({width:320,height:700});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.setViewportSize({width:390,height:844});
 for(const [i,kg,reps] of [[0,'80','8'],[1,'45','11'],[2,'100','12']]){
  const card=p.locator(`[data-exercise-card="${i}"]`);
  await card.locator('[data-set-field="kg"]').fill(kg);
  await card.locator('[data-set-field="reps"]').fill(reps);
  assert.equal(await card.locator('.set-check').getAttribute('aria-pressed'),'false');
  await card.locator('.set-check').click();await saved(p);
  assert.equal(await p.locator('.exercise-card').first().getAttribute('data-exercise-card'),String(i+1));
 }
 await p.screenshot({path:'/tmp/ritme-2.1-training.png',fullPage:true});
 let s=(await state(p)).sessions[0];assert.equal(s.exercises[0].sets[0].kg,80);assert.equal(s.exercises[0].sets[0].reps,8);assert.equal(s.exercises[0].sets.length,1);
 await p.reload();await p.locator('.exercise-card').first().waitFor();assert.equal(await p.locator('.exercise-card').first().getAttribute('data-exercise-card'),'3');
 // Volledig browserproces sluiten en dezelfde PWA-opslag opnieuw openen.
 await context.close();context=await launch();p=await context.newPage();watch(p);await p.goto(url);await p.locator('.exercise-card').first().waitFor();
 assert.equal(await p.locator('.exercise-card').first().getAttribute('data-exercise-card'),'3');
 assert.equal(await p.locator('[data-exercise-card="0"] [data-set-field="kg"]').inputValue(),'80');
 const first=p.locator('[data-exercise-card="0"]');await first.locator('.set-check').click();await saved(p);
 assert.equal(await p.locator('.exercise-card').first().getAttribute('data-exercise-card'),'0');assert.equal(await first.locator('[data-set-field="reps"]').inputValue(),'8');
 await first.locator('[data-set-field="kg"]').fill('62,5');await first.locator('[data-set-field="reps"]').fill('11');
 await first.locator('[data-action="step"][data-field="kg"][data-direction="1"]').click();await saved(p);assert.equal(await first.locator('[data-set-field="kg"]').inputValue(),'65');assert.equal(await first.locator('.set-check').getAttribute('aria-pressed'),'false');
 await first.locator('.set-check').click();await saved(p);
 const carry=p.locator('[data-exercise-card="6"]');await carry.locator('[data-set-field="kg"]').fill('30');await carry.locator('[data-set-field="meters"]').fill('25');await carry.locator('.set-check').click();await saved(p);
 s=(await state(p)).sessions[0];assert.equal(s.exercises[6].sets[0].kg,30);assert.equal(s.exercises[6].sets[0].meters,25);
 const calf=p.locator('[data-exercise-card="4"]');await calf.locator('.exercise-info').click();await p.locator('.exercise-illustration img').waitFor();assert.ok(await p.locator('.exercise-illustration img').evaluate(img=>img.complete&&img.naturalWidth>0));await p.locator('[data-action="close-modal"]').click();
 for(let i=0;i<8;i++){const card=p.locator(`[data-exercise-card="${i}"]`);if(await card.locator('.set-check').getAttribute('aria-pressed')==='false'){await card.locator('.set-check').click();await saved(p);}}
 assert.equal(await p.locator('.exercise-done').count(),8);assert.ok(await p.locator('.checklist-complete').isVisible());
 await p.screenshot({path:process.env.RITME_SCREENSHOT || '/tmp/ritme-2.1-complete.png',fullPage:true});
 await p.locator('[data-action="finish"]').click();await p.waitForFunction(()=>document.querySelector('h1')?.textContent==='Upper A1');
 s=(await state(p)).sessions[0];assert.equal(s.status,'completed');
 assert.equal(s.exercises[3].sets[0].completed,false); // Afgevinkt zonder getal: geen gefingeerde prestatie.
 await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>!!navigator.serviceWorker.controller);
 await context.setOffline(true);await p.reload();await p.locator('.exercise-card').first().waitFor();assert.equal(await p.locator('h1').textContent(),'Upper A1');
 await p.locator('.mobile-nav [data-page="schema"]').click();await p.locator('.schema-row').first().waitFor();assert.match(await p.locator('.schema-row').first().textContent(),/Voltooid/);
 await p.locator('.mobile-nav [data-page="stats"]').click();await p.locator('#stats-exercise').selectOption('hack_squat');assert.match(await p.locator('.stat-grid').textContent(),/65/);
 await p.locator('.mobile-nav [data-page="library"]').click();await p.locator('.library-item[data-exercise="standing_calf"]').click();assert.ok(await p.locator('.exercise-illustration img').evaluate(img=>img.complete&&img.naturalWidth>0));await p.locator('[data-action="close-modal"]').click();
 await context.setOffline(false);
 // Importeer een oude multi-setregistratie in uitsluitend dit geïsoleerde testprofiel.
 const historical=await p.evaluate(async()=>{
  const core=await import('./core.mjs'),{LocalStore}=await import('./storage.mjs');
  const program=await (await fetch('./program.json')).json();
  const old=core.createSession(program,'upper_b',1,'2026-11-30');old.note='Historische trainingsnotitie';
  old.id='browser-legacy-fixture';old.exercises[0].note='Bestaande oefennotitie';
  old.exercises[0].sets.forEach((set,i)=>Object.assign(set,{kg:40+i*20,reps:12-i*2,completed:true}));
  const db=await new LocalStore().open(),data=await db.load();data.sessions.push(old);await db.save(data,data.revision);db.db.close();return old;
 });
 await p.reload();await p.locator('.mobile-nav [data-page="more"]').click();await p.locator('.more-list [data-page="history"]').click();
 await p.locator('[data-action="open-session"][data-id="browser-legacy-fixture"]').click();
 await p.locator('[data-exercise-card="0"] .exercise-info').click();assert.ok(await p.locator('.legacy-sets').isVisible());assert.match(await p.locator('.legacy-sets').textContent(),/80/);await p.locator('[data-action="close-modal"]').click();
 assert.deepEqual((await state(p)).sessions.find(s=>s.id==='browser-legacy-fixture'),historical);
 await p.locator('.mobile-nav [data-page="home"]').click();
 // Opslagfalen blijft zichtbaar nu de permanente opslagheader verdwenen is.
 await p.evaluate(()=>{window.originalTransaction=IDBDatabase.prototype.transaction;IDBDatabase.prototype.transaction=function(...args){if(args[1]==='readwrite')throw new Error('Testopslagfout');return window.originalTransaction.apply(this,args)};});
 await p.locator('.exercise-card').first().locator('[data-set-field="kg"]').fill('20');
 await p.locator('#storage-error [role="alert"]').waitFor();assert.match(await p.locator('#storage-error').textContent(),/Testopslagfout/);
 await p.evaluate(()=>IDBDatabase.prototype.transaction=window.originalTransaction);await p.locator('[data-action="retry-save"]').click();await p.waitForFunction(()=>!document.querySelector('#storage-error [role="alert"]'));
 assert.deepEqual(errors,[]);console.log('Mobiele browser: invoer, afzonderlijk afvinken, sortering, procesherstart, herstel, carry, illustratie, afronden, Schema, statistieken en offline geslaagd.');
}finally{await context?.close();server?.kill();await rm(profile,{recursive:true,force:true});}
