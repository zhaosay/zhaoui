// Interaction tests for the input fragment in Chromium, Firefox and WebKit.   node test.mjs
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
  await p.goto('file:///tmp/zh-inputs.html?only=input'); await p.waitForTimeout(300);
  try {
    const val = (s) => p.locator(s).inputValue();
    const text = async (s) => (await p.locator(s).textContent()).trim();

    // clearable: shown when there is a value, click clears and refocuses, hides again
    const clr = p.locator('#ip-a1').locator('xpath=ancestor::span[contains(@class,"zh-inp-box")]').locator('.zh-inp-clear');
    assert.equal(await clr.isVisible(), true);
    await clr.click();
    assert.equal(await val('#ip-a1'), '');
    assert.equal(await p.evaluate(() => document.activeElement.id), 'ip-a1');
    assert.equal(await clr.isVisible(), false);
    await p.keyboard.type('a@b.co'); assert.equal(await clr.isVisible(), true);

    // password toggle
    const eye = p.locator('.zh-inp-eye');
    assert.equal(await p.locator('#ip-a2').getAttribute('type'), 'password');
    await eye.click();
    assert.equal(await p.locator('#ip-a2').getAttribute('type'), 'text');
    assert.equal(await eye.getAttribute('aria-pressed'), 'true');
    assert.equal(await eye.getAttribute('aria-label'), '隐藏密码');
    await eye.click(); assert.equal(await p.locator('#ip-a2').getAttribute('type'), 'password');

    // search: Enter submits, Esc clears
    await p.locator('#ip-a5').fill('设备'); await p.locator('#ip-a5').press('Enter');
    assert.match(await text('#ip-a5o'), /已搜索：“设备”/);
    await p.locator('#ip-a5').press('Escape'); assert.equal(await val('#ip-a5'), ''); assert.match(await text('#ip-a5o'), /尚未搜索/);

    // number stepper
    const N = '#ip-n1'; await p.locator(N).focus();
    await p.keyboard.press('ArrowUp'); assert.equal(await val(N), '4');
    await p.keyboard.press('Shift+ArrowUp'); assert.equal(await val(N), '10', 'clamped to max');
    assert.equal(await p.locator(N).getAttribute('aria-valuenow'), '10');
    assert.equal(await p.locator('.zh-num').first().locator('.zh-num-btn').nth(1).isDisabled(), true, 'plus disabled at max');
    await p.locator(N).fill('99'); await p.locator(N).blur(); assert.equal(await val(N), '10', 'out of range fixed on blur');
    await p.locator(N).fill('abc'); await p.locator(N).blur(); assert.equal(await val(N), '10', 'garbage reverts');
    const minus = p.locator('.zh-num').first().locator('.zh-num-btn').nth(0);
    await minus.scrollIntoViewIfNeeded(); const bx = await minus.boundingBox();
    await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await p.mouse.down(); await p.waitForTimeout(1300); await p.mouse.up();
    const held = Number(await val(N)); assert.ok(held <= 7, 'hold repeats, got ' + held);
    const after = await val(N); await p.waitForTimeout(300); assert.equal(await val(N), after, 'stops after release');
    await p.locator('#ip-n2').focus(); await p.keyboard.press('ArrowUp'); assert.equal(await val('#ip-n2'), '13.00', 'precision 2, step 0.5');

    // OTP
    const cells = p.locator('.zh-otp-cell');
    assert.equal(await cells.count(), 6);
    assert.equal(await cells.nth(0).getAttribute('autocomplete'), 'one-time-code');
    await cells.nth(0).focus(); await p.keyboard.type('12');
    assert.equal(await p.evaluate(() => [...document.querySelectorAll('.zh-otp-cell')].indexOf(document.activeElement)), 2, 'auto-advance');
    await p.keyboard.press('Backspace'); assert.equal(await cells.nth(1).inputValue(), '', 'backspace goes back and clears');
    await p.keyboard.type('x'); assert.equal(await cells.nth(1).inputValue(), '', 'non digits rejected');
    await p.locator('#otp-clear').click();
    const pasted = await p.evaluate(() => { try { const dt = new DataTransfer(); dt.setData('text/plain', '123 456'); const ev = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }); if (!ev.clipboardData || ev.clipboardData.getData('text/plain') !== '123 456') return false; document.querySelector('.zh-otp-cell').dispatchEvent(ev); return true; } catch (e) { return false; } });
    if (pasted) { assert.equal(await p.evaluate(() => [...document.querySelectorAll('.zh-otp-cell')].map((c) => c.value).join('')), '123456', 'paste splits digits'); await p.waitForTimeout(900); assert.equal(await p.locator('.zh-otp.is-ok').count(), 1); assert.match(await text('#otp-o'), /验证通过/); }
    else { await p.locator('#otp-clear').click(); await cells.nth(0).focus(); await p.keyboard.type('654321'); await p.waitForTimeout(900); assert.equal(await p.locator('.zh-otp.is-error').count(), 1); assert.match(await text('#otp-o'), /不正确/); }
    await p.locator('#otp-err').click(); assert.equal(await p.locator('.zh-otp.is-error').count(), 1);

    // textarea: hard limit, auto-grow with cap, soft limit
    const t1 = '#ip-t1', h0 = await p.locator(t1).evaluate((e) => e.offsetHeight);
    await p.locator(t1).fill(Array(20).fill('行').join('\n'));
    const h1 = await p.locator(t1).evaluate((e) => e.offsetHeight);
    assert.ok(h1 > h0, 'grows'); assert.ok(h1 < 20 * 20, 'capped at max rows');
    await p.locator(t1).fill('x'.repeat(200)); assert.equal((await val(t1)).length, 80, 'maxlength enforced');
    assert.equal(await text('#ip-t1 ~ .zh-ta-count'), '80 / 80');
    const soft = p.locator('.zh-ta[data-soft-max]');
    assert.equal(await soft.evaluate((e) => e.classList.contains('is-over')), true);
    assert.equal(await p.locator('#ip-t2').getAttribute('aria-invalid'), 'true');
    await p.locator('#ip-t2').fill('短文本');
    assert.equal(await soft.evaluate((e) => e.classList.contains('is-over')), false);
    assert.equal(await p.locator('#ip-t2').getAttribute('aria-invalid'), 'false');
    assert.match(await p.locator('.zh-inp-sr').textContent(), /恢复/);

    // field validation
    const v = '#ip-v1'; await p.locator(v).focus(); await p.locator(v).blur();
    assert.equal(await p.locator(v).getAttribute('aria-invalid'), 'true');
    assert.equal(await p.locator('#ip-v1e').isVisible(), true);
    assert.match(await p.locator(v).getAttribute('aria-describedby'), /ip-v1e/);
    await p.locator(v).fill('bad'); assert.match(await text('#ip-v1e'), /格式不正确/);
    await p.locator(v).fill('ok@example.com');
    assert.equal(await p.locator(v).getAttribute('aria-invalid'), 'false'); assert.equal(await p.locator('#ip-v1e').isVisible(), false);
    assert.equal(await p.locator('.zh-inp.is-success .zh-inp-status svg').count() >= 1, true);

    // inline edit
    const view = () => p.locator('.zh-edit-view');
    await view().click(); assert.equal(await p.evaluate(() => document.activeElement.tagName), 'INPUT');
    await p.locator('.zh-edit input').fill('新名称'); await p.keyboard.press('Enter');
    assert.equal(await text('.zh-edit-text'), '新名称'); assert.match(await text('#ed-o'), /已保存为“新名称”/);
    assert.equal(await p.evaluate(() => document.activeElement.className), 'zh-edit-view', 'focus returns');
    await p.keyboard.press('F2'); await p.keyboard.type('X'); await p.keyboard.press('Escape');
    assert.equal(await text('.zh-edit-text'), '新名称', 'Esc cancels');
    await view().click(); await p.locator('.zh-edit input').fill(''); await p.keyboard.press('Enter');
    assert.match(await text('#ed-o'), /不能为空/); assert.equal(await p.locator('.zh-edit .zh-inp.is-error').count(), 1);
    await p.mouse.click(5, 5); assert.equal(await text('.zh-edit-text'), '新名称', 'blur with empty reverts');

    assert.deepEqual(errs, []);
    console.log('ok  ', name + (pasted ? '' : ' (paste event not constructible; typed instead)'));
  } catch (e) { bad++; console.log('FAIL', name, e.message.split('\n').slice(0, 6).join(' | '), (String(e.stack).match(/test\.mjs:\d+/) || [])[0]); }
  await b.close();
}
process.exit(bad ? 1 : 0);
