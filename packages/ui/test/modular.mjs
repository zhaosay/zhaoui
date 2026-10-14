// Modular builds: dist/modular/{core,select,date,brand}. Checks that a page loads only what it needs, that a file loaded late wires itself,
// that loading order mistakes fail loudly, and that the modular files behave like the full build.
import { loadPlaywright, launch as launchEngine, fileUrl } from './env.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const pw = loadPlaywright();
const HERE = dirname(fileURLToPath(import.meta.url));
const ENGINE = process.env.ENGINE || (process.argv.find((a) => a.startsWith('--engine=')) || '').slice(9) || 'chromium', SUFFIX = process.env.VARIANT === 'min' || process.argv.includes('--min') ? '.min' : '';
const launch = () => launchEngine(pw, ENGINE);
const M = (f) => `../dist/modular/${f}${SUFFIX}`;
const BODY = `
<button class="zh-btn" id="open" data-zh-open="#dlg">打开</button>
<dialog class="zh-modal" id="dlg" aria-labelledby="dt"><header id="dt">标题</header><div class="body">内容</div><footer><button class="zh-btn" data-zh-close id="close">关闭</button></footer></dialog>
<button class="zh-btn" id="dd" data-zh-dropdown="#menu">菜单</button><ul class="zh-menu" id="menu" hidden><li><a href="#" data-value="a">甲</a></li><li><a href="#" data-value="b">乙</a></li></ul>
<div class="zh-progress" id="pg" data-value="30" data-name="进度"></div>
<select id="sel" data-zh-select><option value="">请选择</option><option value="1">一</option><option value="2">二</option></select>
<div id="dp" data-zh-date data-value="2026-10-15" aria-label="日期"></div>`;
function page(name, head, tail = '') {
  const file = join(HERE, `${name}.generated.html`);
  writeFileSync(file, `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">${head}</head><body>${BODY}${tail}</body></html>`);
  return fileUrl(file);
}
const CORE_CSS = `<link rel="stylesheet" href="${M('core')}.css">`, CORE_JS = `<script src="${M('core')}.js"></script>`;
const url = {
  core: page('modular-core', CORE_CSS, CORE_JS),
  late: page('modular-late', CORE_CSS, CORE_JS),
  all: page('modular-all', CORE_CSS + `<link rel="stylesheet" href="${M('select')}.css"><link rel="stylesheet" href="${M('date')}.css">`, CORE_JS + `<script src="${M('select')}.js"></script><script src="${M('date')}.js"></script><script src="${M('brand')}.js"></script>`),
  brandFirst: page('modular-brand-first', CORE_CSS, `<script src="${M('brand')}.js"></script>` + CORE_JS),
  wrongOrder: page('modular-wrong-order', CORE_CSS, `<script src="${M('select')}.js"></script>` + CORE_JS),
};
let failed = 0, passed = 0;
const b = await launch();
const wait = (p, ms = 250) => p.waitForTimeout(ms);
async function test(label, u, fn, opts = {}) {
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
  p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') p.errs.push('console: ' + m.text()); });
  try { await p.goto(u); await wait(p, 300); await fn(p); if (!opts.expectErrors) assert.deepEqual(p.errs, [], 'page errors'); passed++; }
  catch (e) { failed++; console.log(`FAIL ${label}\n   ${e.message.split('\n').slice(0, 4).join(' | ')}`); }
  await p.close();
}
const inject = (p, kind, href) => p.evaluate(([kind, href]) => new Promise((res, rej) => {
  const el = document.createElement(kind === 'css' ? 'link' : 'script'); if (kind === 'css') { el.rel = 'stylesheet'; el.href = href; } else el.src = href;
  el.onload = res; el.onerror = () => rej(new Error('failed to load ' + href)); document.head.appendChild(el);
}), [kind, href]);

