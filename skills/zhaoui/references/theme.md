# 主题

主题由 `<html>`（或任意祖先元素）上的 `data-*` 属性控制，互相独立，可任意组合。不写则用默认值。

| 属性 | 取值 | 默认 | 作用 |
|---|---|---|---|
| `data-audience` | `b` / `c` | `b` | B 端（中后台）与 C 端（消费端）：字号、圆角、控件高度、动效时长、阴影 |
| `data-mode` | `light` / `dark` | `light` | 亮色与暗色 |
| `data-density` | `compact` / `standard` / `comfortable` | `standard` | 控件高度与内边距 |
| `data-trend` | `cn` / `intl` | `cn` | 涨跌色：`cn` 红涨绿跌，`intl` 绿涨红跌 |
| `data-brand` | `indigo` / `teal` / `coral` / `violet` / `rose` | `indigo` | 五套预置品牌色 |
| `data-style` | `flat` / `glass` | `flat` | 表面风格，`glass` 需要额外引入风格包 |

```html
<html data-audience="c" data-mode="dark" data-density="comfortable">
```

深色模式只由 `data-mode` 控制，**不会**自动跟随系统的深色设置。如果需要跟随，请自己读取 `matchMedia('(prefers-color-scheme: dark)')` 后设置属性。

## 用代码切换

```js
ZhaoUI.setTheme({ mode: 'dark', audience: 'c' });   // 只改你传入的键
ZhaoUI.setBrand('#00857f');                          // 用任意颜色生成整套品牌色
```

`setBrand` 接收一个十六进制颜色，自动生成 10 级色阶和主色状态，并保证主色按钮上的文字满足 4.5:1 对比度。第二个参数可以指定生效的元素，默认是 `<html>`。

## 在页面里使用 Token

所有 Token 都是 CSS 变量，自己写的样式请直接引用，不要写死颜色和间距：

```css
.my-card {
  background: var(--zh-bg-elevated);
  border: 1px solid var(--zh-border);
  border-radius: var(--zh-radius-lg);
  padding: var(--zh-space-5);
  color: var(--zh-text);
}
.my-card .hint { color: var(--zh-text-tertiary); }
.my-card .error { color: var(--zh-text-danger); }   /* 文字请用带 text 的一档，图形才用 --zh-danger */
```

常用变量：`--zh-bg`、`--zh-bg-subtle`、`--zh-bg-elevated`、`--zh-border`、`--zh-text`、`--zh-text-secondary`、`--zh-text-tertiary`、`--zh-color-primary`、`--zh-color-primary-text`、`--zh-space-1` 到 `--zh-space-12`、`--zh-radius-sm/md/lg`、`--zh-shadow-sm/md/lg`、`--zh-control-h`。完整列表见 `tokens.json`。

**强调色**：`--zh-accent-a`、`--zh-accent-b`、`--zh-accent-c` 是品牌色旋转色相得到的三个颜色，随 `ZhaoUI.setBrand()` 变化；`--zh-gradient-accent` 把它们连成渐变。它们保证在白底和深色底上至少 3:1，所以只用于大字、数字和装饰，正文和小字请用 `--zh-color-primary-text`。想用自己的配色时，在外层元素上覆盖这三个变量即可。

## 涨跌色

涨跌方向的颜色会随 `data-trend` 切换（`cn` 红涨绿跌，`intl` 绿涨红跌），写成变量，直接引用即可，不需要判断地区：

```css
.up   { color: var(--zh-trend-up); }     /* 上涨 */
.down { color: var(--zh-trend-down); }   /* 下跌 */
.flat { color: var(--zh-trend-flat); }   /* 持平 */
```

「好 / 坏」这类语义色是固定的、不随地区变化：成功用 `--zh-text-success`，警告 `--zh-text-warning`，危险 `--zh-text-danger`。不要把涨跌色当作好坏色用。

## 玻璃拟态（实验性）

```html
<link rel="stylesheet" href="zhaoui.css">
<link rel="stylesheet" href="zhaoui-style-glass.css">
<html data-style="glass">
```

风格包里有一部分规则是针对演示页外壳（`body`、`.topbar` 等）写的，在你自己的页面里表现如何，**目前没有在独立页面里测试过**，使用前请自行确认。浏览器不支持背景模糊、或用户开启了「减少透明度」时，会退回实色表面。


## 风格方案与点缀色

需要选择视觉方向、使用活泼纸感或增加小面积配色时，见[风格方案与点缀色](design-recipes.md)。它是可选的项目配方，沿用现有主题属性。
