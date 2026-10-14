// node demo/fragments/45-stream/test.mjs — interaction tests for stream loading in Chromium, Firefox and WebKit
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium, firefox, webkit } = createRequire('/tmp/pw/')('playwright');
const OUT = '/tmp/zh-stream-test.html';
execFileSync('node', [new URL('../../build.mjs', import.meta.url).pathname, '--out', OUT, '--only', '00-core,45-stream']);

const engines = process.env.TLT_ONLY ? { [process.env.TLT_ONLY]: { chromium, firefox, webkit }[process.env.TLT_ONLY] } : { chromium, firefox, webkit };
let bad = 0;
for (const [name, eng] of Object.entries(engines)) {
  const b = await eng.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + OUT + '?only=stream'); await p.waitForTimeout(300);
  let engBad = 0;
  const step = async (label, fn) => { try { await fn(); } catch (e) { bad++; engBad++; console.log('  FAIL', name, label, '-', String(e.message).split('\n').slice(0, 4).join(' | ')); } };
  const count = (sel) => p.locator(sel).count();
  const txt = (sel) => p.textContent(sel);

  await step('infinite scroll: auto load, failure, retry, end', async () => {
    await p.waitForFunction(() => document.querySelectorAll('#zhInfList .zh-inf-item').length === 8, null, { timeout: 4000 });
    assert.equal(await p.getAttribute('#zhInfBox', 'aria-busy'), 'false');
    const scrollEnd = () => p.evaluate(() => { const e = document.getElementById('zhInfBox'); e.scrollTop = e.scrollHeight; });
    await scrollEnd(); await p.waitForFunction(() => document.querySelectorAll('#zhInfList .zh-inf-item').length === 16, null, { timeout: 4000 });
    assert.match(await txt('#zhInfStatus'), /已加载 16 条，第 2 \/ 5 页/);
    const before = await p.evaluate(() => document.getElementById('zhInfBox').scrollTop);
    await scrollEnd(); await p.waitForSelector('#zhInfFoot [data-retry]', { timeout: 4000 });
    assert.equal(await count('#zhInfList .zh-inf-item'), 16, 'failure keeps loaded items');
    assert.equal(await count('#zhInfFoot [role="alert"]'), 1);
    assert.match(await txt('#zhInfStatus'), /失败/);
    await p.click('#zhInfFoot [data-retry]');
    await p.waitForFunction(() => document.querySelectorAll('#zhInfList .zh-inf-item').length === 24, null, { timeout: 4000 });
    for (let i = 0; i < 6 && (await count('#zhInfFoot .zh-inf-end')) === 0; i++) { await scrollEnd(); await p.waitForTimeout(900); }
    assert.equal(await count('#zhInfList .zh-inf-item'), 40); assert.match(await txt('#zhInfFoot'), /已经到底了/);
    const n = await count('#zhInfList .zh-inf-item'); await scrollEnd(); await p.waitForTimeout(900); assert.equal(await count('#zhInfList .zh-inf-item'), n, 'no more requests after the end');
    await p.click('#zhInfReset'); await p.waitForFunction(() => document.querySelectorAll('#zhInfList .zh-inf-item').length === 8, null, { timeout: 4000 });
    assert.equal(await p.evaluate(() => document.getElementById('zhInfBox').scrollTop), 0);
  });

  await step('load-more button: busy state, focus, end', async () => {
    assert.equal(await count('#zhMoreList .zh-inf-item'), 5);
    await p.click('[data-more]');
    assert.equal(await p.getAttribute('[data-more]', 'aria-busy'), 'true'); assert.equal(await p.locator('[data-more]').isDisabled(), true);
    await p.waitForFunction(() => document.querySelectorAll('#zhMoreList .zh-inf-item').length === 10, null, { timeout: 3000 });
    assert.equal(await p.evaluate(() => document.activeElement.getAttribute('data-n')), '6', 'focus moves to the first new item');
    await p.click('[data-more]'); await p.waitForFunction(() => document.querySelectorAll('#zhMoreList .zh-inf-item').length === 15, null, { timeout: 3000 });
    await p.click('[data-more]'); await p.waitForFunction(() => document.querySelectorAll('#zhMoreList .zh-inf-item').length === 17, null, { timeout: 3000 });
    assert.equal(await count('[data-more]'), 0); assert.match(await txt('#zhMoreFoot'), /没有更多了，共 17 条/);
  });

  await step('long list: content-visibility toggle', async () => {
    assert.equal(await count('#zhLngList .zh-lng-item'), 2000); assert.match(await txt('#zhLngStat'), /2,000 行/);
    const cv = () => p.evaluate(() => getComputedStyle(document.querySelector('.zh-lng-item')).contentVisibility);
    const on = await cv(); await p.uncheck('#zhLngCv'); const off = await cv();
    assert.ok(off === 'visible', 'off -> ' + off); assert.ok(on === 'auto' || on === 'visible', 'engine without support keeps visible: ' + on);
    await p.check('#zhLngCv');
  });

  await step('AI stream: start, stop, resume, finish, markdown', async () => {
    assert.match(await txt('#zhAiState'), /空闲/);
    await p.click('#zhAiSpeed [data-v="12"]'); await p.click('#zhAiGo');
    assert.match(await txt('#zhAiState'), /生成中/); assert.equal(await p.getAttribute('#zhAiBody', 'aria-busy'), 'true');
    assert.match(await txt('#zhAiGo'), /停止/); assert.equal(await count('.zh-ai-cursor'), 1);
    await p.waitForTimeout(500); await p.click('#zhAiGo');
    assert.match(await txt('#zhAiState'), /已停止/); assert.equal(await p.getAttribute('#zhAiBody', 'aria-busy'), 'false');
    const len1 = (await txt('#zhAiMd')).length; assert.ok(len1 > 5);
    assert.equal(await count('.zh-ai-cursor'), 0); assert.equal(await count('#zhAiMd [data-ai="resume"]'), 1);
    assert.match(await txt('#zhAiGo'), /继续生成/); assert.equal(await p.locator('#zhAiCopy').isDisabled(), false);
    await p.click('#zhAiMd [data-ai="resume"]'); await p.waitForFunction(() => /已完成/.test(document.getElementById('zhAiState').textContent), null, { timeout: 8000 });
    assert.ok((await txt('#zhAiMd')).length > len1);
    assert.equal(await count('#zhAiMd .zh-ai-h[role="heading"]'), 2); assert.equal(await count('#zhAiMd ol > li'), 3); assert.equal(await count('#zhAiMd ul > li'), 4);
    assert.match(await txt('#zhAiMd .zh-ai-code pre'), /--zh-color-primary: #5868ee;/); assert.equal(await count('#zhAiMd code'), 2, 'one inline code + one code block');
    assert.match(await txt('#zhAiLive'), /生成完成/);
    await p.click('#zhAiCopy'); await p.waitForSelector('.zh-message'); assert.match(await txt('.zh-message'), /已复制|复制失败/);
    await p.click('#zhAiRe'); await p.waitForTimeout(250); assert.match(await txt('#zhAiState'), /生成中/); await p.click('#zhAiGo');
  });

  await step('AI stream: scroll pinning + jump to latest', async () => {
    await p.click('#zhAiSpeed [data-v="70"]'); await p.click('#zhAiRe'); await p.waitForFunction(() => document.getElementById('zhAiBody').scrollHeight > document.getElementById('zhAiBody').clientHeight + 260, null, { timeout: 20000 });
    const pinned = await p.evaluate(() => { const e = document.getElementById('zhAiBody'); return e.scrollHeight - e.scrollTop - e.clientHeight < 30; });
    assert.ok(pinned, 'follows while at the bottom');
    await p.locator('#zhAiBody').hover(); await p.mouse.wheel(0, -6000); await p.waitForTimeout(400);
    const gap = await p.evaluate(() => { const e = document.getElementById('zhAiBody'); return e.scrollHeight - e.scrollTop - e.clientHeight; }); assert.ok(gap > 100, 'not dragged back down while reading, gap ' + gap);
    assert.equal(await p.locator('#zhAiJump').isVisible(), true, 'jump button offered');
    await p.click('#zhAiJump'); assert.equal(await p.locator('#zhAiJump').isVisible(), false);
    assert.ok(await p.evaluate(() => { const e = document.getElementById('zhAiBody'); return e.scrollHeight - e.scrollTop - e.clientHeight < 30; }));
    await p.click('#zhAiGo'); await p.waitForTimeout(100);
  });

  await step('AI stream: simulated disconnect keeps content and can continue', async () => {
    await p.click('#zhAiSpeed [data-v="12"]'); await p.check('#zhAiErr'); await p.click('#zhAiRe');
    await p.waitForFunction(() => /连接中断/.test(document.getElementById('zhAiState').textContent), null, { timeout: 8000 });
    const kept = (await txt('#zhAiMd')).length; assert.ok(kept > 100); assert.match(await txt('#zhAiLive'), /连接中断/);
    await p.click('#zhAiGo'); await p.waitForFunction(() => /已完成/.test(document.getElementById('zhAiState').textContent), null, { timeout: 8000 });
    assert.ok((await txt('#zhAiMd')).length > kept); await p.uncheck('#zhAiErr');
  });

  await step('AI stream: renderer escapes everything, reduced motion stops the blink', async () => {
    const out = await p.evaluate(() => window.ZHStream.md('<img src=x onerror=alert(1)> **b**\n```html\n<script>alert(1)</script>\n'));
    assert.ok(!/<img|<script/i.test(out), out); assert.match(out, /&lt;img/); assert.match(out, /&lt;script&gt;/); assert.match(out, /<strong>b<\/strong>/);
    await p.emulateMedia({ reducedMotion: 'reduce' });
    try {
      await p.click('#zhAiRe'); await p.waitForSelector('.zh-ai-cursor');
      assert.equal(await p.evaluate(() => getComputedStyle(document.querySelector('.zh-ai-cursor')).animationName), 'none', 'cursor stops blinking');
      await p.waitForTimeout(150);
      assert.equal(await p.evaluate(() => getComputedStyle(document.querySelector('.zh-ai-cursor')).visibility), 'visible', 'cursor stays solid');
      await p.click('#zhAiGo');
    } finally { await p.emulateMedia({ reducedMotion: 'no-preference' }); }
  });

  await step('log tail: live, pause, filter, cap, pinning', async () => {
    const lines = () => count('#zhLogBox .zh-log-line');
    const a = await lines(); await p.waitForFunction((n) => document.querySelectorAll('#zhLogBox .zh-log-line').length > n, a, { timeout: 4000 });
    await p.click('#zhLogPause'); assert.equal(await p.getAttribute('#zhLogPause', 'aria-pressed'), 'true');
    const frozen = await lines(); await p.waitForTimeout(1200); assert.equal(await lines(), frozen, 'paused: DOM unchanged'); assert.match(await txt('#zhLogStat'), /已暂停，新增 [1-9]/);
    await p.click('#zhLogPause'); assert.ok((await lines()) > frozen, 'resume flushes missed lines');
    await p.evaluate(() => window.ZHStream.logPush(150));
    await p.click('#zhLogFilter [data-v="error"]');
    const kinds = await p.$$eval('#zhLogBox .zh-log-line', (l) => l.map((x) => x.className)); assert.ok(kinds.length && kinds.every((c) => /is-error/.test(c)), 'only errors: ' + kinds.length);
    assert.ok((await p.$$eval('#zhLogBox .zh-log-lv', (l) => l.map((x) => x.textContent))).every((t) => /ERROR/.test(t)), 'level text present, not colour only');
    await p.click('#zhLogFilter [data-v="all"]');
    await p.evaluate(() => window.ZHStream.logPush(260)); await p.waitForTimeout(100);
    assert.ok((await lines()) <= 200, 'capped at 200'); assert.match(await txt('#zhLogBox .zh-log-cut'), /已截断较早的 \d+ 行/);
    await p.locator('#zhLogBox').hover(); await p.mouse.wheel(0, -1400); await p.waitForTimeout(400);
    const topId = () => p.evaluate(() => { const box = document.getElementById('zhLogBox'), t = box.getBoundingClientRect().top; const l = [...box.querySelectorAll('.zh-log-line')].find((x) => x.getBoundingClientRect().bottom > t + 4); return l && l.getAttribute('data-id'); });
    const readId = await topId();
    await p.evaluate(() => window.ZHStream.logPush(30)); await p.waitForTimeout(100);
    assert.equal(await p.locator('#zhLogJump').isVisible(), true, 'jump offered while reading');
    assert.equal(await topId(), readId, 'the line being read stays in place while new lines arrive and old ones are trimmed');
    await p.click('#zhLogJump'); assert.equal(await p.locator('#zhLogJump').isVisible(), false);
    await p.click('#zhLogClear'); assert.equal(await lines(), 0);
  });

  await step('progressive reveal: skeleton then staggered rows', async () => {
    await p.click('#zhProgGo'); assert.equal(await p.getAttribute('#zhProgList', 'aria-busy'), 'true'); assert.equal(await count('#zhProgList .zh-skeleton') > 5, true);
    await p.waitForFunction(() => document.querySelectorAll('#zhProgList .zh-prog-row').length === 6, null, { timeout: 3000 });
    assert.equal(await p.getAttribute('#zhProgList', 'aria-busy'), 'false');
    const d = await p.$$eval('#zhProgList .zh-prog-row', (r) => r.map((x) => parseFloat(getComputedStyle(x).animationDelay)));
    assert.ok(d[5] > d[0] && d[3] > d[1], 'stagger: ' + d.map((x) => x.toFixed(2)).join());
  });

  await step('optimistic append: sending, done, failure, retry, delete', async () => {
    await p.fill('#zhOptIn', '第一条'); await p.press('#zhOptIn', 'Enter');
    const msg = p.locator('#zhOptList .zh-opt-msg', { hasText: '第一条' });
    assert.equal(await msg.count(), 1); assert.match(await msg.getAttribute('class'), /is-sending/); assert.match(await msg.locator('.zh-opt-st').textContent(), /发送中/);
    await p.waitForFunction(() => [...document.querySelectorAll('#zhOptList .zh-opt-msg')].some((m) => /第一条/.test(m.textContent) && /已发送/.test(m.textContent)), null, { timeout: 3000 });
    await p.check('#zhOptFail'); await p.fill('#zhOptIn', '会失败'); await p.click('#zhOptSend');
    const bad2 = p.locator('#zhOptList .zh-opt-msg', { hasText: '会失败' });
    await p.waitForFunction(() => [...document.querySelectorAll('#zhOptList .zh-opt-msg')].some((m) => /会失败/.test(m.textContent) && /发送失败/.test(m.textContent)), null, { timeout: 3000 });
    assert.equal(await p.isChecked('#zhOptFail'), false, 'failure flag is one-shot'); assert.match(await bad2.getAttribute('class'), /is-error/);
    await bad2.locator('[data-act="retry"]').click();
    await p.waitForFunction(() => [...document.querySelectorAll('#zhOptList .zh-opt-msg')].some((m) => /会失败/.test(m.textContent) && /已发送/.test(m.textContent)), null, { timeout: 3000 });
    await p.check('#zhOptFail'); await p.fill('#zhOptIn', '要删除'); await p.click('#zhOptSend');
    const del = p.locator('#zhOptList .zh-opt-msg', { hasText: '要删除' });
    await p.waitForFunction(() => [...document.querySelectorAll('#zhOptList .zh-opt-msg')].some((m) => /要删除/.test(m.textContent) && /发送失败/.test(m.textContent)), null, { timeout: 3000 });
    await del.locator('[data-act="del"]').click(); assert.equal(await del.count(), 0);
    await p.fill('#zhOptIn', '<b>x</b>'); await p.press('#zhOptIn', 'Enter'); assert.equal(await count('#zhOptList b'), 0, 'user text is never parsed as HTML');
  });

  assert.deepEqual(errs, [], name + ' page errors');
  console.log(engBad ? 'FAILED' : 'ok  ', name);
  await b.close();
}
process.exit(bad ? 1 : 0);
