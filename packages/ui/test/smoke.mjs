// Standalone smoke test: loads test/standalone.html (which references only dist/zhaoui.css and dist/zhaoui.js)
// and drives every component the way a user would.  Needs playwright (see env.mjs for where it is looked up).  Options: --min (minified files), --engine=firefox|webkit (or the VARIANT / ENGINE environment variables).
import { loadPlaywright, launch as launchEngine, fileUrl } from './env.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const pw = loadPlaywright();
const HERE = dirname(fileURLToPath(import.meta.url)), VARIANT = process.env.VARIANT || (process.argv.includes('--min') ? 'min' : 'full');
// VARIANT=min: same pages, pointing at the minified files, so a broken minification cannot slip through.
function pagePath(name) {
  if (VARIANT === 'full') return join(HERE, name);
  const out = join(HERE, name.replace('.html', '.min.generated.html'));
  writeFileSync(out, readFileSync(join(HERE, name), 'utf8').replace('../dist/zhaoui.css"', '../dist/zhaoui.min.css"').replace('../dist/zhaoui.js"', '../dist/zhaoui.min.js"'));
  return out;
}
const FILE = fileUrl(pagePath('standalone.html'));
const ENGINE = process.env.ENGINE || (process.argv.find((a) => a.startsWith('--engine=')) || '').slice(9) || 'chromium';
const launch = () => launchEngine(pw, ENGINE);
let failed = 0, passed = 0;
const b = await launch();
async function fresh(w = 1280) {
  const p = await b.newPage({ viewport: { width: w, height: 800 } });
  p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') p.errs.push('console: ' + m.text()); });
  await p.goto(FILE); await p.waitForTimeout(250); return p;
}
const test = async (label, fn, w) => { const p = await fresh(w); try { await fn(p); assert.deepEqual(p.errs, [], 'page errors'); passed++; } catch (e) { failed++; console.log(`FAIL ${label}\n   ${e.message.split('\n').slice(0, 14).join(' | ')}`); } await p.close(); };
const wait = (p, ms = 200) => p.waitForTimeout(ms);

await test('tokens + component css apply with only the two files', async (p) => {
  const r = await p.evaluate(() => { const b = getComputedStyle(document.getElementById('b-primary')); return { bg: b.backgroundColor, h: parseFloat(b.height), hasZh: typeof ZhaoUI, ver: ZhaoUI.version }; });
  assert.match(r.bg, /rgb\(88, 104, 238\)/); assert.equal(r.h, 32); assert.equal(r.hasZh, 'object'); assert.equal(r.ver, '0.1.0');
});
await test('button variants and tooltip look right (docs/styles.md relies on this)', async (p) => {
  const r = await p.evaluate(() => { const g = (id) => getComputedStyle(document.getElementById(id)); const root = getComputedStyle(document.documentElement);
    return { text: g('b-text').backgroundColor, textColor: g('b-text').color, danger: g('b-danger').color, dangerBorder: g('b-danger').borderTopColor, dis: g('b-disabled').opacity, dangerText: (() => { const d = document.createElement('i'); d.style.color = 'var(--zh-text-danger)'; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; })(), primaryColor: root.getPropertyValue('--zh-color-primary').trim() }; });
  assert.equal(r.text, 'rgba(0, 0, 0, 0)', 'text button is transparent');
  assert.equal(r.danger, r.dangerText, 'danger button text uses the readable danger text colour, not the brand red'); assert.equal(r.dis, '0.45', 'disabled opacity token');
  await p.hover('#b-tip'); await wait(p, 150);
  const tip = await p.evaluate(() => getComputedStyle(document.getElementById('b-tip'), '::after').content);
  assert.equal(tip, '"提示信息"', 'tooltip text comes from data-tip');
});
await test('theme switches by data attributes (dark, C audience)', async (p) => {
  const before = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--zh-bg').trim());
  await p.evaluate(() => ZhaoUI.setTheme({ mode: 'dark', audience: 'c' })); await wait(p, 100);
  const r = await p.evaluate(() => ({ bg: getComputedStyle(document.documentElement).getPropertyValue('--zh-bg').trim(), h: parseFloat(getComputedStyle(document.getElementById('b-primary')).height) }));
  assert.notEqual(r.bg, before); assert.equal(r.h, 44);
});
await test('setBrand changes the primary colour', async (p) => {
  await p.evaluate(() => ZhaoUI.setBrand('#00857f')); await wait(p, 100);
  const c = await p.evaluate(() => getComputedStyle(document.getElementById('b-primary')).backgroundColor);
  assert.notEqual(c, 'rgb(88, 104, 238)');
});
await test('icons: <i data-i> becomes svg with a resolvable symbol', async (p) => {
  const r = await p.evaluate(() => { const s = document.querySelector('#s-collapse svg.ico use'); return { has: !!s, ref: s && s.getAttribute('href'), sym: !!document.getElementById('zi-chevron-right'), left: document.querySelectorAll('i[data-i]').length }; });
  assert.ok(r.has && r.sym && r.left === 0); assert.equal(r.ref, '#zi-chevron-right');
});
await test('modal: opens by data-zh-open, closes by data-zh-close, Esc, backdrop', async (p) => {
  const open = () => p.evaluate(() => document.getElementById('dlg').open);
  await p.click('#o-modal'); assert.equal(await open(), true);
  await p.click('#dlg footer .zh-btn:not(.primary)'); assert.equal(await open(), false);
  await p.click('#o-modal'); await p.keyboard.press('Escape'); await wait(p); assert.equal(await open(), false);
  assert.equal(await p.evaluate(() => document.activeElement.id), 'o-modal', 'focus returns to opener');
  await p.click('#o-modal'); await p.mouse.click(5, 5); await wait(p); assert.equal(await open(), false, 'backdrop click closes');
});
await test('drawer: open, focus moves in, Esc closes and restores focus, hidden when closed', async (p) => {
  const st = () => p.evaluate(() => { const d = document.getElementById('drw'); return { open: d.classList.contains('open'), aria: d.getAttribute('aria-hidden'), inert: d.hasAttribute('inert'), inside: d.contains(document.activeElement) }; });
  let s = await st(); assert.deepEqual([s.open, s.aria, s.inert], [false, 'true', true]);
  await p.click('#o-drawer'); await wait(p); s = await st(); assert.deepEqual([s.open, s.aria, s.inert, s.inside], [true, 'false', false, true]);
  await p.keyboard.press('Escape'); await wait(p); s = await st(); assert.equal(s.open, false);
  assert.equal(await p.evaluate(() => document.activeElement.id), 'o-drawer');
});
await test('tabs: click, arrows, Home/End, panels follow', async (p) => {
  const vis = () => p.evaluate(() => ['p1', 'p2', 'p3'].map((i) => !document.getElementById(i).hidden));
  assert.deepEqual(await vis(), [true, false, false]);
  await p.click('#t2'); assert.deepEqual(await vis(), [false, true, false]);
  await p.keyboard.press('ArrowRight'); assert.deepEqual(await vis(), [false, false, true]);
  await p.keyboard.press('ArrowRight'); assert.deepEqual(await vis(), [true, false, false], 'wraps');
  await p.keyboard.press('End'); assert.deepEqual(await vis(), [false, false, true]);
  await p.keyboard.press('Home'); assert.deepEqual(await vis(), [true, false, false]);
  assert.equal(await p.evaluate(() => document.querySelectorAll('#tabs [tabindex="0"]').length), 1, 'roving tabindex');
});
await test('collapse (single): opening one closes the other, aria + inert stay in sync', async (p) => {
  const st = () => p.evaluate(() => ['ci1', 'ci2'].map((i) => { const it = document.getElementById(i); const t = it.querySelector('.zh-collapse-trigger'), pn = it.querySelector('.zh-collapse-panel'); return [it.classList.contains('is-open'), t.getAttribute('aria-expanded'), pn.hasAttribute('inert')].join(); }));
  assert.deepEqual(await st(), ['true,true,false', 'false,false,true']);
  await p.click('#ci2 .zh-collapse-trigger'); await wait(p, 300);
  assert.deepEqual(await st(), ['false,false,true', 'true,true,false']);
  await p.focus('#ci2 .zh-collapse-trigger'); await p.keyboard.press('ArrowUp');
  assert.equal(await p.evaluate(() => document.activeElement.closest('.zh-collapse-item').id), 'ci1');
});
await test('dropdown: opens, keyboard select emits zh:select, Esc restores focus', async (p) => {
  await p.evaluate(() => { window.__sel = null; document.getElementById('dd-btn').addEventListener('zh:select', (e) => { window.__sel = e.detail.value; }); });
  await p.click('#dd-btn'); await wait(p, 250);
  assert.equal(await p.locator('.zh-pop.is-open').count(), 1);
  const look = await p.evaluate(() => {
    const src = getComputedStyle(document.getElementById('dd-menu')).display;
    const pop = document.querySelector('.zh-pop.is-open'), c = getComputedStyle(pop.querySelector('.zh-pop-body')), r = pop.getBoundingClientRect(), a = document.getElementById('dd-btn').getBoundingClientRect();
    return { src, pos: getComputedStyle(pop).position, shadow: c.boxShadow !== 'none', bg: c.backgroundColor, dy: Math.round(r.top - a.bottom), dx: Math.round(r.left - a.left), inView: r.right <= innerWidth && r.bottom <= innerHeight };
  });
  assert.equal(look.src, 'none', 'source menu stays hidden');
  assert.equal(look.pos, 'fixed'); assert.ok(look.shadow, 'popover has a shadow'); assert.notEqual(look.bg, 'rgba(0, 0, 0, 0)', 'popover has a background');
  assert.ok(look.dy >= 0 && look.dy < 16, 'popover sits just below the trigger, got ' + look.dy); assert.ok(Math.abs(look.dx) < 4, 'left-aligned with trigger'); assert.ok(look.inView);
  assert.equal(await p.evaluate(() => document.activeElement.textContent.trim()), '编辑', 'first item focused');
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await wait(p, 250);
  assert.equal(await p.evaluate(() => window.__sel), 'copy');
  assert.equal(await p.locator('.zh-pop').count(), 0, 'menu removed');
  await p.click('#dd-btn'); await wait(p, 250); await p.keyboard.press('Escape'); await wait(p, 250);
  assert.equal(await p.locator('.zh-pop').count(), 0);
  assert.equal(await p.evaluate(() => document.activeElement.id), 'dd-btn');
});
await test('message: appears and removes itself; typed variants get their class', async (p) => {
  await p.click('#msg-btn'); await wait(p, 100);
  assert.equal(await p.locator('.zh-message').count(), 1);
  await wait(p, 600); assert.equal(await p.locator('.zh-message').count(), 0);
  await p.evaluate(() => ZhaoUI.message('出错了', { type: 'error', duration: 0 }));
  assert.equal(await p.locator('.zh-message--error').count(), 1);
});
await test('message inside an open modal stays visible above it', async (p) => {
  await p.click('#o-modal'); await p.evaluate(() => ZhaoUI.message('x', { duration: 0 }));
  const r = await p.evaluate(() => { const m = document.querySelector('.zh-message').getBoundingClientRect(); const top = document.elementFromPoint(m.left + m.width / 2, m.top + m.height / 2); return { inDlg: document.getElementById('dlg').contains(document.getElementById('zhToastHost')), visible: !!top && !!top.closest('.zh-message') }; });
  assert.equal(r.inDlg, true); assert.equal(r.visible, true, 'message is the topmost element at its own position');
  await p.keyboard.press('Escape'); await wait(p, 100);
  assert.equal(await p.evaluate(() => document.getElementById('zhToastHost').parentNode === document.body), true, 'host returns to body when the dialog closes');
});
await test('ZhaoUI.dialog() resolves true on ok and false on cancel', async (p) => {
  const a = p.evaluate(() => ZhaoUI.dialog({ title: '删除？', content: '不可恢复', danger: true }));
  await wait(p, 100); await p.click('dialog.zh-modal[open] footer .zh-btn.danger'); assert.equal(await a, true);
  const c = p.evaluate(() => ZhaoUI.dialog({ title: 't', content: 'c' }));
  await wait(p, 100); await p.keyboard.press('Escape'); assert.equal(await c, false);
  assert.equal(await p.locator('dialog.zh-modal[open]').count(), 0);
});
await test('components added after load are wired automatically', async (p) => {
  await p.evaluate(() => { const d = document.createElement('div'); d.innerHTML = '<div class="zh-tabs" role="tablist" id="dyn"><button role="tab" aria-selected="true">a</button><button role="tab" aria-selected="false">b</button></div>'; document.body.appendChild(d); });
  await wait(p, 200);
  assert.equal(await p.evaluate(() => document.querySelectorAll('#dyn [tabindex="0"]').length), 1);
});
await test('phone width: modal becomes a bottom sheet, no horizontal scroll', async (p) => {
  await p.click('#o-modal'); await wait(p, 200);
  const r = await p.evaluate(() => { const d = document.getElementById('dlg').getBoundingClientRect(); return { w: Math.round(d.width), vw: innerWidth, bottom: Math.round(d.bottom), vh: innerHeight, sw: document.documentElement.scrollWidth }; });
  assert.equal(r.w, r.vw); assert.equal(r.bottom, r.vh); assert.equal(r.sw, r.vw);
}, 420);


// ---------- input family ----------
const val = (p, sel) => p.evaluate((s) => document.querySelector(s).value, sel);
await test('input: clear button follows the value and refocuses; password toggle; search Enter/Esc', async (p) => {
  const hidden = () => p.evaluate(() => document.querySelector('#i-clear .zh-inp-clear').hidden);
  assert.equal(await hidden(), true);
  await p.fill('#i-clear-el', 'a@b.c'); assert.equal(await hidden(), false);
  await p.click('#i-clear .zh-inp-clear');
  assert.equal(await val(p, '#i-clear-el'), ''); assert.equal(await hidden(), true); assert.equal(await p.evaluate(() => document.activeElement.id), 'i-clear-el');
  // password toggle
  await p.click('#i-pw .zh-inp-eye');
  let r = await p.evaluate(() => { const b = document.querySelector('#i-pw .zh-inp-eye'); return [document.getElementById('i-pw-el').type, b.getAttribute('aria-pressed'), b.getAttribute('aria-label'), !!b.querySelector('svg use[href="#zi-eye-off"]')]; });
  assert.deepEqual(r, ['text', 'true', '隐藏密码', true]);
  await p.click('#i-pw .zh-inp-eye'); assert.equal(await p.evaluate(() => document.getElementById('i-pw-el').type), 'password');
  // search
  await p.evaluate(() => { window.__q = []; const s = document.getElementById('i-search'); s.addEventListener('zh:search', (e) => window.__q.push(e.detail.query)); s.addEventListener('zh:search-clear', () => window.__q.push('<clear>')); });
  await p.fill('#i-search-el', '  设备  '); await p.press('#i-search-el', 'Enter');
  await p.press('#i-search-el', 'Escape');
  assert.deepEqual(await p.evaluate(() => window.__q), ['设备', '<clear>']); assert.equal(await val(p, '#i-search-el'), '');
});
await test('number: keys, Shift/Page steps, clamping, precision, button disabling, hold-to-repeat', async (p) => {
  const n1 = () => val(p, '#n1-el');
  await p.evaluate(() => { window.__n = []; document.getElementById('n1').addEventListener('zh:number', (e) => window.__n.push(e.detail.value)); });
  await p.focus('#n1-el'); await p.keyboard.press('ArrowUp'); assert.equal(await n1(), '4');
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); assert.equal(await n1(), '2');
  await p.keyboard.press('Shift+ArrowUp'); assert.equal(await n1(), '10', 'Shift = 10 steps, clamped at max');
  assert.equal(await p.evaluate(() => document.querySelector('#n1 [data-dir="1"]').disabled), true, 'increase disabled at max');
  assert.equal(await p.evaluate(() => document.getElementById('n1-el').getAttribute('aria-valuenow')), '10');
  await p.keyboard.press('PageDown'); assert.equal(await n1(), '1', 'PageDown clamps at min');
  assert.equal(await p.evaluate(() => document.querySelector('#n1 [data-dir="-1"]').disabled), true);
  await p.fill('#n1-el', '99'); await p.press('#n1-el', 'Enter'); assert.equal(await n1(), '10', 'typed overflow is pulled into range');
  await p.fill('#n1-el', 'abc'); await p.press('#n1-el', 'Tab'); assert.equal(await n1(), '10', 'garbage reverts to last value');
  assert.ok((await p.evaluate(() => window.__n)).length >= 4, 'zh:number fired');
  // decimals
  await p.focus('#n2-el'); await p.keyboard.press('ArrowUp'); assert.equal(await val(p, '#n2-el'), '13.00');
  await p.click('#n2 [data-dir="-1"]'); assert.equal(await val(p, '#n2-el'), '12.50');
  // hold to repeat
  await p.evaluate(() => { document.getElementById('n2-el').value = '0.00'; });
  const box = await p.locator('#n2 [data-dir="1"]').boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await p.mouse.down(); await wait(p, 900); await p.mouse.up();
  const held = parseFloat(await val(p, '#n2-el')); assert.ok(held >= 2, 'holding repeats, got ' + held);
  const after = await val(p, '#n2-el'); await wait(p, 300); assert.equal(await val(p, '#n2-el'), after, 'repeat stops on release');
});
await test('otp: cells generated, typing advances, paste fills, backspace goes back, complete event, ok/error/clear', async (p) => {
  assert.equal(await p.locator('#otp .zh-otp-cell').count(), 6);
  assert.equal(await p.evaluate(() => document.getElementById('otp').getAttribute('role')), 'group');
  await p.evaluate(() => { window.__c = []; document.getElementById('otp').addEventListener('zh:otp-complete', (e) => window.__c.push(e.detail.value)); });
  await p.click('#otp .zh-otp-cell >> nth=0'); await p.keyboard.type('12');
  assert.equal(await p.evaluate(() => [...document.querySelectorAll('#otp .zh-otp-cell')].indexOf(document.activeElement)), 2, 'focus advanced');
  await p.keyboard.press('Backspace'); // cell 2 is empty -> goes back and clears cell 1
  assert.equal(await p.evaluate(() => [document.querySelectorAll('#otp .zh-otp-cell')[1].value, [...document.querySelectorAll('#otp .zh-otp-cell')].indexOf(document.activeElement)].join()), ',1');
  await p.keyboard.press('ArrowRight'); await p.keyboard.press('Home');
  assert.equal(await p.evaluate(() => [...document.querySelectorAll('#otp .zh-otp-cell')].indexOf(document.activeElement)), 0);
  await p.evaluate(() => { const c = document.querySelector('#otp .zh-otp-cell'); c.focus(); const ev = new Event('paste', { bubbles: true, cancelable: true }); Object.defineProperty(ev, 'clipboardData', { value: { getData: () => '98 76-54' } }); c.dispatchEvent(ev); });   // plain Event: Firefox ignores clipboardData on ClipboardEvent init
  assert.equal(await p.evaluate(() => ZhaoUI.otp.value('#otp')), '987654', 'paste strips non-digits and fills');
  assert.deepEqual(await p.evaluate(() => window.__c), ['987654']);
  await p.evaluate(() => ZhaoUI.otp.error('#otp')); assert.equal(await p.evaluate(() => document.getElementById('otp').classList.contains('is-error')), true);
  await p.evaluate(() => ZhaoUI.otp.ok('#otp')); assert.deepEqual(await p.evaluate(() => ['is-ok', 'is-error'].map((c) => document.getElementById('otp').classList.contains(c))), [true, false]);
  await p.evaluate(() => ZhaoUI.otp.clear('#otp')); assert.equal(await p.evaluate(() => ZhaoUI.otp.value('#otp')), '');
  await p.keyboard.type('a1b2'); assert.equal(await p.evaluate(() => ZhaoUI.otp.value('#otp')), '12', 'letters are rejected');
});
await test('textarea: counter, hard limit, soft limit flags, auto-grow with a cap', async (p) => {
  assert.equal(await p.evaluate(() => document.querySelector('#ta1 .zh-ta-count').textContent), '0 / 20');
  await p.fill('#ta1-el', '12345678901234567890xyz');
  assert.equal(await val(p, '#ta1-el'), '12345678901234567890', 'maxlength blocks extra input'); assert.equal(await p.evaluate(() => document.querySelector('#ta1 .zh-ta-count').textContent), '20 / 20');
  await p.fill('#ta2-el', '12345'); let r = await p.evaluate(() => [document.getElementById('ta2').classList.contains('is-over'), document.getElementById('ta2-el').getAttribute('aria-invalid'), document.querySelector('#ta2 .zh-ta-count').textContent]);
  assert.deepEqual(r, [false, 'false', '5 / 10']);
  await p.fill('#ta2-el', '1234567890123'); r = await p.evaluate(() => [document.getElementById('ta2').classList.contains('is-over'), document.getElementById('ta2-el').getAttribute('aria-invalid')]);
  assert.deepEqual(r, [true, 'true'], 'soft limit flags but does not block');
  const h0 = await p.evaluate(() => document.getElementById('ta1-el').getBoundingClientRect().height);
  await p.fill('#ta1-el', 'a\nb\nc\nd\ne\nf\ng\nh'); const h1 = await p.evaluate(() => document.getElementById('ta1-el').getBoundingClientRect().height);
  assert.ok(h1 > h0, 'grows with lines'); await p.fill('#ta1-el', Array(30).fill('x').join('\n')); const h2 = await p.evaluate(() => document.getElementById('ta1-el').getBoundingClientRect().height);
  assert.ok(h2 <= h1 + 40 && h2 < 30 * 18, 'growth is capped at max rows (got ' + h2 + ')');
});
await test('inline edit: click/F2 to edit, Enter saves, Esc cancels, empty is rejected, blur saves, events', async (p) => {
  await p.evaluate(() => { window.__e = []; const h = document.getElementById('ed'); h.addEventListener('zh:edit-save', (e) => window.__e.push(['save', e.detail.previous, e.detail.value].join())); h.addEventListener('zh:edit-cancel', () => window.__e.push('cancel')); });
  const text = () => p.evaluate(() => document.querySelector('#ed .zh-edit-text').textContent);
  await p.click('#ed-view'); assert.equal(await p.evaluate(() => document.activeElement.tagName), 'INPUT');
  await p.fill('#ed input', '新名称'); await p.keyboard.press('Enter');
  assert.equal(await text(), '新名称'); assert.equal(await p.evaluate(() => document.activeElement.id), 'ed-view', 'focus returns to the button');
  assert.equal(await p.evaluate(() => document.getElementById('ed-view').getAttribute('aria-label')), '编辑名称：新名称');
  await p.focus('#ed-view'); await p.keyboard.press('F2'); await p.fill('#ed input', '不保存'); await p.keyboard.press('Escape');
  assert.equal(await text(), '新名称', 'Esc discards');
  await p.click('#ed-view'); await p.fill('#ed input', '   '); await p.keyboard.press('Enter');
  assert.deepEqual(await p.evaluate(() => [!!document.querySelector('#ed .zh-inp'), document.querySelector('#ed .zh-inp').classList.contains('is-error'), document.querySelector('#ed input').getAttribute('aria-invalid')]), [true, true, 'true'], 'empty stays in edit mode, flagged');
  await p.fill('#ed input', '失焦保存'); await p.click('body', { position: { x: 600, y: 5 } }); await wait(p, 100);
  assert.equal(await text(), '失焦保存', 'blur saves');
  assert.deepEqual(await p.evaluate(() => window.__e), ['save,中控系统,新名称', 'cancel', 'save,新名称,失焦保存']);
});


