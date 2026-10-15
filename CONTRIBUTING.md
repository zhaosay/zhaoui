# 参与贡献

欢迎提 Issue 和 Pull Request，中文和英文都可以。

## 先跑起来

需要 Node.js 20 或更高。

```bash
npm install
npm run test:setup   # 下载测试用的 Chromium、Firefox、WebKit
npm run build        # 生成 Token 和组件库
npm run test:all     # 构建加全部测试，约几分钟
```

只想改一个地方时，可以只跑相关部分：`npm test`（Token）、`npm run test:ui`（组件，需要先构建）、`npm run test:site`（网站，需要先 `npm run site`）。

## 改哪里

- **组件的说明**（类名、属性、事件、方法、无障碍、示例）写在 `packages/ui/src/components/<名称>/meta.json`。文档、网站页面、`llms.txt`、展示页都由它生成，请改这里，不要改生成出来的文件。
- **组件的行为**在同目录的 `behavior.js`，**样式**来自 `demo/` 里的片段（`demo/fragments/*`）和演示页的外壳 `demo/base.html`（它的样式、图标精灵、页面主体和脚本分别放在 `demo/base/` 下，由 `<!-- @include ... -->` 行引入），构建时提取到 `dist/zhaoui.css`。
- **设计 Token** 在 `packages/tokens/src`。改颜色和风格先改这里并跑 `npm test`。
- 构建输出（`packages/*/dist`、`packages/ui/docs`、`site/dist-site`）不提交。

## 提交之前

- 新增或修改行为时同时加测试，放在 `packages/ui/test/` 或 `site/test/`。新写的检查先故意放进一个错误，确认它真的会失败。
- 单个功能代码文件不超过 1000 行，接近时先拆分（脚本生成的文件、文档和锁文件除外）。
- 界面文字、代码、注释、文档、提交信息里不用 emoji；图标用 SVG。
- 文字颜色用 `--zh-text-*` 和 `--zh-color-primary-text`，不要直接用品牌色写小字，否则对比度不达标。无障碍检查（axe）是测试的一部分，必须 0 违规。
- 说明"已修复"之前，先在浏览器里确认实际生效，不要只看源码。

## 报告问题

提 Issue 时请写清浏览器和版本、操作系统、复现步骤。截图很有帮助。Windows 上的问题尤其需要：我们目前没有在真实 Windows 上测过，CI 里的 Windows 任务只能覆盖一部分。

安全问题请不要公开提 Issue，见 [SECURITY.md](SECURITY.md)。

## 许可

提交的代码按本仓库的 [MIT 许可证](LICENSE)发布。
