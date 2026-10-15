// Tests install.sh against the built site: it is served over http on a random port and the script runs with ZHAOUI_BASE pointing at it.
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdtempSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist-site');
let tamper = null;   // a path whose content the server alters, to prove the checksum catches it
const server = createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname).slice(1);
  // what GitHub would serve for a release: /releases/download/v<version>/<file>, the files being the same ones the site builds
  const rel = p.match(/^releases\/download\/v([0-9.]+)\/(.+)$/); const file = rel ? (rel[2] === 'SHA256SUMS' ? 'SHA256SUMS' : `assets/${rel[2]}`) : p;
  let body; try { body = readFileSync(join(dist, file)); } catch { res.writeHead(404).end('nf'); return; }
  if (p === tamper || file === tamper) body = Buffer.concat([body, Buffer.from('\n/* changed in transit */')]);
  res.writeHead(200).end(body);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
let passed = 0, failed = 0;

// async on purpose: the server above lives in this process, so a blocking spawn would starve it
function exec(cmd, args, opts) { return new Promise((resolve) => { const c = spawn(cmd, args, opts); let stdout = '', stderr = ''; c.stdout.on('data', (d) => { stdout += d; }); c.stderr.on('data', (d) => { stderr += d; }); c.on('close', (status) => resolve({ status, stdout, stderr })); }); }
function run(args, cwd, env = {}) { return exec('sh', [join(dist, 'install.sh'), ...args], { cwd, env: { ...process.env, ZHAOUI_BASE: base, ZHAOUI_RELEASES: `${base}/releases/download`, ...env } }); }
async function test(label, fn) {
  const cwd = mkdtempSync(join(tmpdir(), 'zhaoui-install-')); tamper = null;
  try { await fn(cwd); passed++; } catch (e) { failed++; console.log(`FAIL ${label}\n   ${e.message.split('\n').slice(0, 6).join(' | ')}`); } finally { rmSync(cwd, { recursive: true, force: true }); }
}
const same = (a, b) => readFileSync(a).equals(readFileSync(b));

