import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
process.chdir(fileURLToPath(new URL('../', import.meta.url)));
for (const file of ['dist/app.mjs', 'dist/core.mjs', 'dist/storage.mjs', 'dist/progress.mjs', 'dist/sw.js', 'scripts/serve.mjs']) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
const program = JSON.parse(readFileSync('dist/program.json', 'utf8'));
for (const week of ['1', '2']) {
  if (Object.keys(program.week_programs[week]).length !== 4) throw new Error('Vier trainingen per week vereist');
  for (const [day,specs] of Object.entries(program.week_programs[week])) {
    if (specs.length !== (day === 'upper_a' ? 8 : 7)) throw new Error('Verkeerd aantal v2.2-oefeningen');
    if (specs.reduce((sum,s)=>sum+s.sets,0) !== {upper_a:18,lower_a:16,upper_b:16,lower_b:17}[day]) throw new Error('Verkeerd aantal werksets');
    for (const spec of specs) for (const option of spec.choice_options || [spec]) if (!program.exercises[option.exercise_id]) throw new Error('Oefenbeschrijving ontbreekt');
  }
}
for (const file of ['index.html', 'app.mjs', 'core.mjs', 'progress.mjs', 'storage.mjs', 'styles.css', 'training.css', 'program.json', 'sw.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'standing-calf.svg']) if (!existsSync('dist/' + file)) throw new Error('Ontbrekend appbestand: ' + file);
JSON.parse(readFileSync('dist/manifest.webmanifest', 'utf8'));
console.log('Buildcontrole geslaagd: alle modules, 8 trainingen, alle oefenbeschrijvingen en PWA-assets aanwezig.');
