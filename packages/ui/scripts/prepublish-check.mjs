// Runs as `prepublishOnly`. Refuses to publish while the decisions in RELEASING.md are still open, then re-verifies the package.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
const problems = [];
if (pkg.license === 'UNLICENSED') problems.push('license is still UNLICENSED: decide the license first (see RELEASING.md).');
if (pkg.private) problems.push('package.json has "private": true (see RELEASING.md).');
if (!pkg.repository) problems.push('no "repository" field yet (see RELEASING.md).');
if (problems.length) { console.error('Not ready to publish:\n - ' + problems.join('\n - ')); process.exit(1); }
execFileSync('node', ['scripts/build.mjs'], { cwd: pkgDir, stdio: 'inherit' });
execFileSync('node', ['scripts/verify-pack.mjs'], { cwd: pkgDir, stdio: 'inherit' });
