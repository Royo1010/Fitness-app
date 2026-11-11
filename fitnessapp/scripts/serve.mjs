import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };
http.createServer(async (req, res) => {
  try {
    const rawPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (rawPath === '/Fitness-app') { res.writeHead(302, { Location: '/Fitness-app/' }); res.end(); return; }
    const pathname = rawPath.startsWith('/Fitness-app/') ? rawPath.slice('/Fitness-app'.length) : rawPath;
    const file = path.resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!file.startsWith(root) || !(await stat(file)).isFile()) throw new Error('Not found');
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    let body = await readFile(file);
    // Isolated local test clock; never included in the static production files.
    if (process.env.RITME_TEST_DATE && path.extname(file) === '.html') {
      const value = process.env.RITME_TEST_DATE;
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)) throw new Error('Invalid test clock');
      const mock = `<script>const NativeDate=Date;const clockStart=NativeDate.now();const clockBase=NativeDate.parse(${JSON.stringify(value)});Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[clockBase+NativeDate.now()-clockStart]))}static now(){return clockBase+NativeDate.now()-clockStart}};document.title='Ritme TESTKLOK';</script>`;
      body = Buffer.from(body.toString().replace('<script type="module"', mock + '<script type="module"'));
    }
    res.end(body);
  } catch { res.writeHead(404); res.end('Niet gevonden'); }
}).listen(port, '0.0.0.0', () => console.log(`Ritme is gestart: http://localhost:${port}/Fitness-app/\nTelefoon op hetzelfde netwerk: gebruik het lokale IP-adres en poort ${port}. Voor installatie en offlinegebruik: HTTPS.`));