await test('core only: light components work, heavy ones are simply not there, and it says so clearly', url.core, async (p) => {
  assert.equal(await p.evaluate(() => typeof ZhaoUI.dialog), 'function');
  await p.click('#open'); assert.equal(await p.evaluate(() => document.getElementById('dlg').open), true); await p.click('#close');
  assert.equal(await p.evaluate(() => document.querySelector('#pg').getAttribute('aria-valuenow')), '30', 'progress is core');
  await p.click('#dd'); await wait(p, 300);
  const look = await p.evaluate(() => { const b = document.querySelector('.zh-pop.is-open .zh-pop-body'); const c = getComputedStyle(b); return [getComputedStyle(document.querySelector('.zh-pop.is-open')).position, c.boxShadow !== 'none', c.backgroundColor !== 'rgba(0, 0, 0, 0)']; });
  assert.deepEqual(look, ['fixed', true, true], 'dropdown popover is styled with core CSS alone');
  assert.deepEqual(await p.evaluate(() => [document.querySelectorAll('.zh-sel').length, document.getElementById('sel').classList.contains('zh-sel-native'), document.querySelectorAll('#dp .zh-dp-day, #dp input').length]), [0, false, 0], 'select and date are not touched without their files');
  assert.equal(await p.evaluate(() => typeof ZhaoUI.select + typeof ZhaoUI.datePicker), 'undefinedundefined');
  const msg = await p.evaluate(() => { try { ZhaoUI.setBrand('#00857f'); return 'no error'; } catch (e) { return e.message; } });
  assert.match(msg, /zhaoui-brand\.js/, 'setBrand without the runtime explains what to load');
});

// ---------- the four heavier extras: upload, tree, chart, command palette ----------
const EXTRA_BODY = `<div id="x-tree" class="zh-tree" data-zh-tree data-checkable aria-label="树"><ul><li data-id="a" data-open>甲<ul><li data-id="b">乙</li></ul></li></ul></div>
<div id="x-up" class="zh-upload" data-zh-upload data-max="2"></div>
<div id="x-ch" data-zh-chart data-type="line"><script type="application/json">{"labels":["a","b"],"series":[{"name":"s","data":[1,2]}]}</script></div>`;
await test('core only: tree, upload, chart and the command palette are absent and leave their markup alone', url.core, async (p) => {
  await p.evaluate((h) => { const d = document.createElement('div'); d.innerHTML = h; document.body.appendChild(d); }, EXTRA_BODY); await wait(p, 200);
  assert.equal(await p.evaluate(() => [typeof ZhaoUI.tree, typeof ZhaoUI.upload, typeof ZhaoUI.chart, typeof ZhaoUI.commandPalette].join()), 'undefined,undefined,undefined,undefined');
  assert.deepEqual(await p.evaluate(() => [document.querySelectorAll('#x-tree .zh-tree-row').length, document.querySelectorAll('#x-up .zh-upload-drop').length, document.querySelectorAll('#x-ch svg').length]), [0, 0, 0], 'nothing is half-built');
});
await test('each extra loaded late (JS and CSS) wires the markup that is already on the page', url.late, async (p) => {
  await p.evaluate((h) => { const d = document.createElement('div'); d.innerHTML = h; document.body.appendChild(d); }, EXTRA_BODY); await wait(p, 100);
  for (const g of ['tree', 'upload', 'chart', 'command']) { await inject(p, 'css', M(g) + '.css'); await inject(p, 'js', M(g) + '.js'); }
  await wait(p, 300);
  assert.deepEqual(await p.evaluate(() => [document.querySelectorAll('#x-tree .zh-tree-row').length, !!document.querySelector('#x-up .zh-upload-drop'), document.querySelectorAll('#x-ch svg').length, typeof ZhaoUI.commandPalette, typeof ZhaoUI.tree.checked]), [2, true, 1, 'function', 'function']);
  assert.equal(await p.evaluate(() => getComputedStyle(document.querySelector('#x-tree .zh-tree-row')).display), 'flex', 'the tree CSS arrived with its module');
  assert.notEqual(await p.evaluate(() => getComputedStyle(document.querySelector('#x-up .zh-upload-drop')).borderStyle), 'none', 'the upload CSS arrived with its module');
  const pal = await p.evaluate(() => { const c = ZhaoUI.commandPalette({ commands: [{ id: 'x', label: '测试', group: '组' }] }); c.open(); return [document.querySelector('dialog.zh-cmd').open, getComputedStyle(document.querySelector('.zh-cmd-item')).display !== 'inline']; });
  assert.deepEqual(pal, [true, true], 'the command palette opens and is styled by command.css');
});

