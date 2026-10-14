// node demo/fragments/41-panel/test.mjs   (Chromium + Firefox + WebKit)
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium, firefox, webkit } = createRequire('/tmp/pw/')('playwright');
const root = new URL('../../../', import.meta.url).pathname;
const out = '/tmp/zh-test-panel.html';
execFileSync('node', [root + 'demo/build.mjs', '--out', out, '--only', '00-core,41-panel'], { stdio: 'pipe' });
const url = 'file://' + out;
const wait = (p, ms) => p.waitForTimeout(ms);
let failed = 0;

async function interactions(page) {
  const $ = (s) => page.locator(s);
  const expanded = (sel) => page.evaluate((s) => [...document.querySelectorAll(s + ' > .zh-collapse-item > .zh-collapse-h > .zh-collapse-trigger')].map((t) => t.getAttribute('aria-expanded')), sel);

  // accordion (single): opening one closes the others; disabled cannot open; closed content is not focusable
  assert.deepEqual(await expanded('#colA'), ['true', 'false', 'false']);
  await page.locator('#colA .zh-collapse-trigger').nth(1).click(); await wait(page, 350);
  assert.deepEqual(await expanded('#colA'), ['false', 'true', 'false']);
  await page.locator('#colA .zh-collapse-trigger').nth(2).click({ force: true }); await wait(page, 100);
  assert.deepEqual(await expanded('#colA'), ['false', 'true', 'false'], 'disabled item stays closed');
  const vis = await page.evaluate(() => [...document.querySelectorAll('#colA > .zh-collapse-item > .zh-collapse-panel')].map((p) => getComputedStyle(p).visibility));
  assert.deepEqual(vis, ['hidden', 'visible', 'hidden'], 'closed panels are hidden from focus and AT');
  const h = await page.evaluate(() => document.querySelector('#colA > .zh-collapse-item.is-open .zh-collapse-inner').offsetHeight);
  assert.ok(h > 20, 'open panel has height');
  const wired = await page.evaluate(() => { const t = document.querySelector('#colA .zh-collapse-trigger'); const p = document.getElementById(t.getAttribute('aria-controls')); return p.getAttribute('role') === 'region' && p.getAttribute('aria-labelledby') === t.id; });
  assert.ok(wired, 'aria-controls / labelledby wired');
  // keyboard: arrows and Home/End skip the disabled trigger
  await page.locator('#colA .zh-collapse-trigger').first().focus();
  await page.keyboard.press('ArrowDown'); assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), '怎么切换品牌色');
  await page.keyboard.press('ArrowDown'); assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), '什么是设计语言', 'wraps past the disabled item');
  await page.keyboard.press('End'); assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), '怎么切换品牌色');
  // multiple + nested
  assert.deepEqual(await expanded('#colB'), ['true', 'true', 'false']);
  await page.locator('#colB > .zh-collapse-item').nth(2).locator('> .zh-collapse-h > .zh-collapse-trigger').click(); await wait(page, 300);
  assert.deepEqual(await expanded('#colB'), ['true', 'true', 'true']);
  await page.locator('#colB .zh-collapse .zh-collapse-trigger').first().click(); await wait(page, 300);
  assert.equal(await page.evaluate(() => document.querySelector('#colB .zh-collapse .zh-collapse-item').classList.contains('is-open')), true, 'nested opens independently');

  // selectable cards: click, arrows skip the disabled one, disabled ignores clicks
  const plan = () => page.evaluate(() => [...document.querySelectorAll('#cardPlans [role=radio]')].map((e) => e.getAttribute('aria-checked')));
  assert.deepEqual(await plan(), ['false', 'true', 'false']);
  await page.locator('#cardPlans [role=radio]').first().click(); assert.deepEqual(await plan(), ['true', 'false', 'false']);
  await page.locator('#cardPlans [role=radio]').nth(2).click({ force: true }); assert.deepEqual(await plan(), ['true', 'false', 'false'], 'disabled ignores click');
  await page.locator('#cardPlans [role=radio]').first().focus(); await page.keyboard.press('ArrowRight'); assert.deepEqual(await plan(), ['false', 'true', 'false']);
  await page.keyboard.press('ArrowRight'); assert.deepEqual(await plan(), ['true', 'false', 'false'], 'wraps around the disabled option');

  // loading card
  assert.equal(await $('#cardLoad').getAttribute('aria-busy'), 'true');
  await $('#cardLoadSwitch').uncheck();
  assert.equal(await $('#cardLoad').getAttribute('aria-busy'), 'false'); assert.ok(await page.locator('#cardLoad .zh-cardx-ready').isVisible()); assert.ok(!(await page.locator('#cardLoad .zh-cardx-loading').isVisible()));
  await $('#cardLoadSwitch').check();

  // result pages: order, content, code, icon
  const labels = await page.$$eval('#resultSeg button', (b) => b.map((x) => x.textContent));
  assert.deepEqual(labels, ['成功', '失败', '提示', '警告', '403', '404', '500']);
  await page.locator('#resultSeg button', { hasText: '404' }).click();
  assert.equal(await $('#resultCard .zh-result-code').textContent(), '404'); assert.match(await $('#resultCard .zh-result-title').textContent(), /页面不存在/);
  assert.equal(await $('#resultSeg button[aria-pressed=true]').textContent(), '404');
  await page.locator('#resultSeg button', { hasText: '失败' }).click();
  assert.equal(await page.locator('#resultCard .zh-result-extra li').count(), 2); assert.equal(await $('#resultCard').getAttribute('data-tone'), 'error');

  // split panel: keyboard, drag, double-click reset, collapse
  const val = () => page.evaluate(() => +document.getElementById('spBar').getAttribute('aria-valuenow'));
  const v0 = await val(); assert.equal(v0, 36);
  await $('#spBar').focus(); await page.keyboard.press('ArrowLeft'); assert.equal(await val(), 34);
  await page.keyboard.press('Shift+ArrowRight'); assert.equal(await val(), 44);
  await page.keyboard.press('Home'); const min = await val(); assert.ok(min >= 15 && min < 30);
  await page.keyboard.press('End'); const max = await val(); assert.ok(max > 60 && max <= 85);
  await $('#spBar').dblclick(); assert.equal(await val(), 36);
  const b = await $('#spBar').boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.mouse.move(b.x + 140, b.y + b.height / 2, { steps: 6 }); await page.mouse.up();
  const dragged = await val(); assert.ok(dragged > 40, 'drag widens the left pane, got ' + dragged);
  await $('#spToggle').click(); await wait(page, 300);
  assert.ok(await $('#spDemo').evaluate((e) => e.classList.contains('is-collapsed'))); assert.equal(await $('#spToggle').getAttribute('aria-expanded'), 'false');
  assert.equal(await page.evaluate(() => getComputedStyle(document.getElementById('spA')).visibility), 'hidden');
  await $('#spToggle').click(); await wait(page, 300);
  await page.locator('#spList button').nth(2).click(); assert.equal(await $('#spTitle').textContent(), '字体');
  assert.equal(await $('#spBar').getAttribute('role'), 'separator');

  // settings panel dirty tracking
  assert.ok(await $('#psBar').isHidden());
  await page.locator('#psDemo [data-k=promo]').check(); assert.match(await $('#psCount').textContent(), /1 项/);
  await page.locator('#psDemo [data-k=name]').fill('李四'); assert.match(await $('#psCount').textContent(), /2 项/);
  await $('#psReset').click(); assert.ok(await $('#psBar').isHidden()); assert.equal(await page.locator('#psDemo [data-k=name]').inputValue(), '张三');
  await page.locator('#psDemo [data-k=mail]').uncheck(); await $('#psSave').click(); assert.ok(await $('#psBar').isHidden());
  await page.locator('#psDemo [data-k=mail]').check(); assert.match(await $('#psCount').textContent(), /1 项/, 'saved value is the new baseline'); await $('#psReset').click();
}

