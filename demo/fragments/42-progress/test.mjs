// node demo/fragments/42-progress/test.mjs   (Chromium + Firefox + WebKit)
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium, firefox, webkit } = createRequire('/tmp/pw/')('playwright');
const root = new URL('../../../', import.meta.url).pathname;
const out = '/tmp/zh-test-progress.html';
execFileSync('node', [root + 'demo/build.mjs', '--out', out, '--only', '00-core,42-progress'], { stdio: 'pipe' });
const url = 'file://' + out;
const wait = (p, ms) => p.waitForTimeout(ms);
let failed = 0;

async function interactions(page) {
  const $ = (s) => page.locator(s);
  const now = (s) => page.evaluate((x) => +document.querySelector(x).getAttribute('aria-valuenow'), s);

  // playground: +/-, clamping, both indicators share one value, auto success at 100
  assert.equal(await now('#pgMain'), 36); assert.equal(await now('#pgRing'), 36);
  await $('#pgPlus').click(); assert.equal(await now('#pgMain'), 46); assert.equal(await now('#pgRing'), 46);
  await $('#pgMinus').click(); await $('#pgMinus').click(); await $('#pgMinus').click(); await $('#pgMinus').click(); await $('#pgMinus').click();
  assert.equal(await now('#pgMain'), 0, 'clamped at 0'); assert.ok(await $('#pgRing').evaluate((e) => e.classList.contains('is-zero')));
  for (let i = 0; i < 12; i++) await $('#pgPlus').click();
  assert.equal(await now('#pgMain'), 100, 'clamped at 100'); assert.equal(await $('#pgMain').getAttribute('data-tone'), 'success');
  assert.match(await $('#pgMain').getAttribute('aria-valuetext'), /已完成/); assert.ok(await page.locator('#pgMain .zh-progress-label .ico').count());
  assert.ok(await page.locator('#pgRing .zh-ring-center .ico').count(), 'ring shows a tick at 100%');
  // status override
  await page.locator('#pgStatus button[data-v=exception]').click();
  assert.equal(await $('#pgMain').getAttribute('data-tone'), 'exception'); assert.match(await $('#pgMain').getAttribute('aria-valuetext'), /失败/);
  await page.locator('#pgStatus button[data-v=normal]').click(); await $('#pgReset').click();
  // sizes and label placements change the real geometry
  const trackH = () => page.evaluate(() => document.querySelector('#pgMain .zh-progress-track').getBoundingClientRect().height);
  await page.locator('#pgSize button[data-v=sm]').click(); const hs = await trackH();
  await page.locator('#pgSize button[data-v=md]').click(); const hm = await trackH();
  await page.locator('#pgSize button[data-v=lg]').click(); const hl = await trackH();
  assert.deepEqual([hs, hm, hl].map(Math.round), [4, 8, 12]);
  await page.locator('#pgLabel button[data-v=inside]').click(); assert.equal(Math.round(await trackH()), 20); assert.equal(await page.locator('#pgMain .zh-progress-in').count(), 1);
  await page.locator('#pgLabel button[data-v=top]').click(); assert.equal(await page.locator('#pgMain .zh-progress-head').count(), 1);
  await page.locator('#pgLabel button[data-v=none]').click(); assert.equal(await page.locator('#pgMain .zh-progress-label').count(), 0);
  assert.equal(await $('#pgMain').getAttribute('aria-label'), '演示进度', 'accessible name survives re-mount');
  await page.locator('#pgSize button[data-v=md]').click(); await page.locator('#pgLabel button[data-v=outside]').click();
  // simulate then pause
  await $('#pgSim').click(); await wait(page, 900); const running = await now('#pgMain'); assert.ok(running > 0, 'simulation advances, got ' + running);
  await $('#pgSim').click(); const paused = await now('#pgMain'); await wait(page, 700); assert.equal(await now('#pgMain'), paused, 'pause stops it');
  assert.equal(await now('#pgRing'), paused, 'ring follows the bar');

  // static semantics
  const stat = await page.evaluate(() => ({
    indet: (() => { const e = document.querySelector('[data-indeterminate=true]'); return { busy: e.getAttribute('aria-busy'), now: e.hasAttribute('aria-valuenow') }; })(),
    steps: document.querySelectorAll('.zh-progress[data-steps="10"] .zh-progress-track i.on').length,
    buffer: getComputedStyle(document.querySelector('.zh-progress[data-buffer]')).getPropertyValue('--zh-b').trim(),
    names: [...document.querySelectorAll('#progress .zh-progress, #progress .zh-ring[role=progressbar]')].filter((e) => !e.getAttribute('aria-label')).length,
    missingNow: [...document.querySelectorAll('#progress [role=progressbar]:not([data-indeterminate])')].filter((e) => !e.hasAttribute('aria-valuenow')).length,
  }));
  assert.deepEqual(stat.indet, { busy: 'true', now: false }); assert.equal(stat.steps, 6); assert.equal(+stat.buffer, 0.62); assert.equal(stat.names, 0, 'every indicator has an accessible name'); assert.equal(stat.missingNow, 0);

  // ring maths (transition ends, then measure)
  await wait(page, 700);
  const ring = await page.evaluate(() => {
    const off = (sel) => { const r = document.querySelector(sel); return parseFloat(getComputedStyle(r.querySelector('.zh-ring-arc')).strokeDashoffset); };
    const dash = (sel) => parseFloat(getComputedStyle(document.querySelector(sel + ' .zh-ring-arc')).strokeDasharray);
    return { md: off('.zh-ring[data-name="中环"]'), gauge: dash('.zh-ring[data-shape=gauge]'), semi: dash('.zh-ring[data-shape=semi]') };
  });
  assert.ok(Math.abs(ring.md - 263.89 * 0.35) < 1.5, 'ring 65% offset ' + ring.md);
  assert.ok(Math.abs(ring.gauge - 197.92 * 0.72) < 1.5, 'gauge 72% dash ' + ring.gauge);
  assert.ok(Math.abs(ring.semi - 131.95 * 0.58) < 1.5, 'semi 58% dash ' + ring.semi);

  // countdown: tone changes and end state
  await page.locator('#cdLen button[data-v="5"]').click();
  assert.equal(await $('#cdRing').getAttribute('data-tone'), 'normal', 'a full countdown is not "complete"');
  await $('#cdToggle').click(); await wait(page, 1300);
  const s1 = await $('#cdRing .zh-ring-center').textContent(); assert.match(s1, /^[34]/, 'counting down, got ' + s1);
  await $('#cdToggle').click(); const left = await $('#cdRing').getAttribute('aria-label'); await wait(page, 600); assert.equal(await $('#cdRing').getAttribute('aria-label'), left, 'pause freezes the timer');
  await $('#cdToggle').click(); await page.waitForFunction(() => document.getElementById('cdRing').dataset.tone === 'warning', null, { timeout: 4000 });
  await page.waitForFunction(() => document.getElementById('cdRing').getAttribute('aria-label') === '倒计时结束', null, { timeout: 6000 });
  assert.equal(await $('#cdRing').getAttribute('data-tone'), 'exception');
  await $('#cdReset').click(); assert.equal(await $('#cdRing').getAttribute('data-tone'), 'normal'); assert.match(await $('#cdRing .zh-ring-center').textContent(), /^5/);

  // upload queue: pause / resume / fail / retry / remove / pause-all
  await page.locator('#upqRestart').click();
  const row = (i) => page.locator('#upq li').nth(i);
  const pct = async (i) => +(await row(i).locator('.zh-progress').getAttribute('aria-valuenow'));
  assert.equal(await page.locator('#upq li').count(), 4);
  await wait(page, 1200); assert.ok((await pct(1)) > 10, 'file 2 advances');
  await row(1).locator('[data-act=toggle]').click(); assert.equal(await row(1).getAttribute('data-state'), 'paused'); assert.match(await row(1).locator('.zh-upq-meta').textContent(), /已暂停/);
  const frozen = await pct(1); await wait(page, 800); assert.equal(await pct(1), frozen, 'paused row is frozen');
  assert.ok((await pct(0)) > frozen - 30, 'other rows keep going');
  await row(1).locator('[data-act=toggle]').click(); assert.equal(await row(1).getAttribute('data-state'), 'uploading');
  await page.waitForFunction(() => document.querySelectorAll('#upq li[data-state=error]').length === 1, null, { timeout: 9000 });
  assert.equal(await row(2).getAttribute('data-tone') ?? await row(2).locator('.zh-progress').getAttribute('data-tone'), 'exception');
  assert.match(await page.locator('#upqLive').textContent(), /上传失败/, 'failure is announced');
  await row(2).locator('[data-act=retry]').click(); assert.equal(await row(2).getAttribute('data-state'), 'uploading');
  await page.waitForFunction(() => document.querySelector('#upq li[data-state=done]'), null, { timeout: 9000 });
  await page.locator('#upqAll').click();
  assert.equal(await page.locator('#upq li[data-state=uploading]').count(), 0, 'pause all'); assert.match(await page.locator('#upqAll').textContent(), /全部继续/);
  const before = await page.locator('#upq li').count();
  await page.locator('#upq li [data-act=remove]').last().click(); assert.equal(await page.locator('#upq li').count(), before - 1);
}

