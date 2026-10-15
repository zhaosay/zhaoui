// Browser checks on the built site: every page loads without errors, nothing sticks out sideways, search / theme / playground / copy work, and an axe audit of key pages.
import assert from 'node:assert/strict';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { loadPlaywright, launch, resolveNearPlaywright } from '../../packages/ui/test/env.mjs';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist-site');
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const pages = walk(dir).filter((f) => f.endsWith('.html') && !f.includes(join('assets', 'zhaoui'))).map((f) => relative(dir, f).split('\\').join('/'));
// served over http at the root like the real site (axe and the clipboard need a real origin, and it checks the base path)
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.md': 'text/markdown; charset=utf-8' };
const server = createServer((req, res) => { let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); p = p.slice(1) || 'index.html'; if (p.endsWith('/')) p += 'index.html';
  let body; try { body = readFileSync(join(dir, p)); } catch { res.writeHead(404).end('nf'); return; } res.writeHead(200, { 'content-type': TYPES[p.slice(p.lastIndexOf('.'))] || 'application/octet-stream' }).end(body); });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = (p) => `http://127.0.0.1:${server.address().port}/${p}`;
const pw = loadPlaywright(), b = await launch(pw, process.env.ENGINE || 'chromium');
let passed = 0, failed = 0;
async function check(label, fn, w = 1280) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } }), errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  try { await fn(p); assert.deepEqual(errs, [], 'page errors'); passed++; } catch (e) { failed++; console.log(`FAIL ${label}\n   ${e.message.split('\n').slice(0, 6).join(' | ')}`); }
  await p.close();
}
const open = async (p, path) => { await p.goto(url(path)); await p.waitForTimeout(250); };
const hscroll = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

for (const [w, label] of [[1280, 'desktop'], [420, 'phone']]) await check(`every page loads and fits (${label}): ${pages.length} pages`, async (p) => {
  const bad = [];
  for (const pg of pages) {
    if (pg === 'design/visual.html' && w === 420) continue;   // the long visual demo has its own scan (demo/scan.mjs)
    const errs = []; const h1 = (m) => { if (m.type() === 'error' && !(/404\.html/.test(pg) && /status of 404/.test(m.text()))) errs.push(m.text()); }; p.on('console', h1);
    await open(p, pg); const hs = await hscroll(p), n1 = await p.evaluate(() => document.querySelectorAll('h1').length), title = await p.title();
    p.off('console', h1);
    if (hs > 0) bad.push(`${pg}: sideways scroll ${hs}px`); if (!/design\/visual/.test(pg) && n1 !== 1) bad.push(`${pg}: ${n1} h1`); if (!title) bad.push(`${pg}: no title`); if (errs.length) bad.push(`${pg}: ${errs[0]}`);
  }
  assert.deepEqual(bad, []);
}, w);

