// Draws site/assets/og.png (1200x630, the picture shown when a link to the site is shared).  Run by hand when the wording changes:
//   node site/scripts/make-og.mjs
// The PNG is committed, so the normal build needs no browser.  The text is set in the system CJK font of the machine that runs it.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadPlaywright, launch } from '../../packages/ui/test/env.mjs';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'og.png');
const count = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'packages', 'ui', 'docs', 'components.json'), 'utf8')).components.length;   // needs a build first
const html = `<!doctype html><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; display: flex; flex-direction: column; justify-content: center; padding: 0 96px; position: relative;
    background: #ffffff; color: #14151f; font-family: -apple-system, "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif; }
  body::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 16px; background: #768bff; }
  .mark { width: 96px; height: 96px; margin-bottom: 44px; }
  h1 { font-size: 132px; line-height: 1; font-weight: 800; letter-spacing: -.04em; }
  .tag { margin-top: 28px; font-size: 52px; font-weight: 600; color: #2f3350; }
  .facts { margin-top: 36px; font-size: 32px; color: #565a73; letter-spacing: .02em; }
  .url { position: absolute; right: 96px; bottom: 56px; font-size: 30px; font-weight: 600; color: #4a5bd0; }
</style>
<svg class="mark" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#768bff"/><path d="M19 20h26L19 44h26" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>
<h1>ZhaoUI</h1><p class="tag">不依赖框架的中文 UI 组件库</p><p class="facts">一个 CSS 加一个 JS　·　${count} 个组件　·　MIT 许可证</p><p class="url">ui.352m.com</p>`;

const b = await launch(loadPlaywright(), 'chromium'), p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html); await p.waitForTimeout(300);
await p.screenshot({ path: out }); await b.close();
console.log('wrote ' + out);