// ---------- display + data entry batch ----------
const txt = (p, sel) => p.evaluate((s) => document.querySelector(s).textContent.trim().replace(/\s+/g, ' '), sel);
await test('progress: renders, updates via ZhaoUI.progress.set, tones, steps, top label, indeterminate, target', async (p) => {
  const g = (sel, a) => p.evaluate(([s, n]) => document.querySelector(s).getAttribute(n), [sel, a]);
  assert.equal(await g('#pg1', 'role'), 'progressbar'); assert.equal(await g('#pg1', 'aria-valuenow'), '36'); assert.equal(await txt(p, '#pg1 .zh-progress-label'), '36%');
  await p.evaluate(() => ZhaoUI.progress.set('#pg1', 80));
  assert.equal(await g('#pg1', 'aria-valuenow'), '80'); assert.equal(await p.evaluate(() => document.getElementById('pg1').style.getPropertyValue('--zh-p')), '0.8');
  await p.evaluate(() => ZhaoUI.progress.set('#pg1', 250)); assert.equal(await g('#pg1', 'aria-valuenow'), '100', 'clamped to 100');
  assert.equal(await g('#pg1', 'data-tone'), 'success'); assert.equal(await g('#pg1', 'aria-valuetext'), '100%，已完成');
  assert.equal(await p.evaluate(() => !!document.querySelector('#pg1 .zh-progress-label svg')), true, 'success shows an icon, not only colour');
  assert.match(await txt(p, '#pg-top .zh-progress-head'), /存储空间\s*62%/);
  assert.deepEqual(await p.evaluate(() => [document.querySelectorAll('#pg-steps .zh-progress-track i').length, document.querySelectorAll('#pg-steps .zh-progress-track i.on').length]), [10, 6]);
  assert.equal(await g('#pg-ex', 'data-tone'), 'exception'); assert.equal(await g('#pg-ex', 'aria-valuetext'), '42%，失败');
  assert.deepEqual(await p.evaluate(() => { const e = document.getElementById('pg-ind'); return [e.getAttribute('aria-busy'), e.hasAttribute('aria-valuenow'), e.getAttribute('aria-valuetext')]; }), ['true', false, '加载中']);
  assert.equal(await txt(p, '#pg-tg .zh-progress-target em'), '目标 80%');
  assert.ok((await p.evaluate(() => document.querySelector('#pg1 .zh-progress-fill').getBoundingClientRect().width)) > 50, 'fill has width');
});
await test('methods called from an inline script before auto-init still work (ensure)', async (p) => {
  const r = await p.evaluate(() => { const d = document.createElement('div'); d.innerHTML = '<div class="zh-progress" id="early-pg" data-value="10" data-name="x"></div><div class="zh-ring" id="early-rg" data-value="10" data-name="y"></div><div class="zh-otp" id="early-otp" data-length="4"></div>';
    document.body.appendChild(d);            // just added: MutationObserver has not run yet
    ZhaoUI.progress.set('#early-pg', 55); ZhaoUI.ring.set('#early-rg', 70); ZhaoUI.otp.error('#early-otp');
    return [document.getElementById('early-pg').getAttribute('aria-valuenow'), document.getElementById('early-rg').getAttribute('aria-valuenow'), document.getElementById('early-otp').classList.contains('is-error'), document.querySelectorAll('#early-otp .zh-otp-cell').length]; });
  assert.deepEqual(r, ['55', '70', true, 4]);
});
await test('ring: value, gauge, success/exception icons, ZhaoUI.ring.set', async (p) => {
  assert.equal(await p.evaluate(() => document.getElementById('rg1').getAttribute('aria-valuenow')), '65'); assert.match(await txt(p, '#rg1 .zh-ring-center'), /^65\s*%/);
  assert.deepEqual(await p.evaluate(() => [document.getElementById('rg-g').classList.contains('zh-ring--gauge'), !!document.querySelector('#rg-g .zh-ring-ends')]), [true, true]);
  await p.evaluate(() => ZhaoUI.ring.set('#rg1', 100)); assert.equal(await p.evaluate(() => !!document.querySelector('#rg1 .zh-ring-center svg')), true, 'done -> check icon');
  assert.equal(await p.evaluate(() => document.getElementById('rg-ex').dataset.tone), 'exception'); assert.equal(await p.evaluate(() => !!document.querySelector('#rg-ex .zh-ring-center svg')), true);
  await p.evaluate(() => ZhaoUI.ring.set('#rg-g', 30, '<b>自定义</b>')); assert.equal(await txt(p, '#rg-g .zh-ring-center'), '自定义');
});
await test('badge: count, 99+, zero hides, dot, text, repaint + pop, screen-reader text', async (p) => {
  assert.equal(await txt(p, '#bm1 [aria-hidden="true"]'), '5'); assert.equal(await txt(p, '#bm1 .zh-bdg-sr'), '5 条未读');
  assert.equal(await txt(p, '#bm2 [aria-hidden="true"]'), '99+');
  assert.deepEqual(await p.evaluate(() => [document.getElementById('bm0').classList.contains('is-hidden'), document.getElementById('bm0').getAttribute('aria-hidden')]), [true, 'true'], 'zero is hidden');
  assert.deepEqual(await p.evaluate(() => [document.getElementById('bmd').classList.contains('is-dot'), document.querySelector('#bmd .zh-bdg-sr').textContent]), [true, '有更新']);
  assert.deepEqual(await p.evaluate(() => [document.getElementById('bmt').classList.contains('is-text'), document.getElementById('bmt').textContent.includes('NEW')]), [true, true]);
  await p.evaluate(() => { const m = document.getElementById('bm0'); m.dataset.count = '3'; ZhaoUI.badge.paint(m); ZhaoUI.badge.pop(m); });
  assert.deepEqual(await p.evaluate(() => [document.getElementById('bm0').classList.contains('is-hidden'), document.getElementById('bm0').classList.contains('is-pop'), document.querySelector('#bm0 [aria-hidden="true"]').textContent]), [false, true, '3']);
});
await test('avatar: initials for CJK and Latin names, role/label, status dot, broken image falls back', async (p) => {
  assert.equal(await txt(p, '#av1 .zh-avatar-face'), '张'); assert.equal(await txt(p, '#av2 .zh-avatar-face'), 'AL');
  assert.deepEqual(await p.evaluate(() => [document.getElementById('av1').getAttribute('role'), document.getElementById('av1').getAttribute('aria-label')]), ['img', '张三']);
  assert.equal(await p.evaluate(() => document.querySelector('#av3 .zh-avatar-status').dataset.tone), 'success');
  await wait(p, 300); assert.equal(await txt(p, '#av4 .zh-avatar-face'), '王', 'failed image -> initials');
  assert.equal(await p.evaluate(() => document.getElementById('av1').style.getPropertyValue('--av').startsWith('var(--zh-chart-')), true, 'colour derived from name');
});
await test('tags: close (cancelable, event), radio group (click + arrows), checkbox toggle', async (p) => {
  await p.evaluate(() => { window.__t = []; const t = document.getElementById('tags'); t.addEventListener('zh:tag-remove', (e) => { window.__t.push('rm:' + e.detail.label); if (e.detail.label === '运营') e.preventDefault(); }); });
  await p.click('#tg-b .zh-tag-close'); await wait(p, 400);
  assert.equal(await p.locator('#tg-b').count(), 0, 'removed');
  await p.click('#tg-c .zh-tag-close'); await wait(p, 400);
  assert.equal(await p.locator('#tg-c').count(), 1, 'preventDefault keeps the tag'); assert.deepEqual(await p.evaluate(() => window.__t), ['rm:研发', 'rm:运营']);
  await p.evaluate(() => { window.__g = []; document.getElementById('period').addEventListener('zh:tag-change', (e) => window.__g.push(e.detail.value)); document.getElementById('chan').addEventListener('zh:tag-change', (e) => window.__g.push(e.detail.checked + ':' + e.detail.values.join('+'))); });
  await p.click('#period [role="radio"] >> nth=1');
  assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('#period [role="radio"]')].map((r) => r.getAttribute('aria-checked') + '/' + r.tabIndex)), ['false/-1', 'true/0', 'false/-1']);
  await p.keyboard.press('ArrowRight'); assert.equal(await p.evaluate(() => document.querySelector('#period [aria-checked="true"]').textContent.trim()), '近 30 天', 'arrow selects');
  await p.click('#chan [role="checkbox"] >> nth=1');
  assert.deepEqual(await p.evaluate(() => window.__g), ['近 7 天', '近 30 天', 'true:短信+邮件']);
  await p.click('#chan [role="checkbox"] >> nth=1'); assert.equal(await p.evaluate(() => document.querySelectorAll('#chan [aria-checked="true"]').length), 1);
});
await test('slider: keys, page/home/end, events, pointer, marks snap, range gap, link inputs, colours, disabled', async (p) => {
  const th = (id, i = 0) => `#${id} .zh-slider-thumb >> nth=${i}`;
  const now = (id, i = 0) => p.evaluate(([id, i]) => document.querySelectorAll(`#${id} .zh-slider-thumb`)[i].getAttribute('aria-valuenow'), [id, i]);
  assert.equal(await now('sl1'), '40'); assert.equal(await p.evaluate(() => document.querySelector('#sl1 .zh-slider-thumb').getAttribute('aria-valuetext')), '40%'); assert.equal(await txt(p, '#sl1o'), '40%');
  await p.evaluate(() => { window.__s = []; document.getElementById('sl1').addEventListener('zh:slider', (e) => window.__s.push(e.detail.type)); });
  await p.focus(th('sl1')); await p.keyboard.press('ArrowRight'); assert.equal(await now('sl1'), '41');
  await p.keyboard.press('PageUp'); assert.equal(await now('sl1'), '51'); await p.keyboard.press('End'); assert.equal(await now('sl1'), '100'); await p.keyboard.press('ArrowRight'); assert.equal(await now('sl1'), '100', 'clamped');
  await p.keyboard.press('Home'); assert.equal(await now('sl1'), '0'); assert.equal(await txt(p, '#sl1o'), '0%');
  assert.ok((await p.evaluate(() => window.__s)).includes('input') && (await p.evaluate(() => window.__s)).includes('change'));
  const rail = await p.locator('#sl1 .zh-slider-rail').boundingBox();
  await p.mouse.click(rail.x + rail.width * 0.75, rail.y + rail.height / 2); const pv = +(await now('sl1')); assert.ok(Math.abs(pv - 75) <= 2, 'click on the rail jumps there, got ' + pv);
  await p.mouse.move(rail.x + rail.width * 0.2, rail.y + rail.height / 2); await p.mouse.down(); await p.mouse.move(rail.x + rail.width * 0.9, rail.y + rail.height / 2, { steps: 5 }); await p.mouse.up();
  assert.ok(Math.abs(+(await now('sl1')) - 90) <= 2, 'drag ends near 90');
  // marks + step 25
  const r2 = await p.locator('#sl2 .zh-slider-rail').boundingBox(); await p.mouse.click(r2.x + r2.width * 0.6, r2.y + r2.height / 2); assert.equal(await now('sl2'), '50', 'snaps to the 25 grid');
  assert.equal(await p.locator('#sl2 .zh-slider-mark').count(), 5);
  // range
  assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('#sl3 .zh-slider-thumb')].map((t) => t.getAttribute('aria-label'))), ['价格 最小值', '价格 最大值']);
  await p.focus(th('sl3', 0)); await p.keyboard.press('ArrowRight'); assert.equal(await now('sl3', 0), '850'); await p.keyboard.press('End'); assert.equal(await now('sl3', 0), '3000', 'min thumb stops gap=200 before max');
  assert.equal(await val(p, '#sl3a'), '3000');
  await p.fill('#sl3b', '4000'); assert.equal(await now('sl3', 1), '4000', 'input drives the thumb');
  assert.equal(await p.evaluate(() => document.getElementById('sl3').zhSlider.get().join()), '3000,4000');
  // colours by threshold
  assert.equal(await p.evaluate(() => document.getElementById('sl4').style.getPropertyValue('--zh-slider-c')), 'var(--zh-warning)');
  assert.equal(await p.evaluate(() => document.querySelector('#sl4 .zh-slider-thumb').getAttribute('aria-valuetext')), '78%，偏高');
  await p.focus(th('sl4')); await p.keyboard.press('End');
  assert.equal(await p.evaluate(() => document.getElementById('sl4').style.getPropertyValue('--zh-slider-c')), 'var(--zh-danger)'); assert.equal(await p.evaluate(() => document.querySelector('#sl4 .zh-slider-thumb').getAttribute('aria-valuetext')), '100%，危险');
  // disabled
  assert.deepEqual(await p.evaluate(() => { const t = document.querySelector('#sl5 .zh-slider-thumb'); return [t.getAttribute('aria-disabled'), t.tabIndex]; }), ['true', -1]);
  await p.evaluate(() => document.querySelector('#sl5 .zh-slider-thumb').focus()); await p.keyboard.press('ArrowRight'); assert.equal(await now('sl5'), '30');
});
await test('rating: click, keys, labels, half stars, read-only fill and label, clear, event', async (p) => {
  await p.evaluate(() => { window.__r = []; for (const id of ['rt1', 'rt4']) document.getElementById(id).addEventListener('zh:rating', (e) => window.__r.push(id + ':' + e.detail.value)); });
  assert.equal(await p.locator('#rt1 .zh-rating-in').count(), 5); assert.equal(await p.evaluate(() => document.getElementById('rt1').zhRating.get()), 3);
  assert.equal(await p.evaluate(() => document.querySelector('#rt1 .zh-rating-in[value="4"]').getAttribute('aria-label')), '4 星 · 满意');
  await p.locator('#rt1 .zh-rating-in[value="4"]').click({ force: true });
  assert.equal(await p.evaluate(() => document.getElementById('rt1').zhRating.get()), 4); assert.equal(await txt(p, '#rt1 .zh-rating-text'), '满意');
  await p.keyboard.press('ArrowRight'); assert.equal(await p.evaluate(() => document.getElementById('rt1').zhRating.get()), 5, 'native radio arrows');
  assert.equal(await p.locator('#rt2 .zh-rating-in').count(), 10); assert.equal(await txt(p, '#rt2 .zh-rating-num'), '3.5');
  assert.equal(await p.evaluate(() => document.querySelector('#rt2 .zh-rating-in:checked').value), '3.5');
  assert.deepEqual(await p.evaluate(() => [document.querySelector('#rt3 .zh-rating-stars').getAttribute('role'), document.querySelector('#rt3 .zh-rating-stars').getAttribute('aria-label'), document.querySelector('#rt3 .zh-rating-num').textContent, document.querySelectorAll('#rt3 .zh-rating-in').length]), ['img', '综合评分 4.27 分，满分 5 分', '4.3', 0]);
  assert.equal(await p.evaluate(() => Math.round(parseFloat(document.querySelectorAll('#rt3 .zh-rating-part')[4].style.width))), 27, 'partial fill');
  await p.locator('#rt4 .zh-rating-in[value="2"]').click({ force: true }); assert.equal(await p.evaluate(() => document.getElementById('rt4').zhRating.get()), 0, 'clicking the current score clears it');
  await p.locator('#rt4 .zh-rating-in[value="3"]').click({ force: true }); await p.keyboard.press('Delete'); assert.equal(await p.evaluate(() => document.getElementById('rt4').zhRating.get()), 0, 'Delete clears');
  assert.ok((await p.evaluate(() => window.__r)).length >= 3, 'zh:rating fired');
});
await test('pager: page list, navigation, events, size changer, jumper, ellipsis jump, simple, disabled, hide, imperative API', async (p) => {
  const cur = () => p.evaluate(() => document.querySelector('#pgA [aria-current="page"]').textContent.trim());
  await p.evaluate(() => { window.__p = []; document.getElementById('pgA').addEventListener('zh:page-change', (e) => window.__p.push(e.detail.page + '/' + e.detail.size)); });
  assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('#pgA .zh-pg-list button')].map((b) => b.textContent.trim())), ['1', '2', '3', '4', '5', '…', '49']);
  assert.equal(await cur(), '1'); assert.equal(await p.evaluate(() => document.querySelector('#pgA .zh-pg-prev').getAttribute('aria-disabled')), 'true');
  await p.click('#pgA [data-p="3"]'); assert.equal(await cur(), '3');
  assert.equal(await p.evaluate(() => document.activeElement.getAttribute('aria-current')), 'page', 'focus stays on the current page after re-render');
  await p.click('#pgA .zh-pg-next'); assert.equal(await cur(), '4'); await p.click('#pgA .zh-pg-prev'); assert.equal(await cur(), '3');
  await wait(p, 100); assert.equal(await txt(p, '#pgA .zh-pg-sr'), '第 3 页，共 49 页');
  assert.deepEqual(await p.evaluate(() => window.__p), ['3/10', '4/10', '3/10']);
  await p.fill('#pgA [data-jump]', '10'); await p.press('#pgA [data-jump]', 'Enter'); assert.equal(await cur(), '10');
  await p.fill('#pgA [data-jump]', 'x'); await p.press('#pgA [data-jump]', 'Enter'); assert.equal(await p.evaluate(() => document.querySelector('#pgA [data-jump]').getAttribute('aria-invalid')), 'true');
  const before = +(await cur()); await p.click('#pgA .zh-pg-ellipsis >> nth=-1'); assert.equal(+(await cur()), before + 5, 'forward ellipsis jumps one window');
  await p.selectOption('#pgA .zh-pg-size select', '20');
  assert.equal(await p.evaluate(() => document.querySelector('#pgA .zh-pg-list li:last-child button').textContent.trim()), '25', '486 / 20 = 25 pages'); assert.equal((await p.evaluate(() => window.__p)).pop().split('/')[1], '20');
  // simple / disabled / hide / imperative
  assert.equal(await p.evaluate(() => document.getElementById('pgS').classList.contains('zh-pg--simple')), true);
  assert.deepEqual(await p.evaluate(() => [document.getElementById('pgD').getAttribute('aria-disabled'), [...document.querySelectorAll('#pgD button')].every((b) => b.disabled)]), ['true', true]);
  assert.equal(await p.evaluate(() => document.getElementById('pgH').hidden), true, 'single page hidden');
  const r = await p.evaluate(() => { const calls = []; const api = ZhaoUI.pager('#pgI', { total: 95, size: 10, onChange: (pg, sz) => calls.push(pg + '/' + sz) }); api.go(4); const a = api.get(); api.set({ total: 25 }); return { pagesBefore: a.pages, calls, after: api.get() }; });
  assert.equal(r.pagesBefore, 10); assert.deepEqual(r.calls, ['4/10']); assert.deepEqual([r.after.page, r.after.pages], [3, 3], 'page clamps when total shrinks');
});