await test('select.js loaded after the page is ready wires the existing <select> by itself', url.late, async (p) => {
  await inject(p, 'css', M('select') + '.css'); await inject(p, 'js', M('select') + '.js'); await wait(p, 200);
  assert.equal(await p.locator('#sel + .zh-sel').count(), 1, 'enhanced after a late load');
  await p.click('#sel + .zh-sel .zh-sel-trigger'); await wait(p, 300); await p.click('.zh-sel-opt >> nth=1'); await wait(p, 200);
  assert.equal(await p.evaluate(() => document.getElementById('sel').value), '2');
  assert.equal(await p.locator('#dp input').count(), 0, 'date is still not loaded');
});
await test('date.js loaded late wires the date picker; message from core is reused', url.late, async (p) => {
  await inject(p, 'css', M('date') + '.css'); await inject(p, 'js', M('date') + '.js'); await wait(p, 200);
  assert.equal(await p.locator('#dp input[role="combobox"]').count(), 1);
  await p.click('#dp input'); await wait(p, 300); await p.click('.zh-dp-day[data-d="2026-10-20"]'); await wait(p, 300);
  assert.equal(await p.evaluate(() => document.querySelector('#dp input').value), '2026-10-20');
});
await test('brand.js loaded late merges into the existing ZhaoUI object and setBrand then works', url.late, async (p) => {
  await p.evaluate(() => { window.__same = window.ZhaoUI; });
  await inject(p, 'js', M('brand') + '.js');
  assert.deepEqual(await p.evaluate(() => [window.ZhaoUI === window.__same, typeof ZhaoUI.applyBrand, typeof ZhaoUI.dialog, typeof ZhaoUI.brands]), [true, 'function', 'function', 'object'], 'same object, both halves present');
  const before = await p.evaluate(() => getComputedStyle(document.getElementById('open')).borderTopColor);
  await p.evaluate(() => ZhaoUI.setBrand('#00857f'));
  assert.equal(await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--zh-color-primary').trim().length > 0), true);
});
await test('brand.js before core.js also works (order between the two does not matter)', url.brandFirst, async (p) => {
  assert.deepEqual(await p.evaluate(() => [typeof ZhaoUI.applyBrand, typeof ZhaoUI.dialog, typeof ZhaoUI.init]), ['function', 'function', 'function']);
  await p.evaluate(() => ZhaoUI.setBrand('#e56636'));
});
await test('everything loaded in the recommended order behaves like the full build', url.all, async (p) => {
  assert.equal(await p.locator('#sel + .zh-sel').count(), 1); assert.equal(await p.locator('#dp input[role="combobox"]').count(), 1);
  await p.evaluate(() => ZhaoUI.setBrand('#00857f')); await p.evaluate(() => ZhaoUI.message('ok', { duration: 0 })); assert.equal(await p.locator('.zh-message').count(), 1);
  await p.click('#sel + .zh-sel .zh-sel-trigger'); await wait(p, 300); assert.equal(await p.locator('.zh-sel-list [role="option"]').count(), 2, 'placeholder option is not a choice');
});
await test('an add-on loaded before core fails with a clear message instead of a mystery', url.wrongOrder, async (p) => {
  assert.ok(p.errs.some((e) => /load modular\/core\.js/.test(e)), 'error tells you to load core first, got: ' + JSON.stringify(p.errs));
  assert.equal(await p.evaluate(() => typeof ZhaoUI.dialog), 'function', 'core still loads fine afterwards');
}, { expectErrors: true });

await b.close();
console.log(`${failed ? 'FAILED' : 'ok'} [modular ${ENGINE}${SUFFIX}]: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
