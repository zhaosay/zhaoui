// Interaction tests for the pagination fragment, all three engines.  node demo/fragments/51-pagination/test.mjs
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium, firefox, webkit } = createRequire('/tmp/pw/')('playwright');
const root = new URL('../../../', import.meta.url).pathname;
const out = '/tmp/zh-pagination-test.html';
execFileSync('node', [root + 'demo/build.mjs', '--out', out, '--only', '00-core,51-pagination'], { stdio: 'pipe' });

let bad = 0;
for (const [name, eng] of Object.entries({ chromium, firefox, webkit })) {
  const b = await eng.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + out + '?only=pagination'); await p.waitForTimeout(300);
  const t = { name };
  try {
    const cur = () => p.locator('#pgxMain [aria-current="page"]').innerText();
    const labels = () => p.locator('#pgxMain .zh-pg-list li').evaluateAll((els) => els.map((e) => e.textContent.trim()));
    const firstId = () => p.locator('#pgxBody tr:first-child td:first-child').innerText();
    const settle = () => p.waitForFunction(() => !document.querySelector('#pgxTableWrap[aria-busy]'));

    // 1. initial state
    assert.equal(await p.locator('#pgxBody tr').count(), 10); assert.equal(await firstId(), '1'); assert.equal(await cur(), '1');
    assert.equal(await p.locator('#pgxMain .zh-pg-prev').getAttribute('aria-disabled'), 'true');
    assert.deepEqual(await labels(), ['1', '2', '3', '4', '5', '…', '9']); t.initial = 1;

    // 2. clicking a page shows skeleton first, then the right rows
    await p.locator('#pgxMain [data-p="3"]').click();
    assert.ok(await p.locator('#pgxBody .zh-skeleton').count() > 0, 'skeleton while loading');
    assert.equal(await p.locator('#pgxTableWrap').getAttribute('aria-busy'), 'true');
    await settle(); assert.equal(await firstId(), '21'); assert.equal(await cur(), '3'); t.skeleton = 1;

    // 3. constant slot count and correct ellipsis pattern on every page
    const seen = {};
    for (let n = 1; n <= 9; n++) {
      await p.locator(`#pgxMain [data-p="${n}"]`).click().catch(async () => {});
      if (n > 1 && (await cur()) !== String(n)) { // target not visible in the 7 slots: step with next
        while ((await cur()) !== String(n)) await p.locator('#pgxMain .zh-pg-next').click();
      }
      await settle(); seen[n] = await labels();
      assert.equal(seen[n].length, 7, `page ${n} has ${seen[n].length} slots`);
    }
    assert.deepEqual(seen[1], ['1', '2', '3', '4', '5', '…', '9']); assert.deepEqual(seen[5], ['1', '…', '4', '5', '6', '…', '9']); assert.deepEqual(seen[9], ['1', '…', '5', '6', '7', '8', '9']);
    assert.equal(await p.locator('#pgxMain .zh-pg-next').getAttribute('aria-disabled'), 'true'); t.slots = 7;

    // 4. ellipsis jumps 5 pages
    await p.locator('#pgxMain [data-p="1"]').click(); await settle();
    await p.locator('#pgxMain [data-act="jf"]').click(); await settle(); assert.equal(await cur(), '6');
    await p.locator('#pgxMain [data-act="jb"]').click(); await settle(); assert.equal(await cur(), '1');
    assert.match(await p.locator('#pgxMain [data-act="jf"]').getAttribute('aria-label'), /向后 5 页/); t.jump5 = 1;

    // 5. page size keeps the first visible row on the page
    await p.locator('#pgxMain [data-p="4"]').click().catch(() => {}); while ((await cur()) !== '4') await p.locator('#pgxMain .zh-pg-next').click(); await settle();
    assert.equal(await firstId(), '31');
    await p.locator('#pgxMain select').selectOption('20'); await settle();
    assert.equal(await cur(), '2'); assert.equal(await p.locator('#pgxBody tr').count(), 20); t.sizeAnchor = 1;

    // 6. jumper: invalid, clamp high, clamp low
    const jump = p.locator('#pgxMain [data-jump]');
    await jump.fill('abc'); await jump.press('Enter'); assert.equal(await jump.getAttribute('aria-invalid'), 'true');
    await jump.fill('999'); await jump.press('Enter'); await settle(); assert.equal(await cur(), '5');
    await p.locator('#pgxMain [data-jump]').fill('0'); await p.locator('#pgxMain [data-jump]').press('Enter'); await settle(); assert.equal(await cur(), '1'); t.jumper = 1;

    // 7. keyboard paging keeps focus on the current page button
    await p.locator('#pgxMain [data-p="2"]').focus(); await p.keyboard.press('Enter'); await settle();
    assert.equal(await p.evaluate(() => document.activeElement.getAttribute('aria-current')), 'page');
    assert.equal(await p.evaluate(() => document.activeElement.textContent.trim()), '2');
    // Safari skips native <button> in the Tab order by default (macOS keyboard-navigation setting); Option+Tab is its equivalent.
    await p.keyboard.press(name === 'webkit' ? 'Alt+Tab' : 'Tab'); assert.ok(await p.evaluate(() => document.activeElement.getAttribute('data-p') === '3'), 'Tab moves to next page button');
    assert.match(await p.locator('#pgxMain .zh-pg-sr').innerText(), /第 2 页，共 5 页/); t.keyboard = 1;

    // 8. filter: results, empty state hides pager, clear restores
    await p.locator('#pgxSearch').fill('产品发布');
    const n = await p.locator('#pgxBody tr').count(); assert.ok(n > 0 && n < 20);
    await p.locator('#pgxSearch').fill('不存在的标题');
    assert.equal(await p.locator('#pgxEmpty').isVisible(), true); assert.equal(await p.locator('#pgxMain').isVisible(), false);
    await p.locator('#pgxClear').click(); assert.equal(await p.locator('#pgxEmpty').isVisible(), false); assert.equal(await p.locator('#pgxMain').isVisible(), true);
    assert.equal(await p.locator('#pgxSearch').inputValue(), ''); t.filter = 1;

    // 9. simple mode
    const mid = p.locator('#pgSimple .zh-pg-mid input');
    await mid.fill('7'); await mid.press('Enter'); assert.equal(await p.locator('#pgSimple .zh-pg-mid input').inputValue(), '7');
    await p.locator('#pgSimple .zh-pg-next').click(); assert.equal(await p.locator('#pgSimple .zh-pg-mid input').inputValue(), '8'); t.simple = 1;

    // 10. hide on single page, disabled
    assert.equal(await p.locator('#pgOne').isVisible(), false);
    await p.locator('#pgOneSeg [data-v="48"]').click(); assert.equal(await p.locator('#pgOne').isVisible(), true);
    assert.equal(await p.locator('#pgDisabled').getAttribute('aria-disabled'), 'true');
    assert.ok(await p.locator('#pgDisabled button:not([disabled])').count() === 0); t.hideDisabled = 1;

    // 11. load more + cursor
    assert.equal(await p.locator('#pgxMoreList li').count(), 6);
    await p.locator('#pgxMoreBtn').click(); assert.equal(await p.locator('#pgxMoreBtn').getAttribute('aria-busy'), 'true');
    await p.waitForFunction(() => document.querySelectorAll('#pgxMoreList li').length === 12);
    assert.match(await p.locator('#pgxMoreCount').innerText(), /已加载 12 \/ 86/);
    if (name === 'chromium') {
      for (let i = 0; i < 13; i++) { await p.waitForFunction(() => !document.getElementById('pgxMoreBtn').hasAttribute('aria-busy')); await p.locator('#pgxMoreBtn').click(); }
      await p.waitForFunction(() => document.querySelectorAll('#pgxMoreList li').length === 86);
      assert.equal(await p.locator('#pgxMoreBtn').isDisabled(), true); assert.equal(await p.locator('#pgxMoreBtn').innerText(), '没有更多了');
    }
    assert.equal(await p.locator('#pgxCurPrev').getAttribute('aria-disabled'), 'true');
    await p.locator('#pgxCurNext').click(); await p.waitForFunction(() => /第 2 页/.test(document.getElementById('pgxCurInfo').textContent));
    await p.locator('#pgxCurPrev').click(); await p.waitForFunction(() => /第 1 页/.test(document.getElementById('pgxCurInfo').textContent)); t.more = 1;

    // 12. a11y attributes
    assert.equal(await p.locator('#pgxMain').getAttribute('aria-label'), '文章列表分页');
    assert.equal(await p.locator('#pgxMain [data-p="1"]').getAttribute('aria-label'), '第 1 页');
    assert.equal(await p.locator('#pgxMain .zh-pg-sr').getAttribute('role'), 'status'); t.a11y = 1;

    // 13. phone: numbers collapse to "3 / 20", touch targets >= 44
    await p.goto('file://' + out + '?only=pagination&screen=phone'); await p.waitForTimeout(300);
    const ph = await p.evaluate(() => {
      const g = (s) => getComputedStyle(document.querySelector(s)).display, r = document.querySelector('#pgxMain .zh-pg-next').getBoundingClientRect();
      return { list: g('#pgxMain .zh-pg-list'), mid: g('#pgxMain .zh-pg-mid'), size: g('#pgxMain .zh-pg-size'), h: r.height, w: r.width, over: document.documentElement.scrollWidth - innerWidth };
    });
    assert.equal(ph.list, 'none'); assert.notEqual(ph.mid, 'none'); assert.equal(ph.size, 'none'); assert.ok(ph.h >= 43.5 && ph.w >= 43.5, `touch target ${ph.w}x${ph.h}`); assert.ok(ph.over <= 1); t.phone = 1;

    assert.deepEqual(errs, []);
    console.log('ok  ', JSON.stringify(t));
  } catch (e) { bad++; console.log('FAIL', name, e.message.split('\n')[0], JSON.stringify(t)); }
  await b.close();
}
process.exit(bad ? 1 : 0);