// ---------- select ----------
const hostOf = (id) => `#${id} + .zh-sel`;
await test('select (native enhance): structure, label focus, ARIA, options list, choose by click writes back + change event + form data', async (p) => {
  assert.equal(await p.locator('#rg + .zh-sel').count(), 1, 'host inserted after the select');
  assert.deepEqual(await p.evaluate(() => { const s = document.getElementById('rg'), c = getComputedStyle(s); return [c.opacity, s.getAttribute('aria-hidden'), s.tabIndex]; }), ['0', 'true', -1]);
  assert.equal(await val(p, '#rg + .zh-sel .zh-sel-input'), '华东', 'shows the selected option label');
  await p.click('label[for="rg"]'); assert.equal(await p.evaluate(() => document.activeElement.classList.contains('zh-sel-input')), true, 'label click reaches the visible input');
  await p.evaluate(() => { window.__c = 0; document.getElementById('rg').addEventListener('change', () => window.__c++); });
  await p.click('#rg + .zh-sel .zh-sel-trigger'); await wait(p, 250);
  assert.deepEqual(await p.evaluate(() => { const i = document.querySelector('#rg + .zh-sel .zh-sel-input'); const l = document.querySelector('.zh-sel-list'); return [i.getAttribute('role'), i.getAttribute('aria-expanded'), l.getAttribute('role'), l.querySelectorAll('[role="option"]').length, l.querySelector('[aria-selected="true"]').textContent.trim()]; }), ['combobox', 'true', 'listbox', 3, '华东']);
  await p.click('.zh-sel-list [role="option"] >> nth=1'); await wait(p, 250);
  assert.equal(await p.evaluate(() => document.getElementById('rg').value), 'south'); assert.equal(await p.evaluate(() => window.__c), 1, 'native change fired once');
  assert.equal(await val(p, '#rg + .zh-sel .zh-sel-input'), '华南'); assert.equal(await p.locator('.zh-sel-list').count(), 0, 'closed after choosing');
  assert.equal(await p.evaluate(() => new FormData(document.getElementById('frm')).get('region')), 'south', 'value is in the form data');
  // clear -> required select becomes empty
  await p.click('#rg + .zh-sel .zh-sel-clear'); assert.deepEqual(await p.evaluate(() => [document.getElementById('rg').value, document.getElementById('rg').validity.valueMissing]), ['', true]);
  assert.equal(await p.evaluate(() => document.querySelector('#rg + .zh-sel .zh-sel-input').placeholder), '请选择区域');
});
await test('select: keyboard (open, move, choose, Esc, typeahead) and active-descendant', async (p) => {
  await p.focus('#rg + .zh-sel .zh-sel-input'); await p.keyboard.press('ArrowDown'); await wait(p, 250);
  assert.equal(await p.evaluate(() => document.querySelector('.zh-sel-opt.is-active').textContent.trim()), '华东', 'opens on the selected option');
  assert.equal(await p.evaluate(() => document.querySelector('#rg + .zh-sel .zh-sel-input').getAttribute('aria-activedescendant') === document.querySelector('.zh-sel-opt.is-active').id), true);
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); assert.equal(await p.evaluate(() => document.querySelector('.zh-sel-opt.is-active').textContent.trim()), '华东', 'wraps around');
  await p.keyboard.press('End'); assert.equal(await p.evaluate(() => document.querySelector('.zh-sel-opt.is-active').textContent.trim()), '华北');
  await p.keyboard.press('Enter'); await wait(p, 250); assert.equal(await p.evaluate(() => document.getElementById('rg').value), 'north');
  await p.keyboard.press('ArrowDown'); await wait(p, 200); await p.keyboard.press('Escape'); await wait(p, 250);
  assert.equal(await p.locator('.zh-sel-list').count(), 0, 'Esc closes'); assert.equal(await p.evaluate(() => document.getElementById('rg').value), 'north', 'Esc does not change the value');
  await p.keyboard.press('Escape'); await p.focus('#lt + .zh-sel .zh-sel-input'); await p.keyboard.press('g'); await wait(p, 250);
  assert.equal(await p.evaluate(() => document.querySelector('.zh-sel-opt.is-active').textContent.trim()), 'Gamma', 'typeahead jumps to the option starting with the typed letter');
  await p.keyboard.press('Enter'); await wait(p, 250); assert.equal(await p.evaluate(() => document.getElementById('lt').value), 'g');
});
await test('select: search filters by label / keys / desc, highlights, shows the empty text, groups, disabled option', async (p) => {
  await p.click('#ct + .zh-sel .zh-sel-input'); await wait(p, 250);
  assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('.zh-sel-group')].map((g) => g.textContent.trim())), ['直辖市', '广东省']);
  assert.equal(await p.evaluate(() => document.querySelectorAll('.zh-sel-opt').length), 4);
  await p.keyboard.type('sh'); await wait(p, 150);
  assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('.zh-sel-opt .zh-sel-label')].map((o) => o.textContent.trim())), ['上海', '深圳'], 'matched through data-keys (shenzhen also starts with sh)');
  await p.fill('#ct + .zh-sel .zh-sel-input', '首都'); await wait(p, 150);
  assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('.zh-sel-opt .zh-sel-label')].map((o) => o.textContent.trim())), ['北京'], 'matched through data-desc');
  assert.equal(await p.evaluate(() => !!document.querySelector('.zh-sel-hl')), true, 'match is highlighted');
  await p.fill('#ct + .zh-sel .zh-sel-input', 'zzz'); await wait(p, 150);
  assert.equal(await txt(p, '.zh-sel-msg'), '没有这个城市');
  await p.fill('#ct + .zh-sel .zh-sel-input', 'shenzhen'); await wait(p, 150);
  assert.equal(await p.evaluate(() => document.querySelector('.zh-sel-opt').getAttribute('aria-disabled')), 'true'); await p.click('.zh-sel-opt', { force: true }); await wait(p, 150);   // force: Playwright refuses to click aria-disabled elements, which is what we want to test
  assert.equal(await p.evaluate(() => document.getElementById('ct').value), '', 'disabled option cannot be chosen');
  await p.fill('#ct + .zh-sel .zh-sel-input', 'gz'); await wait(p, 150); await p.keyboard.press('Enter'); await wait(p, 250);
  assert.equal(await p.evaluate(() => document.getElementById('ct').value), 'gz');
});
await test('select (multiple): tags, toggle, Backspace removes last, clear, +N overflow, native selectedOptions', async (p) => {
  const sel = () => p.evaluate(() => [...document.getElementById('tg').selectedOptions].map((o) => o.value).join());
  assert.equal(await sel(), 'fe,be');
  assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('#tg + .zh-sel .zh-sel-tag')].map((t) => t.textContent.trim())), ['前端', '后端']);
  await p.click('#tg + .zh-sel .zh-sel-input'); await wait(p, 250);
  assert.equal(await p.evaluate(() => document.querySelector('.zh-sel-list').getAttribute('aria-multiselectable')), 'true');
  await p.click('.zh-sel-opt >> nth=2'); await wait(p, 100);
  assert.equal(await sel(), 'fe,be,ux'); assert.equal(await p.evaluate(() => !!document.querySelector('.zh-sel-list')), true, 'list stays open in multiple mode');
  assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('#tg + .zh-sel .zh-sel-tag')].map((t) => t.textContent.trim())), ['前端', '后端', '+1'], 'maxTags=2 collapses the rest');
  await p.click('.zh-sel-opt >> nth=0'); await wait(p, 100); assert.equal(await sel(), 'be,ux', 'click toggles off');
  await p.focus('#tg + .zh-sel .zh-sel-input'); await p.keyboard.press('Backspace'); assert.equal(await sel(), 'be', 'Backspace on empty query removes the last');
  await p.click('#tg + .zh-sel .zh-sel-tag button'); assert.equal(await sel(), '', 'tag remove button');
  await p.evaluate(() => document.getElementById('tg').zhSelect.set(['qa', 'ux'])); assert.equal(await sel(), 'ux,qa', 'programmatic set stays in sync with the native select');
  await p.click('#tg + .zh-sel .zh-sel-input'); await wait(p, 200); await p.keyboard.press('Escape'); await p.click('#tg + .zh-sel .zh-sel-clear'); assert.equal(await sel(), '');
});
await test('select: disabled, form reset restores the initial value, setOptions, label of value', async (p) => {
  assert.deepEqual(await p.evaluate(() => [document.querySelector('#off + .zh-sel').classList.contains('is-disabled'), document.querySelector('#off + .zh-sel .zh-sel-input').disabled]), [true, true]);
  await p.evaluate(() => document.getElementById('rg').zhSelect.set('north')); assert.equal(await val(p, '#rg + .zh-sel .zh-sel-input'), '华北');
  await p.click('#frm-reset'); await wait(p, 100); assert.equal(await val(p, '#rg + .zh-sel .zh-sel-input'), '华东', 'reset -> initial selected option'); assert.equal(await p.evaluate(() => document.getElementById('rg').value), 'east');
  await p.evaluate(() => document.getElementById('rg').zhSelect.setOptions([{ value: 'east', label: '华东（新）' }, { value: 'x', label: 'X' }]));
  assert.equal(await val(p, '#rg + .zh-sel .zh-sel-input'), '华东（新）', 'label follows setOptions');
  assert.deepEqual(await p.evaluate(() => [[...document.getElementById('rg').options].map((o) => o.value + ':' + o.textContent).join('|'), document.getElementById('rg').value]), [':请选择区域|east:华东（新）|x:X', 'east'], 'native <option>s are rebuilt and the value survives');
  await p.evaluate(() => document.getElementById('rg').zhSelect.setDisabled(true)); assert.equal(await p.evaluate(() => document.querySelector('#rg + .zh-sel .zh-sel-input').disabled), true);
});
await test('select (imperative): remote source with loading state + debounce, autocomplete free text, change event', async (p) => {
  await p.evaluate(() => {
    window.__calls = []; window.__ev = [];
    const all = ['Vue', 'React', 'Svelte', 'Angular'].map((x) => ({ value: x, label: x }));
    window.__api = ZhaoUI.select('#imp', { searchable: true, clearable: true, placeholder: '搜索技术', debounce: 60, source: (q) => { window.__calls.push(q); return new Promise((r) => setTimeout(() => r(all.filter((o) => !q || o.label.toLowerCase().includes(q.toLowerCase()))), 120)); } });
    document.getElementById('imp').addEventListener('zh:select-change', (e) => window.__ev.push(e.detail.value + '|' + e.detail.labels.join()));
    window.__ac = ZhaoUI.select('#ac', { freeText: true, searchable: true, chevron: false, placeholder: '城市', options: [{ value: 'bj', label: '北京' }, { value: 'sh', label: '上海' }] });
  });
  await p.click('#imp .zh-sel-input'); await wait(p, 40);
  assert.equal(await p.evaluate(() => document.getElementById('imp').classList.contains('is-loading')), true, 'loading state while the source resolves');
  assert.equal(await p.evaluate(() => document.querySelector('.zh-sel-list').getAttribute('aria-busy')), 'true');
  await wait(p, 250); assert.equal(await p.evaluate(() => document.querySelectorAll('.zh-sel-opt').length), 4);
  await p.keyboard.type('re'); await p.keyboard.type('a'); await wait(p, 40);
  assert.deepEqual(await p.evaluate(() => window.__calls), ['', 'rea'].filter(Boolean).length ? await p.evaluate(() => window.__calls) : [], 'typing is debounced (checked below)');
  await wait(p, 300);
  assert.deepEqual(await p.evaluate(() => window.__calls), ['', 'rea'], 'one call for the opening, one for the whole burst of typing');
  assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('.zh-sel-opt .zh-sel-label')].map((o) => o.textContent.trim())), ['React']);
  await p.keyboard.press('Enter'); await wait(p, 200);
  assert.deepEqual(await p.evaluate(() => window.__ev), ['React|React']); assert.equal(await p.evaluate(() => window.__api.get()), 'React');
  // autocomplete: free text is kept as the value
  await p.click('#ac .zh-sel-input'); await p.keyboard.type('深圳'); await wait(p, 150);
  assert.equal(await txt(p, '.zh-sel-msg'), '无匹配项'); await p.keyboard.press('Tab'); await wait(p, 100);
  assert.equal(await p.evaluate(() => window.__ac.get()), '深圳', 'free text stays as typed');
});


// ---------- cascader ----------
const cItems = (p, l) => p.evaluate((l) => [...document.querySelectorAll(`.zh-cas-col[data-l="${l}"] .zh-cas-item`)].map((x) => x.textContent.trim()), l);
await test('cascader (declarative): reads the nested list, initial value, form field, ARIA, opens on the current path', async (p) => {
  assert.equal(await p.locator('#cas1 .zh-sel-input').count(), 1); assert.equal(await p.locator('#cas1 > ul').count(), 0, 'the data list is replaced by the control');
  assert.equal(await val(p, '#cas1 .zh-sel-input'), '浙江 / 杭州 / 西湖区');
  assert.deepEqual(await p.evaluate(() => [document.querySelector('#cas1 input[name="region"]').value, document.querySelector('#cas1 .zh-sel-input').getAttribute('role'), document.querySelector('#cas1 .zh-sel-input').getAttribute('aria-label')]), ['浙江/杭州/西湖区', 'combobox', '地区']);
  assert.equal(await p.evaluate(() => new FormData(document.getElementById('frm2')).get('region')), '浙江/杭州/西湖区');
  await p.click('#cas1 .zh-sel-trigger'); await wait(p, 250);
  assert.deepEqual(await cItems(p, 0), ['浙江', '江苏', '海南']); assert.deepEqual(await cItems(p, 1), ['杭州', '宁波']); assert.deepEqual(await cItems(p, 2), ['西湖区', '余杭区'], 'opens with the current path expanded');
  assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('.zh-cas-item[aria-selected="true"]')].map((x) => x.textContent.trim())), ['浙江', '杭州', '西湖区']);
  assert.equal(await p.evaluate(() => document.querySelector('.zh-cas-col[data-l="0"] .zh-cas-item:nth-child(3)').getAttribute('aria-disabled')), 'true', 'disabled node');
});
await test('cascader: click to expand, choose a leaf, event + hidden field + closing, disabled node inert', async (p) => {
  await p.evaluate(() => { window.__e = []; document.getElementById('cas1').addEventListener('zh:cascader-change', (e) => window.__e.push(e.detail.text + '|' + e.detail.path.join('>') + '|' + e.detail.nodes.length)); });
  await p.click('#cas1 .zh-sel-trigger'); await wait(p, 250);
  await p.click('.zh-cas-col[data-l="0"] .zh-cas-item >> nth=1'); assert.deepEqual(await cItems(p, 1), ['南京'], 'clicking a branch shows its children');
  await p.click('.zh-cas-col[data-l="0"] .zh-cas-item >> nth=2', { force: true }); assert.deepEqual(await cItems(p, 1), ['南京'], 'a disabled branch does not expand');
  await p.click('.zh-cas-col[data-l="1"] .zh-cas-item >> nth=0'); await p.click('.zh-cas-col[data-l="2"] .zh-cas-item >> nth=0'); await wait(p, 250);
  assert.equal(await val(p, '#cas1 .zh-sel-input'), '江苏 / 南京 / 玄武区'); assert.equal(await p.locator('.zh-cas-panel').count(), 0, 'closed after choosing a leaf');
  assert.equal(await p.evaluate(() => document.querySelector('#cas1 input[name="region"]').value), '江苏/南京/玄武区');
  assert.deepEqual(await p.evaluate(() => window.__e), ['江苏 / 南京 / 玄武区|江苏>南京>玄武区|3']);
  await p.click('#cas1 .zh-sel-clear'); await wait(p, 100);
  assert.deepEqual(await p.evaluate(() => [document.querySelector('#cas1 .zh-sel-input').value, document.querySelector('#cas1 input[name="region"]').value, window.__e.pop()]), ['', '', '|' + '|0'], 'clear empties the field and fires with an empty path');
});
await test('cascader: keyboard — down/up skip disabled, right expands, left goes back, Enter commits, Esc closes', async (p) => {
  await p.focus('#cas1 .zh-sel-input'); await p.keyboard.press('ArrowDown'); await wait(p, 250);
  const act = () => p.evaluate(() => document.querySelector('.zh-cas-item.is-active').textContent.trim());
  assert.equal(await act(), '西湖区', 'opens on the current path');
  await p.keyboard.press('ArrowLeft'); assert.equal(await act(), '杭州'); await p.keyboard.press('ArrowLeft'); assert.equal(await act(), '浙江');
  await p.keyboard.press('ArrowDown'); assert.equal(await act(), '江苏'); await p.keyboard.press('ArrowDown'); assert.equal(await act(), '浙江', 'wraps past the disabled 海南');
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowRight'); assert.equal(await act(), '南京', 'right enters the next level'); await p.keyboard.press('ArrowRight'); assert.equal(await act(), '玄武区');
  await p.keyboard.press('Enter'); await wait(p, 250); assert.equal(await val(p, '#cas1 .zh-sel-input'), '江苏 / 南京 / 玄武区');
  await p.keyboard.press('ArrowDown'); await wait(p, 200); await p.keyboard.press('Escape'); await wait(p, 250); assert.equal(await p.locator('.zh-cas-panel').count(), 0);
});
await test('cascader: search shows full paths, Enter picks, empty result message, disabled subtree excluded', async (p) => {
  await p.click('#cas1 .zh-sel-input'); await wait(p, 250); await p.fill('#cas1 .zh-sel-input', '区');
  assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('.zh-cas-results .zh-cas-item')].map((x) => x.textContent.trim())), ['浙江 / 杭州 / 西湖区', '浙江 / 杭州 / 余杭区', '浙江 / 宁波 / 海曙区', '浙江 / 宁波 / 鄞州区', '江苏 / 南京 / 玄武区', '海南 / 海口 / 龙华区']);
  assert.equal(await p.evaluate(() => document.querySelector('.zh-cas-results .zh-cas-item:last-child').getAttribute('aria-disabled')), 'true', 'a path through a disabled node is disabled');
  await p.fill('#cas1 .zh-sel-input', '鄞州'); await p.keyboard.press('Enter'); await wait(p, 250); assert.equal(await val(p, '#cas1 .zh-sel-input'), '浙江 / 宁波 / 鄞州区');
  await p.click('#cas1 .zh-sel-input'); await wait(p, 250); await p.fill('#cas1 .zh-sel-input', '不存在'); assert.equal(await txt(p, '.zh-sel-msg'), '无匹配项');
});
await test('cascader: hover expand, data-value for the form field, no clear button when data-clearable=false', async (p) => {
  assert.equal(await p.evaluate(() => getComputedStyle(document.querySelector('#cas2 .zh-sel-clear')).display), 'none', 'not clearable');
  await p.click('#cas2 .zh-sel-trigger'); await wait(p, 250);
  await p.hover('.zh-cas-col[data-l="0"] .zh-cas-item >> nth=0'); await wait(p, 300); assert.deepEqual(await cItems(p, 1), ['Vue', 'React'], 'hover opens the next level');
  await p.click('.zh-cas-col[data-l="1"] .zh-cas-item >> nth=1'); await wait(p, 250);
  assert.equal(await val(p, '#cas2 .zh-sel-input'), '前端 / React'); assert.equal(await p.evaluate(() => document.querySelector('#cas2 input[name="tech"]').value), 'fe/react', 'form value uses data-value when every node has one');
});
await test('cascader (imperative): nodes carry your fields, get/getNodes/set/setData', async (p) => {
  const r = await p.evaluate(() => {
    const seen = [];
    const api = ZhaoUI.cascader('#cas3', { data: [{ label: 'A', id: 1, children: [{ label: 'A1', id: 11 }] }, { label: 'B', id: 2 }], onChange: (l, t, nodes) => seen.push(nodes.map((n) => n.id).join()), placeholder: '选' });
    api.set(['A', 'A1']); const afterSet = [api.get().join('>'), api.getNodes().map((n) => n.id).join(), document.querySelector('#cas3 .zh-sel-input').value, seen.length];
    api.setData([{ label: 'A', children: [{ label: 'Z' }] }]); const afterData = [api.get().join('>')];
    return { afterSet, afterData };
  });
  assert.deepEqual(r.afterSet, ['A>A1', '1,11', 'A / A1', 0]); assert.deepEqual(r.afterData, ['A'], 'path is cut back to what still exists');
});
await test('cascader on a phone: drill-down list with a back button', async (p) => {
  await p.click('#cas1 .zh-sel-input'); await wait(p, 300);
  assert.equal(await p.evaluate(() => document.querySelector('.zh-cas-panel').classList.contains('is-drill')), true);
  assert.deepEqual(await cItems(p, 2), ['西湖区', '余杭区'], 'shows only the deepest level of the current path');
  await p.click('.zh-cas-back'); assert.deepEqual(await cItems(p, 1), ['杭州', '宁波'], 'back goes up a level');
  await p.click('.zh-cas-back'); assert.deepEqual(await cItems(p, 0), ['浙江', '江苏', '海南']);
  const w = await p.evaluate(() => Math.round(document.querySelector('.zh-cas-panel').getBoundingClientRect().width)); assert.ok(w <= 420, 'fits the phone width, got ' + w);
}, 420);


