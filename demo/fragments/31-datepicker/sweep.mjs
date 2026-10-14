// Sweep both fragments over engine x width x audience x mode x density: no page overflow, no errors, popups stay on screen.
//   node demo/build.mjs --out /tmp/zh-dropdown.html --only 00-core,30-dropdown,31-datepicker && node demo/fragments/31-datepicker/sweep.mjs
import { createRequire } from 'node:module';
const { chromium, firefox, webkit } = createRequire('/tmp/pw/')('playwright');
const FILE = process.env.ZH_TEST_FILE || '/tmp/zh-dropdown.html';
let bad = 0, n = 0;
const POPUPS = {
  dropdown: [['#ddBasic', 'menu'], ['[data-sel=multi] input', 'multi select'], ['[data-sel=search] input', 'search select'], ['[data-cas=click] input', 'cascader'], ['[data-cas=hover] input', 'cascader (hover)']],
  datepicker: [['[data-dp=basic] input', 'date'], ['[data-dp=range] .zh-dp-rin', 'range'], ['[data-tp=hms] input', 'time'], ['[data-dp=datetime] input', 'date-time']]
};
for (const [name, eng] of Object.entries({ chromium, firefox, webkit })) {
  const b = await eng.launch();
  for (const vw of [390, 820, 1440]) {
    const p = await b.newPage({ viewport: { width: vw, height: 900 } });
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    for (const aud of ['b', 'c']) for (const mode of ['light', 'dark']) for (const den of ['compact', 'standard', 'comfortable']) {
      for (const sec of ['dropdown', 'datepicker']) {
        n++;
        const label = `${name} ${vw}px ${aud}/${mode}/${den} ${sec}`;
        await p.goto(`file://${FILE}?only=${sec}&audience=${aud}&mode=${mode}&density=${den}`); await p.waitForTimeout(150);
        const fail = (m) => { bad++; console.log('FAIL', label, m); };
        if (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) > 1) fail('page overflow');
        for (const [sel, what] of POPUPS[sec]) {
          try {
            const el = p.locator(sel).first(); await el.scrollIntoViewIfNeeded(); await el.click({ timeout: 4000 }); await p.waitForTimeout(260);
            const bb = await p.locator('#zhLayer .zh-pop.is-open').last().boundingBox();
            if (!bb) fail(what + ': popup did not open');
            else {
              if (bb.x < -1 || bb.x + bb.width > vw + 1) fail(`${what}: popup outside viewport x=${Math.round(bb.x)} w=${Math.round(bb.width)}`);
              if (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) > 1) fail(what + ': page overflow with popup open');
            }
            await p.keyboard.press('Escape'); await p.waitForTimeout(200); await p.mouse.click(2, 2); await p.waitForTimeout(120);
          } catch (e) { fail(what + ': ' + e.message.split('\n')[0]); }
        }
        if (errs.length) { fail('page errors: ' + errs.join('|')); errs.length = 0; }
      }
    }
    await p.close();
  }
  await b.close(); console.log(name, 'swept');
}
console.log(`${n} page loads, failures: ${bad}`);
process.exit(bad ? 1 : 0);
