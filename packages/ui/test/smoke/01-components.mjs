// Smoke test part 1 of 3.  Run by ../smoke.mjs with the shared harness.
export default async function run(h) {
  const { pw, HERE, VARIANT, pagePath, FILE, ENGINE, launch, b, fresh, test, wait, assert, fileUrl, join, dirname, readFileSync, writeFileSync, existsSync, readdirSync, fileURLToPath, val, txt, hostOf, cItems, day, dis, testEx, E, tracks, wd, pseudoContent, css, UTIL, utilPage, SIDE , until } = h;
  await test('tokens + component css apply with only the two files', async (p) => {
    const r = await p.evaluate(() => { const b = getComputedStyle(document.getElementById('b-primary')); return { bg: b.backgroundColor, h: parseFloat(b.height), hasZh: typeof ZhaoUI, ver: ZhaoUI.version }; });
    assert.match(r.bg, /rgb\(88, 104, 238\)/); assert.equal(r.h, 32); assert.equal(r.hasZh, 'object'); assert.equal(r.ver, JSON.parse(readFileSync(join(HERE, '..', 'package.json'), 'utf8')).version);
  });
  await test('button variants and tooltip look right (docs/styles.md relies on this)', async (p) => {
    const r = await p.evaluate(() => { const g = (id) => getComputedStyle(document.getElementById(id)); const root = getComputedStyle(document.documentElement);
      return { text: g('b-text').backgroundColor, textColor: g('b-text').color, danger: g('b-danger').color, dangerBorder: g('b-danger').borderTopColor, dis: g('b-disabled').opacity, dangerText: (() => { const d = document.createElement('i'); d.style.color = 'var(--zh-text-danger)'; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; })(), primaryColor: root.getPropertyValue('--zh-color-primary').trim() }; });
    assert.equal(r.text, 'rgba(0, 0, 0, 0)', 'text button is transparent');
    assert.equal(r.danger, r.dangerText, 'danger button text uses the readable danger text colour, not the brand red'); assert.equal(r.dis, '0.45', 'disabled opacity token');
    await p.hover('#b-tip'); await wait(p, 150);
    const tip = await p.evaluate(() => { const el = document.getElementById('b-tip'), c = getComputedStyle(el, '::after').content, m = c.match(/^attr\((.+)\)$/); return m ? JSON.stringify(el.getAttribute(m[1])) : c; });   // Firefox 153 reports attr(data-tip) unresolved
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


}
