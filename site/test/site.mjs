// Browser checks on the built site: every page loads without errors, nothing sticks out sideways, search / theme / playground / copy work, and an axe audit of key pages.
import assert from 'node:assert/strict';
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
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
    assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('.zh-nav-links a')].map((a) => a.textContent.trim())), ['指南', '设计', '组件', '模板', '在线试用', '下载', '版本更新'], `${pg}: top navigation`);
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
await check('share picture and links: og:image points at a real 1200x630 image, the footer links to GitHub and to the download page', async (p) => {
  for (const pg of ['index.html', 'components/tree.html', 'download.html']) {
    await open(p, pg);
    const r = await p.evaluate(() => ({ og: document.querySelector('meta[property="og:image"]')?.content, tw: document.querySelector('meta[name="twitter:card"]')?.content, w: document.querySelector('meta[property="og:image:width"]')?.content, h: document.querySelector('meta[property="og:image:height"]')?.content, footer: [...document.querySelectorAll('.s-footer a')].map((a) => a.textContent.trim() + ' ' + a.getAttribute('href')) }));
    assert.equal(r.og, 'https://ui.352m.com/assets/og.png', pg); assert.equal(r.tw, 'summary_large_image'); assert.deepEqual([r.w, r.h], ['1200', '630']);
    assert.ok(r.footer.some((f) => /^GitHub https:\/\/github\.com\/zhaosay\/zhaoui$/.test(f)), `${pg}: GitHub link in the footer`); assert.ok(r.footer.some((f) => /^下载 .*download\.html$/.test(f)), `${pg}: download link in the footer`);
  }
  const png = await p.request.get(url('assets/og.png')); assert.equal(png.status(), 200); const buf = await png.body(); assert.deepEqual([buf.readUInt32BE(16), buf.readUInt32BE(20)], [1200, 630], 'the file really is 1200x630');
});
const TPL = ['landing', 'pricing', 'login', 'dashboard'];
for (const w of [1280, 390]) await check(`templates at ${w}px: each loads without errors, has one h1, does not scroll sideways, and is actually styled`, async (p) => {
  for (const k of TPL) {
    await open(p, `templates/${k}.html`); await p.waitForTimeout(300);
    const r = await p.evaluate(() => ({ h1: document.querySelectorAll('h1').length, wide: document.documentElement.scrollWidth - innerWidth, title: document.title, main: !!document.querySelector('main'), unstyled: [...document.querySelectorAll('.zh-btn.primary')].filter((b) => getComputedStyle(b).backgroundColor === 'rgba(0, 0, 0, 0)').length, unknownIcons: [...document.querySelectorAll('i[data-i]')].filter((i) => !i.querySelector('svg')).length }));
    assert.equal(r.h1, 1, `${k}: h1`); assert.ok(r.wide <= 0, `${k}: sideways scroll ${r.wide}px`); assert.ok(r.title.length > 3 && r.main, `${k}: title and main landmark`);
    assert.equal(r.unstyled, 0, `${k}: primary buttons are styled`); assert.equal(r.unknownIcons, 0, `${k}: every icon name exists in the icon pack`);
  }
}, w);
await check('templates: pages interact (login validates, pricing FAQ opens, dashboard pager and tabs are wired) and the index lists them with previews', async (p) => {
  await open(p, 'templates/login.html'); await p.click('button[type=submit]'); await p.waitForTimeout(150);
  assert.equal(await p.evaluate(() => document.getElementById('l-mail').getAttribute('aria-invalid')), 'true'); assert.match(await p.evaluate(() => document.getElementById('l-mail-h').textContent), /邮箱/);
  await p.fill('#l-mail', 'a@b.co'); await p.fill('#l-pass', 'x'); await p.click('button[type=submit]'); await p.waitForTimeout(250);
  assert.equal(await p.evaluate(() => document.querySelectorAll('.zh-message').length > 0), true, 'valid input shows the message');
  await open(p, 'templates/pricing.html'); await p.click('#faq .zh-collapse-item:nth-child(2) .zh-collapse-trigger'); await p.waitForTimeout(350);
  assert.equal(await p.evaluate(() => document.querySelectorAll('#faq .zh-collapse-item.is-open').length), 1);
  await open(p, 'templates/dashboard.html'); await p.waitForTimeout(400);
  assert.equal(await p.evaluate(() => [document.querySelectorAll('.zh-chart svg').length, document.querySelectorAll('.zh-pg button').length > 0, document.querySelectorAll('.zh-tabs [role=tab][tabindex]').length > 0, document.querySelector('.zh-side a[aria-current=page]')?.textContent.trim()].join()), '2,true,true,概览');
  await open(p, 'templates/index.html');
  assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('.tpl-card iframe')].map((f) => f.getAttribute('src'))), TPL.map((k) => `${k}.html`)); assert.equal(await p.evaluate(() => !!document.querySelector('a.zh-btn.primary[download]')?.getAttribute('href').match(/zhaoui-templates-[\d.]+\.zip$/)), true);
});
await check('templates zip: unpacks, every local file a page refers to is in it, and a page opened from disk is styled and error free', async (p) => {
  const dir = mkdtempSync(join(tmpdir(), 'zh-tpl-')); try {
    await open(p, 'templates/index.html'); const href = await p.evaluate(() => document.querySelector('a.zh-btn.primary[download]').getAttribute('href'));
    const res = await p.request.get(new URL(href, p.url()).href); assert.equal(res.status(), 200); writeFileSync(join(dir, 'x.zip'), await res.body());
    const u = spawnSync('unzip', ['-q', 'x.zip'], { cwd: dir, encoding: 'utf8' }); assert.equal(u.status, 0, u.stderr);
    const top = readdirSync(dir).find((n) => n.startsWith('zhaoui-templates-')); assert.ok(top, 'one top folder');
    for (const k of TPL) { const html = readFileSync(join(dir, top, `${k}.html`), 'utf8');
      for (const m of html.matchAll(/(?:href|src)="([^"#?]+)[^"]*"/g)) { if (/^(https?:|data:|mailto:)/.test(m[1])) continue; assert.ok(existsSync(join(dir, top, m[1])), `${k}.html refers to ${m[1]}, which is not in the zip`); }
      assert.equal(/@@LIB@@|\.\.\/assets/.test(html), false, `${k}.html has no site-only paths`); }
    assert.ok(existsSync(join(dir, top, 'LICENSE')) && existsSync(join(dir, top, 'README.txt')));
    const errs = []; const q = await b.newPage(); q.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); q.on('pageerror', (e) => errs.push(e.message));
    await q.goto(pathToFileURL(join(dir, top, 'landing.html')).href); await q.waitForTimeout(500);
    assert.equal(await q.evaluate(() => getComputedStyle(document.querySelector('.zh-btn.primary')).backgroundColor !== 'rgba(0, 0, 0, 0)' && document.querySelectorAll('svg').length > 3), true, 'styled and icons drawn'); assert.deepEqual(errs, [], 'no errors from disk'); await q.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
await check('SEO and AI-search facts on every page: title, description, canonical, one h1, language, share image, dates, author, Markdown copy', async () => {
  const all = walk(dir).filter((f) => f.endsWith('.html')).map((f) => relative(dir, f).split('\\').join('/')), read = (f) => readFileSync(join(dir, f), 'utf8');
  const meta = (h, re) => (h.match(re) || [])[1];
  const indexable = all.filter((f) => !/<meta name="robots" content="[^"]*noindex/.test(read(f)) && f !== 'design/visual.html');
  assert.ok(indexable.length >= 70, `indexable pages (${indexable.length})`);
  for (const f of indexable) {
    const h = read(f), title = meta(h, /<title>([^<]*)<\/title>/), desc = meta(h, /<meta name="description" content="([^"]*)"/), canon = meta(h, /<link rel="canonical" href="([^"]*)"/);
    assert.ok(title && [...title].length >= 6 && [...title].length <= 70, `${f}: title length (${title})`);
    assert.ok(desc && [...desc].length >= 40 && [...desc].length <= 170, `${f}: description length ${desc ? [...desc].length : 'none'}`);
    assert.equal(canon, 'https://ui.352m.com/' + (f === 'index.html' ? '' : f), `${f}: canonical is its own address`);
    assert.equal((h.match(/<h1[ >]/g) || []).length, 1, `${f}: exactly one h1`); assert.match(h, /<html lang="zh-CN"/, `${f}: lang`); assert.match(h, /name="viewport" content="width=device-width, initial-scale=1"/, `${f}: viewport`);
    assert.match(h, /property="og:image" content="https:\/\/ui\.352m\.com\/assets\/og\.png"/, `${f}: share image`);
    const ld = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const art = ld.find((x) => x['@type'] === 'TechArticle');
    if (art) { for (const k of ['datePublished', 'dateModified']) assert.match(art[k] || '', /^\d{4}-\d{2}-\d{2}$/, `${f}: ${k}`); assert.equal(art.author && art.author.name, 'zhaosay', `${f}: author`); assert.ok(art.publisher && art.image && art.mainEntityOfPage, `${f}: publisher, image, mainEntityOfPage`); }
    const md = meta(h, /<link rel="alternate" type="text\/markdown" href="([^"]*)"/);
    if (/^(components|guide)\/[\w-]+\.html$/.test(f) && f !== 'components/index.html') { assert.ok(md, `${f}: points at its Markdown copy`); assert.ok(existsSync(join(dir, md.replace('https://ui.352m.com/', ''))), `${f}: the Markdown copy exists (${md})`); }
  }
  const home = [...read('index.html').matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])), app = home.find((x) => x['@type'] === 'SoftwareApplication');
  for (const k of ['softwareVersion', 'license', 'downloadUrl', 'sameAs', 'author', 'offers']) assert.ok(app[k], `SoftwareApplication has ${k}`);
  assert.match(app.downloadUrl, /assets\/zhaoui-\d+\.\d+\.\d+\.zip$/); assert.ok(existsSync(join(dir, app.downloadUrl.replace('https://ui.352m.com/', ''))), 'the download URL in the structured data exists');
  // pages that are not search content say so: the 404 page, the sample templates, the bare file list; and the demo page and the list still have the basics
  assert.match(read('404.html'), /<meta name="robots" content="noindex"/); for (const k of ['landing', 'pricing', 'login', 'dashboard']) assert.match(read(`templates/${k}.html`), /<meta name="robots" content="noindex, follow"/, `${k} template`);
  for (const k of ['landing', 'pricing', 'login', 'dashboard']) assert.equal(/noindex/.test(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'templates', `${k}.html`), 'utf8')), false, `the template source (what the zip gets) has no noindex: ${k}`);
  const list = read('assets/zhaoui/index.html'); assert.match(list, /<html lang="zh-CN"/); assert.match(list, /name="viewport"/); assert.match(list, /name="robots" content="noindex"/); assert.match(list, /<title>[^<]{6,}<\/title>/);
  assert.match(read('design/visual.html'), /property="og:image"/);
});
await check('sitemap, robots and llms.txt: every address exists, has a date, and noindex pages are left out; llms.txt links to real Markdown copies', async () => {
  const sm = readFileSync(join(dir, 'sitemap.xml'), 'utf8'), urls = [...sm.matchAll(/<url><loc>([^<]*)<\/loc>(?:<lastmod>([^<]*)<\/lastmod>)?<\/url>/g)];
  assert.equal(urls.length, (sm.match(/<url>/g) || []).length, 'every entry parses');
  for (const [, loc, mod] of urls) { assert.match(mod || '', /^\d{4}-\d{2}-\d{2}$/, `${loc}: lastmod`); const f = loc.replace('https://ui.352m.com/', '') || 'index.html'; assert.ok(existsSync(join(dir, f)), `${loc} exists`); assert.equal(/noindex/.test(readFileSync(join(dir, f), 'utf8').match(/<meta name="robots"[^>]*>/)?.[0] || ''), false, `${loc} is not noindex`); }
  for (const bad of ['404.html', 'assets/zhaoui/index.html', 'templates/landing.html']) assert.equal(sm.includes(bad), false, `${bad} is not in the sitemap`);
  const robots = readFileSync(join(dir, 'robots.txt'), 'utf8'); assert.match(robots, /^User-agent: \*$/m); assert.match(robots, /^Allow: \/$/m); assert.match(robots, /^Sitemap: https:\/\/ui\.352m\.com\/sitemap\.xml$/m); assert.equal(/^Disallow: \/\s*$/m.test(robots), false, 'nothing is blocked');
  const llms = readFileSync(join(dir, 'llms.txt'), 'utf8'), links = [...llms.matchAll(/\]\((https:\/\/ui\.352m\.com\/[^)]*)\)/g)].map((m) => m[1]);
  assert.ok(links.length >= 60 && links.some((l) => l.endsWith('.md')), `llms.txt links (${links.length}) include Markdown copies`); for (const l of links) assert.ok(existsSync(join(dir, l.replace('https://ui.352m.com/', ''))), `llms.txt link exists: ${l}`);
  assert.equal(/\]\((?!https:)[^)]*\)/.test(llms.replace(/```[\s\S]*?```/g, '')), false, 'every link in llms.txt is absolute');
});
await check('asset links carry a content hash, so an edge cache cannot keep serving an old stylesheet or script', async (p) => {
  const seen = new Set();
  for (const pg of ['index.html', 'components/result.html', 'download.html', 'playground.html']) {
    await open(p, pg);
    const links = await p.evaluate(() => [...document.querySelectorAll('link[rel=stylesheet], script[src]')].map((e) => e.getAttribute('href') || e.getAttribute('src')).filter((u) => /assets\//.test(u)));
    assert.ok(links.length >= 5, `${pg}: ${links.length} asset links`); for (const u of links) { assert.match(u, /\.(css|js)\?v=[0-9a-f]{10}$/, `${pg}: ${u}`); seen.add(u.split('?v=')[1]); }
  }
  assert.equal(seen.size, 1, 'one version for the whole build');
});
for (const w of [320, 360, 390, 768, 820, 899]) await check(`screen ${w}px: nothing makes the page wider than the screen (home, guide, component, download, templates, playground)`, async (p) => {
  for (const pg of ['download.html', 'templates/index.html', 'templates/landing.html', 'templates/pricing.html', 'index.html', 'guide/quickstart.html', 'components/table.html', 'playground.html']) {
    await open(p, pg);
    const r = await p.evaluate(() => { const W = innerWidth, off = [...document.querySelectorAll('body *')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.right > W + 1 && !e.closest('pre, .zh-table-wrap--scroll, .tpl-frame, .zh-drawer, dialog'); }).slice(0, 3).map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]} ends at ${Math.round(e.getBoundingClientRect().right)}`); return { over: document.documentElement.scrollWidth - W, off }; });
    assert.ok(r.over <= 0, `${pg}: ${r.over}px too wide; sticking out: ${r.off.join(' | ')}`);
  }
}, w);
await check('tables on a phone: cell content flows like a paragraph, a code chip is never stacked letter by letter', async (p) => {
  for (const pg of ['download.html', 'guide/quickstart.html', 'guide/theme.html']) {
    await open(p, pg);
    const tall = await p.evaluate(() => [...document.querySelectorAll('.s-article td code.zh-code-inline')].filter((c) => { const b = c.getBoundingClientRect(), lh = parseFloat(getComputedStyle(c).lineHeight) || 20; return b.height > lh * 2.6; }).map((c) => `${c.textContent.slice(0, 20)} (${Math.round(c.getBoundingClientRect().height)}px)`));
    assert.deepEqual(tall, [], `${pg}: code chips broken over many lines`);
  }
}, 320);

await check('guide navigation and headings are numbered; the numbers in the side menu and the contents list agree', async (p) => {
  await open(p, 'guide/quickstart.html');
  const r = await p.evaluate(() => ({ side: [...document.querySelectorAll('.s-side .zh-side-item .zh-side-num')].map((x) => x.textContent), toc: [...document.querySelectorAll('.s-toc .s-num')].slice(0, 3).map((x) => x.textContent), h2: getComputedStyle(document.querySelector('.s-article h2'), '::before').content, cur: document.querySelector('.s-side [aria-current=page]').textContent.trim() }));
  assert.deepEqual(r.side, ['1', '2', '3', '4', '5', '6', '7'], 'six guide pages and the changelog, numbered in order'); assert.match(r.cur, /^1.*快速开始/); assert.equal(r.toc[0], '1.'); assert.match(r.h2, /counter\(s2\)/, 'headings are numbered by a CSS counter');
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
    for (const pg of ['index.html', 'guide/quickstart.html', 'design/index.html', 'components/index.html', 'components/table.html', 'components/upload.html', 'components/chart.html', 'playground.html', 'download.html', 'templates/index.html', 'templates/landing.html', 'templates/pricing.html', 'templates/login.html', 'templates/dashboard.html', 'changelog.html']) {
      await p.goto(url(pg)); await p.waitForTimeout(300); await p.evaluate(([m, a]) => ZhaoUI.setTheme({ mode: m, audience: a }), [mode, aud]); await p.waitForTimeout(200);
      await p.evaluate(axe); const r = await p.evaluate(() => axe.run({ exclude: [['#pg-frame']] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } }));
      r.violations.filter((v) => v.id !== 'heading-order').forEach((v) => found.push(`${pg} ${v.id} x${v.nodes.length}: ${v.nodes[0].target.join(' ').slice(0, 80)}`));
    }
    assert.deepEqual(found, []);
  });
} else if (process.env.ZH_SKIP_AXE === '1') console.log('skip axe: ZH_SKIP_AXE=1');
else { failed++; console.log('FAIL axe audit: axe-core is not installed (npm install at the repository root; set ZH_SKIP_AXE=1 to skip on purpose)'); }

console.log(failed ? `FAILED [site]: ${passed} passed, ${failed} failed` : `ok [site]: ${passed} passed, 0 failed`);
await b.close(); server.close(); process.exit(failed ? 1 : 0);
