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

{{files}}

- 全量版 `zhaoui.css` + `zhaoui.js` 已经包含 Token 变量、全部组件和 {{core_icon_count}} 个内置图标，不需要别的文件。线上请用压缩版 `zhaoui.min.css` 和 `zhaoui.min.js`（JS 另带 `.map`，方便排查线上报错）。
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

全量版的 JS 压缩加 gzip 后约 {{full_js_kb}} KB。只要页面不用全部组件，就只引 `modular/` 下需要的文件：核心必需，其余按用到的组件加。

| 文件 | 内容 | JS 约（gzip） |
| --- | --- | --- |
| `modular/core` | 注册与自动初始化、对话框、标签页、下拉菜单、输入类、表格、导航、步骤条、时间线、菜单等通用组件 | {{core_js_kb}} KB |
| `modular/select` | 下拉选择、级联选择 | {{select_js_kb}} KB |
| `modular/date` | 日期、日期范围、时间、日期时间选择器，内嵌日历 | {{date_js_kb}} KB |
| `modular/upload` | 文件上传 | {{upload_js_kb}} KB |
| `modular/tree` | 树 | {{tree_js_kb}} KB |
| `modular/chart` | 基础图表 | {{chart_js_kb}} KB |
| `modular/command` | 命令面板 | {{command_js_kb}} KB |
| `modular/brand` | `ZhaoUI.setBrand()` 与 Logo 取色 | {{brand_js_kb}} KB |

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

已提供行为的组件：{{component_list}}。纯样式可用的见 [样式类](styles.md)。

演示页里还有这些没有抽成独立版：复杂图表（堆叠、散点、地图）、上传的头像与图片卡片模式、树的拖拽排序与按需加载、顶部导航里的超大菜单。需要时请不要编造类名，用主题变量自己写。
