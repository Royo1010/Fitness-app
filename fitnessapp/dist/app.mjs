import { ZONE, DAYS, localDate, mondayOf, addDays, weekFor, parseNumber, measurement, reserveText, emptyState, newSet, createSession, exerciseEntry, validSet, setError, metricFor, exerciseStats, weekProgress, weeklyCounts, makeBackup, readBackup, mergeBackup } from './core.mjs';
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
let view = { page: 'home', weekOffset: 0, statsExercise: 'flat_db_press', period: '90', chartMetric: 'average', historyPeriod: 'all' };
let saveError = '', fatalError = '', saving = null, editVersion = 0, savedVersion = 0;
let initialMonday = mondayOf();
let installPrompt = null, timer = null, timerTick = null;
let toastTimeout, modalReturnFocus, afterModal = null;
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
function currentWeek() { return weekFor(state.settings.anchorMonday || initialMonday); }
function selectedWeek() { const current = currentWeek(); return weekFor(state.settings.anchorMonday || initialMonday, addDays(current.monday, view.weekOffset * 7)); }
function session() { return state.sessions.find(s => s.id === view.sessionId); }
function titleFor(day, variant) { return program.days[day] + (variant === 2 ? '2' : ''); }
function statusFor(day, w) {
  const sessions = state.sessions.filter(s => s.day === day && s.variant === w.variant && s.weekMonday === w.monday);
  return sessions.find(s => s.status === 'active' || s.status === 'paused') || sessions.filter(s => s.status === 'completed').at(-1);
}
function navButton(page, label, i) { return `<button data-action="nav" data-page="${page}" class="${view.page === page ? 'active' : ''}" ${view.page === page ? 'aria-current="page"' : ''}>${icon(i)}<span>${label}</span></button>`; }
function render() {
  if (!program) return;
  const nav = navButton('home', 'Mijn trainingen', 'grid') + navButton('stats', 'Statistieken', 'chart') + navButton('history', 'Geschiedenis', 'history') + navButton('library', 'Oefeningenboek', 'book');
  const pageLabel = { home: 'Mijn trainingen', workout: 'Trainingslogboek', stats: 'Statistieken', history: 'Geschiedenis', library: 'Oefeningenboek', settings: 'Instellingen' }[view.page];
  app.innerHTML = `<div class="shell"><aside class="sidebar"><a class="brand" href="#home" aria-label="Ritme, naar mijn trainingen"><span class="brand-mark">r.</span>ritme<span style="color:#839a69">.</span></a><p class="nav-label">JOUW TRAININGSRUIMTE</p><nav class="nav" aria-label="Hoofdnavigatie">${nav}</nav><div class="sidebar-bottom"><nav class="nav settings-nav">${navButton('settings', 'Instellingen', 'settings')}</nav><div class="sidebar-note">${icon('leaf')} Vooruitgang begint met ritme.<br>Vier trainingen. Op jouw moment.</div></div></aside><div class="workspace"><header class="topbar"><span class="topbar-title">${pageLabel}</span><a class="brand mobile-brand" href="#home" aria-label="Ritme, startpagina"><span class="brand-mark">r.</span>ritme.</a><div class="topbar-right"><span class="connection ${navigator.onLine ? '' : 'offline'}">${navigator.onLine ? 'Jouw persoonlijke ruimte' : 'Je traint offline'}</span><span class="avatar" aria-label="Persoonlijk logboek">R</span></div></header><main class="content" id="main"><div id="storage-error"></div>${({ home: homePage, workout: workoutPage, stats: statsPage, history: historyPage, settings: settingsPage, library: libraryPage }[view.page] || homePage)()}<footer class="footer"><span>Ritme · Jouw training, jouw tempo.</span><span>Alleen op dit apparaat · Europe/Amsterdam</span></footer></main></div><nav class="mobile-nav" aria-label="Mobiele navigatie">${navButton('home', 'Trainingen', 'grid')}${navButton('stats', 'Statistieken', 'chart')}${navButton('history', 'Geschiedenis', 'history')}${navButton('library', 'Oefeningen', 'book')}${navButton('settings', 'Instellingen', 'settings')}</nav></div><div id="timer-slot"></div>`;
  applyTheme(); renderError(); updateSaveStatus(); renderTimer();
}
function renderError() {
  const el = $('#storage-error'); if (!el) return;
  el.innerHTML = fatalError || saveError ? `<div class="notice error error-box" role="alert">${icon('info')}<div><strong>Je gegevens verdienen een veilige plek.</strong><p>${esc(fatalError || saveError)}</p><button data-action="export">Download een back-up</button> · <button data-action="reload">App herladen</button>${!fatalError ? ' · <button data-action="retry-save">Opnieuw opslaan</button>' : ''}</div></div>` : '';
}
function homePage() {
  const w = selectedWeek(), current = currentWeek();
  const progress = weekProgress(state.sessions, w.monday, w.variant);
  const nextDay = DAYS.find(d => statusFor(d, w)?.status !== 'completed') || DAYS[0];
  const offset = view.weekOffset;
  return `<div class="page-intro"><div><div class="eyebrow">RUIMTE VOOR VOORUITGANG</div><h1>Vind jouw ritme.</h1><p class="lead">Een helder plan. Elke set een stap vooruit.</p></div><span class="tag">${icon('calendar')}${dateFmt(localDate(), { weekday: 'long' })}</span></div>
    <section class="hero" aria-label="Trainingsweek"><div class="hero-copy"><div class="eyebrow">JOUW ${offset ? 'GESELECTEERDE' : 'HUIDIGE'} TRAININGSWEEK · WEEK ${w.variant}</div><h2>Sterker, op<br><em>jouw ritme.</em></h2><p>Vier trainingen, zonder vaste dagen.<br>Jij kiest het moment. Je schema staat klaar.</p><div class="hero-bottom"><button class="btn lime" data-action="open-workout" data-day="${nextDay}" data-variant="${w.variant}" data-date="${offset ? w.monday : localDate()}">${icon('play')}${statusFor(nextDay, w)?.status === 'active' || statusFor(nextDay, w)?.status === 'paused' ? 'Verder met je training' : 'Bekijk je training'}</button><span class="tag">${rangeFmt(w)}</span></div></div><div class="hero-visual"><span class="hero-dot"></span><div class="ring"><svg viewBox="0 0 180 180" aria-hidden="true"><circle class="track" cx="90" cy="90" r="79"/><circle class="progress" cx="90" cy="90" r="79" stroke-dasharray="${progress / 4 * 496.37} 496.37"/></svg><div class="ring-text"><strong>${progress}<span> / 4</span></strong><small>trainingen voltooid</small></div></div></div></section>
    <div class="week-strip"><div><strong>${progress} van 4 voltooid</strong><small>${rangeFmt(w)}</small></div><div class="week-steps" aria-label="Voortgang per training">${DAYS.map(d => { const s = statusFor(d, w); return `<span class="week-step ${s?.status === 'completed' ? 'done' : s ? 'started' : ''}" title="${titleFor(d, w.variant)}: ${s?.status === 'completed' ? 'voltooid' : s ? 'bezig' : 'nog niet begonnen'}"></span>`; }).join('')}</div><span class="muted">Elke training telt.</span></div>
    <div class="section-head"><div><h2>Jouw trainingen</h2><p>Week ${w.variant} · ${offset === 0 ? 'Kies waar je vandaag zin in hebt.' : rangeFmt(w)}</p></div><div class="week-control"><button class="icon-btn" data-action="week" data-offset="-1" aria-label="Vorige kalenderweek">${icon('left')}</button><button class="week-current" data-action="this-week">${offset === 0 ? 'Deze week' : 'Naar deze week'}</button><button class="icon-btn" data-action="week" data-offset="1" aria-label="Volgende kalenderweek">${icon('right')}</button></div></div>
    <div class="workout-grid">${DAYS.map((day) => {
      const specs = program.week_programs[w.variant][day], upper = day.startsWith('upper'), s = statusFor(day, w);
      const status = s?.status === 'completed' ? 'Voltooid' : s ? 'Bezig' : 'Staat voor je klaar';
      return `<button class="workout-tile" data-action="open-workout" data-day="${day}" data-variant="${w.variant}" data-date="${offset === 0 ? localDate() : w.monday}" aria-label="Open ${titleFor(day, w.variant)}, ${status}"><div class="tile-top"><span class="workout-symbol ${upper ? '' : 'lower'}">${icon(upper ? 'dumbbell' : 'lower')}</span><span class="status ${s?.status === 'completed' ? 'done' : s ? 'working' : ''}">${status}</span></div><h3>${titleFor(day, w.variant)}</h3><p class="tile-focus">${({ upper_a: 'Borst, rug & schoudercontrole', lower_a: 'Benen, core & grip', upper_b: 'Rug, schouders & armen', lower_b: 'Billen, benen & core' })[day]}</p><div class="tile-preview">${esc(specs.slice(0, 2).map(s => s.name).join(' · '))}</div><div class="tile-footer"><span class="tile-meta"><span>${icon('layers')}${specs.length} oefeningen</span><span>${icon('clock')}± 55–60 min</span></span><span class="tile-arrow">${icon('arrow')}</span></div></button>`;
    }).join('')}</div>
    <div class="below-grid"><div class="note-card">${icon('chart')}<div><h3>Jouw vooruitgang, zichtbaar.</h3><p>Van je eerste set tot je volgende record. Je logboek groeit met je mee.</p><button class="link-btn" data-action="nav" data-page="stats">Bekijk je statistieken ${icon('arrow')}</button></div></div><div class="note-card">${icon('leaf')}<div><h3>Train met aandacht.</h3><p>Neem je warming-up mee en luister naar je arm. Je fysiotherapievoorschrift blijft leidend.</p><button class="link-btn" data-action="safety">Lees je trainingsafspraken ${icon('arrow')}</button></div></div></div>`;
}
function workoutContext() {
  const s = session();
  if (s) return { s, day: s.day, variant: s.variant, date: s.date, title: s.title, entries: s.exercises };
  const day = view.day || 'upper_a', variant = Number(view.variant) || currentWeek().variant;
  return { s: null, day, variant, date: view.date || localDate(), title: titleFor(day, variant), entries: program.week_programs[variant][day].map(p => exerciseEntry(program, p)) };
}
function performanceText(set, m) {
  if (m.kind === 'duration') return `${num(set.seconds)} s`;
  if (m.kind === 'distance') return `${num(set.kg)} kg × ${num(set.meters)} m`;
  return `${set.kg !== null ? num(set.kg) + ' kg × ' : ''}${num(set.reps)} herh.`;
}
function statsStrip(stats, m) {
  const key = metricFor(m), unit = m.unit;
  const load = m.kind === 'distance' && stats.load ? `<p class="small muted" style="font-size:10px;margin-bottom:12px">Gewichtsrecord: <strong>${num(stats.load.pr.kg)} kg per hand</strong> · ${num(stats.load.pr.meters)} m · ${dateFmt(stats.load.pr.date, { year: 'numeric' })}<br>Gemiddeld gewicht alle werksets: ${num(stats.load.average)} kg per hand · laatste 5 uitvoeringen: ${num(stats.load.recentAverage)} kg per hand</p>` : '';
  return `<div class="exercise-meta"><div><small>${m.kind === 'weight' ? 'GEWICHTSRECORD' : 'PERSOONLIJK RECORD'}</small><strong>${stats.pr ? `${num(stats.pr[key])} ${unit}` : 'Nog geen data'}</strong>${stats.pr ? `<small>${dateFmt(stats.pr.date)}${stats.pr.reps !== null ? ' · ' + stats.pr.reps + ' herh.' : ''}</small>` : ''}</div><div><small>GEM. ALLE WERKSETS</small><strong>${stats.average !== null ? num(stats.average) + ' ' + unit : '—'}</strong></div><div><small>GEM. LAATSTE 5 UITVOERINGEN</small><strong>${stats.recentAverage !== null ? num(stats.recentAverage) + ' ' + unit : '—'}</strong></div></div>${load}`;
}
function workoutPage() {
  const ctx = workoutContext(), { s, day, variant, date, title, entries } = ctx;
  const upper = day.startsWith('upper');
  const completed = s?.status === 'completed';
  const valid = entries.reduce((n, e) => n + e.sets.filter(st => validSet(st, e.measurement)).length, 0);
  const prescribed = program.week_programs[variant][day].reduce((n, p) => n + p.sets, 0);
  return `<button class="back" data-action="nav" data-page="home">${icon('back')} Naar je trainingen</button><div class="training-header"><div><div class="eyebrow muted">WEEK ${variant} · ${dateFmt(date, { weekday: 'long', year: 'numeric' })}</div><h1 style="margin-top:10px">${esc(title)}</h1><div class="training-summary"><span>${icon('layers')}${entries.filter(e => !e.optional).length} oefeningen · ${prescribed} werksets</span><span>${icon('clock')}Indicatie 55–60 min</span></div></div><span class="tag ${completed ? 'lime' : s ? 'orange' : 'soft'}">${completed ? icon('check') + 'Voltooid' : s?.status === 'paused' ? 'Gepauzeerd' : s ? 'In uitvoering' : 'Jouw vrije trainingsdag'}</span></div>
    <div class="training-actions">${!s ? `<button class="btn primary" data-action="start">${icon('play')}Start deze training</button><button class="btn outline" data-action="change-date">${icon('calendar')}Andere datum</button>` : `<button class="btn ${completed ? 'outline' : 'primary'}" data-action="${completed ? 'reopen' : 'pause'}">${icon(completed || s.status === 'paused' ? 'play' : 'pause')}${completed ? 'Registratie aanpassen' : s.status === 'paused' ? 'Training hervatten' : 'Pauzeren & bewaren'}</button><button class="btn outline" data-action="new-execution">${icon('plus')}Nieuwe uitvoering</button><button class="btn quiet" data-action="session-options">${icon('more')}Opties</button>`}</div>
    ${s ? `<div class="save-state" data-save-status></div>` : ''}
    <details class="panel warmup" ${!s ? 'open' : ''}><summary>${icon('spark')}Begin met je warming-up <span class="tag soft">${upper ? 'Upper' : 'Lower'}</span></summary><p>${esc(s?.warmup || program.warmup[upper ? 'upper' : 'lower'])}</p>${upper ? `<div class="row wrap space-top"><button class="btn outline" data-action="exercise-info" data-exercise="scapular_pushup">Scapular push-up ${icon('info')}</button><button class="btn quiet" data-action="exercise-info" data-exercise="assisted_hang">Optionele ondersteunde hang ${icon('info')}</button></div>` : ''}<p>Opwarmsets tellen niet mee voor je records en gemiddelden.</p></details>
    <div class="exercise-list">${entries.map((e, ei) => exerciseCard(e, ei, ctx, ei === 0)).join('')}</div>
    ${day === 'upper_b' && !entries.some(e => e.exerciseId === 'dead_hang') ? `<div class="panel space-top"><div class="row between"><div><h3>Optionele finisher</h3><p class="lead" style="font-size:11px">${esc(program.finisher.upper_b)}</p></div><button class="icon-btn" data-action="exercise-info" data-exercise="dead_hang" aria-label="Uitleg dead hang">${icon('info')}</button></div>${s && !completed ? `<button class="btn outline space-top" data-action="add-finisher">${icon('plus')}Dead hang registreren</button>` : ''}</div>` : ''}
    <div class="notice warning space-top">${icon('shield')}<div><p>${esc(s?.safety || program.metadata.safety)}</p><button class="link-btn" data-action="safety">Je trainingsafspraken ${icon('arrow')}</button></div></div>
    ${s ? `<div class="field session-note"><label for="session-note">Trainingsnotitie · bijvoorbeeld klachten tijdens, later of de volgende ochtend</label><textarea id="session-note" data-session-note ${completed ? 'readonly' : ''} placeholder="Hoe voelde je training?">${esc(s.note)}</textarea></div><div class="finish-bar"><div><strong>${valid} werksets geregistreerd</strong><small>Je mag afronden als er sets of oefeningen overblijven.</small></div><div class="row">${!completed ? `<button class="btn outline" data-action="pause">Bewaren</button><button class="btn primary" data-action="finish">${icon('check')}Training afronden</button>` : `<span class="save-state" data-save-status></span>`}</div></div>` : `<div class="finish-bar"><div><strong>Klaar om te beginnen?</strong><small>Vul je resultaten in zodra je de training start.</small></div><button class="btn primary" data-action="start">${icon('play')}Start training</button></div>`}`;
}
function exerciseCard(e, ei, ctx, open) {
  const { s } = ctx, m = e.measurement, p = e.prescription;
  const stats = exerciseStats(state.sessions, e.exerciseId, { excludeSession: s?.id, before: ctx.date, basis: m.basis });
  const overall = exerciseStats(state.sessions, e.exerciseId, { basis: m.basis });
  const done = e.sets.length > 0 && e.sets.every(st => st.completed || st.skipped);
  const readOnly = !s || s.status === 'completed';
  const unilateral = ['ext_rotation_cable', 'side_lying_ext_rotation', 'one_arm_row', 'bulgarian', 'reverse_lunge', 'pallof', 'landmine_rotation', 'cable_woodchop', 'lateral_raise'].includes(e.exerciseId);
  return `<details class="exercise-card" data-exercise-card="${ei}" ${open ? 'open' : ''}><summary class="exercise-summary"><span class="exercise-number ${done ? 'done' : ''}">${done ? icon('check') : String(ei + 1).padStart(2, '0')}</span><div class="name"><button class="exercise-name" data-action="exercise-info" data-exercise="${esc(e.exerciseId)}" data-ei="${ei}">${esc(e.instruction.name)}</button><div class="exercise-prescription">${p.sets} werksets × ${esc(p.reps)} · ${esc(p.rest)} rust ${p.is_variation ? ' · week 2-variant' : ''}${e.optional ? ' · optioneel' : ''}</div></div>${icon('down', 'chevron')}</summary><div class="exercise-body"><p class="reserve">${esc(reserveText(e.exerciseId))}</p>${statsStrip(overall, m)}${stats.latest ? `<div class="last-performance"><strong>Vorige keer · ${dateFmt(stats.latest.date, { year: 'numeric' })}</strong><br>${stats.latest.sets.map(st => esc(performanceText(st, m))).join(' &nbsp; / &nbsp; ')}<br><span class="muted">${esc(m.label)}</span></div>` : `<p class="small muted" style="margin-bottom:13px">Nog geen eerdere trainingsgegevens voor deze oefening.</p>`}
    ${unilateral ? `<p class="small muted" style="font-size:10px;margin-bottom:12px">Links + rechts vormen samen één set. Noteer het gewicht en de herhalingen per kant; gebruik dezelfde belasting en noteer eventuele verschillen bij de set.</p>` : ''}
    ${s ? `<div class="weight-basis">${esc(m.kind === 'duration' ? 'Tijdsduur in seconden' : m.kind === 'distance' ? 'Gewicht per hand + totale gelopen meters' : m.label)}</div><div class="set-head"><span>SET</span><span>${m.kind === 'duration' ? 'SECONDEN' : m.kind === 'reps' && !m.optionalWeight ? 'HERHALINGEN' : 'KILOGRAM'}</span><span>${m.kind === 'duration' ? '' : m.kind === 'distance' ? 'METERS' : m.kind === 'reps' && !m.optionalWeight ? '' : 'HERHALINGEN'}</span><span>KLAAR</span><span></span></div>${e.sets.map((st, si) => setRow(st, si, ei, e, readOnly)).join('')}
    ${e.skippedReason ? `<p class="skip-text">${icon('info')} ${esc(e.skippedReason)}</p>` : ''}${!readOnly ? `<div class="exercise-tools"><button class="btn quiet" data-action="add-set" data-ei="${ei}">${icon('plus')}Werkset toevoegen</button><button class="btn quiet" data-action="rest" data-ei="${ei}">${icon('clock')}Rust ${esc(p.rest)}</button><button class="btn quiet" data-action="skip-exercise" data-ei="${ei}">${icon('skip')}${e.skippedReason ? 'Overslaan opheffen' : 'Oefening overslaan'}</button></div>` : ''}<div class="field exercise-note"><label for="exercise-note-${ei}">Oefeningnotitie</label><textarea id="exercise-note-${ei}" data-exercise-note data-ei="${ei}" ${readOnly ? 'readonly' : ''} placeholder="Bijzonderheden of een aanpassing…">${esc(e.note)}</textarea></div>` : `<button class="link-btn" data-action="exercise-info" data-exercise="${esc(e.exerciseId)}" data-ei="${ei}">Bekijk de volledige uitvoering ${icon('arrow')}</button>`}</div></details>`;
}
function setRow(st, si, ei, entry, readonly) {
  const m = entry.measurement, key = entryKey(ei, si);
  const field = (name, label, optional = false) => `<input type="text" inputmode="${name === 'reps' || name === 'reserve' ? 'numeric' : 'decimal'}" autocomplete="off" maxlength="12" data-set-field="${name}" ${key} value="${esc(inputNum(st[name]))}" aria-label="Set ${si + 1}: ${label}" placeholder="${optional ? 'optioneel' : '—'}" ${readonly || st.skipped ? 'readonly' : ''}>`;
  return `<div class="set-row ${st.completed ? 'completed' : ''} ${st.skipped ? 'skipped' : ''}"><span class="set-index">${si + 1}${st.kind === 'warmup' ? '<small> W</small>' : ''}</span>${m.kind === 'duration' ? field('seconds', 'seconden') + '<span></span>' : m.kind === 'reps' && !m.optionalWeight ? field('reps', 'herhalingen') + '<span></span>' : field('kg', m.label, m.optionalWeight) + field(m.kind === 'distance' ? 'meters' : 'reps', m.kind === 'distance' ? 'meters' : 'herhalingen')}<button class="set-check ${st.completed ? 'checked' : st.skipped ? 'skip' : ''}" data-action="complete-set" ${key} aria-label="Set ${si + 1} ${st.completed ? 'ongedaan maken' : st.skipped ? 'overgeslagen' : 'afronden'}" aria-pressed="${st.completed}" ${readonly ? 'disabled' : ''}>${icon(st.skipped ? 'skip' : 'check')}</button><button class="set-more" data-action="set-more" ${key} aria-label="Opties set ${si + 1}" aria-expanded="false">${icon('more')}</button></div><div class="set-extra" id="set-extra-${ei}-${si}"><div class="form-grid"><div class="field"><label for="reserve-${ei}-${si}">Herhalingen over (optioneel)</label><input id="reserve-${ei}-${si}" type="text" inputmode="numeric" data-set-field="reserve" ${key} value="${esc(inputNum(st.reserve))}" placeholder="Bijv. 2" ${readonly ? 'readonly' : ''}></div><div class="field"><label for="kind-${ei}-${si}">Type set</label><select id="kind-${ei}-${si}" data-set-field="kind" ${key} ${readonly ? 'disabled' : ''}><option value="work" ${st.kind === 'work' ? 'selected' : ''}>Werkset</option><option value="warmup" ${st.kind === 'warmup' ? 'selected' : ''}>Opwarmset (telt niet mee)</option></select></div></div><div class="field"><label for="note-${ei}-${si}">Setnotitie</label><input type="text" id="note-${ei}-${si}" data-set-field="note" ${key} value="${esc(st.note)}" maxlength="10000" ${readonly ? 'readonly' : ''} placeholder="Bijv. links 10, rechts 12 herhalingen"></div>${!readonly ? `<div class="row"><button class="btn outline" data-action="skip-set" ${key}>${st.skipped ? 'Toch uitvoeren' : 'Set overslaan'}</button><button class="btn danger" data-action="remove-set" ${key}>${icon('trash')}Verwijderen</button></div>` : ''}</div>`;
}
function statsPage() {
  const id = view.statsExercise, m = measurement(id);
  const all = exerciseStats(state.sessions, id, { basis: m.basis });
  const cutoff = view.period === 'all' ? '1900-01-01' : addDays(localDate(), -Number(view.period));
  const stats = { ...all, runs: all.runs.filter(r => r.date >= cutoff && r.date <= localDate()) };
  const key = metricFor(m), unit = m.unit;
  const completed = state.sessions.filter(s => s.status === 'completed').length;
  const weeks = weeklyCounts(state.sessions, addDays(mondayOf(), -49), localDate());
  const metricName = { average: m.kind === 'weight' ? 'Gemiddeld werksetgewicht' : m.kind === 'duration' ? 'Gemiddelde tijdsduur' : m.kind === 'distance' ? 'Gemiddelde afstand' : 'Gemiddeld aantal herhalingen', max: 'Hoogste waarde per uitvoering', reps: 'Herhalingen per uitvoering', volume: 'Volume per uitvoering', load: 'Gemiddeld gewicht per hand' }[view.chartMetric];
  return `<div class="page-intro"><div><div class="eyebrow">ELKE SET VERTELT EEN VERHAAL</div><h1>Jouw vooruitgang.</h1><p class="lead">Een helder beeld van wat je daadwerkelijk hebt gedaan.</p></div><span class="tag">${icon('check')}${completed} ${completed === 1 ? 'training' : 'trainingen'} voltooid</span></div>
    <div class="filter-bar"><div class="field"><label for="stats-exercise">Oefening</label><select id="stats-exercise" data-filter="statsExercise">${Object.entries(program.exercises).map(([k, e]) => `<option value="${k}" ${id === k ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}</select></div><div class="field"><label for="stats-period">Periode grafiek</label><select id="stats-period" data-filter="period"><option value="30" ${view.period === '30' ? 'selected' : ''}>30 dagen</option><option value="90" ${view.period === '90' ? 'selected' : ''}>90 dagen</option><option value="365" ${view.period === '365' ? 'selected' : ''}>1 jaar</option><option value="all" ${view.period === 'all' ? 'selected' : ''}>Alles</option></select></div></div>
    <p class="small muted">${esc(m.label)} · Resultaten blijven gescheiden per oefening en gewichtsdefinitie.</p>
    <div class="stat-grid"><div class="stat-tile"><div class="eyebrow">${m.kind === 'weight' ? 'Gewichtsrecord' : 'Persoonlijk record'}</div><div class="stat-value">${all.pr ? num(all.pr[key]) : '—'} <span>${all.pr ? unit : ''}</span></div><small>${all.pr ? dateFmt(all.pr.date, { year: 'numeric' }) + (all.pr.reps !== null ? ' · ' + num(all.pr.reps) + ' herh.' : m.kind === 'distance' ? ' · ' + num(all.pr.kg) + ' kg per hand' : '') : 'Je eerste record komt vanzelf.'}</small></div><div class="stat-tile"><div class="eyebrow">Gemiddeld gebruikt</div><div class="stat-value">${num(all.average)} <span>${all.average !== null ? unit : ''}</span></div><small>Alle geldige geregistreerde werksets · ${all.sets} sets</small></div><div class="stat-tile"><div class="eyebrow">Laatste 5 uitvoeringen</div><div class="stat-value">${num(all.recentAverage)} <span>${all.recentAverage !== null ? unit : ''}</span></div><small>Gemiddelde van werksets in de laatste ${Math.min(5, all.runs.length)} ${all.runs.length === 1 ? 'uitvoering' : 'uitvoeringen'}</small></div></div>
    ${m.kind === 'distance' && all.load ? `<div class="notice" style="margin-bottom:20px">${icon('trophy')}<p><strong>Gewichtsrecord: ${num(all.load.pr.kg)} kg per hand</strong> · ${num(all.load.pr.meters)} m · ${dateFmt(all.load.pr.date, { year: 'numeric' })}<br>Gemiddelde alle werksets: ${num(all.load.average)} kg per hand · laatste 5 uitvoeringen: ${num(all.load.recentAverage)} kg per hand.</p></div>` : ''}
    <section class="panel"><div class="chart-head"><div><h2>${metricName}</h2><p>Per trainingssessie · ${esc(m.label)}</p></div><div class="metric-tabs" role="group" aria-label="Grafiekmeting">${[['average', 'Gemiddelde'], ['max', 'Record'], ...(m.kind === 'distance' ? [['load', 'Gewicht']] : []), ...(m.kind === 'weight' || m.kind === 'reps' ? [['reps', 'Herhalingen']] : []), ...(m.kind === 'weight' ? [['volume', 'Volume']] : [])].map(([v, l]) => `<button class="${view.chartMetric === v ? 'active' : ''}" data-action="chart-metric" data-metric="${v}" aria-pressed="${view.chartMetric === v}">${l}</button>`).join('')}</div></div>${stats.runs.length ? chartMarkup(stats.runs, m) : `<div class="empty"><div class="empty-icon">${icon('chart')}</div><h3>${all.runs.length ? 'Nog geen sets in deze periode' : 'Hier groeit je vooruitgang.'}</h3><p>${all.runs.length ? 'Kies een langere periode om je eerdere uitvoeringen te bekijken.' : 'Registreer je eerste werkset. Dan verschijnen hier je gewichten, herhalingen en persoonlijke records.'}</p><button class="btn outline" data-action="nav" data-page="home">Naar je trainingen ${icon('arrow')}</button></div>`}${view.chartMetric === 'volume' ? `<p class="small muted" style="font-size:10px">Volume = som van ingevoerde kg × herhalingen. Bij dumbbells per dumbbell; bij eenzijdige oefeningen per kant. Geen verdubbeling. Vergelijk alleen dezelfde oefening en gewichtsdefinitie.</p>` : ''}</section>
    <section class="panel space-top"><div class="chart-head"><div><h2>Een ritme dat je volhoudt</h2><p>Voltooide trainingen per kalenderweek · laatste 8 weken</p></div><span class="tag soft">${completed} in totaal</span></div><div class="bar-chart" aria-label="Voltooide trainingen per week">${weeks.map(w => `<div class="bar-col"><span class="bar-count">${w.count}</span><div class="bar" style="height:${w.count ? Math.max(10, w.count / Math.max(4, ...weeks.map(x => x.count)) * 100) : 3}px" title="Week van ${dateFmt(w.monday)}: ${w.count} ${w.count === 1 ? 'training' : 'trainingen'}"></div><small>${dateFmt(w.monday)}</small></div>`).join('')}</div></section>
    ${all.runs.length ? `<div class="section-head"><div><h2>Oefeninggeschiedenis</h2><p>Geldige afgeronde werksets voor deze oefening.</p></div><button class="link-btn" data-action="exercise-info" data-exercise="${id}">Oefenuitleg ${icon('info')}</button></div><div class="panel table-wrap"><table class="data-table"><thead><tr><th>DATUM / TRAINING</th><th>GEREGISTREERDE SETS</th><th>GEMIDDELDE</th></tr></thead><tbody>${[...stats.runs].reverse().map(r => `<tr><td><button data-action="open-session" data-id="${esc(r.sessionId)}">${dateFmt(r.date, { year: 'numeric' })}</button><br><span class="muted">${esc(r.title)}</span></td><td>${r.sets.map(st => esc(performanceText(st, r.measurement))).join('<br>')}${all.records.some(rec => rec.sessionId === r.sessionId) ? '<span class="new-record">Nieuw record</span>' : ''}</td><td>${num(r.average)} ${unit}</td></tr>`).join('')}</tbody></table></div>` : ''}
    <div class="notice space-top">${icon('info')}<p>Je ziet trainingstrends uit afgeronde werksets, ook uit gedeeltelijk opgeslagen trainingen. Opwarmsets en overgeslagen sets tellen niet mee. Gewichtscijfers zeggen op zichzelf niets over spiergroei.</p></div>`;
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
  return `<div class="page-intro"><div><div class="eyebrow">JOUW PERSOONLIJKE LOGBOEK</div><h1>Elke training bewaard.</h1><p class="lead">Kijk terug, ga verder of voeg een eerdere training toe.</p></div><button class="btn primary" data-action="backdate">${icon('plus')}Training toevoegen</button></div><div class="filter-bar"><div class="field"><label for="history-period">Periode</label><select id="history-period" data-filter="historyPeriod"><option value="all" ${view.historyPeriod === 'all' ? 'selected' : ''}>Alle trainingen</option><option value="30" ${view.historyPeriod === '30' ? 'selected' : ''}>Laatste 30 dagen</option><option value="90" ${view.historyPeriod === '90' ? 'selected' : ''}>Laatste 90 dagen</option><option value="365" ${view.historyPeriod === '365' ? 'selected' : ''}>Laatste jaar</option></select></div></div>${sessions.length ? `<div class="history-list">${sessions.map(s => { const count = s.exercises.reduce((n, e) => n + e.sets.filter(st => validSet(st, e.measurement)).length, 0); return `<button class="history-item" data-action="open-session" data-id="${esc(s.id)}"><span class="date-block"><strong>${Number(s.date.slice(8))}</strong><small>${dateFmt(s.date, { day: undefined, month: 'short' })}</small></span><div class="grow"><h3>${esc(s.title)}</h3><p>${s.date.slice(0, 4)} · week ${s.variant} · ${count} werksets · week van ${dateFmt(s.weekMonday)}</p></div><span class="tag ${s.status === 'completed' ? 'soft' : 'orange'}">${s.status === 'completed' ? 'Voltooid' : s.status === 'paused' ? 'Gepauzeerd' : 'Bezig'}</span>${icon('right')}</button>`; }).join('')}</div>` : `<div class="panel empty"><div class="empty-icon">${icon('history')}</div><h3>Je logboek begint bij je eerste set.</h3><p>Je trainingen blijven hier bewaard, ook als maandag een nieuwe trainingsweek begint.</p><button class="btn primary" data-action="backdate">${icon('plus')}Training toevoegen</button></div>`}`;
}
function libraryPage() {
  return `<div class="page-intro"><div><div class="eyebrow">BEWEEG MET VERTROUWEN</div><h1>Jouw oefeningenboek.</h1><p class="lead">De volledige uitvoering, precies uit je eigen programma.</p></div><span class="tag">${Object.keys(program.exercises).length} oefeningen</span></div><div class="field" style="margin-bottom:22px"><label for="exercise-search">Zoek een oefening of spiergroep</label><input type="search" id="exercise-search" placeholder="Bijv. dumbbell, rug of schouders…" autocomplete="off"></div><div class="library-grid">${Object.entries(program.exercises).map(([id, e]) => `<button class="library-item" data-action="exercise-info" data-exercise="${id}" data-search="${esc((e.name + ' ' + e.muscles).toLocaleLowerCase('nl'))}"><div class="grow"><h3>${esc(e.name)}</h3><p>${esc(e.muscles)}</p></div>${icon('right')}</button>`).join('')}</div><p id="search-empty" class="muted small" hidden>Geen oefening gevonden. Probeer een andere naam of spiergroep.</p>`;
}
function settingsPage() {
  return `<div class="page-intro"><div><div class="eyebrow">MAAK HET JOUW RITME</div><h1>Alles goed geregeld.</h1><p class="lead">Je schema, je gegevens en een veilige back-up.</p></div></div><div class="settings-grid"><section class="panel"><h2>Jouw trainingscyclus</h2><p>Vanaf je ankermaandag wisselen week 1 en week 2 automatisch. Jij kiest je trainingsdagen.</p><div class="field"><label for="anchor-date">Maandag waarop week 1 begint</label><input type="date" id="anchor-date" value="${state.settings.anchorMonday || initialMonday}" min="1900-01-01" max="2200-12-31"><small>Elke maandag om 00:00 in Europe/Amsterdam begint de andere variant.</small></div><button class="btn outline" data-action="update-anchor">Startdatum aanpassen</button></section><section class="panel"><h2>Helemaal jouw weergave</h2><p>Een rustige trainingsruimte, ook 's avonds in de sportschool.</p><div class="field"><label for="theme">Kleurthema</label><select id="theme" data-setting="theme"><option value="light" ${state.settings.theme === 'light' ? 'selected' : ''}>Licht</option><option value="dark" ${state.settings.theme === 'dark' ? 'selected' : ''}>Donker</option><option value="system" ${state.settings.theme === 'system' ? 'selected' : ''}>Volg mijn apparaat</option></select></div><button class="btn outline" data-action="install">${icon('plus')}Installeer op je telefoon</button></section><section class="panel"><h2>Neem je gegevens mee</h2><p>Alles wordt opgeslagen in deze browser op dit apparaat. Er is geen automatische synchronisatie. Exporteer regelmatig en vóór je browsergegevens wist.</p><div class="row wrap"><button class="btn primary" data-action="export">${icon('download')}Volledige back-up</button><button class="btn outline" data-action="csv">CSV van je sets</button></div><p class="small" style="margin-top:14px">Je back-up bevat je instellingen, bronprogramma en alle trainingen, inclusief onafgeronde sets en historische oefenuitleg.</p></section><section class="panel"><h2>Een back-up terugzetten</h2><p>Controleer eerst het bestand. Standaard voegen we alleen ontbrekende trainingen toe; bestaande trainingen blijven behouden.</p><button class="btn outline" data-action="choose-import">${icon('upload')}Back-up selecteren</button><input id="import-file" type="file" accept="application/json,.json" hidden><p class="small" style="margin-top:17px">Verplaatsen naar een andere telefoon? Exporteer hier en importeer daar hetzelfde bestand.</p></section><section class="panel full"><h2>Met aandacht trainen</h2><p>${esc(program.metadata.safety)}</p><button class="link-btn" data-action="safety">Lees alle trainingsafspraken ${icon('arrow')}</button></section><section class="panel full source-notes"><details><summary>Over je programmabron · versie ${esc(program.metadata.version)}</summary><p>De meegeleverde JSON is leidend voor alle oefeningen, volgorde, sets, herhalingen, rust en uitleg. Alle 6 varianten blijven apart geregistreerd. De 35 oefenbeschrijvingen zijn integraal opgenomen.</p><p><strong>Bronverschil warming-up:</strong> de JSON beschrijft 3–6 minuten lichte beweging voor Upper en 3–5 minuten voor Lower. Het Markdown-bestand noemt 2–3 en 3–4 minuten, binnen 5–7 minuten totaal. Ritme volgt de JSON.</p><p>${esc(program.metadata.workset_definition)} ${esc(program.metadata.rest_definition)}</p><p>${esc(program.progression.main)}</p><p>Gewichten per dumbbell blijven per dumbbell; halters zijn totaal inclusief stang; machines gebruiken de afgelezen belasting. Wrist curls gebruiken consequent één dumbbell. Bij ondersteunde beenoefeningen telt de totale optionele externe last. Wissel je apparatuur of gewichtsdefinitie, zet dat in de notitie en vergelijk de cijfers niet direct.</p><p>Verander je de programmabron later, dan behouden bestaande trainingen hun oorspronkelijke instructies, voorschrift en eenheden.</p><p>Bronverwijzingen uit je programma (niet zelfstandig opnieuw beoordeeld):</p><ul>${program.sources.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a></li>`).join('')}</ul></details></section></div>`;
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
function showOnboarding() {
  showModal(`<div class="onboard"><div class="brand"><span class="brand-mark">r.</span>ritme.</div><div class="eyebrow muted" style="margin-bottom:12px">WELKOM IN JOUW TRAININGSRUIMTE</div><h2 id="modal-title">Een vast plan.<br>Jouw eigen ritme.</h2><p class="lead">Je Upper/Lower-programma staat klaar. Kies een startmaandag voor week 1; daarna wisselen je weken vanzelf.</p><div class="field"><label for="onboard-anchor">Wanneer begint week 1?</label><input type="date" id="onboard-anchor" value="${initialMonday}" min="1900-01-01" max="2200-12-31" required><small>Kies een maandag. Je bent vrij om je trainingen over de week te verdelen.</small></div><div class="notice">${icon('shield')}<p>Je logboek blijft op dit apparaat. Via Instellingen kun je altijd een volledige back-up maken.</p></div><button class="btn primary wide" data-action="onboard">Mijn ritme begint hier ${icon('arrow')}</button><p class="fine">Vier trainingen per week · Geen vaste trainingsdagen</p></div>`, { locked: true });
}
function showExercise(id, ei) {
  const s = session();
  const snapshot = view.page === 'workout' && s && ei !== undefined ? s.exercises[Number(ei)] : null;
  const e = snapshot?.exerciseId === id ? snapshot.instruction : program.exercises[id];
  if (!e) return;
  const m = snapshot?.measurement || measurement(id);
  const prescribed = snapshot ? [snapshot.prescription] : (view.page === 'workout' ? program.week_programs[view.variant || s?.variant || currentWeek().variant][view.day || s?.day || 'upper_a'].filter(p => p.exercise_id === id) : Object.entries(program.week_programs).flatMap(([variant, days]) => Object.entries(days).flatMap(([day, entries]) => entries.filter(p => p.exercise_id === id).map(p => ({ ...p, context: titleFor(day, Number(variant)) })))));
  const stats = exerciseStats(state.sessions, id, { basis: m.basis });
  showModal(dialogContent(esc(e.name), `<p class="lead">${esc(e.muscles)}</p>${prescribed.length ? `<div class="notice space-top"><div>${prescribed.map(p => `<p>${p.context ? `<strong>${esc(p.context)}:</strong> ` : ''}${p.sets} werksets × ${esc(p.reps)} · ${esc(p.rest)} rust</p>`).join('')}</div></div>` : id === 'scapular_pushup' ? '<div class="notice space-top">Warming-up Upper: 1 × 10–12 herhalingen, geen werkset.</div>' : ['dead_hang', 'assisted_hang'].includes(id) ? `<div class="notice space-top">${esc(id === 'dead_hang' ? program.finisher.upper_b : 'Optionele warming-up: 10–15 seconden ondersteund, alleen pijnvrij.')}</div>` : ''}<p class="lead" style="font-size:11px">${esc(reserveText(id))}</p>${statsStrip(stats, m)}<p class="small muted">${esc(m.label)}</p>${[['setup', '01 · Startpositie & opstelling'], ['movement', '02 · De beweging'], ['cues', '03 · Houding, aanspanning & ademhaling'], ['avoid', '04 · Veelgemaakte fouten'], ['adjust', '05 · Aanpassingen bij klachten']].map(([k, label]) => `<section class="instruction"><h3>${label}</h3><p>${esc(e[k])}</p></section>`).join('')}${stats.latest ? `<div class="notice"><div><strong>Laatste uitvoering · ${dateFmt(stats.latest.date, { year: 'numeric' })}</strong><p>${stats.latest.sets.map(st => esc(performanceText(st, m))).join(' / ')}</p></div></div>` : ''}`, snapshot ? `OEFENUITLEG · BEWAARDE VERSIE ${esc(s.programVersion)}` : 'JOUW OEFENINGENBOEK'));
}
function showSafety() {
  showModal(dialogContent('Train met aandacht.', `<div class="notice warning">${icon('shield')}<p>${esc(program.metadata.safety)}</p></div><section class="instruction"><h3>Je fysiotherapie blijft leidend</h3><p>${esc(program.physio.current)}</p><p>${esc(program.physio.boundary)}</p></section><section class="instruction"><h3>Klachten tijdens en na het trainen</h3><p>${esc(program.progression.pain)}</p><p>Bij plots krachtverlies, forse zwelling of tintelingen professioneel laten onderzoeken. Noteer klachten tijdens, later op de dag en de volgende ochtend in je trainingsnotitie.</p></section><section class="instruction"><h3>Rust en uitvoering</h3><p>${esc(program.metadata.rest_definition)} ${esc(program.metadata.reserves_target)}</p></section><section class="instruction"><h3>Progressie zonder haast</h3><p>${esc(program.progression.main)}</p><p>De tijdsindicatie is een doel. Kort rust niet in ten koste van techniek; een laatste accessoire-set of optionele hang mag vervallen.</p></section>`, 'JOUW TRAININGSAFSPRAKEN'));
}
function dateDialog(mode = 'backdate') {
  const s = session();
  const date = mode === 'edit-date' ? s.date : view.page === 'workout' ? workoutContext().date : localDate();
  const w = weekFor(state.settings.anchorMonday || initialMonday, date);
  showModal(dialogContent(mode === 'edit-date' ? 'Trainingsdatum wijzigen' : mode === 'change-date' ? 'Kies je trainingsdatum' : 'Een training toevoegen', `<p class="lead">${mode === 'edit-date' ? 'Het bewaarde schema blijft hetzelfde. De training telt mee in de kalenderweek van de nieuwe datum.' : 'Kies de echte trainingsdatum. Het schema volgt automatisch uit jouw startmaandag.'}</p><div class="form-grid space-top"><div class="field"><label for="log-date">Trainingsdatum</label><input type="date" id="log-date" value="${date}" min="1900-01-01" max="${localDate()}" required></div><div class="field"><label for="log-day">Training</label><select id="log-day" ${mode === 'edit-date' ? 'disabled' : ''}>${DAYS.map(d => `<option value="${d}" ${d === (s?.day || view.day || 'upper_a') ? 'selected' : ''}>${titleFor(d, w.variant)}</option>`).join('')}</select></div></div><p id="log-week" class="lead" style="font-size:11px">Week ${w.variant} · ${rangeFmt(w)}</p><div class="modal-actions"><button class="btn outline" data-action="close-modal">Annuleren</button><button class="btn primary" data-action="confirm-date" data-mode="${mode}">${mode === 'edit-date' ? 'Datum opslaan' : 'Training openen'} ${icon('arrow')}</button></div>`));
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
function go(page) { view.page = page; view.sessionId = null; location.hash = page; render(); window.scrollTo(0, 0); }
function download(name, content, type) {
  const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
}
function exportBackup() { download(`ritme-backup-${localDate()}.json`, JSON.stringify(makeBackup(state, program), null, 2), 'application/json'); toast('Je volledige back-up is gedownload. Bewaar hem op een veilige plek.'); }
function exportCsv() {
  const rows = [['training_id', 'datum', 'kalenderweek_maandag', 'weekvariant', 'training', 'trainingstatus', 'oefening_id', 'oefening', 'gewichtdefinitie', 'set', 'type', 'kg', 'herhalingen', 'seconden', 'meters', 'herhalingen_over', 'voltooid', 'overgeslagen', 'notitie']];
  state.sessions.forEach(s => s.exercises.forEach(e => e.sets.forEach((st, i) => rows.push([s.id, s.date, s.weekMonday, s.variant, s.title, s.status, e.exerciseId, e.instruction.name, e.measurement.basis, i + 1, st.kind, st.kg, st.reps, st.seconds, st.meters, st.reserve, st.completed, st.skipped, st.note]))));
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
    const s = session(), ei = Number(el.dataset.ei), si = Number(el.dataset.si), entry = s?.exercises[ei], st = entry?.sets[si];
    if (action === 'nav') { go(el.dataset.page); return; }
    if (action === 'week') { view.weekOffset += Number(el.dataset.offset); render(); return; }
    if (action === 'this-week') { view.weekOffset = 0; render(); return; }
    if (action === 'open-workout') {
      const w = weekFor(state.settings.anchorMonday || initialMonday, el.dataset.date), found = statusFor(el.dataset.day, w);
      view = { ...view, page: 'workout', day: el.dataset.day, variant: Number(el.dataset.variant), date: el.dataset.date, sessionId: found?.id };
      render(); window.scrollTo(0, 0); return;
    }
    if (action === 'open-session') { const found = state.sessions.find(s => s.id === el.dataset.id); if (!found) return; view = { ...view, page: 'workout', sessionId: found.id, day: found.day, variant: found.variant, date: found.date }; render(); window.scrollTo(0, 0); return; }
    if (action === 'onboard') {
      const date = $('#onboard-anchor').value;
      if (!date || mondayOf(date) !== date) { $('#onboard-anchor').setCustomValidity('Kies een maandag waarop week 1 begint.'); $('#onboard-anchor').reportValidity(); return; }
      state.settings.anchorMonday = date;
      if (await persist()) { modal.dataset.locked = 'false'; modal.close(); render(); navigator.storage?.persist?.().catch(() => {}); }
      return;
    }
    if (action === 'start') {
      if (fatalError) { toast('Lokale opslag is niet beschikbaar. Herlaad de app.'); return; }
      const ctx = workoutContext();
      if (ctx.date > localDate()) { toast('Deze training ligt in de toekomst. Kies eerst de juiste datum.'); dateDialog('change-date'); return; }
      const created = createSession(program, ctx.day, ctx.variant, ctx.date); state.sessions.push(created); view.sessionId = created.id;
      await persist(); render(); return;
    }
    if (action === 'new-execution') { view.sessionId = null; view.date = localDate(); view.variant = currentWeek().variant; render(); toast('Een nieuwe uitvoering staat klaar. Kies eventueel een andere datum.'); return; }
    if (action === 'change-date' || action === 'backdate') { dateDialog(action); return; }
    if (action === 'confirm-date') {
      const input = $('#log-date'); if (!input.reportValidity()) return;
      const date = input.value, w = weekFor(state.settings.anchorMonday || initialMonday, date);
      if (el.dataset.mode === 'edit-date') { s.date = date; s.weekMonday = w.monday; s.updatedAt = new Date().toISOString(); await persist(); view.date = date; }
      else { view = { ...view, page: 'workout', sessionId: null, day: $('#log-day').value, variant: w.variant, date }; }
      modal.close(); render(); window.scrollTo(0, 0); return;
    }
    if (action === 'set-more') { const extra = $(`#set-extra-${ei}-${si}`); extra.classList.toggle('open'); el.setAttribute('aria-expanded', String(extra.classList.contains('open'))); return; }
    if (action === 'complete-set' && st) {
      if (st.skipped) { st.skipped = false; entry.skippedReason = null; }
      else if (st.completed) st.completed = false;
      else { const err = setError(st, entry.measurement); if (err) { toast(err); const input = document.querySelector(`input[data-ei="${ei}"][data-si="${si}"]`); input?.focus(); return; } st.completed = true; }
      s.updatedAt = new Date().toISOString(); await persist(); keepOpenRender(); return;
    }
    if (action === 'add-set' && entry) { entry.sets.push(newSet()); s.updatedAt = new Date().toISOString(); await persist(); keepOpenRender(); return; }
    if (action === 'skip-set' && st) { st.skipped = !st.skipped; st.completed = false; s.updatedAt = new Date().toISOString(); await persist(); keepOpenRender(); return; }
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
      const unfilled = s.exercises.reduce((n, e) => n + e.sets.filter(st => !st.completed && !st.skipped).length, 0);
      confirmDialog('Goed getraind.', unfilled ? `Er staan nog ${unfilled} sets open. Je mag de training nu afronden. Die sets tellen niet mee voor records of gemiddelden en blijven later aanpasbaar.` : 'Bewaar deze training als voltooid. Je resultaten staan klaar in je logboek en statistieken.', 'Training afronden', 'confirm-finish'); return;
    }
    if (action === 'confirm-finish') { s.status = 'completed'; s.completedAt = new Date().toISOString(); s.updatedAt = s.completedAt; await persist(); modal.close(); render(); toast('Training voltooid. Weer een stap vooruit.'); return; }
    if (action === 'reopen') { s.status = 'active'; s.completedAt = null; s.updatedAt = new Date().toISOString(); await persist(); render(); return; }
    if (action === 'session-options') { showModal(dialogContent('Je trainingsregistratie', `<div class="stack"><button class="btn outline" data-action="edit-date">${icon('calendar')}Trainingsdatum wijzigen</button><button class="btn outline" data-action="export">${icon('download')}Eerst een back-up maken</button><button class="btn danger" data-action="delete-session">${icon('trash')}Deze training verwijderen</button></div>`)); return; }
    if (action === 'edit-date') { dateDialog('edit-date'); return; }
    if (action === 'delete-session') { confirmDialog('Training verwijderen?', 'Deze training en alle bijbehorende sets worden verwijderd. Maak eerst een back-up als je ze wilt bewaren.', 'Definitief verwijderen', 'confirm-delete-session', true); return; }
    if (action === 'confirm-delete-session') { state.sessions = state.sessions.filter(x => x.id !== s.id); await persist(); modal.close(); go('history'); toast('Training verwijderd.'); return; }
    if (action === 'add-finisher') { s.exercises.push(exerciseEntry(program, { exercise_id: 'dead_hang', name: program.exercises.dead_hang.name, sets: 2, reps: '15–30 seconden', rest: 'Naar behoefte', is_variation: false, base_id: null }, true)); s.updatedAt = new Date().toISOString(); await persist(); keepOpenRender(); const card = document.querySelector('[data-exercise-card]:last-child'); if (card) { card.open = true; card.scrollIntoView({ behavior: 'smooth', block: 'start' }); } return; }
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
    if (action === 'update-anchor') {
      const date = $('#anchor-date').value;
      if (!date || mondayOf(date) !== date) { $('#anchor-date').setCustomValidity('Kies een maandag.'); $('#anchor-date').reportValidity(); return; }
      view.pendingAnchor = date;
      confirmDialog('Startmaandag aanpassen?', 'Dit verandert welke variant je bij kalenderweken ziet. Je oude trainingsdata, weekvariant, voortgang en instructies blijven ongewijzigd. Daardoor kan een historische training afwijken van het nieuw weergegeven weekschema.', 'Startdatum opslaan', 'confirm-anchor'); return;
    }
    if (action === 'confirm-anchor') { state.settings.anchorMonday = view.pendingAnchor; await persist(); modal.close(); view.weekOffset = 0; render(); toast('Je startmaandag is aangepast.'); return; }
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
    if (action === 'retry-save') { await persist(); render(); return; }
  } catch (e) { toast(e.message || 'Dit lukte niet. Probeer het opnieuw.'); }
});

