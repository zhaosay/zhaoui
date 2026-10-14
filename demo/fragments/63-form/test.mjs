// node demo/fragments/63-form/test.mjs
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium, firefox, webkit } = createRequire('/tmp/pw/')('playwright');
execFileSync('node', [new URL('../../build.mjs', import.meta.url).pathname, '--out', '/tmp/zh-glass.html', '--only', '00-core,63-form'], { stdio: 'pipe' });
(async () => { let bad = 0;
  for (const [n, eng] of Object.entries({ chromium, firefox, webkit })) {
    const b = await eng.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    try {
      await p.goto('file:///tmp/zh-glass.html?only=formexample'); await p.waitForTimeout(500); const q = s => p.locator(s);
      const setW = (w) => p.evaluate((w) => { const s = document.getElementById('fxWidth'); s.value = Math.min(w, +s.max); s.dispatchEvent(new Event('input', { bubbles: true })); }, w);
      const cols = async () => +(await q('#fxFrame').getAttribute('data-cols'));
      const c1 = await cols(); assert.ok(c1 >= 4, 'full width columns ' + c1);
      const seen = {}; for (const w of [1200, 900, 600, 420, 300]) { await setW(w); await p.waitForTimeout(80); seen[w] = await cols(); }
      assert.ok(seen[1200] >= seen[900] && seen[900] > seen[600] && seen[600] >= seen[420] && seen[420] >= seen[300] && seen[300] === 1, JSON.stringify(seen));
      assert.ok((await q('#fxReadout').textContent()).includes('1 列'));
      // no horizontal leak inside the form at any width
      for (const w of [300, 600, 1200]) { await setW(w); await p.waitForTimeout(80); assert.equal(await p.evaluate(() => { const f = document.getElementById('fxForm').getBoundingClientRect(); let o = 0; document.querySelectorAll('#fxForm *').forEach(e => { if (e.closest('textarea')) return; const r = e.getBoundingClientRect(); if (r.width && r.right > f.right + 1) o++; }); return o; }), 0, 'leak at ' + w); }
      await q('#fxFull').click();
      await q('#fxSubmit').click(); assert.ok(await q('#fxSummary').isVisible()); assert.ok((await q('#fxSummary').textContent()).includes('4 项'));
      assert.equal(await p.evaluate(() => document.activeElement.id), 'fxName');
      await q('#fxName').fill('机房中控'); await q('#fxCode').fill('ZH-12'); await q('#fxCode').blur(); assert.ok((await q('#fxCodeMsg').textContent()).includes('ZH-0001'));
      await q('#fxCode').fill('ZH-0012'); assert.equal(await q('#fxCode').getAttribute('aria-invalid'), 'false');
      await q('#fxOwner').fill('张三'); await q('#fxIp').fill('300.1.1.1'); await q('#fxIp').blur(); assert.ok((await q('#fxIpMsg').textContent()).includes('0–255'));
      await q('#fxIp').fill('192.168.1.10'); await q('#fxPort').fill('70000'); await q('#fxPort').blur(); assert.ok((await q('#fxPortMsg').textContent()).includes('1–65535'));
      await q('#fxPort').fill('8080');
      await q('#fxProto button').nth(1).click(); assert.equal(await q('#fxProto [aria-checked="true"]').textContent(), 'HTTP');
      await q('#fxProto [aria-checked="true"]').press('ArrowRight'); assert.equal(await q('#fxProto [aria-checked="true"]').textContent(), 'TCP');
      await q('#fxNote').fill('机柜 A3'); assert.ok((await q('#fxNoteMsg').textContent()).startsWith('5 /'));
      await q('#fxSubmit').click(); await p.waitForTimeout(1100);
      assert.ok(await q('#fxSummary').isHidden()); assert.ok(await q('#fxResultCard').isVisible());
      const r = JSON.parse(await q('#fxResult').textContent()); assert.equal(r.code, 'ZH-0012'); assert.equal(r.protocol, 'TCP'); assert.equal(r.port, 8080); assert.ok(r.channels.includes('邮件'));
      await q('#fxReset').click(); assert.equal(await q('#fxName').inputValue(), ''); assert.ok(await q('#fxResultCard').isHidden()); assert.equal(await q('#fxProto [aria-checked="true"]').textContent(), 'MQTT');
      assert.deepEqual(errs, []); console.log('ok  ', n, JSON.stringify(seen));
    } catch (e) { bad++; console.log('FAIL', n, e.message.split('\n')[0], (e.stack.split('\n').find(l => l.includes('test.mjs')) || '').trim(), errs.join('|')); }
    await b.close(); }
  process.exit(bad ? 1 : 0); })();
