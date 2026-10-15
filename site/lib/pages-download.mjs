// The download page: one zip, the files one by one, the direct-link way to use the library, and how to add the optional files.
import { md } from './md.mjs';
import { abs } from '../config.mjs';

// What each file is for, in the order a reader needs them.  `file` is the name under dist/.
const MAIN = (coreIcons) => [
  ['zhaoui.min.css', '样式：Token 变量加全部组件，必需'],
  ['zhaoui.min.js', `行为：全部组件和 ${coreIcons} 个内置图标，必需`],
];
const OPTIONAL = [
  ['zhaoui-icons.min.js', '更多图标（Lucide 图标集），在 zhaoui.min.js 之后加载'],
  ['zhaoui-utilities.min.css', '公共类：间距、布局、文字、响应式显示隐藏'],
  ['zhaoui-marketing.min.css', '营销页区块：落地页的 hero、特性卡、价格卡、导航对齐等'],
  ['zhaoui-style-glass.min.css', '玻璃拟态风格包（实验性）'],
];
const MODULAR = [
  ['modular/core', '核心，必需，最先加载'], ['modular/select', '下拉选择、级联选择'], ['modular/date', '日期、时间选择器'],
  ['modular/upload', '文件上传'], ['modular/tree', '树'], ['modular/chart', '基础图表'], ['modular/command', '命令面板'], ['modular/brand', '设置品牌色 ZhaoUI.setBrand()'],
];

const kb = (n) => (n >= 1024 * 100 ? (n / 1024 / 1024).toFixed(1) + ' MB' : (n / 1024).toFixed(1) + ' KB');

