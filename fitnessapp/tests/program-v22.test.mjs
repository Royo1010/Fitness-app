import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DAYS,createBestSession,trainingWeek,weekFor,canRegister,switchChoice,recordBest,exerciseStats,emptyState,makeBackup,readBackup,validateState,measurement,suggestedSet} from '../dist/core.mjs';
import {progressReport} from '../dist/progress.mjs';
const load=file=>JSON.parse(readFileSync(new URL(file,import.meta.url)));
const program=load('../dist/program.json'),source=load('../sources/fitnessprogramma_v2_2.json'),old=load('./fixtures/program-v2.1.json');
test('v2.2 volgt exact de aangeleverde trainingen, voorschriften en vijf wisselingen',()=>{
 assert.deepEqual(DAYS,source.metadata.default_workout_order);
 for(const n of [1,2]) for(const workout of source.cycle[`week_${n}`]){
  const day=workout.id.replace(/2$/,''),actual=program.week_programs[n][day];
  assert.equal(actual.length,workout.exercises.length);assert.equal(actual.reduce((s,e)=>s+e.sets,0),{upper_a:18,lower_a:16,upper_b:16,lower_b:17}[day]);
  workout.exercises.forEach((expected,i)=>{
   const options=expected.options||[expected],got=actual[i].choice_options||[actual[i]];
   assert.equal(got.length,options.length);
   options.forEach((e,j)=>{assert.equal(got[j].source_id,e.id);assert.equal(got[j].sets,e.sets);assert.equal(got[j].reps,e.target);assert.equal(got[j].rest_seconds,e.rest_seconds);assert.equal(got[j].effort,e.effort_instruction);});
  });
 }
 let differences=0;for(const day of DAYS)program.week_programs[1][day].forEach((p,i)=>{if(p.exercise_id!==program.week_programs[2][day][i].exercise_id)differences++;});assert.equal(differences,5);
 assert.equal(program.week_programs[2].lower_a.at(-1).exercise_id,'side_lying_ext_rotation');
 assert.ok(program.week_programs[1].upper_a.some(e=>e.exercise_id==='scapular_pushup'));
 assert.ok(program.week_programs[1].upper_b.some(e=>e.exercise_id==='dead_hang'));
});
test('alle bestaande instructies blijven onverkort en nieuwe rows zijn volledig en bovenhands',()=>{
 for(const [id,instruction] of Object.entries(old.exercises))assert.deepEqual(program.exercises[id],instruction);
 const row=program.exercises.barbell_bent_over_row;
 for(const field of ['name','muscles','setup','movement','cues','avoid','adjust'])assert.ok(row[field].length>10);
 assert.match(row.setup,/bovenhandse greep/);assert.match(row.adjust,/linker/);assert.match(row.cues,/excentrische/);
 assert.equal(measurement('conventional_deadlift').basis,'total_barbell');assert.equal(measurement('barbell_bent_over_row').basis,'total_barbell');
});
test('keuze bewaart beide prestaties onder eigen ID, herstelt invoer en overleeft backup/import',()=>{
 const session=createBestSession(program,'lower_a',2,'2026-11-14');const deadlift=session.exercises[0];
 Object.assign(deadlift.sets[0],{kg:100,reps:6});recordBest(deadlift);deadlift.exerciseCompleted=true;
 switchChoice(session,0,'barbell_bent_over_row',program);assert.equal(session.exercises.length,7);assert.equal(session.exercises[0].sets[0].kg,null);
 const row=session.exercises[0];Object.assign(row.sets[0],{kg:50,reps:10});recordBest(row);
 assert.equal(exerciseStats([session],'conventional_deadlift').pr.kg,100);assert.equal(exerciseStats([session],'barbell_bent_over_row').pr.kg,50);
 switchChoice(session,0,'conventional_deadlift',program);assert.deepEqual(session.exercises[0],deadlift);assert.equal(session.archivedExercises[0].exerciseId,'barbell_bent_over_row');
 const state=emptyState();state.settings.anchorMonday='2026-11-09';state.sessions=[session];assert.deepEqual(readBackup(makeBackup(state,program)),state);
 const report=progressReport(state,new Date('2026-11-14T12:00:00Z'));assert.equal(report.summary.recordedSets,2);assert.equal(report.sessions[0].archivedExercises[0].sets[0].kg,50);
 const before=JSON.stringify(state);progressReport(state);assert.equal(JSON.stringify(state),before);
 const next=createBestSession(program,'lower_a',1,'2026-11-16');switchChoice(next,0,'barbell_bent_over_row',program);assert.equal(suggestedSet(next.exercises[0],0,[session],next).kg,50);
});
test('anker blijft behouden: zondag/maandag, DST en jaarwisseling gebruiken kalenderweken',()=>{
 for(const [anchor,before,after] of [
  ['2026-11-09','2026-11-15T22:59:59Z','2026-11-15T23:00:00Z'],
  ['2026-03-23','2026-03-29T21:59:59Z','2026-03-29T22:00:00Z'],
  ['2026-10-19','2026-10-25T22:59:59Z','2026-10-25T23:00:00Z'],
  ['2026-12-28','2027-01-03T22:59:59Z','2027-01-03T23:00:00Z']
 ]){assert.equal(trainingWeek(before,anchor).variant,1);assert.equal(trainingWeek(after,anchor).variant,2);assert.equal(trainingWeek(after,anchor).anchor,anchor);}
 assert.equal(trainingWeek('2026-11-14','2026-11-09').variant,1);
 assert.equal(trainingWeek('2026-11-14').anchor,'2026-11-30');assert.equal(canRegister('2026-11-14','2026-11-14'),true);
 assert.equal(trainingWeek('2026-11-14').variant,weekFor('2026-11-30','2026-11-14').variant);
});
test('analyse-export bevat alleen echte getallen in samenvatting en noemt databeperkingen',()=>{
 const state=emptyState(),session=createBestSession(program,'lower_b',2,'2026-11-14');state.sessions=[session];
 const carry=session.exercises.find(e=>e.exerciseId==='farmers_carry');Object.assign(carry.sets[0],{kg:30,meters:25});recordBest(carry);
 session.exercises[0].exerciseCompleted=true;
 const report=progressReport(state,new Date('2026-11-14T12:00:00Z'));assert.equal(report.summary.recordedSets,1);
 assert.equal(report.exercises.find(e=>e.exerciseId==='farmers_carry').weightRecord.meters,25);
 assert.match(report.explanation,/Werkelijk totaal trainingsvolume is onbekend/);assert.equal(report.exercises.find(e=>e.exerciseId==='hip_thrust').personalRecord,null);
 assert.deepEqual(validateState(report.sessions.length?state:emptyState()),state);
});
