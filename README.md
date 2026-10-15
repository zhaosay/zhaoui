# ZhaoUI

不依赖框架的中文 UI 组件库和设计语言：**一个 CSS 加一个 JS**，用 `data-zh-*` 属性声明组件，也可以调用全局对象 `ZhaoUI`。没有构建步骤，没有运行时依赖。

- 文档、组件预览、在线试用、下载：<https://ui.352m.com/>
- 浏览器：Chrome / Edge 111+、Safari 16.4+、Firefox 113+
- 许可证：MIT，任何人都可以免费使用、修改和分发，包括商用

## English

ZhaoUI is a dependency-free UI component library and design language with Chinese UI copy: **one CSS file and one JavaScript file**, components driven by `data-zh-*` attributes or the global `ZhaoUI` object, no framework and no build step. It ships dozens of accessible components (dialogs, tables, selects, date pickers, tree, upload, charts, command palette), light and dark themes, B-end and C-end looks, and a brand colour generator based on OKLCH. MIT licensed.

- Website, docs, live playground: <https://ui.352m.com/>
- Download: <https://ui.352m.com/download.html>, or `curl -fsSL https://ui.352m.com/install.sh | sh`
- Targets Chrome and Edge 111+, Safari 16.4+, Firefox 113+. Not published to npm yet.
- Documentation is in Chinese; the code, class names and API are English.

## 特点

- 60 个组件：对话框、抽屉、表格、表单控件、下拉选择、日期选择、树、上传、基础图表、命令面板等，界面文案和键盘操作按中文使用习惯设计。
- 一套设计 Token（`--zh-*` CSS 变量）驱动全部组件。亮色和暗色、B 端和 C 端、三档密度，通过 `<html>` 上的 `data-*` 属性切换；`ZhaoUI.setBrand('#色值')` 可以按品牌色生成整套配色。
- 无障碍：组件带键盘操作和 ARIA，亮色、暗色、C 端三套外观下用 axe-core 检查，没有违规项。
- 按需加载：核心之外的组件（选择、日期、上传、树、图表、命令面板、品牌色）可以单独引入。

## 快速开始

从 [下载页](https://ui.352m.com/download.html) 拿到文件后：

```html
<link rel="stylesheet" href="zhaoui.min.css">

<button class="zh-btn primary" data-zh-open="#dlg">打开</button>
<dialog class="zh-modal" id="dlg" aria-labelledby="t">
  <header id="t">你好</header>
  <div class="body">这是 ZhaoUI 的模态框。</div>
  <footer><button class="zh-btn primary" data-zh-close>知道了</button></footer>
</dialog>

<script src="zhaoui.min.js"></script>   <!-- 放在 </body> 前 -->
```

命令行一键安装（macOS、Linux；把两个必需文件装进当前目录的 `zhaoui` 文件夹）：

```bash
curl -fsSL https://ui.352m.com/install.sh | sh
# 放到别处并同时装可选文件
curl -fsSL https://ui.352m.com/install.sh \
  | sh -s -- --dir public/vendor/zhaoui --with icons,marketing
```

脚本只往你指定的文件夹写文件，不用 sudo，不覆盖已有文件（除非加 `--force`），写入前用 [SHA256SUMS](https://ui.352m.com/SHA256SUMS) 校验。加 `--version 0.1.0` 会固定版本，并改从 GitHub 发布取压缩包和校验值，不再依赖本站。运行前可以先看一遍：`curl -fsSL https://ui.352m.com/install.sh`。Windows 的 PowerShell 写法和全部选项见 [下载页](https://ui.352m.com/download.html)。

校验值和脚本放在同一个站点上，只能发现下载损坏。要防备站点本身被改动，请对照 [GitHub 发布](https://github.com/zhaosay/zhaoui/releases)里独立保存的 `SHA256SUMS`，两处输出应该完全一样；安装脚本的源码在 [`site/install/install.sh`](site/install/install.sh)。

更多用法见 [快速开始](https://ui.352m.com/guide/quickstart.html)。暂未发布到 npm。

## 仓库结构

| 目录 | 内容 |
| --- | --- |
| `packages/tokens` | 设计 Token：颜色（OKLCH）、字体、间距、圆角、阴影、动效，以及品牌色生成；输出 CSS、JSON 和 Figma 变量 |
| `packages/ui` | 组件：样式、行为（`src/components/<名称>/`）、类型声明、文档和测试 |
| `demo` | 完整视觉演示页的源文件，组件样式从这里提取 |
| `site` | 网站 <https://ui.352m.com/> 的生成器和测试 |
| `skills` | 给 Claude Code 用的 ZhaoUI skill |

## 构建和测试

需要 Node.js 20 或更高。

```bash
npm install
npm run test:setup   # 下载测试用的 Chromium、Firefox、WebKit
npm run build        # 生成 Token 和组件库，输出在 packages/*/dist
npm run site         # 生成网站，输出在 site/dist-site
npm run test:all     # 构建加全部测试
```

Playwright 和 axe-core 已经写在 `devDependencies` 里，`npm install` 会装好。参与贡献请先看 [CONTRIBUTING.md](CONTRIBUTING.md)。

每个组件的说明（类名、属性、事件、方法、无障碍）写在 `packages/ui/src/components/<名称>/meta.json`，文档、站点页面、`llms.txt` 都由它生成，请改这里，不要改生成出来的文件。

## 许可

MIT。图标来自 [Lucide](https://lucide.dev)，它的许可说明见 [THIRD_PARTY_NOTICES.md](packages/ui/THIRD_PARTY_NOTICES.md)。