export function downloadPage({ version, zip, sizeOf, gzOf, coreIcons }) {
  const size = (f) => { const b = sizeOf(f); return b == null ? '-' : kb(b); }, gz = (f) => { const b = gzOf(f); return b == null ? '-' : kb(b); };
  const row = ([f, d]) => `| [${f}](assets/zhaoui/${f}) | ${d} | ${size(f)} | ${gz(f)} |`;
  const modRow = ([m, d]) => { const js = `${m}.min.js`, css = `${m}.min.css`, hasCss = sizeOf(css) != null;
    return `| [${js}](assets/zhaoui/${js})${hasCss ? `<br>[${css}](assets/zhaoui/${css})` : ''} | ${d} | ${size(js)}${hasCss ? ` + ${size(css)}` : ''} | ${gz(js)}${hasCss ? ` + ${gz(css)}` : ''} |`; };
  const u = (p) => abs('assets/zhaoui/' + p);
  const src = `# 下载

ZhaoUI 当前版本 **${version}**。原生版只有两个必需文件：一个 CSS，一个 JS，不依赖任何框架，也不需要构建工具。

## 下载全部文件

压缩包里有全部 CSS 和 JS（含压缩版、按需加载的 modular 文件和 source map）、更新日志和第三方许可说明。解压后把需要的文件放进你的项目即可。

@@ZIP@@

下载后按 [快速开始](guide/quickstart.html) 引入。压缩包的内容和这个站点上的文件完全一致，不含任何统计或追踪代码。

## 命令行安装

macOS 和 Linux 上一行命令，把两个必需文件装进当前目录的 \`zhaoui\` 文件夹：

\`\`\`bash
curl -fsSL ${abs('').replace(/\/$/, '')}/install.sh | sh
\`\`\`

要放到别的文件夹，或者同时装可选文件：

\`\`\`bash
curl -fsSL ${abs('').replace(/\/$/, '')}/install.sh | sh -s -- --dir public/vendor/zhaoui --with icons,marketing
\`\`\`

| 选项 | 说明 |
| --- | --- |
| \`--dir 文件夹\` | 装到哪个文件夹，默认 \`zhaoui\` |
| \`--with 列表\` | 额外的文件，逗号分隔：\`icons\`（更多图标）、\`utilities\`（公共类）、\`marketing\`（营销页区块）、\`glass\`（玻璃风格） |
| \`--all\` | 下载包含全部文件的压缩包，而不是单个文件 |
| \`--force\` | 覆盖已存在的文件，不加这个选项时遇到同名文件会停下，什么都不写 |

这个脚本很短，运行前可以先看一遍：\`curl -fsSL ${abs('').replace(/\/$/, '')}/install.sh\`。它需要 curl 或 wget，只往你指定的文件夹写文件，不使用 sudo。写入前会用 [SHA256SUMS](SHA256SUMS) 校验每个文件，不一致就整体放弃。要注意，校验文件和脚本来自同一个站点，它能发现下载损坏，防不了站点本身被篡改。

不想运行脚本，也可以只下载文件：

\`\`\`bash
curl -LO ${abs('').replace(/\/$/, '')}/assets/zhaoui/zhaoui.min.css -O ${abs('').replace(/\/$/, '')}/assets/zhaoui/zhaoui.min.js
\`\`\`

Windows PowerShell：

\`\`\`powershell
Invoke-WebRequest ${abs('').replace(/\/$/, '')}/assets/zhaoui/zhaoui.min.css -OutFile zhaoui.min.css
Invoke-WebRequest ${abs('').replace(/\/$/, '')}/assets/zhaoui/zhaoui.min.js -OutFile zhaoui.min.js
\`\`\`

安装脚本在 Windows 上请用 Git Bash 或 WSL 运行。Windows 的这几条命令我没有在真实的 Windows 上测过。

## 单个文件

只想要必需的两个文件，直接下载它们：

| 文件 | 说明 | 大小 | gzip 后 |
| --- | --- | --- | --- |
${MAIN(coreIcons).map(row).join('\n')}

可选文件，用到再加：

| 文件 | 说明 | 大小 | gzip 后 |
| --- | --- | --- | --- |
${OPTIONAL.map(row).join('\n')}

每个文件还有未压缩的版本（去掉名字里的 \`.min\`），方便阅读和调试。

## 按需加载

页面只用到部分组件时，改用 \`modular/\` 下的文件：核心必需，其余按用到的组件加。用法见 [快速开始](guide/quickstart.html) 的“按需引入”一节。

| 文件 | 说明 | 大小 | gzip 后 |
| --- | --- | --- | --- |
${MODULAR.map(modRow).join('\n')}

## 不下载，直接引用

做原型或试一试时，可以直接引用本站的文件：

\`\`\`html
<link rel="stylesheet" href="${u('zhaoui.min.css')}">
<script src="${u('zhaoui.min.js')}"></script>
\`\`\`

这些地址不带版本号，站点更新后文件内容会跟着变。正式项目请下载文件放到自己的服务器上，这样升级由你决定。

## 营销页区块的用法

落地页用的 hero、特性卡、价格卡、数据条等放在可选文件 \`zhaoui-marketing.css\` 里，实时预览、完整代码和每个类的说明见 [营销页区块](components/marketing.html)。用法是在 \`zhaoui.css\` 之后多引一个文件：

\`\`\`html
<link rel="stylesheet" href="zhaoui.min.css">
<link rel="stylesheet" href="zhaoui-marketing.min.css">   <!-- 放在 zhaoui.min.css 之后 -->
\`\`\`

## 其他

- 暂未发布到 npm，目前通过本页下载使用。
- 图标来自 Lucide，许可说明在压缩包里的 \`THIRD_PARTY_NOTICES.md\`。
- 每个版本的变化见 [更新日志](changelog.html)。`;
  const { html, headings } = md(src);
  const button = `<p><a class="zh-btn primary xl" href="assets/${zip.name}" download><i data-i="download" data-s="20"></i>下载 ${zip.name}（${kb(zip.size)}）</a></p>`;
  // plain links into assets/zhaoui/ become real downloads instead of opening as text in the browser
  const body = html.replace('<p>@@ZIP@@</p>', button).replace(/<a href="(assets\/zhaoui\/[^"]+\.(?:css|js))"/g, '<a href="$1" download');
  return { title: '下载', description: `下载 ZhaoUI ${version}：全部文件的压缩包、单个 CSS 和 JS、按需加载的分包，以及直接引用的写法。`, body, headings: headings.filter((h) => h.level > 1) };
}