async function reducedMotion(eng) {
  const browser = await eng.launch();
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1200, height: 800 } });
  const p = await ctx.newPage(); await p.goto(url + '?only=progress'); await p.waitForTimeout(300);
  const names = await p.evaluate(() => ({
    sheen: getComputedStyle(document.querySelector('.zh-progress.is-active .zh-progress-fill'), '::after').animationName,
    stripes: getComputedStyle(document.querySelector('.zh-progress.is-striped .zh-progress-fill'), '::before').animationName,
  }));
  assert.deepEqual(names, { sheen: 'none', stripes: 'none' }, 'decorative loops stop under reduced motion');
  await browser.close();
}

async function sweep(browser) {
  const problems = [];
  for (const vw of [390, 820, 1440]) {
    const p = await browser.newPage({ viewport: { width: vw, height: 800 } });
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    for (const aud of ['b', 'c']) for (const mode of ['light', 'dark']) for (const den of ['compact', 'comfortable']) {
      await p.goto(`${url}?only=progress&audience=${aud}&mode=${mode}&density=${den}`); await p.waitForTimeout(150);
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
    await page.goto(url + '?only=progress'); await wait(page, 300);
    await interactions(page); assert.deepEqual(errs, [], 'console/page errors');
    await sweep(browser); await reducedMotion(eng);
    console.log('ok  ', name);
  } catch (e) { failed++; console.log('FAIL', name, e.message.split('\n').slice(0, 2).join(' ')); }
  await browser.close();
}
process.exit(failed ? 1 : 0);
