// Regression scan of the built demo page: for each width and theme combination, report page errors, page-level sideways scroll, and elements that stick out of the viewport
// (ignoring anything inside a scroll container or a clipped ancestor).  Usage: node demo/scan.mjs [path-to-html]
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { loadPlaywright, launch, fileUrl } from '../packages/ui/test/env.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const file = resolve(process.argv[2] || join(here, '..', '..', 'zhaoui-demo.html'));
const pw = loadPlaywright(), b = await launch(pw);
const combos = []; for (const w of [1280, 768, 420]) for (const aud of ['b', 'c']) for (const mode of ['light', 'dark']) combos.push({ w, aud, mode });
let bad = 0;
for (const c of combos) {
  const p = await b.newPage({ viewport: { width: c.w, height: 900 } }), errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto(fileUrl(file)); await p.waitForTimeout(600);
  await p.evaluate(([a, m]) => { document.documentElement.setAttribute('data-audience', a); document.documentElement.setAttribute('data-mode', m); }, [c.aud, c.mode]); await p.waitForTimeout(300);
  const r = await p.evaluate(() => {
    const W = document.documentElement.clientWidth, out = [];
    const clipped = (e) => { for (let n = e.parentElement; n && n !== document.body; n = n.parentElement) { const s = getComputedStyle(n); if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) return true; if (s.position === 'fixed') return true; } return false; };
    document.querySelectorAll('body *').forEach((e) => { const r = e.getBoundingClientRect(); if (!r.width || !r.height) return; if (r.right > W + 2 && !clipped(e) && getComputedStyle(e).position !== 'fixed' && !e.closest('[hidden],dialog:not([open])')) out.push(e.tagName.toLowerCase() + '.' + String(e.className).split(' ').slice(0, 2).join('.')); });
    return { hscroll: document.documentElement.scrollWidth - W, out: [...new Set(out)].slice(0, 6) };
  });
  const ok = !errs.length && r.hscroll <= 0 && !r.out.length; if (!ok) bad++;
  console.log((ok ? 'ok   ' : 'FAIL ') + `${c.w}px ${c.aud}/${c.mode}` + (ok ? '' : ` errors=${JSON.stringify(errs.slice(0, 2))} hscroll=${r.hscroll} out=${JSON.stringify(r.out)}`));
  await p.close();
}
await b.close(); process.exit(bad ? 1 : 0);
