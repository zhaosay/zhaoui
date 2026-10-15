// Builds a zip that comes out byte for byte the same on every machine, so a hash published for it stays valid wherever it is rebuilt (a laptop, CI on
// Linux, CI on Windows).  Two things used to differ between machines: the `zip` program (Windows has none) and the deflate of Node's own zlib, which
// changes between Node versions.  fflate is plain JavaScript, so its output depends on nothing but its version, which package.json pins.
// Fixed timestamps (built from local-time parts, because the zip format stores local time), files only, sorted names, Unix attributes 0644.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { zipSync } from 'fflate';

const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);

/** `fill(stageDir)` puts the files into a temporary folder; the zip contains them inside a folder called `top`.  Throws on failure. */
export function makeZip({ top, out, fill }) {
  const stage = mkdtempSync(join(tmpdir(), `zhaoui-zip-${top}-`));
  try {
    fill(stage);
    const mtime = new Date(2026, 0, 1, 0, 0, 0);
    const names = walk(stage).map((f) => f.slice(stage.length + 1).split('\\').join('/')).sort();
    const files = {};
    for (const n of names) files[`${top}/${n}`] = [new Uint8Array(readFileSync(join(stage, ...n.split('/')))), { level: 9, mtime, os: 3, attrs: 0o100644 << 16 }];
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, zipSync(files));
  } finally { rmSync(stage, { recursive: true, force: true }); }
}
