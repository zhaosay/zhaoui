// node demo/fragments/43-timeline/test.mjs — interaction tests for timeline + steps in Chromium, Firefox and WebKit
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium, firefox, webkit } = createRequire('/tmp/pw/')('playwright');
const OUT = '/tmp/zh-timeline-test.html';
execFileSync('node', [new URL('../../build.mjs', import.meta.url).pathname, '--out', OUT, '--only', '00-core,43-timeline']);

const engines = process.env.TLT_ONLY ? { [process.env.TLT_ONLY]: { chromium, firefox, webkit }[process.env.TLT_ONLY] } : { chromium, firefox, webkit };
let bad = 0;
for (const [name, eng] of Object.entries(engines)) {
  const b = await eng.launch();
  let engBad = 0;
  const step = async (label, fn) => { try { await fn(); } catch (e) { bad++; engBad++; console.log('  FAIL', name, label, '-', String(e.message).split('\n').slice(0, 4).join(' | ')); } };

  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + OUT + '?only=timeline'); await p.waitForTimeout(300);
  const count = (sel) => p.locator(sel).count();

  await step('timelines render as ordered lists with time elements', async () => {
    assert.equal(await count('#timeline ol.zh-tl'), 9);
    assert.equal(await count('#timeline ol.zh-tl--left[aria-label="订单进度（左侧布局）"] > li'), 4);
    assert.ok((await count('#timeline .zh-tl time[datetime]')) >= 12);
    assert.equal(await count('#timeline .zh-tl--alt .zh-tl-time--opp'), 4, 'alternate puts time on the opposite side');
    assert.equal(await count('#timeline .zh-tl--left .zh-tl-time--opp'), 0);
  });

  await step('alternate layout: 3 columns on desktop, collapses to left on phone', async () => {
    const cols = () => p.evaluate(() => getComputedStyle(document.querySelector('.zh-tl--alt .zh-tl-item')).gridTemplateColumns.split(' ').length);
    assert.equal(await cols(), 3);
    const x = () => p.evaluate(() => [...document.querySelectorAll('.zh-tl--alt .zh-tl-body')].map((e) => Math.round(e.getBoundingClientRect().left)));
    const xs = await x(); assert.ok(xs[0] < xs[1], 'odd/even sit on opposite sides: ' + xs);
    await p.setViewportSize({ width: 390, height: 800 }); await p.waitForTimeout(200);
    assert.equal(await cols(), 2, 'phone: two columns');
    const xs2 = await x(); assert.ok(xs2.every((v) => Math.abs(v - xs2[0]) < 2), 'phone: all bodies aligned left ' + xs2);
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow at 390');
    await p.setViewportSize({ width: 1280, height: 900 }); await p.waitForTimeout(150);
  });

  await step('expand / collapse detail', async () => {
    const li = p.locator('#timeline ol[aria-label="审批记录"] > li').first();
    const tog = li.locator('.zh-tl-toggle'), detail = li.locator('.zh-tl-detail-in');
    assert.equal(await tog.getAttribute('aria-expanded'), 'false'); assert.equal(await detail.isVisible(), false, 'collapsed content is not visible/focusable');
    await tog.click(); await p.waitForTimeout(350);
    assert.equal(await tog.getAttribute('aria-expanded'), 'true'); assert.equal(await detail.isVisible(), true); assert.match(await tog.textContent(), /收起详情/);
    assert.equal(await p.getAttribute('#' + (await tog.getAttribute('aria-controls')), 'class'), 'zh-tl-detail');
    await tog.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(350);
    assert.equal(await tog.getAttribute('aria-expanded'), 'false'); assert.equal(await detail.isVisible(), false);
    await li.locator('.zh-tl-file').first().click(); await p.waitForSelector('.zh-message'); assert.match(await p.textContent('.zh-message'), /预算表\.xlsx/);
  });

  await step('pending item + live advance', async () => {
    assert.equal(await count('#zhTlLive .zh-tl-item--pending'), 1);
    assert.equal(await count('#zhTlLive .zh-tl-spin'), 1);
    assert.equal(await p.getAttribute('#zhTlLive', 'aria-live'), 'polite');
    const before = await count('#zhTlLive > li');
    await p.click('#zhTlAdvance');
    assert.equal(await count('#zhTlLive > li'), before + 1); assert.equal(await count('#zhTlLive .zh-tl-item--pending'), 1);
    assert.match(await p.textContent('#zhTlLive > li:nth-last-child(2) .zh-tl-desc'), /已完成/);
    for (let i = 0; i < 6; i++) await p.click('#zhTlAdvance');
    assert.equal(await count('#zhTlLive .zh-tl-item--pending'), 0); assert.equal(await count('#zhTlLive > li'), 8); assert.equal(await count('#zhTlLive .zh-tl-item--success'), 2, 'seed success + final delivery');
    await p.waitForSelector('.zh-message', { state: 'attached' });
    await p.click('#zhTlReset'); assert.equal(await count('#zhTlLive .zh-tl-item--pending'), 1); assert.equal(await count('#zhTlLive > li'), 3);
  });

  await step('steps: one aria-current, states, responsive direction', async () => {
    for (const ol of await p.locator('#timeline ol.zh-steps[data-steps]').all()) assert.equal(await ol.locator('[aria-current="step"]').count(), 1, await ol.getAttribute('aria-label'));
    assert.equal(await count('ol[data-steps="error"] .zh-step.is-error'), 1);
    assert.equal(await count('ol[aria-label="开通流程"] .zh-step.is-finish'), 1); assert.equal(await count('ol[aria-label="开通流程"] .zh-step.is-wait'), 2);
    const ys = () => p.$$eval('ol[aria-label="开通流程"] .zh-step', (l) => l.map((e) => Math.round(e.getBoundingClientRect().top)));
    let y = await ys(); assert.ok(y.every((v) => v === y[0]), 'horizontal on desktop: ' + y);
    await p.setViewportSize({ width: 390, height: 800 }); await p.waitForTimeout(200);
    y = await ys(); assert.ok(y[1] > y[0] && y[2] > y[1], 'vertical on phone: ' + y);
    const line = await p.evaluate(() => { const l = document.querySelector('ol[aria-label="开通流程"] .zh-step-line'); const r = l.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; });
    assert.ok(line.w <= 3 && line.h > 10, 'connector turns vertical ' + JSON.stringify(line));
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await p.setViewportSize({ width: 1280, height: 900 }); await p.waitForTimeout(150);
  });

  await step('connector fill animates via transform', async () => {
    await p.click('#zhStepsPlayBtn'); await p.waitForTimeout(2600);
    const fin = await count('#zhStepsPlay .zh-step.is-finish'); assert.ok(fin >= 1, 'finished steps ' + fin);
    const t = await p.evaluate(() => getComputedStyle(document.querySelector('#zhStepsPlay .zh-step.is-finish .zh-step-line i')).transform);
    assert.match(t, /matrix\(1,/, 'filled connector is scaleX(1): ' + t);
    const wait = await p.evaluate(() => { const l = document.querySelector('#zhStepsPlay .zh-step.is-wait .zh-step-line i'); return l ? getComputedStyle(l).transform : 'matrix(0,0,0,1,0,0)'; });
    assert.match(wait, /matrix\(0,/, 'pending connector is scaleX(0): ' + wait);
    await p.click('#zhStepsPlayBtn');
  });

  await step('wizard: validation gating, disabled future steps, back navigation, finish', async () => {
    const cur = () => p.evaluate(() => { const e = document.querySelector('#zhWizSteps [aria-current="step"]'); return e ? e.querySelector('.zh-step-title').textContent : null; });
    assert.equal(await cur(), '账户信息'); assert.equal(await p.locator('#zhWizSteps [data-step="2"]').isDisabled(), true); assert.equal(await p.locator('#zhWizSteps [data-step="1"]').isDisabled(), true);
    await p.click('#zhWizNext');
    assert.equal(await cur(), '账户信息', 'blocked by validation'); assert.equal(await count('#zhWizSteps .zh-step.is-error'), 1);
    assert.equal(await p.getAttribute('#zhWizName', 'aria-invalid'), 'true'); assert.equal(await p.locator('#zhWizNameE').isVisible(), true);
    assert.equal(await p.evaluate(() => document.activeElement.id), 'zhWizName', 'focus moves to the first invalid field'); assert.match(await p.textContent('#zhWizMsg'), /未通过校验/);
    await p.fill('#zhWizName', '张三'); await p.fill('#zhWizMail', 'bad');
    await p.click('#zhWizNext'); assert.equal(await cur(), '账户信息'); assert.equal(await p.locator('#zhWizMailE').isVisible(), true);
    await p.fill('#zhWizMail', 'zhang@example.com'); assert.equal(await count('#zhWizSteps .zh-step.is-error'), 0, 'error clears when input becomes valid');
    await p.click('#zhWizNext'); assert.equal(await cur(), '选择方案'); assert.equal(await p.locator('#zhWizSteps [data-step="0"]').isDisabled(), false);
    assert.equal(await p.locator('#zhWizSteps [data-step="2"]').isDisabled(), true, 'cannot skip ahead');
    await p.click('#zhWizNext'); assert.equal(await cur(), '选择方案'); assert.equal(await p.locator('#zhWizPlanE').isVisible(), true);
    await p.click('#zhWizSteps [data-step="0"]'); assert.equal(await cur(), '账户信息'); assert.equal(await p.inputValue('#zhWizName'), '张三', 'values are kept');
    await p.click('#zhWizNext'); await p.check('input[name="zhWizPlan"][value="专业版"]'); await p.click('#zhWizNext');
    assert.equal(await cur(), '确认提交'); assert.match(await p.textContent('#zhWizSum'), /张三/); assert.match(await p.textContent('#zhWizSum'), /专业版/);
    assert.equal(await p.textContent('#zhWizNext'), '提交');
    await p.click('#zhWizSteps [data-step="1"]'); assert.equal(await cur(), '选择方案'); await p.click('#zhWizNext'); assert.equal(await cur(), '确认提交');
    await p.click('#zhWizNext'); await p.waitForSelector('.zh-message');
    assert.equal(await count('#zhWizSteps .zh-step.is-finish'), 3); assert.equal(await count('#zhWizSteps [aria-current="step"]'), 0); assert.match(await p.textContent('#zhWizMsg'), /提交成功/);
    await p.click('#zhWizNext'); assert.equal(await cur(), '账户信息', 'restart');
  });

  await step('wizard is keyboard operable', async () => {
    await p.fill('#zhWizName', ''); await p.focus('#zhWizNext'); await p.keyboard.press('Enter');
    assert.equal(await p.evaluate(() => document.activeElement.id), 'zhWizName');
    await p.keyboard.type('李四'); await p.keyboard.press('Tab'); await p.keyboard.type('li@example.com');
    await p.focus('#zhWizNext'); await p.keyboard.press('Space');
    assert.equal(await p.evaluate(() => document.querySelector('#zhWizSteps [aria-current="step"] .zh-step-title').textContent), '选择方案');
  });

  assert.deepEqual(errs, [], name + ' page errors');
  console.log(engBad ? 'FAILED' : 'ok  ', name);
  await b.close();
}
process.exit(bad ? 1 : 0);
