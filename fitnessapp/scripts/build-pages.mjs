import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// dist is de broncode van deze statische app; bouw alleen in een aparte map.
export async function buildPages(source, output, revision = null) {
  source = path.resolve(source);
  output = path.resolve(output);
  if (source === output || source.startsWith(output + path.sep) || output.startsWith(source + path.sep)) {
    throw new Error('Bron en uitvoermap moeten gescheiden zijn');
  }
  const files = (await readdir(source, { recursive: true, withFileTypes: true })).filter(entry => entry.isFile()).map(entry => path.relative(source, path.join(entry.parentPath, entry.name))).sort();
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(file + '\0');
    hash.update(await readFile(path.join(source, file)));
  }
  const contentHash = hash.digest('hex');
  const worker = await readFile(path.join(source, 'sw.js'), 'utf8');
  const cacheLine = /^const CACHE = PREFIX \+ '[^']+';$/m;
  if (!cacheLine.test(worker)) throw new Error('Onbekend serviceworker-cacheformaat');
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await cp(source, output, { recursive: true });
  await writeFile(path.join(output, 'sw.js'), worker.replace(cacheLine, `const CACHE = PREFIX + 'build-${contentHash}';`));
  await writeFile(path.join(output, '.nojekyll'), '');
  await writeFile(path.join(output, 'release.json'), JSON.stringify({ version: JSON.parse(await readFile(new URL('../package.json', import.meta.url))).version, commit: revision, contentHash }, null, 2) + '\n');
  return contentHash;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const project = fileURLToPath(new URL('../', import.meta.url));
  const hash = await buildPages(path.join(project, 'dist'), path.join(project, '.pages-dist'), process.env.GITHUB_SHA || null);
  console.log(`Pages-artifact klaar: .pages-dist (inhoud ${hash})`);
}