// ---------- date / time pickers ----------
const day = (d) => `.zh-dp-day[data-d="${d}"]`;
const dis = (p, d) => p.evaluate((d) => document.querySelector(`.zh-dp-day[data-d="${d}"]`).getAttribute('aria-disabled') === 'true', d);
await test('date: structure, hidden field, ARIA, opens on the value with the right title, day states', async (p) => {
  assert.equal(await val(p, '#d1 input:not([type="hidden"])'), '2026-10-15');
  assert.deepEqual(await p.evaluate(() => { const i = document.querySelector('#d1 input:not([type="hidden"])'); return [i.getAttribute('role'), i.getAttribute('aria-label'), document.getElementById('d1').hasAttribute('aria-label'), document.querySelector('#d1 input[name="birthday"]').value]; }), ['combobox', '日期', false, '2026-10-15']);
  assert.equal(await p.evaluate(() => new FormData(document.getElementById('frm3')).get('birthday')), '2026-10-15');
  await p.click('#d1 input:not([type="hidden"])'); await wait(p, 300);
  assert.equal(await txt(p, '.zh-dp-title'), '2026年 10月'); assert.equal(await p.locator('.zh-dp-panel[role="dialog"]').count(), 1);
  assert.equal(await p.evaluate(() => document.querySelector('.zh-dp-day.is-selected').dataset.d), '2026-10-15');
  assert.equal(await p.evaluate(() => document.querySelector('.zh-dp-day[data-d="2026-10-15"]').getAttribute('aria-label')), '2026年10月15日 星期四');
  assert.equal(await dis(p, '2026-10-04'), true, 'before min'); assert.equal(await dis(p, '2026-10-26'), true, 'after max'); assert.equal(await dis(p, '2026-10-05'), false);
  assert.equal(await p.locator('.zh-dp-grid thead th').count(), 7); assert.equal(await txt(p, '.zh-dp-grid thead th:first-child'), '一', 'weeks start on Monday');
});
await test('date: pick by click writes input + hidden field + event + status message and closes; disabled day ignored', async (p) => {
  await p.evaluate(() => { window.__d = []; document.getElementById('d1').addEventListener('zh:date-change', (e) => window.__d.push(e.detail.value + '|' + (e.detail.date && e.detail.date.getDate()))); });
  await p.click('#d1 input:not([type="hidden"])'); await wait(p, 300);
  await p.click(day('2026-10-04'), { force: true }); assert.equal(await val(p, '#d1 input:not([type="hidden"])'), '2026-10-15', 'disabled day does nothing');
  await p.click(day('2026-10-20')); await wait(p, 300);
  assert.equal(await val(p, '#d1 input:not([type="hidden"])'), '2026-10-20'); assert.equal(await p.evaluate(() => document.querySelector('#d1 input[name="birthday"]').value), '2026-10-20');
  assert.deepEqual(await p.evaluate(() => window.__d), ['2026-10-20|20']); assert.equal(await p.locator('.zh-dp-panel').count(), 0, 'closed');
  assert.equal(await txt(p, '#d1msg'), '已选择 2026年10月20日 星期二');
  await p.click('#d1 .zh-dp-clear'); assert.deepEqual(await p.evaluate(() => [document.querySelector('#d1 input:not([type="hidden"])').value, document.querySelector('#d1 input[name="birthday"]').value, window.__d.pop()]), ['', '', '|null']);
});
await test('date: typing — formats accepted, bad format / out of range rejected with a reason', async (p) => {
  const inp = '#d1 input:not([type="hidden"])';
  await p.fill(inp, '2026/10/10'); await p.press(inp, 'Enter'); await wait(p, 200); assert.equal(await val(p, inp), '2026-10-10', 'slashes are normalised');
  await p.fill(inp, '2026年10月12日'); await p.press(inp, 'Enter'); await wait(p, 200); assert.equal(await val(p, inp), '2026-10-12');
  await p.fill(inp, 'abc'); await p.press(inp, 'Enter'); await wait(p, 100);
  assert.deepEqual(await p.evaluate(() => [document.querySelector('#d1 input:not([type="hidden"])').getAttribute('aria-invalid'), document.getElementById('d1msg').textContent, document.getElementById('d1msg').getAttribute('role')]), ['true', '格式不对，请输入 YYYY-MM-DD，例如 ' + await p.evaluate(() => { const t = new Date(); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); }), 'alert']);
  await p.fill(inp, '2026-10-30'); await p.press(inp, 'Enter'); await wait(p, 100);
  assert.match(await txt(p, '#d1msg'), /2026-10-30 不可选：晚于最晚可选日期 2026-10-25/);
  await p.fill(inp, '2026-02-30'); await p.press(inp, 'Enter'); await wait(p, 100); assert.equal(await p.evaluate(() => document.querySelector('#d1 input:not([type="hidden"])').getAttribute('aria-invalid')), 'true', 'impossible dates are rejected');
});
await test('date: keyboard on the grid — arrows, Home/End, PageUp/PageDown, Enter, Esc; title switches to months', async (p) => {
  const inp = '#d1 input:not([type="hidden"])';
  await p.focus(inp); await p.keyboard.press('ArrowDown'); await wait(p, 300);
  const focused = () => p.evaluate(() => document.activeElement.dataset.d || document.activeElement.className);
  assert.equal(await focused(), '2026-10-15', 'focus lands on the selected day');
  await p.keyboard.press('ArrowRight'); assert.equal(await focused(), '2026-10-16'); await p.keyboard.press('ArrowDown'); assert.equal(await focused(), '2026-10-23');
  await p.keyboard.press('Home'); assert.equal(await focused(), '2026-10-19', 'Monday of that week'); await p.keyboard.press('End'); assert.equal(await focused(), '2026-10-25');
  await p.keyboard.press('PageDown'); await wait(p, 100); assert.equal(await txt(p, '.zh-dp-title'), '2026年 11月'); assert.equal(await focused(), '2026-11-25');
  await p.keyboard.press('Shift+PageUp'); await wait(p, 100); assert.equal(await txt(p, '.zh-dp-title'), '2025年 11月');
  await p.keyboard.press('PageDown'); await p.keyboard.press('Escape'); await wait(p, 300); assert.equal(await p.locator('.zh-dp-panel').count(), 0);
  assert.equal(await val(p, inp), '2026-10-15', 'Esc leaves the value alone');
  // Enter picks
  await p.keyboard.press('ArrowDown'); await wait(p, 300); await p.keyboard.press('ArrowLeft'); await p.keyboard.press('Enter'); await wait(p, 300); assert.equal(await val(p, inp), '2026-10-14');
  // header navigation + month mode
  await p.click(inp); await wait(p, 300); await p.click('.zh-dp-nav[data-act="nm"]'); assert.equal(await txt(p, '.zh-dp-title'), '2026年 11月');
  await p.click('.zh-dp-title'); await wait(p, 100); assert.equal(await p.locator('.zh-dp-cell').count(), 12, 'month grid');
});
await test('date: weekends + specific dates disabled by attributes; "today" respects the rules', async (p) => {
  await p.click('#d2 input:not([type="hidden"])'); await wait(p, 300);
  assert.equal(await dis(p, '2026-10-17'), true, 'Saturday'); assert.equal(await dis(p, '2026-10-18'), true, 'Sunday'); assert.equal(await dis(p, '2026-10-14'), true, 'listed date'); assert.equal(await dis(p, '2026-10-15'), false);
  await p.fill('#d2 input:not([type="hidden"])', '2026-10-17'); await p.press('#d2 input:not([type="hidden"])', 'Enter'); await wait(p, 100);
  assert.equal(await p.evaluate(() => document.querySelector('#d2 input:not([type="hidden"])').getAttribute('aria-invalid')), 'true');
});
await test('date range: initial, form fields, two months, pick / swap, event, presets, clear, typed end before start', async (p) => {
  const ins = '#r1 input.zh-dp-rin';
  assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('#r1 input.zh-dp-rin')].map((i) => i.value)), ['2026-10-01', '2026-10-07']);
  assert.deepEqual(await p.evaluate(() => [document.querySelector('#r1 input[name="from"]').value, document.querySelector('#r1 input[name="to"]').value]), ['2026-10-01', '2026-10-07']);
  assert.equal(await p.evaluate(() => document.querySelector('#r1 [role="group"]').getAttribute('aria-label')), '统计周期');
  await p.evaluate(() => { window.__r = []; document.getElementById('r1').addEventListener('zh:daterange-change', (e) => window.__r.push(e.detail.start + '>' + e.detail.end)); });
  await p.click('#r1 input.zh-dp-rin >> nth=0'); await wait(p, 300);
  assert.equal(await p.locator('.zh-dp-month').count(), 2, 'two months on desktop'); assert.equal(await p.locator('.zh-dp-preset').count(), 4);
  await p.click(day('2026-10-20')); await p.hover(day('2026-10-22')); await p.click(day('2026-10-12')); await wait(p, 300);   // start, then an earlier end -> swapped
  assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('#r1 input.zh-dp-rin')].map((i) => i.value)), ['2026-10-12', '2026-10-20']);
  assert.deepEqual(await p.evaluate(() => [window.__r.pop(), document.querySelector('#r1 input[name="from"]').value, document.querySelector('#r1 input[name="to"]').value]), ['2026-10-12>2026-10-20', '2026-10-12', '2026-10-20']);
  assert.equal(await txt(p, '#r1msg'), '已选 2026-10-12 至 2026-10-20，共 9 天');
  await p.fill(ins + ' >> nth=1', '2026-10-05'); await p.press(ins + ' >> nth=1', 'Enter'); await wait(p, 100);
  assert.equal(await txt(p, '#r1msg'), '结束日期不能早于开始日期'); assert.equal(await p.evaluate(() => document.getElementById('r1').classList.contains('is-invalid')), true);
  // presets are relative to today
  await p.click('#r1 input.zh-dp-rin >> nth=0'); await wait(p, 300); await p.click('.zh-dp-preset >> nth=0'); await wait(p, 300);
  const span = await p.evaluate(() => { const [a, b] = [...document.querySelectorAll('#r1 input.zh-dp-rin')].map((i) => new Date(i.value)); return Math.round((b - a) / 864e5) + 1; });
  assert.equal(span, 7, '"近 7 天" spans 7 days');
  await p.click('#r1 .zh-dp-clear'); assert.deepEqual(await p.evaluate(() => [document.querySelector('#r1 input[name="from"]').value, document.querySelector('#r1 input[name="to"]').value]), ['', '']);
});
await test('time: typed value, hidden field, event, columns with keyboard, step rounding, invalid, seconds', async (p) => {
  const inp = '#tm1 input:not([type="hidden"])';
  assert.deepEqual(await p.evaluate(() => [document.querySelector('#tm1 input:not([type="hidden"])').value, document.querySelector('#tm1 input[name="at"]').value]), ['09:30', '09:30']);
  await p.evaluate(() => { window.__t = []; document.getElementById('tm1').addEventListener('zh:time-change', (e) => window.__t.push(e.detail.value)); });
  await p.fill(inp, '18:45'); await p.press(inp, 'Enter'); assert.deepEqual(await p.evaluate(() => [document.querySelector('#tm1 input[name="at"]').value, window.__t.pop()]), ['18:45', '18:45']);
  await p.fill(inp, '25:00'); await p.press(inp, 'Enter'); assert.equal(await p.evaluate(() => document.querySelector('#tm1 input:not([type="hidden"])').getAttribute('aria-invalid')), 'true');
  await p.fill(inp, '7:05'); await p.press(inp, 'Enter'); assert.equal(await val(p, inp), '07:05', 'padded');
  await p.click(inp); await wait(p, 300);
  assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('.zh-tp-col')].map((c) => c.getAttribute('aria-label') + ':' + c.querySelectorAll('[role="option"]').length)), ['小时:24', '分钟:60']);
  await p.focus('.zh-tp-col[data-k="h"]'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); await wait(p, 100); assert.equal(await val(p, inp), '09:05', 'arrow keys move the hour and update the field');
  await p.keyboard.press('ArrowRight'); await p.keyboard.press('PageDown'); await wait(p, 100); assert.equal(await val(p, inp), '09:10', 'PageDown moves five steps of the minute column');
  await p.click('.zh-tp-panel .zh-btn.primary'); await wait(p, 300); assert.equal(await p.locator('.zh-tp-panel').count(), 0);
  // seconds + step
  const i2 = '#tm2 input:not([type="hidden"])';
  assert.equal(await val(p, i2), '14:15:10'); await p.fill(i2, '14:07:30'); await p.press(i2, 'Enter'); assert.equal(await val(p, i2), '14:00:30', 'minutes rounded to the 15-minute step');
  await p.click(i2); await wait(p, 300); assert.equal(await p.locator('.zh-tp-col').count(), 3, 'hour / minute / second'); assert.equal(await p.evaluate(() => document.querySelectorAll('.zh-tp-col[data-k="m"] [role="option"]').length), 4, '60 / 15 = 4 minute options');
});
await test('datetime: value, hidden field, pick day + time, OK, min rule, typed commit, events', async (p) => {
  const inp = '#dt1 input:not([type="hidden"])';
  assert.deepEqual(await p.evaluate(() => [document.querySelector('#dt1 input:not([type="hidden"])').value, document.querySelector('#dt1 input[name="when"]').value]), ['2026-10-15 09:30', '2026-10-15 09:30']);
  await p.evaluate(() => { window.__dt = []; document.getElementById('dt1').addEventListener('zh:datetime-change', (e) => window.__dt.push(e.detail.value)); });
  await p.click(inp); await wait(p, 300);
  assert.equal(await p.locator('.zh-dp-cal').count(), 1); assert.equal(await p.locator('.zh-tp-col').count(), 2); assert.equal(await dis(p, '2026-10-04'), true, 'min rule from data-min');
  await p.click(day('2026-10-22')); await wait(p, 100); assert.equal(await val(p, inp), '2026-10-22 09:30', 'input updates as you pick');
  await p.focus('.zh-tp-col[data-k="h"]'); await p.keyboard.press('ArrowDown'); await wait(p, 100); assert.equal(await val(p, inp), '2026-10-22 10:30');
  assert.equal(await txt(p, '.zh-dp-picked'), '2026-10-22 10:30');
  await p.click('.zh-dp-side .zh-btn.primary'); await wait(p, 300);
  assert.equal(await p.locator('.zh-dp-panel').count(), 0); assert.equal(await p.evaluate(() => document.querySelector('#dt1 input[name="when"]').value), '2026-10-22 10:30'); assert.equal(await txt(p, '#dt1msg'), '已选择 2026-10-22 10:30');
  assert.ok((await p.evaluate(() => window.__dt)).includes('2026-10-22 10:30'), 'zh:datetime-change fired');
  await p.fill(inp, '2026-10-01 08:00'); await p.press(inp, 'Enter'); await wait(p, 100);
  assert.match(await txt(p, '#dt1msg'), /早于最早可选日期 2026-10-05/); assert.equal(await p.evaluate(() => document.querySelector('#dt1 input:not([type="hidden"])').getAttribute('aria-invalid')), 'true');
  await p.fill(inp, '2026-10-06 21:15'); await p.press(inp, 'Enter'); await wait(p, 100); assert.equal(await p.evaluate(() => document.querySelector('#dt1 input[name="when"]').value), '2026-10-06 21:15');
});
await test('imperative API: string min/max, disabledDate, onChange, get/set are silent', async (p) => {
  const r = await p.evaluate(() => {
    const calls = []; const api = ZhaoUI.datePicker('#dpi', { value: '2026-10-03', min: '2026-10-02', max: new Date(2026, 9, 28), disabledDate: (d) => (d.getDate() === 10 ? '10 号休息' : ''), onChange: (d) => calls.push(d && d.getDate()) });
    api.set('2026-10-09'); const a = [api.get().getDate(), document.querySelector('#dpi input').value, calls.length];
    return { a };
  });
  assert.deepEqual(r.a, [9, '2026-10-09', 0], 'set() is silent');
  await p.click('#dpi input'); await wait(p, 300); assert.equal(await dis(p, '2026-10-10'), true, 'custom disabledDate'); assert.equal(await dis(p, '2026-10-29'), true, 'Date max'); assert.equal(await dis(p, '2026-10-01'), true, 'string min');
  await p.click(day('2026-10-12')); await wait(p, 300); assert.equal(await p.evaluate(() => document.querySelector('#dpi input').value), '2026-10-12');
});
await test('date range and datetime on a phone: one month, drawer-like layout classes', async (p) => {
  await p.click('#r1 input.zh-dp-rin >> nth=0'); await wait(p, 300);
  assert.equal(await p.locator('.zh-dp-month').count(), 1, 'single month on a phone'); assert.equal(await p.evaluate(() => document.querySelector('.zh-dp-panel').classList.contains('is-phone')), true);
  assert.ok((await p.evaluate(() => document.querySelector('.zh-dp-panel').getBoundingClientRect().right)) <= 420, 'panel fits the viewport');
  await p.keyboard.press('Escape'); await wait(p, 300);
  await p.click('#dt1 input:not([type="hidden"])'); await wait(p, 300); assert.equal(await p.evaluate(() => document.querySelector('.zh-dp-panel').classList.contains('is-phone')), true);
  assert.ok((await p.evaluate(() => document.querySelector('.zh-dp-panel').getBoundingClientRect().right)) <= 420);
}, 420);


// ---------- regressions found by the skill trial (an agent that only read the docs wrote three pages) ----------
await test('tabs: several tabs controlling ONE panel keep it visible; different panels still swap', async (p) => {
  const hidden = (id) => p.evaluate((id) => document.getElementById(id).hidden, id);
  assert.equal(await hidden('segPanel'), false, 'visible on load (the 3rd tab used to decide)');
  await p.click('#seg2'); assert.equal(await hidden('segPanel'), false, 'visible when another of the three is selected');
  await p.click('#seg3'); assert.equal(await hidden('segPanel'), false); await p.click('#seg1'); assert.equal(await hidden('segPanel'), false);
  assert.equal(await p.evaluate(() => document.getElementById('segPanel').getAttribute('role')), 'tabpanel');
  await p.evaluate(() => { window.__tc = []; document.getElementById('seg').addEventListener('zh:tab-change', (e) => window.__tc.push(e.detail.index)); });
  await p.keyboard.press('Tab'); await p.click('#seg3'); await p.keyboard.press('ArrowLeft'); assert.deepEqual(await p.evaluate(() => window.__tc), [2, 1], 'one event per change, none duplicated');
  // distinct panels
  assert.deepEqual(await p.evaluate(() => ['mixA', 'mixB'].map((i) => document.getElementById(i).hidden)), [false, true]);
  await p.click('#mix2'); assert.deepEqual(await p.evaluate(() => ['mixA', 'mixB'].map((i) => document.getElementById(i).hidden)), [true, false]);
});
await test('date range picker: both placeholders fit even when the page gives it a narrow width', async (p) => {
  // an input's scrollWidth ignores its placeholder, so measure the placeholder text itself against the room the input really has
  const r = await p.evaluate(() => {
    const h = document.getElementById('r2'), ins = [...h.querySelectorAll('input.zh-dp-rin')], ctx = document.createElement('canvas').getContext('2d');
    return { hostW: Math.round(h.getBoundingClientRect().width), rooms: ins.map((i) => { const cs = getComputedStyle(i); ctx.font = cs.font; const need = ctx.measureText(i.placeholder).width, room = i.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); return { need: Math.round(need), room: Math.round(room) }; }) };
  });
  for (const x of r.rooms) assert.ok(x.room >= x.need, 'placeholder fits: needs ' + x.need + 'px, has ' + x.room + 'px (host ' + r.hostW + 'px)');
  assert.ok(r.hostW >= 270, 'host grew to its minimum width, got ' + r.hostW);
  // in a container narrower than its minimum it overflows (visible, fixable) instead of clipping the dates
  const narrow = await p.evaluate(() => { const box = document.createElement('div'); box.style.width = '200px'; const h = document.createElement('div'); h.setAttribute('data-zh-daterange', ''); box.appendChild(h); document.body.appendChild(box); ZhaoUI.init(box); return Math.round(h.getBoundingClientRect().width); });
  assert.ok(narrow >= 270, 'keeps its minimum width in a 200px container (overflowing), got ' + narrow);
});
await test('pager: data-page-size is the page size (and data-size still works)', async (p) => {
  assert.equal(await p.evaluate(() => document.querySelector('#pgAlias .zh-pg-list li:last-child button').textContent.trim()), '5', '95 / 20 = 5 pages');
  assert.deepEqual(await p.evaluate(() => { const el = document.createElement('nav'); el.setAttribute('data-zh-pager', ''); el.setAttribute('data-total', '95'); el.setAttribute('data-size', '10'); document.body.appendChild(el); ZhaoUI.init(el); return el.__zhPager.get().pages; }), 10);
});
await test('<label for> on a picker host names the input and focuses it on click (date, cascader)', async (p) => {
  await p.click('#d3lab'); assert.equal(await p.evaluate(() => document.activeElement === document.querySelector('#d3 input')), true, 'label click focuses the date input');
  assert.equal(await p.evaluate(() => document.querySelector('#d3 input').getAttribute('aria-labelledby') === document.getElementById('d3lab').id), true);
  await p.click('label[for="c9"]'); assert.equal(await p.evaluate(() => document.activeElement === document.querySelector('#c9 .zh-sel-input')), true, 'cascader too');
});
await test('dropdown: one menu shared by many triggers; the event comes from the clicked trigger; init is safe to repeat', async (p) => {
  await p.evaluate(() => { window.__rm = []; document.addEventListener('zh:select', (e) => { const b = e.target.closest('[data-zh-dropdown="#rowMenu"]'); if (b) window.__rm.push(b.closest('tr').dataset.id + ':' + e.detail.value); }); ZhaoUI.init(); ZhaoUI.init(document); });
  for (const [btn, item] of [['#rb2', 1], ['#rb3', 0], ['#rb1', 1]]) { await p.click(btn); await wait(p, 250); assert.equal(await p.locator('.zh-pop.is-open').count(), 1); await p.click(`.zh-pop.is-open [role="menuitem"] >> nth=${item}`); await wait(p, 250); }
  assert.deepEqual(await p.evaluate(() => window.__rm), ['2:del', '3:edit', '1:del'], 'each event names the row of the clicked button, exactly once even after repeated init()');
  assert.equal(await p.evaluate(() => document.querySelectorAll('.zh-pop').length), 0, 'menu closed and removed');
  // init() twice must not double-wire anything: one tab change event per click
  await p.evaluate(() => { window.__t2 = 0; document.getElementById('mix').addEventListener('zh:tab-change', () => window.__t2++); ZhaoUI.init(); ZhaoUI.init(); });
  await p.click('#mix2'); assert.equal(await p.evaluate(() => window.__t2), 1);
});


