# 快速开始

ZhaoUI 的原生版只需要两个文件：一个 CSS，一个 JS。不依赖任何框架，也不需要构建工具。

## 引入

```html
<!doctype html>
<html lang="zh-CN" data-audience="b" data-mode="light" data-density="standard">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="zhaoui.css">
</head>
<body>
  <button class="zh-btn primary" data-zh-open="#dlg">打开</button>
  <dialog class="zh-modal" id="dlg" aria-labelledby="t">
    <header id="t">你好</header>
    <div class="body">这是 ZhaoUI 的模态框。</div>
    <footer><button class="zh-btn primary" data-zh-close>知道了</button></footer>
  </dialog>

  <script src="zhaoui.js"></script>   <!-- 放在 </body> 前，你自己的内联脚本写在它后面 -->
</body>
</html>
```

`<html>` 上的 `data-` 属性决定外观，见 [主题](theme.md)。`zhaoui.js` 加载后会自动初始化页面上的组件，之后动态加入的组件也会被自动初始化，不需要手动调用。

## 文件

| 文件 | 说明 | 大小 |
|---|---|---|
| `zhaoui.css` | Token 变量 + 全部组件样式 | 190.2 KB → 165.2 KB，gzip 29.5 KB |
| `modular/core.css` | 核心：Token、基础、通用组件样式 | 157.7 KB → 136.6 KB，gzip 25.0 KB |
| `modular/select.css` | 下拉选择与级联选择的样式 | 8.8 KB → 7.8 KB，gzip 2.0 KB |
| `modular/upload.css` | 文件上传的样式 | 4.2 KB → 3.7 KB，gzip 1.2 KB |
| `modular/tree.css` | 树的样式 | 4.4 KB → 3.9 KB，gzip 1.2 KB |
| `modular/chart.css` | 基础图表的样式 | 2.5 KB → 2.2 KB，gzip 0.9 KB |
| `modular/command.css` | 命令面板的样式 | 3.2 KB → 2.9 KB，gzip 1.0 KB |
| `modular/date.css` | 日期、日期范围、时间、日期时间选择的样式 | 10.0 KB → 8.9 KB，gzip 2.2 KB |
| `zhaoui-utilities.css` | 可选：公共类（间距、布局、文字、响应式显示隐藏、动画） | 65.1 KB → 56.0 KB，gzip 9.5 KB |
| `zhaoui-marketing.css` | 可选：营销页区块（页宽、区块、hero、特性卡、价格卡） | 10.9 KB → 8.1 KB，gzip 2.3 KB |
| `zhaoui-style-glass.css` | 可选：玻璃拟态风格包（实验性） | 16.5 KB → 14.0 KB，gzip 1.9 KB |
| `zhaoui-icons.js` | 可选：完整 Lucide 图标集（372 个） | 67.0 KB → 62.6 KB，gzip 17.1 KB |
| `zhaoui.js` | 主题运行时 + 全部组件行为 + 内置图标 + 自动初始化 | 264.2 KB → 179.8 KB，gzip 57.9 KB |
| `modular/brand.js` | 品牌色运行时：ZhaoUI.setBrand()、Logo 取色（可选） | 22.6 KB → 13.7 KB，gzip 6.3 KB |
| `modular/core.js` | 核心：组件注册与自动初始化 + 通用组件行为（必须最先加载） | 123.8 KB → 83.9 KB，gzip 26.3 KB |
| `modular/select.js` | 下拉选择与级联选择的行为（在 core.js 之后加载） | 35.9 KB → 23.2 KB，gzip 7.7 KB |
| `modular/upload.js` | 文件上传的行为（在 core.js 之后加载） | 9.3 KB → 7.3 KB，gzip 3.1 KB |
| `modular/tree.js` | 树的行为（在 core.js 之后加载） | 7.7 KB → 5.5 KB，gzip 2.2 KB |
| `modular/chart.js` | 基础图表的行为（在 core.js 之后加载） | 12.4 KB → 8.7 KB，gzip 3.7 KB |
| `modular/command.js` | 命令面板的行为（在 core.js 之后加载） | 7.6 KB → 5.5 KB，gzip 2.5 KB |
| `modular/date.js` | 日期、日期范围、时间、日期时间选择的行为（在 core.js 之后加载） | 48.6 KB → 34.0 KB，gzip 10.5 KB |


- 全量版 `zhaoui.css` + `zhaoui.js` 已经包含 Token 变量、全部组件和 36 个内置图标，不需要别的文件。线上请用压缩版 `zhaoui.min.css` 和 `zhaoui.min.js`（JS 另带 `.map`，方便排查线上报错）。
- 需要更多图标时再引 `zhaoui-icons.js`，必须在 `zhaoui.js` 之后加载，见 [图标](icons.md)。
- `zhaoui-style-glass.css` 是可选的玻璃拟态风格包，见 [主题](theme.md) 里的说明。

**脚本位置**：把 `zhaoui.js` 放在 `</body>` 前、不加 `defer`，这样它后面的内联脚本可以直接使用 `ZhaoUI`。如果你把它放在 `<head>` 里并加了 `defer`，它要等页面解析完才执行，你的内联脚本就必须写在 `DOMContentLoaded` 里，否则会报 `ZhaoUI is not defined`：

