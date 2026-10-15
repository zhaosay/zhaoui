// A released version is immutable: if v<version> already exists as a GitHub release, the zip built now must be byte-for-byte the one in it
// (same SHA-256), otherwise the site and the release would hand out two different files under one version number.
// Not released yet (no release for this version): passes.  Run after `npm run site`.   Usage: node site/scripts/check-release.mjs
import { readFileSync } from 'node:fs';
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
  console.error(`FAILED [release]: v${version} is already released with a different zip.\n  released ${released}\n  built    ${built}\nAnything inside the zip changed: bump the version in packages/ui/package.json and make a new release instead of changing this one.`);
  process.exit(1);
}
console.log(`ok [release]: the zip built now is identical to the one in release v${version}`);
