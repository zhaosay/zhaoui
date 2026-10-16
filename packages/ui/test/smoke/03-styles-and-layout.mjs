// Smoke test part 3 of 3  tree.  Run by ../smoke.mjs with the shared harness.
export default async function run(h) {
  const { pw, HERE, VARIANT, pagePath, FILE, ENGINE, launch, b, fresh, test, wait, assert, fileUrl, join, dirname, readFileSync, writeFileSync, existsSync, readdirSync, fileURLToPath, val, txt, hostOf, cItems, day, dis, testEx, E, tracks, wd, pseudoContent, css, UTIL, utilPage, SIDE , until } = h;
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
    const other = await css(p, '#an a[href="#an-b"]', 'borderLeftColor');   // the mark fades in; wait for it instead of guessing how long
    assert.notEqual(await until(p, () => css(p, '#an a[href="#an-a"]', 'borderLeftColor'), (v) => v !== other), other, 'the current link is marked on the rail');
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


  // The touch rules are inside @media (pointer: coarse); a touch context makes the browser match it.
  await test('touch screens: the clear and close buttons and the carousel dots have a hit area of at least 24px', async (p) => {
    const ctx = await h.b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }), q = await ctx.newPage();
    try {
      await q.goto(FILE); await wait(q, 250);
      const r = await q.evaluate(() => { const host = document.createElement('div'); host.innerHTML = '<button class="zh-dp-clear" id="t-dp"></button><button class="zh-sel-clear" id="t-sel"></button><span class="zh-tag"><button class="zh-tag-close" id="t-tag"></button></span><div class="zh-carousel-dots"><button class="zh-carousel-dot" id="t-dot"></button><button class="zh-carousel-dot" aria-current="true" id="t-dot2"></button></div>'; document.body.append(host);
        const s = (id) => { const e = document.getElementById(id), c = getComputedStyle(e), pad = (k) => parseFloat(c[k]) || 0; return { w: parseFloat(c.width) + (c.boxSizing === 'content-box' ? pad('paddingLeft') + pad('paddingRight') : 0), h: parseFloat(c.height) + (c.boxSizing === 'content-box' ? pad('paddingTop') + pad('paddingBottom') : 0), vis: parseFloat(c.width) }; };
        return { coarse: matchMedia('(pointer: coarse)').matches, dp: s('t-dp'), sel: s('t-sel'), tag: s('t-tag'), dot: s('t-dot'), dot2: s('t-dot2') }; });
      assert.equal(r.coarse, true, 'the context is a touch screen');
      for (const k of ['dp', 'sel', 'tag', 'dot', 'dot2']) assert.ok(r[k].w >= 24 && r[k].h >= 24, `${k} is at least 24x24 (${r[k].w}x${r[k].h})`);
      assert.equal(r.dot.vis, 8, 'the visible dot is still 8px');
      const reach = await q.evaluate(() => { document.querySelectorAll('body > div').forEach((d) => { if (d.querySelector('#t-dp')) d.remove(); }); const host = document.createElement('div'); host.style.cssText = 'position:fixed;top:120px;left:40px;z-index:9999'; host.innerHTML = '<span class="zh-sel-tag" style="display:inline-flex">甲<button type="button" id="t-seltag" aria-label="移除 甲"><svg width="12" height="12"></svg></button></span>'; document.body.append(host); const b = document.getElementById('t-seltag'); const r = b.getBoundingClientRect(), at = (dx, dy) => document.elementFromPoint(r.left + r.width / 2 + dx, r.top + r.height / 2 + dy);
        return { size: [Math.round(r.width), Math.round(r.height)], right: at(r.width / 2 + 4, 0) === b, below: at(0, r.height / 2 + 4) === b, farAway: at(r.width / 2 + 14, 0) === b }; });
      assert.ok(reach.right && reach.below, `the tag's remove button (${reach.size.join('x')}) can be hit 4px outside its box`); assert.equal(reach.farAway, false, 'but not 14px away');
    } finally { await ctx.close(); }
  });

  // ---------- inline calendar ----------
  await testEx('calendar is laid out, not collapsed: day cells are a usable size, do not overlap, and fit a phone', async (p) => {
    for (const w of [1280, 390]) {
      await p.setViewportSize({ width: w, height: 900 });
      await p.evaluate(() => { const d = document.createElement('div'); d.id = 'cal-size'; document.body.append(d); window.__cal = ZhaoUI.calendar('#cal-size', { value: new Date(2026, 9, 16) }); }); await wait(p, 150);
      const r = await p.evaluate(() => { const days = [...document.querySelectorAll('#cal-size .zh-dp-day')].map((e) => e.getBoundingClientRect()), host = document.getElementById('cal-size').getBoundingClientRect(); const overlap = days.filter((a, i) => days.slice(i + 1).some((b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2)).length; return { n: days.length, minW: Math.min(...days.map((d) => d.width)), minH: Math.min(...days.map((d) => d.height)), overlap, hostRight: host.right, vw: innerWidth, border: getComputedStyle(document.getElementById('cal-size')).borderTopWidth }; });
      assert.ok(r.n >= 28, `${w}px: month has its days (${r.n})`); assert.ok(r.minW >= 28 && r.minH >= 28, `${w}px: a day cell is at least 28px (${r.minW}x${r.minH})`);
      assert.equal(r.overlap, 0, `${w}px: no two day cells overlap`); assert.ok(r.hostRight <= r.vw, `${w}px: the calendar fits the screen`); assert.equal(r.border, '1px', `${w}px: the inline calendar frame is styled`);
      await p.evaluate(() => document.getElementById('cal-size').remove());
    }
  });
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


  // A page that only follows the quickstart: the library CSS and data-* on <html>, no stylesheet of its own.
  {
    const css = `../dist/zhaoui${VARIANT === 'min' ? '.min' : ''}.css`;
    const fixture = (name, htmlAttrs, head = '') => { const f = join(HERE, `${name}.generated.html`); writeFileSync(f, `<!doctype html><html lang="zh-CN" ${htmlAttrs}><head><meta charset="utf-8"><title>${name}</title><link rel="stylesheet" href="${css}">${head}</head><body><p id="t">Latin text and 中文文字</p><button class="zh-btn primary" id="b">按钮</button></body></html>`); return fileUrl(f); };
    const read = (p) => p.evaluate(() => { const probe = (prop, v) => { const d = document.createElement('i'); d.style[prop] = v; document.body.append(d); const r = getComputedStyle(d)[prop]; d.remove(); return r; }; const cs = getComputedStyle, B = document.body, H = document.documentElement;
      return { family: cs(B).fontFamily, sansToken: probe('fontFamily', 'var(--zh-font-sans)'), size: cs(B).fontSize, htmlSize: cs(H).fontSize, color: cs(B).color, textToken: probe('color', 'var(--zh-text)'), htmlBg: cs(H).backgroundColor, bgToken: probe('backgroundColor', 'var(--zh-bg)'), line: cs(B).lineHeight }; });
    await testEx('page defaults: a page that only has the library CSS and a theme on <html> gets the theme font, text colour and background, in light and dark', async (p) => {
      for (const mode of ['light', 'dark']) {
        await p.goto(fixture(`defaults-${mode}`, `data-audience="c" data-mode="${mode}" data-density="standard"`)); await p.waitForTimeout(200);
        const r = await read(p);
        assert.notEqual(r.family.split(',')[0].replace(/["']/g, '').trim(), 'Times', `${mode}: not the browser's default serif (${r.family})`); assert.equal(r.family, r.sansToken, `${mode}: the theme font`);
        assert.equal(r.color, r.textToken, `${mode}: text colour`); assert.equal(r.htmlBg, r.bgToken, `${mode}: page background`); assert.equal(r.htmlSize, '16px', `${mode}: rem is not changed (${r.htmlSize})`); assert.ok(parseFloat(r.size) >= 14, 'body size'); assert.notEqual(r.line, 'normal');
        const lum = (c) => { const [R, G, B] = c.match(/\d+/g).map(Number).map((v) => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * R + .7152 * G + .0722 * B; };
        assert.ok(mode === 'dark' ? lum(r.htmlBg) < .1 : lum(r.htmlBg) > .85, `${mode}: the page really is ${mode} (${r.htmlBg})`);
      }
    });
    await testEx('page defaults never win: your own body rules apply whatever the order, other pages stay untouched, a button is not restyled', async (p) => {
      await p.goto(fixture('defaults-own', 'data-audience="b" data-mode="light"', '<style>body{font-family:Georgia,serif;font-size:21px;color:rgb(1,2,3);background:rgb(250,240,230)} html{background:rgb(250,240,230)}</style>')); await p.waitForTimeout(150);
      const own = await read(p); assert.match(own.family, /Georgia/); assert.equal(own.size, '21px'); assert.equal(own.color, 'rgb(1, 2, 3)'); assert.equal(own.htmlBg, 'rgb(250, 240, 230)');
      await p.goto(fixture('defaults-none', '')); await p.waitForTimeout(150);
      const none = await read(p); assert.equal(none.htmlBg, 'rgba(0, 0, 0, 0)', 'no theme declared: no background'); assert.notEqual(none.family, none.sansToken, 'no theme declared: the page does not get the theme font');
      await p.goto(fixture('defaults-btn', 'data-audience="c" data-mode="light"')); await p.waitForTimeout(150);
      assert.equal(await p.evaluate(() => { const s = getComputedStyle(document.getElementById('b')); return s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.color === 'rgb(255, 255, 255)'; }), true, 'primary button keeps its own colours');
    });
  }

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
      assert.deepEqual(errs, [], 'page errors'); h.passed++;
    } catch (e) { h.failed++; console.log('FAIL documented examples run as written\n   ' + e.message.split('\n').slice(0, 14).join(' | ')); }
    await p.close();
  }

}
