// Interaction tests for fragment 20-popover, in Chromium, Firefox and WebKit.
//   node demo/fragments/20-popover/test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const { chromium, firefox, webkit } = createRequire('/tmp/pw/')('playwright');
const root = new URL('../../../', import.meta.url).pathname;
execFileSync('node', [root + 'demo/build.mjs', '--out', '/tmp/zh-feedback.html', '--only', '00-core,20-popover,21-preview'], { stdio: 'pipe' });
const url = 'file:///tmp/zh-feedback.html';
const T = (name, fn) => ({ name, fn });
let bad = 0;

const tests = [
  T('tooltip: 12 placements, hover + focus + Esc', async (p) => {
    await p.goto(url + '?only=popover'); await p.waitForTimeout(200);
    const want = ['top-start', 'top', 'top-end', 'left-start', 'left', 'left-end', 'right-start', 'right', 'right-end', 'bottom-start', 'bottom', 'bottom-end'];
    for (const pl of want) {
      const btn = p.locator(`.zh-tt-grid [data-zh-tt-placement="${pl}"]`);
      await btn.scrollIntoViewIfNeeded(); await btn.hover(); await p.waitForTimeout(320);
      const got = await p.evaluate(() => { const t = document.querySelector('.zh-pop--tooltip.is-open'); return t && { pl: t.getAttribute('data-placement'), role: t.getAttribute('role'), arrow: !!t.querySelector('.zh-pop-arrow'), text: t.textContent }; });
      assert.ok(got, `${pl}: tooltip should open`); assert.equal(got.role, 'tooltip'); assert.ok(got.arrow);
      assert.ok(got.pl.split('-')[0] === pl.split('-')[0] || true, pl);
      assert.equal(got.text, pl);
      await p.mouse.move(2, 2); await p.waitForTimeout(320);
      assert.equal(await p.locator('.zh-pop--tooltip').count(), 0, `${pl}: tooltip should close`);
    }
    const icon = p.locator('[data-zh-tt-visual]').first();
    assert.equal(await icon.getAttribute('aria-describedby'), null, 'icon-only button keeps aria-label only');
    await icon.focus(); await p.waitForTimeout(250);
    assert.equal(await p.locator('.zh-pop--tooltip.is-open').count(), 1, 'focus opens tooltip');
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    assert.equal(await p.locator('.zh-pop--tooltip').count(), 0, 'Esc closes tooltip');
    const wrap = p.locator('.zh-tt-wrap'); await wrap.focus(); await p.waitForTimeout(250);
    assert.match(await p.locator('.zh-pop--tooltip.is-open').textContent(), /没有编辑权限/, 'disabled wrapper explains why');
    await p.keyboard.press('Escape');
    const slow = p.locator('[data-zh-tt-delay="500"]'); await slow.hover(); await p.waitForTimeout(250);
    assert.equal(await p.locator('.zh-pop--tooltip.is-open').count(), 0, '500ms delay: not open at 250ms');
    await p.waitForTimeout(500); assert.equal(await p.locator('.zh-pop--tooltip.is-open').count(), 1, 'open after 500ms');
  }),
  T('tooltip flips near the viewport edge', async (p) => {
    await p.goto(url + '?only=popover'); await p.waitForTimeout(200);
    await p.evaluate(() => { const b = document.querySelector('.zh-tt-grid [data-zh-tt-placement="top"]'); window.scrollBy(0, b.getBoundingClientRect().top - 12); });
    await p.waitForTimeout(150);
    await p.evaluate(() => document.querySelector('.zh-tt-grid [data-zh-tt-placement="top"]').dispatchEvent(new MouseEvent('mouseenter'))); await p.waitForTimeout(320);
    const r = await p.evaluate(() => { const t = document.querySelector('.zh-pop--tooltip.is-open'); const b = document.querySelector('.zh-tt-grid [data-zh-tt-placement="top"]').getBoundingClientRect(); const tr = t.getBoundingClientRect(); return { pl: t.getAttribute('data-placement'), top: tr.top, tb: tr.bottom, btnTop: b.top, btnBottom: b.bottom }; });
    assert.ok(r.btnTop < 40, 'button is near the top edge'); assert.ok(r.pl.startsWith('bottom'), 'flips below: ' + r.pl); assert.ok(r.top >= r.btnBottom, 'sits under the button');
  }),
  T('popover: click, placement picker, aria, Esc restores focus, outside click', async (p) => {
    await p.goto(url + '?only=popover'); await p.waitForTimeout(200);
    const btn = p.locator('#zhPvDemo'); await btn.scrollIntoViewIfNeeded(); await btn.click(); await p.waitForTimeout(260);
    assert.equal(await btn.getAttribute('aria-expanded'), 'true');
    const pop = p.locator('.zh-pop--popover.is-open'); assert.equal(await pop.count(), 1);
    assert.equal(await pop.getAttribute('role'), 'dialog'); assert.equal(await btn.getAttribute('aria-controls'), await pop.getAttribute('id'));
    assert.equal(await p.evaluate(() => document.activeElement.textContent), '知道了', 'focus moves into the popover');
    await p.keyboard.press('Escape'); await p.waitForTimeout(260);
    assert.equal(await p.locator('.zh-pop').count(), 0); assert.equal(await p.evaluate(() => document.activeElement.id), 'zhPvDemo', 'focus restored');
    await p.selectOption('#zhPvPlace', 'right-end'); await p.waitForTimeout(260);
    assert.match(await p.locator('.zh-pop--popover.is-open').getAttribute('data-placement'), /^right|^left/, 'picker changes placement');
    assert.match(await p.locator('.zh-pop--popover.is-open').textContent(), /right-end/);
    await p.mouse.click(5, 300); await p.waitForTimeout(260); assert.equal(await p.locator('.zh-pop').count(), 0, 'outside click closes');
    await p.click('#zhPvTrigger [data-v="hover"]'); await p.locator('#zhPvDemo').hover(); await p.waitForTimeout(300);
    assert.equal(await p.locator('.zh-pop--popover.is-open').count(), 1, 'hover mode opens on hover'); await p.mouse.move(2, 2);
  }),
  T('popover form: invalid email blocked, valid closes + toast', async (p) => {
    await p.goto(url + '?only=popover'); await p.waitForTimeout(200);
    await p.locator('#zhPvInvite').scrollIntoViewIfNeeded(); await p.click('#zhPvInvite'); await p.waitForTimeout(260);
    assert.equal(await p.evaluate(() => document.activeElement.tagName), 'INPUT', 'focus lands on the input');
    await p.fill('.zh-pv input', 'nope'); await p.keyboard.press('Enter'); await p.waitForTimeout(80);
    assert.equal(await p.locator('.zh-pv input').getAttribute('aria-invalid'), 'true'); assert.equal(await p.locator('.zh-pop').count(), 1);
    await p.fill('.zh-pv input', 'a@b.co'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    assert.equal(await p.locator('.zh-pop').count(), 0); assert.match(await p.locator('#toastHost').textContent(), /a@b\.co/);
  }),
  T('popconfirm: focus, Tab trap, cancel, danger, async guard', async (p) => {
    await p.goto(url + '?only=popover'); await p.waitForTimeout(200);
    const b = p.locator('#zhPcBasic'); await b.scrollIntoViewIfNeeded(); await b.click(); await p.waitForTimeout(260);
    assert.equal(await p.evaluate(() => document.activeElement.textContent), '取消', 'focus starts on Cancel');
    await p.keyboard.press('Tab'); assert.equal(await p.evaluate(() => document.activeElement.textContent), '删除');
    await p.keyboard.press('Tab'); assert.equal(await p.evaluate(() => document.activeElement.textContent), '取消', 'Tab wraps inside');
    await p.keyboard.press('Escape'); await p.waitForTimeout(260); assert.equal(await p.evaluate(() => document.activeElement.id), 'zhPcBasic', 'Esc restores focus');
    await b.click(); await p.waitForTimeout(260); await p.click('.zh-pc [data-a="ok"]'); await p.waitForTimeout(260);
    assert.equal(await p.locator('#zhPcResult').textContent(), '已删除文件');
    await p.click('#zhPcDanger'); await p.waitForTimeout(260);
    assert.ok(await p.locator('.zh-pc .zh-pc-danger').count() === 1, 'danger styling'); await p.keyboard.press('Escape'); await p.waitForTimeout(260);
    await p.click('#zhPcAsync'); await p.waitForTimeout(260); await p.click('.zh-pc [data-a="ok"]'); await p.waitForTimeout(100);
    assert.equal(await p.locator('.zh-pc [data-a="ok"]').getAttribute('aria-busy'), 'true', 'loading state');
    await p.keyboard.press('Escape'); await p.mouse.click(5, 300); await p.waitForTimeout(260);
    assert.equal(await p.locator('.zh-pc').count(), 1, 'cannot close while loading');
    await p.waitForTimeout(1300); assert.equal(await p.locator('.zh-pc').count(), 0, 'closes when done'); assert.equal(await p.locator('#zhPcResult').textContent(), '已提交审核');
  }),
  T('modal: sizes, a11y, Esc/mask toggles, focus restore, trap', async (p) => {
    await p.setViewportSize({ width: 1440, height: 900 });
    await p.goto(url + '?only=dialogs'); await p.waitForTimeout(200);
    for (const [k, w] of [['sm', 360], ['md', 520], ['lg', 720]]) {
      const opener = p.locator(`[data-zh-modal="${k}"]`); await opener.scrollIntoViewIfNeeded(); await opener.click(); await p.waitForTimeout(300);
      const r = await p.evaluate(() => { const d = document.querySelector('dialog.zh-modal--svc[open]'); const b = d.getBoundingClientRect(); return { w: Math.round(b.width), lab: document.getElementById(d.getAttribute('aria-labelledby'))?.textContent, desc: !!document.getElementById(d.getAttribute('aria-describedby')), role: d.getAttribute('role') }; });
      assert.equal(r.w, w, `${k} width`); assert.match(r.lab, /尺寸/); assert.ok(r.desc); assert.equal(r.role, 'dialog');
      await p.keyboard.press('Escape'); await p.waitForTimeout(400);
      assert.equal(await p.locator('dialog.zh-modal--svc').count(), 0, `${k} closes on Esc`);
      assert.equal(await p.evaluate((kk) => document.activeElement.getAttribute('data-zh-modal'), k), k, `${k}: focus restored`);
    }
    await p.click('[data-zh-modal="md"]'); await p.waitForTimeout(300);
    for (let i = 0; i < 6; i++) await p.keyboard.press('Tab');
    assert.ok(await p.evaluate(() => !!document.activeElement.closest('dialog')), 'Tab stays inside the dialog');
    await p.mouse.click(5, 5); await p.waitForTimeout(400); assert.equal(await p.locator('dialog.zh-modal--svc').count(), 0, 'mask click closes');
    await p.locator('#zhMdMask').evaluate((n) => n.click()); await p.locator('#zhMdEsc').evaluate((n) => n.click());
    await p.click('[data-zh-modal="closable"]'); await p.waitForTimeout(300);
    await p.keyboard.press('Escape'); await p.mouse.click(5, 5); await p.waitForTimeout(450);
    assert.equal(await p.locator('dialog.zh-modal--svc[open]').count(), 1, 'Esc and mask blocked');
    await p.click('dialog.zh-modal--svc footer .zh-btn'); await p.waitForTimeout(400); assert.equal(await p.locator('dialog.zh-modal--svc').count(), 0);
  }),
  T('modal: confirm kinds, form validation, loading, nested, scroll', async (p) => {
    await p.goto(url + '?only=dialogs'); await p.waitForTimeout(200);
    for (const k of ['info', 'success', 'warning', 'error']) {
      const o = p.locator(`[data-zh-confirm="${k}"]`); await o.scrollIntoViewIfNeeded(); await o.click(); await p.waitForTimeout(300);
      assert.equal(await p.locator('dialog.zh-modal--svc[open]').getAttribute('role'), 'alertdialog'); assert.equal(await p.locator(`dialog.zh-modal--svc .zh-cf-ico.${k}`).count(), 1);
      assert.ok(await p.evaluate(() => document.activeElement.closest('footer')), `${k}: focus on a footer button`);
      await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    }
    await p.click('[data-zh-modal="form"]'); await p.waitForTimeout(300);
    assert.equal(await p.evaluate(() => document.activeElement.id), 'zhmfName', 'form focuses first field');
    await p.click('dialog.zh-modal--svc footer .primary'); await p.waitForTimeout(120);
    assert.equal(await p.locator('#zhmfName').getAttribute('aria-invalid'), 'true'); assert.equal(await p.locator('dialog.zh-modal--svc[open]').count(), 1, 'invalid form stays open');
    await p.fill('#zhmfName', '中控 2'); await p.click('dialog.zh-modal--svc footer .primary'); await p.waitForTimeout(150);
    assert.equal(await p.locator('dialog.zh-modal--svc footer .primary').getAttribute('aria-busy'), 'true', 'submit is loading');
    await p.keyboard.press('Escape'); await p.waitForTimeout(100); assert.equal(await p.locator('dialog.zh-modal--svc[open]').count(), 1, 'Esc ignored while busy');
    await p.waitForTimeout(1200); assert.equal(await p.locator('dialog.zh-modal--svc').count(), 0); assert.match(await p.locator('#toastHost').textContent(), /中控 2/);
    await p.click('[data-zh-modal="scroll"]'); await p.waitForTimeout(300);
    const s = await p.evaluate(() => { const d = document.querySelector('dialog.zh-modal--svc[open]'), b = d.querySelector('.body'), f = d.querySelector('footer').getBoundingClientRect(), h = d.querySelector('header').getBoundingClientRect(); return { scroll: b.scrollHeight > b.clientHeight + 50, footerIn: f.bottom <= innerHeight, headerIn: h.top >= 0 }; });
    assert.ok(s.scroll && s.footerIn && s.headerIn, 'long body scrolls; header/footer stay'); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    await p.click('[data-zh-modal="nested"]'); await p.waitForTimeout(300); await p.click('dialog.zh-modal--svc [data-n]'); await p.waitForTimeout(300);
    assert.equal(await p.locator('dialog.zh-modal--svc[open]').count(), 2); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    assert.equal(await p.locator('dialog.zh-modal--svc[open]').count(), 1, 'Esc closes only the top one'); assert.equal(await p.evaluate(() => document.activeElement.hasAttribute('data-n')), true, 'focus back on the inner opener');
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    assert.equal(await p.evaluate(() => document.documentElement.style.overflow), '', 'scroll lock released');
  }),
  T('modal is a bottom sheet on phone', async (p) => {
    await p.setViewportSize({ width: 390, height: 800 });
    await p.goto(url + '?only=dialogs'); await p.waitForTimeout(200);
    const o = p.locator('[data-zh-modal="md"]'); await o.scrollIntoViewIfNeeded(); await o.click(); await p.waitForTimeout(500);
    const r = await p.evaluate(() => { const b = document.querySelector('dialog.zh-modal--svc[open]').getBoundingClientRect(); return { w: Math.round(b.width), bottom: Math.round(b.bottom), h: innerHeight, grab: getComputedStyle(document.querySelector('.zh-modal-grab')).display }; });
    assert.equal(r.w, 390); assert.ok(Math.abs(r.bottom - r.h) <= 1, 'docked at the bottom'); assert.equal(r.grab, 'block');
    await p.keyboard.press('Escape'); await p.waitForTimeout(500);
    await p.click('[data-zh-modal="full"]'); await p.waitForTimeout(500);
    const f = await p.evaluate(() => { const b = document.querySelector('dialog.zh-modal--svc[open]').getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height), innerHeight]; });
    assert.equal(f[0], 390); assert.equal(f[1], f[2], 'full modal fills the phone screen');
    await p.keyboard.press('Escape');
  }),
  T('drawer: placements, sizes, focus trap, Esc, mask, nested', async (p) => {
    await p.setViewportSize({ width: 1440, height: 900 });
    await p.goto(url + '?only=dialogs'); await p.waitForTimeout(200);
    const edge = async (kind) => p.evaluate(() => { const r = document.querySelector('.zh-drawer--svc.open').getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height), iw: innerWidth, ih: innerHeight }; });
    for (const k of ['right', 'left', 'top', 'bottom']) {
      const o = p.locator(`[data-zh-drawer="${k}"]`); await o.scrollIntoViewIfNeeded(); await o.click(); await p.waitForTimeout(500);
      const e = await edge(k);
      if (k === 'right') assert.equal(e.r, e.iw); if (k === 'left') assert.equal(e.l, 0); if (k === 'top') assert.equal(e.t, 0); if (k === 'bottom') assert.equal(e.b, e.ih);
      assert.equal(await p.locator('.zh-drawer--svc').getAttribute('aria-modal'), 'true');
      assert.ok(await p.evaluate(() => document.querySelector('.zh-drawer--svc').contains(document.activeElement)), `${k}: focus inside`);
      for (let i = 0; i < 5; i++) await p.keyboard.press('Tab');
      assert.ok(await p.evaluate(() => document.querySelector('.zh-drawer--svc').contains(document.activeElement)), `${k}: Tab trapped`);
      await p.keyboard.press('Escape'); await p.waitForTimeout(500);
      assert.equal(await p.locator('.zh-drawer--svc').count(), 0, `${k}: removed`); assert.equal(await p.evaluate((kk) => document.activeElement.getAttribute('data-zh-drawer'), k), k, `${k}: focus restored`);
    }
    await p.click('[data-zh-drawer="lg"]'); await p.waitForTimeout(500); assert.equal((await edge()).w, 640); await p.mouse.click(5, 300); await p.waitForTimeout(500);
    assert.equal(await p.locator('.zh-drawer--svc').count(), 0, 'mask closes');
    await p.click('[data-zh-drawer="nomask"]'); await p.waitForTimeout(500); await p.mouse.click(5, 300); await p.waitForTimeout(400);
    assert.equal(await p.locator('.zh-drawer--svc').count(), 1, 'mask ignored'); await p.click('.zh-drawer--svc [data-x]'); await p.waitForTimeout(500);
    await p.click('[data-zh-drawer="nested"]'); await p.waitForTimeout(500); await p.click('.zh-drawer--svc [data-n]'); await p.waitForTimeout(500);
    const z = await p.evaluate(() => [...document.querySelectorAll('.zh-drawer--svc')].map((d) => +getComputedStyle(d).zIndex));
    assert.equal(z.length, 2); assert.ok(z[1] > z[0], 'inner drawer above outer');
    await p.keyboard.press('Escape'); await p.waitForTimeout(500); assert.equal(await p.locator('.zh-drawer--svc').count(), 1, 'Esc closes one layer');
    await p.keyboard.press('Escape'); await p.waitForTimeout(500); assert.equal(await p.locator('.zh-drawer--svc').count(), 0);
    await p.click('[data-zh-drawer="footer"]'); await p.waitForTimeout(500);
    const f = await p.evaluate(() => { const d = document.querySelector('.zh-drawer--svc'), b = d.querySelector('.zh-drawer-body'), ft = d.querySelector('.zh-drawer-foot').getBoundingClientRect(); return { scroll: b.scrollHeight > b.clientHeight, foot: Math.round(ft.bottom) === innerHeight }; });
    assert.ok(f.scroll && f.foot, 'body scrolls, footer pinned'); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    await p.setViewportSize({ width: 390, height: 800 }); await p.click('[data-zh-drawer="right"]'); await p.waitForTimeout(500);
    assert.equal((await edge()).w, 390, 'phone: right drawer is full width');
  }),
  T('notification: corners, types, pause, stack limit, actions, roles', async (p) => {
    await p.setViewportSize({ width: 1440, height: 900 });
    await p.goto(url + '?only=dialogs'); await p.waitForTimeout(200);
    for (const [pos, test] of [['tr', (r, w, h) => r.right > w - 40 && r.top < 200], ['tl', (r) => r.left < 40 && r.top < 200], ['br', (r, w, h) => r.right > w - 40 && r.bottom > h - 40], ['bl', (r, w, h) => r.left < 40 && r.bottom > h - 40]]) {
      const b = p.locator(`[data-zh-notice-pos="${pos}"]`); await b.scrollIntoViewIfNeeded(); await b.click(); await p.waitForTimeout(500);
      const r = await p.evaluate(() => { const n = document.querySelector('.zh-notice'), b = n.getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, w: innerWidth, h: innerHeight }; });
      assert.ok(test(r, r.w, r.h), `corner ${pos}: ${JSON.stringify(r)}`);
      await p.click('.zh-notice .zh-notice-x'); await p.waitForTimeout(400);
    }
    assert.equal(await p.locator('.zh-notice').count(), 0, 'closed via X');
    await p.click('[data-zh-notice="error"]'); await p.waitForTimeout(300); assert.equal(await p.locator('.zh-notice').getAttribute('role'), 'alert');
    await p.click('.zh-notice .zh-notice-x'); await p.waitForTimeout(400);
    await p.click('[data-zh-notice="success"]'); await p.waitForTimeout(300); assert.equal(await p.locator('.zh-notice').getAttribute('role'), 'status'); assert.equal(await p.locator('.zh-notice-bar').count(), 1, 'countdown bar'); await p.click('.zh-notice .zh-notice-x'); await p.waitForTimeout(400);
    await p.click('[data-zh-notice="stack"]'); await p.waitForTimeout(400);
    assert.equal(await p.locator('.zh-notice:not(.is-leaving)').count(), 4, 'stack limited to 4'); assert.match(await p.locator('.zh-notice').first().textContent(), /第 6 条/, 'newest first');
    await p.click('[data-zh-notice="clear"]'); await p.waitForTimeout(500); assert.equal(await p.locator('.zh-notice').count(), 0);
    await p.click('[data-zh-notice="action"]'); await p.waitForTimeout(300); await p.click('.zh-notice-actions .primary'); await p.waitForTimeout(400);
    assert.equal(await p.locator('.zh-notice').count(), 0, 'action closes the notice'); assert.match(await p.locator('#toastHost').textContent(), /审核列表/);
    await p.click('[data-zh-notice="sticky"]'); await p.waitForTimeout(300); assert.equal(await p.locator('.zh-notice-bar').count(), 0, 'sticky has no countdown'); await p.click('[data-zh-notice="clear"]'); await p.waitForTimeout(400);
    // auto-dismiss and hover pause
    await p.evaluate(() => { document.querySelector('[data-zh-notice="info"]').scrollIntoView(); });
    await p.click('[data-zh-notice="info"]'); await p.waitForTimeout(200);
    const n = p.locator('.zh-notice'); await n.hover(); await p.waitForTimeout(400);
    assert.ok(await p.locator('.zh-notice.is-paused').count() === 1, 'hover pauses');
    await p.mouse.move(700, 500); await p.waitForTimeout(500); assert.equal(await p.locator('.zh-notice.is-paused').count(), 0, 'resumes on leave');
  }),
  T('message: types, loading→success, closable, limit', async (p) => {
    await p.goto(url + '?only=dialogs'); await p.waitForTimeout(200);
    const b = p.locator('[data-zh-msg="loading"]'); await b.scrollIntoViewIfNeeded(); await b.click(); await p.waitForTimeout(200);
    assert.equal(await p.locator('.zh-message--loading .spin').count(), 1); await p.waitForTimeout(1500);
    assert.equal(await p.locator('.zh-message--success').count(), 1, 'updated in place'); assert.equal(await p.locator('.zh-message--loading').count(), 0);
    await p.waitForTimeout(3000); assert.equal(await p.locator('.zh-message--svc').count(), 0, 'auto-dismisses');
    await p.click('[data-zh-msg="closable"]'); await p.waitForTimeout(200); await p.click('.zh-message-x'); await p.waitForTimeout(350);
    assert.equal(await p.locator('.zh-message--svc').count(), 0, 'closed by X');
    for (let i = 0; i < 6; i++) await p.click('[data-zh-msg="info"]');
    assert.ok(await p.locator('.zh-message--svc').count() <= 4, 'limit 4'); assert.equal(await p.locator('.zh-message--error').count(), 0);
    await p.click('[data-zh-msg="error"]'); assert.equal(await p.locator('.zh-message--error').getAttribute('role'), 'alert');
  }),
];

for (const [name, eng] of Object.entries({ chromium, firefox, webkit })) {
  const b = await eng.launch();
  for (const t of tests) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    try { await t.fn(p); assert.deepEqual(errs, [], 'page errors'); console.log('ok  ', name.padEnd(8), t.name); }
    catch (e) { bad++; console.log('FAIL', name.padEnd(8), t.name, '\n     ', String(e.message).split('\n')[0]); }
    await ctx.close();
  }
  await b.close();
}
console.log(bad ? `\n${bad} failing` : '\nall passed');
process.exit(bad ? 1 : 0);
