// Smoke test part 2 of 3  regressions found by the skill trial (an agent that only read the docs wrote three pages).  Run by ../smoke.mjs with the shared harness.
export default async function run(h) {
  const { pw, HERE, VARIANT, pagePath, FILE, ENGINE, launch, b, fresh, test, wait, assert, fileUrl, join, dirname, readFileSync, writeFileSync, existsSync, readdirSync, fileURLToPath, val, txt, hostOf, cItems, day, dis, testEx, E, tracks, wd, pseudoContent, css, UTIL, utilPage, SIDE , until } = h;
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
    const row = t + ' tbody tr'; const bg0 = await css(p, row, 'backgroundColor'); await p.hover(row); let bg1 = bg0; for (let i = 0; i < 15 && bg1 === bg0; i++) { await wait(p, 100); bg1 = await css(p, row, 'backgroundColor'); }   // the colour changes through a transition: poll, do not guess a delay
    assert.notEqual(bg1, bg0, 'row highlights on hover');
    assert.equal(await css(p, t, 'display'), 'table');
  });
  await testEx('table on a phone: rows become cards labelled by data-label; --scroll keeps a real table that scrolls sideways', async (p) => {
    const t = E('table', '.zh-table');
    assert.deepEqual([await css(p, t + ' tbody tr', 'display'), await css(p, t + ' td', 'display'), await pseudoContent(p, t + ' td', '::before')], ['block', 'flex', '"标题"'], 'card list with the field name before each value');
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
    assert.notEqual(await until(p, () => css(p, sw, 'backgroundColor'), (v) => v !== primary), primary, 'unchecked switch loses the brand colour'); assert.notEqual(await until(p, () => css(p, sw, 'transform', '::after'), (v) => v !== onT), onT, 'the knob moves');
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


}
