import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createBestSession, createSession, sessionStatus, trainingWeek, trainingSelection, switchChoice } from '../dist/core.mjs';
const program = JSON.parse(readFileSync(new URL('../dist/program.json', import.meta.url)));
const create = (day = 'upper_a') => createBestSession(program, day, 2, '2026-11-14');

test('alleen bekijken, lege oude sessies, voorgestelde waarden en keuze wisselen starten geen training', () => {
  assert.equal(sessionStatus(null), 'not-started');
  for (const session of [create(), createSession(program, 'upper_a', 2, '2026-11-14')]) assert.equal(sessionStatus(session), 'not-started');
  const s = create('lower_a'); switchChoice(s, 0, 'barbell_bent_over_row', program);
  assert.equal(sessionStatus(s), 'not-started');
});
test('echte invoer, afvinken, notities, pauze en expliciet starten zijn activiteit', () => {
  for (const field of ['kg', 'reps', 'seconds', 'meters', 'reserve']) {
    const s = create(); s.exercises[0].sets[0][field] = 0;
    assert.equal(sessionStatus(s), 'active', field);
  }
  for (const edit of [s => s.exercises[0].exerciseCompleted = true, s => s.exercises[0].sets[0].skipped = true,
    s => s.note = 'Rustig opbouwen', s => s.exercises[0].note = 'Linkerarm', s => s.status = 'paused', s => s.startedExplicitly = true]) {
    const s = create(); edit(s); assert.equal(sessionStatus(s), 'active');
  }
});
test('alle oefeningen afgevinkt is nog geen expliciet afgeronde training', () => {
  const s = create(); s.exercises.forEach(e => e.exerciseCompleted = true);
  assert.equal(sessionStatus(s), 'active');
  s.status = 'completed'; s.completedAt = s.updatedAt;
  assert.equal(sessionStatus(s), 'completed');
});
test('gearchiveerde keuze-invoer blijft activiteit; statuscontrole wijzigt geen gegevens', () => {
  const s = create('lower_a'); s.exercises[0].sets[0].kg = 80;
  switchChoice(s, 0, 'barbell_bent_over_row', program);
  const before = structuredClone(s);
  assert.equal(sessionStatus(s), 'active'); assert.deepEqual(s, before);
});
test('meerdere echte trainingen mogen bezig zijn; lege latere sessie verdringt geen hervatbare invoer', () => {
  const a = create(), empty = create(), b = create('lower_a');
  a.exercises[0].sets[0].kg = 25; b.exercises[0].sets[0].reps = 8;
  empty.updatedAt = '2026-11-14T23:00:00Z';
  const sessions = [a, empty, b], before = structuredClone(sessions);
  const selected = trainingSelection(sessions, trainingWeek(a.date), a.date);
  assert.equal(selected.rows[0].session.id, a.id);
  assert.equal(sessionStatus(selected.rows[0].session), 'active');
  assert.equal(sessionStatus(selected.rows[1].session), 'active');
  assert.equal(sessionStatus(selected.rows[2].session), 'not-started');
  assert.deepEqual(sessions, before);
});
