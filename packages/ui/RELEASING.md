# 发布清单

当前状态：源码已在 GitHub 公开，许可证 MIT（`package.json` 里仍是 `"private": true`，尚未发布到 npm）。要公开发布时，按下面逐项做。

## 需要人来决定的事（不要让工具替你定）

- [x] **许可证**：已选定 MIT，`package.json` 的 `license` 为 `MIT`，包根目录有 `LICENSE` 且在 `files` 里。
- [ ] **是否上 npm、包名与作用域**：`@zhaoui/ui` 这个作用域在 npm 上要事先创建并有权限。
- [ ] **仓库与主页地址**：补上 `repository`、`homepage`、`bugs` 字段（现在没有，因为不知道地址）。
- [ ] **CDN**：npm 发布后 unpkg / jsDelivr 会自动可用，`package.json` 里已配好 `unpkg` 与 `jsdelivr` 入口。

## 发布前必做

- [ ] 核对 `THIRD_PARTY_NOTICES.md`：与图标精灵图所用 Lucide 版本的 `LICENSE` 对比，版权行不同则更新。
- [ ] 更新 `CHANGELOG.md`，改 `package.json` 的 `version`。
- [ ] `npm test`：全量、压缩版、按需加载、类型检查在 Chromium / Firefox / WebKit 上全部通过。
- [ ] `npm run verify-pack`：真实 tarball 在干净目录里安装、导入、打包、跑页面都通过。
- [ ] 打开 `docs/quickstart.md` 与 `README.md` 通读一遍，确认没有过期的数字和清单（它们由构建生成）。

## 发布

1. 把 `package.json` 的 `"private": true` 去掉（或改为 `false`）。
2. `npm publish --access public`（`prepublishOnly` 会再做一遍检查，许可证还是 `UNLICENSED` 时会拒绝发布；现在已是 MIT）。
3. 打 git 标签，例如 `ui-v0.1.0`。
