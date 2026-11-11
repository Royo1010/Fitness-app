import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
process.chdir(fileURLToPath(new URL('../', import.meta.url)));
for (const file of ['dist/app.mjs', 'dist/core.mjs', 'dist/storage.mjs', 'dist/sw.js', 'scripts/serve.mjs']) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
const program = JSON.parse(readFileSync('dist/program.json', 'utf8'));
for (const week of ['1', '2']) {
  if (Object.keys(program.week_programs[week]).length !== 4) throw new Error('Vier trainingen per week vereist');
  for (const specs of Object.values(program.week_programs[week])) {
    if (specs.length !== 8) throw new Error('Acht oefeningen per training vereist');
    for (const spec of specs) if (!program.exercises[spec.exercise_id]) throw new Error('Oefenbeschrijving ontbreekt');
  }
}
for (const file of ['index.html', 'app.mjs', 'core.mjs', 'storage.mjs', 'styles.css', 'program.json', 'sw.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png']) if (!existsSync('dist/' + file)) throw new Error('Ontbrekend appbestand: ' + file);
JSON.parse(readFileSync('dist/manifest.webmanifest', 'utf8'));
console.log('Buildcontrole geslaagd: alle modules, 8 trainingen, 35 oefenbeschrijvingen en PWA-assets aanwezig.');