await test('script is valid POSIX sh and has no leftover placeholders', async () => {
  const sh = spawnSync('sh', ['-n', join(dist, 'install.sh')], { encoding: 'utf8' }); assert.equal(sh.status, 0, sh.stderr);
  assert.equal(readFileSync(join(dist, 'install.sh'), 'utf8').includes('@@'), false);
  assert.match(readFileSync(join(dist, 'install.sh'), 'utf8'), /^#!\/bin\/sh/);
});
await test('default: installs the two required files, identical to the site, and prints the tags to add', async (cwd) => {
  const r = await run([], cwd); assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(readdirSync(join(cwd, 'zhaoui')).sort(), ['zhaoui.min.css', 'zhaoui.min.js']);
  assert.ok(same(join(cwd, 'zhaoui/zhaoui.min.css'), join(dist, 'assets/zhaoui/zhaoui.min.css')) && same(join(cwd, 'zhaoui/zhaoui.min.js'), join(dist, 'assets/zhaoui/zhaoui.min.js')));
  assert.match(r.stdout, /<link rel="stylesheet" href="zhaoui\/zhaoui\.min\.css">/); assert.match(r.stdout, /<script src="zhaoui\/zhaoui\.min\.js"><\/script>/);
});
await test('--dir and --with: other folder, extra files, CSS and JS listed in the right order', async (cwd) => {
  const r = await run(['--dir', 'public/vendor/zh', '--with', 'icons,marketing,utilities,glass'], cwd); assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(readdirSync(join(cwd, 'public/vendor/zh')).sort(), ['zhaoui-icons.min.js', 'zhaoui-marketing.min.css', 'zhaoui-style-glass.min.css', 'zhaoui-utilities.min.css', 'zhaoui.min.css', 'zhaoui.min.js']);
  assert.ok(r.stdout.indexOf('zhaoui.min.js"') < r.stdout.indexOf('zhaoui-icons.min.js"'), 'icons script after the core script');
});
await test('an existing file is never overwritten without --force, and nothing else is written', async (cwd) => {
  await run([], cwd); writeFileSync(join(cwd, 'zhaoui/zhaoui.min.css'), 'mine'); 
  const r = await run(['--with', 'icons'], cwd); assert.notEqual(r.status, 0); assert.match(r.stderr, /already exists/);
  assert.equal(readFileSync(join(cwd, 'zhaoui/zhaoui.min.css'), 'utf8'), 'mine'); assert.equal(existsSync(join(cwd, 'zhaoui/zhaoui-icons.min.js')), false, 'no partial install');
  const f = await run(['--force'], cwd); assert.equal(f.status, 0, f.stderr); assert.ok(same(join(cwd, 'zhaoui/zhaoui.min.css'), join(dist, 'assets/zhaoui/zhaoui.min.css')));
});
await test('a file that does not match SHA256SUMS aborts and installs nothing', async (cwd) => {
  tamper = 'assets/zhaoui/zhaoui.min.js'; const r = await run([], cwd);
  assert.notEqual(r.status, 0); assert.match(r.stderr, /checksum mismatch/); assert.equal(existsSync(join(cwd, 'zhaoui')), false, 'the folder is not even created');
});
await test('--all: downloads the zip, which is intact', async (cwd) => {
  const r = await run(['--all'], cwd); assert.equal(r.status, 0, r.stderr);
  const zip = readdirSync(join(cwd, 'zhaoui')); assert.equal(zip.length, 1); assert.match(zip[0], /^zhaoui-\d+\.\d+\.\d+\.zip$/);
  assert.deepEqual([...readFileSync(join(cwd, 'zhaoui', zip[0])).subarray(0, 4)], [0x50, 0x4b, 0x03, 0x04]); assert.match(r.stdout, /unzip /);
});
const version = readFileSync(join(dist, 'SHA256SUMS'), 'utf8').match(/assets\/zhaoui-([0-9.]+)\.zip/)[1];
await test('--version: installs that version\'s zip from the release, checked against the release\'s own SHA256SUMS', async (cwd) => {
  const r = await run(['--version', version], cwd); assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(readdirSync(join(cwd, 'zhaoui')), [`zhaoui-${version}.zip`]); assert.ok(same(join(cwd, 'zhaoui', `zhaoui-${version}.zip`), join(dist, `assets/zhaoui-${version}.zip`)));
});
await test('--version does not trust the site: a tampered copy on the site is ignored, a tampered release is refused', async (cwd) => {
  tamper = `assets/zhaoui-${version}.zip`; const bad = await run(['--version', version], cwd);   // the server alters this path for the site and for the release alike
  assert.notEqual(bad.status, 0); assert.match(bad.stderr, /checksum mismatch/); assert.equal(existsSync(join(cwd, 'zhaoui')), false);
  tamper = null;
  const ok = await run(['--version', version], cwd, { ZHAOUI_BASE: 'http://127.0.0.1:9' }); assert.equal(ok.status, 0, 'the site is not needed at all: ' + ok.stderr);
});
await test('--version: an unknown version and a malformed one fail without writing', async (cwd) => {
  for (const v of ['9.9.9', 'abc', '1..2', '.1', '1.']) { const r = await run(['--version', v], cwd); assert.notEqual(r.status, 0, v); assert.equal(existsSync(join(cwd, 'zhaoui')), false, v); }
  assert.notEqual((await run(['--version'], cwd)).status, 0, 'missing value');
});
await test('bad input: unknown option, unknown --with name, missing value all fail without writing; --help works', async (cwd) => {
  for (const a of [['--nope'], ['--with', 'foo'], ['--dir'], ['--with']]) { const r = await run(a, cwd); assert.notEqual(r.status, 0, a.join(' ')); assert.equal(existsSync(join(cwd, 'zhaoui')), false, a.join(' ')); }
  const h = await run(['--help'], cwd); assert.equal(h.status, 0); assert.match(h.stdout, /Usage:/);
});
await test('an unreachable site fails with a clear message', async (cwd) => {
  const r = await run([], cwd, { ZHAOUI_BASE: 'http://127.0.0.1:9' });
  assert.notEqual(r.status, 0); assert.match(r.stderr, /cannot download/); assert.equal(existsSync(join(cwd, 'zhaoui')), false);
});
await test('SHA256SUMS: every listed file exists and its hash is right (same format as sha256sum -c)', async () => {
  const lines = readFileSync(join(dist, 'SHA256SUMS'), 'utf8').trim().split('\n'); assert.ok(lines.length >= 10);
  const c = await exec('sh', ['-c', 'if command -v sha256sum >/dev/null; then sha256sum -c SHA256SUMS; else shasum -a 256 -c SHA256SUMS; fi'], { cwd: dist }); assert.equal(c.status, 0, c.stdout + c.stderr);
});

server.close();
console.log(failed ? `FAILED [install]: ${passed} passed, ${failed} failed` : `ok [install]: ${passed} passed, 0 failed`);
process.exit(failed ? 1 : 0);
