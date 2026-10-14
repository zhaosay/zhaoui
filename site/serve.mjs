// Local preview: serves site/dist-site at http://localhost:4173/ and rebuilds when the site sources change.
//   node site/serve.mjs [port]      add --no-watch to only serve
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, watch } from 'node:fs';
import { join, extname, normalize, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url)), dir = join(here, 'dist-site'), port = +(process.argv.find((a) => /^\d+$/.test(a)) || 4173);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.svg': 'image/svg+xml' };
createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname) || '/';
  let f = normalize(join(dir, p)); if (!f.startsWith(dir)) { res.writeHead(403).end(); return; }
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { res.writeHead(404, { 'content-type': TYPES['.html'] }).end(existsSync(join(dir, '404.html')) ? readFileSync(join(dir, '404.html')) : 'not found'); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }).end(readFileSync(f));
}).listen(port, () => console.log(`preview: http://localhost:${port}/`));

if (!process.argv.includes('--no-watch')) {
  let t = null, busy = false;
  const rebuild = () => { clearTimeout(t); t = setTimeout(() => { if (busy) return; busy = true; const c = spawn(process.execPath, [join(here, 'build.mjs')], { stdio: 'inherit' }); c.on('exit', () => { busy = false; }); }, 300); };
  for (const d of ['lib', 'assets', 'content', '../packages/ui/docs']) { const f = resolve(here, d); if (existsSync(f)) watch(f, { recursive: true }, rebuild); }
  watch(join(here, 'build.mjs'), rebuild); watch(join(here, 'config.mjs'), rebuild);
}
