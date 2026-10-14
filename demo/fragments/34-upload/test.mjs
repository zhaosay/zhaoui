// Interaction tests for the upload fragment in Chromium, Firefox and WebKit.   node test.mjs
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
const { chromium, firefox, webkit } = createRequire('/tmp/pw/')('playwright');
execFileSync('node', [new URL('../../build.mjs', import.meta.url).pathname, '--out', '/tmp/zh-inputs.html', '--only', '00-core,32-slider-rating,33-input,34-upload'], { stdio: 'ignore' });

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNkYPhfz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC', 'base64');
const f = (name, mime, buf) => ({ name, mimeType: mime, buffer: buf });
let bad = 0;
for (const [name, eng] of Object.entries({ chromium, firefox, webkit })) {
  const b = await eng.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file:///tmp/zh-inputs.html?only=upload'); await p.waitForTimeout(300);
  try {
    const setSpeed = (sel, v) => p.locator(sel).evaluate((e, v) => { e.dataset.speed = v; }, v);
    const L = '#up-list', C = '#up-cards', A = '#up-avatar';

    // ---- list: validation, escaping, upload, failure, retry ----
    await setSpeed(L, 60);
    await p.setInputFiles(L + ' .zh-upload-input', [f('a.png', 'image/png', png), f('big.pdf', 'application/pdf', Buffer.alloc(6 * 1048576)), f('x.exe', 'application/x-msdownload', Buffer.from('MZ')), f('fail-me.pdf', 'application/pdf', Buffer.alloc(2048)), f('<b>evil</b>.txt', 'text/plain', Buffer.from('hi'))]);
    assert.equal(await p.locator(L + ' .zh-upload-err').count(), 2, 'two files rejected');
    assert.match(await p.locator(L + ' .zh-upload-errors').textContent(), /big\.pdf：超过 5 MB/);
    assert.match(await p.locator(L + ' .zh-upload-errors').textContent(), /x\.exe：类型不支持/);
    assert.equal(await p.locator(L + ' .zh-upload-item').count(), 3);
    assert.equal(await p.locator(L + ' .zh-upload-name b').count(), 0, 'file name is escaped, not parsed as HTML');
    assert.ok((await p.locator(L + ' .zh-upload-name').allTextContents()).includes('<b>evil</b>.txt'));
    await p.waitForSelector(L + ' .zh-upload-item.is-error', { timeout: 6000 });
    await p.waitForFunction((s) => document.querySelectorAll(s + ' .zh-upload-item.is-done').length === 2, L, { timeout: 8000 });
    const failed = p.locator(L + ' .zh-upload-item.is-error');
    assert.match(await failed.locator('.zh-upload-status').textContent(), /上传失败/);
    assert.equal(await failed.locator('[data-act="retry"]').count(), 1);
    assert.match(await p.locator(L + ' .zh-upload-sr').textContent(), /上传/);
    await failed.locator('[data-act="retry"]').click();
    await p.waitForFunction((s) => document.querySelectorAll(s + ' .zh-upload-item.is-done').length === 3, L, { timeout: 8000 });
    assert.match(await p.locator(L + ' .zh-upload-count').textContent(), /已添加 3 \/ 5/);
    const bar = p.locator(L + ' .zh-upload-item').first().locator('.zh-upload-bar');
    assert.equal(await bar.getAttribute('role'), 'progressbar');

    // duplicate rejected; count limit enforced; remove works and moves focus somewhere sensible
    await p.setInputFiles(L + ' .zh-upload-input', [f('a.png', 'image/png', png)]);
    assert.match(await p.locator(L + ' .zh-upload-errors').textContent(), /已在列表中/);
    await p.setInputFiles(L + ' .zh-upload-input', ['1', '2', '3', '4'].map((n) => f(`n${n}.txt`, 'text/plain', Buffer.from(n))));
    assert.equal(await p.locator(L + ' .zh-upload-item').count(), 5, 'capped at max');
    assert.match(await p.locator(L + ' .zh-upload-errors').textContent(), /已达上限/);
    await p.locator(L + ' .zh-upload-item').first().locator('[data-act="remove"]').click();
    assert.equal(await p.locator(L + ' .zh-upload-item').count(), 4);

    // cancel while uploading
    await setSpeed(L, 0.02);
    await p.setInputFiles(L + ' .zh-upload-input', [f('slow.pdf', 'application/pdf', Buffer.alloc(4096))]);
    const slow = p.locator(L + ' .zh-upload-item', { hasText: 'slow.pdf' });
    await p.waitForTimeout(400);
    assert.match(await slow.locator('.zh-upload-status').textContent(), /上传中/);
    await slow.locator('[data-act="cancel"]').click();
    assert.equal(await p.locator(L + ' .zh-upload-item', { hasText: 'slow.pdf' }).count(), 0);
    assert.match(await p.locator(L + ' .zh-upload-sr').textContent(), /已取消/);

    // keyboard opens the picker
    await p.locator(L + ' .zh-upload-drop').focus();
    const [chooser] = await Promise.all([p.waitForEvent('filechooser'), p.keyboard.press('Enter')]);
    assert.equal(chooser.isMultiple(), true);

    // drag over highlights, drop adds
    await setSpeed(L, 60);
    await p.locator(L + ' .zh-upload-item [data-act="remove"]').first().click();
    const dragged = await p.evaluate((sel) => {
      const drop = document.querySelector(sel + ' .zh-upload-drop'); const dt = new DataTransfer(); dt.items.add(new File(['dropped'], 'dropped.txt', { type: 'text/plain' }));
      drop.dispatchEvent(new DragEvent('dragenter', { dataTransfer: dt, bubbles: true, cancelable: true }));
      const over = drop.classList.contains('is-over');
      drop.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
      return { over, after: drop.classList.contains('is-over'), added: [...document.querySelectorAll(sel + ' .zh-upload-name')].some((n) => n.textContent === 'dropped.txt') };
    }, L);
    assert.equal(dragged.over, true, 'highlight on drag'); assert.equal(dragged.after, false, 'highlight removed on drop'); assert.equal(dragged.added, true, 'dropped file listed');

    // ---- picture cards ----
    await p.evaluate(() => { window.__revoked = 0; const r = URL.revokeObjectURL.bind(URL); URL.revokeObjectURL = (u) => { window.__revoked++; r(u); }; });
    await setSpeed(C, 60);
    await p.setInputFiles(C + ' .zh-upload-input', [f('p1.png', 'image/png', png), f('p2.png', 'image/png', png), f('doc.zip', 'application/zip', Buffer.alloc(1000))]);
    assert.match(await p.locator(C + ' .zh-upload-errors').textContent(), /doc\.zip：类型不支持/);
    await p.waitForFunction((s) => document.querySelectorAll(s + ' .zh-upload-card.is-done').length === 2, C, { timeout: 8000 });
    assert.match(await p.locator(C + ' .zh-upload-card img').first().getAttribute('src'), /^blob:/);
    await p.locator(C + ' .zh-upload-card').first().hover();
    await p.locator(C + ' .zh-upload-card').first().locator('[data-act="preview"]').click();
    assert.equal(await p.locator('dialog.zh-upload-pv[open]').count(), 1);
    assert.equal(await p.locator('dialog.zh-upload-pv img').getAttribute('alt'), 'p1.png');
    await p.keyboard.press('Escape');
    assert.equal(await p.locator('dialog.zh-upload-pv[open]').count(), 0, 'Esc closes preview');
    assert.equal(await p.evaluate(() => document.activeElement.getAttribute('data-act')), 'preview', 'focus returns to the trigger');
    const before = await p.evaluate(() => window.__revoked);
    await p.locator(C + ' .zh-upload-card').first().hover();
    await p.locator(C + ' .zh-upload-card').first().locator('[data-act="remove"]').click();
    assert.equal(await p.locator(C + ' .zh-upload-card').count(), 1);
    assert.equal(await p.evaluate(() => window.__revoked), before + 1, 'object URL revoked on delete');

    // ---- avatar ----
    await setSpeed(A, 60);
    await p.setInputFiles(A + ' .zh-upload-input', [f('me.png', 'image/png', png)]);
    await p.waitForSelector(A + ' .zh-upload-avatar img');
    assert.equal(await p.locator(A + ' [data-act="remove"]').isVisible(), true);
    await p.setInputFiles(A + ' .zh-upload-input', [f('huge.png', 'image/png', Buffer.alloc(3 * 1048576))]);
    assert.match(await p.locator(A + ' .zh-upload-errors').textContent(), /超过 2 MB/);
    assert.equal(await p.locator(A + ' .zh-upload-avatar img').count(), 1, 'previous avatar kept after a rejected file');
    await p.locator(A + ' [data-act="remove"]').click();
    assert.equal(await p.locator(A + ' .zh-upload-avatar img').count(), 0);
    assert.equal(await p.locator(A + ' [data-act="remove"]').isVisible(), false);

    // ---- directory + disabled ----
    const dir = join(mkdtempSync(join(tmpdir(), 'zhup-')), 'my-folder'); mkdirSync(dir);
    writeFileSync(join(dir, 'a.txt'), 'aa'); writeFileSync(join(dir, 'b.txt'), 'bbbb');
    await p.setInputFiles('#up-dir', dir);
    assert.match(await p.locator('#up-dirout').textContent(), new RegExp('已选择 2 个文件，共 6 B（文件夹“my-folder”）'));
    assert.equal(await p.locator('#up-dirlist li').count(), 2);
    assert.match(await p.locator('#up-dirlist li').first().textContent(), /^my-folder\//);
    const dis = p.locator('.zh-upload.is-disabled .zh-upload-drop');
    assert.equal(await dis.getAttribute('aria-disabled'), 'true'); assert.equal(await dis.getAttribute('tabindex'), '-1');

    assert.deepEqual(errs, []);
    console.log('ok  ', name);
  } catch (e) { bad++; console.log('FAIL', name, e.message.split('\n').slice(0, 5).join(' | '), (String(e.stack).match(/test\.mjs:\d+/) || [])[0]); }
  await b.close();
}
process.exit(bad ? 1 : 0);
