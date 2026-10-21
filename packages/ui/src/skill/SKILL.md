---
name: zhaoui
description: Build or edit web pages with the ZhaoUI design language (zhaoui.css + zhaoui.js, no framework). Use when the user asks for a page, form, dialog, drawer, tabs, dropdown or message in ZhaoUI style, or when a page already links zhaoui.css / uses zh- classes or data-zh-* attributes.
---

# ZhaoUI {{version}}

ZhaoUI 原生版：一个 CSS、一个 JS，不依赖框架。组件用 `data-zh-*` 属性声明，或调用全局对象 `ZhaoUI`。

写页面之前先读对应的参考资料，**不要凭记忆写类名和属性**：

- `references/quickstart.md`：引入方式、两种用法、事件、当前范围
- `references/components.md`：每个组件的标记、属性、方法、事件、无障碍
- `references/theme.md`：主题属性、`setTheme` / `setBrand`、可用的 Token 变量
- `references/design-recipes.md`：新项目选风格、现有项目改版或增加点缀色时先读；含可选的「活泼纸感」，按项目选择，保留现有品牌
- `references/icons.md`、`references/styles.md`、`references/utilities.md`：图标、纯样式类、可选公共类（间距、布局、响应式显隐、动画）

## 当前提供的组件

{{components}}

纯样式：按钮（`zh-btn`，含 `primary` / `text` / `danger`）、提示气泡（`zh-tip` + `data-tip`）。

**没有独立版的东西不要假设它存在**：日期、上传、树、导航、分页、表格、下拉选择等，在演示页里有，但还没有文档和测试。用户需要时，先说明这一点，再决定是自己写样式还是让用户等。

公开文档、示例和发布说明仅使用通用业务称呼；项目中的真实品牌名、机构名、内部系统名与来源信息，仅在用户明确要求公开时写入。

## 必须遵守的规则

1. **引入**：`<link rel="stylesheet" href="zhaoui.css">` 与 `<script src="zhaoui.js"></script>`（正式页面用同目录下的 `zhaoui.min.css` / `zhaoui.min.js`）（放在 `</body>` 前、不加 `defer`，你自己的内联脚本写在它后面）；`<html>` 上写 `data-audience`、`data-mode`、`data-density`。
2. **颜色和间距只用变量**：`var(--zh-bg)`、`var(--zh-text)`、`var(--zh-space-4)`、`var(--zh-radius-md)` 等，不写死十六进制或像素。文字色用带 `text` 的一档（如 `--zh-text-danger`），`--zh-danger` 只用于图形。
3. **图标**：`<i data-i="名称"></i>`，Lucide。**禁止 emoji**。只有图标的按钮必须有 `aria-label`。默认只内置 {{core_icon_count}} 个图标，其余需引入 `zhaoui-icons.js`。
4. **按钮**：一个区域只放一个主按钮（`zh-btn primary`），其余用默认或文字按钮。危险操作用 `danger`，不要默认高亮。
5. **交互用库提供的方式**：确认用 `ZhaoUI.dialog`，轻提示用 `ZhaoUI.message`，不要用 `confirm()`、`alert()`。模态框用 `<dialog class="zh-modal">` 加 `data-zh-open` / `data-zh-close`，不要自己写遮罩。
6. **受众**：B 端（中后台）信息密度高、圆角小；C 端强调品牌感、圆角大。用 `data-audience="b|c"` 切换；项目有已选定的风格方案时，在项目作用域覆盖尺寸 Token，见 `references/design-recipes.md`。
7. **无障碍**：表单控件有 label；对话框有 `aria-labelledby`；不要把必须阅读的信息只放在会自动消失的消息里。
8. **深色模式**只由 `data-mode` 控制，不会自动跟随系统。

## 没有现成组件时：用 CSS 变量自己写

卡片、表格、表单控件、栅格布局、警告条/空状态/骨架屏、面包屑、描述列表、结果页、侧边菜单、页头、按钮组、列表、代码、图片、页脚、评论、加载中、轮播、滚动公告、返回顶部、文字提示、气泡卡片、气泡确认、顶部导航条、锚点目录、步骤条、时间线、树、文件上传、表格排序与勾选、配置式菜单与右键菜单、内嵌日历、命令面板、基础图表已有文档（见 `references/`），直接用。其余没有文档的（复杂图表、图片卡片式上传、树拖拽）不要编造 `zh-` 类名，用下面的变量自己写，这样主题、暗色、B/C 端切换都会跟着变：

- 自定义容器：`background: var(--zh-bg-elevated); border: 1px solid var(--zh-border); border-radius: var(--zh-radius-lg); box-shadow: var(--zh-shadow-sm); padding: var(--zh-space-5);`
- 页面底色 `var(--zh-bg-subtle)`，分割线 `var(--zh-border)`，次要文字 `var(--zh-text-secondary)`，间距 `var(--zh-space-1)` 到 `--zh-space-12`。
- 涨跌：`var(--zh-trend-up)` / `var(--zh-trend-down)`（随 `data-trend` 变化）；好坏：`var(--zh-text-success)` / `var(--zh-text-danger)`。
- 宽度（如输入框、筛选项的 `min-width`）库里没有变量，可以用 `rem`，但不要写死颜色和字体。
- 图表库里没有，需要时用占位并告诉用户。

## 做完之后检查

- 页面里只引入了上面两个文件（加可选的图标包）。
- 没有硬编码的颜色、字号、间距。
- 用到的每个 `data-zh-*` 属性和方法都能在 `references/components.md` 里找到。
- 深色、C 端、手机宽度下各看一次（组件本身已测过，你的自定义样式没有）。
