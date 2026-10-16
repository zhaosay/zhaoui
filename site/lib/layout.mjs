// The page shell shared by every page of the site: head (SEO tags, structured data), top navigation, side menu, article, table of contents, footer.
import { SITE, abs } from '../config.mjs';
import { esc } from '../../packages/ui/scripts/facts.mjs';

export const TOP = [
  { key: 'guide', label: '指南', href: 'guide/quickstart.html', icon: 'book-open' },
  { key: 'design', label: '设计', href: 'design/index.html', icon: 'palette' },
  { key: 'components', label: '组件', href: 'components/index.html', icon: 'layout-dashboard' },
  { key: 'templates', label: '模板', href: 'templates/index.html', icon: 'layout-grid' },
  { key: 'playground', label: '在线试用', href: 'playground.html', icon: 'play' },
  { key: 'download', label: '下载', href: 'download.html', icon: 'download' },
  { key: 'changelog', label: '更新日志', href: 'changelog.html', icon: 'history' },
];

/** From the page at `from` (path under the site root) to `to`. */
export const up = (from) => '../'.repeat(from.split('/').length - 1);
export const rel = (from, to) => up(from) + to;
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

/** Set by the build: a hash of everything the pages load.  Asset links carry it as ?v=..., so a changed file gets a new address and an edge cache cannot keep serving the old one. */
export const BUILD = { v: '' };
const ver = (p) => (BUILD.v ? `${p}?v=${BUILD.v}` : p);

function sideHtml(side, path, label) {
  if (!side) return '';
  let n = 0;   // groups marked numbered share one running count: 1, 2, 3 ...
  const items = side.map((g) => `<li class="zh-side-group">${esc(g.title)}</li>\n${g.items.map((it) => `<li><a href="${rel(path, it.href)}"${it.href === path ? ' aria-current="page"' : ''}${g.numbered ? ` data-num="${++n}"` : ''}>${esc(it.label)}</a></li>`).join('\n')}`).join('\n');
  return `<nav class="zh-side" data-zh-side data-collapsible="false" aria-label="${esc(label)}"><ul>\n${items}\n</ul></nav>`;
}
function tocHtml(headings, numbered) {
  const hs = headings.filter((h) => h.level === 2 || h.level === 3); if (hs.length < 2) return '';
  let o = '<ul>', open = false, a = 0, b = 0;
  const num = (h) => { if (!numbered) return ''; if (h.level === 2) { a++; b = 0; return `<span class="s-num">${a}.</span>`; } b++; return `<span class="s-num">${a}.${b}</span>`; };
  hs.forEach((h, i) => { if (h.level === 2) { if (open) o += '</ul></li>'; o += `<li><a href="#${h.id}">${num(h)}${esc(h.text)}</a>`; open = true; const nextIs3 = hs[i + 1] && hs[i + 1].level === 3; if (nextIs3) o += '<ul>'; else { o += '</li>'; open = false; } }
    else { o += `<li><a href="#${h.id}">${num(h)}${esc(h.text)}</a></li>`; if (!hs[i + 1] || hs[i + 1].level === 2) { o += '</ul></li>'; open = false; } } });
  return `<nav data-zh-anchor data-offset="84" aria-label="本页目录"><p class="s-toc-title">本页目录</p>${o}</ul></nav>`;
}