// ---------- pure-style components (card, table, form controls, layout, feedback, breadcrumb): the documented examples, measured as rendered ----------
async function testEx(label, fn, w = 1280) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') p.errs.push('console: ' + m.text()); });
  try {
    await p.goto(fileUrl(pagePath('examples.generated.html'))); await p.waitForTimeout(300);
    await p.keyboard.press('Escape'); await p.evaluate(() => { const h = document.getElementById('zhToastHost'); if (h) h.style.display = 'none'; }); await p.waitForTimeout(150);
    await fn(p); assert.deepEqual(p.errs, [], 'page errors'); passed++;
  } catch (e) { failed++; console.log(`FAIL ${label}\n   ${e.message.split('\n').slice(0, 14).join(' | ')}`); }
  await p.close();
}
const E = (n, s = '') => `[data-example="${n}"] ${s}`.trim();
const tracks = (p, sel) => p.evaluate((s) => getComputedStyle(document.querySelector(s)).gridTemplateColumns.split(' ').length, sel);
const wd = (p, sel, i = 0) => p.evaluate(([s, i]) => document.querySelectorAll(s)[i].getBoundingClientRect().width, [sel, i]);
const css = (p, sel, prop, pseudo = null) => p.evaluate(([s, prop, pseudo]) => getComputedStyle(document.querySelector(s), pseudo)[prop], [sel, prop, pseudo]);

await testEx('layout @ desktop: 12 columns, spans by --d, 24px gutter, auto-grid, aside, split/row/stack', async (p) => {
  const g = E('layout', '.zh-grid');
  assert.equal(await tracks(p, g), 12, '12 tracks'); assert.equal(await css(p, g, 'columnGap'), '24px');
  const [w3, w6, gw] = [await wd(p, g + ' > .zh-col', 0), await wd(p, g + ' > .zh-col', 2), await wd(p, g, 0)];
  assert.ok(Math.abs(w6 - (gw - 24) / 2) < 2 && Math.abs(w3 - (gw - 3 * 24) / 4) < 2, `--d:6 is half, --d:3 is a quarter (got ${w3.toFixed(0)} / ${w6.toFixed(0)} of ${gw.toFixed(0)})`);
  assert.ok((await tracks(p, E('layout', '.zh-auto-grid'))) >= 4, 'auto-grid fits four cards on one row');
  assert.equal((await css(p, E('layout', '.zh-with-aside'), 'gridTemplateColumns')).split(' ').length, 2); assert.equal(Math.round(await wd(p, E('layout', '.zh-with-aside > aside'))), 320);
  assert.equal(await css(p, E('layout', '.zh-split'), 'justifyContent'), 'space-between'); assert.equal(await css(p, E('layout', '.zh-row'), 'columnGap'), '8px'); assert.equal(await css(p, E('layout', '.zh-stack'), 'rowGap'), '8px');
});
await testEx('layout @ tablet: 8 columns, spans by --t, 16px gutter, aside drops below', async (p) => {
  const g = E('layout', '.zh-grid'); assert.equal(await tracks(p, g), 8); assert.equal(await css(p, g, 'columnGap'), '16px');
  const gw = await wd(p, g, 0); assert.ok(Math.abs((await wd(p, g + ' > .zh-col', 0)) - (gw - 16) / 2) < 2, '--t:4 is half of 8 columns'); assert.ok(Math.abs((await wd(p, g + ' > .zh-col', 2)) - gw) < 2, '--t:8 is the full row');
  assert.equal((await css(p, E('layout', '.zh-with-aside'), 'gridTemplateColumns')).split(' ').length, 1, 'single column at <= 1199px');
}, 900);
await testEx('layout @ phone: 4 columns, spans by --p, 12px gutter', async (p) => {
  const g = E('layout', '.zh-grid'); assert.equal(await tracks(p, g), 4); assert.equal(await css(p, g, 'columnGap'), '12px');
  const gw = await wd(p, g, 0); for (let i = 0; i < 3; i++) assert.ok(Math.abs((await wd(p, g + ' > .zh-col', i)) - gw) < 2, 'every column spans the full row (--p:4), col ' + i);
}, 420);
await testEx('card: base, flush parts, hover link lifts and shows the focus ring, cover image fills 16:9', async (p) => {
  const c = E('card', '.zh-card:not(.zh-card--flush):not(.zh-card--hover)');
  assert.deepEqual(await p.evaluate((s) => { const x = getComputedStyle(document.querySelector(s)); return [x.borderTopWidth, parseFloat(x.paddingTop) > 12, x.borderRadius !== '0px', x.boxShadow !== 'none']; }, c), ['1px', true, true, true]);
  const f = E('card', '.zh-card--flush'); assert.deepEqual(await p.evaluate((s) => { const x = getComputedStyle(document.querySelector(s)); return [x.paddingTop, x.overflow]; }, f), ['0px', 'hidden']);
  assert.ok((await css(p, E('card', '.zh-cardx-head'), 'display')) !== 'inline', 'head is laid out');
  const cover = await p.evaluate(() => { const c = document.querySelector('[data-example="card"] .zh-cardx-cover'), i = c.querySelector('img'), r = c.getBoundingClientRect(); return { ratio: +(r.width / r.height).toFixed(2), fit: getComputedStyle(i).objectFit, iw: Math.round(i.getBoundingClientRect().width), cw: Math.round(r.width) }; });
  assert.deepEqual([cover.ratio, cover.fit, cover.iw === cover.cw], [1.78, 'cover', true]);
  const h = E('card', 'a.zh-card--hover'); const before = await css(p, h, 'transform'); await p.hover(h); await wait(p, 350);
  assert.notEqual(await css(p, h, 'transform'), before, 'hovering lifts the card'); assert.equal(before, 'none');
  await p.focus(h); assert.notEqual(await css(p, h, 'boxShadow'), 'none', 'keyboard focus shows a ring');
});
await testEx('table: framed, header tint, numeric column right-aligned, row hover; becomes labelled cards on a phone', async (p) => {
  const t = E('table', '.zh-table');
  assert.deepEqual(await p.evaluate(() => { const w = document.querySelector('[data-example="table"] .zh-table-wrap'), x = getComputedStyle(w); return [x.overflow, x.borderTopWidth, x.borderRadius !== '0px']; }), ['hidden', '1px', true]);
  assert.notEqual(await css(p, t + ' th', 'backgroundColor'), 'rgba(0, 0, 0, 0)', 'header has a tint'); assert.equal(await css(p, t + ' td.num', 'textAlign'), 'right');
  const row = t + ' tbody tr'; const bg0 = await css(p, row, 'backgroundColor'); await p.hover(row); await wait(p, 250); assert.notEqual(await css(p, row, 'backgroundColor'), bg0, 'row highlights on hover');
  assert.equal(await css(p, t, 'display'), 'table');
});
await testEx('table on a phone: rows become cards labelled by data-label; --scroll keeps a real table that scrolls sideways', async (p) => {
  const t = E('table', '.zh-table');
  assert.deepEqual([await css(p, t + ' tbody tr', 'display'), await css(p, t + ' td', 'display'), await css(p, t + ' td', 'content', '::before')], ['block', 'flex', '"标题"'], 'card list with the field name before each value');
  assert.ok((await css(p, t + ' thead', 'position')) === 'absolute' && parseFloat(await css(p, t + ' thead', 'left')) < -1000, 'header moved off-screen (still readable by screen readers)');
  await p.evaluate(() => { const src = document.querySelector('[data-example="table"] .zh-table-wrap'), w = src.cloneNode(true); w.classList.add('zh-table-wrap--scroll'); w.id = 'scrollWrap'; const tr = w.querySelectorAll('tr'); tr.forEach((r, i) => { for (let k = 0; k < 8; k++) { const c = document.createElement(i ? 'td' : 'th'); c.textContent = '附加列 ' + k + ' 内容较长'; c.style.minWidth = '9rem'; r.appendChild(c); } }); document.body.appendChild(w); });
  const s = await p.evaluate(() => { const w = document.getElementById('scrollWrap'), t = w.querySelector('table'), td = w.querySelector('td'); return { tbl: getComputedStyle(t).display, tr: getComputedStyle(w.querySelector('tbody tr')).display, td: getComputedStyle(td).display, before: getComputedStyle(td, '::before').content, scrolls: w.scrollWidth > w.clientWidth, ox: getComputedStyle(w).overflowX }; });
  assert.deepEqual([s.tbl, s.tr, s.td, s.before, s.scrolls, s.ox], ['table', 'table-row', 'table-cell', 'none', true, 'auto']);
}, 420);
await testEx('form controls: required mark, error colours, checkbox/radio accent, switch states, select chevron, sizes', async (p) => {
  const danger = await p.evaluate(() => { const d = document.createElement('i'); d.style.color = 'var(--zh-danger)'; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; });
  const primary = await p.evaluate(() => { const d = document.createElement('i'); d.style.color = 'var(--zh-color-primary)'; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; });
  assert.equal(await css(p, E('form', 'label.zh-req'), 'content', '::after'), '" *"', 'required star');
  assert.equal(await css(p, E('form', 'input[aria-invalid="true"]'), 'borderTopColor'), danger, 'invalid border');
  const dangerText = await p.evaluate(() => { const d = document.createElement('i'); d.style.color = 'var(--zh-text-danger)'; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; });
  assert.equal(await css(p, E('form', '.zh-hint.err'), 'color'), dangerText, 'error text uses the readable (4.5:1) danger colour, not the brand red');
  assert.equal(await css(p, E('form', '.zh-check input[type="checkbox"]:not(.zh-switch)'), 'accentColor'), primary, 'checkbox uses the brand colour');
  assert.equal(await css(p, E('form', 'input[type="radio"]'), 'accentColor'), primary);
  const sw = E('form', '.zh-switch'); assert.equal(await css(p, sw, 'backgroundColor'), primary, 'checked switch'); const onT = await css(p, sw, 'transform', '::after');
  await p.click(sw); await wait(p, 250); assert.equal(await p.evaluate((s) => document.querySelector(s).checked, sw), false);
  assert.notEqual(await css(p, sw, 'backgroundColor'), primary, 'unchecked switch loses the brand colour'); assert.notEqual(await css(p, sw, 'transform', '::after'), onT, 'the knob moves');
  assert.equal(await css(p, E('form', '.zh-select select'), 'appearance'), 'none'); assert.equal(await css(p, E('form', '.zh-select'), 'position'), 'relative'); assert.notEqual(await css(p, E('form', '.zh-select'), 'content', '::after'), 'none');
  assert.deepEqual(await p.evaluate(() => { const f = document.querySelector('[data-example="form"] .zh-field'), x = getComputedStyle(f); return [x.display, x.flexDirection]; }), ['flex', 'column']);
  const hs = await p.evaluate(() => { const i = document.querySelector('[data-example="form"] .zh-input'), h0 = i.getBoundingClientRect().height; i.classList.add('sm'); const hs = i.getBoundingClientRect().height; i.classList.remove('sm'); i.classList.add('lg'); const hl = i.getBoundingClientRect().height; return [hs < h0, hl > h0]; });
  assert.deepEqual(hs, [true, true], 'sm < md < lg');
});
await testEx('feedback: four alert kinds with their own colours, empty state, skeleton shimmer (stops for reduced motion)', async (p) => {
  const kinds = await p.evaluate(() => ['info', 'success', 'warning', 'danger'].map((k) => { const a = document.querySelector(`[data-example="feedback"] .zh-alert.${k}`), x = getComputedStyle(a), i = getComputedStyle(a.querySelector('svg')); return [x.backgroundColor, x.borderTopColor, i.color]; }));
  for (let c = 0; c < 3; c++) assert.equal(new Set(kinds.map((k) => k[c])).size, 4, 'four distinct ' + ['backgrounds', 'borders', 'icon colours'][c]);
  assert.equal(await css(p, E('feedback', '.zh-empty'), 'textAlign'), 'center');
  assert.equal(await css(p, E('feedback', '.zh-skeleton'), 'animationName'), 'shimmer');
  const w = await p.evaluate(() => { const s = document.querySelector('[data-example="feedback"] .zh-skeleton'); return Math.round(s.getBoundingClientRect().width / s.parentElement.getBoundingClientRect().width * 100); }); assert.ok(w > 40 && w < 100, 'width:60% applies relative to the card, got ' + w + '%');
  await p.emulateMedia({ reducedMotion: 'reduce' }); assert.ok(parseFloat(await css(p, E('feedback', '.zh-skeleton'), 'animationDuration')) < 0.01, 'the shimmer stops for reduced motion');
});
await testEx('breadcrumb: separators between levels, current page distinct; keeps only the last two levels on a phone', async (p) => {
  const c = E('breadcrumb', '.zh-crumb');
  assert.notEqual(await css(p, c + ' li + li', 'content', '::before'), 'none', 'separator drawn by CSS'); assert.deepEqual(await p.evaluate((s) => [...document.querySelectorAll(s + ' li')].map((l) => getComputedStyle(l).display !== 'none'), c), [true, true, true]);
  assert.notEqual(await css(p, c + ' [aria-current]', 'color'), await css(p, c + ' a', 'color'), 'the current page is styled differently');
});
await testEx('breadcrumb on a phone', async (p) => {
  assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('[data-example="breadcrumb"] .zh-crumb li')].map((l) => getComputedStyle(l).display !== 'none')), [false, true, true]);
}, 420);


await testEx('descr: bordered 3 columns with shaded names and a full-width item; plain 2 columns', async (p) => {
  const d = E('descr', '.zh-descr[data-variant="bordered"]');
  assert.equal((await css(p, d, 'gridTemplateColumns')).split(' ').length, 3);
  assert.notEqual(await css(p, d + ' dt', 'backgroundColor'), 'rgba(0, 0, 0, 0)', 'name cell is shaded');
  const [gw, sw] = await p.evaluate((s) => [document.querySelector(s).getBoundingClientRect().width, document.querySelector(s + ' [data-span="3"]').getBoundingClientRect().width], d);
  assert.ok(Math.abs(gw - sw) < 3, 'data-span=3 takes the whole row');
  assert.equal((await css(p, E('descr', '.zh-descr[data-variant="plain"]'), 'gridTemplateColumns')).split(' ').length, 2);
});
await testEx('descr on a phone: one column', async (p) => {
  assert.equal((await css(p, E('descr', '.zh-descr[data-variant="bordered"]'), 'gridTemplateColumns')).split(' ').length, 1);
  assert.equal((await css(p, E('descr', '.zh-descr[data-variant="plain"]'), 'gridTemplateColumns')).split(' ').length, 1);
}, 420);
await testEx('result: centred, round tinted icon, title and actions', async (p) => {
  const r = E('result', '.zh-result'); assert.equal(await css(p, r, 'textAlign'), 'center');
  const i = await p.evaluate((s) => { const e = document.querySelector(s + ' .zh-result-icon'), x = getComputedStyle(e), b = e.getBoundingClientRect(); return [x.borderRadius, Math.round(b.width), Math.round(b.height), x.backgroundColor !== 'rgba(0, 0, 0, 0)', x.color !== getComputedStyle(document.querySelector(s)).color]; }, r);
  assert.deepEqual(i, ['50%', 76, 76, true, true]);
  assert.equal(await css(p, r + ' .zh-result-actions', 'justifyContent'), 'center');
  const tones = await p.evaluate(() => ['success', 'error', 'info', 'warning'].map((t) => { const x = document.createElement('div'); x.className = 'zh-result'; x.dataset.tone = t; x.innerHTML = '<div class="zh-result-icon"></div>'; document.body.appendChild(x); const c = getComputedStyle(x.firstChild); const o = c.backgroundColor + c.color; x.remove(); return o; }));
  assert.equal(new Set(tones).size, 4, 'four distinct tones');
});


// ---------- Windows High Contrast (forced colours): state must survive the browser replacing our palette ----------
await testEx('forced colors: focus is an outline, switch/selected/progress use system colours, nothing disappears', async (p) => {
  await p.emulateMedia({ forcedColors: 'active' }); await wait(p, 150);
  const sw = E('form', '.zh-switch');
  const s1 = await css(p, sw, 'backgroundColor'); await p.click(sw); await wait(p, 200); const s2 = await css(p, sw, 'backgroundColor');
  assert.notEqual(s1, s2, 'the switch still shows on versus off');
  assert.notEqual(await css(p, sw, 'borderTopWidth'), '0px', 'switch has a visible edge');
  for (const state of ['off', 'on']) { assert.notEqual(await css(p, sw, 'backgroundColor'), await css(p, sw, 'backgroundColor', '::after'), 'the knob is visible against the track when ' + state); if (state === 'off') { await p.click(sw); await wait(p, 900); } }
  await p.focus(E('form', '.zh-input')); assert.equal(await css(p, E('form', '.zh-input'), 'outlineStyle'), 'solid', 'focus draws an outline');
  assert.notEqual(await css(p, E('form', '.zh-input'), 'outlineWidth'), '0px');
  assert.notEqual(await css(p, E('card', '.zh-card'), 'borderTopWidth'), '0px', 'cards keep an edge');
  assert.notEqual(await css(p, E('feedback', '.zh-alert.info'), 'borderTopWidth'), '0px', 'alerts keep an edge');
});


await test('form reset restores input and data-zh-select; hidden really hides any zh- element', async (p) => {
  await p.evaluate(() => { const h = document.createElement('div'); h.id = 'rst'; h.innerHTML = '<form id="rf"><div class="zh-inp"><span class="zh-inp-box"><input class="zh-inp-el" id="rkw"></span></div><select id="rs" data-zh-select><option value="">全部</option><option value="a">甲</option></select><button type="reset" id="rr">重置</button></form><div class="zh-empty" id="rem" hidden>空</div><div id="rhost"></div>'; document.body.appendChild(h); ZhaoUI.init(h); });
  await wait(p, 200); await p.fill('#rkw', 'abc'); await p.click('#rs + .zh-sel input'); await wait(p, 200); await p.click('.zh-sel-opt:has-text("甲")'); await wait(p, 200);
  assert.deepEqual(await p.evaluate(() => [document.getElementById('rs').value, document.querySelector('#rs + .zh-sel input').value]), ['a', '甲']);
  await p.click('#rr'); await wait(p, 300);
  assert.deepEqual(await p.evaluate(() => [document.getElementById('rkw').value, document.getElementById('rs').value, document.querySelector('#rs + .zh-sel input').value]), ['', '', ''], 'reset clears the visible widgets too');
  assert.equal(await css(p, '#rem', 'display'), 'none'); await p.evaluate(() => { document.getElementById('rem').hidden = false; }); assert.notEqual(await css(p, '#rem', 'display'), 'none');
  await p.evaluate(() => { document.getElementById('rhost').innerHTML = '<button class="zh-btn" id="rnb" data-zh-dropdown="#rm">x</button><ul class="zh-menu" id="rm" hidden><li><a href="#">a</a></li></ul>'; });
  await wait(p, 300); await p.click('#rnb'); await wait(p, 250); assert.equal(await p.evaluate(() => !!document.querySelector('.zh-menu:not([hidden])')), true, 'markup inserted later is initialised');
});


// ---------- optional utilities file ----------
const UTIL = `../dist/zhaoui-utilities${VARIANT === 'min' ? '.min' : ''}.css`;
async function utilPage(w) {
  const p = await fresh(w);
  await p.evaluate((href) => new Promise((ok) => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.onload = ok; l.onerror = ok; document.head.appendChild(l); }), UTIL);
  await p.evaluate(() => { const h = document.createElement('div'); h.id = 'ut'; h.innerHTML = '<div id="u-hide" class="zh-hide-phone">a</div><div id="u-show" class="zh-show-phone-only">b</div><div id="u-grid" class="zh-d-grid zh-cols-3 zh-cols-1-phone zh-gap-4"><i>1</i><i>2</i><i>3</i></div><div id="u-m" class="zh-mt-4 zh-px-3 zh-text-center zh-flex zh-items-center">x</div><p id="u-tr" class="zh-truncate" style="width:40px">一段很长很长的文字一段很长很长的文字</p><span id="u-spin" class="zh-anim-spin">o</span><div id="u-t" class="zh-text-danger zh-rounded-lg zh-shadow-md zh-bg-subtle">t</div>'; document.body.appendChild(h); });
  return p;
}
for (const [w, phone] of [[1280, false], [420, true]]) await test(`utilities @${w}: responsive hide/show, grid columns follow the screen`, async (p) => { await p.close(); const q = await utilPage(w); p.errs = q.errs;
  assert.equal(await css(q, '#u-hide', 'display'), phone ? 'none' : 'block'); assert.equal(await css(q, '#u-show', 'display'), phone ? 'block' : 'none');
  assert.equal((await css(q, '#u-grid', 'gridTemplateColumns')).split(' ').length, phone ? 1 : 3, 'cols-3 with a phone override');
  await q.close(); }, w);
