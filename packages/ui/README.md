# @zhaoui/ui

ZhaoUI 的原生版：**一个 CSS 加一个 JS**，不依赖任何框架，用 `data-zh-*` 属性声明组件，也可以调用全局对象 `ZhaoUI`。

> 状态：版本 0.1.3。MIT 许可证，任何人都可以免费使用、修改和分发，包括商用。暂未发布到 npm，请从 [ui.352m.com/download.html](https://ui.352m.com/download.html) 下载文件，或从 GitHub 获取源码。

## 适合与不适合

- **适合**：后台管理页、内容站点和不想引入前端框架的页面；需要中文界面文案、键盘操作和无障碍支持的项目；需要亮暗、B/C 端和密度主题切换的产品。
- **不适合**：需要 IE 或旧版浏览器（目标是 Chrome / Edge 111+、Safari 16.4+、Firefox 113+）；需要堆叠、散点、地图等复杂图表；需要现成的 Vue 或 React 组件封装（目前没有，库本身是原生的）。

## 30 秒上手

```html
<link rel="stylesheet" href="node_modules/@zhaoui/ui/dist/zhaoui.min.css">

<button class="zh-btn primary" data-zh-open="#dlg">打开</button>
<dialog class="zh-modal" id="dlg" aria-labelledby="t">
  <header id="t">你好</header>
  <div class="body">这是 ZhaoUI 的模态框。</div>
  <footer><button class="zh-btn primary" data-zh-close>知道了</button></footer>
</dialog>

<script src="node_modules/@zhaoui/ui/dist/zhaoui.min.js"></script>   <!-- 放在 </body> 前 -->
```

用打包工具时：

```js
import '@zhaoui/ui/zhaoui.min.css';
import '@zhaoui/ui';            // 在浏览器里创建全局对象 ZhaoUI；在服务端渲染时导入是安全的，什么也不做
```

TypeScript 会自动带上 `ZhaoUI` 的类型。

## 文件

| 文件 | 说明 | 大小 |
|---|---|---|
| `zhaoui.css` | Token 变量 + 全部组件样式 | 191.3 KB → 165.9 KB，gzip 29.6 KB |
| `modular/core.css` | 核心：Token、基础、通用组件样式 | 158.5 KB → 137.0 KB，gzip 25.1 KB |
| `modular/select.css` | 下拉选择与级联选择的样式 | 8.8 KB → 7.8 KB，gzip 2.0 KB |
| `modular/upload.css` | 文件上传的样式 | 4.2 KB → 3.7 KB，gzip 1.2 KB |
| `modular/tree.css` | 树的样式 | 4.4 KB → 3.9 KB，gzip 1.2 KB |
| `modular/chart.css` | 基础图表的样式 | 2.5 KB → 2.2 KB，gzip 0.9 KB |
| `modular/command.css` | 命令面板的样式 | 3.2 KB → 2.9 KB，gzip 1.0 KB |
| `modular/date.css` | 日期、日期范围、时间、日期时间选择的样式 | 10.3 KB → 9.2 KB，gzip 2.2 KB |
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


只用轻量组件时，可以改用 `dist/modular/` 下的按需文件，JS 体积减半，详见 `docs/quickstart.md` 的「按需引入」。

## 组件

锚点目录、头像、返回顶部、徽标、面包屑、按钮组、内嵌日历、卡片、轮播、级联选择、图表、代码块、折叠面板、命令面板、评论、日期选择、日期范围选择、日期时间选择、描述列表、模态框与抽屉、下拉菜单、警告条、空状态、骨架屏、页脚、表单控件与字段、图片、行内编辑、输入框、键位、布局、列表、营销页区块、滚动公告、遮罩条、配置式菜单与右键菜单、消息提示、顶部导航条、数字步进器、验证码输入、页头、分页、气泡确认、气泡卡片、进度条、评分、结果页、环形进度、下拉选择、侧边菜单、滑块、加载中、步骤条、表格、标签页、标签、多行文本、时间选择、时间线、文字提示、树、文件上传

每个组件的标记、属性、方法、事件和无障碍说明见 `docs/components/`。演示页里的其余组件（上传、树、导航、时间线与步骤条、表格等）还没有独立版。

## 主题

`<html>` 上的 `data-audience`（B 端 / C 端）、`data-mode`（亮 / 暗）、`data-density`、`data-trend`、`data-brand`、`data-style` 控制外观，详见 `docs/theme.md`。

## 浏览器

Chrome / Edge 111+、Safari 16.4+、Firefox 113+。自动测试在 Chromium、Firefox、WebKit 的最新版上运行，更旧的版本没有测过。

## 文档、技能与类型

- `docs/`：Markdown 文档，`docs/components.json` 与 `docs/llms.txt` 是机器可读的版本。
- `skills/zhaoui/`：Claude Code 技能，复制到 `~/.claude/skills/` 或项目的 `.claude/skills/` 即可让智能体按 ZhaoUI 的规则写页面。
- `types/index.d.ts`：TypeScript 类型声明。

## 开发

```bash
npm run build          # 生成 dist/、docs/、skills/、README.md
npm test               # 构建 + 全量冒烟测试 + 按需加载测试 + 类型检查（需要 /tmp/pw 里装有 playwright）
npm run verify-pack    # 打出真实的 tarball，在干净目录里安装并验证
```

发布前的检查清单见 `RELEASING.md`。图标的第三方许可声明见 `THIRD_PARTY_NOTICES.md`。
