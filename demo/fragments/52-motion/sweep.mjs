// Overflow + error sweep for #animation and #utilities.  node demo/fragments/52-motion/sweep.mjs
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const { chromium, firefox, webkit } = createRequire('/tmp/pw/')('playwright');
const out = '/tmp/zh-sweep.html';
execFileSync('node', [new URL('../../build.mjs', import.meta.url).pathname, '--out', out, '--only', '00-core,52-motion,53-utilities'], { stdio: 'pipe' });
let total = 0, bad = 0;
const full = { audience: ['b', 'c'], mode: ['light', 'dark'], density: ['compact', 'standard', 'comfortable'], widths: [390, 820, 1440] };
const light = { audience: ['b', 'c'], mode: ['light', 'dark'], density: ['standard'], widths: [390, 820, 1440] };
for (const [name, eng, set] of [['chromium', chromium, full], ['firefox', firefox, light], ['webkit', webkit, light]]) {
  const b = await eng.launch();
  for (const w of set.widths) {
    const p = await b.newPage({ viewport: { width: w, height: 800 } });
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    for (const only of ['animation', 'utilities']) for (const a of set.audience) for (const m of set.mode) for (const d of set.density) {
      total++;
      await p.goto(`file://${out}?only=${only}&audience=${a}&mode=${m}&density=${d}&screen=auto`);
      await p.waitForTimeout(120);
      const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      // anything inside the stage that sticks out of its card (not inside an intentionally scrolling box)?
      const leak = await p.evaluate(() => {
        const st = document.getElementById('stage').getBoundingClientRect(), bad = [];
        document.querySelectorAll('#stage *').forEach((e) => {
          if (bad.length > 2 || e.closest('.matrix-wrap, .zh-mo-scroller, .zh-mo-code, .zh-ut-snap, .zh-tabs, pre, svg, [hidden]')) return;
          const r = e.getBoundingClientRect(); if (r.width && r.right > st.right + 1) bad.push(e.className || e.tagName);
        });
        return bad;
      });
      if (over > 1 || errs.length || leak.length) { bad++; console.log('FAIL', name, w, only, a, m, d, 'over', over, leak.join(','), errs.join('|')); errs.length = 0; }
    }
    await p.close();
  }
  await b.close();
}
console.log('swept', total, 'pages, failures:', bad);
process.exit(bad ? 1 : 0);
