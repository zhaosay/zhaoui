// Sweep the four sections over engine x width x audience x mode x density; checks overflow, page errors, zoomed slider maths.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const { chromium, firefox, webkit } = createRequire('/tmp/pw/')('playwright');
execFileSync('node', [new URL('../../build.mjs', import.meta.url).pathname, '--out', '/tmp/zh-inputs.html', '--only', '00-core,32-slider-rating,33-input,34-upload'], { stdio: 'ignore' });

let n = 0, bad = 0;
for (const [name, eng] of Object.entries({ chromium, firefox, webkit })) {
  const b = await eng.launch();
  for (const w of [390, 820, 1440]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    const combos = [];
    for (const a of ['b', 'c']) for (const m of ['light', 'dark']) for (const d of ['compact', 'standard', 'comfortable']) combos.push(`audience=${a}&mode=${m}&density=${d}`);
    if (w === 1440) combos.push('screen=phone', 'screen=tablet', 'screen=large', 'screen=wall');
    for (const q of combos) {
      n++; errs.length = 0;
      await p.goto('file:///tmp/zh-inputs.html?' + q); await p.waitForTimeout(200);
      const r = await p.evaluate(() => {
        const secs = ['slider', 'rating', 'input', 'upload'].map((id) => document.getElementById(id));
        const st = document.querySelector('.stage').getBoundingClientRect();
        const spill = [];
        secs.forEach((s) => s.querySelectorAll('*').forEach((e) => { if (e.closest('.matrix-wrap,.zh-slider-tip,.zh-pop')) return; const r = e.getBoundingClientRect(); if (r.width && r.right > st.right + 1.5 && spill.length < 3) spill.push(e.className && e.className.baseVal === undefined ? e.className : e.tagName); }));
        return { over: document.documentElement.scrollWidth - innerWidth, spill, sections: secs.every(Boolean) };
      });
      if (r.over > 1 || errs.length || !r.sections || r.spill.length) { bad++; console.log('FAIL', name, w, q, JSON.stringify(r), errs.join('|')); }
    }
    await p.close();
  }
  // zoomed preview: pointer maths must still land on the right value
  const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
  await p.goto('file:///tmp/zh-inputs.html?screen=large&only=slider'); await p.waitForTimeout(300);
  const S = '.zh-slider[data-label="音量"]';
  const zoom = await p.evaluate(() => getComputedStyle(document.getElementById('stage')).zoom);
  const rail = await p.locator(S + ' .zh-slider-rail').boundingBox();
  await p.mouse.click(rail.x + rail.width * 0.25, rail.y + rail.height / 2);
  const v = Number(await p.locator(S + ' .zh-slider-thumb').getAttribute('aria-valuenow'));
  n++; if (Math.abs(v - 25) > 3) { bad++; console.log('FAIL', name, 'zoom', zoom, 'click at 25% gave', v); } else console.log('ok  ', name, 'zoomed slider (zoom ' + zoom + ') click at 25% ->', v);
  await p.close(); await b.close();
}
console.log('checked', n, 'cases, failures:', bad);
process.exit(bad ? 1 : 0);
