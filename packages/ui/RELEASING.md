# 发布清单

当前状态：源码已在 GitHub 公开，许可证 MIT（`package.json` 里仍是 `"private": true`，尚未发布到 npm）。要公开发布时，按下面逐项做。

## 需要人来决定的事（不要让工具替你定）

- [x] **许可证**：已选定 MIT，`package.json` 的 `license` 为 `MIT`，包根目录有 `LICENSE` 且在 `files` 里。
- [ ] **是否上 npm、包名与作用域**：`@zhaoui/ui` 这个作用域在 npm 上要事先创建并有权限。
- [x] **仓库与主页地址**：`repository`、`homepage`、`bugs` 已补上。
- [ ] **CDN**：npm 发布后 unpkg / jsDelivr 会自动可用，`package.json` 里已配好 `unpkg` 与 `jsdelivr` 入口。

## 发布前必做

- [ ] 核对 `THIRD_PARTY_NOTICES.md`：与图标精灵图所用 Lucide 版本的 `LICENSE` 对比，版权行不同则更新。
- [ ] 更新 `CHANGELOG.md`，改 `package.json` 的 `version`。
- [ ] `npm test`：全量、压缩版、按需加载、类型检查在 Chromium / Firefox / WebKit 上全部通过。
- [ ] `npm run verify-pack`：真实 tarball 在干净目录里安装、导入、打包、跑页面都通过。
- [ ] 打开 `docs/quickstart.md` 与 `README.md` 通读一遍，确认没有过期的数字和清单（它们由构建生成）。

## 网站和 GitHub 发布（每次发版都要做）

1. **压缩包里的任何内容变了，就要升版本号。** 已发布的版本是不可变的：`npm run check:release` 会对比本地构建的压缩包和 GitHub 发布里同版本的压缩包，不一致就失败。只改了网站页面、不动压缩包内容时不用升版本。
2. `npm run build`、`npm run site`、`npm run test:all`，全部通过。
3. 把 `site/dist-site/` 同步到网站根目录，**不加 `--delete`**；先干跑看清楚要传哪些文件，传完再干跑一次，应该没有文件差异。
4. 用 `gh release create v<版本> site/dist-site/assets/zhaoui-<版本>.zip site/dist-site/SHA256SUMS site/dist-site/install.sh` 创建发布。附件必须是刚部署的那几个文件。
5. **清下载类文件的 CDN 缓存。** 页面和样式、脚本的地址带内容哈希，会自动换新；`zhaoui-<版本>.zip`、`SHA256SUMS`、`install.sh`、`assets/zhaoui/` 下的文件地址不带哈希，CDN 可能继续返回旧文件，更新后要清一次，否则用户会短时间拿到旧文件，校验失败。
6. 验证：从网站和 GitHub 各下载压缩包、`SHA256SUMS`、`install.sh`，逐字节比对；再用 `curl -fsSL <站点>/install.sh | sh` 在临时目录里装一次。

## 发布到 npm

1. 把 `package.json` 的 `"private": true` 去掉（或改为 `false`）。
2. `npm publish --access public`（`prepublishOnly` 会再做一遍检查，许可证还是 `UNLICENSED` 时会拒绝发布；现在已是 MIT）。
3. 打 git 标签，例如 `ui-v0.1.0`。