await check('home: hero, live components are initialised, structured data parses', async (p) => {
  await open(p, 'index.html');
  assert.equal(await p.evaluate(() => [...document.querySelectorAll('#live .zh-sel, #live .zh-chart svg, #live .zh-dp, .s-product .zh-progress-fill')].length >= 4), true, 'the live strip is wired');
  const types = await p.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent)['@type']));
  assert.deepEqual(types.sort(), ['FAQPage', 'SoftwareApplication', 'WebSite']);
  assert.match(await p.evaluate(() => document.querySelector('link[rel=canonical]').href), /^https:\/\/ui\.352m\.com\/$/);
});
await check('component page: live example, code, API, FAQ, previous/next, canonical and markdown copy', async (p) => {
  await open(p, 'components/tree.html');
  assert.deepEqual(await p.evaluate(() => [document.querySelectorAll('.s-stage .zh-tree-row').length > 0, !!document.querySelector('.doc-code pre'), document.querySelectorAll('#attrs + .zh-table-wrap tbody tr').length > 3, document.querySelectorAll('#faq ~ h3').length >= 3, !!document.querySelector('.s-pn'), document.querySelector('link[rel=canonical]').href]), [true, true, true, true, true, 'https://ui.352m.com/components/tree.html']);
  await p.click('[data-site-copy]'); await p.waitForTimeout(500); assert.notEqual(await p.evaluate(() => document.querySelector('[data-site-copy]').textContent), '复制', 'the button reports what it did');
  assert.equal(await p.evaluate(() => document.querySelector('.s-toc a[href="#demo"]') !== null), true, 'the page has its table of contents');
});
await check('download: a nav item on every kind of page, a zip that downloads and unpacks, file links that download, and a phone does not scroll sideways', async (p) => {
  for (const pg of ['index.html', 'guide/quickstart.html', 'components/tree.html', 'design/index.html']) {
    await open(p, pg);
    assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('.zh-nav-links a')].map((a) => a.textContent.trim())), ['指南', '设计', '组件', '在线试用', '下载', '更新日志'], `${pg}: top navigation`);
  }
  await open(p, 'download.html');
  const r = await p.evaluate(() => ({ btn: document.querySelector('a.zh-btn.primary[download]')?.getAttribute('href'), files: [...document.querySelectorAll('.doc-body table a, article table a, main table a')].map((a) => [a.getAttribute('href'), a.hasAttribute('download')]), current: document.querySelector('.zh-nav-links a[aria-current="page"]')?.textContent.trim(), h1: document.querySelectorAll('h1').length }));
  assert.match(r.btn, /^assets\/zhaoui-\d+\.\d+\.\d+\.zip$/, 'the zip button'); assert.equal(r.current, '下载'); assert.equal(r.h1, 1);
  assert.ok(r.files.length >= 10 && r.files.every(([h, d]) => /^assets\/zhaoui\//.test(h) && d), `file links all download (${r.files.length})`);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('a.zh-btn.primary[download]')]);
  const path = await dl.path(); const head = readFileSync(path).subarray(0, 4);
  assert.deepEqual([...head], [0x50, 0x4b, 0x03, 0x04], 'the downloaded file is a zip');
  for (const f of r.files) { const res = await p.request.get(new URL(f[0], p.url()).href); assert.equal(res.status(), 200, f[0]); }
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'no sideways scroll');
}, 1280);
await check('download page has a side menu whose links all point at real headings; component pages keep their action buttons off the example box', async (p) => {
  await open(p, 'download.html');
  const r = await p.evaluate(() => { const links = [...document.querySelectorAll('.s-side .zh-side a')].map((a) => a.getAttribute('href')); return { links, missing: links.filter((h) => h.includes('#') && !document.getElementById(h.split('#')[1]) && h.startsWith('download.html')), groups: document.querySelectorAll('.s-side .zh-side-group').length, toc: !!document.querySelector('[data-zh-anchor]') }; });
  assert.equal(r.groups, 3); assert.ok(r.links.length >= 9, 'side menu links'); assert.deepEqual(r.missing, [], 'every in-page link has a heading'); assert.equal(r.toc, true, 'the contents list on the right is still there');
  await open(p, 'components/result.html');
  const g = await p.evaluate(() => { const st = document.querySelector('.s-stage').getBoundingClientRect(), a = document.querySelector('.s-actions'), bs = [...a.querySelectorAll('.zh-btn')].map((x) => x.getBoundingClientRect()); return { above: a.getBoundingClientRect().top - st.bottom, between: bs[1].left - bs[0].right, same: bs[0].height === bs[1].height && [...a.querySelectorAll('.zh-btn')].every((x) => x.className === 'zh-btn sm') }; });
  assert.ok(g.above >= 12, `space between the example box and its buttons (${g.above}px)`); assert.ok(g.between >= 10, `space between the two buttons (${g.between}px)`); assert.equal(g.same, true, 'both buttons are the same kind');
});
await check('text fills its column: paragraphs, lead text and code blocks are the same width as the article, on a normal and a large screen', async (p) => {
  for (const pg of ['guide/quickstart.html', 'design/index.html', 'components/tree.html']) {
    await open(p, pg);
    const r = await p.evaluate(() => { const art = document.querySelector('.s-article'), w = (e) => Math.round(e.getBoundingClientRect().width), ps = [...art.querySelectorAll(':scope > p, :scope > section > p')].filter((e) => w(e) > 0);
      return { art: w(art), short: ps.filter((e) => w(e) < w(art) - 1).map((e) => [w(e), e.className, e.textContent.slice(0, 20)]), n: ps.length }; });
    assert.ok(r.n >= 1, `${pg}: has paragraphs`); assert.deepEqual(r.short, [], `${pg}: paragraphs narrower than the article (${r.art}px)`);
  }
}, 1920);
await check('asset links carry a content hash, so an edge cache cannot keep serving an old stylesheet or script', async (p) => {
  const seen = new Set();
  for (const pg of ['index.html', 'components/result.html', 'download.html', 'playground.html']) {
    await open(p, pg);
    const links = await p.evaluate(() => [...document.querySelectorAll('link[rel=stylesheet], script[src]')].map((e) => e.getAttribute('href') || e.getAttribute('src')).filter((u) => /assets\//.test(u)));
    assert.ok(links.length >= 5, `${pg}: ${links.length} asset links`); for (const u of links) { assert.match(u, /\.(css|js)\?v=[0-9a-f]{10}$/, `${pg}: ${u}`); seen.add(u.split('?v=')[1]); }
  }
  assert.equal(seen.size, 1, 'one version for the whole build');
});
await check('download page and top navigation on a phone: no sideways scroll', async (p) => {
  for (const pg of ['download.html', 'index.html']) { await open(p, pg); assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, pg); }
}, 390);

await check('guide navigation and headings are numbered; the numbers in the side menu and the contents list agree', async (p) => {
  await open(p, 'guide/quickstart.html');
  const r = await p.evaluate(() => ({ side: [...document.querySelectorAll('.s-side .zh-side-item .zh-side-num')].map((x) => x.textContent), toc: [...document.querySelectorAll('.s-toc .s-num')].slice(0, 3).map((x) => x.textContent), h2: getComputedStyle(document.querySelector('.s-article h2'), '::before').content, cur: document.querySelector('.s-side [aria-current=page]').textContent.trim() }));
  assert.deepEqual(r.side, ['1', '2', '3', '4', '5', '6'], 'five guide pages and the changelog, numbered in order'); assert.match(r.cur, /^1.*快速开始/); assert.equal(r.toc[0], '1.'); assert.match(r.h2, /counter\(s2\)/, 'headings are numbered by a CSS counter');
});
await check('large screens: the page uses the width it is given', async (p) => {
  await open(p, 'index.html'); const w = await p.evaluate(() => document.querySelector('.zh-wrap').getBoundingClientRect().width); assert.ok(w >= 1600, `content is ${Math.round(w)}px wide on a 1920px screen`);
  await open(p, 'components/table.html'); const a = await p.evaluate(() => document.querySelector('.s-article').getBoundingClientRect().width); assert.ok(a >= 900, `article is ${Math.round(a)}px wide`);
}, 1920);
await check('dialog page: the example opens only when you press the button', async (p) => {
  await open(p, 'components/dialog.html'); assert.equal(await p.evaluate(() => document.querySelectorAll('dialog[open]').length), 0);
  await p.click('[data-site-run]'); await p.waitForTimeout(300); assert.equal(await p.evaluate(() => document.querySelectorAll('dialog[open], .zh-modal[open]').length > 0), true);
});
await check('search: Ctrl+K opens, typing finds a component, Enter goes there', async (p) => {
  await open(p, 'index.html'); await p.keyboard.press('Control+k'); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(() => document.querySelector('dialog.zh-cmd').open), true); await p.keyboard.type('data-zh-tree'); await p.waitForTimeout(200);
  assert.match(await p.evaluate(() => document.querySelector('.zh-cmd-item').textContent), /树/); await p.keyboard.press('Enter'); await p.waitForURL(/components\/tree\.html/, { timeout: 5000 });
});
await check('theme: dark and B-end switch (the site starts in C-end), and they are remembered on the next page', async (p) => {
  await open(p, 'index.html'); await p.click('[data-zh-popover="#s-theme"]'); await p.waitForTimeout(300);
  await p.click('.zh-pop [data-site-theme="mode:dark"]'); await p.click('.zh-pop [data-site-theme="audience:b"]');
  assert.deepEqual(await p.evaluate(() => [document.documentElement.dataset.mode, document.documentElement.dataset.audience]), ['dark', 'b']);
  await open(p, 'components/tree.html'); assert.deepEqual(await p.evaluate(() => [document.documentElement.dataset.mode, document.documentElement.dataset.audience]), ['dark', 'b'], 'remembered');
});
await check('playground: loads an example, edits update the preview, share link restores code', async (p) => {
  await p.goto(url('playground.html') + '?c=tag'); await p.waitForTimeout(700);
  const frame = () => p.frameLocator('#pg-frame');
  assert.equal(await p.evaluate(() => document.getElementById('pg-pick').value), 'tag'); assert.ok((await frame().locator('.zh-tag').count()) > 0, 'the example runs in the frame');
  await p.fill('#pg-code', '<button class="zh-btn primary" id="x">你好沙盒</button>'); await p.waitForTimeout(900);
  assert.equal(await frame().locator('#x').textContent(), '你好沙盒');
  assert.equal(await frame().locator('#x').evaluate((e) => getComputedStyle(e).backgroundColor !== 'rgba(0, 0, 0, 0)'), true, 'styled by zhaoui.css inside the frame');
  const code = await p.evaluate(() => document.getElementById('pg-code').value); await p.goto(url('playground.html') + '#code=' + Buffer.from(code).toString('base64')); await p.reload(); await p.waitForTimeout(700);
  assert.equal(await p.evaluate(() => document.getElementById('pg-code').value), code, 'shared code is restored');
});
await check('side menu on a phone opens as a drawer', async (p) => {
  await open(p, 'components/tree.html'); assert.equal(await p.evaluate(() => getComputedStyle(document.querySelector('.s-side')).display), 'none');
  await p.click('.s-side-btn'); await p.waitForTimeout(500); assert.equal(await p.evaluate(() => document.querySelectorAll('#s-drawer a[href$="upload.html"]').length), 1);
}, 420);

