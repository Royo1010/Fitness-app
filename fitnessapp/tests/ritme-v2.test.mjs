import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { PROGRAM_START, DAYS, isoWeek, trainingWeek, trainingTitle, trainingSelection, canRegister, recordedBefore, suggestedSet, adjustNumber, createSession, newSet, emptyState, validateState, makeBackup, readBackup, mergeBackup, exerciseStats, addDays } from '../dist/core.mjs';
const program = JSON.parse(readFileSync(new URL('../dist/program.json', import.meta.url)));
const on = date => trainingWeek(date);
function done(day, date = PROGRAM_START) { const s = createSession(program, day, on(date).variant, date); s.status = 'completed'; s.completedAt = s.updatedAt; return s; }

test('2.0 vaste volgorde is Lower–Upper–Lower–Upper, met expliciete suffixen', () => {
  assert.deepEqual(DAYS, ['lower_a', 'upper_a', 'lower_b', 'upper_b']);
  assert.deepEqual(DAYS.map(d => trainingTitle(d, 1)), ['Lower A1', 'Upper A1', 'Lower B1', 'Upper B1']);
  assert.deepEqual(DAYS.map(d => trainingTitle(d, 2)), ['Lower A2', 'Upper A2', 'Lower B2', 'Upper B2']);
});
test('30 november 2026 is ISO-week 49 en trainingsweek 1', () => {
  assert.equal(PROGRAM_START, '2026-11-30');
  assert.deepEqual(isoWeek(PROGRAM_START), { number: 49, year: 2026 });
  assert.equal(on(PROGRAM_START).trainingNumber, 1); assert.equal(on(PROGRAM_START).variant, 1);
});
test('de zes expliciet gevraagde kalenderweken volgen de vaste rotatie', () => {
  for (const [date, iso, training, variant] of [
    ['2026-11-30',49,1,1], ['2026-12-07',50,2,2], ['2026-12-14',51,3,1],
    ['2026-12-21',52,4,2], ['2026-12-28',53,5,1], ['2027-01-04',1,6,2]
  ]) { const w = on(date); assert.equal(w.iso.number,iso); assert.equal(w.trainingNumber,training); assert.equal(w.variant,variant); }
});
test('ISO-weekjaar rond nieuwjaar en schrikkeldagen', () => {
  assert.deepEqual(isoWeek('2027-01-01'), { number:53,year:2026 });
  assert.deepEqual(isoWeek('2027-01-04'), { number:1,year:2027 });
  assert.deepEqual(isoWeek('2028-02-29'), { number:9,year:2028 });
  assert.deepEqual(isoWeek('2029-12-31'), { number:1,year:2030 });
});
test('voor de referentiestart alleen een voorbeeld zonder officiële progressie', () => {
  const w = on('2026-11-11'); assert.equal(w.official,false); assert.equal(w.variant,1); assert.equal(w.trainingNumber,null);
  assert.equal(canRegister('2026-11-11','2026-12-01'),false);
  assert.equal(trainingSelection([done('lower_a','2026-11-09')],w,'2026-11-11').completed,0);
});
test('nieuwe registratie is alleen vanaf de referentie tot en met de echte datum toegestaan', () => {
  assert.equal(canRegister('2026-11-30','2026-11-30'),true);
  assert.equal(canRegister('2026-12-01','2026-11-30'),false);
  assert.equal(canRegister('2026-11-29','2026-11-30'),false);
  assert.equal(canRegister('2026-99-99','2026-11-30'),false);
});
test('eerstvolgende selectie schuift automatisch en eindigt na de vierde', () => {
  const sessions = [], week = on(PROGRAM_START);
  for (const day of DAYS) { assert.equal(trainingSelection(sessions,week,PROGRAM_START).next,day); sessions.push(done(day)); }
  assert.equal(trainingSelection(sessions,week,PROGRAM_START).next,null);
  assert.equal(trainingSelection(sessions,week,PROGRAM_START).completed,4);
});
test('afwijkende uitvoervolgorde blijft mogelijk en selecteert eerste open training', () => {
  const sessions = [done('upper_a'), done('lower_b')];
  assert.equal(trainingSelection(sessions,on(PROGRAM_START),PROGRAM_START).next,'lower_a');
  assert.equal(trainingSelection(sessions,on(PROGRAM_START),PROGRAM_START).completed,2);
});
test('pauzeren is geen voltooiing en heropenen herstelt de selectie', () => {
  const s = done('lower_a'); s.status='paused'; s.completedAt=null;
  assert.equal(trainingSelection([s],on(PROGRAM_START),PROGRAM_START).next,'lower_a');
  s.status='completed';s.completedAt=s.updatedAt;
  assert.equal(trainingSelection([s],on(PROGRAM_START),PROGRAM_START).next,'upper_a');
  s.status='active';s.completedAt=null;
  assert.equal(trainingSelection([s],on(PROGRAM_START),PROGRAM_START).next,'lower_a');
});
test('gemiste trainingen worden niet meegenomen, voltooid of verwijderd bij een nieuwe week', () => {
  const sessions = [done('lower_a')], before=JSON.stringify(sessions);
  const next=trainingSelection(sessions,on('2026-12-07'),'2026-12-07');
  assert.equal(next.completed,0);assert.equal(next.next,'lower_a');assert.equal(on('2026-12-07').variant,2);assert.equal(JSON.stringify(sessions),before);
});
test('een volledig afgeronde week begint nooit vroegtijdig aan het volgende weektype', () => {
  const sessions=DAYS.map(d=>done(d));
  assert.equal(trainingSelection(sessions,on('2026-12-06'),'2026-12-06').next,null);
  assert.equal(on('2026-12-06').variant,1);
});
test('de Amsterdamse maandaggrens gebruikt kalenderweken, ook rond beide DST-wissels', () => {
  assert.equal(trainingWeek(new Date('2026-12-06T22:59:59Z')).variant,1);
  assert.equal(trainingWeek(new Date('2026-12-06T23:00:00Z')).variant,2);
  assert.equal(trainingWeek(new Date('2027-03-28T21:59:59Z')).monday,'2027-03-22');
  assert.equal(trainingWeek(new Date('2027-03-28T22:00:00Z')).monday,'2027-03-29');
  assert.equal(trainingWeek(new Date('2027-10-31T22:59:59Z')).monday,'2027-10-25');
  assert.equal(trainingWeek(new Date('2027-10-31T23:00:00Z')).monday,'2027-11-01');
});
test('openen/selecteren van schema of trainingsvoorstel muteert de historie niet', () => {
  const sessions=[done('lower_a')], before=JSON.stringify(sessions);
  for(let i=-3;i<10;i++) trainingSelection(sessions,on(addDays(PROGRAM_START,i*7)),PROGRAM_START);
  assert.equal(JSON.stringify(sessions),before);
});
test('toekomstige invoer telt niet als voltooid of als geregistreerde prestatie', () => {
  const future=done('lower_a','2026-12-01');
  assert.equal(trainingSelection([future],on(PROGRAM_START),PROGRAM_START).completed,0);
  assert.deepEqual(recordedBefore([future],PROGRAM_START),[]);
});
test('voorstel kopieert vorige setwaarden zonder de nieuwe set af te ronden of te muteren', () => {
  const s=createSession(program,'lower_a',1,PROGRAM_START),e=s.exercises[0];
  e.sets[0].kg=62.5;e.sets[0].reps=10;e.sets[0].completed=true;
  const before=JSON.stringify(s), p=suggestedSet(e,1,[],s);
  assert.equal(p.kg,62.5);assert.equal(p.reps,10);assert.equal(e.sets[1].completed,false);assert.equal(e.sets[1].kg,null);assert.equal(JSON.stringify(s),before);
});
test('historisch voorstel gebruikt dezelfde oefening-ID en gewichtdefinitie', () => {
  const previous=createSession(program,'upper_a',1,'2026-11-30'), next=createSession(program,'upper_a',2,'2026-12-07');
  Object.assign(previous.exercises[0].sets[0],{kg:22.5,reps:12,completed:true});
  const p=suggestedSet(next.exercises[0],0,[previous],next);assert.equal(p.kg,22.5);assert.equal(p.reps,12);
  assert.equal(suggestedSet(next.exercises[1],0,[previous],next).kg,null);
});
test('zonder historie blijft het gewicht leeg en wordt alleen de brondoelwaarde voorgesteld', () => {
  const s=createSession(program,'lower_a',1,PROGRAM_START),p=suggestedSet(s.exercises[0],0,[],s);
  assert.equal(p.kg,null);assert.equal(p.reps,8);assert.equal(exerciseStats([s],'hack_squat').pr,null);
});
test('plus en min ondersteunen komma, decimalen, grote waarden en ondergrens nul', () => {
  assert.equal(adjustNumber('62,5',1,2.5),65);assert.equal(adjustNumber(100,-1,.5),99.5);
  assert.equal(adjustNumber(null,1,5),5);assert.equal(adjustNumber(0,-1,1),0);
  assert.equal(adjustNumber(10,1,1,'reps'),11);assert.throws(()=>adjustNumber('geen getal',1,1));
});
test('v1-opslag en backups blijven zonder migratie leesbaar en ongewijzigd', () => {
  const state=emptyState();state.settings.anchorMonday='2026-11-09';
  const old=createSession(program,'upper_a',1,'2026-11-11');old.title='Upper A';Object.assign(old.exercises[0].sets[0],{kg:22.5,reps:10,completed:true});state.sessions.push(old);
  const before=JSON.stringify(state);const loaded=validateState(JSON.parse(before));
  assert.equal(JSON.stringify(loaded),before);assert.equal(loaded.schemaVersion,1);assert.equal(readBackup(makeBackup(loaded,program)).sessions[0].title,'Upper A');
  assert.equal(exerciseStats(loaded.sessions,'flat_db_press').pr.kg,22.5);
});
test('gewichtsstappen blijven bewaard in een volledige back-up', () => {
  const state=emptyState();state.settings.weightSteps={hack_squat:5,db_curl:.5};
  assert.deepEqual(readBackup(makeBackup(state,program)).settings.weightSteps,state.settings.weightSteps);
  state.settings.weightSteps.db_curl=3;assert.throws(()=>validateState(state));
});
test('v2 samenvoegen behoudt lokale instellingen zonder de oude ankerconfiguratie', () => {
  const current=emptyState();current.settings.weightSteps={hack_squat:5};current.sessions.push(createSession(program,'lower_a',1,PROGRAM_START));
  const incoming=emptyState();incoming.settings.anchorMonday='2026-11-09';incoming.settings.theme='dark';
  const result=mergeBackup(current,incoming);
  assert.deepEqual(result.settings,current.settings);
});
test('gemiddelde herhalingen gebruikt uitsluitend geldige afgeronde werksets', () => {
  const s=createSession(program,'upper_a',1,PROGRAM_START),e=s.exercises[0];
  e.sets=[8,10,12].map(reps=>({...newSet(),kg:20,reps,completed:true}));
  e.sets[2].kind='warmup';assert.equal(exerciseStats([s],'flat_db_press').averageReps,9);
});
test('trainingsbron en opslagcontract zijn identiek aan de oorspronkelijke bestanden', () => {
  assert.equal(program.metadata.version,'1.0');assert.equal(Object.keys(program.exercises).length,35);
  const storage=readFileSync(new URL('../dist/storage.mjs',import.meta.url),'utf8');
  assert.match(storage,/indexedDB.open\('ritme-fitness', 1\)/);assert.match(storage,/get\('state'\)/);
  const input=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
  assert.doesNotMatch(input,/NativeDate|TESTKLOK/);assert.match(input,/\.\/training.css/);
});
test('manifest behoudt identiteit en gebruikt relatieve paden onder /Fitness-app/', () => {
  const m=JSON.parse(readFileSync(new URL('../dist/manifest.webmanifest',import.meta.url)));
  assert.equal(m.id,'./');assert.equal(m.scope,'./');assert.equal(m.start_url,'./#home');
  for(const base of ['https://example.github.io/Fitness-app/','http://localhost:4180/']) {
    const expected=new URL('./',base).pathname;
    for(const asset of m.icons) assert.ok(new URL(asset.src,base).pathname.startsWith(expected));
    assert.equal(new URL(m.start_url,base).pathname,expected);
  }
});
test('serviceworker pre-cachet alle assets onder het subpad en raakt IndexedDB niet', async () => {
  const source=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8'),events={};let requests=[];
  const cache={addAll:async r=>{requests=r;}};
  const context={URL,Request,Set,caches:{open:async()=>cache},self:{location:{href:'https://example.github.io/Fitness-app/sw.js'},addEventListener:(type,fn)=>events[type]=fn,skipWaiting:async()=>{}}};
  vm.runInNewContext(source,context);let pending;events.install({waitUntil:p=>pending=p});await pending;
  assert.ok(requests.length===12);assert.ok(requests.every(r=>new URL(r.url).pathname.startsWith('/Fitness-app/')));
  assert.ok(requests.some(r=>r.url.endsWith('/training.css')));assert.doesNotMatch(source,/indexedDB|deleteDatabase/);
});
test('serviceworker bedient geen andere GitHub Pages-app op dezelfde host', () => {
  const source=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8'),events={};
  const context={URL,Request,Set,self:{location:{href:'https://example.github.io/Fitness-app/sw.js'},addEventListener:(type,fn)=>events[type]=fn}};
  vm.runInNewContext(source,context);let responded=false;
  events.fetch({request:{url:'https://example.github.io/Andere-app/index.html',method:'GET',mode:'navigate'},respondWith:()=>responded=true});assert.equal(responded,false);
});
