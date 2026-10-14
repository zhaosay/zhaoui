// Sweep both sections over audience x mode x density x width (+ large/wall previews); node demo/fragments/50-navigation/sweep.mjs
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const { chromium, firefox, webkit } = createRequire('/tmp/pw/')('playwright');
const root = new URL('../../../', import.meta.url).pathname;
const out = '/tmp/zh-navigation-sweep.html';
execFileSync('node', [root + 'demo/build.mjs', '--out', out, '--only', '00-core,50-navigation,51-pagination'], { stdio: 'pipe' });
let bad = 0, n = 0;
for (const [name, eng] of Object.entries({ chromium, firefox, webkit })) {
  if (process.env.ONLY && process.env.ONLY !== name) continue;
  const b = await eng.launch();
  for (const w of [390, 820, 1440]) {
    const p = await b.newPage({ viewport: { width: w, height: 800 } });
    const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    const cases = [];
    for (const only of ['navigation', 'pagination']) for (const a of ['b', 'c']) for (const m of ['light', 'dark']) for (const d of ['compact', 'standard', 'comfortable']) cases.push(`only=${only}&audience=${a}&mode=${m}&density=${d}&screen=auto`);
    if (w === 1440) for (const only of ['navigation', 'pagination']) for (const s of ['large', 'wall', 'phone', 'tablet']) cases.push(`only=${only}&screen=${s}`);
    for (const q of cases) {
      n++; errs.length = 0;
      await p.goto('file://' + out + '?' + q); await p.waitForTimeout(w === 1440 ? 350 : 450);
      const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (over > 1 || errs.length) { bad++; console.log('FAIL', name, w, q, 'overflow', over, errs.slice(0, 2).join(' | ')); }
    }
    await p.close();
  }
  await b.close();
}
console.log(`swept ${n} pages, failures: ${bad}`);
process.exit(bad ? 1 : 0);
