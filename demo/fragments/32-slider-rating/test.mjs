// Interaction tests for slider + rating in Chromium, Firefox and WebKit.   node test.mjs
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium, firefox, webkit } = createRequire('/tmp/pw/')('playwright');
execFileSync('node', [new URL('../../build.mjs', import.meta.url).pathname, '--out', '/tmp/zh-inputs.html', '--only', '00-core,32-slider-rating,33-input,34-upload'], { stdio: 'ignore' });

let bad = 0;
for (const [name, eng] of Object.entries({ chromium, firefox, webkit })) {
  const b = await eng.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file:///tmp/zh-inputs.html?only=slider'); await p.waitForTimeout(300);
  try {
    const now = (sel, i = 0) => p.locator(sel + ' .zh-slider-thumb').nth(i).getAttribute('aria-valuenow').then(Number);
    const S = '.zh-slider[data-label="音量"]';

    // keyboard
    await p.locator(S + ' .zh-slider-thumb').focus();
    await p.keyboard.press('ArrowRight'); assert.equal(await now(S), 41);
    await p.keyboard.press('PageUp'); assert.equal(await now(S), 51);
    await p.keyboard.press('Home'); assert.equal(await now(S), 0);
    await p.keyboard.press('End'); assert.equal(await now(S), 100);
    assert.equal((await p.locator('#sl-o1').textContent()).trim(), '100%');
    assert.equal(await p.locator(S + ' .zh-slider-thumb').getAttribute('aria-valuetext'), '100%');

    // pointer: click the rail, then drag the thumb
    const rail = await p.locator(S + ' .zh-slider-rail').boundingBox();
    await p.mouse.click(rail.x + rail.width * 0.25, rail.y + rail.height / 2);
    assert.ok(Math.abs(await now(S) - 25) <= 2, 'click on rail ~25');
    const th = await p.locator(S + ' .zh-slider-thumb').boundingBox();
    await p.mouse.move(th.x + th.width / 2, th.y + th.height / 2); await p.mouse.down();
    await p.mouse.move(rail.x + rail.width * 0.75, rail.y + rail.height / 2, { steps: 5 });
    assert.ok(await p.locator(S + ' .zh-slider-thumb.is-drag').count() === 1, 'drag class while dragging');
    await p.mouse.up();
    assert.ok(Math.abs(await now(S) - 75) <= 2, 'drag to ~75');

    // step + marks: only lands on 0/25/50/...
    const ST = '.zh-slider[data-label="清晰度"]';
    await p.locator(ST + ' .zh-slider-thumb').focus(); await p.keyboard.press('ArrowRight');
    assert.equal(await now(ST), 75);
    assert.equal(await p.locator(ST + ' .zh-slider-mark.is-cur').count(), 1);
    await p.locator(ST + ' .zh-slider-mlabel', { hasText: '流畅' }).click({ force: true });
    assert.equal(await now(ST), 0);

    // linked number input, both ways
    const L = '.zh-slider[data-label="每页条数"]';
    assert.equal(await p.locator('#sl-n1').inputValue(), '60');
    await p.locator('#sl-n1').fill('150'); await p.locator('#sl-n1').blur();
    assert.equal(await now(L), 150);
    await p.locator(L + ' .zh-slider-thumb').focus(); await p.keyboard.press('End');
    assert.equal(await p.locator('#sl-n1').inputValue(), '200');

    // value-based colour + status text
    const C = '.zh-slider[data-label="存储用量"]';
    assert.match(await p.locator(C).evaluate((e) => e.style.getPropertyValue('--zh-slider-c')), /warning/);
    assert.match(await p.locator('#sl-o4').textContent(), /偏高/);
    await p.locator(C + ' .zh-slider-thumb').focus(); await p.keyboard.press('End');
    assert.match(await p.locator(C).evaluate((e) => e.style.getPropertyValue('--zh-slider-c')), /danger/);
    assert.match(await p.locator('#sl-o4').textContent(), /危险/);

    // range: thumbs never cross, min gap honoured, inputs linked
    const R = '.zh-slider[data-label="价格"]';
    await p.locator(R + ' .zh-slider-thumb').nth(0).focus(); await p.keyboard.press('End');
    assert.equal(await now(R, 0), 3000, 'thumb 0 stops gap before thumb 1');
    await p.locator(R + ' .zh-slider-thumb').nth(1).focus(); await p.keyboard.press('Home');
    assert.equal(await now(R, 1), 3200, 'thumb 1 stops gap after thumb 0');
    assert.equal(await p.locator('#sl-min').inputValue(), '3000');
    await p.locator('#sl-min').fill('1000'); await p.locator('#sl-min').blur();
    assert.equal(await now(R, 0), 1000);
    assert.match(await p.locator('#sl-o5').textContent(), /¥1,000 – ¥3,200/);
    assert.equal(await p.locator(R + ' .zh-slider-thumb').nth(0).getAttribute('aria-label'), '价格 最小值');

    // vertical + disabled
    const V = '.zh-slider[data-label="低音"]';
    assert.equal(await p.locator(V + ' .zh-slider-thumb').getAttribute('aria-orientation'), 'vertical');
    await p.locator(V + ' .zh-slider-thumb').focus(); await p.keyboard.press('ArrowUp'); assert.equal(await now(V), 31);
    await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); assert.equal(await now(V), 29);
    const D = '.zh-slider[data-label="禁用的滑块"]';
    assert.equal(await p.locator(D + ' .zh-slider-thumb').getAttribute('aria-disabled'), 'true');
    assert.equal(await p.locator(D + ' .zh-slider-thumb').getAttribute('tabindex'), '-1');
    await p.locator(D + ' .zh-slider-thumb').focus({ timeout: 500 }).catch(() => {});
    await p.keyboard.press('ArrowRight'); assert.equal(await now(D), 35);

    // ---- rating ----
    await p.goto('file:///tmp/zh-inputs.html?only=rating'); await p.waitForTimeout(300);
    const A = '.zh-rating[data-label="服务评分"]';
    assert.equal((await p.locator(A + ' .zh-rating-text').textContent()).trim(), '一般');
    await p.locator(A + ' .zh-rating-in[value="5"]').click({ force: true });
    assert.equal((await p.locator(A + ' .zh-rating-text').textContent()).trim(), '很好');
    assert.equal(await p.locator(A).evaluate((e) => e.zhRating.get()), 5);
    await p.locator(A + ' .zh-rating-cell').nth(1).hover();
    assert.equal((await p.locator(A + ' .zh-rating-text').textContent()).trim(), '较差', 'hover previews');
    await p.mouse.move(5, 5);
    assert.equal((await p.locator(A + ' .zh-rating-text').textContent()).trim(), '很好', 'preview reverts');
    await p.locator(A + ' .zh-rating-in[value="5"]').focus(); await p.keyboard.press('ArrowLeft');
    assert.equal(await p.locator(A).evaluate((e) => e.zhRating.get()), 4, 'radio group arrows');
    assert.equal(await p.locator(A + ' [role=radiogroup]').getAttribute('aria-label'), '服务评分');
    assert.match(await p.locator(A + ' .zh-rating-in[value="3"]').getAttribute('aria-label'), /3 星 · 一般/);

    const H = '.zh-rating[data-label="口味评分"]';
    await p.locator(H + ' .zh-rating-in[value="1.5"]').click({ force: true });
    assert.equal((await p.locator(H + ' .zh-rating-num').textContent()).trim(), '1.5');
    assert.equal(await p.locator(H + ' .zh-rating-part').nth(1).evaluate((e) => e.style.width), '50%');

    const K = '.zh-rating[data-label="可清除的评分"]';
    await p.locator(K + ' .zh-rating-in[value="4"]').click({ force: true });
    assert.equal(await p.locator(K).evaluate((e) => e.zhRating.get()), 0, 'click current value clears');
    await p.locator(K + ' .zh-rating-in[value="2"]').click({ force: true });
    await p.keyboard.press('Backspace');
    assert.equal(await p.locator(K).evaluate((e) => e.zhRating.get()), 0, 'Backspace clears');

    const RO = '.zh-rating[data-readonly][data-value="4.3"]';
    assert.equal(await p.locator(RO + ' .zh-rating-in').count(), 0);
    assert.match(await p.locator(RO + ' .zh-rating-stars').getAttribute('aria-label'), /4\.3 分，满分 5 分/);
    assert.equal(await p.locator(RO + ' .zh-rating-part').nth(4).evaluate((e) => e.style.width), '30%');
    assert.equal(await p.locator('.zh-rating[data-disabled] .zh-rating-in').first().isDisabled(), true);
    assert.match(await p.locator('.zh-rate-score .metric').textContent(), /4\.6/);
    assert.deepEqual(errs, []);
    console.log('ok  ', name);
  } catch (e) { bad++; console.log('FAIL', name, e.message.split('\n')[0]); }
  await b.close();
}
process.exit(bad ? 1 : 0);
