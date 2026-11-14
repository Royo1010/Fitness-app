import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { guides, exerciseGuide, displayName } from '../dist/exercise-guides.mjs';
import { createBestSession } from '../dist/core.mjs';

const program = JSON.parse(readFileSync(new URL('../dist/program.json', import.meta.url)));

test('alle 37 oefeningen, inclusief alternatieven en historische oefeningen, hebben een tekstgids', () => {
  assert.deepEqual(Object.keys(guides).sort(), Object.keys(program.exercises).sort());
  for (const [id, original] of Object.entries(program.exercises)) {
    const g = exerciseGuide(id, original);
    assert.ok(g.muscle.length > 3, id);
    assert.ok(g.about.length > 90 && g.about.split(/[.!?]\s/).length >= 2, id + ': herkenbare introductie');
    assert.ok(g.equipment.length > 80, id + ': apparaat en instelling');
    assert.ok(g.steps.length >= 3 && g.steps.every(s => s.length > 40), id + ': concrete stappen');
    assert.ok(g.mistakes.length >= 3 && g.mistakes.length <= 5, id + ': gerichte fouten');
    for (const field of ['setup', 'movement', 'cues', 'avoid', 'adjust']) assert.equal(g[field], original[field]);
  }
});

test('spiergroepen en materiaal maken curl, extension en schouderoefeningen herkenbaar', () => {
  assert.equal(guides.seated_leg_curl.muscle, 'Hamstrings (achterkant bovenbenen)');
  assert.equal(guides.leg_extension.muscle, 'Quadriceps (voorkant bovenbenen)');
  assert.match(guides.seated_leg_curl.equipment, /rol achter je onderbenen/);
  assert.match(guides.leg_extension.equipment, /rol vóór je onderbenen/);
  assert.equal(guides.lateral_raise.muscle, 'Schouders (zijkant)');
  assert.equal(guides.technogym_reverse_fly.muscle, 'Achterste schouders \/ bovenrug');
  assert.match(guides.lateral_raise.steps.join(' '), /elleboog leidt/);
  assert.match(guides.technogym_reverse_fly.equipment, /armkussens/);
});

test('overbodige toevoegingen verdwijnen alleen uit weergavenamen; greep blijft herkenbaar', () => {
  for (const name of ['Dumbbell row (week 2)', 'Dumbbell row (week 2 Lower A)', 'Dumbbell row (variant 1)', 'Dumbbell row (Week 1)']) {
    assert.equal(displayName(name), 'Dumbbell row');
  }
  assert.equal(displayName('Technogym Reverse Fly (met armkussens)'), 'Technogym Reverse Fly');
  assert.equal(displayName('Dumbbell biceps curl (supinerende/onderhandse greep)'), 'Dumbbell biceps curl');
  assert.equal(displayName('45° back extension (heupdominant)'), '45° back extension');
  assert.equal(displayName('Chest-supported row (machine)'), 'Chest-supported row (machine)');
  assert.equal(displayName('Dead hang (einde Upper B)'), 'Dead hang');
  assert.equal(displayName('Seated row (neutrale greep)'), 'Seated row (neutrale greep)');
});

test('weergave verrijkt bewaarde instructies zonder programma of sessies te wijzigen', () => {
  const session = createBestSession(program, 'upper_a', 2, '2026-11-14');
  const before = structuredClone({ program, session });
  for (const entry of session.exercises) exerciseGuide(entry.exerciseId, entry.instruction);
  for (const [id, instruction] of Object.entries(program.exercises)) exerciseGuide(id, instruction);
  assert.deepEqual({ program, session }, before);
  assert.match(session.exercises.find(e => e.exerciseId === 'chest_supported_db_row').instruction.name, /\(week 2\)/);
});

test('onbekende oefening uit een oudere back-up blijft leesbaar met de eigen instructies', () => {
  const original = { name: 'Eigen oefening (week 1)', muscles: 'Eigen spiergroep', setup: 'Bewaarde opstelling.', movement: 'Bewaarde uitvoering.', cues: 'Bewaarde aanwijzingen.', avoid: 'Bewaarde fouten.', adjust: 'Bewaarde aanpassing.' };
  const before = structuredClone(original), g = exerciseGuide('historische_eigen_id', original);
  assert.equal(g.name, 'Eigen oefening');
  assert.equal(g.muscle, original.muscles);
  assert.deepEqual(g.steps, [original.movement]);
  assert.equal(g.adjust, original.adjust);
  assert.deepEqual(original, before);
});
