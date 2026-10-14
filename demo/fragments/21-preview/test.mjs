// Interaction tests for fragment 21-preview, in Chromium, Firefox and WebKit.
//   node demo/fragments/21-preview/test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const { chromium, firefox, webkit } = createRequire('/tmp/pw/')('playwright');
const root = new URL('../../../', import.meta.url).pathname;
execFileSync('node', [root + 'demo/build.mjs', '--out', '/tmp/zh-feedback.html', '--only', '00-core,20-popover,21-preview'], { stdio: 'pipe' });
const url = 'file:///tmp/zh-feedback.html?only=preview';
const T = (name, fn, ctxOpts) => ({ name, fn, ctxOpts });
let bad = 0;
const pctOf = (p) => p.locator('.zh-lb-pct').textContent();
const tf = async (p) => {
  const t = await p.evaluate(() => document.querySelector('.zh-lb-img').style.transform);
  const rot = +(/rotate\((-?[\d.]+)deg\)/.exec(t) || [0, 0])[1]; const m = /scale\((-?[\d.]+)(?:, ?(-?[\d.]+))?\)/.exec(t); const tr = /translate3d\((-?[\d.]+)px, ?(-?[\d.]+)px/.exec(t) || [0, 0, 0];
  return { raw: t, rot, sx: +m[1], sy: m[2] === undefined ? +m[1] : +m[2], x: +tr[1], y: +tr[2] };
};
const counter = (p) => p.locator('.zh-lb-count b').textContent();
const openLb = async (p, i = 0) => { const it = p.locator('.zh-gal-item').nth(i); await it.scrollIntoViewIfNeeded(); await it.click(); await p.waitForTimeout(450); };
const activeDot = (p, sel) => p.evaluate((s) => [...document.querySelectorAll(s + ' .zh-car-dot')].findIndex((d) => d.getAttribute('aria-selected') === 'true'), sel);

const tests = [
  T('image states: loaded, loading→loaded, error→retry, placeholder', async (p) => {
    await p.goto(url); await p.waitForTimeout(250);
    const st = (k) => p.locator(`[data-zh-img="${k}"]`).getAttribute('data-state');
    await p.waitForTimeout(300); assert.equal(await st('ok'), 'loaded'); assert.equal(await st('none'), 'placeholder');
    assert.equal(await st('slow'), 'loading'); assert.equal(await p.locator('[data-zh-img="slow"]').getAttribute('aria-busy'), 'true', 'busy while loading');
    assert.ok(await p.evaluate(() => getComputedStyle(document.querySelector('[data-zh-img="slow"] .zh-img-skel')).opacity) === '1', 'skeleton visible');
    await p.waitForTimeout(2200); assert.equal(await st('slow'), 'loaded'); assert.equal(await p.locator('[data-zh-img="slow"]').getAttribute('aria-busy'), null);
    assert.equal(await st('broken'), 'error'); assert.ok(await p.locator('[data-zh-img="broken"] .zh-img-err').isVisible(), 'error message shown');
    assert.equal(await p.locator('[data-zh-img="broken"] img').getAttribute('alt'), '蔷薇色渐变插画', 'alt kept on failure');
    await p.locator('[data-zh-img="broken"] [data-retry]').click(); await p.waitForTimeout(150); assert.equal(await st('broken'), 'loading');
    await p.waitForTimeout(900); assert.equal(await st('broken'), 'loaded', 'retry succeeds');
    await p.click('#zhImgBreak'); await p.waitForTimeout(1000); assert.equal(await st('broken'), 'error', 'can re-demo failure');
    await p.click('#zhImgReload'); await p.waitForTimeout(200); assert.equal(await st('slow'), 'loading', 'can re-demo loading');
    const fits = await p.evaluate(() => [...document.querySelectorAll('[data-zh-fit]')].slice(0, 3).map((f) => getComputedStyle(f.querySelector('img')).objectFit));
    assert.deepEqual(fits, ['cover', 'contain', 'fill']);
    const radii = await p.evaluate(() => [...document.querySelectorAll('.zh-img--r-sm .zh-img-frame, .zh-img--r-md .zh-img-frame, .zh-img--r-lg .zh-img-frame, .zh-img--r-full .zh-img-frame')].map((f) => getComputedStyle(f).borderTopLeftRadius));
    assert.equal(new Set(radii).size, 4, 'four distinct radii: ' + radii);
    const noAlt = await p.evaluate(() => [...document.querySelectorAll('#preview img')].filter((i) => !i.hasAttribute('alt')).length); assert.equal(noAlt, 0, 'every img has an alt attribute');
  }),
  T('lightbox: open, a11y, keyboard navigation, zoom, rotate, flip, reset, close', async (p) => {
    await p.goto(url); await p.waitForTimeout(250);
    await p.waitForTimeout(300); await openLb(p, 2);
    const r = await p.evaluate(() => { const d = document.querySelector('.zh-lb'); return { role: d.getAttribute('role'), modal: d.getAttribute('aria-modal'), focusIn: d.contains(document.activeElement), ov: document.documentElement.style.overflow, opened: d.classList.contains('is-open') }; });
    assert.deepEqual([r.role, r.modal, r.focusIn, r.ov, r.opened], ['dialog', 'true', true, 'hidden', true]);
    assert.equal(await counter(p), '3 / 8'); assert.match(await p.locator('.zh-lb-live').textContent(), /第 3 张，共 8 张：蔷薇/);
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300); assert.equal(await counter(p), '4 / 8');
    await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(300); assert.equal(await counter(p), '2 / 8');
    assert.equal(await p.locator('.zh-lb-thumb[aria-current="true"]').getAttribute('data-i'), '1');
    await p.keyboard.press('+'); assert.equal(await pctOf(p), '125%'); await p.keyboard.press('+'); assert.equal(await pctOf(p), '156%'); await p.keyboard.press('-'); assert.equal(await pctOf(p), '125%');
    await p.keyboard.press('0'); assert.equal(await pctOf(p), '100%');
    await p.keyboard.press('r'); assert.equal((await tf(p)).rot, 90); await p.keyboard.press('Shift+R'); await p.keyboard.press('Shift+R'); assert.equal((await tf(p)).rot, -90);
    await p.keyboard.press('0'); await p.keyboard.press('h'); let t = await tf(p); assert.ok(t.sx < 0 && t.sy > 0, 'flipped horizontally'); await p.keyboard.press('v'); t = await tf(p); assert.ok(t.sx < 0 && t.sy < 0, 'flipped vertically');
    await p.click('[data-lb="reset"]'); t = await tf(p); assert.ok(t.rot === 0 && t.sx > 0 && t.sy > 0 && t.x === 0 && t.y === 0, 'reset');
    await p.click('[data-lb="in"]'); assert.equal(await pctOf(p), '125%'); await p.click('[data-lb="out"]'); assert.equal(await pctOf(p), '100%');
    await p.click('[data-lb="cw"]'); assert.equal((await tf(p)).rot, 90); await p.click('[data-lb="ccw"]');
    await p.locator('.zh-lb-thumb').nth(6).click(); await p.waitForTimeout(300); assert.equal(await counter(p), '7 / 8', 'thumbnail jumps');
    const dl = await p.locator('[data-lb="dl"]'); assert.match(await dl.getAttribute('href'), /^data:image\/svg\+xml/); assert.match(await dl.getAttribute('download'), /余烬\.svg/);
    for (let i = 0; i < 25; i++) await p.keyboard.press('Tab');
    assert.ok(await p.evaluate(() => document.querySelector('.zh-lb').contains(document.activeElement)), 'Tab trapped inside');
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    assert.equal(await p.locator('.zh-lb').count(), 0, 'Esc closes');
    assert.equal(await p.evaluate(() => document.activeElement.getAttribute('data-i')), '2', 'focus back on the opener thumbnail');
    assert.equal(await p.evaluate(() => document.documentElement.style.overflow), '', 'scroll lock released');
  }),
  T('lightbox: ends disable arrows, wheel zoom, drag pan, swipe, double-click, backdrop close', async (p) => {
    await p.setViewportSize({ width: 1440, height: 900 });
    await p.goto(url); await p.waitForTimeout(250);
    await openLb(p, 0);
    assert.equal(await p.locator('.zh-lb-prev').isDisabled(), true, 'prev disabled on first'); assert.equal(await p.locator('.zh-lb-next').isDisabled(), false);
    await p.locator('.zh-lb-thumb').nth(7).click(); await p.waitForTimeout(300); assert.equal(await p.locator('.zh-lb-next').isDisabled(), true, 'next disabled on last');
    await p.locator('.zh-lb-thumb').nth(1).click(); await p.waitForTimeout(300);
    const box = await p.locator('.zh-lb-stage').boundingBox(); const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    await p.mouse.move(cx, cy); await p.mouse.wheel(0, -300); await p.waitForTimeout(150);
    const z1 = parseInt(await pctOf(p), 10); assert.ok(z1 > 100, 'wheel zooms in: ' + z1);
    assert.equal(await p.evaluate(() => document.querySelector('.zh-lb-stage').classList.contains('is-zoomed')), true);
    const before = await tf(p); await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.move(cx - 90, cy - 40, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(150);
    const after = await tf(p); assert.ok(after.x !== before.x || after.y !== before.y, 'drag pans when zoomed'); assert.equal(await counter(p), '2 / 8', 'panning does not change image');
    await p.mouse.wheel(0, 800); await p.waitForTimeout(150); await p.click('[data-lb="reset"]');
    await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.move(cx - 220, cy + 4, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(350);
    assert.equal(await counter(p), '3 / 8', 'swipe left goes next');
    await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.move(cx + 220, cy, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(350);
    assert.equal(await counter(p), '2 / 8', 'swipe right goes previous');
    await p.mouse.dblclick(cx, cy); await p.waitForTimeout(200); assert.equal(await pctOf(p), '250%', 'double-click zooms to 250%');
    await p.mouse.dblclick(cx, cy); await p.waitForTimeout(200); assert.equal(await pctOf(p), '100%', 'double-click again resets');
    await p.mouse.click(box.x + 100, cy); await p.waitForTimeout(400); assert.equal(await p.locator('.zh-lb').count(), 0, 'click on empty backdrop closes');
  }),
  T('lightbox: close button, toolbar roles, phone layout, fullscreen availability', async (p) => {
    await p.setViewportSize({ width: 390, height: 800 });
    await p.goto(url); await p.waitForTimeout(250);
    await openLb(p, 1);
    assert.equal(await p.locator('.zh-lb-tools').getAttribute('role'), 'toolbar');
    const names = await p.evaluate(() => [...document.querySelectorAll('.zh-lb button, .zh-lb a')].filter((b) => !b.classList.contains('zh-lb-thumb')).map((b) => b.getAttribute('aria-label')));
    assert.ok(names.every(Boolean), 'every control has an accessible name: ' + names);
    const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); assert.ok(over <= 0, 'no horizontal overflow');
    const t = await p.evaluate(() => { const r = document.querySelector('.zh-lb-tools').getBoundingClientRect(); return r.right <= innerWidth + 1 && r.left >= 0; }); assert.ok(t, 'toolbar fits on a phone');
    const fsHas = await p.evaluate(() => !!(document.fullscreenEnabled || document.webkitFullscreenEnabled));
    assert.equal(await p.locator('[data-lb="fs"]').count(), fsHas ? 1 : 0, 'fullscreen button only when supported');
    await p.click('[data-lb="close"]'); await p.waitForTimeout(400); assert.equal(await p.locator('.zh-lb').count(), 0);
  }),
  T('carousel: a11y, autoplay, hover/focus pause, pause button, dots, arrows, keys, loop, swipe', async (p) => {
    await p.goto(url); await p.waitForTimeout(250);
    const A = '#zhCarA';
    const car = p.locator(A + ' .zh-car'); await car.scrollIntoViewIfNeeded();
    assert.equal(await car.getAttribute('role'), 'region'); assert.equal(await car.getAttribute('aria-roledescription'), 'carousel');
    assert.equal(await p.locator(A + ' .zh-car-slide').first().getAttribute('aria-roledescription'), 'slide'); assert.match(await p.locator(A + ' .zh-car-slide').first().getAttribute('aria-label'), /第 1 张，共 5 张/);
    assert.equal(await p.locator(A + ' .zh-car-dots').getAttribute('role'), 'tablist'); assert.equal(await p.locator(A + ' .zh-car-track').getAttribute('aria-live'), 'off', 'live region off while autoplaying');
    assert.equal(await activeDot(p, A), 0);
    await p.evaluate(() => { document.querySelector('#zhCarA .zh-car').dataset.interval = 300; });
    await p.mouse.move(5, 5); await p.locator(A + ' .zh-car').hover(); await p.waitForTimeout(900); assert.equal(await activeDot(p, A), 0, 'paused while hovered');
    await p.mouse.move(5, 5); await p.waitForTimeout(900); assert.ok(await activeDot(p, A) > 0, 'advances by itself after hover ends');
    await p.click(A + ' .zh-car-play'); assert.equal(await p.locator(A + ' .zh-car-play').getAttribute('aria-label'), '开始自动播放');
    assert.equal(await p.locator(A + ' .zh-car-track').getAttribute('aria-live'), 'polite', 'live region polite when stopped');
    const at = await activeDot(p, A); await p.mouse.move(5, 5); await p.waitForTimeout(800); assert.equal(await activeDot(p, A), at, 'stays put when paused by the user');
    await p.click(A + ' .zh-car-dots .zh-car-dot:nth-child(4)'); assert.equal(await activeDot(p, A), 3);
    assert.match(await p.locator(A + ' .zh-car-track').getAttribute('style'), /-300%/, 'slide effect translates the track');
    await p.click(A + ' .zh-car-next'); assert.equal(await activeDot(p, A), 4); await p.click(A + ' .zh-car-next'); assert.equal(await activeDot(p, A), 0, 'loops forward');
    await p.click(A + ' .zh-car-prev'); assert.equal(await activeDot(p, A), 4, 'loops backward');
    await car.focus(); await p.keyboard.press('Home'); assert.equal(await activeDot(p, A), 0); await p.keyboard.press('ArrowRight'); assert.equal(await activeDot(p, A), 1); await p.keyboard.press('End'); assert.equal(await activeDot(p, A), 4); await p.keyboard.press('ArrowLeft'); assert.equal(await activeDot(p, A), 3);
    await p.locator(A + ' .zh-car-dot[aria-selected="true"]').focus(); await p.keyboard.press('ArrowRight'); assert.equal(await activeDot(p, A), 4, 'tab arrow keys move slides');
    assert.equal(await p.evaluate(() => document.activeElement.getAttribute('role')), 'tab');
    await p.click(A + ' .zh-car-dots .zh-car-dot:nth-child(2)'); await p.waitForTimeout(450); const vb = await p.locator(A + ' .zh-car-viewport').boundingBox(); const cy = vb.y + vb.height / 2;
    await p.mouse.move(vb.x + vb.width * 0.7, cy - 30); await p.mouse.down(); await p.mouse.move(vb.x + vb.width * 0.3, cy - 30, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(400);
    assert.equal(await activeDot(p, A), 2, 'drag left goes next');
    await p.mouse.move(vb.x + vb.width * 0.3, cy - 30); await p.mouse.down(); await p.mouse.move(vb.x + vb.width * 0.7, cy - 30, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(400);
    assert.equal(await activeDot(p, A), 1, 'drag right goes previous');
  }),
  T('carousel B: fade effect, no loop, arrows disabled at ends, no autoplay controls', async (p) => {
    await p.goto(url); await p.waitForTimeout(250);
    const B = '#zhCarB'; await p.locator(B + ' .zh-car').scrollIntoViewIfNeeded();
    assert.equal(await p.locator(B + ' .zh-car').getAttribute('data-effect'), 'fade'); assert.equal(await p.locator(B + ' .zh-car-play').count(), 0);
    assert.equal(await p.locator(B + ' .zh-car-prev').isDisabled(), true, 'prev disabled at first');
    const op = () => p.evaluate(() => [...document.querySelectorAll('#zhCarB .zh-car-slide')].map((s) => getComputedStyle(s).opacity));
    await p.waitForTimeout(700); assert.deepEqual(await op(), ['1', '0', '0', '0', '0']);
    await p.click(B + ' .zh-car-next'); await p.waitForTimeout(1000); assert.deepEqual(await op(), ['0', '1', '0', '0', '0'], 'cross-fades to slide 2');
    await p.click(B + ' .zh-car-dots .zh-car-dot:nth-child(5)'); assert.equal(await p.locator(B + ' .zh-car-next').isDisabled(), true, 'next disabled at last');
    await p.evaluate(() => { document.querySelector('#zhCarB .zh-car').dataset.interval = 200; }); await p.mouse.move(5, 5); await p.waitForTimeout(600);
    assert.equal(await activeDot(p, B), 4, 'never auto-advances');
  }),
  T('carousel respects reduced motion: no autoplay, no play button', async (p) => {
    await p.goto(url); await p.waitForTimeout(250);
    await p.evaluate(() => { document.querySelector('#zhCarA .zh-car').dataset.interval = 200; }); await p.locator('#zhCarA .zh-car').scrollIntoViewIfNeeded();
    await p.locator('#zhCarA .zh-car').hover(); await p.mouse.move(5, 5); await p.waitForTimeout(800);
    assert.equal(await p.locator('#zhCarA .zh-car-play').count(), 0); assert.equal(await activeDot(p, '#zhCarA'), 0, 'stays on slide 1');
  }, { reducedMotion: 'reduce' }),
  T('no horizontal overflow at 390 / 820 / 1440 in all themes', async (p) => {
    for (const w of [390, 820, 1440]) for (const q of ['', '&audience=c', '&mode=dark', '&audience=c&mode=dark&density=compact', '&density=comfortable', '&screen=phone']) {
      await p.setViewportSize({ width: w, height: 800 }); await p.goto(url + q); await p.waitForTimeout(150);
      const o = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); assert.ok(o <= 0, `${w} ${q}: overflow ${o}`);
    }
  }),
];

for (const [name, eng] of Object.entries({ chromium, firefox, webkit })) {
  const b = await eng.launch();
  for (const t of tests) {
    const ctx = await b.newContext(Object.assign({ viewport: { width: 1440, height: 900 } }, t.ctxOpts || {})); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    try { await t.fn(p); assert.deepEqual(errs, [], 'page errors'); console.log('ok  ', name.padEnd(8), t.name); }
    catch (e) { bad++; console.log('FAIL', name.padEnd(8), t.name, '\n     ', String(e.message).split('\n').slice(0, 2).join(' | ')); }
    await ctx.close();
  }
  await b.close();
}
console.log(bad ? `\n${bad} failing` : '\nall passed');
process.exit(bad ? 1 : 0);
