// The templates page: four complete, standalone pages (landing, pricing, login, dashboard) with a live preview of each and one zip to download.
import { esc } from '../../packages/ui/scripts/facts.mjs';

export const TEMPLATES = [
  { key: 'landing', title: '落地页', desc: '导航、首屏、特性卡、数据条、价格、常见问题和行动号召。营销页区块的完整搭法。', tags: ['营销页区块', '响应式', '亮暗主题'] },
  { key: 'pricing', title: '价格页', desc: '三档价格卡、方案对比表（窄屏变卡片）和常见问题。', tags: ['价格卡', '表格', '折叠面板'] },
  { key: 'login', title: '登录页', desc: '居中卡片、带校验提示的表单，示例脚本只做前端校验，没有提交到任何地方。', tags: ['表单', '校验', '消息提示'] },
  { key: 'dashboard', title: '后台首页', desc: '侧边菜单、关键指标、折线图和环形图、数据表格与分页。窄屏时隐藏侧栏。', tags: ['侧边菜单', '图表', '表格'] },
];

export function templatesPage({ version, zip, kb }) {
  const cards = TEMPLATES.map((t) => `<article class="zh-card tpl-card" id="${t.key}">
  <div class="tpl-head"><h2>${esc(t.title)}</h2><div class="tpl-actions"><a class="zh-btn sm" href="${t.key}.html" target="_blank" rel="noopener"><i data-i="external-link"></i>新窗口打开<span class="zh-sr-only">（${esc(t.title)}）</span></a></div></div>
  <p>${esc(t.desc)}</p>
  <div class="zh-tags">${t.tags.map((x) => `<span class="zh-tag">${esc(x)}</span>`).join('')}</div>
  <iframe class="tpl-frame" src="${t.key}.html" title="${esc(t.title)}预览" loading="lazy"></iframe>
</article>`).join('\n');
  const body = `<h1>模板</h1>
<p class="s-lead">四个完整的页面，用 ZhaoUI 搭成，拿来就能改。每个都有实时预览，整套打包成一个压缩包，解压后用浏览器直接打开。</p>
<p><a class="zh-btn primary xl" href="../assets/${zip.name}" download><i data-i="download" data-s="20"></i>下载全部模板（${kb(zip.size)}）</a></p>
<p class="zh-hint">压缩包里有四个 HTML 和它们用到的 ZhaoUI 文件（<code class="zh-code-inline">zhaoui/</code> 文件夹），不需要联网。页面里的文案、数据和价格都是占位示例，请替换成你自己的内容。</p>
<h2 id="preview">预览</h2>
<div class="tpl-list">
${cards}
</div>
<h2 id="use">怎么用</h2>
<ol>
  <li>下载并解压压缩包，用浏览器打开其中的 <code class="zh-code-inline">landing.html</code>。</li>
  <li>每个页面的样式和脚本都引用 <code class="zh-code-inline">zhaoui/</code> 文件夹，移动页面时请把这个文件夹一起带走，或者改里面的路径。</li>
  <li>想换品牌色，在页面里加一行 <code class="zh-code-inline">ZhaoUI.setBrand('#你的色值')</code>，整套配色会跟着变。</li>
  <li>想换成 B 端的外观，把 <code class="zh-code-inline">&lt;html&gt;</code> 上的 <code class="zh-code-inline">data-audience</code> 改成 <code class="zh-code-inline">b</code>。</li>
</ol>
<p>压缩包不在 <a href="../SHA256SUMS">SHA256SUMS</a> 的校验清单里：模板是示例文件，校验清单只覆盖库本身。</p>`;
  return { title: '模板', description: `用 ZhaoUI 搭的四个完整页面模板：落地页、价格页、登录页、后台首页，带实时预览，可整套下载（版本 ${version}）。`, body,
    headings: [{ level: 2, id: 'preview', text: '预览' }, { level: 2, id: 'use', text: '怎么用' }] };
}