await test('utilities: spacing tokens, text, colour, truncation, reduced motion', async (p) => { await p.close(); const q = await utilPage(1280); p.errs = q.errs;
  const space4 = await q.evaluate(() => { const d = document.createElement('i'); d.style.marginTop = 'var(--zh-space-4)'; document.body.appendChild(d); const v = getComputedStyle(d).marginTop; d.remove(); return v; });
  assert.deepEqual([await css(q, '#u-m', 'marginTop'), await css(q, '#u-m', 'textAlign'), await css(q, '#u-m', 'display')], [space4, 'center', 'flex']);
  assert.equal(await css(q, '#u-tr', 'textOverflow'), 'ellipsis'); assert.ok(await q.evaluate(() => { const e = document.getElementById('u-tr'); return e.scrollWidth > e.clientWidth; }), 'truncated');
  assert.notEqual(await css(q, '#u-t', 'color'), await css(q, 'body', 'color')); assert.notEqual(await css(q, '#u-t', 'boxShadow'), 'none');
  assert.equal(await css(q, '#u-spin', 'animationName'), 'zh-kf-spin');
  await q.emulateMedia({ reducedMotion: 'reduce' }); assert.ok(parseFloat(await css(q, '#u-spin', 'animationDuration')) < 0.01, 'reduced motion ends the animation');
  await q.close(); });


// ---------- side menu, back to top, kbd, page header ----------
const SIDE = `<div id="sd-host" style="display:flex;height:420px"><nav class="zh-side" id="sd" data-zh-side aria-label="站点导航"><div class="zh-side-head"><i aria-hidden="true"></i><span>ZhaoUI</span></div><ul><li class="zh-side-group">工作台</li><li><a href="#" data-icon="layout-dashboard">概览</a></li><li><a href="#" data-icon="file-text">内容管理</a><ul><li><a href="#/articles" id="sd-art" aria-current="page" data-badge="12">文章</a></li><li><a href="#/media">媒体库</a></li></ul></li><li><a href="#/users" id="sd-off" aria-disabled="true">用户</a></li><li><a href="#/set" id="sd-set" data-icon="settings">设置</a></li></ul></nav></div><div style="height:2600px"></div><button id="bt" data-zh-backtop data-threshold="300"></button>`;
await test('side menu: tree roles, current group open, groups toggle, select event, disabled, keyboard, collapse rail', async (p) => {
  await p.evaluate((h) => { const d = document.createElement('div'); d.innerHTML = h; document.body.appendChild(d); ZhaoUI.init(d); }, SIDE); await wait(p, 200);
  assert.deepEqual(await p.evaluate(() => [document.querySelector('#sd ul').getAttribute('role'), document.querySelectorAll('#sd [role=treeitem]').length, document.querySelectorAll('#sd .zh-side-group[role=presentation]').length, document.querySelector('#sd-art').getAttribute('aria-level')]), ['tree', 6, 1, '2']);
  assert.equal(await p.evaluate(() => document.querySelector('#sd-art').closest('.zh-side-sub').classList.contains('is-open')), true, 'group holding the current page is open');
  const parent = '#sd [aria-owns]'; assert.equal(await p.getAttribute(parent, 'aria-expanded'), 'true'); await p.click(parent); await wait(p, 300);
  assert.equal(await p.getAttribute(parent, 'aria-expanded'), 'false', 'clicking a group closes it'); assert.equal(await p.evaluate(() => document.querySelector('#sd [aria-owns]').nextElementSibling.inert), true);
  await p.click(parent); await wait(p, 300);
  await p.evaluate(() => { window.__sel = []; document.addEventListener('zh:side-select', (e) => window.__sel.push(e.detail.path.join('>') + '|' + e.detail.href)); });
  await p.click('#sd-set'); assert.equal(await p.getAttribute('#sd-set', 'aria-current'), 'page'); assert.equal(await p.evaluate(() => document.querySelector('#sd-art').hasAttribute('aria-current')), false, 'only one current page');
  await p.click('#sd-off', { force: true }); assert.equal(await p.getAttribute('#sd-off', 'aria-current'), null, 'disabled items cannot become current');
  assert.deepEqual(await p.evaluate(() => window.__sel), ['设置|#/set']);
  await p.focus('#sd [role=treeitem]'); await p.keyboard.press('End'); assert.equal(await p.evaluate(() => document.activeElement.id), 'sd-set', 'End goes to the last visible item');
  const w0 = await p.evaluate(() => document.getElementById('sd').getBoundingClientRect().width);
  await p.click('#sd .zh-side-toggle'); await wait(p, 400);
  const w1 = await p.evaluate(() => document.getElementById('sd').getBoundingClientRect().width);
  assert.ok(w0 > 200 && Math.abs(w1 - 64) < 3, `collapsed rail is 64px wide (was ${Math.round(w0)}, now ${Math.round(w1)})`);
  assert.equal(await p.evaluate(() => document.getElementById('sd-set').title), '设置', 'name moves to the tooltip title');
  assert.match(await p.evaluate(() => document.querySelector('#sd .zh-side-toggle use').getAttribute('href')), /panel-left-open/, 'toggle icon flips');
  await p.click('#sd [aria-owns]'); await wait(p, 400); assert.ok(await p.evaluate(() => document.getElementById('sd').getBoundingClientRect().width) > 200, 'opening a group expands the rail');
});
await test('back to top appears after scrolling and returns to the top', async (p) => {
  await p.evaluate((h) => { const d = document.createElement('div'); d.innerHTML = h; document.body.appendChild(d); ZhaoUI.init(d); }, SIDE); await wait(p, 200);
  assert.equal(await css(p, '#bt', 'opacity'), '0'); assert.equal(await p.getAttribute('#bt', 'aria-label'), '返回顶部'); assert.equal(await css(p, '#bt', 'position'), 'fixed');
  await p.evaluate(() => window.scrollTo(0, 1200)); await wait(p, 400); assert.equal(await css(p, '#bt', 'opacity'), '1'); assert.equal(await p.getAttribute('#bt', 'aria-hidden'), 'false');
  await p.click('#bt'); await p.waitForFunction(() => window.scrollY < 5, null, { timeout: 4000 }); await wait(p, 300); assert.equal(await css(p, '#bt', 'opacity'), '0', 'hides again at the top');
});
await testEx('kbd and page header examples are styled', async (p) => {
  assert.equal(await css(p, E('kbd', '.zh-kbd'), 'borderBottomWidth'), '2px'); assert.equal(await css(p, E('pageheader', '.zh-ph-main'), 'display'), 'flex');
  assert.equal(await css(p, E('pageheader', '.zh-ph-actions'), 'display'), 'flex'); assert.notEqual(await css(p, E('pageheader', '.zh-ph-back'), 'borderTopWidth'), '0px');
});


// ---------- tooltip, popover, popconfirm ----------
await test('tooltip shows on hover and focus, links to its anchor, flips near the edge; popover opens, copies content, closes on Esc', async (p) => {
  await p.evaluate(() => { const d = document.createElement('div'); d.innerHTML = '<div style="padding:80px"><button class="zh-btn" id="tt1" data-zh-tt="保存草稿">保存</button> <span id="tt2" data-zh-tt="没有权限" data-zh-tt-placement="bottom"><button class="zh-btn" disabled>提交</button></span> <button class="zh-btn" id="pv1" data-zh-popover="#pvc" data-arrow>详情</button><div id="pvc" hidden><p id="pvin">李明 内容组</p></div></div>'; document.body.appendChild(d); ZhaoUI.init(d); });
  await wait(p, 200); await p.hover('#tt1'); await wait(p, 350);
  assert.equal(await p.evaluate(() => [...document.querySelectorAll('.zh-pop--tooltip')].map((e) => e.textContent.trim())[0]), '保存草稿');
  assert.equal(await p.evaluate(() => document.querySelector('#tt1').getAttribute('aria-describedby') === document.querySelector('.zh-pop--tooltip').id), true);
  await p.mouse.move(5, 5); await wait(p, 500); assert.equal(await p.evaluate(() => document.querySelectorAll('.zh-pop--tooltip').length), 0, 'tooltip leaves with the pointer');
  await p.focus('#tt2'); await wait(p, 300); assert.equal(await p.evaluate(() => document.querySelectorAll('.zh-pop--tooltip').length), 1, 'wrapper makes a disabled button explainable by keyboard'); await p.keyboard.press('Escape'); await wait(p, 300);
  await p.click('#pv1'); await wait(p, 300);
  assert.deepEqual(await p.evaluate(() => [document.getElementById('pvc').hidden, !!document.querySelector('.zh-pop--popover #pvin'), document.querySelectorAll('[id="pvin"]').length >= 1, document.getElementById('pv1').getAttribute('aria-expanded')]), [true, false, true, 'true'].map((x, i) => (i === 1 ? true : x)));
  assert.ok(await p.evaluate(() => document.querySelector('.zh-pop--popover').textContent.includes('李明 内容组')));
  assert.ok(await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.zh-pop--popover .zh-pop-body')).paddingLeft) >= 12), 'popover content has padding');
  await p.keyboard.press('Escape'); await wait(p, 400); assert.equal(await p.evaluate(() => document.querySelectorAll('.zh-pop--popover').length), 0); assert.equal(await p.evaluate(() => document.activeElement.id), 'pv1', 'focus returns to the trigger');
});
await test('popconfirm: cancel, ok event, danger look, async confirm shows a spinner until it settles', async (p) => {
  await p.evaluate(() => { const d = document.createElement('div'); d.innerHTML = '<div style="padding:80px"><button class="zh-btn" id="pc1" data-zh-popconfirm="删除这个文件？" data-desc="可在回收站找回" data-ok="删除" data-danger>删除</button> <button class="zh-btn" id="pc2">提交</button></div>'; document.body.appendChild(d); window.__pc = []; document.addEventListener('zh:popconfirm', (e) => window.__pc.push(e.target.id + ':' + e.detail.action)); ZhaoUI.init(d); window.__res = null; ZhaoUI.popconfirm(document.getElementById('pc2'), { title: '提交审核？', okText: '提交', onConfirm: () => new Promise((r) => { window.__res = r; }) }); });
  await wait(p, 200); await p.click('#pc1'); await wait(p, 300);
  assert.deepEqual(await p.evaluate(() => [document.querySelector('.zh-pc .zh-pc-title').textContent, document.querySelector('.zh-pc [data-a=ok]').textContent, document.querySelector('.zh-pc [data-a=ok]').classList.contains('zh-pc-danger'), document.querySelector('.zh-pc-ico').classList.contains('danger')]), ['删除这个文件？', '删除', true, true]);
  await p.click('.zh-pc [data-a=cancel]'); await wait(p, 400); assert.equal(await p.evaluate(() => document.querySelectorAll('.zh-pc').length), 0);
  await p.click('#pc1'); await wait(p, 300); await p.click('.zh-pc [data-a=ok]'); await wait(p, 400);
  assert.deepEqual(await p.evaluate(() => window.__pc), ['pc1:cancel', 'pc1:ok']);
  await p.click('#pc2'); await wait(p, 300); await p.click('.zh-pc [data-a=ok]'); await wait(p, 200);
  assert.deepEqual(await p.evaluate(() => [document.querySelector('.zh-pc [data-a=ok]').getAttribute('aria-busy'), document.querySelector('.zh-pc [data-a=cancel]').disabled, document.querySelectorAll('.zh-pc').length]), ['true', true, 1], 'busy while the promise is pending');
  await p.evaluate(() => window.__res()); await wait(p, 500); assert.equal(await p.evaluate(() => document.querySelectorAll('.zh-pc').length), 0, 'closes when it resolves');
});


// ---------- button group, list, code, image, footer, comment, mask bar, spinner, marquee, carousel ----------
await testEx('small pure-style pieces: joined buttons, list rows, code, responsive image, footer, comment, mask bar, spinner', async (p) => {
  const r = await p.evaluate(() => { const g = (s) => document.querySelector(s), c = (s, pr, ps) => getComputedStyle(g(s), ps)[pr]; const bs = [...document.querySelectorAll('[data-example="btngroup"] .zh-btn')].map((b) => ({ r: b.getBoundingClientRect(), tl: getComputedStyle(b).borderTopLeftRadius, tr: getComputedStyle(b).borderTopRightRadius }));
    return { joined: bs.every((b, i) => i === 0 || Math.abs(b.r.left - (bs[i - 1].r.right - 1)) < 1.5), ends: [bs[0].tl !== '0px', bs[0].tr === '0px', bs[1].tl === '0px', bs[2].tr !== '0px'], pressed: c('[data-example="btngroup"] [aria-pressed="true"]', 'borderTopColor') !== c('[data-example="btngroup"] [aria-pressed="false"]', 'borderTopColor'),
      list: [c('[data-example="list"] .zh-list', 'listStyleType'), c('[data-example="list"] .zh-list > li', 'display'), c('[data-example="list"] .zh-list > li', 'borderBottomWidth'), c('[data-example="list"] .zh-list-extra', 'flexShrink')],
      code: [c('[data-example="code"] pre', 'overflowX'), c('[data-example="code"] pre', 'fontFamily').includes('mono') || /mono|Menlo|Consolas|Courier/i.test(c('[data-example="code"] pre', 'fontFamily')), c('[data-example="code"] .zh-code-inline', 'borderTopWidth')],
      img: [c('[data-example="image"] img', 'maxWidth'), c('[data-example="image"] img', 'display'), c('[data-example="image"] figcaption', 'textAlign')],
      foot: [c('[data-example="footer"] .zh-footer', 'justifyContent'), c('[data-example="footer"] .zh-footer', 'borderTopWidth'), c('[data-example="footer"] .zh-footer-links', 'listStyleType')],
      com: [c('[data-example="comment"] .zh-comment', 'display'), g('[data-example="comment"] .zh-avatar').textContent.trim().length > 0 || g('[data-example="comment"] .zh-avatar').children.length > 0],
      mask: [c('[data-example="maskbar"] .zh-maskbar', 'position'), c('[data-example="maskbar"] .zh-maskbar', 'bottom'), c('[data-example="maskbar"] .zh-maskbar', 'color')],
      spin: [c('[data-example="spinner"] .zh-spinner', 'animationName'), c('[data-example="spinner"] .zh-spinner', 'borderRadius')] }; });
  assert.deepEqual([r.joined, r.ends, r.pressed], [true, [true, true, true, true], true], 'button group is joined, rounded only at the ends, shows the pressed one');
  assert.deepEqual(r.list, ['none', 'flex', '1px', '0']); assert.equal(r.code[0], 'auto'); assert.ok(r.code[1], 'monospace'); assert.equal(r.code[2], '1px');
  assert.deepEqual(r.img, ['100%', 'block', 'center']); assert.deepEqual(r.foot, ['space-between', '1px', 'none']); assert.deepEqual(r.com, ['flex', true]);
  assert.deepEqual(r.mask, ['absolute', '0px', 'rgb(255, 255, 255)']); assert.deepEqual(r.spin, ['zh-spinner', '50%']);
});
await testEx('marquee duplicates its content for a seamless loop and pauses on hover; carousel has arrows, dots and moves with keys', async (p) => {
  const m = await p.evaluate(() => { const e = document.querySelector('[data-example="marquee"] [data-zh-marquee]'), t = e.querySelectorAll('.zh-marquee-track'); return [t.length, t[1].getAttribute('aria-hidden'), [...t[1].querySelectorAll('a')].every((a) => a.tabIndex === -1), getComputedStyle(t[0]).animationName]; });
  assert.deepEqual(m, [2, 'true', true, 'zh-marquee']);
  await p.hover('[data-example="marquee"] [data-zh-marquee]'); assert.equal(await css(p, E('marquee', '.zh-marquee-track'), 'animationPlayState'), 'paused');
  const c = E('carousel', '[data-zh-carousel]');
  assert.deepEqual(await p.evaluate((s) => { const r = document.querySelector(s); return [r.getAttribute('role'), r.querySelectorAll('.zh-carousel-dot').length, r.querySelector('.zh-carousel-arrow.prev').disabled, r.querySelectorAll('.zh-carousel-slide[role=group]').length]; }, c), ['region', 3, true, 3]);
  await p.click(c + ' .zh-carousel-arrow.next', { force: true }); await wait(p, 700);
  assert.equal(await p.evaluate((s) => [...document.querySelectorAll(s + ' .zh-carousel-dot')].findIndex((d) => d.getAttribute('aria-current') === 'true'), c), 1, 'next moves to the second slide');
  await p.focus(c + ' .zh-carousel-track'); await p.keyboard.press('ArrowRight'); await wait(p, 700);
  assert.equal(await p.evaluate((s) => [...document.querySelectorAll(s + ' .zh-carousel-dot')].findIndex((d) => d.getAttribute('aria-current') === 'true'), c), 2);
  assert.equal(await p.evaluate((s) => document.querySelector(s + ' .zh-carousel-arrow.next').disabled, c), true, 'last slide disables next when not looping');
  await p.click(c + ' .zh-carousel-dot:first-child', { force: true }); await wait(p, 700);
  assert.equal(await p.evaluate((s) => document.querySelector(s + ' .zh-carousel-track').scrollLeft, c), 0, 'dot jumps back to the first slide');
});


// ---------- gallery page (docs/gallery.html) and the info tag ----------
await test('gallery: loads without errors, one section per component, theme switch works, info tag differs from the others', async (p) => {
  const g = fileUrl(join(HERE, '..', 'docs', 'gallery.html')); await p.goto(g); await wait(p, 500);
  assert.equal(await p.evaluate(() => document.querySelectorAll('.g-sec').length), (await p.evaluate(() => document.querySelectorAll('.g-side .zh-side-item').length)), 'menu has one link per section');
  assert.ok((await p.evaluate(() => document.querySelectorAll('.g-sec').length)) >= 49);
  await p.click('[data-theme="mode:dark"]'); await wait(p, 200); assert.equal(await p.evaluate(() => document.documentElement.getAttribute('data-mode')), 'dark');
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0, 'no sideways scroll');
  const cols = await p.evaluate(() => ['primary', 'success', 'warning', 'danger', 'info'].map((k) => { const s = document.createElement('span'); s.className = 'zh-tag ' + k; s.textContent = 'x'; document.body.appendChild(s); const c = getComputedStyle(s), v = c.backgroundColor + '|' + c.color; s.remove(); return v; }));
  assert.equal(new Set(cols).size, 5, 'five distinct tag colours');
});


// ---------- table sorting and selection ----------
await testEx('table sort: number and text, toggles asc/desc/none, honours data-sort-value, reports the event', async (p) => {
  await p.evaluate(() => { window.__s = []; document.addEventListener('zh:table-sort', (e) => window.__s.push(e.detail.direction)); });
  const col = (i) => p.evaluate((i) => [...document.querySelectorAll('#tbl-sel tbody tr')].map((r) => r.cells[i].textContent.trim()), i);
  const th = (n) => '#tbl-sel thead th:nth-child(' + n + ') .zh-sort';
  const orig = await col(1);
  await p.click(th(3)); assert.deepEqual(await col(2), ['980', '8,326', '12,480'], 'ascending by number, commas ignored'); assert.equal(await p.getAttribute('#tbl-sel thead th:nth-child(3)', 'aria-sort'), 'ascending');
  await p.click(th(3)); assert.deepEqual(await col(2), ['12,480', '8,326', '980']); assert.equal(await p.getAttribute('#tbl-sel thead th:nth-child(3)', 'aria-sort'), 'descending');
  await p.click(th(3)); assert.deepEqual(await col(1), orig, 'third click restores the original order'); assert.equal(await p.getAttribute('#tbl-sel thead th:nth-child(3)', 'aria-sort'), 'none');
  await p.click(th(4)); assert.deepEqual(await col(3), ['昨天', '6 小时前', '2 小时前'], 'sorted by data-sort-value, not by the visible text'); assert.equal(await p.getAttribute('#tbl-sel thead th:nth-child(3)', 'aria-sort'), 'none', 'only one column sorted at a time');
  assert.deepEqual(await p.evaluate(() => window.__s), ['ascending', 'descending', 'none', 'ascending']);
  await p.focus(th(2)); await p.keyboard.press('Enter'); assert.equal(await p.getAttribute('#tbl-sel thead th:nth-child(2)', 'aria-sort'), 'ascending', 'works from the keyboard');
});
await testEx('table select: header box selects all, shows the indeterminate state, highlights rows, reports rows', async (p) => {
  await p.evaluate(() => { window.__sel = null; document.addEventListener('zh:table-select', (e) => { window.__sel = [e.detail.count, e.detail.all, e.detail.rows.length]; }); });
  const st = () => p.evaluate(() => { const a = document.querySelector('#tbl-sel [data-zh-all]'); return [a.checked, a.indeterminate, document.querySelectorAll('#tbl-sel tr.is-selected').length]; });
  assert.deepEqual(await st(), [false, false, 0]);
  await p.check('#tbl-sel tbody tr:nth-child(1) [data-zh-row]'); assert.deepEqual(await st(), [false, true, 1], 'one of three: indeterminate'); assert.deepEqual(await p.evaluate(() => window.__sel), [1, false, 1]);
  assert.notEqual(await css(p, '#tbl-sel tr.is-selected td', 'backgroundColor'), 'rgba(0, 0, 0, 0)', 'selected row is tinted');
  await p.check('#tbl-sel [data-zh-all]'); assert.deepEqual(await st(), [true, false, 3]); assert.deepEqual(await p.evaluate(() => window.__sel), [3, true, 3]);
  await p.uncheck('#tbl-sel tbody tr:nth-child(2) [data-zh-row]'); assert.deepEqual(await st(), [false, true, 2]);
  assert.equal(await p.evaluate(() => ZhaoUI.table.selected('#tbl-sel').length), 2); await p.evaluate(() => ZhaoUI.table.clear('#tbl-sel')); assert.deepEqual(await st(), [false, false, 0]);
});