document.addEventListener('input', event => {
  const el = event.target;
  if (el.id === 'onboard-anchor' || el.id === 'anchor-date') el.setCustomValidity('');
  if (el.id === 'exercise-search') {
    let count = 0; const query = el.value.trim().toLocaleLowerCase('nl');
    document.querySelectorAll('[data-search]').forEach(card => { const match = card.dataset.search.includes(query); card.hidden = !match; if (match) count++; });
    $('#search-empty').hidden = count !== 0; return;
  }
  const s = session(); if (!s || s.status === 'completed') return;
  const ei = Number(el.dataset.ei), si = Number(el.dataset.si);
  if (el.hasAttribute('data-set-field')) {
    const st = s.exercises[ei]?.sets[si]; if (!st || el.dataset.setField === 'kind') return;
    const field = el.dataset.setField;
    if (field === 'note') st.note = el.value.slice(0, 10000);
    else {
      const value = parseNumber(el.value);
      const invalid = Number.isNaN(value) || (value !== null && (value > 1000000 || (['reps', 'reserve'].includes(field) && !Number.isInteger(value)) || (field === 'reserve' && value > 30)));
      el.setCustomValidity(invalid ? 'Vul een geldig positief getal in; komma of punt mag. Herhalingen zijn gehele getallen.' : '');
      st[field] = invalid ? null : value;
      if (st.completed && setError(st, s.exercises[ei].measurement)) { st.completed = false; el.closest('.set-row')?.classList.remove('completed'); const check = el.closest('.set-row')?.querySelector('.set-check'); check?.classList.remove('checked'); check?.setAttribute('aria-pressed', 'false'); }
    }
  } else if (el.hasAttribute('data-exercise-note')) s.exercises[ei].note = el.value.slice(0, 10000);
  else if (el.hasAttribute('data-session-note')) s.note = el.value.slice(0, 10000);
  else return;
  s.updatedAt = new Date().toISOString(); persist();
});
document.addEventListener('change', async event => {
  const el = event.target;
  if (el.dataset.filter) { view[el.dataset.filter] = el.value; if (el.dataset.filter === 'statsExercise') view.chartMetric = 'average'; render(); return; }
  if (el.dataset.setting === 'theme') { state.settings.theme = el.value; applyTheme(); await persist(); return; }
  if (el.dataset.setField === 'kind') { const s = session(); if (!s || s.status === 'completed') return; s.exercises[Number(el.dataset.ei)].sets[Number(el.dataset.si)].kind = el.value; s.updatedAt = new Date().toISOString(); await persist(); keepOpenRender(); return; }
  if (el.id === 'log-date' && el.value) { try { const w = weekFor(state.settings.anchorMonday || initialMonday, el.value); $('#log-week').textContent = `Week ${w.variant} · ${rangeFmt(w)}`; if (!$('#log-day').disabled) [...$('#log-day').options].forEach((o, i) => { o.text = titleFor(DAYS[i], w.variant); }); } catch {} return; }
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
window.addEventListener('hashchange', () => { const page = location.hash.slice(1); if (['home', 'stats', 'history', 'library', 'settings'].includes(page) && page !== view.page) { view.page = page; view.sessionId = null; render(); window.scrollTo(0, 0); } });
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; });
window.addEventListener('online', () => render());
window.addEventListener('offline', () => render());
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
function checkWeek() {
  const monday = mondayOf();
  if (monday !== initialMonday) { initialMonday = monday; if (view.page === 'home') { view.weekOffset = 0; render(); } toast('Je nieuwe trainingsweek staat klaar. Je logboek blijft bewaard.'); }
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
  const page = location.hash.slice(1); if (['home', 'stats', 'history', 'library', 'settings'].includes(page)) view.page = page;
  render();
  if (!state.settings.anchorMonday && !fatalError) showOnboarding();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
} catch (e) { app.innerHTML = `<div class="boot"><span class="brand-mark">r.</span><h2>Je training staat nog even stil.</h2><p>${esc(e.message)}</p><button class="btn primary" onclick="location.reload()">Opnieuw proberen</button></div>`; }
