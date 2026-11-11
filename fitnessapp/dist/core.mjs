export const ZONE = 'Europe/Amsterdam';
export const SCHEMA = 1;
export const DAYS = ['upper_a', 'lower_a', 'upper_b', 'lower_b'];
const DAY_MS = 86400000;
const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });

export function isDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s) || s < '1900-01-01' || s > '2200-12-31') return false;
  const d = new Date(s + 'T12:00:00Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
export function localDate(now = new Date()) {
  const p = Object.fromEntries(fmt.formatToParts(now).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
export function addDays(date, n) {
  if (!isDate(date)) throw new Error('Ongeldige datum.');
  return new Date(Date.parse(date + 'T12:00:00Z') + n * DAY_MS).toISOString().slice(0, 10);
}
export function mondayOf(date = localDate()) {
  if (!isDate(date)) throw new Error('Kies een geldige datum.');
  const weekday = new Date(date + 'T12:00:00Z').getUTCDay();
  return addDays(date, -((weekday + 6) % 7));
}
export function weekFor(anchor, now = new Date()) {
  if (!isDate(anchor) || mondayOf(anchor) !== anchor) throw new Error('Week 1 moet op een maandag beginnen.');
  const date = typeof now === 'string' && isDate(now) ? now : localDate(new Date(now));
  const monday = mondayOf(date);
  const weeks = Math.round((Date.parse(monday + 'T12:00:00Z') - Date.parse(anchor + 'T12:00:00Z')) / DAY_MS / 7);
  return { monday, sunday: addDays(monday, 6), variant: ((weeks % 2) + 2) % 2 + 1, weeks };
}
export function parseNumber(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const s = String(value).trim();
  if (!/^\d+(?:[.,]\d+)?$/.test(s)) return NaN;
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}
const weight = (basis, label, extra = {}) => ({ kind: 'weight', basis, label, unit: 'kg', ...extra });
export function measurement(id) {
  if (['dead_hang', 'assisted_hang'].includes(id)) return { kind: 'duration', basis: 'bodyweight', label: 'Tijdsduur', unit: 's' };
  if (id === 'farmers_carry') return { kind: 'distance', basis: 'per_hand', label: 'kg per hand', unit: 'm', weightLabel: 'kg per hand' };
  if (['scapular_pushup', 'hanging_knee'].includes(id)) return { kind: 'reps', basis: 'bodyweight_plus', label: 'Lichaamsgewicht', unit: 'herh.', optionalWeight: id === 'hanging_knee' };
  if (['back_extension', 'bulgarian', 'reverse_lunge'].includes(id)) return { kind: 'reps', basis: 'total_external', label: 'Totale toegevoegde kg (optioneel)', unit: 'herh.', optionalWeight: true };
  if (['flat_db_press', 'low_incline_db_press', 'chest_supported_db_row', 'side_lying_ext_rotation', 'db_curl', 'hammer_curl', 'reverse_wrist_curl', 'wrist_curl'].includes(id)) return weight('per_dumbbell', 'kg per dumbbell');
  if (['hip_thrust', 'landmine_rotation'].includes(id)) return weight('total_barbell', 'kg totaal, inclusief stang');
  return weight('machine_stack', 'kg op machine / gewichtsstapel');
}
export function reserveText(id) {
  if (['ext_rotation_cable', 'side_lying_ext_rotation', 'scapular_pushup', 'dead_hang', 'assisted_hang'].includes(id)) return 'Algemene richtlijn: houd een ruime marge. Stop vóór pijn of verlies van controle.';
  if (['db_curl', 'hammer_curl', 'lateral_raise', 'pushdown', 'seated_leg_curl', 'lying_leg_curl', 'leg_extension', 'technogym_reverse_fly', 'standing_calf', 'seated_calf', 'wrist_curl', 'reverse_wrist_curl'].includes(id)) return 'Algemene richtlijn: stop wanneer je nog ongeveer 1–3 herhalingen correct zou kunnen uitvoeren.';
  return 'Algemene richtlijn: stop wanneer je nog ongeveer 2 herhalingen correct zou kunnen uitvoeren.';
}
export const uid = () => globalThis.crypto.randomUUID();
export function emptyState() {
  return { app: 'ritme', schemaVersion: SCHEMA, revision: 0, settings: { anchorMonday: null, theme: 'light' }, sessions: [] };
}
export function newSet(kind = 'work') {
  return { id: uid(), kind, kg: null, reps: null, seconds: null, meters: null, reserve: null, note: '', completed: false, skipped: false };
}
export function exerciseEntry(program, spec, optional = false) {
  return { exerciseId: spec.exercise_id, instruction: structuredClone(program.exercises[spec.exercise_id]), prescription: structuredClone(spec), measurement: measurement(spec.exercise_id), optional, skippedReason: null, note: '', sets: Array.from({ length: spec.sets }, () => newSet()) };
}
export function createSession(program, day, variant, date = localDate()) {
  if (!DAYS.includes(day) || ![1, 2].includes(variant) || !isDate(date)) throw new Error('Ongeldige training.');
  const time = new Date().toISOString();
  return { id: uid(), schemaVersion: SCHEMA, programVersion: program.metadata.version, timeZone: ZONE, date, weekMonday: mondayOf(date), day, variant, title: program.days[day] + (variant === 2 ? '2' : ''), status: 'active', startedAt: time, updatedAt: time, completedAt: null, note: '', warmup: program.warmup[day.startsWith('upper') ? 'upper' : 'lower'], safety: program.metadata.safety, exercises: program.week_programs[variant][day].map(s => exerciseEntry(program, s)) };
}
export function validSet(set, m) {
  if (!set.completed || set.skipped || set.kind !== 'work') return false;
  const pos = v => typeof v === 'number' && Number.isFinite(v) && v > 0;
  const kgValid = typeof set.kg === 'number' && Number.isFinite(set.kg) && set.kg >= 0;
  if (m.kind === 'duration') return pos(set.seconds);
  if (m.kind === 'distance') return pos(set.meters) && kgValid;
  if (!pos(set.reps) || !Number.isInteger(set.reps)) return false;
  if (m.kind === 'weight') return kgValid;
  return set.kg === null || kgValid;
}
export function setError(set, m) {
  const candidate = { ...set, kind: 'work', completed: true, skipped: false };
  if (!validSet(candidate, m)) {
    if (m.kind === 'duration') return 'Vul een geldige tijdsduur in seconden in.';
    if (m.kind === 'distance') return 'Vul gewicht en een afstand groter dan nul in.';
    return m.kind === 'weight' ? 'Vul een geldig gewicht en een heel aantal herhalingen groter dan nul in.' : 'Vul een heel aantal herhalingen groter dan nul en eventueel een geldig gewicht in.';
  }
  if (set.reserve !== null && (!Number.isInteger(set.reserve) || set.reserve < 0 || set.reserve > 30)) return 'Herhalingen over: vul een heel getal van 0 t/m 30 in.';
  return null;
}
export function metricFor(m) { return ({ weight: 'kg', duration: 'seconds', distance: 'meters', reps: 'reps' })[m.kind]; }
const mean = a => a.length ? a.reduce((s, n) => s + n, 0) / a.length : null;
export function exerciseStats(sessions, id, options = {}) {
  const runs = [];
  for (const session of sessions) {
    if (session.id === options.excludeSession || (options.before && session.date > options.before)) continue;
    for (const entry of session.exercises) {
      if (entry.exerciseId !== id) continue;
      if (options.basis && entry.measurement.basis !== options.basis) continue;
      const sets = entry.sets.filter(s => validSet(s, entry.measurement));
      if (!sets.length) continue;
      const metric = metricFor(entry.measurement);
      runs.push({ sessionId: session.id, date: session.date, startedAt: session.startedAt, title: session.title, basis: entry.measurement.basis, measurement: entry.measurement, sets, average: mean(sets.map(s => s[metric])), loadAverage: mean(sets.filter(s => s.kg !== null).map(s => s.kg)), reps: sets.reduce((a, s) => a + (s.reps ?? 0), 0), volume: entry.measurement.kind === 'weight' ? sets.reduce((a, s) => a + s.kg * s.reps, 0) : null });
    }
  }
  runs.sort((a, b) => a.date.localeCompare(b.date) || a.startedAt.localeCompare(b.startedAt) || a.sessionId.localeCompare(b.sessionId));
  // A basis is immutable for each exercise ID. Imported older definitions remain separate.
  const basis = options.basis ?? runs.at(-1)?.basis;
  const filtered = runs.filter(r => r.basis === basis);
  if (!filtered.length) return { runs: [], pr: null, average: null, recentAverage: null, latest: null, sets: 0, records: [], load: null };
  const metric = metricFor(filtered[0].measurement);
  const all = filtered.flatMap(r => r.sets.map(s => ({ ...s, date: r.date, sessionId: r.sessionId })));
  const pr = all.reduce((best, s) => !best || s[metric] > best[metric] ? s : best, null);
  let best = -Infinity;
  const records = filtered.flatMap(r => { const max = Math.max(...r.sets.map(s => s[metric])); if (max <= best) return []; best = max; return [{ date: r.date, value: max, sessionId: r.sessionId }]; });
  const loaded = all.filter(s => s.kg !== null);
  const load = loaded.length ? { pr: loaded.reduce((best, s) => !best || s.kg > best.kg ? s : best, null), average: mean(loaded.map(s => s.kg)), recentAverage: mean(filtered.slice(-5).flatMap(r => r.sets.filter(s => s.kg !== null).map(s => s.kg))) } : null;
  return { runs: filtered, pr, average: mean(all.map(s => s[metric])), recentAverage: mean(filtered.slice(-5).flatMap(r => r.sets.map(s => s[metric]))), latest: filtered.at(-1), sets: all.length, records, load };
}
export function weekProgress(sessions, monday, variant) {
  return DAYS.filter(day => sessions.some(s => s.weekMonday === monday && s.variant === variant && s.day === day && s.status === 'completed')).length;
}
export function weeklyCounts(sessions, start, end) {
  const result = [];
  for (let w = mondayOf(start); w <= end; w = addDays(w, 7)) result.push({ monday: w, count: sessions.filter(s => s.weekMonday === w && s.status === 'completed').length });
  return result;
}
export function makeBackup(state, program) {
  return { format: 'ritme-backup', schemaVersion: SCHEMA, exportedAt: new Date().toISOString(), timeZone: ZONE, program: structuredClone(program), data: structuredClone(state) };
}
const plain = x => x && typeof x === 'object' && !Array.isArray(x);
const assert = (ok, msg) => { if (!ok) throw new Error('Ongeldige back-up: ' + msg); };
const textOk = (s, max = 10000) => typeof s === 'string' && s.length <= max;
const timestamp = s => typeof s === 'string' && Number.isFinite(Date.parse(s));
export function validateState(state) {
  assert(plain(state) && state.app === 'ritme' && state.schemaVersion === SCHEMA, 'onbekend bestand of niet-ondersteunde versie.');
  assert(Number.isInteger(state.revision) && state.revision >= 0, 'versie ontbreekt.');
  assert(plain(state.settings) && ['light', 'dark', 'system'].includes(state.settings.theme), 'instellingen ontbreken.');
  const anchor = state.settings.anchorMonday;
  assert(anchor === null || (isDate(anchor) && mondayOf(anchor) === anchor), 'de startdatum moet een maandag zijn.');
  assert(Array.isArray(state.sessions) && state.sessions.length <= 50000, 'trainingen ontbreken of bestand te groot.');
  const ids = new Set();
  for (const session of state.sessions) {
    assert(plain(session) && textOk(session.id, 100) && session.id.length > 0 && !ids.has(session.id), 'dubbele of ontbrekende training-ID.'); ids.add(session.id);
    assert(session.schemaVersion === SCHEMA && session.timeZone === ZONE && textOk(session.programVersion, 50), 'schema of tijdzone klopt niet.');
    assert(isDate(session.date) && session.weekMonday === mondayOf(session.date), 'trainingsdatum of kalenderweek klopt niet.');
    assert(DAYS.includes(session.day) && [1, 2].includes(session.variant) && textOk(session.title, 150), 'trainingstype klopt niet.');
    assert(['active', 'paused', 'completed'].includes(session.status) && timestamp(session.startedAt) && timestamp(session.updatedAt), 'status of tijdstempel klopt niet.');
    assert(session.completedAt === null || timestamp(session.completedAt), 'afrondtijd klopt niet.');
    assert((session.status === 'completed') === (session.completedAt !== null), 'afrondstatus en afrondtijd verschillen.');
    assert(textOk(session.note) && textOk(session.warmup) && textOk(session.safety), 'trainingsinformatie ontbreekt.');
    assert(Array.isArray(session.exercises) && session.exercises.length > 0 && session.exercises.length <= 100, 'oefeningen ontbreken.');
    const exerciseIds = new Set();
    for (const e of session.exercises) {
      assert(plain(e) && textOk(e.exerciseId, 100) && e.exerciseId.length > 0 && !exerciseIds.has(e.exerciseId), 'oefening-ID ontbreekt of is dubbel.'); exerciseIds.add(e.exerciseId);
      assert(plain(e.instruction) && ['name', 'muscles', 'setup', 'movement', 'cues', 'avoid', 'adjust'].every(k => textOk(e.instruction[k])), 'oefenuitleg ontbreekt.');
      assert(plain(e.prescription) && e.prescription.exercise_id === e.exerciseId && Number.isInteger(e.prescription.sets) && e.prescription.sets > 0 && e.prescription.sets <= 100 && textOk(e.prescription.reps, 100) && textOk(e.prescription.rest, 100), 'oefenvoorschrift klopt niet.');
      const m = e.measurement;
      assert(plain(m) && ['weight', 'duration', 'distance', 'reps'].includes(m.kind) && ['per_dumbbell', 'per_hand', 'machine_stack', 'total_barbell', 'total_external', 'bodyweight', 'bodyweight_plus'].includes(m.basis) && textOk(m.label, 150) && textOk(m.unit, 30), 'meeteenheid klopt niet.');
      const bases = { weight: ['per_dumbbell', 'machine_stack', 'total_barbell', 'total_external'], distance: ['per_hand'], duration: ['bodyweight'], reps: ['bodyweight', 'bodyweight_plus', 'total_external'] };
      assert(bases[m.kind].includes(m.basis) && m.unit === { weight: 'kg', distance: 'm', duration: 's', reps: 'herh.' }[m.kind], 'meettype en gewichtsdefinitie verschillen.');
      assert((e.skippedReason === null || textOk(e.skippedReason, 250)) && textOk(e.note) && typeof e.optional === 'boolean', 'oefeningstatus klopt niet.');
      assert(Array.isArray(e.sets) && e.sets.length <= 200, 'sets ontbreken of te veel sets.');
      const setIds = new Set();
      for (const s of e.sets) {
        assert(plain(s) && textOk(s.id, 100) && s.id.length > 0 && !setIds.has(s.id), 'dubbele of ontbrekende set-ID.'); setIds.add(s.id);
        assert(['work', 'warmup'].includes(s.kind) && typeof s.completed === 'boolean' && typeof s.skipped === 'boolean' && !(s.completed && s.skipped) && textOk(s.note), 'setstatus klopt niet.');
        for (const k of ['kg', 'reps', 'seconds', 'meters', 'reserve']) assert(s[k] === null || (typeof s[k] === 'number' && Number.isFinite(s[k]) && s[k] >= 0 && s[k] <= 1000000), 'ongeldige meetwaarde.');
        assert(s.reps === null || Number.isInteger(s.reps), 'herhalingen zijn geen heel getal.');
        assert(s.reserve === null || (Number.isInteger(s.reserve) && s.reserve <= 30), 'herhalingen over kloppen niet.');
        assert(!s.completed || validSet({ ...s, kind: 'work' }, m), 'een afgeronde set bevat ongeldige gegevens.');
      }
    }
  }
  return structuredClone(state);
}
export function readBackup(raw) {
  let b;
  try { b = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { throw new Error('Dit bestand bevat geen geldige JSON.'); }
  assert(plain(b) && b.format === 'ritme-backup' && b.schemaVersion === SCHEMA && b.timeZone === ZONE, 'kies een Ritme-back-up (versie 1).');
  assert(plain(b.program) && plain(b.program.metadata) && plain(b.program.exercises), 'de programmabron ontbreekt.');
  return validateState(b.data);
}
export function mergeBackup(current, incoming, mode = 'merge') {
  const imported = validateState(incoming);
  if (mode === 'replace') return { ...imported, revision: current.revision };
  if (mode !== 'merge') throw new Error('Onbekende importmethode.');
  const known = new Set(current.sessions.map(s => s.id));
  return { ...structuredClone(current), settings: current.settings.anchorMonday ? { ...current.settings } : { ...imported.settings }, sessions: [...structuredClone(current.sessions), ...imported.sessions.filter(s => !known.has(s.id))] };
}
