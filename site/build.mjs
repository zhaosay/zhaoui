// Builds the website into site/dist-site/.  Run `npm run build` first (it makes packages/ui/dist and packages/ui/docs, which this reads).
//   node site/build.mjs            build
// Every page is plain HTML with relative links, so the folder can be uploaded anywhere or opened from disk.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { gzipSync } from 'fflate';
import { createHash } from 'node:crypto';
import { abs, SITE } from './config.mjs';
import { page, BUILD } from './lib/layout.mjs';
import { makeFaq, makeDesc } from '../packages/ui/scripts/facts.mjs';
import { componentPage, componentIndex, componentSide, order } from './lib/pages-components.mjs';
import { GUIDE, guidePage, guideSide, changelogPage, designIndex, designSide } from './lib/pages-guide.mjs';
import { homePage } from './lib/pages-home.mjs';
import { playgroundPage } from './lib/pages-playground.mjs';
import { downloadPage } from './lib/pages-download.mjs';
import { makeZip } from './lib/zip.mjs';
import { templatesPage, TEMPLATES } from './lib/pages-templates.mjs';
import { checkLinks } from './lib/check-links.mjs';

const here = dirname(fileURLToPath(import.meta.url)), root = resolve(here, '..'), ui = join(root, 'packages', 'ui'), out = join(here, 'dist-site');
const read = (p) => readFileSync(p, 'utf8');
for (const need of [join(ui, 'dist', 'zhaoui.min.js'), join(ui, 'docs', 'components.json')]) if (!existsSync(need)) { console.error(`missing ${need}: run "npm run build" at the repository root first`); process.exit(1); }

const data = JSON.parse(read(join(ui, 'docs', 'components.json'))), metas = data.components, version = data.version;
const gz = (name) => { const f = join(ui, 'dist', name.endsWith('.js') ? name.replace(/\.js$/, '.min.js') : name.replace(/\.css$/, '.min.css')); return existsSync(f) ? (gzipSync(new Uint8Array(readFileSync(f)), { level: 9 }).length / 1024).toFixed(1) : null; };
const faq = makeFaq({ metas, gz }), desc = makeDesc(metas.length);

rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
const write = (rel, content) => { const f = join(out, rel); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, content); };

// ---------- assets ----------
cpSync(join(here, 'assets'), join(out, 'assets'), { recursive: true });
const dist = join(ui, 'dist'), lib = join(out, 'assets', 'zhaoui');
mkdirSync(lib, { recursive: true });
for (const f of readdirSync(dist)) if (statSync(join(dist, f)).isFile() && !f.endsWith('.map')) cpSync(join(dist, f), join(lib, f));
cpSync(join(dist, 'modular'), join(lib, 'modular'), { recursive: true, filter: (s) => !s.endsWith('.map') });
write('assets/zhaoui/index.html', `<!doctype html><meta charset="utf-8"><title>ZhaoUI 下载文件</title><h1>ZhaoUI ${version} 下载文件</h1><ul>${[...readdirSync(lib).filter((f) => f !== 'index.html' && f !== 'modular'), ...readdirSync(join(lib, 'modular')).map((f) => 'modular/' + f)].map((f) => `<li><a href="${f}">${f}</a></li>`).join('')}</ul>`);
// the zip of everything: the files under assets/zhaoui plus the changelog and the third-party notices, inside one folder named after the version
const zipName = `zhaoui-${version}.zip`;
makeZip({ top: `zhaoui-${version}`, out: join(out, 'assets', zipName), fill: (stage) => {
  for (const f of readdirSync(dist)) if (statSync(join(dist, f)).isFile()) cpSync(join(dist, f), join(stage, f));
  cpSync(join(dist, 'modular'), join(stage, 'modular'), { recursive: true });
  for (const f of ['CHANGELOG.md', 'THIRD_PARTY_NOTICES.md', 'README.md']) cpSync(join(ui, f), join(stage, f));
} });
// the templates: standalone pages whose links to the library point at ../assets/zhaoui on the site and at zhaoui/ inside the zip
const tplZipName = `zhaoui-templates-${version}.zip`, tplDir = join(here, 'templates');
for (const t of TEMPLATES) write(`templates/${t.key}.html`, read(join(tplDir, `${t.key}.html`)).replaceAll('@@LIB@@', '../assets/zhaoui'));
makeZip({ top: `zhaoui-templates-${version}`, out: join(out, 'assets', tplZipName), fill: (stage) => {
  for (const t of TEMPLATES) writeFileSync(join(stage, `${t.key}.html`), read(join(tplDir, `${t.key}.html`)).replaceAll('@@LIB@@', 'zhaoui'));
  mkdirSync(join(stage, 'zhaoui'));
  for (const f of ['zhaoui.min.css', 'zhaoui-utilities.min.css', 'zhaoui-marketing.min.css', 'zhaoui.min.js', 'zhaoui-icons.min.js']) cpSync(join(dist, f), join(stage, 'zhaoui', f));
  for (const f of ['THIRD_PARTY_NOTICES.md']) cpSync(join(ui, f), join(stage, 'zhaoui', f));
  writeFileSync(join(stage, 'README.txt'), `ZhaoUI ${version} 模板\n\n用浏览器直接打开 landing.html、pricing.html、login.html、dashboard.html。\n页面里的文案、数据和价格都是占位示例，请替换成你自己的内容。\n样式和脚本在 zhaoui/ 文件夹里，移动页面时请一起带走。\n文档：${SITE.origin}/\n许可：MIT，图标来自 Lucide（见 zhaoui/THIRD_PARTY_NOTICES.md）。\n`);
  cpSync(join(root, 'LICENSE'), join(stage, 'LICENSE'));
} });
// SHA256SUMS (same format as `sha256sum`, paths relative to the site root) and the installer that checks against it
const sumsOf = [...readdirSync(lib).filter((f) => f !== 'index.html' && statSync(join(lib, f)).isFile()).map((f) => `assets/zhaoui/${f}`), `assets/${zipName}`];
write('SHA256SUMS', sumsOf.sort().map((p) => `${createHash('sha256').update(readFileSync(join(out, p))).digest('hex')}  ${p}`).join('\n') + '\n');
write('install.sh', read(join(here, 'install', 'install.sh')).replaceAll('@@ORIGIN@@', SITE.origin).replaceAll('@@REPO@@', SITE.repo).replaceAll('@@VERSION@@', version));
const sizeOf = (f) => { const p = join(lib, f); return existsSync(p) ? statSync(p).size : null; }, gzOf = (f) => { const p = join(lib, f); return existsSync(p) ? gzipSync(new Uint8Array(readFileSync(p)), { level: 9 }).length : null; };
const tok = join(root, 'packages', 'tokens', 'dist'); mkdirSync(join(out, 'assets', 'tokens'), { recursive: true });
for (const f of ['zhaoui.css', 'zhaoui-style-glass.css', 'zhaoui.runtime.js']) cpSync(join(tok, f), join(out, 'assets', 'tokens', f));

