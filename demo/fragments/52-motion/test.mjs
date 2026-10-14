// node demo/fragments/52-motion/test.mjs   (builds its own copy; runs in Chromium, Firefox and WebKit)
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium, firefox, webkit } = createRequire('/tmp/pw/')('playwright');
const out = '/tmp/zh-motion-test.html';
execFileSync('node', [new URL('../../build.mjs', import.meta.url).pathname, '--out', out, '--only', '00-core,52-motion,53-utilities'], { stdio: 'pipe' });
const url = (q) => 'file://' + out + '?only=animation' + (q ? '&' + q : '');
let bad = 0;

for (const [name, eng] of Object.entries({ chromium, firefox, webkit })) {
  const b = await eng.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  try {
    await p.goto(url()); await p.waitForTimeout(400);
    const q = (s) => p.locator(s);
    const anim = (sel) => p.evaluate((s) => getComputedStyle(document.querySelector(s)).animationName, sel);
    const state = (sel) => p.evaluate((s) => getComputedStyle(document.querySelector(s)).animationPlayState, sel);

    // tokens + structure
    assert.equal(await q('#zhMoDurTable td[data-tok="--zh-dur-fast"]').textContent(), '120ms');
    assert.equal(await q('.zh-mo-tile').count(), 18);
    assert.equal(await q('.zh-mo-curve').count(), 5);
    assert.ok((await q('.zh-mo-curve').first().locator('polyline').getAttribute('points')).split(' ').length >= 40);

    // reduce-motion simulation: slide-up replays as fade-in
    const tile = (c) => `.zh-mo-tile:has(button[data-copy="zh-anim-${c}"])`;
    await q(`${tile('slide-up')} [data-act]`).click();
    assert.equal(await anim(`${tile('slide-up')} .vis > *`), 'zh-kf-slide-up');
    await q('#zhMoReduce').evaluate((el) => el.click());
    assert.ok(await q('#animation').evaluate((el) => el.classList.contains('zh-reduce-motion')));
    await q(`${tile('slide-up')} [data-act]`).click();
    assert.equal(await anim(`${tile('slide-up')} .vis > *`), 'zh-kf-fade-in');
    assert.equal(await anim(`${tile('pulse')} .vis > *`), 'none', 'loop stops when reduced');
    await q('#zhMoReduce').evaluate((el) => el.click());
    assert.notEqual(await anim(`${tile('pulse')} .vis > *`), 'none');

    // loop tiles are paused until played
    assert.equal(await state(`${tile('pulse')} .vis > *`), 'paused');
    await q(`${tile('pulse')} [data-act]`).click();
    assert.equal(await state(`${tile('pulse')} .vis > *`), 'running');
    assert.equal(await q(`${tile('pulse')} [data-act]`).getAttribute('aria-pressed'), 'true');

    // recipes
    await q('#zhMoCollapseBtn').click();
    assert.ok(await q('#zhMoCollapse').evaluate((e) => e.classList.contains('is-closed')));
    assert.equal(await q('#zhMoCollapseBtn').getAttribute('aria-expanded'), 'false');
    const vis = () => p.evaluate(() => [...document.querySelectorAll('#zhMoFlip .zh-mo-face')].map((e) => getComputedStyle(e).visibility));
    await p.waitForTimeout(300); assert.deepEqual(await vis(), ['visible', 'hidden']);
    await q('#zhMoFlipBtn').click(); assert.ok(await q('#zhMoFlip').evaluate((e) => e.classList.contains('is-flipped')));
    await p.waitForTimeout(500); assert.deepEqual(await vis(), ['hidden', 'visible'], 'flipped: only the back face is visible');
    assert.equal(await p.evaluate(() => { const r = document.getElementById('zhMoFlip').getBoundingClientRect(); return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2).className; }), 'zh-mo-face back');
    await q('#zhMoFlipBtn').click(); await p.waitForTimeout(500); assert.deepEqual(await vis(), ['visible', 'hidden']);
    await q('[data-mo-step="1"]').click();
    assert.deepEqual(await q('.zh-mo-page').evaluateAll((l) => l.map((x) => x.className.replace('zh-mo-page ', ''))), ['is-before', 'is-active', 'is-after']);
    await q('#zhMoRouteTabs [data-r="1"]').click();
    assert.ok((await q('.zh-mo-layer.is-in').textContent()).includes('设备'));

    // list: add / remove / shuffle keep ids consistent
    const ids = () => q('#zhMoList li').evaluateAll((l) => l.map((x) => x.getAttribute('data-id')));
    await p.waitForTimeout(300);
    const n0 = (await ids()).length;
    await q('[data-mo-list="add"]').click(); assert.equal((await ids()).length, n0 + 1);
    assert.ok(await q('#zhMoList li').first().evaluate((e) => e.classList.contains('is-enter')));
    await q('[data-mo-list="remove"]').click(); await p.waitForTimeout(400); assert.equal((await ids()).length, n0);
    const before = (await ids()).slice().sort();
    await q('[data-mo-list="shuffle"]').click(); assert.deepEqual((await ids()).slice().sort(), before);
    await p.waitForTimeout(400);
    const flipTransforms = await q('#zhMoList li').evaluateAll((l) => l.every((x) => !x.style.transform || x.style.transform === ''));
    assert.ok(flipTransforms, 'FLIP transforms are cleaned up after the transition');

    // micro-interactions
    await q('#zhMoLike').click();
    assert.equal(await q('#zhMoLike').getAttribute('aria-pressed'), 'true'); assert.equal(await q('#zhMoLikeN').textContent(), '129');
    assert.ok(await q('#zhMoLike').evaluate((e) => e.classList.contains('is-bursting')));
    await q('#zhMoLike').click(); assert.equal(await q('#zhMoLikeN').textContent(), '128');
    await q('#zhMoCountGo').click(); await p.waitForTimeout(1300);
    assert.equal(await q('[data-mo-count="12480"]').textContent(), '12,480'); assert.equal(await q('[data-mo-count="42.6"]').textContent(), '42.6');
    await q('[data-mo-prog="75"]').click();
    assert.equal(await q('#zhMoProg').getAttribute('aria-valuenow'), '75'); assert.equal(await q('#zhMoProgN').textContent(), '75%');
    const cb = q('.zh-mo-cb input'); await q('.zh-mo-cb').click(); assert.ok(await cb.isChecked());
    await p.waitForTimeout(450);
    assert.ok(await q('.zh-mo-cb path').evaluate((e) => getComputedStyle(e).strokeDashoffset === '0px' || parseFloat(getComputedStyle(e).strokeDashoffset) < 30));
    await q('#zhMoInput').focus(); await q('#zhMoInput').fill('a@b.c');
    assert.ok(await q('.zh-mo-field label').evaluate((e) => getComputedStyle(e).transform !== 'none'), 'floating label moved');

    // counter reaches final value instantly when reduced
    await q('#zhMoReduce').evaluate((el) => el.click()); await q('#zhMoCountGo').click();
    assert.equal(await q('[data-mo-count="12480"]').textContent(), '12,480');
    await q('#zhMoReduce').evaluate((el) => el.click());

    // playground
    await q('#zhMoProp').selectOption('width');
    assert.ok((await q('#zhMoPerf').getAttribute('class')).includes('danger')); assert.ok((await q('#zhMoCode').textContent()).includes('width'));
    await p.waitForTimeout(100); const w0 = await q('#zhMoBox').evaluate((e) => e.style.width);
    await q('#zhMoPlay').click(); assert.notEqual(await q('#zhMoBox').evaluate((e) => e.style.width), w0);
    await q('#zhMoProp').selectOption('tx'); assert.ok((await q('#zhMoPerf').getAttribute('class')).includes('success'));
    await q('#zhMoDurQuick [data-v="480"]').click(); assert.equal(await q('#zhMoDurOut').textContent(), '480ms'); assert.ok((await q('#zhMoCode').textContent()).includes('480ms'));

    // curves: marker travels
    const cx0 = await q('.zh-mo-curve .mk').first().getAttribute('cx');
    await q('[data-mo-curve="0"]').click(); await p.waitForTimeout(700);
    assert.notEqual(await q('.zh-mo-curve .mk').first().getAttribute('cx'), cx0);

    // reveal + skeleton
    assert.ok((await q('.zh-mo-reveal.is-in').count()) >= 2);
    await q('#zhMoSkelGo').click(); assert.equal(await q('#zhMoSwap').getAttribute('aria-busy'), 'false');

    // keyboard: the reduce switch and buttons are focusable
    await q('#zhMoReduce').focus(); await p.keyboard.press('Space'); assert.ok(await q('#animation').evaluate((e) => e.classList.contains('zh-reduce-motion')));
    assert.deepEqual(errs, []);
    console.log('ok  ', name);
  } catch (e) { bad++; console.log('FAIL', name, e.message.split('\n')[0], (e.stack.split('\n').find((l) => l.includes('test.mjs')) || '').trim(), errs.join(' | ')); }
  await b.close();
}
process.exit(bad ? 1 : 0);
