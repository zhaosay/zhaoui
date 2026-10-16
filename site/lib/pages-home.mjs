// The home page.  Built from the library's own marketing blocks (zhaoui-marketing.css), so it is also the proof that those blocks are enough for a real landing page.
import { esc, GROUPS } from '../../packages/ui/scripts/facts.mjs';
import { SITE, abs } from '../config.mjs';

export function homePage({ metas, faq, gz, desc, version }) {
  const f = (n) => gz(n) || '—', by = Object.fromEntries(metas.map((m) => [m.name, m]));
  const features = [
    ['package', '零依赖', `原生 HTML、CSS、JS。压缩后 JavaScript 约 ${f('zhaoui.js')} KB、CSS 约 ${f('zhaoui.css')} KB（gzip），不需要 jQuery、Vue 或 React。`],
    ['layers', `${metas.length} 个组件`, '表单、选择与日期、表格、树、上传、图表、导航、弹层、命令面板……每个都有实时示例和 API 说明。'],
    ['zap', '按需加载', `核心包 JS 约 ${f('modular/core.js')} KB；日期、下拉选择、上传、树、图表、命令面板可以单独加载。`],
    ['palette', '主题', '亮暗、B/C 端、三档密度、品牌色一键切换，全部由 CSS 变量驱动。'],
    ['shield-check', '可访问', '键盘操作、ARIA 角色、焦点管理、减少动态效果；展示页用 axe-core 审计，三种主题 0 违规。'],
    ['bot', '对 AI 友好', '每个页面都有同名的 Markdown，另有 llms.txt 与 llms-full.txt，方便模型和智能体读取与生成代码。'],
  ];
  const body = `<section class="zh-hero" id="top">
  <div class="zh-wrap zh-hero-grid">
    <div>
      <span class="zh-tag zh-tag--lg primary s-pill"><i data-i="zap"></i> 零依赖 · 原生 HTML/CSS/JS</span>
      <h1 class="zh-display">ZhaoUI：<em>不依赖框架</em>的中文 UI 组件库</h1>
      <p class="s-lead-home">引入一个 CSS 和一个 JS，用 <code class="zh-code-inline">data-zh-*</code> 属性声明组件，也可以调用全局对象 <code class="zh-code-inline">ZhaoUI</code>。${metas.length} 个组件，支持亮暗、B/C 端主题和无障碍。</p>
      <div class="zh-hero-actions"><a class="zh-btn primary xl" href="guide/quickstart.html">快速开始 <i data-i="arrow-right"></i></a><a class="zh-btn xl" href="components/index.html">浏览组件</a><a class="zh-btn xl text" href="playground.html"><i data-i="play"></i> 在线试用</a></div>
      <ul class="zh-stats"><li><b>${metas.length}</b><span>个组件</span></li><li><b>${f('zhaoui.js')} KB</b><span>JS（gzip）</span></li><li><b>0</b><span>运行时依赖</span></li></ul>
    </div>
    <div class="zh-card zh-float-card s-product">
      <span class="zh-tag zh-tag--filled primary zh-float-flag"><i data-i="zap"></i> 真实组件，不是截图</span>
      <h2 class="s-product-h">今日订单</h2>
      <div class="zh-stack">
        <div class="zh-inp"><span class="zh-inp-box"><i data-i="search" class="zh-inp-pre"></i><input class="zh-inp-el" placeholder="搜索订单号或客户" aria-label="搜索订单"></span></div>
        <ul class="zh-list">
          <li><div class="zh-list-main"><p class="zh-list-title">20261008-0086</p><p class="zh-list-desc">张三 · 上海</p></div><div class="zh-list-extra"><span class="zh-tag success">已发货</span></div></li>
          <li><div class="zh-list-main"><p class="zh-list-title">20261008-0087</p><p class="zh-list-desc">李四 · 北京</p></div><div class="zh-list-extra"><span class="zh-tag warning">待发货</span></div></li>
          <li><div class="zh-list-main"><p class="zh-list-title">20261008-0088</p><p class="zh-list-desc">王五 · 成都</p></div><div class="zh-list-extra"><span class="zh-tag info">已下单</span></div></li>
        </ul>
        <div class="zh-progress" data-value="68" data-name="本周完成度"></div>
        <div class="zh-row"><button class="zh-btn primary" type="button">新建订单</button><button class="zh-btn" type="button">导出</button></div>
      </div>
    </div>
  </div>
</section>
<section class="zh-section" id="why" aria-labelledby="why-h">
  <div class="zh-wrap">
    <p class="zh-eyebrow">为什么用它</p>
    <h2 class="zh-section-title" id="why-h">把界面里反复要做的事，一次做好</h2>
    <p class="zh-section-sub">颜色、间距、对比度、键盘和动效都由同一套规则管着，换品牌色或主题时整站一起变。</p>
    <div class="zh-feature-grid">${features.map(([i, t, d]) => `<div class="zh-card zh-feature"><span class="zh-tile"><i data-i="${i}"></i></span><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}</div>
  </div>
