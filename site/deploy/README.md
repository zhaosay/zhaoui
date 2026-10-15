# 部署说明

`site/dist-site/` 是整个网站，纯静态文件，同步到网站根目录即可，**不加 `--delete`**。

- `security_headers`：`X-Content-Type-Options`、`Referrer-Policy`、`X-Frame-Options`、`Permissions-Policy`，放在 Nginx 站点配置里。
- `nginx-extra.conf`：HTML 和下载文件的缓存规则，原因和用法写在文件开头的注释里。
- 发版的完整步骤见 `packages/ui/RELEASING.md` 的“网站和 GitHub 发布”一节。

安全响应头的内容：

```
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

没有加 CSP：页面里有内联脚本（主题初始化、结构化数据），需要 `unsafe-inline`，防护价值很小。