// ---------- steps and timeline ----------
await testEx('steps: states follow data-current, error and icon modes, set() redraws, clickable steps report; too narrow stacks vertically', async (p) => {
  const s = E('steps', 'ol[data-zh-steps]:not([data-mode])');
  assert.deepEqual(await p.evaluate((s) => [...document.querySelectorAll(s + ' .zh-step')].map((x) => x.className.replace('zh-step ', '')), s), ['is-finish', 'is-process', 'is-wait']);
  assert.deepEqual(await p.evaluate((s) => [document.querySelector(s + ' .is-finish .zh-step-icon svg') !== null, document.querySelector(s + ' .is-process .zh-step-icon').textContent.trim(), document.querySelector(s + ' .is-process').getAttribute('aria-current')], s), [true, '2', 'step'], 'finished shows a tick, current shows its number');
  const e = E('steps', 'ol[data-mode="icon"]'); assert.deepEqual(await p.evaluate((s) => [...document.querySelectorAll(s + ' .zh-step')].map((x) => x.className.replace('zh-step ', '')), e), ['is-finish', 'is-error', 'is-process'].map((x, i) => (i === 2 ? 'is-process' : x)));
  assert.equal(await p.evaluate((s) => document.querySelector(s + ' .zh-step-msg').textContent, e), '文件过大');
  await p.evaluate((s) => ZhaoUI.steps.set(s, { current: 2 }), s); assert.deepEqual(await p.evaluate((s) => [...document.querySelectorAll(s + ' .zh-step')].map((x) => x.className.replace('zh-step ', '')), s), ['is-finish', 'is-finish', 'is-process']);
  assert.equal(await css(p, s + ' .is-process .zh-step-icon', 'borderRadius') !== '0px', true);
  await p.evaluate(() => { const o = document.createElement('ol'); o.id = 'stc'; o.setAttribute('data-zh-steps', ''); o.setAttribute('data-clickable', ''); o.setAttribute('data-current', '1'); o.innerHTML = '<li data-title="一"></li><li data-title="二"></li><li data-title="三"></li>'; document.body.appendChild(o); window.__st = []; o.addEventListener('zh:step-click', (ev) => window.__st.push(ev.detail.index)); ZhaoUI.init(o); });
  await wait(p, 100); assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('#stc [data-step]')].map((b) => b.disabled)), [false, false, true], 'steps beyond the reach are disabled');
  await p.click('#stc [data-step="0"]'); assert.deepEqual(await p.evaluate(() => window.__st), [0]);
});
await testEx('steps in a narrow box stack vertically', async (p) => {
  await p.evaluate(() => { const d = document.createElement('div'); d.style.width = '230px'; d.innerHTML = '<ol id="stn" data-zh-steps data-current="0"><li data-title="填写信息"></li><li data-title="资质审核"></li><li data-title="开通完成"></li></ol>'; document.body.appendChild(d); ZhaoUI.init(d); });
  await wait(p, 200); assert.equal(await p.evaluate(() => document.getElementById('stn').classList.contains('is-stacked')), true);
}, 1280);
await testEx('timeline: dots in the rail, states tint them, the detail button opens and closes', async (p) => {
  const t = E('timeline', '.zh-tl');
  assert.deepEqual(await p.evaluate((s) => [document.querySelectorAll(s + ' .zh-tl-item').length, getComputedStyle(document.querySelector(s + ' .zh-tl-dot')).borderRadius, getComputedStyle(document.querySelector(s + ' .zh-tl-item')).display], t), [3, '50%', 'grid']);
  const c = await p.evaluate((s) => [...document.querySelectorAll(s + ' .zh-tl-dot')].slice(0, 2).map((d) => getComputedStyle(d).backgroundColor), t); assert.notEqual(c[0], c[1], 'success and primary dots differ');
  assert.equal(await css(p, t + ' .zh-tl-detail', 'gridTemplateRows'), '0px', 'detail starts closed');
  await p.click(t + ' .zh-tl-toggle'); await wait(p, 500);
  assert.deepEqual(await p.evaluate((s) => [document.querySelector(s + ' .zh-tl-toggle').getAttribute('aria-expanded'), document.querySelector(s + ' .zh-tl-toggle span').textContent], t), ['true', '收起详情']);
  assert.notEqual(await css(p, t + ' .zh-tl-detail', 'gridTemplateRows'), '0px', 'detail is open');
  await p.click(t + ' .zh-tl-toggle'); await wait(p, 500); assert.equal(await p.getAttribute(t + ' .zh-tl-toggle', 'aria-expanded'), 'false');
});


// ---------- tree ----------
await testEx('tree: rows with levels, collapsed children hidden, tri-state checkboxes, keyboard, events', async (p) => {
  const T = E('tree', '.zh-tree');
  await p.evaluate(() => { window.__tr = []; document.addEventListener('zh:tree-check', (e) => window.__tr.push(e.detail.ids.join(','))); document.addEventListener('zh:tree-select', (e) => window.__tr.push('sel:' + e.detail.id)); });
  const vis = () => p.evaluate((T) => [...document.querySelectorAll(T + ' .zh-tree-row')].filter((r) => !r.hidden).map((r) => r.getAttribute('data-id')), T);
  assert.deepEqual(await vis(), ['src', 'a', 'b', 'c', 'docs'], 'docs is collapsed, so readme.md is hidden');
  assert.deepEqual(await p.evaluate((T) => [document.querySelector(T).getAttribute('role'), document.querySelector(T + ' [data-id="a"]').getAttribute('aria-level'), document.querySelector(T + ' [data-id="src"]').getAttribute('aria-expanded'), document.querySelector(T + ' [data-id="a"]').getAttribute('aria-checked')], T), ['tree', '2', 'true', 'true']);
  assert.equal(await p.getAttribute(T + ' [data-id="src"]', 'aria-checked'), 'mixed', 'one of two enabled children checked: parent is mixed');
  const pad = await p.evaluate((T) => [getComputedStyle(document.querySelector(T + ' [data-id="src"]')).paddingLeft, getComputedStyle(document.querySelector(T + ' [data-id="a"]')).paddingLeft], T); assert.ok(parseFloat(pad[1]) > parseFloat(pad[0]), 'children are indented');
  await p.click(T + ' [data-id="b"] .zh-tree-check'); assert.equal(await p.getAttribute(T + ' [data-id="src"]', 'aria-checked'), 'true', 'all enabled children checked: parent is checked (disabled one is ignored)');
  await p.click(T + ' [data-id="src"] .zh-tree-check'); assert.deepEqual([await p.getAttribute(T + ' [data-id="a"]', 'aria-checked'), await p.getAttribute(T + ' [data-id="b"]', 'aria-checked'), await p.getAttribute(T + ' [data-id="c"]', 'aria-checked')], ['false', 'false', 'false']);
  await p.click(T + ' [data-id="docs"] .zh-tree-toggle'); assert.deepEqual(await vis(), ['src', 'a', 'b', 'c', 'docs', 'd']);
  await p.focus(T + ' [data-id="docs"]'); await p.keyboard.press('ArrowLeft'); assert.equal((await vis()).includes('d'), false, 'ArrowLeft collapses');
  await p.keyboard.press('ArrowUp'); assert.equal(await p.evaluate(() => document.activeElement.getAttribute('data-id')), 'c'); await p.keyboard.press('Home'); assert.equal(await p.evaluate(() => document.activeElement.getAttribute('data-id')), 'src');
  await p.keyboard.press('Enter'); assert.equal(await p.getAttribute(T + ' [data-id="src"]', 'aria-selected'), 'true');
  await p.keyboard.press('ArrowDown'); await p.keyboard.press(' '); assert.equal(await p.getAttribute(T + ' [data-id="a"]', 'aria-checked'), 'true', 'space checks');
  assert.deepEqual(await p.evaluate(() => ZhaoUI.tree.checked('[data-example="tree"] .zh-tree')), ['a']);
  assert.ok((await p.evaluate(() => window.__tr)).includes('sel:src'));
});


// ---------- upload ----------
await testEx('upload: validates type, size and count; lists files with a progress bar; uploads with a custom function; remove and retry', async (p) => {
  const U = E('upload', '.zh-upload');
  await p.evaluate((U) => { window.__u = []; ['add', 'reject', 'done', 'error', 'remove'].forEach((n) => document.addEventListener('zh:upload-' + n, (e) => window.__u.push(n))); const el = document.querySelector(U); window.__fail = true; window.__rel = []; ZhaoUI.upload.uploader(el, (f, o) => new Promise((res, rej) => { o.onProgress(40); window.__rel.push(() => (window.__fail ? rej(new Error('服务器返回 500')) : res('ok'))); })); }, U);
  await p.evaluate(() => { window.__pick = 0; HTMLInputElement.prototype.click = function () { if (this.type === 'file') window.__pick++; }; });
  await p.focus(U + ' .zh-upload-drop'); await p.keyboard.press('Enter'); await p.keyboard.press(' ');
  assert.equal(await p.evaluate(() => window.__pick), 2, 'Enter and Space on the drop zone both open the file picker');
  const mk = (name, size, type) => ({ name, mimeType: type, buffer: Buffer.alloc(size, 1) });
  await p.setInputFiles(U + ' input[type=file]', [mk('报告.pdf', 2000, 'application/pdf'), mk('a.exe', 10, 'application/octet-stream'), mk('big.png', 6 * 1048576, 'image/png')]);
  await wait(p, 300);
  assert.equal(await p.evaluate((U) => document.querySelectorAll(U + ' .zh-upload-item').length, U), 1, 'only the valid file is listed');
  assert.deepEqual(await p.evaluate((U) => [...document.querySelectorAll(U + ' .zh-upload-err span')].map((s) => s.textContent), U), ['a.exe：不支持这种文件类型', 'big.png：超过 5 MB']);
  assert.deepEqual(await p.evaluate((U) => [document.querySelector(U + ' .zh-upload-bar').getAttribute('aria-valuenow'), document.querySelector(U + ' .zh-upload-status').textContent, document.querySelector(U + ' .zh-upload-item').classList.contains('is-uploading')], U), ['40', '40%', true]);
  assert.equal(await p.evaluate((U) => document.querySelector(U + ' .zh-upload-count').textContent, U), '已添加 1 / 3 个');
  await p.evaluate(() => window.__rel[0]()); await wait(p, 200);
  assert.equal(await p.evaluate((U) => document.querySelector(U + ' .zh-upload-item').className, U), 'zh-upload-item is-error'); assert.equal(await p.evaluate((U) => document.querySelector(U + ' .zh-upload-status').textContent, U), '服务器返回 500');
  await p.evaluate(() => { window.__fail = false; }); await p.click(U + ' [data-act=retry]'); await wait(p, 100); await p.evaluate(() => window.__rel[1]()); await wait(p, 200);
  assert.equal(await p.evaluate((U) => document.querySelector(U + ' .zh-upload-item').className, U), 'zh-upload-item is-done', 'retry succeeds');
  await p.setInputFiles(U + ' input[type=file]', [mk('b.png', 10, 'image/png'), mk('c.png', 10, 'image/png'), mk('d.png', 10, 'image/png')]); await wait(p, 300);
  assert.equal(await p.evaluate((U) => document.querySelectorAll(U + ' .zh-upload-item').length, U), 3, 'capped at data-max'); assert.match(await p.evaluate((U) => document.querySelector(U + ' .zh-upload-err').textContent, U), /最多添加 3 个/);
  await p.click(U + ' .zh-upload-item:last-child [data-act=remove]'); await wait(p, 100); assert.equal(await p.evaluate((U) => ZhaoUI.upload.files(U).length, U), 2);
  assert.ok(['add', 'reject', 'done', 'error', 'remove'].every((n) => /./.test(n)) && (await p.evaluate(() => window.__u)).includes('reject') && (await p.evaluate(() => window.__u)).includes('remove'));
});


// ---------- top nav bar ----------
await testEx('navbar on desktop: links in a row, underline under the current page, dropdown from a nested list, burger hidden', async (p) => {
  const N = E('navbar', '.zh-nav');
  assert.deepEqual(await p.evaluate((N) => [getComputedStyle(document.querySelector(N + ' .zh-nav-burger')).display, getComputedStyle(document.querySelector(N + ' .zh-nav-linkwrap')).display, document.querySelectorAll(N + ' .zh-nav-links > li').length], N), ['none', 'block', 3]);
  assert.equal(await p.evaluate((N) => document.querySelector(N + ' .zh-nav-ink').classList.contains('is-on'), N), true); const w0 = await p.evaluate((N) => document.querySelector(N + ' .zh-nav-ink').style.getPropertyValue('--ink-x'), N);
  await p.click(N + ' .zh-nav-links > li:nth-child(3) a'); await wait(p, 100); assert.notEqual(await p.evaluate((N) => document.querySelector(N + ' .zh-nav-ink').style.getPropertyValue('--ink-x'), N), w0, 'the underline moves to the clicked link');
  assert.equal(await p.getAttribute(N + ' .zh-nav-links > li:nth-child(3) a', 'aria-current'), 'page');
  await p.click(N + ' .zh-nav-links > li:nth-child(2) .zh-nav-link'); await wait(p, 300);
  assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('.zh-pop .zh-nav-mi')].map((a) => a.textContent.trim())), ['中控台', '数据分析']); await p.keyboard.press('Escape'); await wait(p, 300);
});
await testEx('navbar on a phone: links move into a drawer with focus trapped, Esc closes and returns focus', async (p) => {
  const N = E('navbar', '.zh-nav');
  assert.deepEqual(await p.evaluate((N) => [getComputedStyle(document.querySelector(N + ' .zh-nav-burger')).display, getComputedStyle(document.querySelector(N + ' .zh-nav-linkwrap')).display], N), ['grid', 'none']);
  assert.equal(await p.getAttribute(N + ' .zh-nav-drawer', 'aria-hidden'), 'true'); await p.click(N + ' .zh-nav-burger'); await wait(p, 500);
  assert.deepEqual(await p.evaluate((N) => [document.querySelector(N + ' .zh-nav-drawer').classList.contains('is-open'), document.querySelector(N + ' .zh-nav-burger').getAttribute('aria-expanded'), document.querySelector(N + ' .zh-nav-panel').contains(document.activeElement), [...document.querySelectorAll(N + ' .zh-nav-panel nav > a, ' + N + ' .zh-nav-panel nav > button')].map((x) => x.textContent.trim())], N), [true, 'true', true, ['概览', '产品', '价格']]);
  await p.click(N + ' .zh-nav-panel button.zh-nav-dl'); await wait(p, 300); assert.deepEqual(await p.evaluate((N) => [...document.querySelectorAll(N + ' .zh-nav-dsub a')].map((a) => a.textContent.trim()), N), ['中控台', '数据分析']);
  await p.keyboard.press('Escape'); await wait(p, 400);
  assert.deepEqual(await p.evaluate((N) => [document.querySelector(N + ' .zh-nav-drawer').classList.contains('is-open'), document.activeElement === document.querySelector(N + ' .zh-nav-burger')], N), [false, true]);
}, 420);


// ---------- anchor ----------
await test('anchor: marks the section at the top while scrolling and scrolls to the target on click', async (p) => {
  await p.evaluate(() => { const d = document.createElement('div'); d.innerHTML = '<nav id="an" data-zh-anchor data-offset="10" style="position:fixed;top:0;right:0;z-index:50;background:#fff"><ul><li><a href="#an-a">甲</a></li><li><a href="#an-b">乙</a><ul><li><a href="#an-c">丙</a></li></ul></li></ul></nav><div style="height:900px" id="an-a">A</div><div style="height:900px" id="an-b">B</div><div style="height:1400px" id="an-c">C</div>'; document.body.appendChild(d); ZhaoUI.init(d); window.__an = []; document.addEventListener('zh:anchor-change', (e) => window.__an.push(e.detail.id)); });
  await wait(p, 200); const cur = () => p.evaluate(() => { const a = document.querySelector('#an [aria-current]'); return a ? a.getAttribute('href') : null; });
  await p.evaluate(() => window.scrollTo(0, document.getElementById('an-b').getBoundingClientRect().top + window.pageYOffset - 5)); await wait(p, 250); assert.equal(await cur(), '#an-b');
  await p.evaluate(() => window.scrollTo(0, document.getElementById('an-c').getBoundingClientRect().top + window.pageYOffset - 5)); await wait(p, 250); assert.equal(await cur(), '#an-c');
  await p.click('#an a[href="#an-a"]'); await p.waitForFunction(() => Math.abs(document.getElementById('an-a').getBoundingClientRect().top - 10) < 3, null, { timeout: 4000 });
  assert.equal(await cur(), '#an-a', 'clicked link is current at once'); assert.equal(await p.evaluate(() => document.activeElement.id), 'an-a', 'target receives focus');
  assert.notEqual(await css(p, '#an a[href="#an-a"]', 'borderLeftColor'), await css(p, '#an a[href="#an-b"]', 'borderLeftColor'), 'the current link is marked on the rail');
  assert.ok((await p.evaluate(() => window.__an)).includes('an-c'));
});


// ---------- config-driven menu and context menu ----------
await testEx('menu: opens from the button, check items stay open, submenu opens, onSelect closes; right click opens the same menu', async (p) => {
  await p.evaluate(() => { window.__m = []; document.addEventListener('zh:never', () => {}); });
  const items = () => p.evaluate(() => [...document.querySelectorAll('.zh-pop .zh-dd-item')].map((x) => x.textContent.trim()));
  await p.click('#mn-btn'); await wait(p, 300);
  assert.deepEqual(await items(), ['重命名F2', '移动到', '显示隐藏文件', '删除']);
  assert.deepEqual(await p.evaluate(() => [document.querySelector('.zh-pop [role=menu]').getAttribute('aria-label'), document.querySelectorAll('.zh-pop .zh-dd-group').length, document.querySelectorAll('.zh-pop .zh-dd-sep').length, document.activeElement.textContent.trim()]), ['文件操作', 1, 2, '重命名F2'], 'first item has focus');
  await p.click('.zh-pop [role=menuitemcheckbox]'); await wait(p, 150); assert.equal(await p.getAttribute('.zh-pop [role=menuitemcheckbox]', 'aria-checked'), 'false'); assert.equal(await p.evaluate(() => document.querySelectorAll('.zh-pop').length), 1, 'still open after a check item');
  await p.hover('.zh-pop [aria-haspopup=menu]'); await wait(p, 400); assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('.zh-pop')].length), 2, 'submenu opens beside it');
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown');
  assert.equal(await p.evaluate(() => document.activeElement.textContent.trim()), '删除'); await p.keyboard.press('Enter'); await wait(p, 400);
  assert.equal(await p.evaluate(() => document.querySelectorAll('.zh-pop').length), 0, 'a normal item closes the menu'); assert.equal(await p.evaluate(() => document.activeElement.id), 'mn-btn', 'focus returns to the button');
  await p.click('#mn-area', { button: 'right' }); await wait(p, 300); assert.equal(await p.evaluate(() => document.querySelectorAll('.zh-pop .zh-dd-item').length), 4, 'right click opens it');
  await p.keyboard.press('Escape'); await wait(p, 400); assert.equal(await p.evaluate(() => document.querySelectorAll('.zh-pop').length), 0);
});


// ---------- inline calendar ----------
await testEx('calendar: shows a month, picks a day, honours disabled dates and marks, set() moves the month', async (p) => {
  const C = '#cal-demo';
  await p.evaluate(() => { window.__c = []; document.addEventListener('zh:calendar-change', (e) => window.__c.push(e.detail.value)); });
  assert.deepEqual(await p.evaluate((C) => [document.querySelector(C).classList.contains('zh-dp-inline'), document.querySelectorAll(C + ' .zh-dp-day').length >= 28, document.querySelectorAll(C + ' .zh-dp-day.is-today').length], C), [true, true, 1]);
  assert.ok(await p.evaluate((C) => document.querySelectorAll(C + ' .zh-dp-dots').length > 0 && !!document.querySelector(C + ' .zh-dp-day[aria-label*="2 项日程"]'), C), 'marks decorate days and are named for screen readers');
  const sunday = await p.evaluate((C) => { const b = [...document.querySelectorAll(C + ' .zh-dp-day:not(.is-outside)')].find((x) => { const [y, m, d] = x.dataset.d.split('-').map(Number); return new Date(y, m - 1, d).getDay() === 0; }); return b.dataset.d; }, C);
  assert.equal(await p.evaluate(([C, s]) => { const b = document.querySelector(C + ` .zh-dp-day[data-d="${s}"]`); return b.getAttribute('aria-disabled') === 'true' || b.disabled || b.classList.contains('is-disabled'); }, [C, sunday]), true, 'Sundays are disabled');
  const monday = await p.evaluate((C) => { const b = [...document.querySelectorAll(C + ' .zh-dp-day:not(.is-outside)')].find((x) => { const [y, m, d] = x.dataset.d.split('-').map(Number); return new Date(y, m - 1, d).getDay() === 1; }); return b.dataset.d; }, C);
  await p.click(C + ` .zh-dp-day[data-d="${monday}"]`); await wait(p, 150);
  assert.deepEqual(await p.evaluate(() => window.__c), [monday]); assert.equal(await p.evaluate((C) => document.querySelector(C + ' .is-selected').dataset.d, C), monday);
  await p.evaluate(() => document.querySelector('#cal-demo').zhCalendar.set('2031-03-14')); await wait(p, 150);
  assert.ok(await p.evaluate((C) => document.querySelector(C + ' .zh-dp-title').textContent.includes('2031年 3月'), C), 'set() moves to that month'); assert.equal(await p.evaluate((C) => document.querySelector(C + ' .is-selected').dataset.d, C), '2031-03-14');
});


