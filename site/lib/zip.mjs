// Builds a zip that comes out byte-for-byte the same every time it is built from the same files, so a hash published for it stays valid.
// Fixed timestamps, UTC (zip stores local time), files only (-D) and in sorted order.
import { readdirSync, utimesSync, rmSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);

/** `fill(stageDir)` puts the files into a temporary folder named `top`; the zip contains that folder.  Returns nothing, throws on failure. */
export function makeZip({ top, out, fill }) {
  const base = join(tmpdir(), `zhaoui-zip-${process.pid}-${top}`), stage = join(base, top);
  rmSync(base, { recursive: true, force: true }); mkdirSync(stage, { recursive: true });
  fill(stage);
  const names = walk(stage).map((f) => `${top}/${f.slice(stage.length + 1)}`).sort();
  for (const n of names) utimesSync(join(base, n), new Date('2026-01-01T00:00:00Z'), new Date('2026-01-01T00:00:00Z'));
  mkdirSync(dirname(out), { recursive: true });
  const r = spawnSync('zip', ['-X', '-D', '-q', out, '-@'], { cwd: base, input: names.join('\n') + '\n', env: { ...process.env, TZ: 'UTC' }, encoding: 'utf8' });
  rmSync(base, { recursive: true, force: true });
  if (r.status !== 0) throw new Error('zip failed: ' + (r.stderr || r.error));
}
