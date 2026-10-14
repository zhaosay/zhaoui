// node demo/fragments/40-badge/test.mjs   (Chromium + Firefox + WebKit)
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium, firefox, webkit } = createRequire('/tmp/pw/')('playwright');
const root = new URL('../../../', import.meta.url).pathname;
const out = '/tmp/zh-test-badge.html';
execFileSync('node', [root + 'demo/build.mjs', '--out', out, '--only', '00-core,40-badge'], { stdio: 'pipe' });
const url = 'file://' + out;
const ENGINES = { chromium, firefox, webkit };
const wait = (p, ms) => p.waitForTimeout(ms);
let failed = 0;

async function interactions(page) {
  const $ = (s) => page.locator(s);
  const mark = () => page.evaluate(() => { const m = document.querySelector('#bdgPlay'); return { text: m.querySelector('[aria-hidden]')?.textContent, sr: m.querySelector('.zh-bdg-sr')?.textContent, hidden: m.classList.contains('is-hidden'), ariaHidden: m.getAttribute('aria-hidden'), dot: m.classList.contains('is-dot') }; });

  // count overflow, custom max, zero handling, dot mode
  assert.equal((await mark()).text, '8');
  for (let i = 0; i < 10; i++) await $('#bdgPlus10').click();
  let m = await mark(); assert.equal(m.text, '99+'); assert.match(m.sr, /^108 /);
  await $('#bdgMax').selectOption('9'); assert.equal((await mark()).text, '9+');
  await $('#bdgMax').selectOption('999'); assert.equal((await mark()).text, '108');
  await $('#bdgReset').click(); assert.equal((await mark()).text, '8');
  for (let i = 0; i < 8; i++) await $('#bdgMinus').click();
  m = await mark(); assert.ok(m.hidden && m.ariaHidden === 'true', 'zero hides the badge');
  await $('#bdgMinus').click(); assert.match(await $('#bdgReadout').textContent(), /隐藏/, 'never below zero');
  await $('#bdgZero').check(); m = await mark(); assert.ok(!m.hidden && m.text === '0', 'show-zero');
  await $('#bdgDot').check(); assert.ok((await mark()).dot, 'dot mode');
  await $('#bdgDot').uncheck(); await $('#bdgZero').uncheck();

  // tabs clear the unread badge
  await page.locator('#bdgTabs button[data-clear]').click();
  assert.ok(await page.locator('#bdgTabs button[data-clear] .zh-bdg-mark').evaluate((e) => e.classList.contains('is-hidden')));

  // closable tags + FLIP removal, add, duplicate guard
  const tags = () => page.locator('#tagClosable .zh-tag').count();
  assert.equal(await tags(), 4);
  await page.locator('#tagClosable .zh-tag-close').first().click(); await wait(page, 500);
  assert.equal(await tags(), 3); assert.match(await $('#tagMsg').textContent(), /已移除「设计」/);
  await page.locator('#tagClosable .zh-tag-add').click();
  await page.keyboard.type('增长'); await page.keyboard.press('Enter'); await wait(page, 100);
  assert.equal(await tags(), 4); assert.ok((await page.locator('#tagClosable').textContent()).includes('增长'));
  await page.locator('#tagClosable .zh-tag-add').click(); await page.keyboard.type('增长'); await page.keyboard.press('Enter');
  assert.match(await $('#tagMsg').textContent(), /已存在/); assert.equal(await tags(), 4);
  await page.locator('#tagClosable .zh-tag-add').click(); await page.keyboard.type('取消'); await page.keyboard.press('Escape');
  assert.equal(await tags(), 4, 'Escape cancels adding');
  await $('#tagReset').click(); assert.equal(await tags(), 4);
  assert.ok((await page.locator('#tagClosable').textContent()).includes('设计'));

  // single-select: arrow keys move and select; multi-select toggles
  await page.locator('#tagRadio [aria-checked=true]').focus(); await page.keyboard.press('ArrowRight');
  assert.match(await $('#tagRadioOut').textContent(), /近 7 天/);
  assert.equal(await page.locator('#tagRadio [aria-checked=true]').count(), 1);
  await page.locator('#tagMulti [role=checkbox]').nth(2).click();
  assert.match(await $('#tagMultiOut').textContent(), /已选 3 项/);

  // avatars: initials rule, deterministic colour, broken image fallback
  const av = await page.evaluate(() => {
    const t = (n) => { const e = document.querySelector('.zh-avatar[data-name="' + n + '"]'); return e && { text: e.querySelector('.zh-avatar-face')?.textContent.trim(), av: e.style.getPropertyValue('--av'), label: e.getAttribute('aria-label') }; };
    return { zh: t('张三'), en: t('Ada Lovelace'), broken: t('失败回退'), icon: document.querySelector('.zh-avatar[data-icon] .ico') !== null, all: [...document.querySelectorAll('#avGroup .zh-avatar[data-name="张三"]')].map((e) => e.style.getPropertyValue('--av')) };
  });
  assert.equal(av.zh.text, '张'); assert.equal(av.en.text, 'AL'); assert.equal(av.broken.text, '失', 'broken image falls back to initials'); assert.ok(av.icon);
  assert.match(av.zh.av, /var\(--zh-chart-[1-8]\)/); assert.equal(av.zh.av, av.all[0], 'same name -> same colour');
  assert.equal(av.zh.label, '张三');

  // "+N" popover: opens, lists the rest, Esc closes and restores focus
  const more = page.locator('#avGroup .is-more');
  await more.click(); await wait(page, 200);
  assert.equal(await page.locator('.zh-avatar-pop li').count(), 4);
  assert.equal(await more.getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Escape'); await wait(page, 250);
  assert.equal(await page.locator('.zh-avatar-pop').count(), 0);
  assert.ok(await more.evaluate((e) => e === document.activeElement), 'focus returns to the +N button');
}

async function contrast(page) {
  for (const mode of ['light', 'dark']) {
    await page.evaluate((m) => document.documentElement.setAttribute('data-mode', m), mode);
    const bad = await page.evaluate(() => {
      const lum = (c) => { const v = c.map((x) => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
      const rgb = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
      const out = []; let n = 0;
      document.querySelectorAll('#badge .zh-bdg-mark:not(.is-dot)').forEach((m) => { n++;
        const cs = getComputedStyle(m), a = lum(rgb(cs.backgroundColor)), b = lum(rgb(cs.color)), r = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
        if (r < 4.5) out.push(m.dataset.tone + ' ' + r.toFixed(2));
      });
      if (n < 10) out.push('only ' + n + ' marks checked');
      return out;
    });
    assert.deepEqual(bad, [], `badge contrast in ${mode}`);
  }
  await page.evaluate(() => document.documentElement.setAttribute('data-mode', 'light'));
}

async function sweep(browser) {
  const problems = [];
  for (const vw of [390, 820, 1440]) {
    const p = await browser.newPage({ viewport: { width: vw, height: 800 } });
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    for (const aud of ['b', 'c']) for (const mode of ['light', 'dark']) for (const den of ['compact', 'comfortable']) {
      await p.goto(`${url}?only=badge&audience=${aud}&mode=${mode}&density=${den}`); await p.waitForTimeout(150);
      const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (over > 1 || errs.length) { problems.push(`${vw} ${aud}/${mode}/${den}: overflow ${over} ${errs.join('|')}`); errs.length = 0; }
    }
    await p.close();
  }
  assert.deepEqual(problems, []);
}

for (const [name, eng] of Object.entries(ENGINES)) {
  const browser = await eng.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto(url + '?only=badge'); await wait(page, 300);
    await interactions(page); await contrast(page);
    assert.deepEqual(errs, [], 'console/page errors');
    await sweep(browser);
    console.log('ok  ', name);
  } catch (e) { failed++; console.log('FAIL', name, e.message.split('\n')[0]); }
  await browser.close();
}
process.exit(failed ? 1 : 0);
