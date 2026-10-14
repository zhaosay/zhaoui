// node demo/fragments/44-tree/test.mjs  — interaction tests for the tree in Chromium, Firefox and WebKit
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium, firefox, webkit } = createRequire('/tmp/pw/')('playwright');
const OUT = '/tmp/zh-tree-test.html';
execFileSync('node', [new URL('../../build.mjs', import.meta.url).pathname, '--out', OUT, '--only', '00-core,44-tree']);

const rowsOf = (p, id) => p.locator(`#${id} .zh-tree-row`);
const labels = async (p, id) => (await rowsOf(p, id).locator('.zh-tree-label').allTextContents()).map((s) => s.trim());
const focusedLabel = (p) => p.evaluate(() => document.activeElement.querySelector('.zh-tree-label').textContent.trim());
let bad = 0;
for (const [name, eng] of Object.entries(process.env.TLT_ONLY ? { [process.env.TLT_ONLY]: { chromium, firefox, webkit }[process.env.TLT_ONLY] } : { chromium, firefox, webkit })) {
  const b = await eng.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + OUT + '?only=tree'); await p.waitForTimeout(400);
  const step = async (label, fn) => { try { await fn(); } catch (e) { bad++; console.log('  FAIL', name, label, '-', String(e.message).split('\n').slice(0, 5).join(' | ')); } };

  await step('aria structure', async () => {
    assert.equal(await p.locator('#zhTreeBasic').getAttribute('role'), 'tree');
    const r = rowsOf(p, 'zhTreeBasic'); const n = await r.count();
    assert.ok(n >= 8, 'rows ' + n);
    for (let i = 0; i < n; i++) { const el = r.nth(i); for (const a of ['aria-level', 'aria-setsize', 'aria-posinset']) assert.ok(await el.getAttribute(a), a); }
    assert.equal(await p.locator('#zhTreeBasic .zh-tree-row[tabindex="0"]').count(), 1, 'exactly one tab stop');
    assert.equal(await r.first().getAttribute('aria-expanded'), 'true');
    assert.equal(await r.first().getAttribute('aria-checked'), 'mixed');
  });

  await step('keyboard navigation', async () => {
    await p.locator('#zhTreeBasic .zh-tree-row').first().focus();
    await p.keyboard.press('ArrowDown'); assert.equal(await focusedLabel(p), '设计系统');
    await p.keyboard.press('ArrowLeft');
    assert.equal(await p.evaluate(() => document.activeElement.getAttribute('aria-expanded')), 'false');
    await p.keyboard.press('ArrowRight'); assert.equal(await p.evaluate(() => document.activeElement.getAttribute('aria-expanded')), 'true');
    await p.keyboard.press('ArrowRight'); assert.equal(await focusedLabel(p), '色彩', 'right on open node enters first child');
    await p.keyboard.press('ArrowLeft'); assert.equal(await focusedLabel(p), '设计系统', 'left on leaf goes to parent');
    await p.keyboard.press('End'); assert.equal(await focusedLabel(p), '运营部');
    await p.keyboard.press('Home'); assert.equal(await focusedLabel(p), '产品中心');
    assert.equal(await p.locator('#zhTreeBasic .zh-tree-row[tabindex="0"]').count(), 1);
    await p.locator('#zhTreeDir .zh-tree-row').first().focus();
    await p.keyboard.press('p'); assert.equal(await focusedLabel(p), 'package.json', 'type-ahead');
    await p.waitForTimeout(700); await p.keyboard.press('v'); assert.equal(await focusedLabel(p), 'vite.config.ts', 'type-ahead again');
  });

  await step('check propagation + tri-state', async () => {
    const R = (t) => p.locator('#zhTreeBasic .zh-tree-row', { hasText: t });
    await R('组件库').locator('.zh-tree-check').click();
    assert.equal(await R('组件库').getAttribute('aria-checked'), 'true');
    await R('组件库').locator('.zh-tree-toggle').click();
    for (const l of ['Button', 'Input', 'Table', 'Tree']) assert.equal(await R(new RegExp('^\\s*' + l + '$')).getAttribute('aria-checked'), 'true', l);
    assert.equal(await p.locator('#zhTreeBasic .zh-tree-row').first().getAttribute('aria-checked'), 'mixed');
    await R(/^\s*Input$/).locator('.zh-tree-check').click();
    assert.equal(await R('组件库').getAttribute('aria-checked'), 'mixed');
    assert.equal(await R('图标').getAttribute('aria-checked'), 'false', 'disabled node untouched');
    await R('文档站').focus(); await p.keyboard.press(' ');
    assert.equal(await R('文档站').getAttribute('aria-checked'), 'true');
    await p.check('#zhTrStrict');
    await R('研发部').locator('.zh-tree-check').click();
    await R('研发部').locator('.zh-tree-toggle').click();
    assert.equal(await R('前端组').getAttribute('aria-checked'), 'false', 'strict: children independent');
    await p.uncheck('#zhTrStrict');
    assert.match(await p.textContent('#zhTrChecked'), /已勾选：/);
    assert.ok((await p.locator('#zhTreeLog li b').count()) > 3, 'events logged');
  });

  await step('filter', async () => {
    await p.fill('#zhTrFilter', '服务');
    assert.deepEqual(await labels(p, 'zhTreeFilter'), ['集团总部', '产品部', '后端组', '订单服务', '用户服务', '支付服务']);
    assert.equal(await p.locator('#zhTreeFilter mark').count(), 3);
    assert.match(await p.textContent('#zhTrFilterN'), /3/);
    await p.fill('#zhTrFilter', '不存在的');
    assert.equal(await p.locator('#zhTreeFilter .zh-tree-empty').count(), 1);
    await p.fill('#zhTrFilter', '');
    assert.ok((await rowsOf(p, 'zhTreeFilter').count()) >= 6 && (await p.locator('#zhTreeFilter mark').count()) === 0);
  });

  await step('lazy load + error + retry', async () => {
    const L = (t) => p.locator('#zhTreeLazy .zh-tree-row', { hasText: t });
    await L('PostgreSQL').locator('.zh-tree-toggle').click();
    assert.equal(await p.locator('#zhTreeLazy .zh-tree-row--status').count(), 1);
    assert.match(await p.locator('#zhTreeLazy .zh-tree-row--status').textContent(), /加载中/);
    await p.waitForSelector('#zhTreeLazy .zh-tree-retry', { timeout: 3000 });
    assert.match(await p.locator('#zhTreeLazy .zh-tree-row--status').textContent(), /加载失败/);
    await p.click('#zhTreeLazy .zh-tree-retry');
    await p.waitForSelector('#zhTreeLazy .zh-tree-row:has-text("payments")', { timeout: 3000 });
    assert.equal(await p.locator('#zhTreeLazy .zh-tree-row--status').count(), 0);
    await L('MySQL').locator('.zh-tree-toggle').click();
    await p.waitForFunction(() => [...document.querySelectorAll('#zhTreeLazy .zh-tree-label')].filter((l) => l.textContent.trim() === 'orders').length === 2, null, { timeout: 3000 });
    await L(/^\s*orders$/).first().focus(); await p.keyboard.press('ArrowRight');
    await p.waitForSelector('#zhTreeLazy .zh-tree-row:has-text("created_at")', { timeout: 3000 });
  });

  await step('add / rename / delete', async () => {
    const E = (t) => p.locator('#zhTreeEdit .zh-tree-row', { hasText: t });
    await E(/^\s*待办$/).hover(); await E(/^\s*待办$/).locator('[data-act="add"]').click();
    const inp = p.locator('#zhTreeEdit .zh-tree-edit'); assert.equal(await inp.count(), 1);
    await inp.fill('新增任务'); await p.keyboard.press('Enter');
    assert.ok((await labels(p, 'zhTreeEdit')).includes('新增任务'));
    await E('新增任务').focus(); await p.keyboard.press('F2');
    await p.locator('#zhTreeEdit .zh-tree-edit').fill('改名后'); await p.keyboard.press('Enter');
    assert.ok((await labels(p, 'zhTreeEdit')).includes('改名后'));
    await E('改名后').focus(); await p.keyboard.press('F2'); await p.keyboard.press('Escape');
    assert.ok((await labels(p, 'zhTreeEdit')).includes('改名后'), 'escape cancels edit');
    await E('改名后').hover(); await E('改名后').locator('[data-act="remove"]').click();
    await p.waitForSelector('.zh-tree-confirm.is-open'); await p.click('.zh-tree-confirm [data-c="yes"]');
    await p.waitForTimeout(250);
    assert.ok(!(await labels(p, 'zhTreeEdit')).includes('改名后'));
    await E('补充文档').focus(); await p.keyboard.press('Delete');
    await p.waitForSelector('.zh-tree-confirm.is-open'); await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    assert.ok((await labels(p, 'zhTreeEdit')).includes('补充文档'));
  });

  await step('drag to reorder + keyboard reorder', async () => {
    const box = async (t) => p.locator('#zhTreeEdit .zh-tree-row', { hasText: t }).boundingBox();
    let src = await box(/^\s*补充文档$/), dst = await box(/^\s*设计评审$/);
    await p.mouse.move(src.x + 80, src.y + src.height / 2); await p.mouse.down();
    await p.mouse.move(src.x + 80, src.y - 20, { steps: 4 }); await p.mouse.move(dst.x + 80, dst.y + dst.height * 0.1, { steps: 8 });
    assert.equal(await p.locator('#zhTreeEdit .is-drop-before').count(), 1, 'drop indicator before');
    await p.mouse.up(); await p.waitForTimeout(150);
    const l1 = await labels(p, 'zhTreeEdit'); assert.ok(l1.indexOf('补充文档') < l1.indexOf('设计评审'), l1.join());
    src = await box(/^\s*修复 #482$/); dst = await box(/^\s*性能优化$/);
    await p.mouse.move(src.x + 80, src.y + src.height / 2); await p.mouse.down();
    await p.mouse.move(src.x + 80, src.y - 15, { steps: 4 }); await p.mouse.move(dst.x + 80, dst.y + dst.height / 2, { steps: 8 });
    assert.equal(await p.locator('#zhTreeEdit .is-drop-inside').count(), 1, 'drop indicator inside');
    await p.mouse.up(); await p.waitForTimeout(150);
    const inside = await p.evaluate(() => { const t = window.ZHTree.edit; const n = t.rows().map((r) => r.n).find((x) => x.label === '修复 #482'); return n.parent && n.parent.label; });
    assert.equal(inside, '性能优化', 'moved inside folder');
    src = await box(/^\s*接口联调$/); dst = await box(/^\s*待办$/);
    await p.mouse.move(src.x + 80, src.y + src.height / 2); await p.mouse.down(); await p.mouse.move(dst.x + 80, dst.y + 5, { steps: 6 });
    await p.keyboard.press('Escape'); await p.mouse.up(); await p.waitForTimeout(100);
    assert.equal(await p.locator('.zh-tree-ghost').count(), 0);
    const still = await p.evaluate(() => window.ZHTree.edit.rows().map((r) => r.n).find((x) => x.label === '接口联调').parent.label);
    assert.equal(still, '迭代 12', 'escape cancelled the drag');
    await p.locator('#zhTreeEdit .zh-tree-row', { hasText: /^\s*待办$/ }).focus(); await p.keyboard.press('Alt+ArrowUp'); await p.waitForTimeout(100);
    const l2 = await labels(p, 'zhTreeEdit'); assert.ok(l2.indexOf('待办') < l2.indexOf('迭代 12'), 'alt+up reorder: ' + l2.join());
  });

  await step('directory tree selects + toggles folder', async () => {
    await p.locator('#zhTreeDir .zh-tree-row', { hasText: /^\s*utils$/ }).click();
    assert.ok((await labels(p, 'zhTreeDir')).includes('date.ts'), 'folder click expands');
    await p.locator('#zhTreeDir .zh-tree-row', { hasText: 'date.ts' }).click();
    assert.match(await p.textContent('#zhTrDirPath'), /src\/utils\/date\.ts/);
    assert.equal(await p.locator('#zhTreeDir .zh-tree-row[aria-selected="true"]').count(), 1);
  });

  await step('big tree windows its rows', async () => {
    await p.click('#zhTrBigOpen'); await p.waitForTimeout(200);
    const stat = await p.textContent('#zhTrBigStat'); assert.match(stat, /5,025/); assert.match(stat, /可见 5,025/);
    const n = await p.locator('#zhTreeBig .zh-tree-row').count(); assert.ok(n > 5 && n < 80, 'rendered ' + n);
    await p.evaluate(() => { const e = document.getElementById('zhTreeBig'); e.scrollTop = e.scrollHeight; }); await p.waitForTimeout(250);
    assert.ok((await labels(p, 'zhTreeBig')).includes('节点-25-8-24.log'), 'last leaf reachable');
    const last = p.locator('#zhTreeBig .zh-tree-row', { hasText: '节点-25-8-24.log' });
    assert.equal(await last.getAttribute('aria-posinset'), '24'); assert.equal(await last.getAttribute('aria-setsize'), '24'); assert.equal(await last.getAttribute('aria-level'), '3');
    await p.evaluate(() => { document.getElementById('zhTreeBig').scrollTop = 0; }); await p.waitForTimeout(150);
    await p.locator('#zhTreeBig .zh-tree-row').first().focus(); await p.keyboard.press('End'); await p.waitForTimeout(250);
    assert.equal(await focusedLabel(p), '节点-25-8-24.log', 'End jumps across the window');
    await p.click('#zhTrBigClose'); await p.waitForTimeout(150); assert.match(await p.textContent('#zhTrBigStat'), /可见 25 行/);
  });

  await step('TreeSelect', async () => {
    await p.click('#zhTsSingle'); await p.waitForSelector('.zh-pop.is-open .zh-tree');
    assert.equal(await p.getAttribute('#zhTsSingle', 'aria-expanded'), 'true');
    await p.locator('.zh-pop .zh-tree-row', { hasText: '广东省' }).locator('.zh-tree-toggle').click();
    await p.locator('.zh-pop .zh-tree-row', { hasText: '广州市' }).click();
    await p.waitForTimeout(250);
    assert.match(await p.textContent('#zhTsSingle'), /广州市/); assert.equal(await p.locator('.zh-pop').count(), 0, 'closes after select');
    await p.click('#zhTsMulti'); await p.waitForSelector('.zh-pop.is-open .zh-tree');
    await p.locator('.zh-pop .zh-tree-row', { hasText: '浙江省' }).locator('.zh-tree-check').click();
    assert.ok((await p.locator('#zhTsMulti .zh-tselect-chip').count()) >= 1);
    await p.keyboard.press('Escape'); await p.waitForTimeout(250); assert.equal(await p.locator('.zh-pop').count(), 0);
    assert.equal(await p.evaluate(() => document.activeElement.id), 'zhTsMulti', 'focus returns to trigger');
    await p.locator('#zhTsMulti .zh-tselect-x').first().click(); assert.match(await p.textContent('#zhTsMulti'), /请选择/);
    await p.focus('#zhTsSingle'); await p.keyboard.press('ArrowDown'); await p.waitForSelector('.zh-pop.is-open .zh-tree-row:focus');
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
  });

  assert.deepEqual(errs, [], name + ' page errors');
  console.log(bad ? 'FAILED' : 'ok  ', name);
  await b.close();
}
process.exit(bad ? 1 : 0);
