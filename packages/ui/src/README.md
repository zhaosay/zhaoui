# @zhaoui/ui

ZhaoUI 的原生版：**一个 CSS 加一个 JS**，不依赖任何框架，用 `data-zh-*` 属性声明组件，也可以调用全局对象 `ZhaoUI`。

> 状态：版本 {{version}}。MIT 许可证，任何人都可以免费使用、修改和分发，包括商用。暂未发布到 npm，请从 [ui.352m.com/download.html](https://ui.352m.com/download.html) 下载文件，或从 GitHub 获取源码。

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

{{files}}

只用轻量组件时，可以改用 `dist/modular/` 下的按需文件，JS 体积减半，详见 `docs/quickstart.md` 的「按需引入」。

## 组件

{{component_list}}

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