</section>
<section class="zh-section zh-section--subtle" id="live" aria-labelledby="live-h">
  <div class="zh-wrap">
    <p class="zh-eyebrow">现场看看</p>
    <h2 class="zh-section-title" id="live-h">下面都是真实的 ZhaoUI 组件</h2>
    <p class="zh-section-sub">可以点、可以输入。右上角的主题按钮能切换亮暗和 B/C 端。</p>
    <div class="zh-feature-grid">
      <div class="zh-card zh-feature"><h3 style="margin-top:0">操作与状态</h3><div class="zh-row"><button class="zh-btn primary">主要</button><button class="zh-btn">默认</button><button class="zh-btn text">文字</button><button class="zh-btn danger">危险</button></div>
        <div class="zh-tags" style="margin-top:16px"><span class="zh-tag success">已发布</span><span class="zh-tag warning">待审核</span><span class="zh-tag danger">失败</span><span class="zh-tag info">提示</span></div>
        <div class="zh-row" style="margin-top:16px"><label class="zh-check"><input type="checkbox" class="zh-switch" checked aria-label="通知"> 通知</label></div></div>
      <div class="zh-card zh-feature"><h3 style="margin-top:0">输入与选择</h3><div class="zh-stack"><select data-zh-select aria-label="状态"><option value="">全部状态</option><option>草稿</option><option>已发布</option></select><div data-zh-date data-value="2026-10-15" aria-label="日期"></div><div class="zh-rating" data-value="4" data-label="评分"></div></div></div>
      <div class="zh-card zh-feature"><h3 style="margin-top:0">数据</h3><div data-zh-chart data-type="area" data-height="150" data-title="近 7 天访问量" data-no-legend><script type="application/json">{"labels":["一","二","三","四","五","六","日"],"series":[{"name":"访问","data":[1200,1800,1500,2300,2100,2900,3200]}]}</script></div></div>
    </div>
  </div>
</section>
<section class="zh-section" id="fit" data-mode="dark" aria-labelledby="fit-h">
  <div class="zh-wrap">
    <p class="zh-eyebrow">适合与不适合</p>
    <h2 class="zh-section-title" id="fit-h">先看它适不适合你的项目</h2>
    <div class="zh-feature-grid">
      <div class="zh-card zh-feature"><span class="zh-tile"><i data-i="check"></i></span><h3>适合</h3><ul class="s-ticks"><li>后台管理页、内容站点，以及不想引入前端框架的页面</li><li>需要中文界面文案、键盘操作和无障碍支持的项目</li><li>需要亮暗、B/C 端和密度主题切换的产品</li></ul></div>
      <div class="zh-card zh-feature"><span class="zh-tile"><i data-i="triangle-alert"></i></span><h3>不适合</h3><ul class="s-ticks"><li>需要 IE 或旧版浏览器（目标是 Chrome / Edge 111+、Safari 16.4+、Firefox 113+）</li><li>需要堆叠、散点、地图等复杂图表</li><li>需要现成的 Vue 或 React 组件封装（目前没有，库本身是原生的）</li></ul></div>
    </div>
  </div>
</section>
<section class="zh-section" id="all" aria-labelledby="all-h">
  <div class="zh-wrap">
    <p class="zh-eyebrow">组件一览</p>
    <h2 class="zh-section-title" id="all-h">${metas.length} 个组件，一页一个</h2>
    <p class="zh-section-sub">点任意一个，看实时示例、代码和 API。</p>
    <div class="s-groups">${GROUPS.map(([t, ns]) => { const li = ns.filter((n) => by[n]); return `<div><h3>${esc(t)}</h3><p class="zh-tags">${li.map((n) => `<a class="zh-tag zh-tag--outline" href="components/${n}.html">${esc(by[n].title)}</a>`).join('')}</p></div>`; }).join('')}</div>
  </div>
</section>
<section class="zh-section zh-section--subtle" id="faq" aria-labelledby="faq-h">
  <div class="zh-wrap">
    <p class="zh-eyebrow">常见问题</p>
    <h2 class="zh-section-title" id="faq-h">你可能想先问这些</h2>
    <div class="s-faq">${faq.map(([q, a]) => `<div class="zh-card"><h3>${esc(q)}</h3><p>${esc(a)}</p></div>`).join('')}</div>
  </div>
</section>
<section class="zh-section zh-section--brand" id="start" aria-labelledby="start-h">
  <div class="zh-wrap">
    <h2 class="zh-section-title" id="start-h">三十秒，让第一个组件跑起来</h2>
    <p class="zh-section-sub" style="margin:0 auto 24px">引入两个文件，写一个按钮，就能打开对话框。</p>
    <div class="doc-code s-install"><button class="zh-btn sm s-copy" type="button" data-site-copy aria-label="复制代码">复制</button><pre class="zh-code" tabindex="0"><code class="lang-html">&lt;link rel="stylesheet" href="zhaoui.css"&gt;
&lt;button class="zh-btn primary" data-zh-open="#dlg"&gt;打开&lt;/button&gt;
&lt;script src="zhaoui.js"&gt;&lt;/script&gt;</code></pre></div>
    <div class="zh-hero-actions" style="justify-content:center"><a class="zh-btn xl" href="guide/quickstart.html">阅读快速开始</a><a class="zh-btn xl" href="playground.html">打开在线试用</a></div>
  </div>
</section>`;
  const ld = [{ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'ZhaoUI', url: abs(), applicationCategory: 'DeveloperApplication', operatingSystem: 'Web', inLanguage: 'zh-CN', description: desc, softwareVersion: version, license: SITE.license, downloadUrl: abs(`assets/zhaoui-${version}.zip`), releaseNotes: abs('changelog.html'), sameAs: [SITE.repo], programmingLanguage: ['JavaScript', 'CSS'], isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' }, author: { '@type': 'Person', name: SITE.author.name, url: SITE.author.url } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }];
  return { title: `ZhaoUI：不依赖框架的中文 UI 组件库（${metas.length} 个组件）`, description: desc, body, ld, home: true };
}
