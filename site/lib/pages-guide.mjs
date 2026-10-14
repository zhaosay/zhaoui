// Guide pages (from packages/ui/docs/*.md), the changelog and the design overview.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { md } from './md.mjs';
import { esc } from '../../packages/ui/scripts/facts.mjs';

export const GUIDE = [
  { key: 'quickstart', label: '快速开始', desc: '一个 CSS 加一个 JS 引入 ZhaoUI，两种用法，事件与动态内容，按需引入。' },
  { key: 'theme', label: '主题', desc: '用 data-mode、data-audience、data-density、data-brand 等属性切换亮暗、B/C 端、密度与品牌色。' },
  { key: 'icons', label: '图标', desc: '内置的图标、完整图标包的用法，以及如何增加自己的图标。' },
  { key: 'styles', label: '样式类', desc: '不需要 JS 就能使用的样式类：按钮、提示气泡等。' },
  { key: 'utilities', label: '公共类', desc: '可选的公共类文件：间距、布局、文字、响应式显示隐藏和动画。' },
];
export const guideSide = () => [
  { title: '指南', numbered: true, items: [...GUIDE.map((g) => ({ label: g.label, href: `guide/${g.key}.html` })), { label: '更新日志', href: 'changelog.html' }] },
];

// links inside docs/*.md point at sibling .md files; on the site they are pages
const guideLink = (from) => (u) => {
  if (/^(https?:|#|mailto:)/.test(u)) return u;
  let m = u.match(/^components\/([\w-]+)\.md(#.*)?$/); if (m) return `../components/${m[1]}.html${m[2] || ''}`;
  m = u.match(/^([\w-]+)\.md(#.*)?$/); if (m) return (GUIDE.some((g) => g.key === m[1]) ? `${m[1]}.html` : `../${m[1]}.html`) + (m[2] || '');
  return u;
};

export function guidePage(key, docsDir) {
  const g = GUIDE.find((x) => x.key === key), { html, headings } = md(readFileSync(join(docsDir, `${key}.md`), 'utf8'), { link: guideLink() });
  const h1 = headings.find((h) => h.level === 1);
  return { title: h1 ? h1.text : g.label, description: g.desc, body: html, headings: headings.filter((h) => h.level > 1), crumbs: [{ name: '指南', href: 'guide/quickstart.html' }] };
}

export function changelogPage(pkgDir) {
  const { html, headings } = md(readFileSync(join(pkgDir, 'CHANGELOG.md'), 'utf8'));
  return { title: '更新日志', description: 'ZhaoUI 各版本的变化：新增组件、构建产物、无障碍修正和已知限制。', body: html, headings: headings.filter((h) => h.level > 1) };
}

export function designIndex({ visualHref }) {
  const body = `<h1>设计规范</h1>
<p class="s-lead">ZhaoUI 是一套跨 Web、桌面和 H5 的设计语言：同一组设计 Token 驱动所有组件，B 端（中控、内容管理）与 C 端（面向公众、多品牌）共用核心，差异通过主题属性切换。</p>
<h2 id="visual">完整视觉演示</h2>
<p>色彩、字体、间距、圆角、阴影、动效、涨跌色、品牌色提取、交互模式和治理规范都在一页里，可以切换品牌、亮暗、密度、B/C 端和屏幕档位。</p>
<p><a class="zh-btn primary" href="${visualHref}">打开完整视觉演示</a></p>
<h2 id="principles">原则</h2>
<ul>
<li><strong>一套 Token</strong>：颜色、字体、间距、圆角、阴影、动效时长都是 <code class="zh-code-inline">--zh-*</code> 变量，组件不写死数值，换主题就是换变量。</li>
<li><strong>颜色用 OKLCH 生成</strong>：品牌色按主色与可读性规则派生一整套色阶；主色选满足 4.5:1 对比度的最鲜艳一档，亮色主色（如黄色）会自动改用深色按钮文字。</li>
<li><strong>文字用带 text 的一档</strong>：文字、链接、文字按钮使用 <code class="zh-code-inline">--zh-color-primary-text</code> 等达标的颜色，而不是品牌底色。</li>
<li><strong>图标</strong>：线性图标（来自 Lucide，ISC 许可），不使用 emoji。</li>
<li><strong>图表</strong>：固定 8 色分类色板，只有一条纵轴，不做双纵轴；涨跌色可按地区切换（<code class="zh-code-inline">data-trend</code>）。</li>
<li><strong>可访问</strong>：键盘可达、焦点可见、减少动态效果时保留淡入淡出、适配 Windows 高对比度。</li>
</ul>
<h2 id="dimensions">主题维度</h2>
<div class="zh-table-wrap"><table class="zh-table"><thead><tr><th scope="col">维度</th><th scope="col">属性</th><th scope="col">取值</th></tr></thead><tbody>
<tr><td data-label="维度">明暗</td><td data-label="属性"><code class="zh-code-inline">data-mode</code></td><td data-label="取值">light、dark</td></tr>
<tr><td data-label="维度">受众</td><td data-label="属性"><code class="zh-code-inline">data-audience</code></td><td data-label="取值">b（B 端）、c（C 端）</td></tr>
<tr><td data-label="维度">密度</td><td data-label="属性"><code class="zh-code-inline">data-density</code></td><td data-label="取值">compact、standard、comfortable</td></tr>
<tr><td data-label="维度">风格</td><td data-label="属性"><code class="zh-code-inline">data-style</code></td><td data-label="取值">flat（默认）、glass（玻璃拟态，实验性）</td></tr>
<tr><td data-label="维度">涨跌色</td><td data-label="属性"><code class="zh-code-inline">data-trend</code></td><td data-label="取值">cn（红涨绿跌）、intl（绿涨红跌）</td></tr>
<tr><td data-label="维度">品牌色</td><td data-label="属性"><code class="zh-code-inline">data-brand</code> / <code class="zh-code-inline">ZhaoUI.setBrand()</code></td><td data-label="取值">任意颜色，或从 Logo 提取</td></tr>
</tbody></table></div>
<h2 id="browsers">浏览器</h2>
<p>目标是 Chrome / Edge 111+、Safari 16.4+、Firefox 113+。自动测试在 Chromium、Firefox、WebKit 三个引擎的最新版上运行，更旧的版本没有测过。</p>
<h2 id="more">相关文档</h2>
<ul><li><a href="../guide/theme.html">主题的用法</a></li><li><a href="../guide/utilities.html">公共类</a></li><li><a href="../components/index.html">全部组件</a></li></ul>`;
  return { title: '设计规范', description: 'ZhaoUI 的设计语言：Token 体系、OKLCH 色彩、B/C 端与亮暗主题、密度、图表色板与可访问性原则，附完整视觉演示。', body, headings: [{ level: 2, id: 'visual', text: '完整视觉演示' }, { level: 2, id: 'principles', text: '原则' }, { level: 2, id: 'dimensions', text: '主题维度' }, { level: 2, id: 'browsers', text: '浏览器' }, { level: 2, id: 'more', text: '相关文档' }] };
}
export const designSide = () => [{ title: '设计', items: [{ label: '概览', href: 'design/index.html' }] }, { title: '延伸', items: [{ label: '主题的用法', href: 'guide/theme.html' }, { label: '全部组件', href: 'components/index.html' }] }];
