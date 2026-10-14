# ZhaoUI 网站

静态站点，由 `node` 脚本生成，页面本身用 ZhaoUI 搭建。网址规划：`https://ui.352m.com/`（协议按 https 假定，见 `config.mjs`）。

## 命令

在 `zhaoui/` 根目录运行：

| 命令 | 作用 |
| --- | --- |
| `npm run site:all` | 先构建库，再构建站点（第一次、或库的文档和组件有改动时用） |
| `npm run site` | 只构建站点（库没变时用） |
| `npm run site:dev` | 本地预览 `http://localhost:4173/`，站点源文件变化会自动重建 |
| `npm run test:site` | 浏览器测试：每个页面加载无报错、不横向溢出，搜索、主题、在线试用、复制、手机抽屉，以及 axe 无障碍审计。`ENGINE=firefox` 或 `webkit` 换引擎 |

产物在 `site/dist-site/`，全是静态文件，页面里的链接都是相对路径，所以放在任何子目录、或直接从磁盘打开都可以。

## 结构

```text
site/
  config.mjs            网址与站点名（canonical、sitemap、llms.txt 用）
  build.mjs             生成器：读库的 dist 和 docs，写出全部页面
  serve.mjs             本地预览 + 自动重建
  lib/layout.mjs        所有页面共用的外壳：head（SEO、结构化数据）、导航、侧边菜单、目录、页脚
  lib/md.mjs            很小的 Markdown 转 HTML
  lib/pages-*.mjs       首页、指南/更新日志/设计、组件页（59 个 + 总览）、在线试用
  lib/check-links.mjs   构建时检查所有相对链接和页内锚点
  assets/               site.css、site.js（主题、搜索、复制）、playground.js
  test/site.mjs         浏览器测试
```

## 数据从哪来

| 页面 | 来源 |
| --- | --- |
| 组件页 | `packages/ui/docs/components.json`（即各组件的 `meta.json`） |
| 指南页 | `packages/ui/docs/*.md` |
| 更新日志 | `packages/ui/CHANGELOG.md` |
| 完整视觉演示 | `demo/` 构建出的页面，资源路径改指向 `assets/tokens/` |
| 站内搜索 | 构建时生成 `assets/search-index.js`，用库自己的命令面板 |

要改文案：改 `meta.json`、`src/docs/*.md` 或 `lib/pages-*.mjs`，不要改 `dist-site/`。

## 给搜索引擎和 AI 的内容

- 每页都有 title、description、canonical、Open Graph，以及 JSON-LD（`TechArticle`、`BreadcrumbList`；首页和组件页有 `FAQPage`；首页有 `SoftwareApplication`，组件总览有 `ItemList`）。
- `sitemap.xml`、`robots.txt`、`llms.txt`、`llms-full.txt`，每个组件和指南页都有同名 `.md`。

## 上线前要确认

- 协议：`config.mjs` 里假定 `https`。
- 服务器是否把 `.md`、`.txt`、`.xml` 以正确的类型和 UTF-8 返回。
- 上线（上传文件、改服务器配置）属于对外操作，需要你确认后再做。
