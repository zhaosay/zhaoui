// Runs the browser tests for every engine and for both the full and the minified files, one after another (they share dist/, so never in parallel,
// and never while a build is running).  Usage: node test/matrix.mjs [chromium firefox webkit]
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
const engines = process.argv.slice(2).length ? process.argv.slice(2) : ['chromium', 'firefox', 'webkit'];
let bad = 0;
for (const e of engines) for (const [file, args] of [['smoke.mjs', []], ['smoke.mjs', ['--min']], ['modular.mjs', []]]) {
  const r = spawnSync(process.execPath, [join(here, file), `--engine=${e}`, ...args], { encoding: 'utf8' });
  const out = ((r.stdout || '') + (r.stderr || '')).trim().split('\n').filter(Boolean);
  const last = out.filter((l) => /^(ok|FAILED)/.test(l)).slice(-2).join('\n') || out.slice(-3).join('\n');
  console.log(last); if (r.status !== 0) { bad++; console.log(out.slice(-12).join('\n')); }
}
{ const r = spawnSync(process.execPath, [join(here, 'a11y.mjs')], { encoding: 'utf8' }); console.log((r.stdout || '').trim()); if (r.status !== 0) { bad++; console.log((r.stderr || '').trim()); } }
process.exit(bad ? 1 : 0);