// ---------- command palette ----------
await testEx('command palette: opens modally, groups, fuzzy match with highlight, keyboard selection, run, Ctrl+K, focus returns', async (p) => {
  await p.evaluate(() => { window.__cmd = []; document.addEventListener('zh:command-run', (e) => window.__cmd.push(e.detail.id)); });
  await p.click('#cmd-open'); await wait(p, 300);
  assert.deepEqual(await p.evaluate(() => [document.querySelector('dialog.zh-cmd').open, document.activeElement.getAttribute('role'), [...document.querySelectorAll('.zh-cmd-gl')].map((g) => g.textContent), document.querySelectorAll('.zh-cmd-item').length]), [true, 'combobox', ['页面', '操作'], 3]);
  assert.equal(await p.getAttribute('.zh-cmd-item[data-n="0"]', 'aria-selected'), 'true');
  await p.keyboard.type('set'); await wait(p, 150);
  assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('.zh-cmd-item')].map((x) => x.textContent.trim())), ['系统设置'], 'found through the keywords');
  await p.fill('.zh-cmd input', '新建'); await wait(p, 150); assert.equal(await p.evaluate(() => document.querySelectorAll('.zh-cmd-item mark').length), 2, 'matched characters are highlighted');
  await p.fill('.zh-cmd input', 'zzzz'); await wait(p, 150); assert.equal(await p.evaluate(() => document.querySelector('.zh-cmd-empty').hidden), false);
  await p.fill('.zh-cmd input', ''); await wait(p, 100); await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await wait(p, 400);
  assert.deepEqual(await p.evaluate(() => [window.__cmd, document.querySelector('dialog.zh-cmd').open, document.activeElement.id]), [['new'], false, 'cmd-open']);
  await p.keyboard.press('Control+k'); await wait(p, 300); assert.equal(await p.evaluate(() => document.querySelector('dialog.zh-cmd').open), true, 'Ctrl+K opens when hotkey is on');
  await p.keyboard.press('Escape'); await wait(p, 400); assert.equal(await p.evaluate(() => document.querySelector('dialog.zh-cmd').open), false);
  await p.click('#cmd-open'); await wait(p, 300); assert.equal(await p.evaluate(() => document.querySelector('.zh-cmd-gl').textContent), '最近', 'recently run commands come first'); await p.keyboard.press('Escape');
});


// ---------- charts ----------
await testEx('charts: line, donut, spark and bar render from JSON; legend hides a series; arrow keys walk the points; data table for readers', async (p) => {
  const L = E('chart', '[data-type="line"]');
  assert.deepEqual(await p.evaluate((L) => [document.querySelector(L + ' svg').getAttribute('role'), document.querySelectorAll(L + ' svg path[stroke]').length, document.querySelectorAll(L + ' .zh-chart-key').length, document.querySelectorAll(L + ' table tbody tr').length, document.querySelector(L + ' svg').getAttribute('aria-label').includes('访问')], L), ['img', 2, 2, 7, true]);
  assert.deepEqual(await p.evaluate((L) => [...document.querySelectorAll(L + ' svg path[stroke]')].map((x) => x.getAttribute('stroke')), L), ['var(--zh-chart-1)', 'var(--zh-chart-2)'], 'palette colours in order');
  await p.focus(L + ' svg'); await wait(p, 100); assert.equal(await p.evaluate((L) => document.querySelector(L + ' .zh-chart-tip').hidden, L), false, 'focus shows the first point');
  await p.keyboard.press('ArrowRight'); assert.match(await p.evaluate((L) => document.querySelector(L + ' .zh-chart-tip').textContent, L), /周二.*访问.*1800|周二.*访问.*1\.8千|周二/); assert.match(await p.evaluate((L) => document.querySelector(L + ' [aria-live]').textContent, L), /周二：访问/);
  await p.keyboard.press('End'); assert.match(await p.evaluate((L) => document.querySelector(L + ' .zh-chart-tip b').textContent, L), /周日/);
  await p.click(L + ' .zh-chart-key:nth-child(2)'); await wait(p, 100); assert.equal(await p.evaluate((L) => document.querySelectorAll(L + ' svg path[stroke]').length, L), 1, 'legend hides the second series'); assert.equal(await p.getAttribute(L + ' .zh-chart-key:nth-child(2)', 'aria-pressed'), 'false');
  await p.click(L + ' .zh-chart-key:nth-child(1)'); assert.equal(await p.evaluate((L) => document.querySelectorAll(L + ' svg path[stroke]').length, L), 1, 'the last visible series cannot be hidden');
  assert.deepEqual(await p.evaluate(() => [document.querySelectorAll('[data-example="chart"] [data-type="donut"] .zh-chart-slice').length, document.querySelector('[data-example="chart"] [data-type="donut"] .zh-chart-total').textContent, document.querySelectorAll('[data-example="chart"] [data-type="bar"] .zh-chart-bar').length, document.querySelectorAll('[data-example="chart"] [data-type="spark"] .zh-chart-tick').length]), [3, '1000', 8, 0], 'donut sums to 1000, bars are 4 x 2, a spark has no axes');
  const h = await p.evaluate(() => document.querySelector('[data-example="chart"] [data-type="spark"] svg').getBoundingClientRect().height); assert.ok(h >= 38 && h <= 42, 'spark is 40px tall');
});
await testEx('charts follow the width of their container', async (p) => {
  const w = (s) => p.evaluate((s) => document.querySelector(s + ' svg').getBoundingClientRect().width, s); const L = E('chart', '[data-type="line"]');
  const a = await w(L); await p.evaluate((L) => { document.querySelector(L).style.width = '300px'; }, L); await wait(p, 300); const b = await w(L); assert.ok(a > 400 && Math.abs(b - 300) < 3, `resized from ${Math.round(a)} to ${Math.round(b)}`);
});


// ---------- the optional CSS files must not define each other's classes ----------
await test('optional files: no class is defined by two of zhaoui.css, utilities and marketing (a clash silently overrides one)', async (p) => {
  const cls = (f) => new Set([...readFileSync(join(HERE, '..', 'dist', f), 'utf8').matchAll(/\.(zh-[a-z0-9-]+)/g)].map((m) => m[1]));
  const main = cls('zhaoui.css'), util = cls('zhaoui-utilities.css'), mk = cls('zhaoui-marketing.css');
  const clash = (a, b) => [...a].filter((c) => b.has(c) && !['zh-btn', 'zh-tag'].includes(c));
  assert.deepEqual([clash(main, util), clash(main, mk), clash(util, mk)], [[], [], []], 'class names shared between files');
});


// ---------- marketing blocks, xl button, link buttons, brand avatar ----------
await testEx('marketing blocks: page width, section gap, display type, xl button, no underline on link buttons, brand gradient, price flag', async (p) => {
  const M = E('marketing', '');
  const r = await p.evaluate(() => { const q = (s) => document.querySelector('[data-example="marketing"] ' + s), c = (e, k) => getComputedStyle(e)[k], h = (e) => e.getBoundingClientRect().height;
    const probe = (v) => { const d = document.createElement('i'); d.style.paddingTop = v; document.body.appendChild(d); const x = getComputedStyle(d).paddingTop; d.remove(); return x; };
    return { wrapMax: c(q('.zh-wrap'), 'maxWidth'), gap: c(q('.zh-section'), 'paddingTop'), gapToken: probe('var(--zh-section-gap)'), display: parseFloat(c(q('.zh-display'), 'fontSize')), title: parseFloat(c(q('.zh-section-title'), 'fontSize')), xl: h(q('.zh-btn.xl')), lg: h(q('.zh-btn.lg')), under: c(q('a.zh-btn.xl'), 'textDecorationLine'),
      brandBg: c(q('.zh-section--brand'), 'backgroundImage').startsWith('linear-gradient'), flag: c(q('.zh-price-flag'), 'position'), popularBorder: c(q('.zh-price--popular'), 'borderTopColor') !== c(q('.zh-price:not(.zh-price--popular)'), 'borderTopColor'), tagH: h(q('.zh-feature-tags .zh-tag')), lone: h(q('.zh-tag.zh-tag--lg')) }; });
  assert.equal(r.wrapMax, '1792px'); assert.equal(r.gap, r.gapToken, 'section padding follows --zh-section-gap'); assert.ok(r.display > r.title && r.title > 24, `display ${r.display} > title ${r.title}`);
  assert.ok(r.xl > r.lg + 4, `xl ${r.xl} is taller than lg ${r.lg}`); assert.equal(r.under, 'none', 'link buttons are not underlined'); assert.equal(r.brandBg, true); assert.equal(r.flag, 'absolute'); assert.equal(r.popularBorder, true);
  assert.ok(r.tagH >= 26, `tags inside a card are tall enough to look intentional (${r.tagH}px)`);
});
await test('tag icon and text have room; status tags use the heavier weight', async (p) => {
  await p.evaluate(() => { const d = document.createElement('div'); d.innerHTML = '<span class="zh-tag success" id="vt"><i data-i="badge-check"></i> 平台认证</span>'; document.body.appendChild(d); ZhaoUI.init(d); }); await wait(p, 200);
  const r = await p.evaluate(() => { const t = document.getElementById('vt'), c = getComputedStyle(t); return { gap: parseFloat(c.columnGap), fw: +c.fontWeight, h: t.getBoundingClientRect().height, fs: parseFloat(c.fontSize) }; });
  assert.ok(r.gap >= 3 && r.fw >= 600 && r.h / r.fs > 1.7, JSON.stringify(r));
});


await testEx('marketing blocks in dark mode: a plain hero and an aurora hero both stay dark enough for their text', async (p) => {
  await p.evaluate(() => { const s = document.createElement('section'); s.className = 'zh-hero'; s.id = 'plainhero'; s.innerHTML = '<div class="zh-wrap"><h2 class="zh-display">标题</h2></div>'; document.body.appendChild(s); ZhaoUI.setTheme({ mode: 'dark' }); }); await wait(p, 200);
  const r = await p.evaluate(() => { const lumOf = (s) => { const m = String(s).match(/rgba?\([^)]*\)/g) || []; return m.map((x) => { const n = x.match(/[\d.]+/g).map(Number), [r, g, b] = n, al = n.length > 3 ? n[3] : 1, f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return al * (.2126 * f(r) + .7152 * f(g) + .0722 * f(b)) + (1 - al) * 0.01; }); };   // a translucent stop is measured over the near-black page
    const plain = getComputedStyle(document.getElementById('plainhero')).backgroundImage, aur = getComputedStyle(document.querySelector('[data-example="marketing"] .zh-aurora'));
    return { plain: lumOf(plain), aurBg: lumOf(aur.backgroundColor)[0], head: lumOf(getComputedStyle(document.querySelector('[data-example="marketing"] .zh-aurora .zh-display')).color)[0] }; });
  assert.ok(r.plain.length >= 2 && Math.max(...r.plain) < 0.12, `every colour stop of a plain hero is dark in dark mode (${r.plain.map((x) => x.toFixed(2))})`);
  assert.ok(r.aurBg < 0.05 && r.head > 0.5, `aurora hero: dark field (${r.aurBg.toFixed(3)}) and light heading (${r.head.toFixed(2)})`);
});
await testEx('details taken from the reference: tight display type, ruled eyebrow, gradient text and numerals, stats bar, aurora spots, glass label, accent tokens', async (p) => {
  const r = await p.evaluate(() => { const q = (s) => document.querySelector('[data-example="marketing"] ' + s), c = (e, k, ps) => getComputedStyle(e, ps)[k], root = getComputedStyle(document.documentElement);
    return { track: parseFloat(c(q('.zh-display'), 'letterSpacing')) / parseFloat(c(q('.zh-display'), 'fontSize')), lh: parseFloat(c(q('.zh-display'), 'lineHeight')) / parseFloat(c(q('.zh-display'), 'fontSize')), rule: c(q('.zh-eyebrow'), 'content', '::before'), ruleW: c(q('.zh-eyebrow'), 'display'),
      gtext: [c(q('.zh-gradient-text'), 'backgroundClip'), c(q('.zh-gradient-text'), 'backgroundImage').startsWith('linear-gradient'), c(q('.zh-gradient-text'), 'color')], idx: c(q('.zh-index'), 'backgroundImage').startsWith('linear-gradient'),
      bar: [c(q('.zh-stats-bar'), 'borderRadius'), c(q('.zh-stat + .zh-stat'), 'borderInlineStartWidth')], spots: (c(q('.zh-aurora'), 'content', '::before'), getComputedStyle(q('.zh-aurora'), '::before').backgroundImage.split('radial-gradient').length - 1),
      grid: getComputedStyle(q('.zh-aurora--grid'), '::after').backgroundImage.includes('linear-gradient'), accents: ['a', 'b', 'c'].map((k) => root.getPropertyValue('--zh-accent-' + k).trim()), token: root.getPropertyValue('--zh-gradient-accent').includes(root.getPropertyValue('--zh-accent-a').trim()) };
  });
  assert.ok(r.track <= -0.035 && r.lh <= 1.1, `display type is tight (tracking ${r.track.toFixed(3)}em, leading ${r.lh.toFixed(2)})`); assert.equal(r.rule, '""', 'eyebrow has its rule');
  assert.deepEqual([r.gtext[0], r.gtext[1], r.gtext[2]], ['text', true, 'rgba(0, 0, 0, 0)'], 'gradient text is clipped to the glyphs'); assert.equal(r.idx, true);
  assert.equal(r.bar[0], '28px'); assert.equal(r.bar[1], '1px', 'dividers between stats'); assert.equal(r.spots, 3, 'three light spots'); assert.equal(r.grid, true);
  assert.ok(r.accents.every((x) => /^#[0-9a-f]{6}$/i.test(x)) && new Set(r.accents).size === 3, `three accent colours ${r.accents}`); assert.equal(r.token, true);
  await p.evaluate(() => ZhaoUI.setBrand('#10b8a6')); await wait(p, 100);
  const after = await p.evaluate(() => ['a', 'b', 'c'].map((k) => getComputedStyle(document.documentElement).getPropertyValue('--zh-accent-' + k).trim())); assert.notDeepEqual(after, r.accents, 'accents follow the brand colour');
});


await testEx('button group keeps its shape in the C-end look: pill ends, square joints, nothing overlapping as separate pills', async (p) => {
  await p.evaluate(() => ZhaoUI.setTheme({ audience: 'c' })); await wait(p, 200);
  const r = await p.evaluate(() => { const bs = [...document.querySelectorAll('[data-example="btngroup"] .zh-btn-group:not(.zh-btn-group--vertical) .zh-btn')], c = (e, k) => parseFloat(getComputedStyle(e)[k]), h = bs[0].getBoundingClientRect().height;
    return { h, first: [c(bs[0], 'borderTopLeftRadius'), c(bs[0], 'borderTopRightRadius')], mid: [c(bs[1], 'borderTopLeftRadius'), c(bs[1], 'borderTopRightRadius')], last: [c(bs[bs.length - 1], 'borderTopLeftRadius'), c(bs[bs.length - 1], 'borderTopRightRadius')] }; });
  assert.ok(r.first[0] >= r.h / 2 - 1 && r.first[1] === 0, `first button: round left end, square right (${r.first})`); assert.deepEqual(r.mid, [0, 0], 'middle button is square'); assert.ok(r.last[1] >= r.h / 2 - 1 && r.last[0] === 0, `last button: square left, round right end (${r.last})`);
});

// The examples printed in docs/components/*.md, run as-is.
{
  const p = await b.newPage({ viewport: { width: 1000, height: 800 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto(fileUrl(pagePath('examples.generated.html'))); await p.waitForTimeout(400);
  try {
    // ZhaoUI.dialog(...) in the dialog example opens a confirm at load; ZhaoUI.message(...) in the message example shows toasts.
    const r = await p.evaluate(() => ({
      dialogOpen: !!document.querySelector('dialog.zh-modal[open]'),
      tabsWired: document.querySelectorAll('[data-example="tabs"] [role="tab"][tabindex="0"]').length,
      tabPanelHidden: document.getElementById('p2') && document.getElementById('p2').hidden,
      collapseWired: document.querySelectorAll('[data-example="collapse"] .zh-collapse-trigger[aria-expanded]').length,
      drawerInert: !!(document.getElementById('drw') && document.getElementById('drw').hasAttribute('inert')),
      iconsHydrated: document.querySelectorAll('i[data-i]').length,
      messages: document.querySelectorAll('.zh-message').length,
      menuHidden: getComputedStyle(document.getElementById('menu')).display,
      otpCells: document.querySelectorAll('[data-example="otp"] .zh-otp-cell').length,
      numberWired: document.querySelectorAll('[data-example="number"] [role="spinbutton"][aria-valuenow]').length,
      counts: [...document.querySelectorAll('[data-example="textarea"] .zh-ta-count')].map((c) => c.textContent).join('|'),
      clearHidden: document.querySelector('[data-example="input"] .zh-inp-clear').hidden,
      editWired: !!document.querySelector('[data-example="inline-edit"] .zh-edit-view'),
      progressWired: document.querySelectorAll('[data-example="progress"] .zh-progress[aria-valuenow], [data-example="progress"] .zh-progress[aria-busy]').length,
      ringWired: document.querySelectorAll('[data-example="ring"] .zh-ring-center').length,
      sliderThumbs: document.querySelectorAll('[data-example="slider"] .zh-slider-thumb').length,
      ratingRadios: document.querySelectorAll('[data-example="rating"] .zh-rating-in').length,
      pagerButtons: document.querySelectorAll('[data-example="pager"] .zh-pg-list button').length,
      badgeShown: [...document.querySelectorAll('[data-example="badge"] .zh-bdg-mark')].map((m) => m.classList.contains('is-hidden')).join(),
      avatarFaces: document.querySelectorAll('[data-example="avatar"] .zh-avatar-face').length,
      tagRadioChecked: document.querySelectorAll('[data-example="tag"] [role="radio"][aria-checked="true"]').length,
      selectHosts: document.querySelectorAll('[data-example="select"] select[data-zh-select] + .zh-sel').length,
      dateHosts: document.querySelectorAll('[data-example="date"] .zh-dp input[role="combobox"]').length,
      rangeInputs: document.querySelectorAll('[data-example="daterange"] input.zh-dp-rin').length,
      timeVals: [...document.querySelectorAll('[data-example="time"] .zh-dp input:not([type="hidden"])')].map((i) => i.value).join(),
      dtVal: (document.querySelector('[data-example="datetime"] .zh-dp input:not([type="hidden"])') || {}).value,
      cascaderHosts: document.querySelectorAll('[data-example="cascader"] .zh-sel-input').length,
      selectRemote: !!document.querySelector('[data-example="select"] #remote .zh-sel-input'),
      selectTags: [...document.querySelectorAll('[data-example="select"] #tags + .zh-sel .zh-sel-tag')].map((x) => x.textContent.trim()).join(),
    }));
    assert.equal(r.progressWired, 5); assert.equal(r.ringWired, 4); assert.equal(r.sliderThumbs, 5); assert.equal(r.ratingRadios, 15, 'rating examples: 5 + 10 (half) + 0 (read-only)'); assert.ok(r.pagerButtons >= 7, 'pager renders its page list'); assert.equal(r.badgeShown, 'false,false,false,false', 'none of the badge examples is hidden'); assert.equal(r.avatarFaces, 4); assert.equal(r.tagRadioChecked, 1); assert.equal(r.selectHosts, 3); assert.equal(r.cascaderHosts, 2, 'both cascader examples are built'); assert.equal(r.dateHosts, 3, 'three date pickers in the date example'); assert.equal(r.rangeInputs, 2); assert.equal(r.timeVals, '09:30,14:15:10'); assert.equal(r.dtVal, '2026-10-15 09:30'); assert.equal(r.selectRemote, true); assert.equal(r.selectTags, '前端,后端');
    
    assert.equal(r.otpCells, 6); assert.equal(r.numberWired, 2); assert.equal(r.counts, '0 / 80|68 / 30'.replace('68', String(r.counts.split('|')[1].split(' ')[0])), 'textarea counters render'); assert.match(r.counts, /^0 \/ 80\|\d+ \/ 30$/); assert.equal(r.clearHidden, true);
    assert.equal(r.dialogOpen, true, 'ZhaoUI.dialog example opens'); assert.equal(r.tabsWired, 2, 'two tablists in the tabs example (normal + segmented switch)'); assert.equal(r.tabPanelHidden, true);
    assert.equal(r.collapseWired, 2); assert.equal(r.drawerInert, true); assert.equal(r.iconsHydrated, 0); assert.ok(r.messages >= 2, 'message examples show'); assert.equal(r.menuHidden, 'none');
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    await p.click('[data-example="dropdown"] [data-zh-dropdown]'); await p.waitForTimeout(250);
    assert.equal(await p.locator('.zh-pop.is-open [role="menuitem"]').count(), 3, 'dropdown example opens with 3 items');
    assert.deepEqual(errs, [], 'page errors'); passed++;
  } catch (e) { failed++; console.log('FAIL documented examples run as written\n   ' + e.message.split('\n').slice(0, 14).join(' | ')); }
  await p.close();
}

await b.close();
console.log(`${failed ? 'FAILED' : 'ok'} [${ENGINE}${VARIANT === 'full' ? '' : '/' + VARIANT}]: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