```html
<script src="zhaoui.js" defer></script>
<script>
  document.addEventListener('DOMContentLoaded', function () { ZhaoUI.message('已就绪'); });
</script>
```

## 按需引入

全量版的 JS 压缩加 gzip 后约 57.9 KB。只要页面不用全部组件，就只引 `modular/` 下需要的文件：核心必需，其余按用到的组件加。

| 文件 | 内容 | JS 约（gzip） |
| --- | --- | --- |
| `modular/core` | 注册与自动初始化、对话框、标签页、下拉菜单、输入类、表格、导航、步骤条、时间线、菜单等通用组件 | 26.3 KB |
| `modular/select` | 下拉选择、级联选择 | 7.7 KB |
| `modular/date` | 日期、日期范围、时间、日期时间选择器，内嵌日历 | 10.5 KB |
| `modular/upload` | 文件上传 | 3.1 KB |
| `modular/tree` | 树 | 2.2 KB |
| `modular/chart` | 基础图表 | 3.7 KB |
| `modular/command` | 命令面板 | 2.5 KB |
| `modular/brand` | `ZhaoUI.setBrand()` 与 Logo 取色 | 6.3 KB |

```html
<link rel="stylesheet" href="modular/core.min.css">
<link rel="stylesheet" href="modular/tree.min.css">     <!-- 每个扩展都有同名的 CSS，用到哪个就加哪个 -->

<script src="modular/core.min.js"></script>             <!-- 必须最先加载 -->
<script src="modular/tree.min.js"></script>
```

- `core` 是必需的，并且必须最先加载；其余是可选的扩展，调换它们之间的顺序没有影响。`brand` 没有 CSS。
- 扩展文件晚于核心加载（比如动态插入 `<script>`）也没问题，页面上已有的对应元素会自动被初始化。
- 没加载对应文件时，`<select data-zh-select>`、`data-zh-tree` 等元素保持原样，不会报错；`ZhaoUI.upload`、`ZhaoUI.tree`、`ZhaoUI.chart`、`ZhaoUI.commandPalette`、`ZhaoUI.select` 等接口不存在（值为 `undefined`）；调用 `ZhaoUI.setBrand()` 会抛出明确的错误，告诉你要加载 `brand.min.js`。
- 在 `core` 之前加载扩展文件会报错：「load modular/core.js (or zhaoui.js) before this file」。
- 不确定用了哪些组件时，直接用全量版即可。

## 两种用法

**声明式**：在标记里写 `data-zh-*` 属性，不写 JS。适合模态框、抽屉、下拉菜单。

**命令式**：调用 `ZhaoUI` 上的方法，适合确认框、消息提示这类由代码触发的交互。

```js
ZhaoUI.message('保存成功');
ZhaoUI.dialog({ title: '删除文章？', content: '删除后无法恢复', danger: true })
  .then(function (ok) { if (ok) deleteArticle(); });
```

## 组件事件

组件用自定义事件通知你，事件名以 `zh:` 开头并会冒泡，可以在祖先元素上统一监听：

```js
document.addEventListener('zh:select', function (e) { console.log(e.detail.value); });
```

## 动态内容

框架或脚本往页面里插入新的组件标记后，库会在下一帧自动初始化。`ZhaoUI.init()` 可以放心重复调用：已经初始化过的元素会被跳过，不会初始化两次。如果你在一个隐藏的容器里准备好了内容、想立刻初始化，可以手动调用：

```js
ZhaoUI.init(containerElement);
```

## 表单重置与 hidden

- `<form>` 里的 `type="reset"` 按钮会一并重置输入框（含清除按钮）和 `data-zh-select`：可见的选择框、写回的原生值都回到初始状态。日期类选择器没有验证过随表单重置，需要时调用它自己的 `clear` 或 `set`。
- 任何带 `zh-` 类的元素加上 `hidden` 属性都会真正隐藏（库里已处理，不会被 `display:flex` 之类盖掉），可以直接用 `el.hidden = true/false` 切换空状态、表格、分页等，不必自己再写 `[hidden]` 的样式。

## 浏览器

目标是 Chrome / Edge 111+、Safari 16.4+、Firefox 113+。发布前的自动测试在 Chromium、Firefox、WebKit 三个引擎的最新版上运行，更旧的版本没有测过。

## 当前范围

已提供行为的组件：锚点目录、头像、返回顶部、徽标、面包屑、按钮组、内嵌日历、卡片、轮播、级联选择、图表、代码块、折叠面板、命令面板、评论、日期选择、日期范围选择、日期时间选择、描述列表、模态框与抽屉、下拉菜单、警告条、空状态、骨架屏、页脚、表单控件与字段、图片、行内编辑、输入框、键位、布局、列表、营销页区块、滚动公告、遮罩条、配置式菜单与右键菜单、消息提示、顶部导航条、数字步进器、验证码输入、页头、分页、气泡确认、气泡卡片、进度条、评分、结果页、环形进度、下拉选择、侧边菜单、滑块、加载中、步骤条、表格、标签页、标签、多行文本、时间选择、时间线、文字提示、树、文件上传。纯样式可用的见 [样式类](styles.md)。

演示页里还有这些没有抽成独立版：复杂图表（堆叠、散点、地图）、上传的头像与图片卡片模式、树的拖拽排序与按需加载、顶部导航里的超大菜单。需要时请不要编造类名，用主题变量自己写。