// the playground inlines the library into its sandboxed frame
write('assets/playground-bundle.js', `window.ZH_PG = ${JSON.stringify({ css: ['zhaoui.min.css', 'zhaoui-utilities.min.css', 'zhaoui-marketing.min.css'].map((f) => read(join(dist, f))).join('\n'), js: ['zhaoui.min.js', 'zhaoui-icons.min.js'].map((f) => read(join(dist, f)).replace(/\/\/# sourceMappingURL=.*$/gm, '')).join(';\n') })};\n`);

// one hash over everything the pages load, used as ?v= on the asset links (see layout.mjs)
{ const h = createHash('sha256'), files = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? files(join(d, e.name)) : [join(d, e.name)]).sort();
  for (const f of [...files(join(out, 'assets')).filter((f) => !f.endsWith('.zip') && !f.endsWith('index.html')), ...files(join(ui, 'docs')).filter((f) => /\.(md|json)$/.test(f)), join(ui, 'CHANGELOG.md')]) h.update(readFileSync(f));
  BUILD.v = h.digest('hex').slice(0, 10); }

// ---------- pages ----------
const pages = [];   // { path, html, title, description, group, keywords, noindex }
function add(path, p, o = {}) {
  const html = page({ path, version, ...o, ...p });
  pages.push({ path, html, title: p.title, description: p.description, group: o.group || '页面', keywords: o.keywords || '', noindex: o.noindex });
  write(path, html);
}
add('index.html', homePage({ metas, faq, gz, desc }), { group: '首页' });
for (const g of GUIDE) add(`guide/${g.key}.html`, guidePage(g.key, join(ui, 'docs')), { section: 'guide', side: guideSide(), sideLabel: '指南目录', group: '指南', numbered: true, keywords: g.desc });
add('changelog.html', changelogPage(ui), { section: 'changelog', side: guideSide(), sideLabel: '指南目录', group: '指南' });
add('design/index.html', designIndex({ visualHref: 'visual.html' }), { section: 'design', side: designSide(), sideLabel: '设计目录', group: '设计' });
const cside = componentSide(metas);
add('components/index.html', componentIndex(metas, { abs }), { section: 'components', side: cside, sideLabel: '组件目录', group: '组件' });
for (const m of order(metas)) add(`components/${m.name}.html`, componentPage(m, { metas, path: `components/${m.name}.html` }), { section: 'components', side: cside, sideLabel: '组件目录', group: '组件', keywords: [m.name, ...(m.classes || []), ...(m.attributes || []).map((a) => a.name), ...(m.events || []).map((e) => e.name), ...(m.methods || []).map((x) => x.name)].join(' ') });
const kbOf = (n) => (n >= 1024 * 100 ? (n / 1024 / 1024).toFixed(1) + ' MB' : (n / 1024).toFixed(1) + ' KB');
add('templates/index.html', templatesPage({ version, zip: { name: tplZipName, size: statSync(join(out, 'assets', tplZipName)).size }, kb: kbOf }), { section: 'templates', group: '模板', keywords: '模板 落地页 价格页 登录页 后台 仪表盘 下载', wide: true });
for (const t of TEMPLATES) pages.push({ path: `templates/${t.key}.html`, title: `${t.title}模板`, description: t.desc, group: '模板', keywords: t.tags.join(' '), noindex: true });
add('playground.html', playgroundPage({ metas }), { section: 'playground', group: '工具' });
const coreIcons = (read(join(ui, 'docs', 'quickstart.md')).match(/(\d+) 个内置图标/) || [])[1]; if (!coreIcons) { console.error('cannot read the core icon count from docs/quickstart.md'); process.exit(1); }
const dl = downloadPage({ version, coreIcons, repo: SITE.repo, zip: { name: zipName, size: statSync(join(out, 'assets', zipName)).size }, sizeOf, gzOf });
const dlId = (text) => (dl.headings.find((h) => h.text === text) || {}).id;   // heading ids come from the page itself, so the side menu cannot drift from it
const dlItem = (text) => { const id = dlId(text); if (!id) { console.error(`download page has no heading "${text}"`); process.exit(1); } return { label: text, href: `download.html#${id}` }; };
add('download.html', dl, { section: 'download', group: '工具', sideLabel: '下载目录', keywords: '下载 压缩包 zip 命令行 安装 curl 引入 CDN 直接引用 modular 营销',
  side: [
    { title: '安装方式', items: ['下载全部文件', '命令行安装', '不下载，直接引用'].map(dlItem) },
    { title: '文件说明', items: ['核对下载的文件', '单个文件', '按需加载', '营销页区块的用法'].map(dlItem) },
    { title: '相关页面', items: [{ label: '快速开始', href: 'guide/quickstart.html' }, { label: '营销页区块预览', href: 'components/marketing.html' }, { label: '更新日志', href: 'changelog.html' }, { label: 'GitHub 仓库', href: SITE.repo }] },
  ] });
