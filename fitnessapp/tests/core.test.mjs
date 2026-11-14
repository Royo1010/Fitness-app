import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isDate, localDate, addDays, mondayOf, weekFor, parseNumber, measurement, emptyState, newSet, createSession, validSet, setError, exerciseStats, weekProgress, weeklyCounts, makeBackup, readBackup, mergeBackup, validateState } from '../dist/core.mjs';
const program = JSON.parse(readFileSync(new URL('./fixtures/program-v2.1.json', import.meta.url)));
function training(date = '2026-11-09', day = 'upper_a', variant = 1) { return createSession(program, day, variant, date); }
function log(s, id, weights, values = []) {
  const e = s.exercises.find(e => e.exerciseId === id);
  e.sets = weights.map((kg, i) => ({ ...newSet(), kg, reps: values[i] ?? 10, completed: true }));
  return e;
}
function stateWith(...sessions) { return { ...emptyState(), settings: { anchorMonday: '2026-11-09', theme: 'light' }, sessions }; }

test('Amsterdam datum is onafhankelijk van de hosttijdzone', () => {
  assert.equal(localDate(new Date('2026-11-08T23:00:00Z')), '2026-11-09');
  assert.equal(localDate(new Date('2026-07-05T22:00:00Z')), '2026-07-06');
});
test('zondag 23:59:59.999 blijft week 1, maandag 00:00 wordt week 2', () => {
  assert.equal(weekFor('2026-11-02', '2026-11-08T22:59:59.999Z').variant, 1);
  const w = weekFor('2026-11-02', '2026-11-08T23:00:00.000Z');
  assert.equal(w.variant, 2); assert.equal(w.monday, '2026-11-09'); assert.equal(w.sunday, '2026-11-15');
});
test('na gesloten app worden meerdere gemiste weken correct berekend', () => {
  assert.equal(weekFor('2026-11-02', '2026-12-21').variant, 2);
  assert.equal(weekFor('2026-11-02', '2026-12-28').variant, 1);
});
test('kalenderjaarwisseling verandert de cyclus niet', () => {
  assert.equal(weekFor('2026-12-28', '2027-01-03T22:59:59Z').variant, 1);
  assert.equal(weekFor('2026-12-28', '2027-01-03T23:00:00Z').variant, 2);
  assert.equal(weekFor('2026-12-28', '2027-01-11').variant, 1);
});
test('53e ISO-week bepaalt nooit de variant', () => {
  assert.equal(weekFor('2020-12-21', '2020-12-28').variant, 2);
  assert.equal(weekFor('2020-12-21', '2021-01-04').variant, 1);
});
test('zomertijdweek heeft 167 uren, maar is één kalenderweek', () => {
  assert.equal(weekFor('2026-03-23', '2026-03-29T21:59:59.999Z').variant, 1);
  assert.equal(weekFor('2026-03-23', '2026-03-29T22:00:00Z').variant, 2);
  assert.equal(weekFor('2026-03-23', '2026-04-05T22:00:00Z').variant, 1);
});
test('wintertijdweek heeft 169 uren, maar is één kalenderweek', () => {
  assert.equal(weekFor('2026-10-19', '2026-10-25T22:59:59.999Z').variant, 1);
  assert.equal(weekFor('2026-10-19', '2026-10-25T23:00:00Z').variant, 2);
});
test('dubbele en ontbrekende DST-uren wisselen de week niet', () => {
  for (const time of ['2026-10-25T00:30:00Z', '2026-10-25T01:30:00Z']) assert.equal(weekFor('2026-10-19', time).variant, 1);
  for (const time of ['2026-03-29T00:30:00Z', '2026-03-29T01:30:00Z']) assert.equal(weekFor('2026-03-23', time).variant, 1);
});
test('weken vóór de ankermaandag volgen dezelfde alternerende cyclus', () => {
  assert.equal(weekFor('2026-11-09', '2026-11-02').variant, 2);
  assert.equal(weekFor('2026-11-09', '2026-10-26').variant, 1);
});
test('anker moet een geldige maandag zijn', () => {
  for (const date of ['2026-11-10', '', '2026-13-09', '2026-02-30']) assert.throws(() => weekFor(date));
});
test('datumvalidatie en kalenderrekenen incl. schrikkeldag', () => {
  assert.equal(isDate('2028-02-29'), true); assert.equal(isDate('2026-02-29'), false);
  assert.equal(isDate('2026-99-01'), false); assert.equal(isDate('2026-11-31'), false);
  assert.equal(addDays('2028-02-28', 2), '2028-03-01'); assert.equal(mondayOf('2026-11-15'), '2026-11-09');
});
test('Nederlandse komma, decimalen, ontbrekende en ongeldige waarden', () => {
  assert.equal(parseNumber('22,5'), 22.5); assert.equal(parseNumber('0'), 0);
  assert.equal(parseNumber('2.25'), 2.25); assert.equal(parseNumber(''), null);
  assert.equal(parseNumber(null), null); assert.equal(Number.isNaN(parseNumber('1e3')), true);
  assert.equal(Number.isNaN(parseNumber('-2')), true); assert.equal(Number.isNaN(parseNumber('2,5,5')), true);
});
test('alle acht trainingen komen exact uit de bron, in juiste volgorde', () => {
  for (const variant of [1, 2]) for (const day of ['upper_a', 'lower_a', 'upper_b', 'lower_b']) {
    const s = training('2026-11-09', day, variant);
    assert.deepEqual(s.exercises.map(e => e.prescription), program.week_programs[variant][day]);
    assert.equal(s.exercises.length, 8);
    s.exercises.forEach(e => assert.deepEqual(e.instruction, program.exercises[e.exerciseId]));
  }
  assert.equal(Object.keys(program.exercises).length, 35);
});
test('historische v2.1-fixture: 26 van 32 plaatsen blijven gelijk en zes wisselen', () => {
  let changed = 0;
  for (const day of Object.keys(program.days)) program.week_programs[1][day].forEach((p, i) => { if (p.exercise_id !== program.week_programs[2][day][i].exercise_id) changed++; });
  assert.equal(changed, 6);
});
test('trainingen hebben unieke ID’s en zelfstandige historiesnapshots', () => {
  const a = training(), b = training('2026-11-23');
  assert.notEqual(a.id, b.id); a.exercises[0].instruction.setup = 'Gewijzigd';
  assert.notEqual(a.exercises[0].instruction.setup, b.exercises[0].instruction.setup);
  assert.equal(b.exercises[0].instruction.setup, program.exercises.flat_db_press.setup);
});
test('trainingsbron later aanpassen herschrijft historie niet', () => {
  const source = structuredClone(program), s = createSession(source, 'upper_a', 1);
  source.week_programs[1].upper_a[0].sets = 99; source.exercises.flat_db_press.setup = 'nieuw';
  assert.equal(s.exercises[0].prescription.sets, 3); assert.notEqual(s.exercises[0].instruction.setup, 'nieuw');
});
test('vrije volgorde, nieuwe week op nul, duplicaten tellen eenmaal voor 0/4', () => {
  const lower = training('2026-11-12', 'lower_b'), upper = training('2026-11-09', 'upper_a');
  lower.status = upper.status = 'completed';
  assert.equal(weekProgress([lower, upper], '2026-11-09', 1), 2);
  assert.equal(weekProgress([lower, upper, structuredClone(lower)], '2026-11-09', 1), 2);
  assert.equal(weekProgress([lower, upper], '2026-11-16', 2), 0);
  assert.equal(weekProgress([lower, upper], '2026-11-09', 2), 0);
});
test('voltooide trainingen per kalenderweek tellen iedere echte uitvoering', () => {
  const a = training(), b = training('2026-11-10'), c = training('2026-11-16');
  a.status = b.status = 'completed';
  assert.deepEqual(weeklyCounts([a, b, c], '2026-11-09', '2026-11-22'), [{ monday: '2026-11-09', count: 2 }, { monday: '2026-11-16', count: 0 }]);
});
test('PR gebruikt hoogste geldige afgeronde werkset met reps en datum', () => {
  const a = training(), b = training('2026-11-23'); log(a, 'flat_db_press', [20, 22.5], [12, 10]); log(b, 'flat_db_press', [25], [8]);
  const stats = exerciseStats([b, a], 'flat_db_press');
  assert.equal(stats.pr.kg, 25); assert.equal(stats.pr.reps, 8); assert.equal(stats.pr.date, '2026-11-23'); assert.equal(stats.average, 22.5);
});
test('gemiddelde weegt iedere werkset gelijk, niet iedere sessie gelijk', () => {
  const a = training(), b = training('2026-11-23'); log(a, 'flat_db_press', [10, 10, 10]); log(b, 'flat_db_press', [30]);
  const stats = exerciseStats([a, b], 'flat_db_press'); assert.equal(stats.average, 15); assert.equal(stats.runs[1].average, 30);
});
test('laatste vijf uitvoeringen: geen zesde, datumvolgorde i.p.v. invoervolgorde', () => {
  const sessions = Array.from({ length: 6 }, (_, i) => { const s = training(addDays('2026-10-01', i * 3)); log(s, 'flat_db_press', [i + 1]); return s; });
  const stats = exerciseStats(sessions.reverse(), 'flat_db_press'); assert.equal(stats.average, 3.5); assert.equal(stats.recentAverage, 4); assert.equal(stats.latest.date, '2026-10-16');
});
test('opwarmsets, overslaan, onafgerond, ontbreken, NaN en foute reps tellen niet', () => {
  const s = training(), e = log(s, 'flat_db_press', [10, 200, 300, 400, null, NaN, 30]);
  e.sets[1].kind = 'warmup'; e.sets[2].skipped = true; e.sets[3].completed = false; e.sets[6].reps = 2.5;
  const stats = exerciseStats([s], 'flat_db_press'); assert.equal(stats.sets, 1); assert.equal(stats.pr.kg, 10);
});
test('gedeeltelijk opgeslagen training bevat wel geldige afgeronde werksets', () => {
  const s = training(); log(s, 'flat_db_press', [22.5]); assert.equal(s.status, 'active'); assert.equal(exerciseStats([s], 'flat_db_press').pr.kg, 22.5);
});
test('verschillende oefening-ID’s en gewichtsdefinities blijven gescheiden', () => {
  const a = training(), b = training('2026-11-16', 'upper_a', 2); log(a, 'chest_supported_row', [70]); log(b, 'chest_supported_db_row', [20]);
  assert.equal(exerciseStats([a, b], 'chest_supported_row').pr.kg, 70); assert.equal(exerciseStats([a, b], 'chest_supported_db_row').pr.kg, 20);
  const c = training('2026-11-23'); const e = log(c, 'chest_supported_row', [999]); e.measurement.basis = 'total_external';
  assert.equal(exerciseStats([a, c], 'chest_supported_row', { basis: 'machine_stack' }).pr.kg, 70);
});
test('laatste prestatie sluit huidige sessie en latere datums uit', () => {
  const a = training('2026-11-02'), b = training(), future = training('2026-12-01');
  [a, b, future].forEach((s, i) => log(s, 'flat_db_press', [20 + i]));
  const stats = exerciseStats([future, b, a], 'flat_db_press', { excludeSession: b.id, before: b.date }); assert.equal(stats.latest.sessionId, a.id);
});
test('geen gefingeerde resultaten in lege historie', () => {
  const stats = exerciseStats([], 'flat_db_press'); assert.equal(stats.pr, null); assert.equal(stats.average, null); assert.equal(stats.recentAverage, null); assert.equal(stats.latest, null);
});
test('duur, afstand en lichaamsgewicht krijgen eigen valide metingen', () => {
  assert.equal(validSet({ ...newSet(), completed: true, seconds: 20 }, measurement('dead_hang')), true);
  assert.equal(validSet({ ...newSet(), completed: true, kg: 20, meters: 25 }, measurement('farmers_carry')), true);
  assert.equal(validSet({ ...newSet(), completed: true, kg: null, meters: 25 }, measurement('farmers_carry')), false);
  assert.equal(validSet({ ...newSet(), completed: true, reps: 10 }, measurement('hanging_knee')), true);
  assert.equal(validSet({ ...newSet(), completed: true, reps: 10, kg: null }, measurement('back_extension')), true);
  assert.equal(validSet({ ...newSet(), completed: true, reps: 10, kg: null }, measurement('flat_db_press')), false);
});
test('dead hang records en gemiddelden zijn seconden', () => {
  const s = training('2026-11-09', 'upper_b');
  s.exercises.push({ exerciseId: 'dead_hang', measurement: measurement('dead_hang'), sets: [15, 30].map(seconds => ({ ...newSet(), seconds, completed: true })) });
  const stats = exerciseStats([s], 'dead_hang'); assert.equal(stats.pr.seconds, 30); assert.equal(stats.average, 22.5); assert.equal(stats.pr.kg, null);
});
test('carry houdt zowel afstand als gewicht per hand vast', () => {
  const s = training('2026-11-09', 'lower_a'), e = s.exercises.find(e => e.exerciseId === 'farmers_carry');
  e.sets = [{ ...newSet(), completed: true, kg: 16, meters: 25 }, { ...newSet(), completed: true, kg: 18, meters: 30 }];
  const stats = exerciseStats([s], 'farmers_carry'); assert.equal(stats.pr.meters, 30); assert.equal(stats.pr.kg, 18); assert.equal(stats.average, 27.5);
});
test('carry gewichtsrecord blijft onafhankelijk van het afstandsrecord', () => {
  const s = training('2026-11-09', 'lower_a'), e = s.exercises.find(e => e.exerciseId === 'farmers_carry');
  e.sets = [{ ...newSet(), completed: true, kg: 24, meters: 20 }, { ...newSet(), completed: true, kg: 16, meters: 30 }];
  const stats = exerciseStats([s], 'farmers_carry');
  assert.equal(stats.pr.meters, 30); assert.equal(stats.load.pr.kg, 24); assert.equal(stats.load.pr.meters, 20); assert.equal(stats.load.average, 20); assert.equal(stats.runs[0].loadAverage, 20);
});
test('anker aanpassen behoudt originele weekvariant en datum van bestaande sessies', () => {
  const s = training('2026-11-09', 'upper_a', 1), state = stateWith(s);
  state.settings.anchorMonday = '2026-11-02';
  assert.equal(weekFor(state.settings.anchorMonday, s.date).variant, 2);
  assert.equal(state.sessions[0].variant, 1); assert.equal(state.sessions[0].weekMonday, '2026-11-09');
  assert.equal(readBackup(makeBackup(state, program)).sessions[0].variant, 1);
});
test('gewichtsbetekenis is expliciet en volume is consistent gedefinieerd', () => {
  assert.equal(measurement('flat_db_press').basis, 'per_dumbbell'); assert.equal(measurement('hip_thrust').basis, 'total_barbell'); assert.equal(measurement('pulldown_neutral').basis, 'machine_stack');
  const s = training(); log(s, 'flat_db_press', [20, 22.5], [10, 8]); assert.equal(exerciseStats([s], 'flat_db_press').runs[0].volume, 380);
});
test('opwarmset kan afgerond maar telt niet mee voor statistiek', () => {
  const st = { ...newSet('warmup'), kg: 5, reps: 10 }; assert.equal(setError(st, measurement('flat_db_press')), null);
  assert.equal(validSet({ ...st, completed: true }, measurement('flat_db_press')), false);
});
test('herhalingen over worden als optionele gehele waarde gevalideerd', () => {
  const st = { ...newSet(), kg: 20, reps: 10, reserve: 2 }; assert.equal(setError(st, measurement('flat_db_press')), null);
  assert.match(setError({ ...st, reserve: 2.5 }, measurement('flat_db_press')), /heel getal/);
});
test('recordgebeurtenissen tellen alleen echte verbeteringen, geen gelijke waarden', () => {
  const sessions = [20, 22, 22, 21, 24].map((n, i) => { const s = training(addDays('2026-11-01', i)); log(s, 'flat_db_press', [n]); return s; });
  assert.deepEqual(exerciseStats(sessions, 'flat_db_press').records.map(r => r.value), [20, 22, 24]);
});
test('volledige export/import behoudt onafgeronde, overgeslagen en historische data', () => {
  const s = training(); log(s, 'flat_db_press', [22.5]); s.exercises[1].sets[0].skipped = true; s.note = 'Links gevoelig';
  const original = stateWith(s); assert.deepEqual(readBackup(JSON.stringify(makeBackup(original, program))), original);
});
test('samenvoegen overschrijft bestaande training-ID niet, kan herhaald worden', () => {
  const a = training(), b = training('2026-11-23'); const current = stateWith(a); const incoming = stateWith(structuredClone(a), b); incoming.sessions[0].note = 'fout';
  const merged = mergeBackup(current, incoming); assert.equal(merged.sessions.length, 2); assert.equal(merged.sessions[0].note, '');
  assert.equal(mergeBackup(merged, incoming).sessions.length, 2); assert.equal(current.sessions.length, 1);
});
test('vervangen is expliciet en behoudt de lokale opslagrevision', () => {
  const current = stateWith(training()); current.revision = 5; const incoming = stateWith(training('2026-11-23'));
  const result = mergeBackup(current, incoming, 'replace'); assert.equal(result.sessions.length, 1); assert.equal(result.sessions[0].date, '2026-11-23'); assert.equal(result.revision, 5);
});
test('import weigert onbekend formaat, versie, kapotte JSON en ongeldige datums', () => {
  assert.throws(() => readBackup('geen json')); assert.throws(() => readBackup('{}'));
  const backup = makeBackup(stateWith(training()), program);
  for (const change of [b => b.schemaVersion = 99, b => b.data.settings.anchorMonday = '2026-11-10', b => b.data.sessions[0].date = '2026-02-30', b => b.data.sessions[0].timeZone = 'UTC']) { const copy = structuredClone(backup); change(copy); assert.throws(() => readBackup(copy)); }
});
test('import weigert corrupte eenheden, dubbele IDs en ongeldige afgeronde sets', () => {
  const backup = makeBackup(stateWith(training()), program);
  for (const change of [
    b => b.data.sessions.push(structuredClone(b.data.sessions[0])),
    b => b.data.sessions[0].exercises[0].measurement.basis = 'bodyweight',
    b => b.data.sessions[0].exercises[0].measurement.unit = 'lbs',
    b => b.data.sessions[0].exercises[0].sets[0].completed = true,
    b => b.data.sessions[0].exercises[0].sets[0].kg = -3,
    b => b.data.sessions[0].exercises[0].sets[1].id = b.data.sessions[0].exercises[0].sets[0].id,
    b => b.data.sessions[0].status = 'completed',
    b => delete b.data.sessions[0].exercises[0].instruction.setup,
  ]) { const copy = structuredClone(backup); change(copy); assert.throws(() => readBackup(copy)); }
});
test('gedeeltelijk wijzigen en opnieuw afronden verandert eerdere uitvoeringen niet', () => {
  const a = training(), b = training('2026-11-23'); log(a, 'flat_db_press', [20]); log(b, 'flat_db_press', [22]);
  const state = stateWith(a, b); const roundtrip = validateState(JSON.parse(JSON.stringify(state))); roundtrip.sessions[1].exercises[0].sets[0].kg = 25;
  assert.equal(roundtrip.sessions[0].exercises[0].sets[0].kg, 20); assert.equal(state.sessions[1].exercises[0].sets[0].kg, 22);
});