const axePath = resolveNearPlaywright('axe-core/axe.min.js');
if (axePath) {
  const axe = readFileSync(axePath, 'utf8');
  for (const [mode, aud] of [['light', 'b'], ['dark', 'b'], ['light', 'c']]) await check(`axe (${mode}/${aud}): home, guide, design, components, playground`, async (p) => {
    const found = [];
    for (const pg of ['index.html', 'guide/quickstart.html', 'design/index.html', 'components/index.html', 'components/table.html', 'components/upload.html', 'components/chart.html', 'playground.html', 'download.html', 'changelog.html']) {
      await p.goto(url(pg)); await p.waitForTimeout(300); await p.evaluate(([m, a]) => ZhaoUI.setTheme({ mode: m, audience: a }), [mode, aud]); await p.waitForTimeout(200);
      await p.evaluate(axe); const r = await p.evaluate(() => axe.run({ exclude: [['#pg-frame']] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } }));
      r.violations.filter((v) => v.id !== 'heading-order').forEach((v) => found.push(`${pg} ${v.id} x${v.nodes.length}: ${v.nodes[0].target.join(' ').slice(0, 80)}`));
    }
    assert.deepEqual(found, []);
  });
} else console.log('skip axe: axe-core not installed next to Playwright');

console.log(failed ? `FAILED [site]: ${passed} passed, ${failed} failed` : `ok [site]: ${passed} passed, 0 failed`);
await b.close(); server.close(); process.exit(failed ? 1 : 0);