add('404.html', { title: '页面不存在', description: '这个页面不存在，可能是链接写错了或页面已经搬走。', body: '<h1>页面不存在</h1><p class="s-lead">这个页面不存在，可能是链接写错了或页面已经搬走。</p><p><a class="zh-btn primary" href="index.html">回到首页</a> <a class="zh-btn" href="components/index.html">浏览组件</a></p>', home: true }, { group: '页面', noindex: true });

// the full visual demo, with its asset links pointed at the copies under assets/tokens
const demoOut = join(out, 'design', 'visual.html');
const r = spawnSync(process.execPath, [join(root, 'demo', 'build.mjs'), '--out', demoOut], { encoding: 'utf8' });
if (r.status !== 0) { console.error(r.stdout + r.stderr); process.exit(1); }
write('design/visual.html', read(demoOut).replace(/(href|src)="[^"]*zhaoui\/packages\/tokens\/dist\//g, '$1="../assets/tokens/').replace('</head>', `<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">\n<link rel="canonical" href="${abs('design/visual.html')}">\n</head>`));
pages.push({ path: 'design/visual.html', title: '完整视觉演示', description: 'ZhaoUI 设计语言的完整视觉演示：色彩、字体、间距、圆角、阴影、动效、组件与交互模式。', group: '设计', keywords: '色彩 字体 间距 动效 Token 品牌色 涨跌色' });

// ---------- Markdown copies, search index, sitemap, robots, llms ----------
for (const f of readdirSync(join(ui, 'docs', 'components'))) cpSync(join(ui, 'docs', 'components', f), join(out, 'components', f));
for (const g of GUIDE) cpSync(join(ui, 'docs', `${g.key}.md`), join(out, 'guide', `${g.key}.md`));
const index = pages.filter((p) => !p.noindex).map((p) => ({ t: p.title, u: p.path, d: p.description, g: p.group, k: p.keywords }));
write('assets/search-index.js', `window.ZH_SITE_INDEX = ${JSON.stringify(index)};\n`);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.filter((p) => !p.noindex).map((p) => `  <url><loc>${abs(p.path === 'index.html' ? '' : p.path)}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${abs('sitemap.xml')}\n`);
const llms = read(join(ui, 'docs', 'llms.txt')).replace(/\]\(components\/([\w-]+)\.md\)/g, (_, n) => `](${abs(`components/${n}.html`)})`).replace(/\]\(([\w-]+)\.md\)/g, (_, n) => `](${abs(`guide/${n}.html`)})`).replace(/\]\(llms-full\.txt\)/, `](${abs('llms-full.txt')})`);
write('llms.txt', llms); write('llms-full.txt', read(join(ui, 'docs', 'llms-full.txt')));

// ---------- check every link we just wrote ----------
const problems = checkLinks(out);
console.log(`site: ${pages.length} pages -> site/dist-site (${(pages.reduce((a, p) => a + (p.html || '').length, 0) / 1024).toFixed(0)} KB of generated HTML)`);
if (problems.length) { console.log(`links: ${problems.length} problems`); problems.slice(0, 25).forEach((p) => console.log('  ' + p)); process.exit(1); }
console.log('links: all relative links and anchors resolve');
