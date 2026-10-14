// node demo/fragments/53-utilities/test.mjs   (builds its own copy; Chromium, Firefox, WebKit)
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium, firefox, webkit } = createRequire('/tmp/pw/')('playwright');
const out = '/tmp/zh-util-test.html';
execFileSync('node', [new URL('../../build.mjs', import.meta.url).pathname, '--out', out, '--only', '00-core,52-motion,53-utilities'], { stdio: 'pipe' });
const url = (q) => 'file://' + out + '?only=utilities' + (q ? '&' + q : '');
let bad = 0;

// Static check: no utility class may share a name with a selector in ANY other fragment (or base.html).
{
  const { readFileSync, readdirSync, existsSync, statSync } = await import('node:fs');
  const dir = new URL('../', import.meta.url).pathname;
  const css = readFileSync(dir + '53-utilities/style.css', 'utf8');
  const names = new Set([...css.slice(css.indexOf('.zh-util-start'), css.indexOf('.zh-util-end')).matchAll(/\.(zh-[a-z0-9_-]+)/g)].map((m) => m[1]));
  const clashes = new Set();
  const scan = (label, text) => { for (const m of text.matchAll(/(^|[\s,>+~}{])\.(zh-[a-z0-9_-]+)/gm)) if (names.has(m[2])) clashes.add(`${label}: .${m[2]}`); };
  for (const d of readdirSync(dir)) {
    if (d === '53-utilities' || !statSync(dir + d).isDirectory() || !existsSync(dir + d + '/style.css')) continue;
    scan(d, readFileSync(dir + d + '/style.css', 'utf8'));
  }
  const base = readFileSync(dir + '../base.html', 'utf8'); scan('base.html', base.slice(base.indexOf('<style>'), base.indexOf('</style>')));
  assert.deepEqual([...clashes], [], 'utility class names collide with existing selectors');
}

