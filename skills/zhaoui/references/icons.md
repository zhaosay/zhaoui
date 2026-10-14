# 图标

图标使用 [Lucide](https://lucide.dev)（ISC 协议）。禁止使用 emoji。

## 用法

```html
<i data-i="chevron-down"></i>
<i data-i="check" data-s="20"></i>     <!-- data-s 指定像素尺寸，默认 1.15em -->
```

`zhaoui.js` 加载后，`<i data-i>` 会被替换成内联 SVG，颜色跟随文字颜色。图标线宽跟随受众：B 端 1.75，C 端 2。

## 内置图标

`zhaoui.js` 内置了组件自身要用到的 36 个：`chevron-right`、`chevron-down`、`chevron-up`、`chevron-left`、`x`、`check`、`info`、`circle-check`、`circle-x`、`triangle-alert`、`circle-alert`、`loader-circle`、`search`、`plus`、`minus`、`eye`、`eye-off`、`pencil`、`user`、`chevrons-left`、`chevrons-right`、`star`、`heart`、`layout-dashboard`、`file-text`、`settings`、`panel-left-close`、`panel-left-open`、`menu`、`search-x`、`cloud-upload`、`calendar-days`、`calendar-range`、`calendar-clock`、`clock`、`arrow-right`。

## 完整图标集

需要其他图标时，在 `zhaoui.js` **之后**再引入 `zhaoui-icons.js`（约 67KB，含全部 372 个）：

```html
<script src="zhaoui.js"></script>
<script src="zhaoui-icons.js"></script>
```

## 自定义图标

```js
ZhaoUI.icons.add('my-logo', '<path d="M4 4h16v16H4z"/>');   // 24×24 视口，描边风格
```

```html
<i data-i="my-logo"></i>
```

## 无障碍

图标默认是装饰性的（`aria-hidden="true"`）。只有图标的按钮必须自己加 `aria-label`：

```html
<button class="zh-btn" aria-label="关闭"><i data-i="x"></i></button>
```
