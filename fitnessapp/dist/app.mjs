import { ZONE, DAYS, localDate, mondayOf, addDays, weekFor, parseNumber, measurement, reserveText, emptyState, newSet, createBestSession as createSession, exerciseEntry, validSet, setError, metricFor, exerciseStats, weekProgress, weeklyCounts, makeBackup, readBackup, mergeBackup, PROGRAM_START, trainingWeek, trainingTitle, trainingSelection, canRegister, suggestedSet, adjustNumber, recordedBefore, bestSetIndex, exerciseDone, orderedExercises, nextExerciseIndex, recordBest } from './core.mjs';
import { LocalStore } from './storage.mjs';

const icons = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/>',
  chart: '<path d="M4 3v17h17M8 15l4-5 4 2 5-7"/>',
  history: '<path d="M3 11a9 9 0 1 1 2 7M3 5v6h6m3-5v6l4 2"/>',
  book: '<path d="M12 5C9 3 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-6-1-9 1v15"/>',
  settings: '<path d="m9 3-1 3-3 1v3l-2 2 2 2v3l3 1 1 3h6l1-3 3-1v-3l2-2-2-2V7l-3-1-1-3z"/><circle cx="12" cy="12" r="3"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
  left: '<path d="m14 6-6 6 6 6"/>', right: '<path d="m10 6 6 6-6 6"/>', down: '<path d="m6 9 6 6 6-6"/>',
  check: '<path d="m5 12 4 4L19 6"/>', plus: '<path d="M12 5v14M5 12h14"/>', close: '<path d="m6 6 12 12M6 18 18 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h1m4 0h1"/>',
  dumbbell: '<path d="m7 7 10 10M3 8l5-5m8 18 5-5M2 5l3-3m14 20 3-3M5 10l5-5m4 14 5-5"/>',
  lower: '<path d="M8 3v6l-4 5 4 7m8-18v6l4 5-4 7M8 9h8M9 21l3-6 3 6"/>',
  layers: '<path d="m12 3 10 5-10 5L2 8zm-9 10 9 5 9-5m-18 5 9 5 9-5"/>',
  leaf: '<path d="M20 3C8 2 2 8 5 15c3 7 15 2 15-12ZM5 20 16 8"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9S4 17 4 12V6z"/><path d="m8 12 3 3 5-6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 17v4h16v-4"/>',
  trophy: '<path d="M8 3h8v6c0 6-8 6-8 0zM8 5H4v3c0 3 2 4 5 4m7-7h4v3c0 3-2 4-5 4m-3 2v5m-4 2h8"/>',
  pause: '<path d="M8 5v14M16 5v14"/>', play: '<path d="m8 4 12 8-12 8z"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  skip: '<path d="m6 6 12 12M18 6 6 18"/>', trash: '<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',
  spark: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/>',
  cloud: '<path d="M7 18H6a4 4 0 0 1-1-8 7 7 0 0 1 13-2 5 5 0 0 1 0 10h-1m-8-2 3 3 5-6"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
};
const icon = (name, cls = '') => `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true">${icons[name] || icons.info}</svg>`;
const esc = v => String(v ?? '').replace(/[&<>"']/g, x => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[x]);
const num = v => v === null || v === undefined ? '—' : new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 2 }).format(v);
const inputNum = v => v === null || v === undefined ? '' : String(v).replace('.', ',');
const dateFmt = (d, options = {}) => new Intl.DateTimeFormat('nl-NL', { timeZone: ZONE, day: 'numeric', month: 'short', ...options }).format(new Date(d + 'T12:00:00Z'));
const rangeFmt = w => `${dateFmt(w.monday)} – ${dateFmt(w.sunday, { year: 'numeric' })}`;
const $ = s => document.querySelector(s);
const modal = $('#modal');
const app = $('#app');
let program, state = emptyState(), database;
let view = { page: 'home', weekOffset: 0, statsExercise: 'flat_db_press', period: '90', chartMetric: 'average', historyPeriod: 'all', libraryFilter: 'all', librarySearch: '', manualDay: null, manualWeek: null };
let saveError = '', fatalError = '', saving = null, editVersion = 0, savedVersion = 0;
let initialMonday = mondayOf();
let installPrompt = null, timer = null, timerTick = null;
let toastTimeout, modalReturnFocus, afterModal = null;
let updateReady = false;
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const hadController = Boolean(navigator.serviceWorker?.controller);
const entryKey = (ei, si) => `data-ei="${ei}" data-si="${si}"`;

