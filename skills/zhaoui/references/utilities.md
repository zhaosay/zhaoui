# 公共类（可选）

单独的一个文件 `zhaoui-utilities.css`（压缩后约 9 KB），放在 `zhaoui.css` 之后引入。每个类只做一件事，优先级与普通类相同，所以放在后面才能覆盖组件。不用就不引。

```html
<link rel="stylesheet" href="zhaoui.css">
<link rel="stylesheet" href="zhaoui-utilities.css">
```

所有间距、颜色、圆角、阴影都读主题变量，随亮暗、密度、受众变化；不要用它们写死数值。

## 间距

- 数字档位：`0 1 2 3 4 5 6 8 10 12`，对应 `--zh-space-N`。
- 外边距 `zh-m-4`、`zh-mt-4`、`zh-mb-4`、`zh-ml-4`、`zh-mr-4`、`zh-mx-4`、`zh-my-4`，另有 `zh-m-auto`、`zh-mx-auto`。
- 内边距 `zh-p-4`、`zh-pt-4`、`zh-pb-4`、`zh-pl-4`、`zh-pr-4`、`zh-px-4`、`zh-py-4`。
- 间隙 `zh-gap-4`、`zh-gap-x-4`、`zh-gap-y-4`；子元素间距 `zh-space-x-4`、`zh-space-y-4`。

## 布局

- 显示：`zh-flex`、`zh-inline-flex`、`zh-d-grid`、`zh-block`、`zh-inline-block`、`zh-hidden`。
- Flex：`zh-flex-col`、`zh-flex-row`、`zh-flex-wrap`、`zh-flex-1`、`zh-grow`、`zh-shrink-0`；对齐 `zh-items-center|start|end|stretch`、`zh-justify-between|center|start|end`、`zh-self-*`。
- 网格：`zh-cols-N`（1 到 12）、`zh-col-span-N`（1 到 12、`full`）、`zh-rows-N`、`zh-row-span-N`。
- 居中：`zh-center`（flex 居中）、`zh-center-abs`（绝对定位居中）。
- 容器：`zh-container`（居中并带页边距）。
- 尺寸：`zh-w-full`、`zh-w-1-2`、`zh-w-1-3`、`zh-w-2-3`、`zh-w-1-4`、`zh-w-3-4`、`zh-w-auto`、`zh-h-full`、`zh-max-w-sm|md|lg|xl|2xl|prose|full`、`zh-size-N`、`zh-size-control`（和控件同高的方块）。
- 定位与层级：`zh-relative`、`zh-absolute`、`zh-fixed`、`zh-sticky`、`zh-top-0`、`zh-inset-0`、`zh-z-dropdown|modal|popover|toast|tooltip`。
- 溢出：`zh-overflow-hidden|auto|x-auto|y-auto`、`zh-scrollbar-thin`、`zh-scrollbar-none`。

## 文字

- 字号：`zh-text-xs|sm|base|lg|xl|2xl|3xl`；字重 `zh-font-normal|medium|semibold|bold`；等宽 `zh-font-mono`；数字等宽 `zh-tabular-nums`。
- 对齐：`zh-text-left|center|right`；换行 `zh-text-nowrap`、`zh-text-balance`、`zh-break-words`。
- 截断：`zh-truncate`（单行省略）、`zh-line-clamp-1` 到 `4`。
- 颜色：`zh-text-primary|secondary|tertiary|disabled|brand|success|warning|danger|info`；涨跌 `zh-text-trend-up|down|flat`。涨跌色随 `data-trend` 变，好坏用 `zh-text-good|bad`，两者不要混用。
- 无障碍：`zh-sr-only`（只给读屏读）。

## 背景、边框、阴影

- 背景：`zh-bg-page|subtle|elevated|brand-subtle|success-subtle|warning-subtle|danger-subtle|info-subtle`。
- 边框：`zh-border`、`zh-border-t|b|l|r`、`zh-border-brand|danger|success|warning|strong`、`zh-divider`（分隔线）。
- 圆角：`zh-rounded-sm|md|lg|full|none`；阴影：`zh-shadow-sm|md|lg|none`；透明度 `zh-opacity-25|50|75|100`。
- 交互：`zh-hover-bg-subtle`、`zh-hover-lift`（悬停上浮）、`zh-cursor-pointer`、`zh-pointer-events-none`。

## 响应式

断点和主题的屏幕档一致：

| 后缀 | 范围 |
| --- | --- |
| `-phone` | 宽度不超过 767px |
| `-tablet` | 768px 到 1199px |
| `-desktop` | 1200px 到 1919px |
| `-large` | 1920px 及以上 |

- 显示与隐藏：`zh-hide-phone|tablet|desktop|large`，以及 `zh-hide-tablet-down`（平板和更窄）、`zh-hide-desktop-up`（桌面和更宽）。
- 只在某一档显示：`zh-show-phone-only|tablet-only|desktop-only|large-only`；它们在其他档隐藏，在所属档显示为 `display:block`，需要 flex 时给里面再套一层。
- 带档位后缀的类：`zh-cols-N`、`zh-col-span-N`、`zh-flex-col`、`zh-flex-row`、`zh-flex-wrap`、`zh-gap-N`（0、2、3、4、6）、`zh-items-*`、`zh-justify-*`、`zh-mt-N` 与 `zh-mb-N`（0、2、3、4、6）、`zh-p-N` 与 `zh-px-N` 与 `zh-py-N`、`zh-text-left|center|right`、`zh-text-xs|sm|base|lg|xl|2xl`、`zh-w-auto|full`。写法是 `zh-cols-3 zh-cols-1-phone`：基础值加某一档的覆盖。

```html
<div class="zh-d-grid zh-cols-3 zh-cols-1-phone zh-gap-4">
  <div class="zh-card">一</div>
  <div class="zh-card">二</div>
  <div class="zh-card">三</div>
</div>
<aside class="zh-hide-phone">手机上不显示的侧栏</aside>
```

## 动画

- 入场与强调：`zh-anim-fade-in|fade-out|slide-up|slide-down|scale-in|pop|bounce|shake|pulse|ping|float|wiggle|heartbeat|spin|shimmer`。
- 调节：`zh-duration-fast|base|slow`、`zh-ease-standard|enter|exit|spring`、`zh-delay-0` 到 `zh-delay-6`。
- 用户系统开启“减少动态效果”时，库会让所有 `zh-` 元素的动画立即结束且不循环（包括 `zh-anim-spin`），不需要自己处理。
