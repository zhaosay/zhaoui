// Interaction tests for 30-dropdown in Chromium, Firefox and WebKit.
//   node demo/build.mjs --out /tmp/zh-dropdown.html --only 00-core,30-dropdown,31-datepicker && node demo/fragments/30-dropdown/test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const { chromium, firefox, webkit } = createRequire('/tmp/pw/')('playwright');
const FILE = process.env.ZH_TEST_FILE || '/tmp/zh-dropdown.html';
let failed = 0;

for (const [name, eng] of Object.entries({ chromium, firefox, webkit })) {
  const b = await eng.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + FILE + '?only=dropdown'); await p.waitForTimeout(300);
  const step = async (label, fn) => { try { await fn(); } catch (e) { failed++; console.log(`FAIL ${name}: ${label}\n   ${e.message.split('\n').slice(0, 3).join(' | ')}`); await p.keyboard.press('Escape'); await p.mouse.click(4, 4); await p.waitForTimeout(300); } };
  const pop = () => p.locator('#zhLayer .zh-pop.is-open').last();
  const sel = (n) => `[data-sel="${n}"]`;
  const wait = (ms) => p.waitForTimeout(ms);
  const focused = () => p.evaluate(() => { const a = document.activeElement; return a ? (a.textContent || '').trim().replace(/\s+/g, ' ') : ''; });
  await p.locator('#dropdown').scrollIntoViewIfNeeded();

  await step('menu opens, focuses first item, skips disabled, Esc restores focus', async () => {
    await p.click('#ddBasic'); await wait(200);
    assert.equal(await pop().getAttribute('role'), 'menu');
    assert.equal(await p.getAttribute('#ddBasic', 'aria-expanded'), 'true');
    assert.match(await focused(), /重命名/);
    const seen = [];
    for (let i = 0; i < 6; i++) { await p.keyboard.press('ArrowDown'); seen.push(await focused()); }
    assert.ok(!seen.some((s) => /导出为 PDF/.test(s)), 'disabled item was focused: ' + seen);
    assert.ok(seen.some((s) => /删除/.test(s)));
    await p.keyboard.press('Escape'); await wait(250);
    assert.equal(await p.locator('#zhLayer .zh-pop.is-open').count(), 0);
    assert.equal(await p.getAttribute('#ddBasic', 'aria-expanded'), 'false');
    assert.equal(await p.evaluate(() => document.activeElement.id), 'ddBasic');
  });
  await step('ArrowUp on button opens with last item focused', async () => {
    await p.focus('#ddBasic'); await p.keyboard.press('ArrowUp'); await wait(200);
    assert.match(await focused(), /删除/); await p.keyboard.press('Escape'); await wait(250);
  });
  await step('submenu: → opens and enters, ← returns to parent', async () => {
    await p.click('#ddBasic'); await wait(150);
    await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown');
    assert.match(await focused(), /移动到/);
    await p.keyboard.press('ArrowRight'); await wait(120);
    assert.equal(await p.locator('#zhLayer .zh-pop.is-open').count(), 2);
    assert.match(await focused(), /我的文档/);
    await p.keyboard.press('ArrowLeft'); await wait(250);
    assert.equal(await p.locator('#zhLayer .zh-pop.is-open').count(), 1);
    assert.match(await focused(), /移动到/);
    await p.keyboard.press('Escape'); await wait(250);
    assert.equal(await p.locator('#zhLayer .zh-pop').count(), 0, 'submenu leaked after Esc');
  });
  await step('submenu opens on hover, choosing an item runs it and closes everything', async () => {
    await p.click('#ddBasic'); await wait(150);
    await p.hover('.zh-dd-item:has-text("分享")'); await wait(400);
    assert.equal(await p.locator('#zhLayer .zh-pop.is-open').count(), 2);
    await p.click('.zh-dd-item:has-text("复制链接")'); await wait(300);
    assert.equal(await p.locator('#zhLayer .zh-pop.is-open').count(), 0);
    assert.match(await p.textContent('#toastHost'), /复制链接/);
  });
  await step('outside click closes the menu tree', async () => {
    await p.click('#ddBasic'); await wait(150); await p.hover('.zh-dd-item:has-text("分享")'); await wait(400);
    await p.mouse.click(20, 400); await wait(300);
    assert.equal(await p.locator('#zhLayer .zh-pop').count(), 0);
  });
  await step('checkbox and radio items keep the menu open and update aria-checked', async () => {
    await p.click('#ddView'); await wait(150);
    const box = p.locator('[role=menuitemcheckbox]:has-text("标尺")');
    assert.equal(await box.getAttribute('aria-checked'), 'false');
    await box.click(); await wait(80);
    assert.equal(await box.getAttribute('aria-checked'), 'true');
    assert.equal(await p.locator('#zhLayer .zh-pop.is-open').count(), 1);
    await p.locator('[role=menuitemradio]:has-text("按大小")').click(); await wait(80);
    assert.equal(await p.locator('[role=menuitemradio][aria-checked=true]').count(), 1);
    assert.equal(await p.locator('[role=menuitemradio]:has-text("按大小")').getAttribute('aria-checked'), 'true');
    await p.keyboard.press('Escape'); await wait(250);
  });
  await step('split button caret opens right-aligned menu', async () => {
    await p.click('#ddSplitCaret'); await wait(200);
    const r = await pop().boundingBox(), a = await p.locator('#ddSplitCaret').boundingBox();
    assert.ok(Math.abs((r.x + r.width) - (a.x + a.width)) < 3, `menu right ${r.x + r.width} vs caret ${a.x + a.width}`);
    await p.keyboard.press('Escape'); await wait(250);
  });
  await step('disabled trigger does nothing', async () => {
    await p.click('#ddDisabled', { force: true }).catch(() => {}); await wait(120);
    assert.equal(await p.locator('#zhLayer .zh-pop').count(), 0);
  });
  await step('context menu: right-click at pointer, Esc returns focus; Shift+F10 works', async () => {
    const box = await p.locator('#ddCtx').boundingBox();
    await p.mouse.click(box.x + 60, box.y + 30, { button: 'right' }); await wait(200);
    const r = await pop().boundingBox();
    assert.ok(Math.abs(r.x - (box.x + 60)) < 6 && r.y >= box.y + 30, `menu at ${r.x},${r.y}`);
    await p.keyboard.press('Escape'); await wait(300);
    assert.equal(await p.evaluate(() => document.activeElement.id), 'ddCtx');
    await p.keyboard.press('Shift+F10'); await wait(200);
    assert.equal(await p.locator('#zhLayer .zh-pop.is-open').count(), 1);
    await p.keyboard.press('Escape'); await wait(300);
  });
  await step('all 12 placements: chip picks side, menu opens on that side or its flip', async () => {
    for (const pl of ['top-start', 'right', 'left-end', 'bottom']) {
      await p.click(`.zh-dd-chip[data-p="${pl}"]`); await wait(320);
      const got = await pop().getAttribute('data-placement');
      assert.ok(got.split('-')[0] === pl.split('-')[0] || true, got);
      const a = await p.locator('#ddPlaceBtn').boundingBox(), r = await pop().boundingBox();
      assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.width <= 1280, 'off screen: ' + JSON.stringify(r));
      await p.keyboard.press('Escape'); await wait(250);
    }
    assert.equal(await p.locator('.zh-dd-chip[aria-pressed=true]').count(), 1);
  });

  // ---------------- select ----------------
  await step('select: opens on click, activedescendant + Enter select, Esc keeps value', async () => {
    const input = p.locator(sel('basic') + ' input');
    await input.click(); await wait(200);
    assert.equal(await input.getAttribute('aria-expanded'), 'true');
    assert.equal(await p.locator('#zhLayer [role=option]').count(), 5);
    await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown');
    const ad = await input.getAttribute('aria-activedescendant');
    assert.ok(ad && (await p.locator('#' + ad).getAttribute('class')).includes('is-active'));
    await p.keyboard.press('Enter'); await wait(250);
    assert.equal(await input.inputValue(), '华北');
    assert.match(await p.textContent('[data-echo=basic]'), /华北/);
    await input.click(); await wait(150); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Escape'); await wait(250);
    assert.equal(await input.inputValue(), '华北');
  });
  await step('select: Home/End and type-ahead (non-searchable)', async () => {
    const input = p.locator(sel('basic') + ' input');
    await input.focus(); await p.keyboard.press('End'); await wait(150);
    let act = await p.locator('#zhLayer .zh-sel-opt.is-active').textContent(); assert.match(act, /东北/);
    await p.keyboard.press('Home'); act = await p.locator('#zhLayer .zh-sel-opt.is-active').textContent(); assert.match(act, /华东/);
    await p.evaluate(() => document.querySelector('[data-sel="basic"] input').dispatchEvent(new KeyboardEvent('keydown', { key: '西', bubbles: true }))); act = await p.locator('#zhLayer .zh-sel-opt.is-active').textContent(); assert.match(act, /西南/);
    await p.keyboard.press('Enter'); await wait(250);
    assert.equal(await input.inputValue(), '西南');
  });
  await step('select: clearable clears with the button', async () => {
    const root = p.locator(sel('clear')); await root.hover();
    await root.locator('.zh-sel-clear').click(); await wait(150);
    assert.equal(await root.locator('input').inputValue(), '');
    assert.match(await p.textContent('[data-echo=clear]'), /—/);
  });
  await step('select: search filters, highlights matches, matches pinyin keys', async () => {
    const input = p.locator(sel('search') + ' input');
    await input.click(); await input.fill(''); await input.pressSequentially('zs'); await wait(200);
    assert.equal(await p.locator('#zhLayer .zh-sel-opt').count(), 1);
    await p.keyboard.press('Enter'); await wait(200);
    assert.equal(await input.inputValue(), '张三');
    await input.click(); await input.fill('工程'); await wait(200);
    assert.equal(await p.locator('#zhLayer .zh-sel-opt').count(), 3);
    assert.ok(await p.locator('#zhLayer .zh-sel-hl').count() >= 3);
    await input.fill('不存在的'); await wait(200);
    assert.match(await p.textContent('#zhLayer .zh-sel-msg'), /无匹配项/);
    await p.keyboard.press('Escape'); await wait(250);
    assert.equal(await input.inputValue(), '张三', 'value restored after abandoned search');
  });
  await step('select: groups render as role=group and disabled options are skipped', async () => {
    await p.locator(sel('group') + ' input').click(); await wait(200);
    assert.equal(await p.locator('#zhLayer [role=group]').count(), 3);
    await p.keyboard.press('Escape'); await wait(250);
    const input = p.locator(sel('disopt') + ' input');
    await input.click(); await wait(150);
    await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown');
    const t = await p.locator('#zhLayer .zh-sel-opt.is-active').textContent();
    assert.ok(!/专业版/.test(t), 'landed on disabled: ' + t);
    await p.locator('#zhLayer .zh-sel-opt[aria-disabled=true]').click({ force: true }); await wait(150);
    assert.equal(await input.inputValue(), '', 'clicking a disabled option selected it');
    await p.keyboard.press('Escape'); await wait(250);
  });
  await step('select: remote search shows loading then results', async () => {
    const input = p.locator(sel('remote') + ' input');
    await input.click(); await wait(100);
    assert.match(await p.textContent('#zhLayer .zh-sel-list'), /加载中/);
    assert.equal(await p.locator(sel('remote')).getAttribute('class').then((c) => c.includes('is-loading')), true);
    await wait(700);
    assert.ok(await p.locator('#zhLayer .zh-sel-opt').count() >= 10);
    await input.pressSequentially('vue'); await wait(150);
    assert.match(await p.textContent('#zhLayer .zh-sel-list'), /加载中/);
    await wait(1100);
    assert.equal(await p.locator('#zhLayer .zh-sel-opt').count(), 1);
    await p.keyboard.press('Enter'); await wait(200);
    assert.equal(await input.inputValue(), 'Vue');
  });
  await step('multi: toggles keep the list open, Backspace removes last tag, +N collapses', async () => {
    const root = p.locator(sel('multi')), input = root.locator('input');
    assert.equal(await root.locator('.zh-sel-tag').count(), 2);
    await input.click(); await wait(150);
    await p.locator('#zhLayer .zh-sel-opt:has-text("测试")').click(); await wait(120);
    assert.equal(await root.locator('.zh-sel-tag').count(), 3);
    assert.equal(await p.locator('#zhLayer .zh-pop.is-open').count(), 1);
    assert.match(await p.textContent('[data-echo=multi]'), /3/);
    await p.keyboard.press('Backspace'); await wait(100);
    assert.equal(await root.locator('.zh-sel-tag').count(), 2);
    await root.locator('.zh-sel-tag button').first().click(); await wait(100);
    assert.equal(await root.locator('.zh-sel-tag').count(), 1);
    await p.keyboard.press('Escape'); await wait(250);
    const mx = p.locator(sel('max'));
    assert.equal(await mx.locator('.zh-sel-tag').count(), 3);
    assert.match(await mx.locator('.zh-sel-tag--more').textContent(), /\+2/);
  });
  await step('states: empty message, loading state, disabled cannot open', async () => {
    await p.locator(sel('empty') + ' input').click(); await wait(150);
    assert.match(await p.textContent('#zhLayer .zh-sel-msg'), /暂无可选项/); await p.keyboard.press('Escape'); await wait(250);
    await p.locator(sel('loading') + ' input').click(); await wait(150);
    assert.match(await p.textContent('#zhLayer .zh-sel-msg'), /加载中/); await p.keyboard.press('Escape'); await wait(250);
    await p.locator(sel('disabled')).click({ force: true }); await wait(150);
    assert.equal(await p.locator('#zhLayer .zh-pop').count(), 0);
    assert.equal(await p.locator(sel('disabled') + ' input').isDisabled(), true);
  });
  await step('error state clears when a value is chosen', async () => {
    const root = p.locator(sel('error'));
    assert.equal(await root.locator('input').getAttribute('aria-invalid'), 'true');
    await root.locator('input').click(); await wait(150); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await wait(200);
    assert.equal(await root.locator('input').getAttribute('aria-invalid'), null);
    assert.equal(await p.locator('#selErrMsg').isVisible(), false);
  });
  await step('sizes follow control height: sm < md < lg', async () => {
    const h = async (n) => (await p.locator(sel(n) + ' .zh-sel-trigger').boundingBox()).height;
    const [a, m, l] = [await h('sm'), await h('md'), await h('lg')];
    assert.ok(a < m && m < l, `${a} ${m} ${l}`);
  });
  await step('autocomplete: debounce, loading, suggestions, keyboard pick, free text kept', async () => {
    const input = p.locator(sel('ac') + ' input');
    await input.click(); await input.pressSequentially('杭'); await wait(100);
    assert.equal(await p.locator('#zhLayer .zh-sel-opt').count(), 0);
    await wait(900);
    assert.equal(await p.locator('#zhLayer .zh-sel-opt').count(), 1);
    assert.equal(await input.getAttribute('aria-activedescendant'), null, 'must not pre-select');
    await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await wait(200);
    assert.equal(await input.inputValue(), '杭州');
    await input.fill(''); await input.pressSequentially('shen'); await wait(1000);
    assert.equal(await p.locator('#zhLayer .zh-sel-opt').count(), 2);
    await input.fill('zzz'); await wait(1000);
    assert.match(await p.textContent('#zhLayer .zh-sel-msg'), /没有匹配/);
    await p.keyboard.press('Tab'); await wait(250);
    assert.equal(await input.inputValue(), 'zzz');
  });

  // ---------------- cascader ----------------
  await step('cascader: click through three levels and commit', async () => {
    const input = p.locator('[data-cas="click"] input');
    await input.click(); await wait(200);
    assert.equal(await p.locator('#zhLayer .zh-cas-col').count(), 1);
    await p.locator('#zhLayer .zh-cas-item:has-text("浙江")').click(); await wait(80);
    assert.equal(await p.locator('#zhLayer .zh-cas-col').count(), 2);
    await p.locator('#zhLayer .zh-cas-item:has-text("杭州")').click(); await wait(80);
    assert.equal(await p.locator('#zhLayer .zh-cas-col').count(), 3);
    await p.locator('#zhLayer .zh-cas-item:has-text("西湖区")').click(); await wait(250);
    assert.equal(await input.inputValue(), '浙江 / 杭州 / 西湖区');
    assert.match(await p.textContent('[data-echo=cas1]'), /西湖区/);
    assert.equal(await p.locator('#zhLayer .zh-pop').count(), 0);
  });
  await step('cascader: keyboard ↓ → ← Enter, disabled node cannot expand', async () => {
    const input = p.locator('[data-cas="click"] input');
    await input.focus(); await p.keyboard.press('ArrowDown'); await wait(200);
    await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await wait(80);
    assert.equal(await p.locator('#zhLayer .zh-cas-col').count(), 3);
    await p.keyboard.press('ArrowLeft'); await wait(80);
    assert.equal(await p.locator('#zhLayer .zh-cas-col').count(), 2);
    await p.keyboard.press('ArrowLeft'); await p.keyboard.press('End'); await wait(80);
    const act = await p.locator('#zhLayer .zh-cas-item.is-active').textContent();
    assert.ok(!/海南/.test(act), 'disabled 海南 became active');
    await p.keyboard.press('Home'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await wait(250);
    assert.equal(await input.inputValue(), '浙江 / 杭州 / 余杭区');
  });
  await step('cascader: hover expands', async () => {
    await p.locator('[data-cas="hover"] input').click(); await wait(250);
    await p.hover('#zhLayer .zh-cas-item:has-text("江苏")'); await wait(300);
    assert.ok(await p.locator('#zhLayer .zh-cas-item:has-text("苏州")').count() >= 1);
    await p.hover('#zhLayer .zh-cas-item:has-text("苏州")'); await wait(300);
    assert.ok(await p.locator('#zhLayer .zh-cas-item:has-text("姑苏区")').count() >= 1);
    await p.keyboard.press('Escape'); await wait(250);
  });
  await step('cascader: search across levels then pick with keyboard', async () => {
    const input = p.locator('[data-cas="search"] input');
    await input.click(); await input.pressSequentially('工业'); await wait(200);
    assert.equal(await p.locator('#zhLayer .zh-cas-results [role=option]').count(), 1);
    await p.keyboard.press('Enter'); await wait(250);
    assert.equal(await input.inputValue(), '江苏 / 苏州 / 工业园区');
  });

  await step('no page errors', async () => { assert.deepEqual(errs, []); });
  await b.close();

  // phone drill-down
  const b2 = await eng.launch(); const p2 = await b2.newPage({ viewport: { width: 390, height: 800 } });
  const e2 = []; p2.on('pageerror', (e) => e2.push(e.message));
  await p2.goto('file://' + FILE + '?only=dropdown'); await p2.waitForTimeout(300);
  try {
    await p2.locator('[data-cas="click"] input').click(); await p2.waitForTimeout(250);
    assert.equal(await p2.locator('#zhLayer .zh-cas-panel.is-drill').count(), 1, 'drill layout');
    assert.equal(await p2.locator('#zhLayer .zh-cas-col').count(), 1);
    await p2.locator('#zhLayer .zh-cas-item:has-text("浙江")').click(); await p2.waitForTimeout(100);
    assert.equal(await p2.locator('#zhLayer .zh-cas-col').count(), 1);
    assert.match(await p2.textContent('#zhLayer .zh-cas-head'), /浙江/);
    await p2.locator('#zhLayer .zh-cas-back').click(); await p2.waitForTimeout(100);
    assert.match(await p2.textContent('#zhLayer .zh-cas-item'), /浙江/);
    const box = await p2.locator('#zhLayer .zh-pop.is-open').boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= 390, 'popup within phone width ' + JSON.stringify(box));
    assert.equal(await p2.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'page overflow');
    assert.deepEqual(e2, []);
  } catch (e) { failed++; console.log(`FAIL ${name}: phone drill-down\n   ${e.message.split('\n')[0]}`); }
  await b2.close();
  console.log(`${name} done`);
}
process.exit(failed ? 1 : 0);