async function responsive(browser) {
  for (const [vw, cols] of [[1440, 3], [820, 2], [390, 1]]) {
    const p = await browser.newPage({ viewport: { width: vw, height: 800 } });
    await p.goto(url + '?only=panel'); await p.waitForTimeout(200);
    const n = await p.evaluate(() => getComputedStyle(document.querySelector('.zh-descr[data-variant=bordered]')).gridTemplateColumns.split(' ').length);
    assert.equal(n, cols, `descriptions columns at ${vw}`);
    if (vw === 390) {
      const stacked = await p.evaluate(() => getComputedStyle(document.getElementById('spDemo')).display);
      assert.equal(stacked, 'block', 'split panel stacks on phones');
    }
    await p.close();
  }
}

async function sweep(browser) {
  const problems = [];
  for (const vw of [390, 820, 1440]) {
    const p = await browser.newPage({ viewport: { width: vw, height: 800 } });
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    for (const aud of ['b', 'c']) for (const mode of ['light', 'dark']) for (const den of ['compact', 'comfortable']) {
      await p.goto(`${url}?only=panel&audience=${aud}&mode=${mode}&density=${den}`); await p.waitForTimeout(150);
      const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (over > 1 || errs.length) { problems.push(`${vw} ${aud}/${mode}/${den}: overflow ${over} ${errs.join('|')}`); errs.length = 0; }
    }
    await p.close();
  }
  assert.deepEqual(problems, []);
}

for (const [name, eng] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await eng.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto(url + '?only=panel'); await wait(page, 300);
    await interactions(page); assert.deepEqual(errs, [], 'console/page errors');
    await responsive(browser); await sweep(browser);
    console.log('ok  ', name);
  } catch (e) { failed++; console.log('FAIL', name, e.message.split('\n')[0]); }
  await browser.close();
}
process.exit(failed ? 1 : 0);