export function page(o) {
  const { path, section = '', title, description, body, headings = [], side = null, sideLabel = '目录', ld = [], crumbs = [], home = false, ogType = 'article', dates = {}, robots = 'index,follow,max-snippet:-1,max-image-preview:large' } = o;
  const author = { '@type': 'Person', name: SITE.author.name, url: SITE.author.url };
  // component and guide pages have a Markdown copy next to them; say so in the head so a crawler or a language-model agent can find it
  const mdCopy = /^(components|guide)\/[\w-]+\.html$/.test(path) && path !== 'components/index.html' ? path.replace(/\.html$/, '.md') : '';
  const R = (p) => rel(path, p), full = home ? title : `${title} | ${SITE.name}`, url = abs(path === 'index.html' ? '' : path);
  const bc = home ? [] : [{ name: '首页', href: 'index.html' }, ...crumbs, { name: title, href: path }];
  const ldAll = [
    { '@context': 'https://schema.org', '@type': home ? 'WebSite' : 'TechArticle', ...(home ? { name: SITE.name, url: abs(), description, inLanguage: SITE.lang } : { headline: title, description, inLanguage: SITE.lang, url, mainEntityOfPage: url, image: abs('assets/og.png'), datePublished: dates.published, dateModified: dates.modified, author, publisher: author, license: SITE.license, isPartOf: { '@type': 'WebSite', name: SITE.name, url: abs() } }) },
    ...(bc.length ? [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: bc.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.href === 'index.html' ? '' : c.href) })) }] : []),
    ...ld,
  ];
  const nav = TOP.map((t) => `<li><a class="zh-nav-link" href="${R(t.href)}"${t.key === section ? ' aria-current="page"' : ''} data-icon="${t.icon}">${t.label}</a></li>`).join('');
  const crumbHtml = bc.length ? `<nav aria-label="面包屑" class="s-crumb"><ol class="zh-crumb">${bc.map((c, i) => i === bc.length - 1 ? `<li aria-current="page">${esc(c.name)}</li>` : `<li><a href="${R(c.href)}">${esc(c.name)}</a></li>`).join('')}</ol></nav>` : '';
  const sideNav = sideHtml(side, path, sideLabel), toc = tocHtml(headings, o.numbered);
  return `<!doctype html>
<html lang="${SITE.lang}" data-audience="c" data-mode="light" data-density="standard">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${home ? 'website' : ogType}"><meta property="og:site_name" content="${SITE.name}"><meta property="og:locale" content="zh_CN"><meta property="og:title" content="${esc(full)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url}">
<meta property="og:image" content="${abs('assets/og.png')}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="ZhaoUI：不依赖框架的中文 UI 组件库">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(full)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${abs('assets/og.png')}">
<link rel="alternate" type="text/plain" href="${abs('llms.txt')}" title="llms.txt">${mdCopy ? `
<link rel="alternate" type="text/markdown" href="${abs(mdCopy)}" title="Markdown">` : ''}${dates.modified ? `
<meta property="article:modified_time" content="${dates.modified}">` : ''}
<link rel="icon" href="${R('assets/favicon.svg')}" type="image/svg+xml">
<link rel="stylesheet" href="${R(ver('assets/zhaoui/zhaoui.min.css'))}">
<link rel="stylesheet" href="${R(ver('assets/zhaoui/zhaoui-utilities.min.css'))}">
<link rel="stylesheet" href="${R(ver('assets/zhaoui/zhaoui-marketing.min.css'))}">
<link rel="stylesheet" href="${R(ver('assets/site.css'))}">
<script>try{var t=JSON.parse(localStorage.getItem('zhaoui-site-theme')||'null');if(t){var h=document.documentElement;for(var k in t)h.setAttribute('data-'+k,t[k]);}}catch(e){}</script>
${ldAll.map((x) => `<script type="application/ld+json">${json(x)}</script>`).join('\n')}
</head>
<body data-site-root="${up(path) || './'}">
<script src="${R(ver('assets/zhaoui/zhaoui.min.js'))}"></script><script src="${R(ver('assets/zhaoui/zhaoui-icons.min.js'))}"></script><!-- first, because the examples in the page call ZhaoUI as they are parsed -->
<a class="s-skip" href="#main">跳到正文</a>
<header class="zh-nav zh-nav--contained s-nav" data-zh-nav aria-label="主导航">
  <a class="zh-nav-logo" href="${R('index.html')}"><i aria-hidden="true"></i><span>${SITE.name}</span></a>
  <ul class="zh-nav-links">${nav}</ul>
  <div class="zh-nav-right">
    <button class="zh-nav-search" type="button" data-site-search aria-label="搜索，快捷键 Ctrl K"><i data-i="search" data-s="18"></i><span class="zh-nav-st">搜索文档与组件…</span><span class="zh-kbd" data-mod>Ctrl</span><span class="zh-kbd">K</span></button>
    <button class="zh-nav-iconbtn zh-nav-search-icon" type="button" data-site-search aria-label="搜索"><i data-i="search" data-s="20"></i></button>
    <button class="zh-nav-iconbtn" type="button" data-zh-popover="#s-theme" data-placement="bottom-end" aria-label="主题设置"><i data-i="sun" data-s="20"></i></button>
  </div>
</header>
<div id="s-theme" hidden>
  <div class="s-theme" role="group" aria-label="主题设置">
    <p class="s-theme-h">明暗</p>
    <div class="zh-btn-group" role="group" aria-label="明暗"><button class="zh-btn sm" type="button" data-site-theme="mode:light" aria-pressed="false">亮色</button><button class="zh-btn sm" type="button" data-site-theme="mode:dark" aria-pressed="false">暗色</button></div>
    <p class="s-theme-h">受众</p>
    <div class="zh-btn-group" role="group" aria-label="受众"><button class="zh-btn sm" type="button" data-site-theme="audience:b" aria-pressed="false">B 端</button><button class="zh-btn sm" type="button" data-site-theme="audience:c" aria-pressed="false">C 端</button></div>
    <p class="s-theme-h">密度</p>
    <div class="zh-btn-group" role="group" aria-label="密度"><button class="zh-btn sm" type="button" data-site-theme="density:compact" aria-pressed="false">紧凑</button><button class="zh-btn sm" type="button" data-site-theme="density:standard" aria-pressed="false">标准</button><button class="zh-btn sm" type="button" data-site-theme="density:comfortable" aria-pressed="false">宽松</button></div>
  </div>
</div>
${home ? `<main id="main" class="s-home">\n${body}\n</main>` : `<div class="s-shell${side ? ' has-side' : ''}${toc ? ' has-toc' : ''}${o.wide ? ' is-wide' : ''}">
${side ? `<div class="s-side">${sideNav}</div>` : ''}
<main id="main" class="s-main">
${side ? `<button class="zh-btn sm s-side-btn" type="button" data-zh-open="#s-drawer"><i data-i="menu"></i>${esc(sideLabel)}</button>` : ''}
${crumbHtml}
<article class="s-article${o.numbered ? ' is-numbered' : ''}">
${body}
</article>
</main>
${toc ? `<div class="s-toc">${toc}</div>` : ''}
</div>`}
<footer class="zh-footer s-footer">
  <span>${SITE.name} ${o.version || ''} · 许可证尚未确定（目前仅团队内部使用）</span>
  <nav aria-label="页脚"><ul class="zh-footer-links"><li><a href="${R('guide/quickstart.html')}">快速开始</a></li><li><a href="${R('components/index.html')}">组件</a></li><li><a href="${R('changelog.html')}">更新日志</a></li><li><a href="${R('llms.txt')}">llms.txt</a></li><li><a href="${R('llms-full.txt')}">llms-full.txt</a></li><li><a href="${R('sitemap.xml')}">站点地图</a></li><li><a href="${R('download.html')}">下载</a></li><li><a href="${SITE.repo}" rel="noopener">GitHub</a></li></ul></nav>
</footer>
${side ? `<aside class="zh-drawer zh-drawer--left" id="s-drawer" aria-label="${esc(sideLabel)}"><div class="s-drawer-head"><strong>${esc(sideLabel)}</strong><button class="zh-btn sm text" type="button" data-zh-close>关闭</button></div>${sideHtml(side, path, sideLabel + '（手机）')}</aside>` : ''}
<script src="${R(ver('assets/search-index.js'))}"></script>
<script src="${R(ver('assets/site.js'))}"></script>
${(o.scripts || []).map((s) => `<script src="${R(ver(s))}"></script>`).join('\n')}
</body>
</html>
`;
}