function toast(message) {
  clearTimeout(toastTimeout); const el = $('#toast'); el.textContent = message; el.classList.add('show');
  toastTimeout = setTimeout(() => el.classList.remove('show'), 4200);
}
function applyTheme() {
  const dark = state.settings.theme === 'dark' || (state.settings.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}
function updateSaveStatus() {
  document.querySelectorAll('[data-save-status]').forEach(el => {
    el.innerHTML = icon(saveError ? 'info' : 'check') + (saveError ? 'Niet opgeslagen' : saving ? 'Opslaan…' : 'Opgeslagen op dit apparaat');
  });
}
function persist() {
  editVersion++;
  if (fatalError) return Promise.resolve(false);
  if (!saving) {
    saveError = '';
    saving = (async () => {
      try {
        while (savedVersion < editVersion) {
          const version = editVersion;
          const revision = await database.save(state, state.revision);
          state.revision = revision; savedVersion = version;
        }
        return true;
      } catch (e) { saveError = e.message || 'Je apparaat kon niet opslaan. Maak een back-up.'; toast('Opslaan is mislukt. Maak een back-up via Instellingen.'); return false; }
      finally { saving = null; updateSaveStatus(); if (saveError) renderError(); }
    })();
  }
  updateSaveStatus();
  return saving;
}
function currentWeek() { return trainingWeek(); }
function selectedWeek() { return trainingWeek(addDays(currentWeek().monday, view.weekOffset * 7)); }
function recordedSessions() { return recordedBefore(state.sessions); }
function session() { return view.page === 'home' ? workoutContext().s : state.sessions.find(s => s.id === view.sessionId); }
function titleFor(day, variant) { return trainingTitle(day, variant); }
function statusFor(day, w) { return trainingSelection(state.sessions, w).rows.find(r => r.day === day)?.session; }
function navButton(page, label, i) {
  const selected = view.page === page || (page === 'more' && ['history', 'settings'].includes(view.page)) || (page === 'schema' && view.page === 'workout');
  return `<button data-action="nav" data-page="${page}" class="${selected ? 'active' : ''}" ${selected ? 'aria-current="page"' : ''}>${icon(i)}<span>${label}</span></button>`;
}
function render() {
  if (!program) return;
  const nav = navButton('home', 'Training', 'dumbbell') + navButton('schema', 'Schema', 'calendar') + navButton('stats', 'Statistieken', 'chart') + navButton('library', 'Oefeningen', 'book') + navButton('more', 'Meer', 'more');
  const pageLabel = { home: 'Training', workout: 'Training bekijken', schema: 'Schema', stats: 'Statistieken', history: 'Geschiedenis', library: 'Oefeningen', settings: 'Instellingen', more: 'Meer' }[view.page];
  const body = ({ home: homePage, workout: workoutPage, schema: schemaPage, stats: statsPage, history: historyPage, settings: settingsPage, library: libraryPage, more: morePage }[view.page] || homePage)();
  app.innerHTML = `<div class="shell v2 ${view.page === 'home' ? 'training-home' : ''}"><aside class="sidebar"><a class="brand" href="#home" data-action="nav" data-page="home" aria-label="Ritme, naar Training"><span class="brand-mark">r.</span>ritme<span style="color:#839a69">.</span></a><nav class="nav" aria-label="Hoofdnavigatie">${nav}</nav><div class="sidebar-bottom"><span class="small muted">Ritme 2.1 · Alleen op dit apparaat</span></div></aside><div class="workspace">${view.page === 'home' ? '' : `<header class="topbar"><a class="brand mobile-brand" href="#home" data-action="nav" data-page="home" aria-label="Ritme, naar Training"><span class="brand-mark">r.</span>ritme.</a><span class="topbar-title">${pageLabel}</span><div class="topbar-right"><span class="connection ${navigator.onLine ? '' : 'offline'}">${navigator.onLine ? 'Lokaal bewaard' : 'Offline beschikbaar'}</span><button class="icon-btn" data-action="nav" data-page="more" aria-label="Meer opties">${icon('more')}</button></div></header>`}<main class="content ${['home', 'workout'].includes(view.page) ? 'training-content' : ''}" id="main"><div id="storage-error"></div>${body}</main></div><nav class="mobile-nav" aria-label="Hoofdnavigatie">${nav}</nav></div><div id="timer-slot"></div>`;
  applyTheme(); renderError(); updateSaveStatus(); renderTimer();
}
function renderError() {
  const el = $('#storage-error'); if (!el) return;
  el.innerHTML = fatalError || saveError ? `<div class="notice error error-box" role="alert">${icon('info')}<div><strong>Opslaan vraagt je aandacht</strong><p>${esc(fatalError || saveError)}</p><button data-action="export">Download een back-up</button> · <button data-action="reload">App herladen</button>${!fatalError ? ' · <button data-action="retry-save">Opnieuw opslaan</button>' : ''}</div></div>` : '';
  if (updateReady) el.innerHTML += `<div class="notice update-notice">${icon('reset')}<p>Een nieuwe versie staat klaar.</p><button class="link-btn" data-action="apply-update">App bijwerken</button></div>`;
}
function weekLabel(w) { return `Week ${w.iso.number} · ${w.iso.year}${w.official ? ' · trainingsweek ' + w.trainingNumber : ' · voorbeeld'}`; }
function homePage() {
  const w = currentWeek(), selection = trainingSelection(state.sessions, w);
  if (!selection.next && !(view.manualDay && view.manualWeek === w.monday)) {
    return `<div class="training-weekline">${weekLabel(w)}</div><section class="panel week-complete"><span class="complete-icon">${icon('check')}</span><h1>Je week is compleet.</h1><p>Vier trainingen afgerond. Je volgende weektype verschijnt vanzelf bij de nieuwe kalenderweek.</p></section>${schemaRows(w, selection)}<button class="btn outline wide space-top" data-action="nav" data-page="schema">Bekijk je schema ${icon('arrow')}</button>`;
  }
  return workoutPage();
}
function schemaRows(w, selection = trainingSelection(state.sessions, w)) {
  return `<div class="schema-list">${selection.rows.map((r, i) => `<button class="schema-row ${r.day === selection.next ? 'next' : ''}" data-action="open-workout" data-day="${r.day}" data-variant="${w.variant}" data-date="${w.monday === currentWeek().monday ? localDate() : w.monday}"><span class="schema-index ${r.completed ? 'done' : ''}">${r.completed ? icon('check') : String(i + 1).padStart(2, '0')}</span><span class="grow"><strong>${r.title}</strong><small>${focusFor(r.day)}</small></span><span class="schema-status">${!w.official || w.monday > currentWeek().monday ? 'Bekijken' : r.completed ? 'Voltooid' : r.session ? 'Bezig' : r.day === selection.next ? 'Volgende' : 'Open'}</span>${icon('right')}</button>`).join('')}</div>`;
}
function schemaPage() {
  const w = selectedWeek(), selection = trainingSelection(state.sessions, w);
  return `<div class="page-intro compact"><div><h1>Schema</h1><p class="lead">Vier trainingen. Jij kiest wanneer.</p></div><span class="tag soft">Weektype ${w.variant}</span></div><div class="schema-week-picker"><button class="icon-btn" data-action="week" data-offset="-1" aria-label="Vorige kalenderweek">${icon('left')}</button><div><h2>Week ${w.iso.number} <span class="muted">${w.iso.year}</span></h2><p>${rangeFmt(w)}${w.official ? ' · trainingsweek ' + w.trainingNumber : ' · voorbeeld'}</p></div><button class="icon-btn" data-action="week" data-offset="1" aria-label="Volgende kalenderweek">${icon('right')}</button></div><div class="row between schema-week-meta"><span>${w.official && w.monday <= currentWeek().monday ? `${selection.completed} van 4 voltooid` : 'Alleen bekijken'}</span><button class="link-btn" data-action="this-week">${view.weekOffset ? 'Naar huidige week' : 'Huidige week'}</button></div>${schemaRows(w, selection)}<div class="rotation-note">${icon('reset')}<p>Weektype 1 en 2 wisselen elkaar af. De volgorde is steeds Lower, Upper, Lower, Upper. Je voortgang bepaalt je volgende training binnen de week; de kalender bepaalt het weektype.</p></div>`;
}
function focusFor(day) { return ({ lower_a: 'Benen, core & grip', upper_a: 'Borst, rug & schoudercontrole', lower_b: 'Billen, benen & core', upper_b: 'Rug, schouders & armen' })[day]; }
function workoutContext() {
  const home = view.page === 'home';
  const week = home ? currentWeek() : trainingWeek(view.date || localDate());
  const selection = trainingSelection(state.sessions, week);
  const focus = state.settings.trainingFocus;
  const remembered = focus?.weekMonday === week.monday && !selection.rows.find(r => r.day === focus.day)?.completed ? focus.day : null;
  const day = home ? (view.manualWeek === week.monday ? view.manualDay : null) || remembered || selection.next || DAYS[0] : view.day || DAYS[0];
  const existing = state.sessions.find(s => s.id === view.sessionId) || (home ? selection.rows.find(r => r.day === day)?.session : null);
  const variant = existing?.variant || (home ? week.variant : Number(view.variant) || week.variant);
  const date = existing?.date || (home ? localDate() : view.date || localDate());
  const key = `${day}:${variant}:${date}`;
  if (!existing && view.draftKey !== key) { view.draft = createSession(program, day, variant, date); view.draftKey = key; }
  const draft = existing || view.draft;
  const editable = !fatalError && (existing ? existing.status !== 'completed' && !view.browsing && existing.date <= localDate() : !view.browsing && canRegister(date));
  return { s: existing || null, draft, day, variant, date, week, title: titleFor(day, variant), entries: draft.exercises, editable };
}
function ensureSession() {
  const ctx = workoutContext();
  if (!ctx.editable) { toast(ctx.week.official ? 'Kies deze training om hem uit te voeren.' : 'Dit is een voorbeeld. Er wordt nog geen voortgang aangemaakt.'); return null; }
  state.settings.trainingFocus = { day: ctx.day, weekMonday: ctx.week.monday };
  if (ctx.s) return ctx.s;
  state.sessions.push(ctx.draft); view.sessionId = ctx.draft.id;
  navigator.storage?.persist?.().catch(() => {});
  return ctx.draft;
}
function workoutPage() {
  const ctx = workoutContext(), { s, day, variant, title, entries, week, editable } = ctx;
  const completed = s?.status === 'completed';
  const valid = entries.filter(exerciseDone).length;
  const total = entries.length;
  const selection = trainingSelection(state.sessions, week);
  const current = week.monday === currentWeek().monday;
  return `${view.page === 'workout' ? `<button class="back" data-action="nav" data-page="${view.fromHistory ? 'history' : 'schema'}">${icon('back')}${view.fromHistory ? 'Geschiedenis' : 'Schema'}</button>` : ''}<div class="training-weekline">${weekLabel(week)}<span class="tag ${completed ? 'lime' : !week.official || !current ? 'soft' : 'soft'}">${completed ? 'Voltooid' : !week.official || ctx.date > localDate() ? 'Voorbeeld' : s?.status === 'paused' ? 'Gepauzeerd' : s ? 'Bezig' : 'Staat klaar'}</span></div><div class="training-title-row"><div><h1>${esc(title)}</h1><p>${focusFor(day)}</p></div>${view.page === 'home' ? `<label class="training-switch"><span class="sr-only">Andere training kiezen</span><select id="active-training" aria-label="Andere training kiezen">${selection.rows.map(r => `<option value="${r.day}" ${day === r.day ? 'selected' : ''}>${r.title}${r.completed ? ' ✓' : ''}</option>`).join('')}</select></label>` : ''}</div>
    <div class="training-progress-row"><span data-training-progress>${valid} / ${total} oefeningen</span><div class="linear-progress"><span data-training-bar style="width:${total ? Math.min(100, valid / total * 100) : 0}%"></span></div></div>
    ${view.page === 'workout' && current && week.official && !completed && !view.fromHistory ? `<button class="btn primary wide choose-training" data-action="choose-workout">${icon('play')}Deze training kiezen</button>` : ''}
    ${completed ? `<button class="btn outline wide choose-training" data-action="reopen">${icon('reset')}Voltooiing herstellen / registratie aanpassen</button>` : ''}
    ${!week.official && !s ? `<p class="preview-note">Voorbeeld · je kunt je programma bekijken; registraties zijn nog niet actief.</p>` : ''}
    <div class="exercise-list">${orderedExercises(entries).map(({ entry, index }) => exerciseCard(entry, index, ctx)).join('')}</div>
    ${day === 'upper_b' && !entries.some(e => e.exerciseId === 'dead_hang') ? `<div class="optional-finisher"><div><strong>Dead hang · optioneel</strong><p>${esc(program.finisher.upper_b)}</p></div><button class="icon-btn" data-action="exercise-info" data-exercise="dead_hang" aria-label="Uitleg optionele dead hang">${icon('info')}</button>${editable ? '<button class="btn outline" data-action="add-finisher">Toevoegen</button>' : ''}</div>` : ''}
    ${valid === total ? '<p class="checklist-complete" role="status">Alle oefeningen afgerond. Klaar om je training af te sluiten.</p>' : ''}
    ${editable ? `<div class="finish-bar"><div><strong data-training-progress>${valid} / ${total} oefeningen</strong></div><div class="row"><button class="icon-btn" data-action="pause" aria-label="Training pauzeren en bewaren">${icon('pause')}</button><button class="btn primary" data-action="finish">${icon('check')}Training afronden</button></div></div>` : ''}
    ${s ? `<div class="session-bottom-actions"><button class="btn quiet" data-action="session-options">${icon('more')}Registratie beheren</button></div>` : ''}`;
}
function exerciseCard(e, ei, ctx) {
  const m = e.measurement, p = e.prescription, done = exerciseDone(e), si = view.bestIndices?.[ctx.draft.id + ':' + ei] ?? bestSetIndex(e);
  return `<section class="exercise-card exercise-compact ${done ? 'exercise-done' : ''}" data-exercise-card="${ei}" aria-labelledby="exercise-title-${ei}"><header class="exercise-top"><span class="exercise-number ${done ? 'done' : ''}">${done ? icon('check') : String(ei + 1).padStart(2, '0')}</span><button class="exercise-name" id="exercise-title-${ei}" data-action="exercise-info" data-exercise="${e.exerciseId}" data-ei="${ei}">${esc(e.instruction.name)}</button><button class="icon-btn exercise-info" data-action="exercise-info" data-exercise="${e.exerciseId}" data-ei="${ei}" aria-label="Uitleg en prestaties: ${esc(e.instruction.name)}">${icon('info')}</button></header><div class="exercise-prescription">${p.sets} × ${esc(p.reps)} <span>·</span> ${esc(p.rest)} rust</div><div class="exercise-body"><div class="best-label">Beste set <span>${esc(m.label)}</span></div><div class="set-head compact-set-head"><span>${m.kind === 'duration' ? 'SECONDEN' : m.kind === 'reps' && !m.optionalWeight ? 'HERHALINGEN' : m.kind === 'distance' ? 'KG PER HAND' : m.basis === 'per_dumbbell' ? 'KG / DUMBBELL' : m.optionalWeight ? 'EXTRA KG · OPT.' : 'KILOGRAM'}</span><span>${m.kind === 'duration' || m.kind === 'reps' && !m.optionalWeight ? '' : m.kind === 'distance' ? 'METERS' : 'HERHALINGEN'}</span><span class="sr-only">Oefening afvinken</span></div>${setRow(e.sets[si], si, ei, e, !ctx.editable, ctx)}</div></section>`;
}
function quickWeights(id) {
  if (['ext_rotation_cable', 'side_lying_ext_rotation', 'wrist_curl', 'reverse_wrist_curl'].includes(id)) return [.5, 1, 2.5, 5];
  if (['lateral_raise', 'db_curl', 'hammer_curl'].includes(id)) return [2.5, 5, 7.5, 10];
  if (['pallof', 'farmers_carry', 'cable_woodchop'].includes(id)) return [5, 10, 15, 20];
  return measurement(id).basis === 'per_dumbbell' ? [5, 10, 20, 30] : [40, 60, 80, 100];
}
function weightStep(id) { return state.settings.weightSteps?.[id] || (['ext_rotation_cable', 'side_lying_ext_rotation', 'wrist_curl', 'reverse_wrist_curl', 'lateral_raise', 'db_curl', 'hammer_curl'].includes(id) ? .5 : 2.5); }
function setRow(st = newSet(), si, ei, entry, readonly, ctx) {
  const m = entry.measurement, key = entryKey(ei, si);
  const proposal = suggestedSet(entry, si, recordedSessions(), ctx.s || ctx.draft);
  const field = (name, label) => {
    const value = st[name] ?? proposal[name];
    const suggested = st[name] === null && value !== null;
    return `<div class="number-stepper ${suggested ? 'suggested' : ''}"><button data-action="step" data-field="${name}" data-direction="-1" ${key} aria-label="Beste set: ${label} verlagen" ${readonly ? 'disabled' : ''}>−</button><input type="text" inputmode="${name === 'reps' ? 'numeric' : 'decimal'}" autocomplete="off" maxlength="12" data-set-field="${name}" ${key} data-proposed="${suggested}" value="${esc(inputNum(value))}" aria-label="Beste set: ${label}" placeholder="—" ${readonly ? 'readonly' : ''}><button data-action="step" data-field="${name}" data-direction="1" ${key} aria-label="Beste set: ${label} verhogen" ${readonly ? 'disabled' : ''}>+</button></div>`;
  };
  return `<div class="set-row ${exerciseDone(entry) ? 'completed' : ''}">${m.kind === 'duration' ? field('seconds', 'seconden') + '<span></span>' : m.kind === 'reps' && !m.optionalWeight ? field('reps', 'herhalingen') + '<span></span>' : field('kg', m.label) + field(m.kind === 'distance' ? 'meters' : 'reps', m.kind === 'distance' ? 'meters' : 'herhalingen')}<button class="set-check ${exerciseDone(entry) ? 'checked' : ''}" data-action="complete-exercise" ${key} aria-label="${esc(entry.instruction.name)} ${exerciseDone(entry) ? 'opnieuw activeren' : 'afvinken'}" aria-pressed="${exerciseDone(entry)}" ${readonly ? 'disabled' : ''}>${icon('check')}</button></div>`;
}
function exerciseOptions(ei) {
  const ctx = workoutContext(), e = ctx.entries[ei];
  showModal(dialogContent(esc(e.instruction.name), `<p class="lead" style="font-size:12px">${esc(reserveText(e.exerciseId))}</p><p class="lead" style="font-size:12px">Links + rechts vormen bij eenzijdige oefeningen samen één set. Noteer verschillen in de setnotitie.</p>${e.sets.map((st, si) => `<details class="set-option"><summary>Set ${si + 1} · ${st.completed ? 'afgerond' : st.skipped ? 'overgeslagen' : 'open'}</summary><div class="form-grid"><div class="field"><label for="reserve-${ei}-${si}">Herhalingen over</label><input id="reserve-${ei}-${si}" type="text" inputmode="numeric" data-set-field="reserve" ${entryKey(ei, si)} value="${esc(inputNum(st.reserve))}"></div><div class="field"><label for="kind-${ei}-${si}">Type set</label><select id="kind-${ei}-${si}" data-set-field="kind" ${entryKey(ei, si)}><option value="work" ${st.kind === 'work' ? 'selected' : ''}>Werkset</option><option value="warmup" ${st.kind === 'warmup' ? 'selected' : ''}>Opwarmset</option></select></div></div><div class="field"><label for="note-${ei}-${si}">Setnotitie</label><input type="text" id="note-${ei}-${si}" data-set-field="note" ${entryKey(ei, si)} value="${esc(st.note)}"></div><div class="row wrap"><button class="btn outline" data-action="skip-set" ${entryKey(ei, si)}>${st.skipped ? 'Toch uitvoeren' : 'Set overslaan'}</button><button class="btn danger" data-action="remove-set" ${entryKey(ei, si)}>Set verwijderen</button></div></details>`).join('')}<div class="field space-top"><label for="option-exercise-note">Oefeningnotitie</label><textarea id="option-exercise-note" data-exercise-note data-ei="${ei}">${esc(e.note)}</textarea></div><button class="btn outline space-top" data-action="skip-exercise" data-ei="${ei}">${e.skippedReason ? 'Overslaan opheffen' : 'Oefening overslaan'}</button>`));
}
function morePage() {
  return `<div class="page-intro compact"><h1>Meer</h1><span class="tag soft">Ritme 2.1</span></div><div class="more-list"><button data-action="nav" data-page="history">${icon('history')}<span><strong>Geschiedenis</strong><small>Trainingen terugkijken en achteraf invoeren</small></span>${icon('right')}</button><button data-action="nav" data-page="settings">${icon('settings')}<span><strong>Instellingen & back-ups</strong><small>Weergave, exporteren en herstellen</small></span>${icon('right')}</button><button data-action="export">${icon('download')}<span><strong>Back-up downloaden</strong><small>Je volledige logboek als JSON</small></span>${icon('right')}</button><button data-action="install">${icon('plus')}<span><strong>Op je beginscherm</strong><small>Ritme installeren en offline gebruiken</small></span>${icon('right')}</button></div><p class="local-data-note">${icon('shield')}Je gegevens blijven op dit apparaat. Er is geen automatische synchronisatie. Bewaar regelmatig een back-up.</p>`;
}
function libraryPage() {
  const category = view.libraryFilter || 'all', search = view.librarySearch || '';
  const options = [1, 2].flatMap(v => DAYS.map(d => `<option value="${v}:${d}" ${category === v + ':' + d ? 'selected' : ''}>${titleFor(d, v)}</option>`));
  return `<div class="page-intro compact"><div><h1>Oefeningen</h1><p class="lead">Uitvoering en jouw prestaties, op één plek.</p></div></div><div class="library-filters"><label><span class="sr-only">Filter op training</span><select data-filter="libraryFilter" aria-label="Filter op training"><option value="all">Alle trainingen</option>${options.join('')}</select></label><label class="search-field">${icon('search')}<span class="sr-only">Zoek een oefening of spiergroep</span><input type="search" id="exercise-search" aria-label="Zoek een oefening of spiergroep" placeholder="Zoek een oefening…" value="${esc(search)}" autocomplete="off"></label></div><div class="library-grid">${Object.entries(program.exercises).map(([id, e]) => `<button class="library-item" data-action="exercise-info" data-exercise="${id}" data-search="${esc((e.name + ' ' + e.muscles).toLocaleLowerCase('nl'))}" ${libraryMatches(id, search) ? '' : 'hidden'}><div class="grow"><h3>${esc(e.name)}</h3><p>${esc(e.muscles)}</p></div>${icon('right')}</button>`).join('')}</div><p id="search-empty" class="muted small" ${Object.keys(program.exercises).some(id => libraryMatches(id, search)) ? 'hidden' : ''}>Geen oefening gevonden voor deze selectie.</p>`;
}
function libraryMatches(id, query = view.librarySearch || '') {
  const e = program.exercises[id];
  if (!(e.name + ' ' + e.muscles).toLocaleLowerCase('nl').includes(query.trim().toLocaleLowerCase('nl'))) return false;
  if (!view.libraryFilter || view.libraryFilter === 'all') return true;
  const [v, day] = view.libraryFilter.split(':');
  return program.week_programs[v][day].some(p => p.exercise_id === id) || (day.startsWith('upper') && ['scapular_pushup', 'assisted_hang'].includes(id)) || (day === 'upper_b' && id === 'dead_hang');
}

function performanceText(set, m) {
  if (m.kind === 'duration') return `${num(set.seconds)} s`;
  if (m.kind === 'distance') return `${num(set.kg)} kg × ${num(set.meters)} m`;
  return `${set.kg !== null ? num(set.kg) + ' kg × ' : ''}${num(set.reps)} herh.`;
}
function statsStrip(stats, m) {
  const key = metricFor(m), unit = m.unit;
  const load = m.kind === 'distance' && stats.load ? `<p class="small muted" style="font-size:10px;margin-bottom:12px">Gewichtsrecord: <strong>${num(stats.load.pr.kg)} kg per hand</strong> · ${num(stats.load.pr.meters)} m · ${dateFmt(stats.load.pr.date, { year: 'numeric' })}<br>Gemiddeld geregistreerd gewicht: ${num(stats.load.average)} kg per hand · laatste 5 uitvoeringen: ${num(stats.load.recentAverage)} kg per hand</p>` : '';
  return `<div class="exercise-meta"><div><small>${m.kind === 'weight' ? 'GEWICHTSRECORD' : 'PERSOONLIJK RECORD'}</small><strong>${stats.pr ? `${num(stats.pr[key])} ${unit}` : 'Nog geen data'}</strong>${stats.pr ? `<small>${dateFmt(stats.pr.date)}${stats.pr.reps !== null ? ' · ' + stats.pr.reps + ' herh.' : ''}</small>` : ''}</div><div><small>GEM. GEREGISTREERDE SETS</small><strong>${stats.average !== null ? num(stats.average) + ' ' + unit : '—'}</strong></div><div><small>GEM. LAATSTE 5 UITVOERINGEN</small><strong>${stats.recentAverage !== null ? num(stats.recentAverage) + ' ' + unit : '—'}</strong></div></div>${load}`;
}
function statsPage() {
  const id = view.statsExercise, m = measurement(id);
  const all = exerciseStats(recordedSessions(), id, { basis: m.basis });
  const cutoff = view.period === 'all' ? '1900-01-01' : addDays(localDate(), -Number(view.period));
  const stats = { ...all, runs: all.runs.filter(r => r.date >= cutoff && r.date <= localDate()) };
  const key = metricFor(m), unit = m.unit;
  const completed = recordedSessions().filter(s => s.status === 'completed').length;
  const weeks = weeklyCounts(recordedSessions(), addDays(mondayOf(), -49), localDate());
  const metricName = { average: m.kind === 'weight' ? 'Gemiddeld geregistreerd gewicht' : m.kind === 'duration' ? 'Gemiddelde tijdsduur' : m.kind === 'distance' ? 'Gemiddelde afstand' : 'Gemiddeld aantal herhalingen', max: 'Hoogste waarde per uitvoering', reps: 'Herhalingen per uitvoering', volume: 'Volume geregistreerde sets', load: 'Gemiddeld gewicht per hand' }[view.chartMetric];
  return `<div class="page-intro"><div><div class="eyebrow">JE BESTE GEREGISTREERDE SET</div><h1>Jouw vooruitgang.</h1><p class="lead">Je beste sets vanaf Ritme 2.1, met behoud van alle eerdere registraties.</p></div><span class="tag">${icon('check')}${completed} ${completed === 1 ? 'training' : 'trainingen'} voltooid</span></div>
    <div class="filter-bar"><div class="field"><label for="stats-exercise">Oefening</label><select id="stats-exercise" data-filter="statsExercise">${Object.entries(program.exercises).map(([k, e]) => `<option value="${k}" ${id === k ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}</select></div><div class="field"><label for="stats-period">Periode grafiek</label><select id="stats-period" data-filter="period"><option value="30" ${view.period === '30' ? 'selected' : ''}>30 dagen</option><option value="90" ${view.period === '90' ? 'selected' : ''}>90 dagen</option><option value="365" ${view.period === '365' ? 'selected' : ''}>1 jaar</option><option value="all" ${view.period === 'all' ? 'selected' : ''}>Alles</option></select></div></div>
    <p class="small muted">${esc(m.label)} · Resultaten blijven gescheiden per oefening en gewichtsdefinitie.</p>
    <div class="stat-grid"><div class="stat-tile"><div class="eyebrow">${m.kind === 'weight' ? 'Gewichtsrecord' : 'Persoonlijk record'}</div><div class="stat-value">${all.pr ? num(all.pr[key]) : '—'} <span>${all.pr ? unit : ''}</span></div><small>${all.pr ? dateFmt(all.pr.date, { year: 'numeric' }) + (all.pr.reps !== null ? ' · ' + num(all.pr.reps) + ' herh.' : m.kind === 'distance' ? ' · ' + num(all.pr.kg) + ' kg per hand' : '') : 'Je eerste record komt vanzelf.'}</small></div><div class="stat-tile"><div class="eyebrow">Gemiddeld gebruikt</div><div class="stat-value">${num(all.average)} <span>${all.average !== null ? unit : ''}</span></div><small>Alle geldige geregistreerde werksets · ${all.sets} ${all.sets === 1 ? 'set' : 'sets'}</small></div><div class="stat-tile"><div class="eyebrow">Laatste 5 uitvoeringen</div><div class="stat-value">${num(all.recentAverage)} <span>${all.recentAverage !== null ? unit : ''}</span></div><small>Gemiddelde van geregistreerde sets in de laatste ${Math.min(5, all.runs.length)} ${all.runs.length === 1 ? 'uitvoering' : 'uitvoeringen'}</small></div></div>
    ${m.kind === 'distance' && all.load ? `<div class="notice" style="margin-bottom:20px">${icon('trophy')}<p><strong>Gewichtsrecord: ${num(all.load.pr.kg)} kg per hand</strong> · ${num(all.load.pr.meters)} m · ${dateFmt(all.load.pr.date, { year: 'numeric' })}<br>Gemiddelde alle werksets: ${num(all.load.average)} kg per hand · laatste 5 uitvoeringen: ${num(all.load.recentAverage)} kg per hand.</p></div>` : ''}
    <section class="panel"><div class="chart-head"><div><h2>${metricName}</h2><p>Per trainingssessie · ${esc(m.label)}</p></div><div class="metric-tabs" role="group" aria-label="Grafiekmeting">${[['average', 'Gemiddelde'], ['max', 'Record'], ...(m.kind === 'distance' ? [['load', 'Gewicht']] : []), ...(m.kind === 'weight' || m.kind === 'reps' ? [['reps', 'Herhalingen']] : []), ...(m.kind === 'weight' ? [['volume', 'Gelogd volume']] : [])].map(([v, l]) => `<button class="${view.chartMetric === v ? 'active' : ''}" data-action="chart-metric" data-metric="${v}" aria-pressed="${view.chartMetric === v}">${l}</button>`).join('')}</div></div>${stats.runs.length ? chartMarkup(stats.runs, m) : `<div class="empty"><div class="empty-icon">${icon('chart')}</div><h3>${all.runs.length ? 'Nog geen sets in deze periode' : 'Hier groeit je vooruitgang.'}</h3><p>${all.runs.length ? 'Kies een langere periode om je eerdere uitvoeringen te bekijken.' : 'Registreer je eerste werkset. Dan verschijnen hier je gewichten, herhalingen en persoonlijke records.'}</p><button class="btn outline" data-action="nav" data-page="home">Naar je trainingen ${icon('arrow')}</button></div>`}${view.chartMetric === 'volume' ? `<p class="small muted" style="font-size:10px">Dit is uitsluitend het volume van geregistreerde sets: kg × herhalingen. Vanaf 2.1 registreer je één beste set; het werkelijke totale trainingsvolume is onbekend. Voorgeschreven sets worden nooit vermenigvuldigd. Bij dumbbells per dumbbell; bij eenzijdige oefeningen per kant. Geen verdubbeling. Vergelijk alleen dezelfde oefening en gewichtsdefinitie.</p>` : ''}</section>
    <section class="panel space-top"><div class="chart-head"><div><h2>Een ritme dat je volhoudt</h2><p>Voltooide trainingen per kalenderweek · laatste 8 weken</p></div><span class="tag soft">${completed} in totaal</span></div><div class="bar-chart" aria-label="Voltooide trainingen per week">${weeks.map(w => `<div class="bar-col"><span class="bar-count">${w.count}</span><div class="bar" style="height:${w.count ? Math.max(10, w.count / Math.max(4, ...weeks.map(x => x.count)) * 100) : 3}px" title="Week van ${dateFmt(w.monday)}: ${w.count} ${w.count === 1 ? 'training' : 'trainingen'}"></div><small>${dateFmt(w.monday)}</small></div>`).join('')}</div></section>
    ${all.runs.length ? `<div class="section-head"><div><h2>Oefeninggeschiedenis</h2><p>Beste geregistreerde sets vanaf 2.1; eerdere individuele sets blijven zichtbaar.</p></div><button class="link-btn" data-action="exercise-info" data-exercise="${id}">Oefenuitleg ${icon('info')}</button></div><div class="panel table-wrap"><table class="data-table"><thead><tr><th>DATUM / TRAINING</th><th>GEREGISTREERDE SETS</th><th>GEMIDDELDE</th></tr></thead><tbody>${[...stats.runs].reverse().map(r => `<tr><td><button data-action="open-session" data-id="${esc(r.sessionId)}">${dateFmt(r.date, { year: 'numeric' })}</button><br><span class="muted">${esc(r.title)}</span></td><td>${r.recordingMode === 'best' ? '<small>Beste set</small><br>' : ''}${r.sets.map(st => esc(performanceText(st, r.measurement))).join('<br>')}${all.records.some(rec => rec.sessionId === r.sessionId) ? '<span class="new-record">Nieuw record</span>' : ''}</td><td>${num(r.average)} ${unit}</td></tr>`).join('')}</tbody></table></div>` : ''}
    <div class="notice space-top">${icon('info')}<p>Sinds 2.1 registreer je één beste set per oefening. Oudere individuele werksets blijven meetellen. Alle cijfers gebruiken uitsluitend werkelijk geregistreerde waarden, ook uit gedeeltelijk opgeslagen trainingen. Opwarmsets en overgeslagen sets tellen niet mee. Gewichtscijfers zeggen op zichzelf niets over spiergroei.</p></div>`;
}
function chartMarkup(runs, m) {
  const metric = view.chartMetric, key = metricFor(m);
  const data = runs.map(r => ({ ...r, y: metric === 'max' ? Math.max(...r.sets.map(s => s[key])) : metric === 'reps' ? r.reps : metric === 'volume' ? r.volume : metric === 'load' ? r.loadAverage : r.average }));
  const W = 700, H = 240, padL = 43, padR = 18, top = 18, bottom = 34;
  const max = Math.max(...data.map(d => d.y)), min = Math.min(...data.map(d => d.y));
  const low = metric === 'volume' || metric === 'reps' ? 0 : Math.max(0, min - Math.max(2, (max - min) * .25));
  const high = max + Math.max(2, (max - low) * .15);
  const first = Date.parse(data[0].date), last = Date.parse(data.at(-1).date), timeSpan = last - first;
  // Equal dates get a small horizontal spread, so every session remains selectable.
  const sameDateCount = d => data.filter(x => x.date === d.date).length;
  const points = data.map((d, i) => { const equalBefore = data.slice(0, i).filter(x => x.date === d.date).length; const spread = sameDateCount(d) > 1 ? (equalBefore - (sameDateCount(d) - 1) / 2) * 5 : 0; const x = timeSpan ? padL + 10 + (Date.parse(d.date) - first) / timeSpan * (W - padL - padR - 20) : data.length === 1 ? (W + padL) / 2 : padL + i / (data.length - 1) * (W - padL - padR); return { ...d, x: Math.max(padL, Math.min(W - padR, x + spread)), y: top + (1 - (d.y - low) / (high - low)) * (H - top - bottom) }; });
  const path = points.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
  const unit = metric === 'reps' ? 'herh.' : metric === 'volume' ? 'kg·herh.' : metric === 'load' ? 'kg per hand' : m.unit;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(unit)} over ${runs.length} ${runs.length === 1 ? 'trainingssessie' : 'trainingssessies'}; de tabel hieronder bevat alle waarden"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#a9c37a" stop-opacity=".26"/><stop offset="100%" stop-color="#a9c37a" stop-opacity="0"/></linearGradient></defs>${[0, 1, 2, 3].map(i => { const y = top + i / 3 * (H - top - bottom); return `<path class="chart-grid" d="M${padL} ${y}H${W - padR}"/><text x="${padL - 9}" y="${y + 3}" text-anchor="end">${num(high - i / 3 * (high - low))}</text>`; }).join('')}<path class="chart-area" d="${path} L${points.at(-1).x} ${H - bottom} L${points[0].x} ${H - bottom}Z"/><path class="chart-line" d="${path}"/>${points.map((p, i) => `<circle class="point" cx="${p.x}" cy="${p.y}" r="5" tabindex="0" role="button" data-action="chart-point" data-detail="${esc(dateFmt(p.date, { year: 'numeric' }) + ' · ' + p.title + ': ' + num(p.y === undefined ? 0 : data[i].y) + ' ' + unit)}" aria-label="${esc(dateFmt(p.date) + ': ' + num(data[i].y) + ' ' + unit)}"><title>${dateFmt(p.date)} · ${num(data[i].y)} ${unit}</title></circle>`).join('')}<text x="${padL}" y="${H - 6}">${dateFmt(data[0].date)}</text>${data.length > 1 ? `<text x="${W - padR}" y="${H - 6}" text-anchor="end">${dateFmt(data.at(-1).date)}</text>` : ''}</svg><p class="chart-detail" id="chart-detail">Tik op een punt om die uitvoering te bekijken.</p></div>`;
}
function historyPage() {
  const cutoff = view.historyPeriod === 'all' ? '1900-01-01' : addDays(localDate(), -Number(view.historyPeriod));
  const sessions = [...state.sessions].filter(s => s.date >= cutoff).sort((a, b) => b.date.localeCompare(a.date) || b.startedAt.localeCompare(a.startedAt));
  return `<div class="page-intro"><div><div class="eyebrow">JOUW PERSOONLIJKE LOGBOEK</div><h1>Elke training bewaard.</h1><p class="lead">Kijk terug, ga verder of voeg een eerdere training toe.</p></div><button class="btn primary" data-action="backdate">${icon('plus')}Training toevoegen</button></div><div class="filter-bar"><div class="field"><label for="history-period">Periode</label><select id="history-period" data-filter="historyPeriod"><option value="all" ${view.historyPeriod === 'all' ? 'selected' : ''}>Alle trainingen</option><option value="30" ${view.historyPeriod === '30' ? 'selected' : ''}>Laatste 30 dagen</option><option value="90" ${view.historyPeriod === '90' ? 'selected' : ''}>Laatste 90 dagen</option><option value="365" ${view.historyPeriod === '365' ? 'selected' : ''}>Laatste jaar</option></select></div></div>${sessions.length ? `<div class="history-list">${sessions.map(s => { const count = s.exercises.reduce((n, e) => n + e.sets.filter(st => validSet(st, e.measurement)).length, 0); return `<button class="history-item" data-action="open-session" data-id="${esc(s.id)}"><span class="date-block"><strong>${Number(s.date.slice(8))}</strong><small>${dateFmt(s.date, { day: undefined, month: 'short' })}</small></span><div class="grow"><h3>${esc(titleFor(s.day, s.variant))}</h3><p>${s.date.slice(0, 4)} · week ${s.variant} · ${count} werksets · week van ${dateFmt(s.weekMonday)}</p></div><span class="tag ${s.status === 'completed' ? 'soft' : 'orange'}">${s.status === 'completed' ? 'Voltooid' : s.status === 'paused' ? 'Gepauzeerd' : 'Bezig'}</span>${icon('right')}</button>`; }).join('')}</div>` : `<div class="panel empty"><div class="empty-icon">${icon('history')}</div><h3>Je logboek begint bij je eerste set.</h3><p>Je trainingen blijven hier bewaard, ook als maandag een nieuwe trainingsweek begint.</p><button class="btn primary" data-action="backdate">${icon('plus')}Training toevoegen</button></div>`}`;
}
function settingsPage() {
  return `<div class="page-intro"><div><div class="eyebrow">MAAK HET JOUW RITME</div><h1>Alles goed geregeld.</h1><p class="lead">Je schema, je gegevens en een veilige back-up.</p></div></div><div class="settings-grid"><section class="panel"><h2>Jouw trainingscyclus</h2><p>De rotatie werkt automatisch met 30 november 2026 als referentie. Elke kalenderweek begint een nieuw weektype, in Europe/Amsterdam. Je hoeft niets in te stellen.</p><p class="space-top">Lower A1 → Upper A1 → Lower B1 → Upper B1, daarna dezelfde volgorde in weektype 2. Je kiest zelf je trainingsdagen.</p></section><section class="panel"><h2>Helemaal jouw weergave</h2><p>Een rustige trainingsruimte, ook 's avonds in de sportschool.</p><div class="field"><label for="theme">Kleurthema</label><select id="theme" data-setting="theme"><option value="light" ${state.settings.theme === 'light' ? 'selected' : ''}>Licht</option><option value="dark" ${state.settings.theme === 'dark' ? 'selected' : ''}>Donker</option><option value="system" ${state.settings.theme === 'system' ? 'selected' : ''}>Volg mijn apparaat</option></select></div><button class="btn outline" data-action="install">${icon('plus')}Installeer op je telefoon</button></section><section class="panel"><h2>Neem je gegevens mee</h2><p>Alles wordt opgeslagen in deze browser op dit apparaat. Er is geen automatische synchronisatie. Exporteer regelmatig en vóór je browsergegevens wist.</p><div class="row wrap"><button class="btn primary" data-action="export">${icon('download')}Volledige back-up</button><button class="btn outline" data-action="csv">CSV van je sets</button></div><p class="small" style="margin-top:14px">Je back-up bevat je instellingen, bronprogramma en alle trainingen, inclusief onafgeronde sets en historische oefenuitleg.</p></section><section class="panel"><h2>Een back-up terugzetten</h2><p>Controleer eerst het bestand. Standaard voegen we alleen ontbrekende trainingen toe; bestaande trainingen blijven behouden.</p><button class="btn outline" data-action="choose-import">${icon('upload')}Back-up selecteren</button><input id="import-file" type="file" accept="application/json,.json" hidden><p class="small" style="margin-top:17px">Verplaatsen naar een andere telefoon? Exporteer hier en importeer daar hetzelfde bestand.</p></section><section class="panel full"><h2>Met aandacht trainen</h2><p>${esc(program.metadata.safety)}</p><button class="link-btn" data-action="safety">Lees alle trainingsafspraken ${icon('arrow')}</button></section><section class="panel full source-notes"><details><summary>Over je programmabron · versie ${esc(program.metadata.version)}</summary><p>De meegeleverde JSON is leidend voor alle oefeningen, volgorde, sets, herhalingen, rust en uitleg. Alle 6 varianten blijven apart geregistreerd. De 35 oefenbeschrijvingen zijn integraal opgenomen.</p><p><strong>Bronverschil warming-up:</strong> de JSON beschrijft 3–6 minuten lichte beweging voor Upper en 3–5 minuten voor Lower. Het Markdown-bestand noemt 2–3 en 3–4 minuten, binnen 5–7 minuten totaal. Ritme volgt de JSON.</p><p>${esc(program.metadata.workset_definition)} ${esc(program.metadata.rest_definition)}</p><p>${esc(program.progression.main)}</p><p>Gewichten per dumbbell blijven per dumbbell; halters zijn totaal inclusief stang; machines gebruiken de afgelezen belasting. Wrist curls gebruiken consequent één dumbbell. Bij ondersteunde beenoefeningen telt de totale optionele externe last. Wissel je apparatuur of gewichtsdefinitie, zet dat in de notitie en vergelijk de cijfers niet direct.</p><p>Verander je de programmabron later, dan behouden bestaande trainingen hun oorspronkelijke instructies, voorschrift en eenheden.</p><p>Bronverwijzingen uit je programma (niet zelfstandig opnieuw beoordeeld):</p><ul>${program.sources.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a></li>`).join('')}</ul></details></section></div>`;
}

function showModal(html, { locked = false, onClose = null } = {}) {
  if (modal.open) modal.close();
  modalReturnFocus = document.activeElement;
  modal.innerHTML = html; modal.dataset.locked = String(locked); afterModal = onClose;
  modal.showModal();
}
function dialogContent(title, body, eyebrow = '') {
  return `<div class="modal-head"><div>${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ''}<h2 id="modal-title">${title}</h2></div><button class="icon-btn" data-action="close-modal" aria-label="Sluiten">${icon('close')}</button></div><div class="modal-body">${body}</div>`;
}
function confirmDialog(title, body, label, action, danger = false) {
  showModal(dialogContent(title, `<p class="lead">${body}</p><div class="modal-actions"><button class="btn outline" data-action="close-modal">Annuleren</button><button class="btn ${danger ? 'danger' : 'primary'}" data-action="${action}">${label}</button></div>`));
}
function showExercise(id, ei) {
  const s = session();
  const snapshot = ['home', 'workout'].includes(view.page) && s && ei !== undefined ? s.exercises[Number(ei)] : null;
  const e = snapshot?.exerciseId === id ? snapshot.instruction : program.exercises[id];
  if (!e) return;
  const m = snapshot?.measurement || measurement(id);
  const prescribed = snapshot ? [snapshot.prescription] : (['home', 'workout'].includes(view.page) ? program.week_programs[workoutContext().variant][workoutContext().day].filter(p => p.exercise_id === id) : Object.entries(program.week_programs).flatMap(([variant, days]) => Object.entries(days).flatMap(([day, entries]) => entries.filter(p => p.exercise_id === id).map(p => ({ ...p, context: titleFor(day, Number(variant)) })))));
  const stats = exerciseStats(recordedSessions(), id, { basis: m.basis });
  const previous = exerciseStats(recordedSessions(), id, { basis: m.basis, excludeSession: s?.id }).latest;
  showModal(dialogContent(esc(e.name), `<p class="lead">${esc(e.muscles)}</p>${id === 'standing_calf' ? `<figure class="exercise-illustration"><img src="./${id.replace('_','-')}.svg" width="520" height="265" alt="Zijaanzicht van ${esc(e.name)}: voorvoet op de steun, hiel rustig laten zakken en daarna omhoog duwen"><figcaption>Eigen schematische illustratie · enkelbeweging. Toestel en bewegingsuitslag verschillen per persoon; volg de uitleg hieronder.</figcaption></figure>` : ''}${prescribed.length ? `<div class="notice space-top"><div>${prescribed.map(p => `<p>${p.context ? `<strong>${esc(p.context)}:</strong> ` : ''}${p.sets} werksets × ${esc(p.reps)} · ${esc(p.rest)} rust</p>`).join('')}</div></div>` : id === 'scapular_pushup' ? '<div class="notice space-top">Warming-up Upper: 1 × 10–12 herhalingen, geen werkset.</div>' : ['dead_hang', 'assisted_hang'].includes(id) ? `<div class="notice space-top">${esc(id === 'dead_hang' ? program.finisher.upper_b : 'Optionele warming-up: 10–15 seconden ondersteund, alleen pijnvrij.')}</div>` : ''}<p class="lead" style="font-size:11px">${esc(reserveText(id))}</p>${snapshot ? `<p class="small muted">${esc(s.warmup)} ${esc(s.safety)}</p>${snapshot.note ? `<p>${esc(snapshot.note)}</p>` : ''}${snapshot.recordingMode !== 'best' ? `<details class="legacy-sets"><summary>Eerdere individuele sets · ${snapshot.sets.length}</summary>${snapshot.sets.map(st => `<p>${esc(performanceText(st, m))} · ${st.completed ? 'geregistreerd' : 'open'}${st.note ? ' · ' + esc(st.note) : ''}</p>`).join('')}</details>` : ''}` : `<p class="small muted">${esc(program.metadata.safety)}</p>`}${statsStrip(stats, m)}<p class="small muted">${esc(m.label)}</p>${detailProgress(stats, m, id)}${snapshot && workoutContext().editable && !['duration'].includes(m.kind) ? `<label class="step-size">Gewichtsstap <select data-weight-step="${ei}" aria-label="Gewichtsstap ${esc(e.name)}">${[.5,1,2.5,5].map(n => `<option value="${n}" ${weightStep(id) === n ? 'selected' : ''}>${num(n)} kg</option>`).join('')}</select></label>` : ''}${[['setup', '01 · Startpositie & opstelling'], ['movement', '02 · De beweging'], ['cues', '03 · Houding, aanspanning & ademhaling'], ['avoid', '04 · Veelgemaakte fouten'], ['adjust', '05 · Aanpassingen bij klachten']].map(([k, label]) => `<section class="instruction"><h3>${label}</h3><p>${esc(e[k])}</p></section>`).join('')}${previous ? `<div class="notice"><div><strong>Vorige uitvoering · ${dateFmt(previous.date, { year: 'numeric' })}</strong><p>${previous.sets.map(st => esc(performanceText(st, m))).join(' / ')}</p></div></div>` : ''}`, snapshot ? `OEFENUITLEG · BEWAARDE VERSIE ${esc(s.programVersion)}` : 'JOUW OEFENINGENBOEK'));
}
function detailProgress(stats, m, id) {
  if (!stats.runs.length) return '<p class="lead" style="font-size:12px">Nog geen trainingsgegevens. Je prestaties verschijnen hier na je eerste afgeronde werkset.</p>';
  const runs = stats.runs.slice(-8), values = runs.map(r => r.average);
  const low = Math.min(...values), high = Math.max(...values), span = high - low || 1;
  const points = values.map((v, i) => ({ x: values.length === 1 ? 150 : 10 + i / (values.length - 1) * 280, y: 65 - (v - low) / span * 45 }));
  return `<div class="detail-progress"><h3>Jouw ontwikkeling</h3><p>${stats.averageReps !== null ? `Gemiddeld ${num(stats.averageReps)} herhalingen per afgeronde werkset.` : `Gemiddeld ${num(stats.average)} ${m.unit} per afgeronde werkset.`}${stats.load && m.kind === 'reps' ? `<br>Hoogste toegevoegde last: ${num(stats.load.pr.kg)} kg. Gemiddelde toegevoegde last: ${num(stats.load.average)} kg.` : ''}</p><svg class="sparkline" viewBox="0 0 300 85" role="img" aria-label="Gemiddelde per uitvoering, van ${num(values[0])} naar ${num(values.at(-1))} ${m.unit}"><path d="${points.map((p,i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ')}"/>${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4"/>`).join('')}</svg><p>${dateFmt(runs[0].date)} – ${dateFmt(runs.at(-1).date)} · ${runs.length} ${runs.length === 1 ? 'uitvoering' : 'uitvoeringen'} · ${m.unit}</p><button class="link-btn" data-action="exercise-stats" data-exercise="${id}">Alle statistieken ${icon('arrow')}</button></div>`;
}
function showSafety() {
  showModal(dialogContent('Train met aandacht.', `<div class="notice warning">${icon('shield')}<p>${esc(program.metadata.safety)}</p></div><section class="instruction"><h3>Je fysiotherapie blijft leidend</h3><p>${esc(program.physio.current)}</p><p>${esc(program.physio.boundary)}</p></section><section class="instruction"><h3>Klachten tijdens en na het trainen</h3><p>${esc(program.progression.pain)}</p><p>Bij plots krachtverlies, forse zwelling of tintelingen professioneel laten onderzoeken. Noteer klachten tijdens, later op de dag en de volgende ochtend in je trainingsnotitie.</p></section><section class="instruction"><h3>Rust en uitvoering</h3><p>${esc(program.metadata.rest_definition)} ${esc(program.metadata.reserves_target)}</p></section><section class="instruction"><h3>Progressie zonder haast</h3><p>${esc(program.progression.main)}</p><p>De tijdsindicatie is een doel. Kort rust niet in ten koste van techniek; een laatste accessoire-set of optionele hang mag vervallen.</p></section>`, 'JOUW TRAININGSAFSPRAKEN'));
}
function dateDialog(mode = 'backdate') {
  const s = session();
  const date = mode === 'edit-date' ? s.date : view.page === 'workout' ? workoutContext().date : localDate();
  const w = trainingWeek(date);
  showModal(dialogContent(mode === 'edit-date' ? 'Trainingsdatum wijzigen' : mode === 'change-date' ? 'Kies je trainingsdatum' : 'Een training toevoegen', `<p class="lead">${mode === 'edit-date' ? 'Het bewaarde schema blijft hetzelfde. De training telt mee in de kalenderweek van de nieuwe datum.' : 'Kies de echte trainingsdatum. Het schema volgt automatisch uit jouw startmaandag.'}</p><div class="form-grid space-top"><div class="field"><label for="log-date">Trainingsdatum</label><input type="date" id="log-date" value="${date}" min="1900-01-01" max="${localDate()}" required></div><div class="field"><label for="log-day">Training</label><select id="log-day" ${mode === 'edit-date' ? 'disabled' : ''}>${DAYS.map(d => `<option value="${d}" ${d === (s?.day || view.day || DAYS[0]) ? 'selected' : ''}>${titleFor(d, w.variant)}</option>`).join('')}</select></div></div><p id="log-week" class="lead" style="font-size:11px">Week ${w.variant} · ${rangeFmt(w)}</p><div class="modal-actions"><button class="btn outline" data-action="close-modal">Annuleren</button><button class="btn primary" data-action="confirm-date" data-mode="${mode}">${mode === 'edit-date' ? 'Datum opslaan' : 'Training openen'} ${icon('arrow')}</button></div>`));
}
function keepOpenRender() {
  const opens = [...document.querySelectorAll('[data-exercise-card][open]')].map(e => e.dataset.exerciseCard);
  const extras = [...document.querySelectorAll('.set-extra.open')].map(e => e.id);
  const y = window.scrollY;
  render();
  document.querySelectorAll('[data-exercise-card]').forEach(e => { e.open = opens.includes(e.dataset.exerciseCard); });
  extras.forEach(id => { const e = document.getElementById(id); if (e) e.classList.add('open'); });
  window.scrollTo(0, y);
}
async function finishTraining(s) {
  const previous = { status: s.status, completedAt: s.completedAt, updatedAt: s.updatedAt };
  s.status = 'completed'; s.completedAt = new Date().toISOString(); s.updatedAt = s.completedAt;
  if (!await persist()) { Object.assign(s, previous); renderError(); return; }
  modal.close();
  if (view.page === 'home') { view.sessionId = null; view.manualDay = null; view.manualWeek = null; view.draftKey = null; }
  render(); window.scrollTo(0, 0); toast(view.page === 'home' ? trainingSelection(state.sessions, currentWeek()).next ? 'Afgerond. Je volgende training staat klaar.' : 'Je trainingsweek is compleet.' : 'Training afgerond.');
}
function refreshWorkoutProgress() {
  const ctx = workoutContext(), entries = ctx.entries;
  const count = entries.filter(exerciseDone).length;
  const total = entries.length;
  document.querySelectorAll('[data-training-progress]').forEach(el => el.textContent = `${count} / ${total} oefeningen`);
  const bar = $('[data-training-bar]'); if (bar) bar.style.width = (total ? Math.min(100, count / total * 100) : 0) + '%';
  document.querySelectorAll('input[data-set-field]').forEach(el => {
    const ei = Number(el.dataset.ei), si = Number(el.dataset.si), field = el.dataset.setField;
    if (document.activeElement === el || !['kg', 'reps', 'seconds', 'meters'].includes(field)) return;
    const e = entries[ei], st = e?.sets[si]; if (!st || st[field] !== null) return;
    el.value = inputNum(suggestedSet(e, si, recordedSessions(), ctx.s || ctx.draft)[field]);
  });
}
function go(page) { view.page = page; view.sessionId = null; view.browsing = false; view.fromHistory = false; if (page === 'home') { view.manualDay = null; view.manualWeek = null; view.draftKey = null; } location.hash = page; render(); window.scrollTo(0, 0); }
function download(name, content, type) {
  const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
}
function exportBackup() { download(`ritme-backup-${localDate()}.json`, JSON.stringify(makeBackup(state, program), null, 2), 'application/json'); toast('Je volledige back-up is gedownload. Bewaar hem op een veilige plek.'); }
function exportCsv() {
  const rows = [['training_id', 'datum', 'kalenderweek_maandag', 'weekvariant', 'training', 'trainingstatus', 'oefening_id', 'oefening', 'gewichtdefinitie', 'set', 'type', 'kg', 'herhalingen', 'seconden', 'meters', 'herhalingen_over', 'voltooid', 'overgeslagen', 'notitie', 'registratiemodus', 'oefening_voltooid']];
  state.sessions.forEach(s => s.exercises.forEach(e => e.sets.forEach((st, i) => rows.push([s.id, s.date, s.weekMonday, s.variant, s.title, s.status, e.exerciseId, e.instruction.name, e.measurement.basis, i + 1, st.kind, st.kg, st.reps, st.seconds, st.meters, st.reserve, st.completed, st.skipped, st.note, e.recordingMode || 'sets', exerciseDone(e)]))));
  const cell = v => { let text = String(v ?? ''); if (/^[=+\-@\t\r]/.test(text)) text = "'" + text; return '"' + text.replace(/"/g, '""') + '"'; };
  download(`ritme-sets-${localDate()}.csv`, '\ufeff' + rows.map(r => r.map(cell).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
}

function renderTimer() {
  const slot = $('#timer-slot'); if (!slot) return;
  if (!timer) { slot.innerHTML = ''; return; }
  const seconds = timer.paused ? timer.remaining : Math.max(0, Math.ceil((timer.end - Date.now()) / 1000));
  const text = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  slot.innerHTML = `<div class="timer" role="timer" aria-label="Rusttimer ${text}">${icon('clock')}<div><small>${seconds === 0 ? 'RUSTTIJD VOORBIJ' : timer.paused ? 'GEPAUZEERD' : 'EVEN OP ADEM KOMEN'}</small><strong>${text}</strong></div><button class="icon-btn" data-action="timer-toggle" aria-label="${timer.paused ? 'Timer hervatten' : 'Timer pauzeren'}">${icon(timer.paused ? 'play' : 'pause')}</button><button class="icon-btn" data-action="timer-close" aria-label="Rusttimer sluiten">${icon('close')}</button></div>`;
}

document.addEventListener('click', async event => {
  const el = event.target.closest('[data-action]'); if (!el) return;
  const action = el.dataset.action;
  if (el.disabled) return;
  if (action === 'exercise-info') { event.preventDefault(); event.stopPropagation(); showExercise(el.dataset.exercise, el.dataset.ei); return; }
  if (action === 'close-modal') { modal.close(); return; }
  try {
    let s = session();
    const ei = Number(el.dataset.ei), si = Number(el.dataset.si);
    if (['complete-exercise', 'complete-set', 'add-set', 'skip-exercise', 'add-finisher', 'finish', 'pause', 'start', 'step', 'quick-weight'].includes(action) && !s) { s = ensureSession(); if (!s) return; }
    const entry = s?.exercises[ei] || (['home', 'workout'].includes(view.page) ? workoutContext().entries[ei] : null);
    if (entry && !entry.sets.length && action === 'step') entry.sets.push(newSet());
    const st = entry?.sets[si];
    if (action === 'nav') { event.preventDefault(); go(el.dataset.page); return; }
    if (action === 'week') { view.weekOffset += Number(el.dataset.offset); render(); return; }
    if (action === 'this-week') { view.weekOffset = 0; render(); return; }
    if (action === 'open-workout') {
      const w = trainingWeek(el.dataset.date), found = statusFor(el.dataset.day, w);
      view = { ...view, page: 'workout', day: el.dataset.day, variant: Number(el.dataset.variant), date: el.dataset.date, sessionId: found?.id, browsing: true, fromHistory: false, draftKey: null };
      render(); window.scrollTo(0, 0); return;
    }
    if (action === 'open-session') { const found = state.sessions.find(s => s.id === el.dataset.id); if (!found) return; view = { ...view, page: 'workout', sessionId: found.id, day: found.day, variant: found.variant, date: found.date, browsing: true, fromHistory: true }; render(); window.scrollTo(0, 0); return; }
    if (action === 'choose-workout') { const ctx = workoutContext(); if (ctx.week.monday !== currentWeek().monday || !ctx.week.official) return; view = { ...view, page: 'home', manualDay: ctx.day, manualWeek: ctx.week.monday, sessionId: ctx.s?.id, browsing: false, draftKey: null }; location.hash = 'home'; render(); window.scrollTo(0, 0); return; }
    if (action === 'exercise-options') { exerciseOptions(ei); return; }
    if (action === 'step') {
      view.bestIndices ??= {}; view.bestIndices[s.id + ':' + ei] = si;
      const proposal = suggestedSet(entry, si, recordedSessions(), s);
      const field = el.dataset.field;
      st[field] = adjustNumber(st[field] ?? proposal[field], Number(el.dataset.direction), field === 'kg' ? weightStep(entry.exerciseId) : 1, field);
      recordBest(entry, si); s.status = 'active'; s.updatedAt = new Date().toISOString(); await persist(); keepOpenRender(); return;
    }
    if (action === 'quick-weight') { const target = entry.sets.find(st => !st.completed && !st.skipped && st.kg === null); if (target) target.kg = Number(el.dataset.value); s.updatedAt = new Date().toISOString(); await persist(); keepOpenRender(); return; }
    if (action === 'exercise-stats') { modal.close(); view.statsExercise = el.dataset.exercise; view.chartMetric = 'average'; go('stats'); return; }
    if (action === 'start') { await persist(); render(); return; }
    if (action === 'new-execution') { view.sessionId = null; view.date = localDate(); view.variant = currentWeek().variant; render(); toast('Een nieuwe uitvoering staat klaar. Kies eventueel een andere datum.'); return; }
    if (action === 'change-date' || action === 'backdate') { dateDialog(action); return; }
    if (action === 'confirm-date') {
      const input = $('#log-date'); if (!input.reportValidity()) return;
      const date = input.value, w = trainingWeek(date);
      if (el.dataset.mode === 'edit-date') { s.date = date; s.weekMonday = w.monday; s.updatedAt = new Date().toISOString(); await persist(); view.date = date; }
      else { if (!canRegister(date)) { toast('Voor deze referentiestart kun je alleen het voorbeeld bekijken.'); return; } view = { ...view, page: 'workout', sessionId: null, day: $('#log-day').value, variant: w.variant, date, browsing: false, draftKey: null }; }
      modal.close(); render(); window.scrollTo(0, 0); return;
    }
    if (action === 'set-more') { const extra = $(`#set-extra-${ei}-${si}`); extra.classList.toggle('open'); el.setAttribute('aria-expanded', String(extra.classList.contains('open'))); return; }
    if (action === 'complete-exercise' && entry) {
      const invalid = document.querySelector(`input[data-ei="${ei}"]:invalid`);
      if (invalid) { invalid.reportValidity(); return; }
      const wasDone = exerciseDone(entry);
      if (!wasDone && st) {
        const candidate = { ...st }, proposal = suggestedSet(entry, si, recordedSessions(), s);
        for (const field of ['kg', 'reps', 'seconds', 'meters']) candidate[field] ??= proposal[field];
        if (['kg', 'reps', 'seconds', 'meters'].some(field => st[field] !== null) && !setError(candidate, entry.measurement)) { Object.assign(st, candidate); recordBest(entry, si); }
        else toast('Afgevinkt zonder beste set. Je kunt je prestatie later nog invullen.');
      }
      entry.exerciseCompleted = !wasDone;
      s.updatedAt = new Date().toISOString(); await persist();
      keepOpenRender();
      const next = nextExerciseIndex(s.exercises);
      const target = document.querySelector(`[data-exercise-card="${!wasDone && next >= 0 ? next : ei}"]`);
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduced) target?.animate([{ opacity: .65, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }], { duration: 180 });
      target?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
      target?.querySelector('.exercise-name')?.focus({ preventScroll: true });
      return;
    }
    if (action === 'complete-set' && st) {
      const invalid = document.querySelector(`input[data-ei="${ei}"][data-si="${si}"]:invalid`); if (invalid) { invalid.reportValidity(); return; }
      if (st.skipped) { st.skipped = false; entry.skippedReason = null; }
      else if (st.completed) st.completed = false;
      else { const suggestion = suggestedSet(entry, si, recordedSessions(), s); const candidate = { ...st }; for (const field of ['kg', 'reps', 'seconds', 'meters']) candidate[field] ??= suggestion[field]; const err = setError(candidate, entry.measurement); if (err) { toast(err); const input = document.querySelector(`input[data-ei="${ei}"][data-si="${si}"]`); input?.focus(); return; } Object.assign(st, candidate, { completed: true }); }
      s.updatedAt = new Date().toISOString(); await persist(); keepOpenRender(); return;
    }
    if (action === 'add-set' && entry) { entry.sets.push(newSet()); s.updatedAt = new Date().toISOString(); await persist(); keepOpenRender(); return; }
    if (action === 'skip-set' && st) { modal.close(); st.skipped = !st.skipped; st.completed = false; s.updatedAt = new Date().toISOString(); await persist(); keepOpenRender(); return; }
    if (action === 'remove-set' && st) { view.pendingSet = { ei, si }; confirmDialog('Deze set verwijderen?', 'De invoer van deze set verdwijnt uit je logboek en statistieken.', 'Set verwijderen', 'confirm-remove-set', true); return; }
    if (action === 'confirm-remove-set') { const { ei, si } = view.pendingSet; s.exercises[ei].sets.splice(si, 1); s.updatedAt = new Date().toISOString(); modal.close(); await persist(); keepOpenRender(); return; }
    if (action === 'skip-exercise' && entry) {
      if (entry.skippedReason) { entry.skippedReason = null; entry.sets.forEach(st => { st.skipped = false; }); s.updatedAt = new Date().toISOString(); await persist(); keepOpenRender(); }
      else { view.pendingExercise = ei; showModal(dialogContent('Een oefening overslaan', `<p class="lead">Afgeronde werksets blijven bewaard. Alleen de resterende sets worden overgeslagen.</p><div class="field space-top"><label for="skip-reason">Reden</label><select id="skip-reason"><option>Overgeslagen wegens klachten</option><option>Overgeslagen wegens tijd</option><option>Overgeslagen: toestel bezet</option><option>Overgeslagen</option></select></div><div class="modal-actions"><button class="btn outline" data-action="close-modal">Annuleren</button><button class="btn primary" data-action="confirm-skip-exercise">Resterende sets overslaan</button></div>`)); }
      return;
    }
    if (action === 'confirm-skip-exercise') { const e = s.exercises[view.pendingExercise]; e.skippedReason = $('#skip-reason').value; e.sets.forEach(st => { if (!st.completed) st.skipped = true; }); s.updatedAt = new Date().toISOString(); modal.close(); await persist(); keepOpenRender(); return; }
    if (action === 'pause') { if (!s) return; s.status = s.status === 'paused' ? 'active' : 'paused'; s.updatedAt = new Date().toISOString(); await persist(); keepOpenRender(); toast(s.status === 'paused' ? 'Gepauzeerd. Je kunt op elk moment verder.' : 'Je training is hervat.'); return; }
    if (action === 'finish') {
      const invalid = document.querySelector('input:invalid'); if (invalid) { invalid.reportValidity(); return; }
      const unfilled = s.exercises.filter(e => !exerciseDone(e)).length;
      if (!unfilled) { await finishTraining(s); return; }
      confirmDialog('Training afronden?', unfilled ? `Er staan nog ${unfilled} oefeningen open. Je mag de training nu afronden. Alleen werkelijk geregistreerde prestaties tellen mee; open oefeningen blijven later aanpasbaar.` : 'Bewaar deze training als voltooid. Je resultaten staan klaar in je logboek en statistieken.', 'Training afronden', 'confirm-finish'); return;
    }
    if (action === 'confirm-finish') { await finishTraining(s); return; }
    if (action === 'reopen') { s.status = 'active'; s.completedAt = null; s.updatedAt = new Date().toISOString(); view.browsing = false; await persist(); render(); return; }
    if (action === 'session-options') { showModal(dialogContent('Je trainingsregistratie', `<div class="stack"><button class="btn outline" data-action="edit-date">${icon('calendar')}Trainingsdatum wijzigen</button><button class="btn outline" data-action="export">${icon('download')}Eerst een back-up maken</button><button class="btn danger" data-action="delete-session">${icon('trash')}Deze training verwijderen</button></div>`)); return; }
    if (action === 'edit-date') { dateDialog('edit-date'); return; }
    if (action === 'delete-session') { confirmDialog('Training verwijderen?', 'Deze training en alle bijbehorende sets worden verwijderd. Maak eerst een back-up als je ze wilt bewaren.', 'Definitief verwijderen', 'confirm-delete-session', true); return; }
    if (action === 'confirm-delete-session') { state.sessions = state.sessions.filter(x => x.id !== s.id); await persist(); modal.close(); go('history'); toast('Training verwijderd.'); return; }
    if (action === 'add-finisher') { const extra = exerciseEntry(program, { exercise_id: 'dead_hang', name: program.exercises.dead_hang.name, sets: 2, reps: '15–30 seconden', rest: 'Naar behoefte', is_variation: false, base_id: null }, true); extra.sets = [extra.sets[0]]; extra.recordingMode = 'best'; extra.exerciseCompleted = false; s.exercises.push(extra); s.updatedAt = new Date().toISOString(); await persist(); keepOpenRender(); const card = document.querySelector('[data-exercise-card]:last-child'); if (card) { card.open = true; card.scrollIntoView({ behavior: 'smooth', block: 'start' }); } return; }
    if (action === 'rest') {
      const rest = entry.prescription.rest.match(/\d+/g)?.map(Number);
      if (!rest) { toast('Neem voldoende rust; er staat geen vaste rustduur bij deze oefening.'); return; }
      const duration = rest.at(-1); timer = { end: Date.now() + duration * 1000, paused: false, remaining: duration }; clearInterval(timerTick); timerTick = setInterval(renderTimer, 1000); renderTimer(); return;
    }
    if (action === 'timer-toggle') { if (!timer) return; if (timer.paused) timer.end = Date.now() + timer.remaining * 1000; else timer.remaining = Math.max(0, Math.ceil((timer.end - Date.now()) / 1000)); timer.paused = !timer.paused; renderTimer(); return; }
    if (action === 'timer-close') { timer = null; clearInterval(timerTick); renderTimer(); return; }
    if (action === 'chart-metric') { view.chartMetric = el.dataset.metric; render(); return; }
    if (action === 'chart-point') { $('#chart-detail').textContent = el.dataset.detail; document.querySelectorAll('.point').forEach(p => p.classList.remove('selected')); el.classList.add('selected'); return; }
    if (action === 'safety') { showSafety(); return; }
    if (action === 'export') { exportBackup(); return; }
    if (action === 'csv') { exportCsv(); return; }
    if (action === 'choose-import') { $('#import-file').click(); return; }
    if (action === 'confirm-import') {
      if (fatalError) { toast('Herlaad eerst de app om opslag te herstellen.'); return; }
      const mode = $('#import-mode').value;
      if (mode === 'replace' && !$('#import-consent').checked) { toast('Bevestig dat je bestaande gegevens wilt vervangen, of kies Samenvoegen.'); return; }
      const next = mergeBackup(state, view.pendingImport, mode); state = next;
      const saved = await persist();
      if (saved) { modal.close(); render(); toast('Je back-up is teruggezet.'); }
      return;
    }
    if (action === 'install') {
      if (installPrompt) { await installPrompt.prompt(); installPrompt = null; }
      else showModal(dialogContent('Ritme op je beginscherm', `<div class="instruction"><h3>Op iPhone</h3><p>Open deze website in Safari. Tik op Deel en kies ‘Zet op beginscherm’. Open Ritme daarna via het nieuwe icoon.</p></div><div class="instruction"><h3>Op Android of computer</h3><p>Gebruik ‘App installeren’ of ‘Toevoegen aan startscherm’ in het browsermenu als die optie beschikbaar is.</p></div><div class="notice">${icon('info')}<p>Open de app eerst één keer online zodat alle bestanden offline klaarstaan. Installatie en offlinegebruik vereisen HTTPS of localhost. Bewaar dezelfde website en browser voor toegang tot je logboek.</p></div>`));
      return;
    }
    if (action === 'reload') { location.reload(); return; }
    if (action === 'apply-update') { if (saving) await saving; if (saveError) { toast('Maak eerst een back-up; opslaan is nog niet gelukt.'); return; } location.reload(); return; }
    if (action === 'retry-save') { await persist(); render(); return; }
  } catch (e) { toast(e.message || 'Dit lukte niet. Probeer het opnieuw.'); }
});

document.addEventListener('input', event => {
  const el = event.target;
  if (el.id === 'exercise-search') {
    view.librarySearch = el.value;
    let count = 0;
    document.querySelectorAll('[data-search]').forEach(card => { const match = libraryMatches(card.dataset.exercise, el.value); card.hidden = !match; if (match) count++; });
    $('#search-empty').hidden = count !== 0; return;
  }
  if (!el.hasAttribute('data-set-field') && !el.hasAttribute('data-exercise-note') && !el.hasAttribute('data-session-note')) return;
  const s = session() || (['home', 'workout'].includes(view.page) ? ensureSession() : null); if (!s || s.status === 'completed' || view.browsing) return;
  const ei = Number(el.dataset.ei), si = Number(el.dataset.si);
  if (el.hasAttribute('data-set-field')) {
    const entry = s.exercises[ei]; if (!entry || el.dataset.setField === 'kind') return;
    if (!entry.sets.length) entry.sets.push(newSet());
    const st = entry.sets[si]; if (!st) return;
    view.bestIndices ??= {}; view.bestIndices[s.id + ':' + ei] = si;
    const field = el.dataset.setField;
    if (field === 'note') st.note = el.value.slice(0, 10000);
    else {
      const value = parseNumber(el.value);
      const invalid = Number.isNaN(value) || (value !== null && (value > 1000000 || (['reps', 'reserve'].includes(field) && !Number.isInteger(value)) || (field === 'reserve' && value > 30)));
      el.setCustomValidity(invalid ? 'Vul een geldig positief getal in; komma of punt mag. Herhalingen zijn gehele getallen.' : '');
      st[field] = invalid ? null : value;
      if (st.completed && setError(st, s.exercises[ei].measurement)) { st.completed = false; el.closest('.set-row')?.classList.remove('completed'); const check = el.closest('.set-row')?.querySelector('.set-check'); check?.classList.remove('checked'); check?.setAttribute('aria-pressed', 'false'); }
    }
    recordBest(s.exercises[ei], si);
  } else if (el.hasAttribute('data-exercise-note')) s.exercises[ei].note = el.value.slice(0, 10000);
  else if (el.hasAttribute('data-session-note')) s.note = el.value.slice(0, 10000);
  else return;
  s.updatedAt = new Date().toISOString(); persist(); refreshWorkoutProgress();
});
document.addEventListener('change', async event => {
  const el = event.target;
  if (el.id === 'active-training') { state.settings.trainingFocus = { day: el.value, weekMonday: currentWeek().monday }; await persist(); view.manualDay = el.value; view.manualWeek = currentWeek().monday; view.sessionId = null; view.draftKey = null; render(); return; }
  if (el.hasAttribute('data-weight-step')) { const ctx = workoutContext(); const id = ctx.entries[Number(el.dataset.weightStep)].exerciseId; state.settings.weightSteps ??= {}; state.settings.weightSteps[id] = Number(el.value); await persist(); return; }
  if (el.dataset.filter) { view[el.dataset.filter] = el.value; if (el.dataset.filter === 'statsExercise') view.chartMetric = 'average'; render(); return; }
  if (el.dataset.setting === 'theme') { state.settings.theme = el.value; applyTheme(); await persist(); return; }
  if (el.dataset.setField === 'kind') { const s = session() || ensureSession(); if (!s || s.status === 'completed') return; s.exercises[Number(el.dataset.ei)].sets[Number(el.dataset.si)].kind = el.value; s.updatedAt = new Date().toISOString(); await persist(); keepOpenRender(); return; }
  if (el.id === 'log-date' && el.value) { try { const w = trainingWeek(el.value); $('#log-week').textContent = `Week ${w.variant} · ${rangeFmt(w)}`; if (!$('#log-day').disabled) [...$('#log-day').options].forEach((o, i) => { o.text = titleFor(DAYS[i], w.variant); }); } catch {} return; }
  if (el.id === 'import-file' && el.files[0]) {
    try {
      const file = el.files[0]; if (file.size > 40 * 1024 * 1024) throw new Error('Dit bestand is te groot. Kies een Ritme-back-up van maximaal 40 MB.');
      const imported = readBackup(await file.text()); view.pendingImport = imported;
      const known = new Set(state.sessions.map(s => s.id)), added = imported.sessions.filter(s => !known.has(s.id)).length;
      showModal(dialogContent('Controleer je back-up', `<div class="notice">${icon('check')}<p>Geldig Ritme-bestand met ${imported.sessions.length} ${imported.sessions.length === 1 ? 'training' : 'trainingen'}. Bij samenvoegen worden ${added} ontbrekende trainingen toegevoegd. ${imported.sessions.length - added} bestaande ${imported.sessions.length - added === 1 ? 'training-ID blijft' : 'training-ID’s blijven'} ongewijzigd.</p></div><div class="field space-top"><label for="import-mode">Hoe wil je terugzetten?</label><select id="import-mode"><option value="merge">Samenvoegen · bestaande invoer behouden</option><option value="replace">Alles vervangen door deze back-up</option></select></div><label class="row small space-top"><input type="checkbox" id="import-consent">Ik begrijp dat bij vervangen mijn huidige logboek wordt overschreven.</label><div class="modal-actions"><button class="btn outline" data-action="export">Eerst huidige back-up</button><button class="btn primary" data-action="confirm-import">Back-up terugzetten</button></div>`));
    } catch (e) { toast(e.message); }
    el.value = '';
  }
});
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.point')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
modal.addEventListener('cancel', e => { if (modal.dataset.locked === 'true') e.preventDefault(); });
modal.addEventListener('close', () => { modalReturnFocus?.focus?.(); if (afterModal) { const callback = afterModal; afterModal = null; callback(); } });
window.addEventListener('hashchange', () => { const page = location.hash.slice(1); if (['home', 'schema', 'stats', 'library', 'more', 'history', 'settings'].includes(page) && page !== view.page) { go(page); } });
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; });
navigator.serviceWorker?.addEventListener('controllerchange', () => { if (hadController) { updateReady = true; renderError(); } });
window.addEventListener('online', updateSaveStatus);
window.addEventListener('offline', updateSaveStatus);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
function checkWeek() {
  const monday = mondayOf();
  if (monday !== initialMonday) { initialMonday = monday; if (['home', 'schema'].includes(view.page)) { view.weekOffset = 0; view.sessionId = null; view.manualDay = null; view.draftKey = null; render(); } toast('Je nieuwe trainingsweek staat klaar. Je logboek blijft bewaard.'); }
  renderTimer();
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkWeek(); });
window.addEventListener('focus', checkWeek);
setInterval(checkWeek, 1000);
window.addEventListener('beforeunload', e => { if (saving || saveError) { e.preventDefault(); e.returnValue = ''; } });

try {
  const response = await fetch('./program.json'); if (!response.ok) throw new Error('Je programma kon niet worden geladen.'); program = await response.json();
  try { database = await new LocalStore().open(); state = await database.load(); }
  catch (e) { fatalError = 'Je bestaande logboek wordt niet overschreven. Lokale opslag kan niet worden geopend: ' + e.message; }
  const page = location.hash.slice(1); if (!matchMedia('(display-mode: standalone)').matches && !navigator.standalone && ['home', 'schema', 'stats', 'library', 'more', 'history', 'settings'].includes(page)) view.page = page;
  render(); window.scrollTo(0, 0);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
} catch (e) { app.innerHTML = `<div class="boot"><span class="brand-mark">r.</span><h2>Je training staat nog even stil.</h2><p>${esc(e.message)}</p><button class="btn primary" onclick="location.reload()">Opnieuw proberen</button></div>`; }
