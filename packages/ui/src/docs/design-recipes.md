# 风格方案与点缀色

## 选择风格

ZhaoUI 提供组件与 Token；每个项目可以选择不同的视觉方向。先结合品牌、用户和工作场景选方向，再统一应用到相关页面。用户已认可的风格可继续沿用；新项目或要求换风格时，可以尝试编辑排版、清爽工具、温暖生活等不同方向。这些是设计方向，具体尺寸和配色需要按项目落实。

改版保留原有品牌名、标识、栏目名称与业务流程。业务工具优先让一个页面完成一件主要事情，相关操作跳转到独立页面。关联链接也应进入相同设计体系。

## 活泼纸感（可选配方）

来源：2026-10-20「轻舟 · 韩国运营」多页面预览，用户认可的版本。适合需要清晰、亲和、有一定信息密度的业务系统。这是一份项目配方；组件库现有 `data-style` 仍为 `flat | glass`，没有 `data-style="paper"`。

- 材质：暖白纸面、淡灰底、极轻细颗粒，内容面板保持实色。用边框和浅阴影建立层次，避免大面积模糊、透亮高光和悬浮玻璃球。
- 排版：借鉴瑞士网格的对齐与清晰层级，采用柔和易读的中文无衬线字形；保留项目字体，确需更换时可选有授权的圆润字体。内容标题桌面约 26px、手机约 23px；正文和控件 14–16px。
- 形状：常用圆角 8–14px；控件高度约 40px；侧栏、内容、操作区层级分明。避免重复导航与层层重复的大标题。
- 色彩：以中性纸面为主，小面积点缀珊瑚橙、湖蓝、薄荷绿和暖黄。颜色出现在图标底、栏目标识、标签、局部数字和细线中，同屏以 2–4 组为宜。
- 深度：保持页面之间一致的面板、表格、详情、表单与状态层次；新增页面沿用同样的留白与细节，而不是只换外壳颜色。

下面是该配方的浅色起点。在项目 CSS 中定义一组作用域 Token，组件继续消费这些变量。深色时沿用 ZhaoUI 默认深色面板与下方的深色点缀色；若另做纸感深色方案，需重新核对对比度。

```css
/* 项目作用域；不是新的库主题属性 */
.paper-workbench {
  --zh-radius-sm: 8px;
  --zh-radius-md: 12px;
  --zh-radius-lg: 14px;
  --zh-font-base: 15px;
  --zh-control-h-base: 40px;
  --zh-control-h: max(var(--zh-touch-min, 0px), calc((var(--zh-control-h-base) + var(--zh-density)) * var(--zh-scale)));
  --zh-fs: calc(var(--zh-font-base) * var(--zh-scale));
  font-size: var(--zh-fs);
  --project-page-title: 26px;
}
[data-mode="light"] .paper-workbench {
  --zh-bg: #fffefa;
  --zh-bg-subtle: #f5f4ef;
  --zh-bg-elevated: #fbfaf6;
  --zh-border: #dfded5;
  --zh-border-strong: #cbc9be;
  --zh-shadow-sm: 0 2px 6px rgba(51, 45, 32, .04);
  --zh-shadow-md: 0 8px 22px rgba(51, 45, 32, .06);
}
.paper-workbench .page-title { font-size: var(--project-page-title); }
@media (max-width: 620px) {
  .paper-workbench { --project-page-title: 23px; }
}
```

将 `.paper-workbench` 放在 `<body>` 上，同时重新计算控件高度与字号，使派生尺寸使用项目 Token。品牌色仍通过 `data-brand` 或 `ZhaoUI.setBrand()` 设置：保留现有品牌，获准换色后才设置新的品牌色。

## 六组点缀色

所有模式均提供 `--zh-accent-{名称}-text`、`--zh-accent-{名称}-bg`、`--zh-accent-{名称}-border`，随 `data-mode` 切换。无需额外风格包。

| 名称 | 色彩 | 适用位置 | 浅色文字 / 背景 | 深色文字 / 背景 |
| --- | --- | --- | --- | --- |
| `coral` | 珊瑚橙 | 入口、重点标记 | `#ac3e23` / `#fff0e5` | `#ffb599` / `#38251f` |
| `sky` | 湖蓝 | 资料、链接分组 | `#236b80` / `#e9f4f7` | `#94d4e7` / `#1c3039` |
| `mint` | 薄荷绿 | 行程、分类图标 | `#246c51` / `#eaf5ed` | `#93d8b0` / `#1e3229` |
| `sun` | 暖黄 | 备注、轻提醒 | `#805710` / `#fff5d6` | `#f2d47b` / `#343020` |
| `rose` | 莓果粉 | 协作、人物分类 | `#9c365c` / `#fcecf2` | `#f2abc5` / `#36232e` |
| `lime` | 青柠绿 | 新内容、辅助分类 | `#526b16` / `#f0f6dd` | `#c3da85` / `#2a321f` |

这些是分类与装饰配色。成功、警告、失败等业务状态继续使用 `success / warning / danger / info` 对应的语义 Token，同时提供文字或图标。普通正文维持 `--zh-text`，主操作仍由品牌色承担。

文字使用 `-text`，柔和底色使用 `-bg`。`-border` 用于装饰边框，不承担输入框、选中状态或焦点环等必要识别；这些继续使用组件自带样式。已有 `--zh-accent-a/b/c` 是品牌派生的大字与渐变装饰色，含义保持原样。

## 搭配示例

纸感工具可用 coral + sky + mint + sun；清爽资料站可用 sky + lime；协作空间可用 rose + sky + sun。其他项目可以选择自己的组合，不必每页用齐六色。

```html
<span class="topic-label">机构资料</span>
```

```css
.topic-label {
  display: inline-flex;
  padding: var(--zh-space-1) var(--zh-space-2);
  border: 1px solid var(--zh-accent-sky-border);
  border-radius: var(--zh-radius-sm);
  color: var(--zh-accent-sky-text);
  background: var(--zh-accent-sky-bg);
}
```

小面积颜色应帮助用户辨认栏目和内容类型；保持主按钮、正文与状态的优先级。核对浅色和深色的文字可读性，并在窄屏检查标题、表格、表单与跨页链接。
