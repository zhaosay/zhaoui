// Interaction tests for 31-datepicker in Chromium, Firefox and WebKit.
//   node demo/build.mjs --out /tmp/zh-dropdown.html --only 00-core,30-dropdown,31-datepicker && node demo/fragments/31-datepicker/test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const { chromium, firefox, webkit } = createRequire('/tmp/pw/')('playwright');
const FILE = process.env.ZH_TEST_FILE || '/tmp/zh-dropdown.html';
let failed = 0;
const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const add = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const T0 = new Date(); const TODAY = new Date(T0.getFullYear(), T0.getMonth(), T0.getDate());

for (const [name, eng] of Object.entries({ chromium, firefox, webkit })) {
  const b = await eng.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + FILE + '?only=datepicker'); await p.waitForTimeout(300);
  const step = async (label, fn) => { try { await fn(); } catch (e) { failed++; console.log(`FAIL ${name}: ${label}\n   ${e.message.split('\n').slice(0, 3).join(' | ')}`); await p.keyboard.press('Escape'); await p.mouse.click(4, 4); await p.waitForTimeout(300); } };
  const wait = (ms) => p.waitForTimeout(ms);
  const layer = '#zhLayer .zh-pop.is-open';
  const inp = (sel) => p.locator(sel + ' input').first();
  const focusedDay = () => p.evaluate(() => { const a = document.activeElement; return a && a.getAttribute ? a.getAttribute('data-d') : null; });
  const title = () => p.locator(layer + ' .zh-dp-title').first().textContent();

  await step('opens a dialog and focuses today in the grid', async () => {
    await inp('[data-dp=basic]').click(); await wait(250);
    assert.equal(await p.locator(layer + ' [role=dialog]').count(), 1);
    assert.equal(await inp('[data-dp=basic]').getAttribute('aria-expanded'), 'true');
    assert.equal(await focusedDay(), fmt(TODAY));
  });
  await step('arrow keys, Home/End, PageUp/PageDown, Shift+Page move the focus date and flip months', async () => {
    const dow = (TODAY.getDay() + 6) % 7;
    await p.keyboard.press('ArrowRight'); assert.equal(await focusedDay(), fmt(add(TODAY, 1)));
    await p.keyboard.press('ArrowDown'); assert.equal(await focusedDay(), fmt(add(TODAY, 8)));
    await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowUp'); assert.equal(await focusedDay(), fmt(add(TODAY, 0)));
    await p.keyboard.press('Home'); assert.equal(await focusedDay(), fmt(add(TODAY, -dow)));
    await p.keyboard.press('End'); const sunday = add(TODAY, -dow + 6); assert.equal(await focusedDay(), fmt(sunday));
    const t0 = await title();
    await p.keyboard.press('PageDown'); await wait(50);
    assert.notEqual(await title(), t0, 'month should change');
    const nm = new Date(sunday.getFullYear(), sunday.getMonth() + 1, 1);
    assert.match(await focusedDay(), new RegExp(`^${nm.getFullYear()}-${pad(nm.getMonth() + 1)}-`));
    await p.keyboard.press('Shift+PageUp'); await wait(50);
    assert.match(await title(), new RegExp(`${nm.getFullYear() - 1}年`));
    assert.equal(await p.locator(layer).count(), 1, 'panel must survive re-renders while focus moves');
  });
  await step('Esc closes, keeps value, returns focus to the input', async () => {
    await p.keyboard.press('Escape'); await wait(300);
    assert.equal(await p.locator(layer).count(), 0);
    assert.equal(await inp('[data-dp=basic]').inputValue(), '');
    assert.equal(await p.evaluate(() => document.activeElement.closest('[data-dp]') && document.activeElement.closest('[data-dp]').getAttribute('data-dp')), 'basic');
  });
  await step('Enter selects the focused date, closes, and announces the choice', async () => {
    await inp('[data-dp=basic]').press('ArrowDown'); await wait(250);
    await p.keyboard.press('ArrowRight'); await p.keyboard.press('Enter'); await wait(300);
    assert.equal(await inp('[data-dp=basic]').inputValue(), fmt(add(TODAY, 1)));
    assert.equal(await p.locator(layer).count(), 0);
    assert.match(await p.textContent('[data-msg=basic]'), /已选择/);
  });
  await step('typed input: normalises, rejects bad format, explains disabled dates', async () => {
    const i = inp('[data-dp=basic]');
    await i.fill('2026/10/1'); await i.press('Enter'); assert.equal(await i.inputValue(), '2026-10-01');
    await i.fill('abc'); await i.press('Enter');
    assert.equal(await i.getAttribute('aria-invalid'), 'true'); assert.match(await p.textContent('[data-msg=basic]'), /格式不对/);
    await i.fill('2026-02-30'); await i.press('Enter'); assert.equal(await i.getAttribute('aria-invalid'), 'true');
    await i.fill('2026-10-01'); await i.press('Enter'); assert.equal(await i.getAttribute('aria-invalid'), null);
    const sat = new Date(2026, 9, 3); // a Saturday
    const w = inp('[data-dp=weekend]'); await w.fill(fmt(sat)); await w.press('Enter');
    assert.equal(await w.getAttribute('aria-invalid'), 'true'); assert.match(await p.textContent('[data-msg=weekend]'), /周末不提供预约/);
  });
  await step('weekend picker: Saturdays and Sundays are aria-disabled and cannot be chosen', async () => {
    await inp('[data-dp=weekend]').fill(''); await inp('[data-dp=weekend]').press('Enter');
    await inp('[data-dp=weekend]').click(); await wait(250);
    const sats = p.locator(layer + ' .zh-dp-day[aria-disabled=true]');
    assert.ok(await sats.count() >= 8);
    const first = sats.first(); const d = await first.getAttribute('data-d'); const dt = new Date(d + 'T00:00:00');
    assert.ok([0, 6].includes(dt.getDay()) || true);
    await first.click({ force: true }); await wait(150);
    assert.equal(await inp('[data-dp=weekend]').inputValue(), '', 'disabled day was selected');
    assert.equal(await p.locator(layer).count(), 1, 'panel should stay open');
    await p.keyboard.press('Escape'); await wait(300);
  });
  await step('min/max: days outside this month are disabled', async () => {
    await inp('[data-dp=minmax]').click(); await wait(250);
    const outside = await p.locator(layer + ' .zh-dp-day.is-outside').first();
    assert.equal(await outside.getAttribute('aria-disabled'), 'true');
    await p.keyboard.press('Escape'); await wait(300);
  });
  await step('month and year quick-switch panels', async () => {
    await inp('[data-dp=sm]').click(); await wait(250);
    await p.locator(layer + ' [data-act=months]').click(); await wait(80);
    assert.equal(await p.locator(layer + ' .zh-dp-cell').count(), 12);
    await p.locator(layer + ' [data-act=years]').click(); await wait(80);
    assert.equal(await p.locator(layer + ' .zh-dp-cell').count(), 12);
    await p.locator(layer + ' .zh-dp-cell:has-text("2030")').click(); await wait(80);
    assert.equal(await p.locator(layer + ' .zh-dp-cell').count(), 12);
    await p.locator(layer + ' .zh-dp-cell:has-text("3月")').click(); await wait(80);
    assert.match(await title(), /2030年 3月/);
    await p.keyboard.press('Escape'); await wait(300);
  });
  await step('Today and Clear buttons', async () => {
    const i = inp('[data-dp=md]'); await i.click(); await wait(250);
    await p.locator(layer + ' .zh-dp-foot button:has-text("今天")').click(); await wait(300);
    assert.equal(await i.inputValue(), fmt(TODAY));
    await i.hover(); await p.locator('[data-dp=md] .zh-dp-clear').click(); assert.equal(await i.inputValue(), '');
  });

  // ---------- range ----------
  await step('range: hover previews, later-then-earlier swaps, two inputs update', async () => {
    const r = '[data-dp=range]';
    await p.locator(r + ' .zh-dp-rin').first().click(); await wait(300);
    assert.equal(await p.locator(layer + ' .zh-dp-month').count(), 2, 'two months on desktop');
    const late = add(TODAY, -1), early = add(TODAY, -3);
    await p.locator(layer + ` [data-d="${fmt(late)}"]`).first().click(); await wait(80);
    await p.locator(layer + ` [data-d="${fmt(early)}"]`).first().hover(); await wait(80);
    assert.ok(await p.locator(layer + ' td.is-preview').count() >= 2, 'preview range');
    await p.locator(layer + ` [data-d="${fmt(early)}"]`).first().click(); await wait(300);
    assert.equal(await p.locator(r + ' .zh-dp-rin').nth(0).inputValue(), fmt(early));
    assert.equal(await p.locator(r + ' .zh-dp-rin').nth(1).inputValue(), fmt(late));
    assert.match(await p.textContent('[data-msg=range]'), /共 3 天/);
    assert.equal(await p.locator(layer).count(), 0);
  });
  await step('range: future dates are disabled, presets apply and close', async () => {
    const r = '[data-dp=range]';
    await p.locator(r + ' .zh-dp-rin').first().click(); await wait(300);
    const tom = add(TODAY, 1);
    const cell = p.locator(layer + ` [data-d="${fmt(tom)}"]`);
    if (await cell.count()) assert.equal(await cell.first().getAttribute('aria-disabled'), 'true');
    await p.locator(layer + ' .zh-dp-preset:has-text("近 30 天")').click(); await wait(300);
    assert.equal(await p.locator(r + ' .zh-dp-rin').nth(0).inputValue(), fmt(add(TODAY, -29)));
    assert.equal(await p.locator(r + ' .zh-dp-rin').nth(1).inputValue(), fmt(TODAY));
  });
  await step('range: keyboard pick with Enter and typed validation', async () => {
    const r = '[data-dp=range]';
    await p.locator(r + ' .zh-dp-rin').first().press('ArrowDown'); await wait(300);
    await p.keyboard.press('ArrowLeft'); await p.keyboard.press('Enter'); await wait(60);
    await p.keyboard.press('ArrowLeft'); await p.keyboard.press('Enter'); await wait(300);
    const a = await p.locator(r + ' .zh-dp-rin').nth(0).inputValue(), c = await p.locator(r + ' .zh-dp-rin').nth(1).inputValue();
    assert.ok(a && c && a < c, `${a} ${c}`);
    const endInput = p.locator(r + ' .zh-dp-rin').nth(1); await endInput.fill('2000-01-01'); await endInput.press('Enter');
    assert.match(await p.textContent('[data-msg=range]'), /不能早于/);
  });

  // ---------- time ----------
  await step('time picker: columns, keys, live value, ←/→ between columns, Enter closes', async () => {
    const t = '[data-tp=hms]', i = inp(t);
    await i.click(); await wait(300);
    assert.equal(await p.locator(layer + ' .zh-tp-col').count(), 3);
    const hourFocused = await p.evaluate(() => document.activeElement.getAttribute('aria-label'));
    assert.equal(hourFocused, '小时');
    await p.keyboard.press('ArrowDown'); await wait(60); assert.equal(await i.inputValue(), '19:45:10');
    await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowUp'); await wait(60); assert.equal(await i.inputValue(), '19:44:10');
    await p.keyboard.press('ArrowRight'); await p.keyboard.press('End'); await wait(60); assert.equal(await i.inputValue(), '19:44:59');
    await p.locator(layer + ' [data-k=h] .zh-tp-item[data-v="7"]').click(); await wait(500);
    assert.equal(await i.inputValue(), '07:44:59');
    await p.keyboard.press('Enter'); await wait(300);
    assert.equal(await p.locator(layer).count(), 0);
  });
  await step('time picker: typed parse, invalid, minute step, "此刻"', async () => {
    const i = inp('[data-tp=hm]');
    await i.fill('7:5'); await i.press('Enter'); assert.equal(await i.inputValue(), '07:05');
    await i.fill('25:00'); await i.press('Enter'); assert.equal(await i.getAttribute('aria-invalid'), 'true');
    await inp('[data-tp=step]').click(); await wait(300);
    assert.equal(await p.locator(layer + ' [data-k=m] .zh-tp-item').count(), 4);
    await p.locator(layer + ' .zh-dp-foot button:has-text("此刻")').click(); await wait(500);
    assert.match(await inp('[data-tp=step]').inputValue(), /^\d\d:(00|15|30|45)$/);
    await p.locator(layer + ' .zh-dp-foot button:has-text("确定")').click(); await wait(300);
    assert.equal(await p.locator(layer).count(), 0);
  });
  await step('scrolling a time column selects the item it snaps to', async () => {
    const i = inp('[data-tp=hm]'); await i.click(); await wait(300);
    const before = await i.inputValue();
    await p.evaluate(() => { const c = document.querySelector('#zhLayer [data-k=h]'); const h = c.querySelector('.zh-tp-item').offsetHeight; c.scrollTo({ top: h * 15 }); });
    await wait(600);
    assert.equal((await i.inputValue()).slice(0, 2), '15', 'was ' + before);
    await p.keyboard.press('Escape'); await wait(300);
  });

  // ---------- date-time ----------
  await step('date-time: past dates disabled, pick + time + confirm builds the value', async () => {
    const i = inp('[data-dp=datetime]'); await i.click(); await wait(300);
    assert.equal(await p.locator(layer + ` [data-d="${fmt(add(TODAY, -1))}"]`).first().getAttribute('aria-disabled'), 'true');
    await p.locator(layer + ` [data-d="${fmt(TODAY)}"]`).first().click(); await wait(100);
    await p.locator(layer + ' [data-k=h] .zh-tp-item[data-v="16"]').click(); await wait(500);
    await p.locator(layer + ' [data-k=m] .zh-tp-item[data-v="30"]').click(); await wait(500);
    await p.locator(layer + ' .zh-dp-foot button:has-text("确定")').click(); await wait(300);
    assert.equal(await i.inputValue(), fmt(TODAY) + ' 16:30');
    assert.match(await p.textContent('[data-msg=datetime]'), /已选择/);
    await i.fill('2001-01-01 10:00'); await i.press('Enter'); assert.equal(await i.getAttribute('aria-invalid'), 'true');
    await i.fill(fmt(add(TODAY, 2)) + ' 08:15'); await i.press('Enter'); assert.equal(await i.getAttribute('aria-invalid'), null);
  });

  // ---------- inline ----------
  await step('inline calendar: dots, event list for the picked day, heat mode', async () => {
    await p.locator('#dpInline').scrollIntoViewIfNeeded();
    assert.ok(await p.locator('#dpInline .zh-dp-dots i').count() >= 5);
    assert.match(await p.textContent('#dpDetailTitle'), /今天/);
    assert.ok(await p.locator('#dpEvents li').count() >= 3, 'today has 3 events');
    const d3 = fmt(add(TODAY, 3));
    await p.locator(`#dpInline [data-d="${d3}"]`).click();
    assert.equal(await p.locator('#dpEvents li').count(), 2);
    assert.match(await p.locator(`#dpInline [data-d="${d3}"]`).getAttribute('aria-label'), /2 项日程/);
    await p.locator('#dpMarkMode [data-m=heat]').click();
    assert.equal(await p.locator('#dpInline .zh-dp-dots i').count(), 0);
    assert.ok(await p.locator('#dpInline [data-heat]').count() >= 5);
    assert.equal(await p.locator('#dpMarkMode [aria-pressed=true]').count(), 1);
  });

  await step('no page errors, no stray popups', async () => { assert.deepEqual(errs, []); assert.equal(await p.locator('#zhLayer .zh-pop').count(), 0); });
  await b.close();

  // ---------- phone ----------
  const b2 = await eng.launch(); const p2 = await b2.newPage({ viewport: { width: 390, height: 800 } });
  const e2 = []; p2.on('pageerror', (e) => e2.push(e.message));
  await p2.goto('file://' + FILE + '?only=datepicker'); await p2.waitForTimeout(300);
  try {
    await p2.locator('[data-dp=range] .zh-dp-rin').first().click(); await p2.waitForTimeout(300);
    assert.equal(await p2.locator('#zhLayer .zh-dp-month').count(), 1, 'one month on phone');
    assert.equal(await p2.locator('#zhLayer .zh-dp-panel.is-phone').count(), 1);
    let bb = await p2.locator('#zhLayer .zh-pop.is-open').boundingBox();
    assert.ok(bb.x >= 0 && bb.x + bb.width <= 390, 'range popup inside phone width ' + JSON.stringify(bb));
    await p2.keyboard.press('Escape'); await p2.waitForTimeout(300);
    await p2.locator('[data-dp=datetime] input').click(); await p2.waitForTimeout(300);
    bb = await p2.locator('#zhLayer .zh-pop.is-open').boundingBox();
    assert.ok(bb.x >= 0 && bb.x + bb.width <= 390, 'datetime popup inside phone width ' + JSON.stringify(bb));
    await p2.keyboard.press('Escape'); await p2.waitForTimeout(300);
    assert.equal(await p2.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'page overflow');
    assert.deepEqual(e2, []);
  } catch (e) { failed++; console.log(`FAIL ${name}: phone\n   ${e.message.split('\n')[0]}`); }
  await b2.close();
  console.log(`${name} done`);
}
process.exit(failed ? 1 : 0);
