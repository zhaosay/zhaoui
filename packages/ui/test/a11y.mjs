// Accessibility audit of docs/gallery.html with axe-core, in light, dark and the C-end theme.  Fails on any violation except `heading-order`
// (the gallery drops each example, with its own headings, under an h2 of its own).  Needs axe-core next to Playwright: npm i axe-core in $PW_DIR.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadPlaywright, launch, fileUrl, resolveNearPlaywright } from './env.mjs';
const axePath = resolveNearPlaywright('axe-core/axe.min.js');
if (!axePath) {
  // a missing audit must not look like a passing one: it is only skipped when you ask for it
  if (process.env.ZH_SKIP_AXE === '1') { console.log('skip [a11y]: ZH_SKIP_AXE=1'); process.exit(0); }
  console.log('FAILED [a11y]: axe-core is not installed (npm install at the repository root; set ZH_SKIP_AXE=1 to skip on purpose)'); process.exit(1);
}
const axe = readFileSync(axePath, 'utf8'), pw = loadPlaywright(), b = await launch(pw, 'chromium');
const page = fileUrl(join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'gallery.html'));
const IGNORE = new Set(['heading-order']);
let bad = 0;
for (const [mode, aud] of [['light', 'b'], ['dark', 'b'], ['light', 'c']]) {
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(page); await p.waitForTimeout(800);
  await p.evaluate(([m, a]) => ZhaoUI.setTheme({ mode: m, audience: a }), [mode, aud]); await p.waitForTimeout(300);
  await p.evaluate(axe);
  const r = await p.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } }));
  const v = r.violations.filter((x) => !IGNORE.has(x.id));
  if (v.length) { bad++; console.log(`FAIL [a11y ${mode}/${aud}]`); v.forEach((x) => console.log(`  ${x.id} (${x.impact}) x${x.nodes.length}: ${x.nodes[0].target.join(' ')}`)); }
  else console.log(`ok [a11y ${mode}/${aud}]: ${r.passes.length} rules passed, 0 violations`);
  await p.close();
}
await b.close(); process.exit(bad ? 1 : 0);
