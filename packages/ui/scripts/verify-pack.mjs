// Packs the package for real and checks it the way a consumer would meet it:
//   contents -> install into a clean project -> Node import (CJS and ESM, no window) -> bundler -> plain HTML page -> TypeScript.
import { execFileSync } from 'node:child_process';
import { loadPlaywright, launch, fileUrl } from '../test/env.mjs';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
const work = mkdtempSync(join(tmpdir(), 'zhaoui-pack-'));
const run = (cmd, args, opts = {}) => execFileSync(process.platform === 'win32' && cmd === 'npm' ? 'npm.cmd' : cmd, args, { shell: process.platform === 'win32', encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
let steps = 0;
const ok = (msg) => { steps++; console.log('  ok  ' + msg); };

// 1. pack
const packed = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', work], { cwd: pkgDir }))[0];
const files = packed.files.map((f) => f.path), tarball = join(work, packed.filename);
console.log(`packed ${packed.filename}: ${files.length} files, ${(packed.size / 1024).toFixed(0)} KB (unpacked ${(packed.unpackedSize / 1024).toFixed(0)} KB)`);

// 2. contents
const required = ['package.json', 'README.md', 'CHANGELOG.md', 'THIRD_PARTY_NOTICES.md', 'types/index.d.ts',
  'dist/zhaoui.css', 'dist/zhaoui.min.css', 'dist/zhaoui.js', 'dist/zhaoui.min.js', 'dist/zhaoui.min.js.map', 'dist/zhaoui-icons.js', 'dist/zhaoui-style-glass.css',
  ...['core', 'select', 'date'].flatMap((n) => [`dist/modular/${n}.js`, `dist/modular/${n}.min.js`, `dist/modular/${n}.css`, `dist/modular/${n}.min.css`]),
  'dist/modular/brand.js', 'dist/modular/brand.min.js', 'docs/quickstart.md', 'docs/components.json', 'docs/llms.txt', 'skills/zhaoui/SKILL.md', 'skills/zhaoui/references/components.md'];
for (const f of required) assert.ok(files.includes(f), 'missing from the package: ' + f);
for (const f of files) assert.ok(!/^(src|scripts|test|node_modules)\//.test(f) && !/generated\.html$|\.DS_Store$/.test(f), 'should not be shipped: ' + f);
ok(`contains all ${required.length} required files and nothing from src/scripts/test`);
const flat = (t) => typeof t === 'string' ? [t] : Object.values(t).flatMap(flat);
const targets = flat(pkg.exports).filter((t) => !t.includes('*'));
for (const t of targets) assert.ok(files.includes(t.replace(/^\.\//, '')), 'exports points at a file that is not shipped: ' + t);
for (const k of ['main', 'style', 'unpkg', 'jsdelivr', 'types']) assert.ok(files.includes(pkg[k].replace(/^\.\//, '')), `${k} points at a missing file`);
ok(`all ${targets.length} export targets and main/style/unpkg/jsdelivr/types exist in the tarball`);

// 3. install into a clean project
const proj = join(work, 'consumer'); mkdirSync(proj);
writeFileSync(join(proj, 'package.json'), JSON.stringify({ name: 'consumer', version: '1.0.0', private: true }));
run('npm', ['install', '--no-audit', '--no-fund', '--ignore-scripts', tarball], { cwd: proj });
const inst = join(proj, 'node_modules', '@zhaoui', 'ui');
assert.ok(existsSync(join(inst, 'dist', 'zhaoui.min.js')));
for (const f of readdirSync(join(inst, 'dist'), { recursive: true }).filter((f) => /\.(js|css|map|md|json|txt|ts)$/.test(f)))
  assert.ok(!/\/Users\/|\/private\/tmp|\/home\/|[A-Za-z]:\\{1,2}(Users|Documents and Settings)/i.test(readFileSync(join(inst, 'dist', f), 'utf8')), 'a local absolute path leaked into dist/' + f);
ok('installs into a clean project; no local absolute paths inside dist/');

// 4. Node, as a server would import it
const req = createRequire(join(proj, 'x.js'));
assert.equal(typeof req.resolve('@zhaoui/ui/zhaoui.min.css'), 'string'); assert.equal(typeof req.resolve('@zhaoui/ui/modular/core.min.js'), 'string');
req('@zhaoui/ui'); req('@zhaoui/ui/zhaoui.min.js'); req('@zhaoui/ui/modular/core.min.js'); req('@zhaoui/ui/modular/select.min.js');
run('node', ['--input-type=module', '-e', "await import('@zhaoui/ui'); await import('@zhaoui/ui/modular/date.min.js');"], { cwd: proj });
ok('require() and import() work on a server (no window/document), subpath exports resolve');

// 5. bundler consumer
const esbuild = (await import('esbuild')).default;
writeFileSync(join(proj, 'entry.js'), "import '@zhaoui/ui/zhaoui.min.css';\nimport '@zhaoui/ui';\nwindow.__bundled = typeof ZhaoUI;\n");
await esbuild.build({ entryPoints: [join(proj, 'entry.js')], bundle: true, outdir: join(proj, 'out'), absWorkingDir: proj, minify: true, logLevel: 'silent' });
assert.ok(existsSync(join(proj, 'out', 'entry.js')) && existsSync(join(proj, 'out', 'entry.css')), 'bundler produced js and css');
ok('a bundler resolves "@zhaoui/ui" and "@zhaoui/ui/zhaoui.min.css" from the installed package');

// 6. real pages in a browser
const pw = loadPlaywright();
const browser = await launch(pw, 'chromium');
const BODY = `<button class="zh-btn primary" id="o" data-zh-open="#dlg">打开</button>
<dialog class="zh-modal" id="dlg" aria-labelledby="t"><header id="t">你好</header><div class="body">内容</div><footer><button class="zh-btn" data-zh-close id="c">关闭</button></footer></dialog>
<select id="s" data-zh-select><option value="">请选择</option><option value="1">一</option></select><div id="dp" data-zh-date data-value="2026-10-15" aria-label="日期"></div>
<div class="zh-progress" id="pg" data-value="40" data-name="进度"></div>`;
const drop = `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="node_modules/@zhaoui/ui/dist/zhaoui.min.css">${BODY}<script src="node_modules/@zhaoui/ui/dist/zhaoui.min.js"></script>`;
const bundled = `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="out/entry.css">${BODY}<script src="out/entry.js"></script>`;
writeFileSync(join(proj, 'drop.html'), drop); writeFileSync(join(proj, 'bundled.html'), bundled);
for (const [name, file] of [['plain <script>/<link> from node_modules', 'drop.html'], ['bundled with esbuild', 'bundled.html']]) {
  const page = await browser.newPage(), errs = [];
  page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(fileUrl(join(proj, file))); await page.waitForTimeout(400);
  await page.click('#o'); assert.equal(await page.evaluate(() => document.getElementById('dlg').open), true, name + ': dialog opens'); await page.click('#c');
  const r = await page.evaluate(() => ({ v: ZhaoUI.version, sel: document.querySelectorAll('#s + .zh-sel').length, date: document.querySelectorAll('#dp input[role="combobox"]').length, pg: document.getElementById('pg').getAttribute('aria-valuenow'), bg: getComputedStyle(document.getElementById('o')).backgroundColor }));
  assert.deepEqual([r.v, r.sel, r.date, r.pg], [pkg.version, 1, 1, '40'], name + ': ' + JSON.stringify(r)); assert.match(r.bg, /rgb\(88, 104, 238\)/, name + ': css applied');
  assert.deepEqual(errs, [], name + ': page errors');
  await page.close();
}
await browser.close();
ok('a plain HTML page and a bundled page both work: dialog, select, date picker, progress, styles, version');

// 7. TypeScript consumer
const tsc = join(dirname(createRequire(join(pkgDir, 'x.js')).resolve('typescript/package.json')), 'bin', 'tsc');
writeFileSync(join(proj, 'usage.ts'), "import '@zhaoui/ui';\nZhaoUI.message('hi', { type: 'success' });\nconst p: Promise<boolean> = ZhaoUI.dialog({ title: 't' });\ndocument.addEventListener('zh:page-change', (e) => console.log(e.detail.page));\nvoid p;\n// @ts-expect-error not a valid message type\nZhaoUI.message('x', { type: 'nope' });\n");
run('node', [tsc, '--noEmit', '--strict', '--module', 'esnext', '--moduleResolution', 'bundler', '--target', 'es2020', '--lib', 'es2020,dom', 'usage.ts'], { cwd: proj });
ok('TypeScript finds the types through the package exports and checks a real usage file');

console.log(`\nverify-pack: ${steps} checks passed  (${tarball})`);
