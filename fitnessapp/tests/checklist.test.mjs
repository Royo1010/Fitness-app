import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSession,createBestSession,exerciseDone,orderedExercises,nextExerciseIndex,recordBest,validSet,exerciseStats,measurement,bestSetIndex,emptyState,validateState,makeBackup,readBackup,mergeBackup,suggestedSet,trainingWeek,trainingSelection} from '../dist/core.mjs';
const program=JSON.parse(readFileSync(new URL('./fixtures/program-v2.1.json',import.meta.url)));
const create=()=>createBestSession(program,'lower_a',1,'2026-11-30');
const record=(entry,values)=>{Object.assign(entry.sets[0],values);recordBest(entry);};

test('nieuwe training bewaart voorschrift maar registreert één beste set per oefening',()=>{
 const s=create();assert.equal(s.exercises.length,8);
 s.exercises.forEach((e,i)=>{assert.deepEqual(e.prescription,program.week_programs[1].lower_a[i]);assert.equal(e.sets.length,1);assert.equal(exerciseDone(e),false);});
 const e=s.exercises[0];record(e,{kg:80,reps:8});assert.ok(validSet(e.sets[0],e.measurement));assert.equal(exerciseDone(e),false);
 const stats=exerciseStats([s],e.exerciseId);assert.equal(stats.sets,1);assert.equal(stats.runs[0].volume,640);assert.equal(stats.pr.kg,80);
});
test('oefenchecklist sorteert stabiel, herstelt na backup en behoudt prestatie bij opnieuw activeren',()=>{
 const s=create(), e=s.exercises[0];record(e,{kg:62.5,reps:11});
 e.exerciseCompleted=true;s.exercises[2].exerciseCompleted=true;
 assert.deepEqual(orderedExercises(s.exercises).map(r=>r.index),[1,3,4,5,6,7,0,2]);assert.equal(nextExerciseIndex(s.exercises),1);
 const state=emptyState();state.sessions=[s];state.settings.trainingFocus={day:s.day,weekMonday:s.weekMonday};
 const restored=readBackup(makeBackup(state,program));assert.deepEqual(restored,state);assert.equal(nextExerciseIndex(restored.sessions[0].exercises),1);
 e.exerciseCompleted=false;assert.equal(nextExerciseIndex(s.exercises),0);assert.equal(e.sets[0].kg,62.5);assert.equal(exerciseStats([s],e.exerciseId).sets,1);
 s.exercises.forEach(e=>e.exerciseCompleted=true);assert.equal(nextExerciseIndex(s.exercises),-1);
 s.status='completed';s.completedAt=s.updatedAt;assert.equal(trainingSelection([s],trainingWeek(s.date),s.date).next,'upper_a');
});
test('afvinken zonder prestatie fabriceert geen data, ongeldige invoer telt niet',()=>{
 const s=create(),e=s.exercises[0];e.exerciseCompleted=true;assert.equal(exerciseStats([s],e.exerciseId).sets,0);
 record(e,{kg:80,reps:8});assert.equal(exerciseStats([s],e.exerciseId).sets,1);
 record(e,{reps:null});assert.equal(exerciseStats([s],e.exerciseId).sets,0);assert.equal(exerciseDone(e),true);
});
test('afstand, tijd en lichaamsgewicht volgen de bestaande meetconventies',()=>{
 const s=create();const carry=s.exercises.find(e=>e.exerciseId==='farmers_carry');record(carry,{kg:30,meters:25});assert.ok(validSet(carry.sets[0],carry.measurement));
 const stats=exerciseStats([s],carry.exerciseId);assert.equal(stats.load.pr.kg,30);assert.equal(stats.load.pr.meters,25);assert.equal(stats.runs[0].volume,null);
 for(const [id,values] of [['dead_hang',{seconds:20}],['hanging_knee',{reps:10}],['back_extension',{reps:12}]]) {
  assert.ok(validSet({...s.exercises[0].sets[0],kg:null,reps:null,seconds:null,meters:null,...values,completed:true},measurement(id)));
 }
});
test('v1/v2 individuele sets en notities blijven exact behouden bij lezen, samenvoegen en checklist',()=>{
 const old=createSession(program,'lower_a',1,'2026-11-30');old.note='Bestaande notitie';
 Object.assign(old.exercises[0].sets[0],{kg:40,reps:12,completed:true});Object.assign(old.exercises[0].sets[1],{kg:80,reps:8,completed:true});Object.assign(old.exercises[0].sets[2],{kg:80,reps:10,completed:true});
 const state=emptyState();state.sessions=[old];const before=JSON.stringify(state);
 assert.equal(bestSetIndex(old.exercises[0]),2);orderedExercises(old.exercises);exerciseStats([old],'hack_squat');assert.equal(JSON.stringify(state),before);
 const restored=readBackup(makeBackup(state,program));assert.deepEqual(restored,state);assert.deepEqual(mergeBackup(emptyState(),restored).sessions,[old]);
 const next=create();assert.equal(suggestedSet(next.exercises[0],0,[old],next).reps,10);
 const stats=exerciseStats([old],'hack_squat');assert.equal(stats.sets,3);assert.equal(stats.pr.reps,10);
});
test('schema weigert kapotte checklist en meerdere beste sets zonder oude backups te muteren',()=>{
 const state=emptyState();state.sessions=[create()];assert.deepEqual(validateState(state),state);
 state.sessions[0].exercises[0].exerciseCompleted='ja';assert.throws(()=>validateState(state),/oefenvoltooiing/);
 state.sessions[0].exercises[0].exerciseCompleted=false;state.sessions[0].exercises[0].sets.push(structuredClone(state.sessions[0].exercises[0].sets[0]));assert.throws(()=>validateState(state),/precies één/);
});
