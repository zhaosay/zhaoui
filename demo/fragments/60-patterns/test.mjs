// node demo/fragments/60-patterns/test.mjs  (covers 60-patterns, 61-spec and 62-governance)
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium, firefox, webkit } = createRequire('/tmp/pw/')('playwright');
execFileSync('node', [new URL('../../build.mjs', import.meta.url).pathname, '--out', '/tmp/zh-gov.html', '--only', '00-core,60-patterns,61-spec,62-governance'], { stdio: 'pipe' });
(async () => {
  let bad = 0;
  for (const [n, eng] of Object.entries({ chromium, firefox, webkit })) {
    const b = await eng.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    try {
      await p.goto('file:///tmp/zh-gov.html'); await p.waitForTimeout(400); const q = s => p.locator(s);
      // patterns
      assert.equal(await q('#patRows tr').count(), 7);
      await q('#patChips [data-f="ok"]').click(); assert.equal(await q('#patRows tr').count(), 3);
      assert.ok((await q('#patCount').textContent()).includes('3 / 7'));
      await q('#patTodo input').nth(1).check(); assert.equal(await q('#patProg').getAttribute('aria-valuenow'), '2');
      assert.ok(await q('#patBar').isHidden());
      await q('#patBatchRows input').nth(0).check(); await q('#patBatchRows input').nth(2).check();
      assert.ok((await q('#patBarN').textContent()).includes('2')); await q('[data-pat-bulk="delete"]').click();
      assert.equal(await q('#patBatchRows li').count(), 2); assert.ok(await q('#patBar').isHidden());
      await q('[data-pat-diff="again"]').click(); assert.ok((await q('#patNew').textContent()).includes('窗外雨声'));
      await q('[data-pat-diff="save"]').click(); assert.ok((await q('#patDiffState').textContent()).includes('已保存'));
      await q('#patFlow button').first().click(); assert.ok((await q('#patFlow li').first().textContent()).includes('处理中'));
      await q('#patTourReplay').click(); await p.waitForTimeout(300); assert.ok(await q('.zh-pat-tour').isVisible());
      await p.keyboard.press('Escape'); await p.waitForTimeout(300); assert.equal(await q('.zh-pat-tour').count(), 0);
      for (const [v, kind] of [[3, '.zh-pat-seg'], [8, '#patOptions select'], [14, '#patOptions input']]) { await q('#patN').fill(String(v)); assert.equal(await q(kind).count() > 0, true, 'n=' + v); }
      await q('#patN').fill('4'); await q('#patOptions [data-i="2"]').click(); assert.equal(await q('#patOptions [aria-checked="true"]').getAttribute('data-i'), '2');
      await q('#patOptions [aria-checked="true"]').press('ArrowRight'); assert.equal(await q('#patOptions [aria-checked="true"]').getAttribute('data-i'), '3');
      // spec
      assert.equal(await q('#bmBody tr').count(), 6); assert.equal(await q('#stBody tr').count(), 4);
      await q('#bmGroup button').nth(2).click(); assert.equal(await q('#bmGroup [aria-checked="true"]').textContent(), 'DOCX');
      await q('#bmSplitCaret').click(); await p.waitForTimeout(250); assert.equal(await q('[role=menuitem]').count(), 3);
      await q('[role=menuitem]').first().click(); await p.waitForTimeout(200); assert.equal(await q('[role=menuitem]').count(), 0);
      await q('#bmSubmit').click(); assert.ok(await q('#bmSum').isVisible()); assert.equal(await q('#bmPhone').getAttribute('aria-invalid'), 'true');
      assert.equal(await p.evaluate(() => document.activeElement.id), 'bmPhone');
      await q('#bmPhone').fill('123'); await q('#bmPhone').blur(); assert.ok((await q('#bmPhoneMsg').textContent()).includes('11 位'));
      await q('#bmPhone').fill('13800000000'); assert.equal(await q('#bmPhone').getAttribute('aria-invalid'), 'false');
      await q('#bmMail').fill('a@b.co'); await q('#bmSubmit').click(); await p.waitForTimeout(1200); assert.ok(await q('#bmSum').isHidden());
      // governance
      assert.equal(await q('#gvRules tr').count(), 4);
      assert.equal(await q('#gvRules .zh-gv-res.bad').count(), 0, 'default theme passes all colour rules');
      for (const brand of ['#f5c400', '#0f9d8a', '#e0407a', '#7c4dff']) { await p.evaluate(b => window.ZhaoUI.applyBrand(document.documentElement, b), brand); await p.waitForTimeout(200); assert.equal(await q('#gvRules .zh-gv-res.bad').count(), 0, 'brand ' + brand); }
      assert.ok((await q('#gvOut .zh-gv-hit').count()) >= 8);
      assert.ok((await q('#gvOut').textContent()).includes('--zh-radius-md') && (await q('#gvOut').textContent()).includes('--zh-z-sticky'));
      await q('#gvIn').fill('.a{color:var(--zh-text)}'); await q('#gvScan').click(); assert.ok((await q('#gvOut').textContent()).includes('全部使用 Token'));
      await q('#gvIn').fill('<img src=x onerror=alert(1)> #ff0000'); await q('#gvScan').click(); assert.equal(await q('#gvOut img').count(), 0, 'no injection');
      assert.equal(await q('#gvDd .pair').count(), 6);
      await q('#gvA11y input').nth(0).check(); await q('#gvA11y input').nth(1).check(); assert.equal(await q('#gvA11yN').textContent(), '2 / 12');
      assert.deepEqual(errs, []); console.log('ok  ', n);
    } catch (e) { bad++; console.log('FAIL', n, e.message.split('\n')[0], (e.stack.split('\n').find(l => l.includes('test.mjs')) || '').trim(), errs.join('|')); }
    await b.close();
  }
  process.exit(bad ? 1 : 0);
})();
