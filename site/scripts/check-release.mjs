// A released version is immutable: if v<version> already exists as a GitHub release, the zip built now must be byte-for-byte the one in it
// (same SHA-256), otherwise the site and the release would hand out two different files under one version number.
// Not released yet (no release for this version): passes.  Run after `npm run site`.   Usage: node site/scripts/check-release.mjs
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE } from '../config.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const version = JSON.parse(readFileSync(join(root, 'packages', 'ui', 'package.json'), 'utf8')).version;
const line = (text) => (text.split('\n').find((l) => l.endsWith(`  assets/zhaoui-${version}.zip`)) || '').split(/\s+/)[0];
const built = line(readFileSync(join(root, 'site', 'dist-site', 'SHA256SUMS'), 'utf8'));
if (!built) { console.error(`FAILED [release]: no zip for ${version} in site/dist-site/SHA256SUMS (run npm run site first)`); process.exit(1); }

let res;
try { res = await fetch(`${SITE.repo}/releases/download/v${version}/SHA256SUMS`, { redirect: 'follow' }); }
catch (e) { console.log(`skip [release]: cannot reach GitHub (${e.cause?.code || e.message})`); process.exit(process.env.CI ? 1 : 0); }
if (res.status === 404) { console.log(`ok [release]: v${version} is not released yet, nothing to compare`); process.exit(0); }
if (!res.ok) { console.error(`FAILED [release]: GitHub answered ${res.status}`); process.exit(1); }
const released = line(await res.text());
if (released !== built) {
  console.error(await explain());
  console.error(`FAILED [release]: v${version} is already released with a different zip.\n  released ${released}\n  built    ${built}\nAnything inside the zip changed: bump the version in packages/ui/package.json and make a new release instead of changing this one.`);
  process.exit(1);
}
console.log(`ok [release]: the zip built now is identical to the one in release v${version}`);

// Which entries of the two zips differ (name, size, method, CRC, permissions, time)?  Printed on a mismatch, so a failing CI run says what to look at.
async function explain() {
  const dir = mkdtempSync(join(tmpdir(), 'zh-rel-'));
  try {
    const r = await fetch(`${SITE.repo}/releases/download/v${version}/zhaoui-${version}.zip`, { redirect: 'follow' });
    writeFileSync(join(dir, 'released.zip'), Buffer.from(await r.arrayBuffer()));
    const list = (f) => new Map(spawnSync('unzip', ['-Z', f], { encoding: 'utf8' }).stdout.split('\n').filter((l) => /^[-d][rwx-]{9}/.test(l)).map((l) => [l.split(/\s+/).pop(), l.replace(/\s+/g, ' ')]));
    const a = list(join(dir, 'released.zip')), b = list(join(root, 'site', 'dist-site', 'assets', `zhaoui-${version}.zip`));
    const out = [];
    for (const [n, l] of a) if (!b.has(n)) out.push(`only in the release: ${n}`); else if (b.get(n) !== l) out.push(`differs: ${n}\n    release ${l}\n    built   ${b.get(n)}`);
    for (const n of b.keys()) if (!a.has(n)) out.push(`only in the build: ${n}`);
    const z = (f) => spawnSync('unzip', ['-v', f], { encoding: 'utf8' }).stdout.split('\n').filter((l) => /[0-9a-f]{8}\s+\S+$/.test(l)).map((l) => l.trim().split(/\s+/)).map((c) => [c[c.length - 1], c[c.length - 2]]);
    const crcA = new Map(z(join(dir, 'released.zip'))), crcB = new Map(z(join(root, 'site', 'dist-site', 'assets', `zhaoui-${version}.zip`)));
    for (const [n, c] of crcA) if (crcB.has(n) && crcB.get(n) !== c) out.push(`content differs (CRC ${c} vs ${crcB.get(n)}): ${n}`);
    return out.length ? 'Entries that differ:\n  ' + out.slice(0, 40).join('\n  ') : 'The two zips list the same entries with the same sizes, CRCs and attributes: the difference is in the zip container itself (headers, extra fields).';
  } catch (e) { return 'could not compare the entries: ' + e.message; } finally { rmSync(dir, { recursive: true, force: true }); }
}
