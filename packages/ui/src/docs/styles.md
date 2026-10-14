# 样式类

下面是不需要 JS 就能使用的样式类，已在独立页面里验证过。

## 按钮

```html
<button class="zh-btn primary">主要</button>
<button class="zh-btn">默认</button>
<button class="zh-btn text">文字</button>
<button class="zh-btn danger">危险</button>
<button class="zh-btn" aria-disabled="true">禁用</button>
```

- 一个区域只放一个主按钮，其余用默认按钮或文字按钮。
- 危险操作用 `danger`，不要默认高亮；需要二次确认时，确认框里的确认按钮才用满色。
- 只有图标的按钮必须加 `aria-label`。
- 高度由 `--zh-control-h` 决定，随受众与密度变化。

## 提示气泡

```html
<button class="zh-btn zh-tip" data-tip="这是一条提示">悬停</button>
```

纯 CSS，鼠标悬停和键盘聚焦都会显示。

## 其他

卡片、表格、表单控件、栅格、警告条、空状态、骨架屏、面包屑、描述列表、结果页、按钮组、列表、代码、图片、页脚、评论、遮罩条、加载中、键位、页头等纯样式组件，都在各自的组件文档里（`components/` 目录），示例已在浏览器里测过。可选的公共类见 [公共类](utilities.md)。
