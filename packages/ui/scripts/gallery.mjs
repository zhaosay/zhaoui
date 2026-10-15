// docs/gallery.html: every documented example on one readable page, built with ZhaoUI itself (side menu, cards, theme switches).
// The test page test/examples.generated.html is a different thing: raw examples for the tests, with no page around them.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GROUPS, RUN_BUTTON, esc, makeFaq, makeDesc } from './facts.mjs';

export function writeGallery({ out, metas, version, stats = [] }) {
  const gz = (n) => { const s = stats.find((x) => x.name === n); return s ? (s.gzip / 1024).toFixed(1) : null; };

  const FAQ = makeFaq({ metas, gz });
  const by = Object.fromEntries(metas.map((m) => [m.name, m]));
  const used = new Set(GROUPS.flatMap(([, n]) => n));
  const groups = GROUPS.map(([t, names]) => [t, names.filter((n) => by[n])]).concat([['其他', metas.map((m) => m.name).filter((n) => !used.has(n))]]).filter(([, n]) => n.length);


  const DESC = makeDesc(metas.length);
  const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
  const ldApp = { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'ZhaoUI', applicationCategory: 'DeveloperApplication', operatingSystem: 'Web', softwareVersion: version, inLanguage: 'zh-CN', description: DESC };
  const ldList = { '@context': 'https://schema.org', '@type': 'ItemList', name: 'ZhaoUI 组件', numberOfItems: metas.length, itemListElement: metas.map((m, i) => ({ '@type': 'ListItem', position: i + 1, name: m.title, url: `#c-${m.name}` })) };
  const ldFaq = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
  const menu = '<li class="zh-side-group">开始</li>\n<li><a href="#start">快速开始</a></li>\n' + groups.map(([t, names]) => `<li class="zh-side-group">${t}</li>\n${names.map((n) => `<li><a href="#c-${n}">${esc(by[n].title)}</a></li>`).join('\n')}`).join('\n') + '\n<li class="zh-side-group">更多</li>\n<li><a href="#faq">常见问题</a></li>';
  const section = (m) => {
    const scripts = [...m.example.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((x) => x[1]);
    const html = m.example.replace(/<script>[\s\S]*?<\/script>/g, '').replace(/<(\/?)main\b/g, '<$1div').trim();   // the page already has its <main>
    const code = m.example.trim();
    const run = RUN_BUTTON.has(m.name) && scripts.length
      ? `<button class="zh-btn primary g-run" data-code="${esc(scripts.join('\n'))}">运行示例</button>`
      : '';
    const live = RUN_BUTTON.has(m.name) ? '' : scripts.map((s) => `<script>${s}</script>`).join('\n');
    return `<section class="g-sec" id="c-${m.name}">
  <header class="g-head"><h2>${esc(m.title)}</h2><a class="zh-btn sm text" href="components/${m.name}.md">文档</a></header>
  <p class="g-sum">${esc(m.summary)}</p>
  <div class="g-stage" data-example="${m.name}" role="group" tabindex="0" aria-label="${esc(m.title)}示例">${html ? html + '\n' : ''}${run}${live}</div>
  <details class="g-code"><summary>查看代码</summary><pre class="zh-code" tabindex="0"><code>${esc(code)}</code></pre></details>
</section>`;
  };

  const page = `<!doctype html>
<html lang="zh-CN" data-audience="b" data-mode="light" data-density="standard">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>ZhaoUI 组件库：${metas.length} 个原生 HTML/CSS/JS 组件与可复制示例</title>
<meta name="description" content="${esc(DESC)}">
<meta name="robots" content="index,follow,max-snippet:-1">
<meta property="og:type" content="website"><meta property="og:locale" content="zh_CN"><meta property="og:site_name" content="ZhaoUI">
<meta property="og:title" content="ZhaoUI 组件库：${metas.length} 个原生 HTML/CSS/JS 组件与可复制示例"><meta property="og:description" content="${esc(DESC)}">
<!-- This page ships inside the package and is opened from disk; the same examples are on the website, which carries the canonical URLs. -->
<script type="application/ld+json">${json(ldApp)}</script>
<script type="application/ld+json">${json(ldList)}</script>
<script type="application/ld+json">${json(ldFaq)}</script>
<link rel="stylesheet" href="../dist/zhaoui.css">
<link rel="stylesheet" href="../dist/zhaoui-utilities.css">
<link rel="stylesheet" href="../dist/zhaoui-marketing.css">
<style>
  /* page chrome only: every colour, space and radius is a ZhaoUI variable */
  body { margin: 0; background: var(--zh-bg-subtle); color: var(--zh-text); font-family: var(--zh-font-sans); font-size: calc(var(--zh-font-base) * var(--zh-scale, 1)); line-height: var(--zh-line); }
  .g-top { position: sticky; top: 0; z-index: var(--zh-z-sticky); display: flex; flex-wrap: wrap; align-items: center; gap: 12px 24px; padding: 10px 24px; background: var(--zh-bg-elevated); border-bottom: 1px solid var(--zh-border); }
  .g-top h1 { margin: 0; font-size: 1.15em; font-weight: var(--zh-heading-weight); }
  .g-top small { color: var(--zh-text-tertiary); font-weight: 400; margin-inline-start: 8px; }
  .g-tools { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-inline-start: auto; }
  .g-shell { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: start; }
  .g-side { position: sticky; top: 53px; height: calc(100vh - 53px); }
  .g-side .zh-side { height: 100%; border-inline-end: 1px solid var(--zh-border); }
  .g-main { padding: 24px; max-width: 64rem; width: 100%; box-sizing: border-box; }
  .g-sec { scroll-margin-top: 72px; margin: 0 0 28px; }
  .g-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .g-head h2 { margin: 0; font-size: 1.25em; font-weight: var(--zh-heading-weight); }
  .g-sum { margin: 4px 0 12px; color: var(--zh-text-secondary); max-width: 60ch; }
  .g-stage { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 16px; padding: 24px; background: var(--zh-bg-elevated); border: 1px solid var(--zh-border); border-radius: var(--zh-radius-lg); min-width: 0; overflow-x: auto; }
  .g-stage > :is(div, section, form, ul, ol, table, p, nav, article, header, footer, dl, pre, figure, fieldset) { flex: 1 1 100%; min-width: 0; }
  .g-code { margin-top: 8px; }
  .g-code summary { cursor: pointer; color: var(--zh-text-secondary); font-size: .93em; padding: 4px 0; }
  .g-code pre { margin-top: 8px; max-height: 24rem; }
  .g-note { margin: 0 0 24px; padding: 12px 16px; border: 1px solid var(--zh-border); border-radius: var(--zh-radius-md); background: var(--zh-bg-elevated); color: var(--zh-text-secondary); }
  @media (max-width: 899px) { .g-shell { grid-template-columns: minmax(0, 1fr); } .g-side { display: none; } .g-main { padding: 16px; } .g-top { padding: 10px 16px; } .g-stage { padding: 16px; } }
</style>
</head>
<body>
<header class="g-top">
  <h1>ZhaoUI 组件库<small>${version} · ${metas.length} 个组件</small></h1>
  <div class="g-tools" role="toolbar" aria-label="主题">
    <div class="zh-btn-group" role="group" aria-label="明暗"><button class="zh-btn sm" data-theme="mode:light" aria-pressed="true">亮色</button><button class="zh-btn sm" data-theme="mode:dark" aria-pressed="false">暗色</button></div>
    <div class="zh-btn-group" role="group" aria-label="受众"><button class="zh-btn sm" data-theme="audience:b" aria-pressed="true">B 端</button><button class="zh-btn sm" data-theme="audience:c" aria-pressed="false">C 端</button></div>
    <div class="zh-btn-group" role="group" aria-label="密度"><button class="zh-btn sm" data-theme="density:compact" aria-pressed="false">紧凑</button><button class="zh-btn sm" data-theme="density:standard" aria-pressed="true">标准</button><button class="zh-btn sm" data-theme="density:comfortable" aria-pressed="false">宽松</button></div>
  </div>
</header>
<script src="../dist/zhaoui.js"></script><!-- before the examples: their inline scripts use ZhaoUI -->
<div class="g-shell">
  <div class="g-side"><nav class="zh-side" data-zh-side data-collapsible="false" aria-label="组件目录"><ul>
${menu}
  </ul></nav></div>
  <main class="g-main">
    <section class="g-sec" id="start">
      <header class="g-head"><h2>快速开始</h2></header>
      <p class="g-sum">${esc(FAQ[0][1])} 本页的每个示例都是组件文档里的原样代码，直接运行；右上角可以切换亮暗、B/C 端和密度，看同一段标记在不同主题下的样子。</p>
      <div class="g-stage" style="display:block"><pre class="zh-code" tabindex="0"><code>${esc(`<link rel="stylesheet" href="zhaoui.css">

<button class="zh-btn primary" data-zh-open="#dlg">打开</button>
<dialog class="zh-modal" id="dlg" aria-labelledby="t">
  <header id="t">你好</header>
  <div class="body">这是 ZhaoUI 的模态框。</div>
  <footer><button class="zh-btn primary" data-zh-close>知道了</button></footer>
</dialog>

<script src="zhaoui.js"></script>   <!-- 放在 </body> 前，不加 defer -->`)}</code></pre></div>
    </section>
${groups.map(([t, names]) => names.map((n) => section(by[n])).join('\n')).join('\n')}
    <section class="g-sec" id="faq">
      <header class="g-head"><h2>常见问题</h2></header>
${FAQ.map(([q, a]) => `      <h3>${esc(q)}</h3>\n      <p class="g-sum" style="margin-top:0">${esc(a)}</p>`).join('\n')}
    </section>
  </main>
</div>
<script>
  document.querySelectorAll('[data-theme]').forEach(function (b) {
    b.addEventListener('click', function () {
      var kv = b.getAttribute('data-theme').split(':'), o = {}; o[kv[0]] = kv[1]; ZhaoUI.setTheme(o);
      b.parentNode.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    });
  });
  document.querySelectorAll('.g-run').forEach(function (b) { b.addEventListener('click', function () { (new Function(b.getAttribute('data-code')))(); }); });
</script>
</body>
</html>
`;
  writeFileSync(join(out, 'gallery.html'), page);
}
