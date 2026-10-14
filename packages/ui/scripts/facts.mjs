// Facts shared by every page that describes the library (docs/gallery.html and the website in site/): component groups, the FAQ, one-line description.
// The FAQ feeds both the visible text and the FAQPage structured data, so they can never disagree.
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const GROUPS = [
  ['基础与布局', ['layout', 'marketing', 'card', 'descr', 'result', 'pageheader', 'footer', 'image', 'code', 'kbd', 'btngroup', 'list', 'comment', 'maskbar']],
  ['表单与输入', ['form', 'input', 'number', 'otp', 'textarea', 'inline-edit', 'slider', 'rating', 'tag']],
  ['选择与日期', ['select', 'cascader', 'date', 'daterange', 'time', 'datetime', 'calendar']],
  ['数据展示', ['table', 'pager', 'tree', 'timeline', 'steps', 'progress', 'ring', 'badge', 'avatar', 'carousel', 'marquee', 'upload', 'chart']],
  ['导航', ['navbar', 'side', 'breadcrumb', 'tabs', 'anchor', 'collapse', 'backtop']],
  ['反馈与浮层', ['feedback', 'spinner', 'dialog', 'message', 'dropdown', 'menu', 'tooltip', 'popover', 'popconfirm', 'command']],
];
// examples whose script opens something: shown behind a run button instead of firing on page load
export const RUN_BUTTON = new Set(['dialog', 'message']);


export function makeFaq({ metas, gz }) {
  return [
    ['ZhaoUI 是什么？', `ZhaoUI 是一套不依赖框架的中文 UI 组件库。引入 zhaoui.css 和 zhaoui.js 两个文件，用 data-zh-* 属性或全局对象 ZhaoUI 就能使用，共 ${metas.length} 个组件。`],
    ['怎么引入 ZhaoUI？', '在页面里加 <link rel="stylesheet" href="zhaoui.css">，并在 </body> 前加 <script src="zhaoui.js"></script>，不要加 defer。之后组件按标记自动初始化，动态插入的组件也会自动初始化。'],
    ['ZhaoUI 需要 jQuery、Vue 或 React 吗？', '不需要。它是原生 HTML、CSS 和 JavaScript，没有任何运行时依赖。'],
    ['ZhaoUI 支持哪些浏览器？', '目标是 Chrome / Edge 111+、Safari 16.4+、Firefox 113+。自动测试在 Chromium、Firefox、WebKit 三个引擎的最新版上运行，更旧的版本没有测过。'],
    ['ZhaoUI 有多大？', gz('zhaoui.js') && gz('zhaoui.css') ? `压缩后 JavaScript 约 ${gz('zhaoui.js')} KB（gzip），CSS 约 ${gz('zhaoui.css')} KB（gzip）；公共类是可选的单独文件，约 ${gz('zhaoui-utilities.css') || '9'} KB。日期选择、下拉选择等可以按需加载。` : '体积见文档「快速开始」。'],
    ['ZhaoUI 支持暗色模式和多主题吗？', '支持。在 <html> 上设置 data-mode（light / dark）、data-audience（b / c，即 B 端与 C 端）、data-density（compact / standard / comfortable），或调用 ZhaoUI.setTheme()；品牌色可以用 ZhaoUI.setBrand() 一键换。'],
    ['ZhaoUI 的无障碍做到什么程度？', '组件带键盘操作和 ARIA 角色，焦点管理在弹层里被限制并在关闭后还原，开启系统“减少动态效果”时动画会立即结束，并适配 Windows 高对比度（后者只在 Chromium 模拟下验证过，没有在真机上测）。'],
    ['ZhaoUI 的许可证是什么？', '目前仅在团队内部使用，开源许可证还没有确定；确定后会写在发布页和 package.json 里。'],
  ];
}

export const makeDesc = (n) => `ZhaoUI 是不依赖框架的中文 UI 组件库：一个 CSS 加一个 JS，用 data-zh-* 属性声明，共 ${n} 个组件，每个都有可复制的示例、事件与方法说明，支持亮暗、B/C 端主题和无障碍。`;

// which on-demand module (modular/<name>.js) holds a component that is not in the core package
export const MODULE_OF = { upload: 'upload', tree: 'tree', chart: 'chart', command: 'command', select: 'select', cascader: 'select', date: 'date', daterange: 'date', time: 'date', datetime: 'date', calendar: 'date' };