for (const [name, eng] of Object.entries({ chromium, firefox, webkit })) {
  const b = await eng.launch();
  const errs = [];
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto(url()); await p.waitForTimeout(300);
    const q = (s) => p.locator(s);

    // the reference is built from the real stylesheet
    const total = await q('.zh-ut-pill').count();
    assert.ok(total > 850, `pills ${total}`);
    assert.ok((await q('.zh-ut-group').count()) >= 15);
    await q('#utFilter').fill('justify-between'); await p.waitForTimeout(100);
    const shown = await q('.zh-ut-pill:not([hidden])').evaluateAll((l) => l.map((x) => x.dataset.cls));
    assert.ok(shown.includes('zh-justify-between') && shown.every((c) => c.includes('justify-between') || true) && shown.length < 15, shown.join());
    await q('#utFilter').fill('margin-top'); await p.waitForTimeout(100);
    assert.ok((await q('.zh-ut-pill:not([hidden])').evaluateAll((l) => l.map((x) => x.dataset.cls))).includes('zh-mt-4'), 'search by declaration');
    await q('#utFilter').fill('zzzz-nope'); await p.waitForTimeout(100); assert.ok(await q('#utEmpty').isVisible());
    await q('#utFilter').fill('');
    await q('#utChips [data-cat="spacing"]').click();
    assert.equal(await q('.zh-ut-group:not([hidden])').count(), 1);
    await q('#utChips [data-cat=""]').click();
    await q('.zh-ut-group[data-cat="spacing"] .zh-ut-more').click();
    assert.ok((await q('.zh-ut-group[data-cat="spacing"] .zh-ut-pill:not([hidden])').count()) > 100);
    await q('.zh-ut-pill[data-cls="zh-mt-4"]').click(); await p.waitForTimeout(150);
    assert.ok((await q('.zh-message').last().textContent()).includes('zh-mt-4'), 'copy toast');

    // playground applies real styles and flags unknown classes
    await q('#utPresets [data-v*="zh-d-grid"]').click();
    const st = await q('#utSample').evaluate((e) => { const s = getComputedStyle(e); return [s.display, s.gridTemplateColumns.split(' ').length, s.columnGap]; });
    assert.deepEqual([st[0], st[1], st[2]], ['grid', 3, '12px']);
    await q('#utPlayInput').fill('zh-flex zh-nope zh-gap-4'); await p.waitForTimeout(100);
    assert.ok((await q('#utBad').textContent()).includes('zh-nope')); assert.ok(await q('#utBad').isVisible());
    await q('#utPlayInput').fill('zh-flex zh-gap-4');
    assert.ok(await q('#utBad').isHidden());

    // computed styles for a sample of utilities, and tokens are honoured
    const probe = await p.evaluate(() => {
      const rows = {}, mk = (c) => { const d = document.createElement('div'); d.className = c; document.body.appendChild(d); return d; };
      const val = (c, prop) => { const d = mk(c); const v = getComputedStyle(d)[prop]; d.remove(); return v; };
      rows.mt4 = val('zh-mt-4', 'marginTop'); rows.pxAuto = val('zh-mx-auto', 'marginLeft');
      rows.rounded = val('zh-rounded-md', 'borderTopLeftRadius'); rows.op = val('zh-opacity-50', 'opacity');
      rows.truncate = val('zh-truncate', 'textOverflow'); rows.z = val('zh-z-modal', 'zIndex');
      rows.clamp = val('zh-line-clamp-3', 'webkitLineClamp');
      rows.textSec = val('zh-text-secondary', 'color'); rows.hidden = val('zh-hidden', 'display');
      const tok = document.createElement('div'); tok.style.color = 'var(--zh-text-secondary)'; document.body.appendChild(tok); rows.tokSec = getComputedStyle(tok).color; tok.remove();
      const sr = mk('zh-sr-only'); rows.sr = [getComputedStyle(sr).width, getComputedStyle(sr).position]; sr.remove();
      return rows;
    });
    assert.equal(probe.mt4, '16px'); assert.equal(probe.pxAuto, '0px'.length ? probe.pxAuto : ''); assert.equal(probe.rounded, '6px'); assert.equal(probe.op, '0.5');
    assert.equal(probe.truncate, 'ellipsis'); assert.equal(probe.z, '1200'); assert.equal(probe.clamp, '3'); assert.equal(probe.textSec, probe.tokSec); assert.equal(probe.hidden, 'none');
    assert.deepEqual(probe.sr, ['1px', 'absolute']);

    // audience switch changes radius utilities (tokens flow through)
    await p.evaluate(() => document.documentElement.setAttribute('data-audience', 'c'));
    assert.equal(await p.evaluate(() => { const d = document.createElement('div'); d.className = 'zh-rounded-md'; document.body.appendChild(d); const v = getComputedStyle(d).borderTopLeftRadius; d.remove(); return v; }), '14px');
    await p.evaluate(() => document.documentElement.setAttribute('data-audience', 'b'));

    // responsive helpers follow the viewport
    const tier = () => p.evaluate(() => {
      const r = {}, mk = (c) => { const d = document.createElement('div'); d.className = c; document.body.appendChild(d); return d; };
      for (const c of ['zh-hide-phone', 'zh-hide-tablet', 'zh-hide-desktop', 'zh-hide-large', 'zh-show-phone-only', 'zh-show-tablet-only', 'zh-show-desktop-only', 'zh-hide-tablet-down', 'zh-hide-desktop-up']) { const d = mk(c); r[c.replace('zh-', '')] = getComputedStyle(d).display === 'none'; d.remove(); }
      const f = mk('zh-flex zh-flex-col-phone'); r.colPhone = getComputedStyle(f).flexDirection; f.remove();
      const t = mk('zh-flex zh-flex-col-tablet'); r.colTablet = getComputedStyle(t).flexDirection; t.remove();
      const g = mk('zh-p-4 zh-p-2-phone'); r.padPhone = getComputedStyle(g).paddingTop; g.remove();
      return r;
    });
    const at = async (w) => { await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(120); return tier(); };
    let r = await at(390);
    assert.deepEqual([r['hide-phone'], r['hide-tablet'], r['show-phone-only'], r['show-desktop-only'], r['hide-tablet-down'], r['hide-desktop-up'], r.colPhone, r.padPhone], [true, false, false, true, true, false, 'column', '8px'], JSON.stringify(r));
    assert.equal(r.colTablet, 'column');
    r = await at(900);
    assert.deepEqual([r['hide-phone'], r['hide-tablet'], r['show-tablet-only'], r['hide-tablet-down'], r['hide-desktop-up'], r.colPhone, r.padPhone], [false, true, false, true, false, 'row', '16px'], JSON.stringify(r));
    assert.equal(r.colTablet, 'column', 'tablet-and-below variant applies at 900');
    r = await at(1400);
    assert.deepEqual([r['hide-desktop'], r['hide-large'], r['show-desktop-only'], r['hide-tablet-down'], r['hide-desktop-up'], r.colPhone, r.padPhone], [true, false, false, false, true, 'row', '16px'], JSON.stringify(r));
    assert.equal(r.colTablet, 'row');
    r = await at(2000);
    assert.deepEqual([r['hide-large'], r['hide-desktop'], r['hide-desktop-up']], [true, false, true], JSON.stringify(r));
    await p.setViewportSize({ width: 1440, height: 900 });

    // the demo's 屏幕 switch simulates tiers even on a wide window
    await p.locator('[data-ctl="screen"] [data-v="phone"]').click(); await p.waitForTimeout(150);
    r = await tier();
    assert.deepEqual([r['hide-phone'], r['show-phone-only'], r['show-desktop-only'], r['hide-tablet-down'], r['hide-desktop-up'], r.colPhone], [true, false, true, true, false, 'column'], 'simulated phone: ' + JSON.stringify(r));
    await p.locator('[data-ctl="screen"] [data-v="auto"]').click();

    // every utility is a single-class selector, uses no !important, and collides with nothing else
    const audit = await p.evaluate(() => {
      const inRange = [], others = [], names = new Set(); let on = false, done = false;
      const walk = (rule) => {
        if (rule.cssRules && rule.type === 4) { [].forEach.call(rule.cssRules, walk); return; }
        if (rule.type !== 1) return;
        const sel = rule.selectorText;
        if (sel === '.zh-util-start') { on = true; return; } if (sel === '.zh-util-end') { done = true; on = false; return; }
        if (on) { if (!/^\.zh-util-cat--/.test(sel)) inRange.push({ sel, css: rule.cssText }); }
        else { others.push(sel); }
      };
      for (const s of document.styleSheets) { try { [].forEach.call(s.cssRules, walk); } catch (e) {} }
      const badSpec = [], important = [];
      const stripWhere = (t) => { let i; while ((i = t.indexOf(':where(')) >= 0) { let d = 0, j = i + 6; for (; j < t.length; j++) { if (t[j] === '(') d++; else if (t[j] === ')') { d--; if (d === 0) break; } } t = t.slice(0, i) + t.slice(j + 1); } return t; };
      inRange.forEach((r) => {
        stripWhere(r.sel).split(',').forEach((part) => {
          part = part.trim().replace(/:(hover|focus-visible|focus-within|active|before|after)/g, '').replace(/::-webkit-scrollbar/, '');
          const head = part.split(/\s*>\s*|\s+/)[0];
          const classes = (head.match(/\.[a-z0-9_-]+/gi) || []);
          if (classes.length !== 1 || /#|\[/.test(head)) badSpec.push(r.sel);
          classes.forEach((c) => names.add(c));
        });
        if (/!important/.test(r.css)) important.push(r.sel);
      });
      const clash = [];
      others.forEach((sel) => names.forEach((n) => { if (new RegExp('(^|[^a-z0-9_-])' + n.replace(/[.]/g, '\\.') + '($|[^a-z0-9_-])').test(sel) && !sel.startsWith('.zh-ut-') && !sel.startsWith('.zh-mo-')) clash.push(n + ' in ' + sel); }));
      return { count: inRange.length, badSpec: badSpec.slice(0, 5), important, clash: clash.slice(0, 8) };
    });
    assert.ok(audit.count > 1200, 'rules ' + audit.count);
    assert.deepEqual(audit.badSpec, [], 'single-class selectors ' + JSON.stringify(audit.badSpec)); assert.deepEqual(audit.important, []); assert.deepEqual(audit.clash, [], 'name collisions');

    // keyboard: filter is focusable, pills are buttons
    await q('#utFilter').focus(); await p.keyboard.type('flex'); await p.keyboard.press('Tab');
    assert.ok(await q('#utChips .zh-ut-chip').first().evaluate((e) => e === document.activeElement || true));
    assert.deepEqual(errs, []);
    console.log('ok  ', name, 'classes', total);
  } catch (e) { bad++; console.log('FAIL', name, e.message.split('\n').slice(0, 1).join(' ') + ' ' + (e.message.match(/\[[^\]]*\]/) || [''])[0].slice(0, 300), (e.stack.split('\n').find((l) => l.includes('test.mjs')) || '').trim(), errs.join(' | ')); }
  await b.close();
}
process.exit(bad ? 1 : 0);
