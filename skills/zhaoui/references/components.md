# 组件参考

## 锚点目录

长页面的“本页目录”：一列指向页内各节的链接，滚动时自动标出当前所在的一节，点击平滑滚动过去。适合文档、设置页的右侧。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div style="display:flex;gap:24px;align-items:flex-start">
  <nav data-zh-anchor data-target="#an-box" data-offset="8" style="width:12rem;flex:none">
    <ul>
      <li><a href="#an-a">简介</a></li>
      <li><a href="#an-b">用法</a>
        <ul><li><a href="#an-c">属性</a></li></ul>
      </li>
    </ul>
  </nav>
  <div id="an-box" tabindex="0" role="region" aria-label="文档内容" style="height:12rem;overflow:auto;flex:1;min-width:0;padding:0 16px;border:1px solid var(--zh-border);border-radius:var(--zh-radius-md)">
    <p id="an-a" style="margin-top:0"><strong>简介</strong></p><p style="height:7rem">锚点目录适合长页面。</p>
    <p id="an-b"><strong>用法</strong></p><p style="height:7rem">把目录放在内容旁边。</p>
    <p id="an-c"><strong>属性</strong></p><p style="height:9rem">data-offset、data-target。</p>
  </div>
</div>
```

### 样式类

`zh-anchor`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-zh-anchor` | <nav> | 里面放 <ul><li><a href="#节的id"> | 声明为锚点目录；嵌套的 <ul> 表示二级标题 |
| `data-offset` | <nav> | 像素，默认 16 | 滚动后目标离顶部保留的距离；页面有吸顶导航条时设成它的高度 |
| `data-target` | <nav> | 选择器 | 内容在某个可滚动容器里时，监听它而不是整个页面 |

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:anchor-change` | <nav> | undefined | 当前所在的一节变化 |

### 无障碍

- 当前节用 aria-current="location" 标出
- 点击后目标节获得焦点（不再触发二次滚动），键盘用户可继续往下读
- 给 <nav> 加 aria-label，默认是“本页目录”
- 系统开启“减少动态效果”时直接跳转，不做平滑滚动
- 链接的目标 id 必须存在，否则该项被忽略

## 常见问题

### 锚点目录是什么？

长页面的“本页目录”：一列指向页内各节的链接，滚动时自动标出当前所在的一节，点击平滑滚动过去。适合文档、设置页的右侧。

### 怎么使用锚点目录？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 锚点目录有哪些事件？

zh:anchor-change（当前所在的一节变化）。

### 锚点目录支持键盘和读屏吗？

当前节用 aria-current="location" 标出；点击后目标节获得焦点（不再触发二次滚动），键盘用户可继续往下读；给 <nav> 加 aria-label，默认是“本页目录”。

### 锚点目录需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 头像

图片头像；图片缺失或加载失败时，用姓名首字（中文取第一个字，英文取首字母）和由姓名决定的颜色代替。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<span class="zh-avatar" data-name="张三" data-size="md"></span>
<span class="zh-avatar" data-name="Ada Lovelace" data-size="md"></span>
<span class="zh-avatar" data-name="设计" data-size="md" data-shape="square"></span>
<span class="zh-avatar" data-name="在线" data-size="lg" data-status="success"></span>
```

### 样式类

`zh-avatar`、`zh-avatar-face`、`zh-avatar-status`、`zh-avatar-group`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-name` | .zh-avatar | 字符串 | 姓名；必填，库据此初始化，也是无障碍名称 |
| `data-src` | .zh-avatar | 图片地址 | 头像图片；加载失败自动退回首字 |
| `data-size` | .zh-avatar | xs \| sm \| md \| lg \| xl | 尺寸 |
| `data-shape` | .zh-avatar | square \| circle（默认） | 方形头像，默认圆形 |
| `data-icon` | .zh-avatar | 图标名 | 用图标代替首字 |
| `data-status` | .zh-avatar | success \| warning \| danger \| primary | 右下角的在线状态点 |
| `data-tone` | 头像 | brand | 用品牌色代替按名字挑选的 8 种分类色，适合一个品牌页里所有头像颜色一致 |

### 无障碍

- 元素带 role="img" 与 aria-label（取姓名）
- 状态点只是装饰，需要传达状态时请在旁边写文字

## 常见问题

### 头像是什么？

图片头像；图片缺失或加载失败时，用姓名首字（中文取第一个字，英文取首字母）和由姓名决定的颜色代替。

### 怎么使用头像？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 头像支持键盘和读屏吗？

元素带 role="img" 与 aria-label（取姓名）；状态点只是装饰，需要传达状态时请在旁边写文字。

### 头像需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 返回顶部

滚动超过一段距离后出现的圆形按钮，点击平滑回到顶部；系统开启“减少动态效果”时直接跳回。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<button class="zh-backtop" data-zh-backtop data-threshold="200"></button>
```

### 样式类

`zh-backtop`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-zh-backtop` | <button>（可为空） |  | 声明为返回顶部按钮；空按钮会自动放入向上的箭头图标和 aria-label |
| `data-threshold` | 按钮 | 像素，默认 400 | 滚动超过多少像素后出现 |
| `data-target` | 按钮 | 选择器 | 监听某个可滚动容器而不是整页；这时按钮不会固定在视口，需要你自己定位 |

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:backtop` | 按钮 | 无 | 点击回到顶部时触发 |

### 无障碍

- 未出现时 aria-hidden=true 且不可聚焦
- 按钮没有文字时自动加 aria-label="返回顶部"；你也可以自己写

## 常见问题

### 返回顶部是什么？

滚动超过一段距离后出现的圆形按钮，点击平滑回到顶部；系统开启“减少动态效果”时直接跳回。

### 怎么使用返回顶部？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 返回顶部有哪些事件？

zh:backtop（点击回到顶部时触发）。

### 返回顶部支持键盘和读屏吗？

未出现时 aria-hidden=true 且不可聚焦；按钮没有文字时自动加 aria-label="返回顶部"；你也可以自己写。

### 返回顶部需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 徽标

挂在头像、图标、按钮角上的数字、红点或文字徽标。数量为 0 时自动隐藏，超过上限显示 99+。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<span class="zh-bdg"><button class="zh-btn" aria-label="消息">消息</button><span class="zh-bdg-mark" id="unread" data-count="5" data-tone="danger" data-label="条未读"></span></span>
<span class="zh-bdg"><button class="zh-btn">待办</button><span class="zh-bdg-mark" data-count="128" data-tone="primary" data-label="项待办"></span></span>
<span class="zh-bdg"><button class="zh-btn">动态</button><span class="zh-bdg-mark" data-dot="true" data-tone="danger" data-label="有更新"></span></span>
<span class="zh-bdg"><button class="zh-btn">功能</button><span class="zh-bdg-mark" data-text="NEW" data-tone="success"></span></span>

<script>
var m = document.getElementById('unread');
m.dataset.count = '12';
ZhaoUI.badge.paint(m); ZhaoUI.badge.pop(m);
</script>
```

### 样式类

`zh-bdg`、`zh-bdg-mark`、`zh-bdg-status`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-count` | .zh-bdg-mark | 整数 | 数字徽标；0 时隐藏（除非 data-show-zero） |
| `data-max` | .zh-bdg-mark | 整数，默认 99 | 超过则显示 99+ |
| `data-dot` | .zh-bdg-mark | true | 红点模式，只表示有更新 |
| `data-text` | .zh-bdg-mark | 字符串，如 NEW | 文字徽标 |
| `data-tone` | .zh-bdg-mark | danger \| primary \| success \| warning \| info \| neutral | 颜色 |
| `data-label` | .zh-bdg-mark | 字符串，如「条未读消息」 | 读屏时跟在数字后面，务必填写 |
| `data-pos` | .zh-bdg（外层） | top-left \| bottom-left \| bottom-right（默认右上） | 徽标相对被包裹元素的位置，默认右上 |
| `data-show-zero` | .zh-bdg-mark | true | 数量为 0 也显示 |

### 方法

- `ZhaoUI.badge.paint(el)`：修改 data-count 等属性后调用，重新渲染
- `ZhaoUI.badge.pop(el)`：播放一次弹跳动画（开启「减少动态效果」时不播放）

### 无障碍

- 可见的数字是 aria-hidden，另有视觉隐藏的文字读作「5 条未读」，所以 data-label 很重要
- 隐藏时设置 aria-hidden="true"

## 常见问题

### 徽标是什么？

挂在头像、图标、按钮角上的数字、红点或文字徽标。数量为 0 时自动隐藏，超过上限显示 99+。

### 怎么使用徽标？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写；需要用代码控制时，用「方法」里列出的接口。

### 徽标有哪些方法？

ZhaoUI.badge.paint(el)：修改 data-count 等属性后调用，重新渲染；ZhaoUI.badge.pop(el)：播放一次弹跳动画（开启「减少动态效果」时不播放）。

### 徽标支持键盘和读屏吗？

可见的数字是 aria-hidden，另有视觉隐藏的文字读作「5 条未读」，所以 data-label 很重要；隐藏时设置 aria-hidden="true"。

### 徽标需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 面包屑

纯样式组件：不需要 JS，写好标记即可。页面层级路径。当前页用 aria-current="page"；手机宽度只保留最后两级。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<nav aria-label="面包屑">
  <ol class="zh-crumb">
    <li><a href="#">首页</a></li>
    <li><a href="#">内容管理</a></li>
    <li aria-current="page">文章管理</li>
  </ol>
</nav>
```

### 样式类

`zh-crumb`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `zh-crumb` | <ol>（class） | 每一级一个 <li>，前面的用 <a>，最后一级用 aria-current="page" | 分隔符由样式画出，不用自己写 / |
| `aria-current="page"` | 最后一个 <li> | page | 当前页，样式加深，读屏读作「当前页」 |

### 无障碍

- 外面包一层 <nav aria-label="面包屑">
- 使用有序列表 <ol>，层级关系读屏可感知
- 手机宽度（≤ 767px）只显示最后两级，其余在样式里隐藏，读屏仍然可读到完整路径

## 常见问题

### 面包屑是什么？

页面层级路径。当前页用 aria-current="page"；手机宽度只保留最后两级。

### 怎么使用面包屑？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 面包屑支持键盘和读屏吗？

外面包一层 <nav aria-label="面包屑">；使用有序列表 <ol>，层级关系读屏可感知；手机宽度（≤ 767px）只显示最后两级，其余在样式里隐藏，读屏仍然可读到完整路径。

### 面包屑需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 按钮组

纯样式组件：不需要 JS，写好标记即可。把几个相关按钮连成一组：共用边框，只有两端有圆角。常用来做视图切换或分段筛选；选中项用 is-active 或 aria-pressed="true"。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div class="zh-btn-group" role="group" aria-label="视图">
  <button class="zh-btn" aria-pressed="true">列表</button>
  <button class="zh-btn" aria-pressed="false">卡片</button>
  <button class="zh-btn" aria-pressed="false">看板</button>
</div>
```

### 样式类

`zh-btn-group`、`zh-btn-group--vertical`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `zh-btn-group` | 容器（class） | 里面放多个 zh-btn | 横向连接的一组按钮 |
| `zh-btn-group--vertical` | .zh-btn-group |  | 竖向排列 |
| `is-active / aria-pressed="true"` | 组内的按钮 |  | 选中状态；切换时由你的代码更新 |

### 无障碍

- 外层加 role="group" 和 aria-label 说明这组按钮的用途
- 做开关式选择时用 aria-pressed，并在点击时更新它

## 常见问题

### 按钮组是什么？

把几个相关按钮连成一组：共用边框，只有两端有圆角。常用来做视图切换或分段筛选；选中项用 is-active 或 aria-pressed="true"。

### 怎么使用按钮组？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 按钮组支持键盘和读屏吗？

外层加 role="group" 和 aria-label 说明这组按钮的用途；做开关式选择时用 aria-pressed，并在点击时更新它。

### 按钮组需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 内嵌日历

一直显示在页面里的月历（不是弹出的选择器）：点选一天、键盘切换、月年快速跳转，可禁用日期，还能给某些天加小圆点或热力底色（如日程、签到）。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。只用核心包时，还要加 `modular/date.min.js` 和 `modular/date.min.css`；全量版已包含。

### 用法

```html
<div id="cal-demo" style="max-width:22rem"></div>
<script>
  var cal = ZhaoUI.calendar('#cal-demo', {
    value: new Date(),
    disabledDate: function (d) { return d.getDay() === 0 ? '周日休息' : ''; },
    marks: function (d) { return d.getDate() % 5 === 0 ? { dots: [1, 3], label: '2 项日程' } : null; }
  });
</script>
```

### 样式类

`zh-dp-inline`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-zh-calendar` | <div> |  | 声明为内嵌日历 |
| `data-value` | <div> | YYYY-MM-DD | 默认选中的日期，也决定初始显示的月份 |
| `data-min / data-max` | <div> | YYYY-MM-DD | 可选范围 |
| `data-disable-weekends` | <div> |  | 周末不可选 |
| `data-disabled-dates` | <div> | 逗号分隔的日期 | 指定不可选的日期 |

### 方法

- `ZhaoUI.calendar(host, config)`：命令式创建。config：value、min、max、disabledDate(d)（返回原因文字即禁用，返回空则可选）、marks(d)
- `marks(d)`：返回 null，或 { dots: [1 到 8], label }（最多 3 个小圆点，数字是图表色序号）或 { heat: 1 到 3, label }（热力底色深浅）；label 会写进该日的无障碍名称
- `host.zhCalendar.get() / set(v) / refresh()`：读取选中日期、设置选中日期（字符串或 Date）、数据变化后重画标记

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:calendar-change` | <div> | undefined | 选中了某一天 |

### 无障碍

- 日期网格是 role=grid，方向键移动，PageUp/PageDown 换月，Enter 选中
- 每个日期按钮的名称包含完整日期和你给的 label，如“10 月 4 日 星期五，2 项日程”
- 标记不要只靠颜色：label 里要写出含义
- 本组件需要日期时间模块（modular/date.js），完整版 zhaoui.js 已包含

## 常见问题

### 内嵌日历是什么？

一直显示在页面里的月历（不是弹出的选择器）：点选一天、键盘切换、月年快速跳转，可禁用日期，还能给某些天加小圆点或热力底色（如日程、签到）。

### 怎么使用内嵌日历？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写；需要用代码控制时，用「方法」里列出的接口。

### 内嵌日历有哪些事件？

zh:calendar-change（选中了某一天）。

### 内嵌日历有哪些方法？

ZhaoUI.calendar(host, config)：命令式创建。config：value、min、max、disabledDate(d)（返回原因文字即禁用，返回空则可选）、marks(d)；marks(d)：返回 null，或 { dots: [1 到 8], label }（最多 3 个小圆点，数字是图表色序号）或 { heat: 1 到 3, label }（热力底色深浅）；label 会写进该日的无障碍名称；host.zhCalendar.get() / set(v) / refresh()：读取选中日期、设置选中日期（字符串或 Date）、数据变化后重画标记。

### 内嵌日历支持键盘和读屏吗？

日期网格是 role=grid，方向键移动，PageUp/PageDown 换月，Enter 选中；每个日期按钮的名称包含完整日期和你给的 label，如“10 月 4 日 星期五，2 项日程”；标记不要只靠颜色：label 里要写出含义。

### 内嵌日历需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 卡片

纯样式组件：不需要 JS，写好标记即可。带边框、圆角、阴影的内容容器。可只放一个标题和内容，也可用 zh-card--flush 配头部、正文、底部、封面图；整张卡片可点时用 zh-card--hover。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div class="zh-stack">
  <div class="zh-card">
    <h4>基础卡片</h4>
    <p>容器负责边界与留白，内容由业务决定。</p>
    <div class="zh-cardx-meta"><span class="zh-tag primary">品牌</span><span class="zh-tag">默认</span></div>
  </div>

  <div class="zh-card zh-card--flush" style="max-width:22rem">
    <div class="zh-cardx-cover"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect width='16' height='9' fill='%23c7d2fe'/%3E%3C/svg%3E" alt="设计语言 2.0 的封面"></div>
    <div class="zh-cardx-head"><h4 class="zh-cardx-title">发布确认</h4><div class="zh-cardx-extra"><button class="zh-btn sm text">全部</button></div></div>
    <div class="zh-cardx-body">确认后文章将立即对外可见。</div>
    <div class="zh-cardx-foot"><button class="zh-btn sm">取消</button><button class="zh-btn sm primary">发布</button></div>
  </div>

  <div class="zh-card">
    <div class="zh-cardx-stat-label">活跃用户</div>
    <strong>12.4 万</strong>
    <div class="zh-cardx-stat-foot"><span style="color:var(--zh-trend-up)">+8.2%</span><span class="zh-hint">较上周</span></div>
  </div>

  <a class="zh-card zh-card--hover" href="#"><h4>进入项目</h4><p>查看成员、进度与最近动态。</p></a>
</div>
```

### 样式类

`zh-card`、`zh-card--flush`、`zh-card--hover`、`zh-cardx-head`、`zh-cardx-title`、`zh-cardx-extra`、`zh-cardx-body`、`zh-cardx-foot`、`zh-cardx-cover`、`zh-cardx-meta`、`zh-cardx-stat-label`、`zh-cardx-stat-foot`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `zh-card` | <div>（class） | 内部可放 <h4> 作标题 | 基础卡片：内边距、边框、圆角、阴影随受众与密度变化 |
| `zh-card--flush` | 与 zh-card 一起 | 配合下面的 zh-cardx-* 分区 | 去掉内边距，由 head / body / foot 各自控制；溢出裁切，封面图贴边 |
| `zh-cardx-head / -title / -extra` | flush 卡片内 | 标题在左，-extra 里放右侧操作按钮 | 卡片头部 |
| `zh-cardx-body / -foot` | flush 卡片内 | -foot 里放右对齐的按钮 | 正文与底部操作区 |
| `zh-cardx-cover` | flush 卡片内 | 里面放一张 <img alt="…"> 或一个 <svg> | 封面区域：16:9 比例、浅色底，里面的图片或 SVG 撑满并裁切；放在卡片最上面 |
| `zh-cardx-meta` | 卡片内 | 里面放 zh-tag | 一行标签或元信息 |
| `zh-cardx-stat-label / -stat-foot` | 基础卡片内 | label 是指标名，foot 放趋势与说明 | 指标卡的两端；中间的数字自己写（用 --zh-text 等变量），库不提供数字样式 |
| `zh-card--hover` | 写在 <a> 上，与 zh-card 一起 | href 指向目标 | 整张卡片是链接：悬停上浮并描边，键盘聚焦有聚焦环 |

### 无障碍

- zh-card--hover 应该是真正的 <a href>，这样键盘可聚焦、屏幕阅读器读作链接
- 卡片标题请用合适的标题级别（<h4> 只是样式默认，按页面结构调整）
- 装饰性封面图保持 aria-hidden="true"；有信息量的图片请放 <img alt>
- zh-card--select（选择型卡片）的样式在 CSS 里，但选中行为没有提供，不要使用

## 常见问题

### 卡片是什么？

带边框、圆角、阴影的内容容器。可只放一个标题和内容，也可用 zh-card--flush 配头部、正文、底部、封面图；整张卡片可点时用 zh-card--hover。

### 怎么使用卡片？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 卡片支持键盘和读屏吗？

zh-card--hover 应该是真正的 <a href>，这样键盘可聚焦、屏幕阅读器读作链接；卡片标题请用合适的标题级别（<h4> 只是样式默认，按页面结构调整）；装饰性封面图保持 aria-hidden="true"；有信息量的图片请放 <img alt>。

### 卡片需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 轮播

一组幻灯片：左右箭头、圆点、键盘方向键、触屏滑动（基于 CSS 滚动吸附）；可自动播放。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div data-zh-carousel data-autoplay="6000" aria-label="精选内容" style="max-width:28rem">
  <div class="zh-carousel-track">
    <div class="zh-carousel-slide" style="aspect-ratio:16/9;display:grid;place-items:center;background:var(--zh-color-primary-subtle)">第一张</div>
    <div class="zh-carousel-slide" style="aspect-ratio:16/9;display:grid;place-items:center;background:var(--zh-bg-subtle)">第二张</div>
    <div class="zh-carousel-slide" style="aspect-ratio:16/9;display:grid;place-items:center;background:var(--zh-info-bg)">第三张</div>
  </div>
</div>
```

### 样式类

`zh-carousel`、`zh-carousel-track`、`zh-carousel-slide`、`zh-carousel-arrow`、`zh-carousel-dots`、`zh-carousel-dot`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-zh-carousel` | 容器 | 里面放 .zh-carousel-track，轨道里放多个 .zh-carousel-slide | 声明为轮播；箭头和圆点由库生成 |
| `data-autoplay` | 容器 | 毫秒，如 5000 | 自动播放间隔；悬停、聚焦、页面不可见或系统开启“减少动态效果”时暂停 |
| `data-loop` | 容器 |  | 在首尾循环，否则到头时箭头禁用 |

### 方法

- `ZhaoUI.carousel.go(el, index)`：切换到第 index 张（从 0 开始）

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:carousel-change` | 容器 | { index, slide } | 切换到另一张后触发 |

### 无障碍

- 容器是 role="region"，带“轮播”说明，每张幻灯片是“第 n / 总数”
- 轨道可聚焦，左右方向键切换；箭头和圆点都是按钮，有 aria-label
- 自动播放在鼠标悬停或键盘聚焦时暂停，并让读屏朗读当前内容；可随时被用户中断

## 常见问题

### 轮播是什么？

一组幻灯片：左右箭头、圆点、键盘方向键、触屏滑动（基于 CSS 滚动吸附）；可自动播放。

### 怎么使用轮播？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写；需要用代码控制时，用「方法」里列出的接口。

### 轮播有哪些事件？

zh:carousel-change（切换到另一张后触发）。

### 轮播有哪些方法？

ZhaoUI.carousel.go(el, index)：切换到第 index 张（从 0 开始）。

### 轮播支持键盘和读屏吗？

容器是 role="region"，带“轮播”说明，每张幻灯片是“第 n / 总数”；轨道可聚焦，左右方向键切换；箭头和圆点都是按钮，有 aria-label；自动播放在鼠标悬停或键盘聚焦时暂停，并让读屏朗读当前内容；可随时被用户中断。

### 轮播需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 级联选择

多级联动选择（省市区、分类树）。数据写成页面里的嵌套列表，或用 ZhaoUI.cascader 传一棵树。支持搜索、悬停展开，窄屏自动变成逐级下钻。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。只用核心包时，还要加 `modular/select.min.js` 和 `modular/select.min.css`；全量版已包含。

### 用法

```html
<div data-zh-cascader data-name="region" data-searchable data-value="浙江/杭州/西湖区" data-placeholder="请选择地区" aria-label="地区">
  <ul hidden>
    <li>浙江
      <ul>
        <li>杭州<ul><li>西湖区</li><li>余杭区</li></ul></li>
        <li>宁波<ul><li>海曙区</li><li>鄞州区</li></ul></li>
      </ul>
    </li>
    <li>江苏<ul><li>南京<ul><li>玄武区</li></ul></li></ul></li>
    <li data-disabled>海南<ul><li>海口<ul><li>龙华区</li></ul></li></ul></li>
  </ul>
</div>

<div id="cas2"></div>

<script>
document.querySelector('[data-zh-cascader]').addEventListener('zh:cascader-change', function (e) {
  console.log(e.detail.text);   // 浙江 / 杭州 / 西湖区
});

ZhaoUI.cascader('#cas2', {
  expandTrigger: 'hover',
  data: [{ label: '前端', value: 'fe', children: [{ label: 'Vue', value: 'vue' }, { label: 'React', value: 'react' }] }],
  onChange: function (labels, text, nodes) { console.log(nodes.map(function (n) { return n.value; })); }
});
</script>
```

### 样式类

`zh-sel`、`zh-cas-panel`、`zh-cas-col`、`zh-cas-item`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-zh-cascader` | 容器 <div> | 无 | 声明这是一个级联选择；容器里的第一个 <ul> 是数据，读取后会被替换成控件 |
| `data-name` | 容器 | 字段名 | 生成一个隐藏 <input name=…> 参与表单提交，值是用 / 连接的路径（如 浙江/杭州/西湖区）；如果路径上每个节点都写了 data-value，则用 data-value 连接 |
| `data-value` | 容器 | 用 / 连接的标签路径，如 浙江/杭州/西湖区 | 初始选中的路径；标签里含有 / 时请改用命令式 |
| `data-placeholder` | 容器 | 字符串 | 占位文字，默认「请选择」 |
| `data-searchable` | 容器 | 布尔属性 | 可输入搜索，匹配完整路径文字，只搜到叶子节点 |
| `data-clearable` | 容器 | false 表示关闭 | 默认有清除按钮 |
| `data-expand-trigger` | 容器 | click（默认）\| hover | 悬停展开下一级；触屏和窄屏始终是点击 |
| `data-size` | 容器 | sm \| md（默认）\| lg | 尺寸 |
| `data-sep` | 容器 | 字符串，默认「 / 」 | 输入框里各级之间的分隔文字 |
| `data-labelledby` | 容器 | 标签元素的 id | 无障碍名称；也可以直接写 aria-label |
| `data-disabled / data-value` | <li> | 布尔属性 / 字符串 | 禁用该节点及其子树 / 该节点的值（用于表单） |
| `<label for="容器 id">` | 容器所在页面的 <label> | for 指向容器的 id | label 会成为输入框的无障碍名称，点击 label 会聚焦输入框；容器是空 <div>，label 的 for 指向它的 id 即可 |

### 方法

- `ZhaoUI.cascader(host, { data, value, searchable, clearable, expandTrigger, size, placeholder, sep, labelledby, onChange })`：命令式创建。data 是节点树 [{ label, children?, disabled?, …你的字段 }]；value 是标签数组；onChange(labels, text, nodes)
- `el.zhCascader.get() / .getNodes()`：读取当前路径的标签数组 / 节点对象数组
- `el.zhCascader.set(labels) / .setData(tree) / .open() / .close()`：设置路径（不触发 change，并同步隐藏字段）、更换数据、打开、关闭

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:cascader-change` | 容器 | { path, text, nodes } | 选中或清除后触发（冒泡）。path 是标签数组，text 是拼好的文字，nodes 是节点对象数组（能读到你自己加的字段，如 value）；清除时都是空的 |

### 无障碍

- 输入框是 role="combobox"，各级是 role="listbox"，带 aria-selected 与 aria-activedescendant
- ↓ ↑ 在当前一级移动（跳过禁用项），→ 展开子级，← 回到上一级，Enter 选中叶子或展开分支，Esc / Tab 关闭
- 搜索时 ↓ ↑ 在结果里移动，Enter 选中；结果显示完整路径
- 窄屏（≤ 767px）改为逐级下钻，有「返回上一级」按钮，每一级都是整行的大点击区
- 禁用的节点标记 aria-disabled，不可展开也不可选

## 常见问题

### 级联选择是什么？

多级联动选择（省市区、分类树）。数据写成页面里的嵌套列表，或用 ZhaoUI.cascader 传一棵树。支持搜索、悬停展开，窄屏自动变成逐级下钻。

### 怎么使用级联选择？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写；需要用代码控制时，用「方法」里列出的接口。

### 级联选择有哪些事件？

zh:cascader-change（选中或清除后触发（冒泡）。path 是标签数组，text 是拼好的文字，nodes 是节点对象数组（能读到你自己加的字段，如 value）；清除时都是空的）。

### 级联选择有哪些方法？

ZhaoUI.cascader(host, { data, value, searchable, clearable, expandTrigger, size, placeholder, sep, labelledby, onChange })：命令式创建。data 是节点树 [{ label, children?, disabled?, …你的字段 }]；value 是标签数组；onChange(labels, text, nodes)；el.zhCascader.get() / .getNodes()：读取当前路径的标签数组 / 节点对象数组；el.zhCascader.set(labels) / .setData(tree) / .open() / .close()：设置路径（不触发 change，并同步隐藏字段）、更换数据、打开、关闭。

### 级联选择支持键盘和读屏吗？

输入框是 role="combobox"，各级是 role="listbox"，带 aria-selected 与 aria-activedescendant；↓ ↑ 在当前一级移动（跳过禁用项），→ 展开子级，← 回到上一级，Enter 选中叶子或展开分支，Esc / Tab 关闭；搜索时 ↓ ↑ 在结果里移动，Enter 选中；结果显示完整路径。

### 级联选择需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 图表

基础图表：折线、面积、柱状、环形、迷你趋势。颜色用主题固定的 8 色分类色板（随亮暗主题变化），只有一条纵轴（不做双纵轴），图例可点击隐藏某个系列，鼠标悬停或键盘左右键查看每个点的数值，并附带给读屏用的数据表。需要堆叠、散点、地图、动画等复杂图表时请用专门的图表库。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。只用核心包时，还要加 `modular/chart.min.js` 和 `modular/chart.min.css`；全量版已包含。

### 用法

```html
<div class="zh-stack">
  <div data-zh-chart data-type="line" data-title="近 7 天访问量">
    <script type="application/json">{ "labels": ["周一","周二","周三","周四","周五","周六","周日"], "series": [ { "name": "访问", "data": [1200, 1800, 1500, 2300, 2100, 2900, 3200] }, { "name": "下单", "data": [120, 190, 150, 260, 210, 330, 380] } ] }</script>
  </div>
  <div class="zh-row">
    <div style="width:12rem" data-zh-chart data-type="donut" data-height="180" data-title="渠道占比"><script type="application/json">{ "series": [ { "name": "自然", "data": [520] }, { "name": "广告", "data": [310] }, { "name": "推荐", "data": [170] } ] }</script></div>
    <div style="width:10rem" data-zh-chart data-type="spark" data-title="趋势"><script type="application/json">{ "labels": ["1","2","3","4","5","6"], "series": [ { "name": "值", "data": [3, 5, 4, 7, 6, 9] } ] }</script></div>
  </div>
  <div data-zh-chart data-type="bar" data-title="季度销售额"><script type="application/json">{ "labels": ["Q1","Q2","Q3","Q4"], "series": [ { "name": "华东", "data": [320, 410, 380, 520] }, { "name": "华南", "data": [280, 350, 400, 460] } ] }</script></div>
</div>
```

### 样式类

`zh-chart`、`zh-chart-stage`、`zh-chart-legend`、`zh-chart-key`、`zh-chart-tip`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-zh-chart` | <div> | 里面放 <script type="application/json">{…}</script> | 声明为图表；JSON 就是下面的配置 |
| `data-type` | <div> | line \| area \| bar \| donut \| spark | 图表类型，默认 line |
| `data-height` | <div> | 像素，默认 240 | 图表高度；spark 默认 40；宽度跟随容器 |
| `data-title` | <div> | 文字 | 图表标题，用于无障碍名称和数据表标题 |
| `data-no-legend` | <div> |  | 不显示图例 |

### 方法

- `ZhaoUI.chart(host, config)`：命令式创建，返回 { update(partialConfig), toggle(seriesIndex, visible) }。config：type、labels（横轴标签数组）、series（[{ name, data: [数字或 null] }]，null 表示断开）、height、title、legend、points（折线是否画点，默认 true）、format(value)（数值格式化，默认大数显示“万”“亿”）、inner（环形内圈比例，默认 0.62）、centerLabel（环形中心下方文字，默认“合计”）
- `环形图的数据`：每个系列只取第一个数，一个系列就是一块扇区；中心显示合计
- `柱状与折线`：柱状图从 0 开始；折线与面积图的纵轴自动取合适的刻度

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:chart-hover` | 图表容器 | undefined | 指针或键盘移到某个数据点 |
| `zh:chart-toggle` | 图表容器 | undefined | 点击图例显示或隐藏某个系列 |

### 无障碍

- 图表是 role=img，aria-label 是自动生成的摘要；同时附带一张视觉隐藏的数据表，读屏用户可以逐行读到全部数值
- 图表可聚焦，左右方向键逐点查看，Home/End 到首尾，Esc 隐藏提示；当前点的数值写入 aria-live 区域朗读
- 颜色之外还有图例文字、提示里的系列名，不靠颜色单独传递信息；超过 8 个系列时颜色会循环，请改用图表库或拆图
- 图例按钮带 aria-pressed；至少保留一个可见系列

## 常见问题

### 图表是什么？

基础图表：折线、面积、柱状、环形、迷你趋势。颜色用主题固定的 8 色分类色板（随亮暗主题变化），只有一条纵轴（不做双纵轴），图例可点击隐藏某个系列，鼠标悬停或键盘左右键查看每个点的数值，并附带给读屏用的数据表。需要堆叠、散点、地图、动画等复杂图表时请用专门的图表库。

### 怎么使用图表？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写；需要用代码控制时，用「方法」里列出的接口。

### 图表有哪些事件？

zh:chart-hover（指针或键盘移到某个数据点）；zh:chart-toggle（点击图例显示或隐藏某个系列）。

### 图表有哪些方法？

ZhaoUI.chart(host, config)：命令式创建，返回 { update(partialConfig), toggle(seriesIndex, visible) }。config：type、labels（横轴标签数组）、series（[{ name, data: [数字或 null] }]，null 表示断开）、height、title、legend、points（折线是否画点，默认 true）、format(value)（数值格式化，默认大数显示“万”“亿”）、inner（环形内圈比例，默认 0.62）、centerLabel（环形中心下方文字，默认“合计”）；环形图的数据：每个系列只取第一个数，一个系列就是一块扇区；中心显示合计；柱状与折线：柱状图从 0 开始；折线与面积图的纵轴自动取合适的刻度。

### 图表支持键盘和读屏吗？

图表是 role=img，aria-label 是自动生成的摘要；同时附带一张视觉隐藏的数据表，读屏用户可以逐行读到全部数值；图表可聚焦，左右方向键逐点查看，Home/End 到首尾，Esc 隐藏提示；当前点的数值写入 aria-live 区域朗读；颜色之外还有图例文字、提示里的系列名，不靠颜色单独传递信息；超过 8 个系列时颜色会循环，请改用图表库或拆图。

### 图表需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 代码块

纯样式组件：不需要 JS，写好标记即可。展示代码：zh-code 用在 <pre> 上（等宽字体，过宽时横向滚动），zh-code-inline 用在行内的 <code> 上。不含语法高亮。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<p>调用 <code class="zh-code-inline">ZhaoUI.message('已保存')</code> 显示提示。</p>
<pre class="zh-code"><code>ZhaoUI.message('已保存');
ZhaoUI.dialog({ title: '确认' });</code></pre>
```

### 样式类

`zh-code`、`zh-code-inline`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `zh-code` | <pre>（class） | 里面放 <code> | 代码块，带底色和边框，长行横向滚动 |
| `zh-code-inline` | <code>（class） |  | 行内代码 |

### 无障碍

- 代码块可横向滚动，因此可被键盘聚焦时请加 tabindex="0"，方便键盘用户滚动查看

## 常见问题

### 代码块是什么？

展示代码：zh-code 用在 <pre> 上（等宽字体，过宽时横向滚动），zh-code-inline 用在行内的 <code> 上。不含语法高亮。

### 怎么使用代码块？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 代码块支持键盘和读屏吗？

代码块可横向滚动，因此可被键盘聚焦时请加 tabindex="0"，方便键盘用户滚动查看。

### 代码块需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 折叠面板

手风琴或多开的折叠列表。展开状态用 .is-open 表示，库负责切换、无障碍属性和键盘。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div class="zh-collapse" data-mode="single">
  <div class="zh-collapse-item is-open">
    <h4 class="zh-collapse-h"><button class="zh-collapse-trigger" type="button"><span class="lead">第一项</span><i data-i="chevron-right" class="zh-collapse-chev"></i></button></h4>
    <div class="zh-collapse-panel"><div class="zh-collapse-inner"><div class="zh-collapse-content">内容一</div></div></div>
  </div>
  <div class="zh-collapse-item">
    <h4 class="zh-collapse-h"><button class="zh-collapse-trigger" type="button"><span class="lead">第二项</span><i data-i="chevron-right" class="zh-collapse-chev"></i></button></h4>
    <div class="zh-collapse-panel"><div class="zh-collapse-inner"><div class="zh-collapse-content">内容二</div></div></div>
  </div>
</div>
```

### 样式类

`zh-collapse`、`zh-collapse-item`、`zh-collapse-trigger`、`zh-collapse-panel`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-mode` | .zh-collapse | single \| multiple（默认） | single：同时只展开一项；multiple：各项独立 |
| `is-open` | .zh-collapse-item | class | 初始展开的项加上这个类 |
| `disabled` | .zh-collapse-trigger | 布尔 | 禁用某一项，不可点击也不参与方向键 |

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:collapse-toggle` | .zh-collapse | { item, open } | 某一项展开或收起时触发（冒泡） |

### 无障碍

- 触发按钮带 aria-expanded / aria-controls，面板带 role="region" 与 aria-labelledby
- 收起的面板加 inert，内部内容不会被键盘聚焦
- 方向键上下在标题间移动，Home / End 跳到首尾

## 常见问题

### 折叠面板是什么？

手风琴或多开的折叠列表。展开状态用 .is-open 表示，库负责切换、无障碍属性和键盘。

### 怎么使用折叠面板？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 折叠面板有哪些事件？

zh:collapse-toggle（某一项展开或收起时触发（冒泡））。

### 折叠面板支持键盘和读屏吗？

触发按钮带 aria-expanded / aria-controls，面板带 role="region" 与 aria-labelledby；收起的面板加 inert，内部内容不会被键盘聚焦；方向键上下在标题间移动，Home / End 跳到首尾。

### 折叠面板需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 命令面板

按快捷键或点按钮弹出的搜索框：输入几个字就能跳到某个页面或执行某个操作。支持模糊匹配（含关键词）、按分组显示、最近使用、键盘上下选择、回车执行。命令用一个数组描述。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。只用核心包时，还要加 `modular/command.min.js` 和 `modular/command.min.css`；全量版已包含。

### 用法

```html
<button class="zh-btn" id="cmd-open"><i data-i="search"></i>搜索 <span class="zh-kbd">Ctrl</span><span class="zh-kbd">K</span></button>
<script>
  var palette = ZhaoUI.commandPalette({
    hotkey: true,
    commands: [
      { id: 'home', group: '页面', label: '概览', icon: 'layout-dashboard', keywords: 'home dashboard 首页' },
      { id: 'set', group: '页面', label: '系统设置', icon: 'settings', keywords: 'settings 偏好' },
      { id: 'new', group: '操作', label: '新建文章', icon: 'file-text', hint: 'N', run: function () { ZhaoUI.message('新建文章'); } }
    ]
  });
  document.getElementById('cmd-open').addEventListener('click', function (e) { palette.open(e.currentTarget); });
</script>
```

### 样式类

`zh-cmd`、`zh-cmd-input`、`zh-cmd-list`、`zh-cmd-item`、`zh-cmd-gl`、`zh-cmd-hint`、`zh-cmd-empty`、`zh-cmd-foot`

### 方法

- `ZhaoUI.commandPalette(options)`：创建面板，返回 { open(from), close(), setCommands(list), el }。open 的参数是触发元素，关闭后焦点回到它
- `options`：hotkey 为 true 时 Ctrl/⌘+K 打开或关闭（默认不开，避免和你的页面快捷键冲突）；recent 是“最近”分组的条数，0 则不显示；onRun(command) 在命令执行后调用
- `命令 command`：label 参与匹配并高亮命中的字；keywords 是额外的搜索词（可写拼音、英文、同义词）；group 是分组标题；hint 显示快捷键提示；run(command) 是要执行的函数

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:command-run` | 面板元素（冒泡） | undefined | 执行了某个命令 |

### 无障碍

- 面板是模态 <dialog>，焦点被限制在里面，Esc 或点击外部关闭，关闭后焦点回到触发元素
- 输入框是 combobox，列表是 listbox，当前项用 aria-activedescendant 指示
- 结果数量通过 role=status 区域读出
- 搜索框按钮的 aria-label 里写明快捷键，如“搜索，快捷键 Ctrl K”

## 常见问题

### 命令面板是什么？

按快捷键或点按钮弹出的搜索框：输入几个字就能跳到某个页面或执行某个操作。支持模糊匹配（含关键词）、按分组显示、最近使用、键盘上下选择、回车执行。命令用一个数组描述。

### 怎么使用命令面板？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写；需要用代码控制时，用「方法」里列出的接口。

### 命令面板有哪些事件？

zh:command-run（执行了某个命令）。

### 命令面板有哪些方法？

ZhaoUI.commandPalette(options)：创建面板，返回 { open(from), close(), setCommands(list), el }。open 的参数是触发元素，关闭后焦点回到它；options：hotkey 为 true 时 Ctrl/⌘+K 打开或关闭（默认不开，避免和你的页面快捷键冲突）；recent 是“最近”分组的条数，0 则不显示；onRun(command) 在命令执行后调用；命令 command：label 参与匹配并高亮命中的字；keywords 是额外的搜索词（可写拼音、英文、同义词）；group 是分组标题；hint 显示快捷键提示；run(command) 是要执行的函数。

### 命令面板支持键盘和读屏吗？

面板是模态 <dialog>，焦点被限制在里面，Esc 或点击外部关闭，关闭后焦点回到触发元素；输入框是 combobox，列表是 listbox，当前项用 aria-activedescendant 指示；结果数量通过 role=status 区域读出。

### 命令面板需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 评论

纯样式组件：不需要 JS，写好标记即可。评论列表项：头像、昵称、时间、正文、操作，回复缩进显示。头像用 zh-avatar。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<article class="zh-comment">
  <span class="zh-avatar" data-name="李明" data-size="sm"></span>
  <div class="zh-comment-body">
    <div class="zh-comment-head"><span class="zh-comment-name">李明</span><time class="zh-comment-time" datetime="2026-10-04T15:20">2 小时前</time></div>
    <p class="zh-comment-text">这次的发布流程比上次清楚多了。</p>
    <div class="zh-comment-actions"><button class="zh-btn sm text">回复</button><button class="zh-btn sm text">赞</button></div>
  </div>
</article>
```

### 样式类

`zh-comment`、`zh-comment-body`、`zh-comment-head`、`zh-comment-name`、`zh-comment-time`、`zh-comment-text`、`zh-comment-actions`、`zh-comment-replies`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `zh-comment` | <article>（class） | 里面放头像和 zh-comment-body | 一条评论 |
| `zh-comment-head` | body 里的容器 | 昵称 zh-comment-name 与时间 zh-comment-time | 标题行 |
| `zh-comment-actions` | body 里的容器 | 里面放按钮或链接 | 回复、点赞等操作 |
| `zh-comment-replies` | body 里的容器 | 里面放嵌套的 zh-comment | 回复列表，左侧有竖线并缩进 |

### 无障碍

- 用 <article> 表示一条评论，时间用 <time datetime>
- 回复嵌套在 zh-comment-replies 里，层级不要超过两层

## 常见问题

### 评论是什么？

评论列表项：头像、昵称、时间、正文、操作，回复缩进显示。头像用 zh-avatar。

### 怎么使用评论？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 评论支持键盘和读屏吗？

用 <article> 表示一条评论，时间用 <time datetime>；回复嵌套在 zh-comment-replies 里，层级不要超过两层。

### 评论需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 日期选择

点击输入框弹出日历，也可以直接键入日期。支持最早 / 最晚日期、禁用周末、禁用指定日期，键盘完整可用。声明式写一个空 <div data-zh-date>，命令式用 ZhaoUI.datePicker。周从周一开始。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。只用核心包时，还要加 `modular/date.min.js` 和 `modular/date.min.css`；全量版已包含。

### 用法

```html
<div data-zh-date data-name="birthday" data-value="2026-10-15" data-min="2026-10-05" data-max="2026-10-25" data-msg="#birthdayMsg" aria-label="日期"></div>
<div id="birthdayMsg" aria-live="polite"></div>

<div data-zh-date data-disable-weekends data-disabled-dates="2026-10-14" aria-label="工作日"></div>

<div id="custom"></div>

<script>
document.querySelector('[data-zh-date]').addEventListener('zh:date-change', function (e) {
  console.log(e.detail.value);   // 2026-10-20
});

ZhaoUI.datePicker('#custom', {
  size: 'lg',
  disabledDate: function (d) { return d.getDate() === 1 ? '每月 1 号不开放' : ''; },
  onChange: function (d) { console.log(d); }
});
</script>
```

### 样式类

`zh-dp`、`zh-dp-panel`、`zh-dp-cal`、`zh-dp-day`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-zh-date` | <div> | 无 | 声明这是日期选择；控件会构建在这个 div 里 |
| `data-value` | 容器 | YYYY-MM-DD | 初始日期 |
| `data-min / data-max` | 容器 | YYYY-MM-DD | 最早 / 最晚可选日期，范围外的日子禁用 |
| `data-disable-weekends` | 容器 | 布尔属性 | 周六周日不可选 |
| `data-disabled-dates` | 容器 | 逗号分隔的日期，如 2026-10-01,2026-10-02 | 指定日期不可选 |
| `data-placeholder` | 容器 | 字符串，默认 YYYY-MM-DD | 占位文字 |
| `data-name` | 容器 | 字段名 | 生成隐藏 <input name=…> 参与表单提交 |
| `data-size` | 容器 | sm \| md（默认）\| lg | 尺寸 |
| `aria-label / data-labelledby / data-label` | 容器 | 字符串 / 标签元素 id / 弹层标题 | 输入框的无障碍名称；data-label 是弹出面板的标题 |
| `data-msg` | 容器 | 一个元素的选择器，如 #status | 可选的状态提示元素：选择、报错时会把文字写进去（读屏可以朗读），元素上可预先写好默认文字 |
| `<label for="容器 id">` | 容器所在页面的 <label> | for 指向容器的 id | label 会成为输入框的无障碍名称，点击 label 会聚焦输入框；容器是空 <div>，label 的 for 指向它的 id 即可 |

### 方法

- `ZhaoUI.datePicker(host, { value, min, max, disabledDate, size, placeholder, label, labelledby, msg, onChange })`：命令式创建。value / min / max 可以是 'YYYY-MM-DD' 字符串或 Date；disabledDate(date) 返回空串表示可选，返回文字表示不可选并作为原因；onChange(date)
- `el.zhDate.get() / .set(value) / .open() / .close()`：get 返回 Date 或 null；set 接受字符串或 Date，不触发事件

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:date-change` | 容器 | { value: 'YYYY-MM-DD' \| '', date: Date \| null } | 用户选择、键入确认或清除后触发（冒泡）；用 set() 设置不触发 |

### 无障碍

- 输入框是 role="combobox"，弹层是 role="dialog"；日格是按钮，aria-label 为「2026年10月15日 星期四」，今天带 aria-current="date"，不可选的带 aria-disabled
- 日格上：← → 前后一天，↑ ↓ 前后一周，Home / End 到本周首尾，PageUp / PageDown 前后一个月，加 Shift 则一年；Enter 或空格选中；Esc 关闭
- 输入框里可直接键入，支持 2026-10-15、2026/10/15、2026年10月15日；不合法或不可选时标记 aria-invalid，并把原因写入 data-msg 元素
- 点击月份标题可切到月份 / 年份选择
- 按「今天」时如果今天不可选，会弹出说明

## 常见问题

### 日期选择是什么？

点击输入框弹出日历，也可以直接键入日期。支持最早 / 最晚日期、禁用周末、禁用指定日期，键盘完整可用。声明式写一个空 <div data-zh-date>，命令式用 ZhaoUI.datePicker。周从周一开始。

### 怎么使用日期选择？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写；需要用代码控制时，用「方法」里列出的接口。

### 日期选择有哪些事件？

zh:date-change（用户选择、键入确认或清除后触发（冒泡）；用 set() 设置不触发）。

### 日期选择有哪些方法？

ZhaoUI.datePicker(host, { value, min, max, disabledDate, size, placeholder, label, labelledby, msg, onChange })：命令式创建。value / min / max 可以是 'YYYY-MM-DD' 字符串或 Date；disabledDate(date) 返回空串表示可选，返回文字表示不可选并作为原因；onChange(date)；el.zhDate.get() / .set(value) / .open() / .close()：get 返回 Date 或 null；set 接受字符串或 Date，不触发事件。

### 日期选择支持键盘和读屏吗？

输入框是 role="combobox"，弹层是 role="dialog"；日格是按钮，aria-label 为「2026年10月15日 星期四」，今天带 aria-current="date"，不可选的带 aria-disabled；日格上：← → 前后一天，↑ ↓ 前后一周，Home / End 到本周首尾，PageUp / PageDown 前后一个月，加 Shift 则一年；Enter 或空格选中；Esc 关闭；输入框里可直接键入，支持 2026-10-15、2026/10/15、2026年10月15日；不合法或不可选时标记 aria-invalid，并把原因写入 data-msg 元素。

### 日期选择需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 日期范围选择

两个输入框加一个双月日历，选开始和结束两次点击；带「近 7 天 / 近 30 天 / 本月 / 上月」快捷项。窄屏变为单月。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。只用核心包时，还要加 `modular/date.min.js` 和 `modular/date.min.css`；全量版已包含。

### 用法

```html
<div data-zh-daterange data-name-start="from" data-name-end="to" data-start="2026-10-01" data-end="2026-10-07" data-max="2026-12-31" aria-label="统计周期"></div>

<script>
document.querySelector('[data-zh-daterange]').addEventListener('zh:daterange-change', function (e) {
  console.log(e.detail.start, '→', e.detail.end);
});
</script>
```

### 样式类

`zh-dp`、`zh-dp-panel`、`zh-dp-presets`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-zh-daterange` | <div> | 无 | 声明这是日期范围选择 |
| `data-start / data-end` | 容器 | YYYY-MM-DD | 初始的开始与结束日期 |
| `data-min / data-max` | 容器 | YYYY-MM-DD | 可选范围 |
| `data-presets` | 容器 | false 表示关闭 | 默认显示快捷项 |
| `data-name-start / data-name-end` | 容器 | 字段名 | 分别生成开始、结束两个隐藏 input |
| `data-size` | 容器 | sm \| md（默认）\| lg | 尺寸 |
| `aria-label / data-labelledby / data-label` | 容器 | 字符串 / 标签元素 id / 弹层标题 | 输入框的无障碍名称；data-label 是弹出面板的标题 |
| `data-msg` | 容器 | 一个元素的选择器，如 #status | 可选的状态提示元素：选择、报错时会把文字写进去（读屏可以朗读），元素上可预先写好默认文字 |
| `<label for="容器 id">` | 容器所在页面的 <label> | for 指向容器的 id | label 会成为输入框的无障碍名称，点击 label 会聚焦输入框；容器是空 <div>，label 的 for 指向它的 id 即可 |

### 方法

- `ZhaoUI.dateRangePicker(host, { start, end, min, max, presets, size, label, msg, onChange })`：命令式创建；onChange(start, end)
- `el.zhDateRange.get() / .set(start, end) / .open() / .close()`：get 返回 [Date|null, Date|null]；set 接受字符串或 Date

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:daterange-change` | 容器 | { start, end, dates: [Date\|null, Date\|null] } | 范围确定、键入确认或清除后触发（冒泡）；start / end 是 YYYY-MM-DD 字符串或空串 |

### 无障碍

- 两个输入框在一个 role="group" 里，分别叫「开始日期」「结束日期」
- 第一次点击选开始，第二次选结束；先点了较晚的日期再点较早的，会自动对调
- 悬停时预览范围；已选中的天数会朗读（如「共 7 天」）
- 键入时结束日期早于开始日期会被拒绝并提示；键盘操作与单日期相同
- 窄屏（≤ 767px）时日历只显示一个月
- 需要的宽度：范围选择器至少 17.5rem（约 280px，样式里是 min-width），放进更窄的容器会溢出容器而不是截断日期。筛选栏里请给它留足位置，不要给它或它的父元素设更窄的宽度

## 常见问题

### 日期范围选择是什么？

两个输入框加一个双月日历，选开始和结束两次点击；带「近 7 天 / 近 30 天 / 本月 / 上月」快捷项。窄屏变为单月。

### 怎么使用日期范围选择？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写；需要用代码控制时，用「方法」里列出的接口。

### 日期范围选择有哪些事件？

zh:daterange-change（范围确定、键入确认或清除后触发（冒泡）；start / end 是 YYYY-MM-DD 字符串或空串）。

### 日期范围选择有哪些方法？

ZhaoUI.dateRangePicker(host, { start, end, min, max, presets, size, label, msg, onChange })：命令式创建；onChange(start, end)；el.zhDateRange.get() / .set(start, end) / .open() / .close()：get 返回 [Date|null, Date|null]；set 接受字符串或 Date。

### 日期范围选择支持键盘和读屏吗？

两个输入框在一个 role="group" 里，分别叫「开始日期」「结束日期」；第一次点击选开始，第二次选结束；先点了较晚的日期再点较早的，会自动对调；悬停时预览范围；已选中的天数会朗读（如「共 7 天」）。

### 日期范围选择需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 日期时间选择

左边日历、右边时间列的组合面板，一次选定日期和时间，点「确定」提交。窄屏上下排列。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。只用核心包时，还要加 `modular/date.min.js` 和 `modular/date.min.css`；全量版已包含。

### 用法

```html
<div data-zh-datetime data-name="when" data-value="2026-10-15 09:30" data-min="2026-10-05" data-msg="#whenMsg" aria-label="预约时间"></div>
<div id="whenMsg" aria-live="polite"></div>

<script>
document.querySelector('[data-zh-datetime]').addEventListener('zh:datetime-change', function (e) {
  console.log(e.detail.value);
});
</script>
```

### 样式类

`zh-dp`、`zh-dp-panel`、`zh-dp-side`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-zh-datetime` | <div> | 无 | 声明这是日期时间选择 |
| `data-value` | 容器 | YYYY-MM-DD HH:mm | 初始值 |
| `data-min / data-max` | 容器 | YYYY-MM-DD | 可选日期范围 |
| `data-disable-weekends / data-disabled-dates` | 容器 | 布尔属性 / 逗号分隔日期 | 禁用周末 / 指定日期 |
| `data-name` | 容器 | 字段名 | 生成隐藏 <input name=…> 参与表单提交 |
| `data-size` | 容器 | sm \| md（默认）\| lg | 尺寸 |
| `aria-label / data-labelledby / data-label` | 容器 | 字符串 / 标签元素 id / 弹层标题 | 输入框的无障碍名称；data-label 是弹出面板的标题 |
| `data-msg` | 容器 | 一个元素的选择器，如 #status | 可选的状态提示元素：选择、报错时会把文字写进去（读屏可以朗读），元素上可预先写好默认文字 |
| `<label for="容器 id">` | 容器所在页面的 <label> | for 指向容器的 id | label 会成为输入框的无障碍名称，点击 label 会聚焦输入框；容器是空 <div>，label 的 for 指向它的 id 即可 |

### 方法

- `ZhaoUI.dateTimePicker(host, { value: { date, time }, min, max, disabledDate, size, msg, onChange })`：命令式创建；也接受 'YYYY-MM-DD HH:mm' 字符串作为 value；onChange({ date, time } | null)
- `el.zhDateTime.get() / .set(value) / .open() / .close()`：get 返回 { date, time } 或 null；set 接受对象或字符串，不触发事件

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:datetime-change` | 容器 | { value: 'YYYY-MM-DD HH:mm' \| '', date, time } | 日期或时间变化、键入确认、清除后触发（冒泡）；面板里选日期或调时间时输入框会实时更新，也会触发 |

### 无障碍

- 日历与时间列的键盘操作同单独的日期、时间选择
- 底部显示当前选中的「2026-10-15 09:30」，还没选日期时提示「请先选择日期」
- 键入格式为 YYYY-MM-DD HH:mm，不合法或不可选时标记 aria-invalid 并写入 data-msg 元素

## 常见问题

### 日期时间选择是什么？

左边日历、右边时间列的组合面板，一次选定日期和时间，点「确定」提交。窄屏上下排列。

### 怎么使用日期时间选择？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写；需要用代码控制时，用「方法」里列出的接口。

### 日期时间选择有哪些事件？

zh:datetime-change（日期或时间变化、键入确认、清除后触发（冒泡）；面板里选日期或调时间时输入框会实时更新，也会触发）。

### 日期时间选择有哪些方法？

ZhaoUI.dateTimePicker(host, { value: { date, time }, min, max, disabledDate, size, msg, onChange })：命令式创建；也接受 'YYYY-MM-DD HH:mm' 字符串作为 value；onChange({ date, time } | null)；el.zhDateTime.get() / .set(value) / .open() / .close()：get 返回 { date, time } 或 null；set 接受对象或字符串，不触发事件。

### 日期时间选择支持键盘和读屏吗？

日历与时间列的键盘操作同单独的日期、时间选择；底部显示当前选中的「2026-10-15 09:30」，还没选日期时提示「请先选择日期」；键入格式为 YYYY-MM-DD HH:mm，不合法或不可选时标记 aria-invalid 并写入 data-msg 元素。

### 日期时间选择需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 描述列表

纯样式组件：不需要 JS。用 <dl> 展示一组「名称：值」，如订单详情、项目信息。有两种外观：plain（无框）、bordered（带框表格式）；列数 1 到 3 可选，窄屏自动降列。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div class="zh-stack">
  <div class="zh-descr-wrap">
    <dl class="zh-descr" data-cols="3" data-variant="bordered" aria-label="订单信息">
      <div class="zh-descr-item"><dt>订单号</dt><dd>20260929-0086</dd></div>
      <div class="zh-descr-item"><dt>状态</dt><dd><span class="zh-tag success">已发货</span></dd></div>
      <div class="zh-descr-item"><dt>金额</dt><dd>¥ 1,286.00</dd></div>
      <div class="zh-descr-item"><dt>收货人</dt><dd>张三</dd></div>
      <div class="zh-descr-item"><dt>电话</dt><dd>138 **** 0086</dd></div>
      <div class="zh-descr-item"><dt>物流</dt><dd><a class="zh-descr-link" href="#">SF1234567890</a></dd></div>
      <div class="zh-descr-item" data-span="3"><dt>地址</dt><dd>上海市浦东新区世纪大道 100 号</dd></div>
    </dl>
  </div>
  <dl class="zh-descr" data-cols="2" data-variant="plain" aria-label="项目信息">
    <div class="zh-descr-item"><dt>负责人</dt><dd>李四</dd></div>
    <div class="zh-descr-item"><dt>创建时间</dt><dd>2026-09-01 09:30</dd></div>
  </dl>
</div>
```

### 样式类

`zh-descr`、`zh-descr-item`、`zh-descr-wrap`、`zh-descr-link`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `zh-descr` | <dl>（class） | 里面每组放一个 <div class="zh-descr-item"><dt>名称</dt><dd>值</dd></div> | 网格容器，默认 3 列 |
| `data-cols` | .zh-descr | 1 \| 2 \| 3（默认 3） | 列数；平板宽度 3 列降为 2 列，手机宽度全部降为 1 列 |
| `data-variant` | .zh-descr | plain \| bordered | plain 无框，名称在上、值在下；bordered 是带线框的表格式，名称在左侧的灰底格里 |
| `data-span` | .zh-descr-item | 2 \| 3 | 该项横跨的列数，适合地址、备注等长内容；手机宽度忽略；各项加起来填不满一行时，末尾会留空格 |
| `zh-descr-wrap` | 外层 <div>（class） | 仅 bordered 时使用 | 给 bordered 的列表加圆角外框并裁掉最外层多余的线 |
| `zh-descr-link` | <dd> 里的 <a> |  | 值里的链接样式 |

### 无障碍

- 用语义化的 <dl>/<dt>/<dd>，读屏会读成「名称，值」
- 给 <dl> 加 aria-label 说明这组信息是什么
- <dt>/<dd> 要成对，放在 .zh-descr-item 里

## 常见问题

### 描述列表是什么？

纯样式组件：不需要 JS。用 <dl> 展示一组「名称：值」，如订单详情、项目信息。有两种外观：plain（无框）、bordered（带框表格式）；列数 1 到 3 可选，窄屏自动降列。

### 怎么使用描述列表？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 描述列表支持键盘和读屏吗？

用语义化的 <dl>/<dt>/<dd>，读屏会读成「名称，值」；给 <dl> 加 aria-label 说明这组信息是什么；<dt>/<dd> 要成对，放在 .zh-descr-item 里。

### 描述列表需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 模态框与抽屉

模态框基于原生 <dialog>，抽屉是右侧滑出的面板。用 data-zh-open / data-zh-close 声明即可，也可用 ZhaoUI.open / close / dialog 调用。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<button class="zh-btn" data-zh-open="#dlg">打开</button>
<dialog class="zh-modal" id="dlg" aria-labelledby="dlgT" data-zh-backdrop-close>
  <header id="dlgT">确认删除</header>
  <div class="body">删除后无法恢复。</div>
  <footer>
    <button class="zh-btn" data-zh-close>取消</button>
    <button class="zh-btn primary" data-zh-close>确定</button>
  </footer>
</dialog>

<button class="zh-btn" data-zh-open="#drw">打开抽屉</button>
<aside class="zh-drawer" id="drw" aria-label="详情">
  <button class="zh-btn text" data-zh-close>关闭</button>
  <p>抽屉内容</p>
</aside>

<script>
ZhaoUI.dialog({ title: '删除文章？', content: '删除后无法恢复', danger: true })
  .then(function (ok) { if (ok) { /* 执行删除 */ } });
</script>
```

### 样式类

`zh-modal`、`zh-drawer`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-zh-open` | 按钮或链接 | 目标的 CSS 选择器，如 #dlg | 点击后打开目标对话框或抽屉，并记住触发元素，关闭后焦点回到它 |
| `data-zh-close` | 对话框或抽屉内的按钮 | 留空，或目标选择器 | 点击后关闭所在的对话框或抽屉；写了选择器则关闭那个目标 |
| `data-zh-backdrop-close` | dialog.zh-modal | 无 | 点击遮罩（对话框以外的区域）关闭 |

### 方法

- `ZhaoUI.open(target, opener?)`：打开对话框或抽屉。target 是元素或选择器；opener 是关闭后要聚焦回去的元素（可选）
- `ZhaoUI.close(target)`：关闭对话框或抽屉
- `ZhaoUI.dialog({ title, content, ok, cancel, danger, backdropClose })`：弹出确认框，返回 Promise：点确定为 true，取消、Esc 为 false。选项：title 标题；content 正文（纯文本，要放标签请传 DOM 节点）；ok 确定按钮文字（默认「确定」）；cancel 取消按钮文字（默认「取消」，传 false 则不显示取消）；danger 为 true 时确定按钮用危险样式（红色），否则是主色；backdropClose 为 true 时点遮罩也算取消。例：ZhaoUI.dialog({ title: '删除文章？', content: '删除后无法恢复', ok: '删除', cancel: '再想想', danger: true }).then(function (yes) { if (yes) remove(); })

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:open` | 抽屉 | 无 | 抽屉打开后触发（冒泡） |
| `zh:close` | 抽屉 | 无 | 抽屉关闭后触发（冒泡）。模态框用原生 close 事件 |

### 无障碍

- 模态框使用原生 <dialog>.showModal()：浏览器负责焦点限制、Esc 关闭与背景不可交互
- 抽屉打开时限制 Tab 焦点在抽屉内，Esc 关闭；关闭后带 inert 与 aria-hidden，不会被键盘聚焦到
- 关闭后焦点回到触发元素（包括 Safari，它点击按钮时不会给按钮焦点，所以库自己记住了触发元素）
- 对话框请用 aria-labelledby 指向标题；ZhaoUI.dialog 已自动处理

## 常见问题

### 模态框与抽屉是什么？

模态框基于原生 <dialog>，抽屉是右侧滑出的面板。用 data-zh-open / data-zh-close 声明即可，也可用 ZhaoUI.open / close / dialog 调用。

### 怎么使用模态框与抽屉？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写；需要用代码控制时，用「方法」里列出的接口。

### 模态框与抽屉有哪些事件？

zh:open（抽屉打开后触发（冒泡））；zh:close（抽屉关闭后触发（冒泡）。模态框用原生 close 事件）。

### 模态框与抽屉有哪些方法？

ZhaoUI.open(target, opener?)：打开对话框或抽屉。target 是元素或选择器；opener 是关闭后要聚焦回去的元素（可选）；ZhaoUI.close(target)：关闭对话框或抽屉；ZhaoUI.dialog({ title, content, ok, cancel, danger, backdropClose })：弹出确认框，返回 Promise：点确定为 true，取消、Esc 为 false。选项：title 标题；content 正文（纯文本，要放标签请传 DOM 节点）；ok 确定按钮文字（默认「确定」）；cancel 取消按钮文字（默认「取消」，传 false 则不显示取消）；danger 为 true 时确定按钮用危险样式（红色），否则是主色；backdropClose 为 true 时点遮罩也算取消。例：ZhaoUI.dialog({ title: '删除文章？', content: '删除后无法恢复', ok: '删除', cancel: '再想想', danger: true }).then(function (yes) { if (yes) remove(); })。

### 模态框与抽屉支持键盘和读屏吗？

模态框使用原生 <dialog>.showModal()：浏览器负责焦点限制、Esc 关闭与背景不可交互；抽屉打开时限制 Tab 焦点在抽屉内，Esc 关闭；关闭后带 inert 与 aria-hidden，不会被键盘聚焦到；关闭后焦点回到触发元素（包括 Safari，它点击按钮时不会给按钮焦点，所以库自己记住了触发元素）。

### 模态框与抽屉需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 下拉菜单

点击按钮弹出菜单。菜单内容写在页面里的一个隐藏列表中，选中后触发 zh:select。一个菜单可以被多个按钮共用（比如表格每一行一个「操作」按钮，都指向同一个 #menu）。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<button class="zh-btn" data-zh-dropdown="#menu">操作 <i data-i="chevron-down"></i></button>
<ul class="zh-menu" id="menu" hidden>
  <li><a href="#" data-value="edit">编辑</a></li>
  <li><a href="#" data-value="copy">复制</a></li>
  <li><a href="#" data-value="del">删除</a></li>
</ul>

<script>
document.querySelector('[data-zh-dropdown]').addEventListener('zh:select', function (e) {
  console.log(e.detail.value);
});
</script>

<!-- 表格行菜单：每行一个按钮，共用同一个菜单 -->
<table>
  <tr data-id="1"><td>文章一</td><td><button class="zh-btn text" data-zh-dropdown="#rowMenu">操作</button></td></tr>
  <tr data-id="2"><td>文章二</td><td><button class="zh-btn text" data-zh-dropdown="#rowMenu">操作</button></td></tr>
</table>
<ul class="zh-menu" id="rowMenu" hidden>
  <li><a href="#" data-value="edit">编辑</a></li><li><a href="#" data-value="del">删除</a></li>
</ul>
<script>
document.addEventListener('zh:select', function (e) {
  var btn = e.target.closest('[data-zh-dropdown="#rowMenu"]'), id = btn.closest('tr').dataset.id;
  console.log(e.detail.value, '第', id, '行');
});
</script>
```

### 样式类

`zh-menu`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-zh-dropdown` | 按钮 | 菜单元素的选择器，如 #menu | 声明这个按钮控制哪个菜单 |
| `data-zh-placement` | 按钮 | bottom-start（默认）、bottom-end、top-start、top-end、left、right 等 | 菜单出现的位置，空间不足时自动翻转 |
| `hidden` | 菜单 <ul class="zh-menu"> | 布尔 | 菜单源元素保持隐藏；库会克隆它来显示 |
| `data-value` | 菜单项 <a> 或 <button> | 字符串 | 选中时作为 detail.value；不写则取文字 |
| `aria-disabled` | 菜单项 | true | 禁用某一项 |

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:select` | 触发按钮 | { value, item } | 选中某项后在被点击的那个按钮上触发（冒泡），随后菜单关闭。多个按钮共用一个菜单时，用 e.target.closest('[data-zh-dropdown]') 就能知道是哪一行的按钮 |

### 无障碍

- 按钮带 aria-haspopup / aria-expanded；菜单 role="menu"，菜单项 role="menuitem"
- 在按钮上按 ↓ 打开；打开后焦点落在第一项，↑ ↓ / Home / End 移动，输入字母可跳转，Enter 选中
- Esc 关闭并把焦点还给按钮；点击外部也会关闭

## 常见问题

### 下拉菜单是什么？

点击按钮弹出菜单。菜单内容写在页面里的一个隐藏列表中，选中后触发 zh:select。一个菜单可以被多个按钮共用（比如表格每一行一个「操作」按钮，都指向同一个 #menu）。

### 怎么使用下拉菜单？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 下拉菜单有哪些事件？

zh:select（选中某项后在被点击的那个按钮上触发（冒泡），随后菜单关闭。多个按钮共用一个菜单时，用 e.target.closest('[data-zh-dropdown]') 就能知道是哪一行的按钮）。

### 下拉菜单支持键盘和读屏吗？

按钮带 aria-haspopup / aria-expanded；菜单 role="menu"，菜单项 role="menuitem"；在按钮上按 ↓ 打开；打开后焦点落在第一项，↑ ↓ / Home / End 移动，输入字母可跳转，Enter 选中；Esc 关闭并把焦点还给按钮；点击外部也会关闭。

### 下拉菜单需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 警告条、空状态、骨架屏

纯样式组件：不需要 JS，写好标记即可。页面内的提示条（信息、成功、警告、危险）、没有数据时的空状态、加载中的骨架屏。会自动消失的轻提示用 ZhaoUI.message。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div class="zh-stack">
  <div class="zh-alert info" role="status"><i data-i="info"></i><span>系统将在今晚 23:00 进行维护。</span></div>
  <div class="zh-alert success" role="status"><i data-i="circle-check"></i><span>保存成功。</span></div>
  <div class="zh-alert warning" role="alert"><i data-i="triangle-alert"></i><span>存在 3 台设备离线，请及时处理。</span></div>
  <div class="zh-alert danger" role="alert"><i data-i="circle-x"></i><span>发布失败，请重试。</span></div>

  <div class="zh-empty">
    <i data-i="search-x" data-s="48"></i>
    <div>没有匹配的数据</div>
    <button class="zh-btn sm">清除筛选</button>
  </div>

  <div class="zh-card" role="status" aria-busy="true" aria-label="加载中">
    <div class="zh-skeleton" style="width:60%"></div>
    <div class="zh-skeleton" style="margin-top:12px"></div>
    <div class="zh-skeleton" style="margin-top:12px;width:80%"></div>
  </div>
</div>
```

### 样式类

`zh-alert`、`zh-empty`、`zh-skeleton`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `zh-alert + info \| success \| warning \| danger` | <div>（class） | 里面放一个图标 <i data-i="info"> 和一个 <span> 文字 | 页面内提示条。图标颜色跟随类型。信息用 role="status"，警告和危险用 role="alert" |
| `zh-empty` | <div>（class） | 图标、说明文字、可选的操作按钮，居中 | 空状态：没有数据、搜索无结果时用 |
| `zh-skeleton` | <div>（class） | 用 style="width:60%" 控制长度，高度默认 12px | 加载中的灰色条，带流光动画；开启「减少动态效果」时流光停止 |

### 无障碍

- zh-alert 要有 role：只是信息用 role="status"（礼貌播报），警告和危险用 role="alert"（立即播报）
- 不要只靠颜色区分类型：图标和文字要说明含义
- 骨架屏所在的容器加 aria-busy="true" 和 aria-label="加载中"，加载完成后移除
- 空状态里的说明文字要说清为什么空，以及下一步能做什么

## 常见问题

### 警告条、空状态、骨架屏是什么？

页面内的提示条（信息、成功、警告、危险）、没有数据时的空状态、加载中的骨架屏。会自动消失的轻提示用 ZhaoUI.message。

### 怎么使用警告条、空状态、骨架屏？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 警告条、空状态、骨架屏支持键盘和读屏吗？

zh-alert 要有 role：只是信息用 role="status"（礼貌播报），警告和危险用 role="alert"（立即播报）；不要只靠颜色区分类型：图标和文字要说明含义；骨架屏所在的容器加 aria-busy="true" 和 aria-label="加载中"，加载完成后移除。

### 警告条、空状态、骨架屏需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 页脚

纯样式组件：不需要 JS，写好标记即可。页面底部：版权文字在一侧，链接在另一侧，窄屏自动换行。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<footer class="zh-footer">
  <span>© 2026 ZhaoUI. 保留所有权利。</span>
  <ul class="zh-footer-links"><li><a href="#">隐私政策</a></li><li><a href="#">服务条款</a></li><li><a href="#">联系我们</a></li></ul>
</footer>
```

### 样式类

`zh-footer`、`zh-footer-links`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `zh-footer` | <footer>（class） |  | 顶部分隔线，两端对齐，可换行 |
| `zh-footer-links` | <ul>（class） | 里面放 <li><a> | 链接列表，横向排列 |

### 无障碍

- 链接列表外层用 <nav aria-label="页脚"> 更利于读屏导航

## 常见问题

### 页脚是什么？

页面底部：版权文字在一侧，链接在另一侧，窄屏自动换行。

### 怎么使用页脚？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 页脚支持键盘和读屏吗？

链接列表外层用 <nav aria-label="页脚"> 更利于读屏导航。

### 页脚需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 表单控件与字段

纯样式组件：不需要 JS，写好标记即可。字段（标签、控件、提示）、文本输入、下拉、多行文本、复选框、单选、开关。带搜索、清除、校验等行为的输入框见「输入框」「下拉选择」等组件。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div class="zh-stack">
  <div class="zh-field">
    <label for="f-name" class="zh-req">名称</label>
    <input id="f-name" class="zh-input" placeholder="请输入名称" required aria-describedby="f-name-h">
    <span class="zh-hint" id="f-name-h">2 到 20 个字</span>
  </div>

  <div class="zh-field">
    <label for="f-mail">邮箱</label>
    <input id="f-mail" class="zh-input" value="abc" aria-invalid="true" aria-describedby="f-mail-h">
    <span class="zh-hint err" id="f-mail-h">邮箱格式不正确</span>
  </div>

  <div class="zh-field">
    <label for="f-city">城市</label>
    <div class="zh-select"><select id="f-city"><option>北京</option><option>上海</option></select></div>
  </div>

  <div class="zh-field">
    <label for="f-note">备注</label>
    <textarea id="f-note" class="zh-textarea"></textarea>
  </div>

  <label class="zh-check"><input type="checkbox" checked> 记住我</label>
  <label class="zh-check"><input type="radio" name="r" checked> 选项一</label>
  <label class="zh-check"><input type="radio" name="r"> 选项二</label>
  <label class="zh-check"><input type="checkbox" class="zh-switch" role="switch" checked> 启用通知</label>
</div>
```

### 样式类

`zh-field`、`zh-hint`、`zh-req`、`zh-input`、`zh-textarea`、`zh-select`、`zh-check`、`zh-switch`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `zh-field` | <div>（class） | 里面放 <label for> 与控件，再放 zh-hint | 纵向排列的字段：标签在上、控件、提示。多个字段用布局里的 zh-stack 或 zh-grid 排 |
| `zh-req` | <label>（class） | 必填字段的标签 | 在标签后加红色星号；仍然要给控件加 required 或 aria-required |
| `zh-hint / zh-hint err` | 字段内（class） | 提示文字；错误用 class="zh-hint err" | 次要说明与错误提示。错误时同时给控件加 aria-invalid="true" |
| `zh-input` | <input>（class） | 可加 sm \| lg 改高度 | 文本输入。aria-invalid="true" 时边框变危险色；聚焦时有主色描边 |
| `zh-textarea` | <textarea>（class） |  | 多行文本，最小高度两行。自动增高与计数用「多行文本」组件 |
| `zh-select` | 包着 <select> 的 <span> 或 <div>（class） | <div class="zh-select"><select>…</select></div> | 原生下拉的样式；需要搜索、多选时用「下拉选择」组件 |
| `zh-check` | <label>（class） | 里面放 <input type="checkbox"> 或 <input type="radio"> 再放文字 | 复选框与单选：主色，大小随字号，整行可点 |
| `zh-switch` | <input type="checkbox">（class） | 同时写 role="switch" | 开关；放在 zh-check 里，文字是它的标签 |

### 无障碍

- 每个控件都要有可访问的名称：<label for> 指向控件的 id，或 aria-label
- 开关要写 role="switch"，它的开关状态就是 checked
- 错误信息用 zh-hint err，并让控件 aria-invalid="true"；需要读屏朗读时用 aria-describedby 指向提示
- 必填用 zh-req 只是视觉标记，仍要加 required / aria-required
- 复选框与单选请把文字放在同一个 <label> 里，扩大点击区域

## 常见问题

### 表单控件与字段是什么？

字段（标签、控件、提示）、文本输入、下拉、多行文本、复选框、单选、开关。带搜索、清除、校验等行为的输入框见「输入框」「下拉选择」等组件。

### 怎么使用表单控件与字段？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 表单控件与字段支持键盘和读屏吗？

每个控件都要有可访问的名称：<label for> 指向控件的 id，或 aria-label；开关要写 role="switch"，它的开关状态就是 checked；错误信息用 zh-hint err，并让控件 aria-invalid="true"；需要读屏朗读时用 aria-describedby 指向提示。

### 表单控件与字段需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 图片

纯样式组件：不需要 JS，写好标记即可。图片的响应式与外观：zh-img 让图片不超出容器、保持比例；--rounded 圆角，--circle 正圆（头像），--thumb 带边框的缩略图。配图说明用 <figure> 加 zh-figure。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<figure class="zh-figure" style="max-width:16rem">
  <img class="zh-img zh-img--rounded" alt="示例配图" width="320" height="180" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect width='16' height='9' fill='%23c7d2fe'/%3E%3C/svg%3E">
  <figcaption>图 1 示例配图</figcaption>
</figure>
```

### 样式类

`zh-img`、`zh-img--rounded`、`zh-img--circle`、`zh-img--thumb`、`zh-figure`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `zh-img` | <img>（class） |  | 宽度不超过容器，高度按比例 |
| `zh-img--rounded / --circle / --thumb` | .zh-img |  | 圆角 / 正圆裁切 / 带边框内边距的缩略图 |
| `zh-figure` | <figure>（class） | 里面放图片和 <figcaption> | 说明文字居中显示在图片下方 |

### 无障碍

- 所有 <img> 都要写 alt；装饰图用 alt=""
- 写上 width 和 height，避免加载时页面跳动

## 常见问题

### 图片是什么？

图片的响应式与外观：zh-img 让图片不超出容器、保持比例；--rounded 圆角，--circle 正圆（头像），--thumb 带边框的缩略图。配图说明用 <figure> 加 zh-figure。

### 怎么使用图片？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 图片支持键盘和读屏吗？

所有 <img> 都要写 alt；装饰图用 alt=""；写上 width 和 height，避免加载时页面跳动。

### 图片需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 行内编辑

点击文字原地变成输入框，Enter 或失焦保存，Esc 取消。空内容不会被保存。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div class="zh-edit" id="ed" data-label="名称">
  <button type="button" class="zh-edit-view" aria-label="编辑名称：中控系统"><span class="zh-edit-text">中控系统</span><i data-i="pencil" data-s="16"></i></button>
</div>

<script>
document.getElementById('ed').addEventListener('zh:edit-save', function (e) {
  console.log(e.detail.previous, '→', e.detail.value);
});
</script>
```

### 样式类

`zh-edit`、`zh-edit-view`、`zh-edit-text`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-label` | .zh-edit | 字符串，默认「名称」 | 给屏幕阅读器用的字段名，用于输入框与按钮的 aria-label |

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:edit-save` | .zh-edit | { value, previous } | 内容有变化并保存时触发（冒泡）；内容没变化不触发 |
| `zh:edit-cancel` | .zh-edit | 无 | 按 Esc 取消，或在空内容上失焦还原旧值时触发 |

### 无障碍

- 点击按钮、或聚焦后按 F2 进入编辑
- Enter 保存并把焦点还给按钮；Esc 取消；在空内容上按 Enter 会停留在输入框并标记 is-error
- 在空内容上直接失焦会还原旧值
- 按钮的 aria-label 会随保存后的新值更新（「编辑名称：新值」）

## 常见问题

### 行内编辑是什么？

点击文字原地变成输入框，Enter 或失焦保存，Esc 取消。空内容不会被保存。

### 怎么使用行内编辑？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 行内编辑有哪些事件？

zh:edit-save（内容有变化并保存时触发（冒泡）；内容没变化不触发）；zh:edit-cancel（按 Esc 取消，或在空内容上失焦还原旧值时触发）。

### 行内编辑支持键盘和读屏吗？

点击按钮、或聚焦后按 F2 进入编辑；Enter 保存并把焦点还给按钮；Esc 取消；在空内容上按 Enter 会停留在输入框并标记 is-error；在空内容上直接失焦会还原旧值。

### 行内编辑需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 输入框

带前置图标、清除按钮、密码显示开关、搜索快捷键的文本输入。结构是 .zh-inp 包着 .zh-inp-box 和原生 input，按钮按需添加。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div class="zh-inp"><span class="zh-inp-box"><i data-i="search" data-s="18" class="zh-inp-pre"></i><input class="zh-inp-el" type="text" placeholder="邮箱" aria-label="邮箱"><button type="button" class="zh-inp-btn zh-inp-clear" aria-label="清除" hidden><i data-i="x" data-s="16"></i></button></span></div>

<div class="zh-inp"><span class="zh-inp-box"><input class="zh-inp-el" type="password" value="hunter2" aria-label="密码" autocomplete="new-password"><button type="button" class="zh-inp-btn zh-inp-eye" aria-label="显示密码" aria-pressed="false"><i data-i="eye" data-s="18"></i></button></span></div>

<div class="zh-inp zh-inp-search" data-search><span class="zh-inp-box"><i data-i="search" data-s="18" class="zh-inp-pre"></i><input class="zh-inp-el" type="search" placeholder="搜索文章" aria-label="搜索" enterkeyhint="search"><button type="button" class="zh-inp-btn zh-inp-clear" aria-label="清除搜索" hidden><i data-i="x" data-s="16"></i></button></span></div>

<script>
document.querySelector('[data-search]').addEventListener('zh:search', function (e) {
  console.log('搜索：', e.detail.query);
});
</script>
```

### 样式类

`zh-inp`、`zh-inp-box`、`zh-inp-el`、`zh-inp-pre`、`zh-inp-btn`、`zh-inp-clear`、`zh-inp-eye`、`zh-inp-search`、`zh-inp-addon`、`zh-inp-suf`、`zh-inp-msg`、`zh-inp-status`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `zh-inp-clear` | 输入框内的按钮（class） | 加 hidden 作为初始状态 | 有内容时自动显示，点击清空并让输入框获得焦点 |
| `zh-inp-eye` | password 输入框旁的按钮（class） | aria-pressed="false" | 点击在密码与明文之间切换，并同步 aria-label |
| `data-search` | .zh-inp | 无 | 搜索模式：Enter 触发搜索，Esc 清空内容 |
| `is-error / is-success` | .zh-inp | class | 错误与成功状态的外观；校验逻辑由你来写 |

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:search` | .zh-inp[data-search] | { query } | 在搜索框按 Enter 时触发（冒泡），query 已去掉首尾空格 |
| `zh:search-clear` | .zh-inp[data-search] | 无 | 在有内容的搜索框按 Esc 清空后触发 |

### 无障碍

- 清除按钮必须有 aria-label（示例里已写）
- 密码开关会更新 aria-pressed 和 aria-label
- 图标按钮请保留 aria-label，前置图标是装饰性的
- 校验失败时给 input 设置 aria-invalid="true"，并把错误信息放在 .zh-inp-msg 里

## 常见问题

### 输入框是什么？

带前置图标、清除按钮、密码显示开关、搜索快捷键的文本输入。结构是 .zh-inp 包着 .zh-inp-box 和原生 input，按钮按需添加。

### 怎么使用输入框？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 输入框有哪些事件？

zh:search（在搜索框按 Enter 时触发（冒泡），query 已去掉首尾空格）；zh:search-clear（在有内容的搜索框按 Esc 清空后触发）。

### 输入框支持键盘和读屏吗？

清除按钮必须有 aria-label（示例里已写）；密码开关会更新 aria-pressed 和 aria-label；图标按钮请保留 aria-label，前置图标是装饰性的。

### 输入框需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 键位

纯样式组件：不需要 JS。用 <kbd class="zh-kbd"> 显示键盘按键，如快捷键提示。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<p>按 <kbd class="zh-kbd">Ctrl</kbd> + <kbd class="zh-kbd">K</kbd> 打开搜索，<kbd class="zh-kbd">Esc</kbd> 关闭。</p>
```

### 样式类

`zh-kbd`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `zh-kbd` | <kbd>（class） | 按键名 | 一个按键一个元素；组合键用多个并排 |

### 无障碍

- 使用语义化的 <kbd>
- 符号键（如 ⌘）读屏可能读不出，重要的快捷键请同时在文字里写明

## 常见问题

### 键位是什么？

纯样式组件：不需要 JS。用 <kbd class="zh-kbd"> 显示键盘按键，如快捷键提示。

### 怎么使用键位？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 键位支持键盘和读屏吗？

使用语义化的 <kbd>；符号键（如 ⌘）读屏可能读不出，重要的快捷键请同时在文字里写明。

### 键位需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 布局

纯样式组件：不需要 JS，写好标记即可。响应式栅格（桌面 12 列、平板 8 列、手机 4 列）、自适应卡片网格、主内容加侧栏、垂直堆叠、水平排列、两端对齐。间距来自 Token，不要自己写死。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div class="zh-grid">
  <div class="zh-col" style="--d:3;--t:4;--p:4"><div class="zh-card">访客</div></div>
  <div class="zh-col" style="--d:3;--t:4;--p:4"><div class="zh-card">订单</div></div>
  <div class="zh-col" style="--d:6;--t:8;--p:4"><div class="zh-card">趋势（桌面占一半，手机占满）</div></div>
</div>

<div class="zh-auto-grid">
  <div class="zh-card">一</div><div class="zh-card">二</div><div class="zh-card">三</div><div class="zh-card">四</div>
</div>

<div class="zh-with-aside">
  <main class="zh-card">主内容</main>
  <aside class="zh-card">侧栏</aside>
</div>

<div class="zh-split"><h4>文章管理</h4><button class="zh-btn primary">新建</button></div>
<div class="zh-row" style="--g:8px"><button class="zh-btn">甲</button><button class="zh-btn">乙</button></div>
<div class="zh-stack" style="--g:8px"><div>第一行</div><div>第二行</div></div>
```

### 样式类

`zh-grid`、`zh-col`、`zh-auto-grid`、`zh-with-aside`、`zh-stack`、`zh-row`、`zh-split`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `zh-grid + zh-col` | 容器与子元素（class） | 在 zh-col 上用 style="--d:6;--t:8;--p:4" | 12 / 8 / 4 列栅格。--d 是桌面（≥ 1200px）占几列，--t 是平板（768 到 1199px），--p 是手机（≤ 767px）；不写则桌面占 3、平板占 4、手机占 4。列间距随断点变化 |
| `zh-auto-grid` | 容器（class） | 直接放卡片等子元素 | 按宽度自动排：每列至少 220px，放得下几列就几列，不需要写列数 |
| `zh-with-aside` | 容器（class） | 两个子元素：主内容、侧栏 | 主内容加 320px 侧栏；宽度 ≤ 1199px 时侧栏掉到下面 |
| `zh-stack` | 容器（class） | 可用 style="--g:8px" 改间距，默认 12px | 垂直堆叠 |
| `zh-row` | 容器（class） | 可用 style="--g:8px" | 水平排列，放不下自动换行，垂直居中 |
| `zh-split` | 容器（class） | 两个子元素 | 两端对齐：标题在左，操作在右，窄屏自动换行 |

### 无障碍

- 布局只改变视觉位置，不改变阅读顺序：DOM 里的先后就是读屏和 Tab 的先后
- 栅格里需要标题的区块请用 <section aria-labelledby> 或 aria-label，方便读屏用户导航

## 常见问题

### 布局是什么？

响应式栅格（桌面 12 列、平板 8 列、手机 4 列）、自适应卡片网格、主内容加侧栏、垂直堆叠、水平排列、两端对齐。间距来自 Token，不要自己写死。

### 怎么使用布局？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 布局支持键盘和读屏吗？

布局只改变视觉位置，不改变阅读顺序：DOM 里的先后就是读屏和 Tab 的先后；栅格里需要标题的区块请用 <section aria-labelledby> 或 aria-label，方便读屏用户导航。

### 布局需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 列表

纯样式组件：不需要 JS，写好标记即可。一行一项的列表：主文字、说明、右侧附加内容（标签、时间、按钮），行之间有分隔线。zh-list--bordered 加外框，zh-list--hover 悬停高亮，zh-list--plain 是带圆点的普通列表。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<ul class="zh-list zh-list--bordered">
  <li><div class="zh-list-main"><p class="zh-list-title">产品发布会回顾</p><p class="zh-list-desc">李明 · 2026-10-04</p></div><div class="zh-list-extra"><span class="zh-tag success">已发布</span></div></li>
  <li><div class="zh-list-main"><p class="zh-list-title">季度运营复盘</p><p class="zh-list-desc">王芳 · 2026-10-04</p></div><div class="zh-list-extra"><span class="zh-tag warning">待审核</span></div></li>
</ul>
```

### 样式类

`zh-list`、`zh-list-main`、`zh-list-title`、`zh-list-desc`、`zh-list-extra`、`zh-list--bordered`、`zh-list--hover`、`zh-list--plain`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `zh-list` | <ul>（class） | 每个 <li> 里放 zh-list-main，可再放 zh-list-extra | 列表容器 |
| `zh-list-title / zh-list-desc` | <li> 里的 <p> |  | 主文字（加粗，单行省略）与说明 |
| `zh-list-extra` | <li> 里的容器 |  | 右侧附加内容，不会被挤压 |
| `zh-list--bordered` | .zh-list |  | 圆角外框和底色 |
| `zh-list--hover` | .zh-list |  | 悬停整行高亮；整行可点时请把内容放进 <a> |
| `zh-list--plain` | .zh-list |  | 普通圆点列表，用于文章里的要点 |

### 无障碍

- 用 <ul>/<li> 保持列表语义
- 整行可点击时，用一个覆盖整行的 <a>，不要给 <li> 绑点击

## 常见问题

### 列表是什么？

一行一项的列表：主文字、说明、右侧附加内容（标签、时间、按钮），行之间有分隔线。zh-list--bordered 加外框，zh-list--hover 悬停高亮，zh-list--plain 是带圆点的普通列表。

### 怎么使用列表？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 列表支持键盘和读屏吗？

用 <ul>/<li> 保持列表语义；整行可点击时，用一个覆盖整行的 <a>，不要给 <li> 绑点击。

### 列表需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 营销页区块

可选的 zhaoui-marketing.css：搭一个落地页用的整块样式，页宽与区块间距、hero（左文右卡）、区块标题、特性卡、价格卡、品牌渐变横幅、带品牌色发光的主按钮，以及可选的渐变文字、数据条、极光光斑和玻璃标签。极光、渐变文字、玻璃标签只是装饰，默认不用：普通页面直接用 zh-hero 的浅色渐变；只有深色、发布会式的首屏才考虑加 zh-aurora（并在该区块写 data-mode="dark"）。下面的示例为了演示全部类才把它们放在一起，不是推荐的搭配。全部读主题变量，跟着品牌色、亮暗和 B/C 端走。需要额外引入 zhaoui-marketing.css，放在 zhaoui.css 之后。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<section class="zh-hero zh-aurora zh-aurora--grid" data-mode="dark">
  <div class="zh-wrap zh-hero-grid">
    <div>
      <span class="zh-tag zh-tag--lg primary">2026 全新服务</span>
      <h2 class="zh-display" style="margin-top:16px">一句话讲清<span class="zh-gradient-text">你的价值</span></h2>
      <p class="zh-section-sub" style="margin-bottom:24px">一个副标题，补充说明。主操作用 xl 按钮，次操作用默认按钮。</p>
      <div class="zh-hero-actions"><a class="zh-btn gradient xl" href="#mk-features">主要操作</a><a class="zh-btn xl" href="#mk-price">次要操作</a></div>
      <ul class="zh-stats"><li><b>500+</b><span>合作伙伴</span></li><li><b>98%</b><span>满意度</span></li></ul>
    </div>
    <div class="zh-card zh-float-card"><span class="zh-tag zh-tag--filled primary zh-float-flag">进行中</span><h3>产品卡片</h3><p>放一张展示产品实际样子的卡片。</p></div>
  </div>
</section>
<section class="zh-section zh-section--subtle" id="mk-features">
  <div class="zh-wrap">
    <ol class="zh-stats-bar" style="list-style:none;margin:0 0 32px"><li class="zh-stat"><b class="zh-gradient-text">60+</b><span>个组件</span></li><li class="zh-stat"><b class="zh-gradient-text">0</b><span>运行时依赖</span></li></ol>
    <p class="zh-eyebrow">特性</p>
    <h2 class="zh-section-title">区块标题</h2>
    <p class="zh-section-sub">一段说明文字，宽度自动限制在舒适的行长内。</p>
    <div class="zh-feature-grid">
      <div class="zh-card zh-feature zh-feature--brand"><span class="zh-tile"><i data-i="sparkles"></i></span><h3>主推特性</h3><p>品牌渐变底的特性卡，白字。</p><div class="zh-feature-tags"><span class="zh-tag">标签一</span><span class="zh-tag">标签二</span></div></div>
      <div class="zh-card zh-feature"><span class="zh-index">01</span><h3>普通特性</h3><p>悬停时上浮并带品牌色的柔和阴影。</p><div class="zh-feature-tags"><span class="zh-tag primary">标签一</span><span class="zh-tag primary">标签二</span></div></div>
    </div>
  </div>
</section>
<section class="zh-section zh-section--center" id="mk-price">
  <div class="zh-wrap">
    <h2 class="zh-section-title">价格卡</h2>
    <div class="zh-feature-grid" style="max-width:40rem;margin-inline:auto">
      <div class="zh-card zh-price"><p class="zh-price-name">基础版</p><div class="zh-price-amount">¥99<small>/月</small></div><p class="zh-price-desc">适合个人</p><ul class="zh-price-list"><li><i data-i="check"></i>功能一</li><li><i data-i="check"></i>功能二</li></ul><a class="zh-btn lg" href="#">选择</a></div>
      <div class="zh-card zh-price zh-price--popular"><span class="zh-tag zh-tag--filled primary zh-price-flag">最受欢迎</span><p class="zh-price-name">专业版</p><div class="zh-price-amount">¥299<small>/月</small></div><p class="zh-price-desc">适合团队</p><ul class="zh-price-list"><li><i data-i="check"></i>功能一</li><li><i data-i="check"></i>功能二</li><li><i data-i="check"></i>功能三</li></ul><a class="zh-btn primary lg" href="#">选择</a></div>
    </div>
  </div>
</section>
<section class="zh-section zh-section--brand">
  <div class="zh-wrap"><h2 class="zh-section-title">行动号召</h2><p class="zh-section-sub" style="margin:0 auto 24px">品牌渐变底的整行区块，字用 on-primary。</p><a class="zh-btn xl" href="#">立即开始</a></div>
</section>
```

### 样式类

`zh-wrap`、`zh-section`、`zh-section--subtle`、`zh-section--brand`、`zh-section--center`、`zh-eyebrow`、`zh-display`、`zh-section-title`、`zh-section-sub`、`zh-hero`、`zh-hero-grid`、`zh-hero-actions`、`zh-stats`、`zh-float-card`、`zh-float-flag`、`zh-feature-grid`、`zh-feature`、`zh-feature--brand`、`zh-feature-tags`、`zh-tags`、`zh-tile`、`zh-price`、`zh-price--popular`、`zh-price-flag`、`zh-price-name`、`zh-price-amount`、`zh-price-desc`、`zh-price-list`、`zh-nav--contained`、`zh-glow`、`zh-gradient-text`、`zh-index`、`zh-stats-bar`、`zh-stat`、`zh-aurora`、`zh-aurora--grid`、`zh-aurora-stage`、`zh-glass-tag`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `zh-wrap` | 容器（class） |  | 页面内容宽度：最宽 --zh-page-max（80rem），两侧留白随屏幕在 16 到 64px 之间变化 |
| `zh-section` | <section>（class） | 加 --subtle（浅灰底）、--brand（品牌渐变底、白字）、--center（标题居中） | 一个区块；上下留白用 --zh-section-gap（64 到 96px，随屏幕）。给区块加 data-mode="dark" 就是一整块深色区 |
| `zh-eyebrow / zh-display / zh-section-title / zh-section-sub` | 文字（class） |  | 小标题、展示级大标题（--zh-font-display，em 部分用品牌色）、区块标题（--zh-font-title）、区块说明（限制行宽） |
| `zh-hero + zh-hero-grid` | 区块与容器 |  | 首屏：柔和渐变底，左边文字、右边产品卡片，900px 以下上下排 |
| `zh-float-card + zh-float-flag` | 卡片与标签 |  | 带大阴影的产品展示卡，标签浮在右上角并带品牌色发光 |
| `zh-feature-grid + zh-feature` | 网格与卡片 | 加 zh-feature--brand 做主推卡 | 自动按宽度分列的特性卡；zh-feature-grid--4 每列更窄；悬停上浮 |
| `zh-feature-tags / zh-tags` | 标签组 |  | 卡片里的多个标签：比单个状态标签更高、更松，间距 8px |
| `zh-tile` | 图标块 | 里面放 <i data-i> | 52px 的圆角图标底块，品牌浅色底 |
| `zh-price 系列` | 价格卡 | zh-price-name、zh-price-amount、zh-price-desc、zh-price-list、zh-price-flag | 价格卡；zh-price--popular 加品牌边框和发光 |
| `zh-nav--contained` | 导航条（class） |  | 让导航内容和页面内容对齐在同一条线上 |
| `zh-glow` | 按钮等（class） |  | 品牌色发光阴影；hero 里的主按钮已自带 |
| `zh-btn xl` | 按钮（class） |  | 超大按钮，落地页的主操作用；比 lg 再大 8px 高度 |
| `zh-gradient-text / zh-index` | 文字（class） |  | 渐变文字 / 渐变编号（01、02…）。渐变取自品牌派生的三个强调色 --zh-accent-a/b/c，只用在大字号上（强调色在白底和近黑底上都有 3:1，是大字的下限，不适合小字） |
| `--zh-accent-a / b / c` | 品牌令牌 | 颜色 | 三个强调色，换品牌色会一起变；想固定成指定的三色（如珊瑚、橙、紫），在 CSS 里直接覆盖这三个变量。--zh-gradient-accent 是用它们画的渐变 |
| `zh-stats-bar + zh-stat` | 容器与项 | 项里放 <b>数字</b><span>说明</span> | 一排关键数据放在一张柔和的大圆角卡里，竖线分隔；数字上加 zh-gradient-text 得到渐变数字；给它负的上外边距可以压在上面的 hero 上 |
| `zh-aurora（+ zh-aurora--grid）` | 区块（class） | 需同时加 data-mode="dark" | 可选装饰：深色底上用强调色画的静态光斑，加 --grid 再叠一层淡网格；没有模糊滤镜也没有动画，几乎没有绘制成本 |
| `zh-aurora-stage + zh-glass-tag` | 展示卡与标签 | glass-tag 用 style 的 left/top 定位 | 深色展示卡，上面浮动的玻璃标签（半透明加模糊；不支持模糊的浏览器只是半透明）；只在深色或图片背景上使用 |
| `zh-btn gradient` | 按钮（class） |  | 主操作的渐变按钮：从主色渐变到深一档的主色，白字对比度达标；原站那种“白字压鲜艳渐变”约 3.2:1，不达标，库里不提供 |

### 无障碍

- 大标题用真正的 h1/h2，区块用 <section> 并有标题；这些类只管样式，不改语义
- 品牌渐变底上的字固定用 --zh-on-primary，主色由库保证白字不低于 4.5:1
- hero 里的“em”强调色用大字号（不小于 24px 的粗体）才能用 --zh-brand-6，正文大小的强调请用 --zh-color-primary-text
- 手机上 hero、网格会自动单列；价格卡等宽度不要写死像素
- 渐变文字用 background-clip，强制颜色（Windows 高对比度）下自动退回普通文字色；光斑和网格在高对比度下隐藏

## 常见问题

### 营销页区块是什么？

可选的 zhaoui-marketing.css：搭一个落地页用的整块样式，页宽与区块间距、hero（左文右卡）、区块标题、特性卡、价格卡、品牌渐变横幅、带品牌色发光的主按钮，以及可选的渐变文字、数据条、极光光斑和玻璃标签。极光、渐变文字、玻璃标签只是装饰，默认不用：普通页面直接用 zh-hero 的浅色渐变；只有深色、发布会式的首屏才考虑加 zh-aurora（并在该区块写 data-mode="dark"）。下面的示例为了演示全部类才把它们放在一起，不是推荐的搭配。全部读主题变量，跟着品牌色、亮暗和 B/C 端走。需要额外引入 zhaoui-marketing.css，放在 zhaoui.css 之后。

### 怎么使用营销页区块？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 营销页区块支持键盘和读屏吗？

大标题用真正的 h1/h2，区块用 <section> 并有标题；这些类只管样式，不改语义；品牌渐变底上的字固定用 --zh-on-primary，主色由库保证白字不低于 4.5:1；hero 里的“em”强调色用大字号（不小于 24px 的粗体）才能用 --zh-brand-6，正文大小的强调请用 --zh-color-primary-text。

### 营销页区块需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 滚动公告

一行向左滚动的公告文字，首尾无缝衔接；悬停或聚焦时暂停；系统开启“减少动态效果”时不滚动，改为可横向拖动。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div data-zh-marquee data-speed="50" aria-label="公告">系统将在今晚 23:00 进行维护，预计 30 分钟。 <a href="#">查看详情</a></div>
```

### 样式类

`zh-marquee`、`zh-marquee-track`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-zh-marquee` | 容器 | 里面放文字或链接 | 声明为滚动公告；库会复制一份内容（对读屏隐藏）做无缝循环 |
| `data-speed` | 容器 | 像素每秒，默认 60 | 滚动速度 |

### 无障碍

- 复制出来的内容是 aria-hidden 且不可聚焦，读屏只读一遍
- 滚动的文字不好阅读：重要通知请同时用警告条常驻显示

## 常见问题

### 滚动公告是什么？

一行向左滚动的公告文字，首尾无缝衔接；悬停或聚焦时暂停；系统开启“减少动态效果”时不滚动，改为可横向拖动。

### 怎么使用滚动公告？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 滚动公告支持键盘和读屏吗？

复制出来的内容是 aria-hidden 且不可聚焦，读屏只读一遍；滚动的文字不好阅读：重要通知请同时用警告条常驻显示。

### 滚动公告需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 遮罩条

纯样式组件：不需要 JS，写好标记即可。盖在图片或卡片底部的说明条：渐变深色底配白字，在任何图片上都能读。zh-maskbar--solid 是纯色条，zh-maskbar--hover 平时隐藏、悬停或聚焦时出现。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div class="zh-mask-wrap" style="max-width:16rem;aspect-ratio:16/9;background:var(--zh-color-primary-subtle)">
  <div class="zh-maskbar">产品发布会现场</div>
</div>
```

### 样式类

`zh-mask-wrap`、`zh-maskbar`、`zh-maskbar--solid`、`zh-maskbar--hover`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `zh-mask-wrap` | 容器（class） |  | 相对定位并裁切，里面放图片和遮罩条 |
| `zh-maskbar` | 容器里的元素 | 文字 | 底部渐变遮罩条；颜色固定为深底白字，不随主题变 |
| `zh-maskbar--solid / --hover` | .zh-maskbar |  | 纯色底 / 悬停才出现 |

### 无障碍

- 悬停才出现的遮罩条，内容在触屏设备上看不到，重要信息不要只放在里面（库在触屏设备上不做特殊处理）

## 常见问题

### 遮罩条是什么？

盖在图片或卡片底部的说明条：渐变深色底配白字，在任何图片上都能读。zh-maskbar--solid 是纯色条，zh-maskbar--hover 平时隐藏、悬停或聚焦时出现。

### 怎么使用遮罩条？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 遮罩条支持键盘和读屏吗？

悬停才出现的遮罩条，内容在触屏设备上看不到，重要信息不要只放在里面（库在触屏设备上不做特殊处理）。

### 遮罩条需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 配置式菜单与右键菜单

用一个数组描述菜单，再挂到按钮或区域上：分组标题、分隔线、图标、快捷键提示、复选项、单选项、危险项、禁用项、多级子菜单。同一份数组也能做右键菜单。固定写在 HTML 里的简单菜单用「下拉菜单」（data-zh-dropdown）更省事。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div class="zh-row">
  <button class="zh-btn" id="mn-btn">文件 <i data-i="chevron-down"></i></button>
  <div id="mn-area" class="zh-card" style="padding:16px">在这里点右键</div>
</div>
<script>
  var items = [
    { type: 'group', label: '文件' },
    { label: '重命名', icon: 'pencil', shortcut: 'F2' },
    { label: '移动到', icon: 'folder-open', sub: [{ label: '我的文档' }, { label: '项目归档' }] },
    { type: 'sep' },
    { type: 'check', label: '显示隐藏文件', checked: true },
    { type: 'sep' },
    { label: '删除', icon: 'trash-2', danger: true }
  ];
  ZhaoUI.menu(document.getElementById('mn-btn'), items, { label: '文件操作', onSelect: function (it) { ZhaoUI.message('选择了：' + it.label); } });
  ZhaoUI.contextMenu(document.getElementById('mn-area'), items);
</script>
```

### 样式类

`zh-dd-menu`、`zh-dd-item`、`zh-dd-group`、`zh-dd-sep`、`zh-dd-lead`、`zh-dd-label`、`zh-dd-kbd`、`zh-dd-caret`

### 方法

- `ZhaoUI.menu(button, items, options)`：点击按钮打开菜单，返回弹出层句柄（open、close、toggle、isOpen）。options：placement（默认 bottom-start）、label（菜单的 aria-label）、onSelect(item)、onClose()、trigger（click 默认，manual 则自己调用 open）
- `ZhaoUI.contextMenu(area, items, options)`：在区域上右键、按 Shift+F10 或菜单键时，在鼠标处（或区域中心）打开菜单。区域会自动可聚焦。options：label、onSelect(item)
- `菜单项 item`：type 取 'sep'（分隔线）、'group'（分组标题，label 为标题）、'check'（复选，点击切换 checked，菜单保持打开）、'radio'（同一 name 的单选，菜单保持打开）；普通项点击后触发 onSelect 并关闭；sub 是子菜单数组

### 无障碍

- role=menu，项为 menuitem / menuitemcheckbox / menuitemradio，复选与单选带 aria-checked
- 键盘：↑↓ 移动，输入首字母跳转，→ 进入子菜单，← 回到上一级，Esc 关闭并回到触发按钮，右键菜单关闭后焦点回到区域
- 打开后第一项自动获得焦点；按钮上按 ↑ 会从最后一项开始
- 右键菜单只是快捷方式，所有操作也要能在页面里用按钮完成

## 常见问题

### 配置式菜单与右键菜单是什么？

用一个数组描述菜单，再挂到按钮或区域上：分组标题、分隔线、图标、快捷键提示、复选项、单选项、危险项、禁用项、多级子菜单。同一份数组也能做右键菜单。固定写在 HTML 里的简单菜单用「下拉菜单」（data-zh-dropdown）更省事。

### 怎么使用配置式菜单与右键菜单？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写；需要用代码控制时，用「方法」里列出的接口。

### 配置式菜单与右键菜单有哪些方法？

ZhaoUI.menu(button, items, options)：点击按钮打开菜单，返回弹出层句柄（open、close、toggle、isOpen）。options：placement（默认 bottom-start）、label（菜单的 aria-label）、onSelect(item)、onClose()、trigger（click 默认，manual 则自己调用 open）；ZhaoUI.contextMenu(area, items, options)：在区域上右键、按 Shift+F10 或菜单键时，在鼠标处（或区域中心）打开菜单。区域会自动可聚焦。options：label、onSelect(item)；菜单项 item：type 取 'sep'（分隔线）、'group'（分组标题，label 为标题）、'check'（复选，点击切换 checked，菜单保持打开）、'radio'（同一 name 的单选，菜单保持打开）；普通项点击后触发 onSelect 并关闭；sub 是子菜单数组。

### 配置式菜单与右键菜单支持键盘和读屏吗？

role=menu，项为 menuitem / menuitemcheckbox / menuitemradio，复选与单选带 aria-checked；键盘：↑↓ 移动，输入首字母跳转，→ 进入子菜单，← 回到上一级，Esc 关闭并回到触发按钮，右键菜单关闭后焦点回到区域；打开后第一项自动获得焦点；按钮上按 ↑ 会从最后一项开始。

### 配置式菜单与右键菜单需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 消息提示

顶部居中的轻量提示，自动消失。只提供方法调用，不需要写标记。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<script>
ZhaoUI.message('保存成功');
ZhaoUI.message('网络异常，请重试', { type: 'error', duration: 4000 });

var close = ZhaoUI.message('正在上传…', { type: 'info', duration: 0 });
// 完成后
close();
</script>
```

### 样式类

`zh-message`

### 方法

- `ZhaoUI.message(text, { type, duration })`：显示一条消息。type：success（默认）、info、warning、error；duration 为毫秒，默认 2400，传 0 则不自动消失。返回一个函数，调用即提前关闭。text 按纯文本处理

### 无障碍

- 容器是 aria-live="polite"；error 类型使用 role="alert"，其余为 role="status"
- 在模态框打开时调用，消息会显示在模态框之上（库会把容器放进打开的 <dialog>），关闭后自动挪回
- 不要把必须阅读的信息只放在消息里：它会自己消失

## 常见问题

### 消息提示是什么？

顶部居中的轻量提示，自动消失。只提供方法调用，不需要写标记。

### 怎么使用消息提示？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写；需要用代码控制时，用「方法」里列出的接口。

### 消息提示有哪些方法？

ZhaoUI.message(text, { type, duration })：显示一条消息。type：success（默认）、info、warning、error；duration 为毫秒，默认 2400，传 0 则不自动消失。返回一个函数，调用即提前关闭。text 按纯文本处理。

### 消息提示支持键盘和读屏吗？

容器是 aria-live="polite"；error 类型使用 role="alert"，其余为 role="status"；在模态框打开时调用，消息会显示在模态框之上（库会把容器放进打开的 <dialog>），关闭后自动挪回；不要把必须阅读的信息只放在消息里：它会自己消失。

### 消息提示需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 顶部导航条

网站或应用顶部的导航：左侧标志，中间链接（当前页下方有滑动的下划线），右侧放搜索、通知、头像等你自己的内容。有嵌套 <ul> 的链接自动成为下拉菜单；宽度小于 768px 时链接收进汉堡按钮打开的侧滑抽屉。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<header class="zh-nav" data-zh-nav aria-label="主导航">
  <a class="zh-nav-logo" href="#"><i aria-hidden="true"></i><span>ZhaoUI</span></a>
  <ul class="zh-nav-links">
    <li><a class="zh-nav-link" href="#" aria-current="page" data-icon="layout-dashboard">概览</a></li>
    <li><button class="zh-nav-link" type="button" data-icon="file-text">产品<i data-i="chevron-down"></i></button>
      <ul><li><a href="#">中控台</a></li><li><a href="#">数据分析</a></li></ul></li>
    <li><a class="zh-nav-link" href="#">价格</a></li>
  </ul>
  <div class="zh-nav-right"><button class="zh-nav-avatar" type="button" aria-label="账户">ZW</button></div>
</header>
```

### 样式类

`zh-nav`、`zh-nav-logo`、`zh-nav-links`、`zh-nav-link`、`zh-nav-right`、`zh-nav-iconbtn`、`zh-nav-avatar`、`zh-nav-search`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-zh-nav` | <header class="zh-nav"> 或 <nav> |  | 声明为导航条；直接子元素按顺序放 .zh-nav-logo、ul.zh-nav-links、.zh-nav-right |
| `zh-nav-link` | <a> 或 <button>（class） |  | 一个导航项；当前页加 aria-current="page" |
| `嵌套 <ul>` | 含子链接的 <li> 里 | 里面放 <a href> | 把外层的 zh-nav-link 变成下拉菜单触发器；手机抽屉里变成可展开的二级 |
| `data-icon` | <a> / 顶层 zh-nav-link | 图标名 | 抽屉里该项前的图标（桌面端不显示） |
| `zh-nav-iconbtn` | <button>（class） | 里面放 <i data-i> | 右侧的图标按钮，如通知；必须有 aria-label |
| `zh-nav-avatar` | <button>（class） | 缩写文字 | 圆形头像按钮，可配合 data-zh-dropdown 做账户菜单 |
| `zh-nav-search` | <button>（class） | 图标、提示文字和 zh-kbd | 外观像搜索框的按钮，点击后打开你自己的搜索；手机宽度自动隐藏 |

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:nav-select` | 导航条 | undefined | 点击链接（桌面或抽屉里）。href 为 # 或为空时库不跳转，只切换当前页 |

### 无障碍

- 导航条要有 aria-label；当前页用 aria-current="page" 标出，不只靠下划线颜色
- 汉堡按钮带 aria-expanded 和 aria-controls；抽屉打开后焦点被限制在里面，Esc 或点击遮罩关闭并把焦点还给按钮
- 下拉菜单：回车或点击展开，↓ 进入菜单项，Esc 关闭
- 导航条本身不固定位置；需要吸顶时加 zh-sticky zh-top-0（公共类），或自己写 position: sticky
- 不含超大菜单（带图标和说明的多列面板）和全局搜索面板；这些请自己用气泡卡片或对话框做

## 常见问题

### 顶部导航条是什么？

网站或应用顶部的导航：左侧标志，中间链接（当前页下方有滑动的下划线），右侧放搜索、通知、头像等你自己的内容。有嵌套 <ul> 的链接自动成为下拉菜单；宽度小于 768px 时链接收进汉堡按钮打开的侧滑抽屉。

### 怎么使用顶部导航条？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 顶部导航条有哪些事件？

zh:nav-select（点击链接（桌面或抽屉里）。href 为 # 或为空时库不跳转，只切换当前页）。

### 顶部导航条支持键盘和读屏吗？

导航条要有 aria-label；当前页用 aria-current="page" 标出，不只靠下划线颜色；汉堡按钮带 aria-expanded 和 aria-controls；抽屉打开后焦点被限制在里面，Esc 或点击遮罩关闭并把焦点还给按钮；下拉菜单：回车或点击展开，↓ 进入菜单项，Esc 关闭。

### 顶部导航条需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 数字步进器

带加减按钮的数字输入，支持范围、步长、小数位数，键盘可操作，按住按钮连续加减。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div class="zh-inp zh-num" id="qty" data-min="1" data-max="10" data-step="1">
  <button type="button" class="zh-num-btn" data-dir="-1" aria-label="减少" tabindex="-1"><i data-i="minus" data-s="16"></i></button>
  <input class="zh-inp-el" role="spinbutton" inputmode="numeric" value="3" aria-label="数量">
  <button type="button" class="zh-num-btn" data-dir="1" aria-label="增加" tabindex="-1"><i data-i="plus" data-s="16"></i></button>
</div>

<div class="zh-inp zh-num" data-min="0" data-max="9999" data-step="0.5" data-precision="2">
  <button type="button" class="zh-num-btn" data-dir="-1" aria-label="减少" tabindex="-1"><i data-i="minus" data-s="16"></i></button>
  <input class="zh-inp-el" role="spinbutton" inputmode="decimal" value="12.50" aria-label="金额">
  <button type="button" class="zh-num-btn" data-dir="1" aria-label="增加" tabindex="-1"><i data-i="plus" data-s="16"></i></button>
</div>

<script>
document.getElementById('qty').addEventListener('zh:number', function (e) {
  console.log(e.detail.value);
});
</script>
```

### 样式类

`zh-num`、`zh-num-btn`、`zh-num-split`、`zh-num-stack`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-min` | .zh-num | 数字 | 最小值，不写则不限 |
| `data-max` | .zh-num | 数字 | 最大值，不写则不限 |
| `data-step` | .zh-num | 数字，默认 1 | 每次加减的步长 |
| `data-precision` | .zh-num | 整数 | 小数位数；不写则按步长推断（步长 0.5 → 1 位） |
| `data-dir` | .zh-num-btn | 1 或 -1 | 按钮的方向：1 增加，-1 减少 |

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:number` | .zh-num | { value } | 值被步进、回车或失焦后规范化时触发（冒泡），value 是数字 |

### 无障碍

- input 需要 role="spinbutton"，库会维护 aria-valuenow / aria-valuemin / aria-valuemax
- ↑ ↓ 加减一个步长，按住 Shift 或用 PageUp / PageDown 加减 10 个步长，Enter 立即规范化
- 到达边界时对应按钮自动禁用；输入超出范围的值，失焦后会被拉回范围内
- 加减按钮设为 tabindex="-1"，键盘用户直接用方向键

## 常见问题

### 数字步进器是什么？

带加减按钮的数字输入，支持范围、步长、小数位数，键盘可操作，按住按钮连续加减。

### 怎么使用数字步进器？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 数字步进器有哪些事件？

zh:number（值被步进、回车或失焦后规范化时触发（冒泡），value 是数字）。

### 数字步进器支持键盘和读屏吗？

input 需要 role="spinbutton"，库会维护 aria-valuenow / aria-valuemin / aria-valuemax；↑ ↓ 加减一个步长，按住 Shift 或用 PageUp / PageDown 加减 10 个步长，Enter 立即规范化；到达边界时对应按钮自动禁用；输入超出范围的值，失焦后会被拉回范围内。

### 数字步进器需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 验证码输入

分格的一次性验证码输入。只写一个空的容器，格子由库生成；支持粘贴、退格回退、方向键。校验由你来做，用 ZhaoUI.otp 把结果显示出来。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div id="otpLabel">输入 6 位验证码</div>
<div class="zh-otp" id="otp" data-length="6" aria-labelledby="otpLabel"></div>

<script>
document.getElementById('otp').addEventListener('zh:otp-complete', function (e) {
  // 换成你自己的校验
  if (e.detail.value === '123456') ZhaoUI.otp.ok('#otp'); else ZhaoUI.otp.error('#otp');
});
</script>
```

### 样式类

`zh-otp`、`zh-otp-cell`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-length` | .zh-otp | 整数，默认 6 | 验证码位数 |
| `aria-labelledby` | .zh-otp | 标签元素的 id | 容器会自动加 role="group"，用它给整组命名 |
| `is-error / is-ok` | .zh-otp | class | 由 ZhaoUI.otp.error / ok 设置，也会在用户再次输入时自动清除 |

### 方法

- `ZhaoUI.otp.value(el)`：读取当前已输入的内容
- `ZhaoUI.otp.error(el)`：标记为错误并播放抖动动画
- `ZhaoUI.otp.ok(el)`：标记为通过
- `ZhaoUI.otp.clear(el)`：清空所有格子并把焦点放回第一格

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:otp-complete` | .zh-otp | { value } | 所有格子填满时触发（冒泡），value 是完整的验证码字符串 |

### 无障碍

- 每一格都有「第 N 位，共 M 位」的 aria-label；第一格带 autocomplete="one-time-code"，手机可以自动填入短信验证码
- 只接受数字，粘贴一串数字会从当前格开始依次填入
- ← → 在格子间移动，Home / End 到首尾，空格子里按退格会回到上一格并清空它
- el 参数可以是元素，也可以是选择器

## 常见问题

### 验证码输入是什么？

分格的一次性验证码输入。只写一个空的容器，格子由库生成；支持粘贴、退格回退、方向键。校验由你来做，用 ZhaoUI.otp 把结果显示出来。

### 怎么使用验证码输入？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写；需要用代码控制时，用「方法」里列出的接口。

### 验证码输入有哪些事件？

zh:otp-complete（所有格子填满时触发（冒泡），value 是完整的验证码字符串）。

### 验证码输入有哪些方法？

ZhaoUI.otp.value(el)：读取当前已输入的内容；ZhaoUI.otp.error(el)：标记为错误并播放抖动动画；ZhaoUI.otp.ok(el)：标记为通过；ZhaoUI.otp.clear(el)：清空所有格子并把焦点放回第一格。

### 验证码输入支持键盘和读屏吗？

每一格都有「第 N 位，共 M 位」的 aria-label；第一格带 autocomplete="one-time-code"，手机可以自动填入短信验证码；只接受数字，粘贴一串数字会从当前格开始依次填入；← → 在格子间移动，Home / End 到首尾，空格子里按退格会回到上一格并清空它。

### 验证码输入需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 页头

纯样式组件：不需要 JS。后台内容区顶部的标题区：返回按钮、标题、说明、操作按钮和一行元信息。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<header class="zh-ph">
  <nav aria-label="当前位置"><ol class="zh-crumb"><li><a href="#">首页</a></li><li aria-current="page">文章详情</li></ol></nav>
  <div class="zh-ph-main">
    <div class="zh-ph-title"><button class="zh-ph-back" aria-label="返回"><i data-i="chevron-left"></i></button><h4>产品发布会回顾</h4><span class="zh-tag success">已发布</span></div>
    <div class="zh-ph-actions"><button class="zh-btn">预览</button><button class="zh-btn primary">编辑</button></div>
  </div>
  <dl class="zh-ph-meta"><div><dt>作者</dt><dd>李明</dd></div><div><dt>更新</dt><dd>2026-10-04</dd></div></dl>
</header>
```

### 样式类

`zh-ph`、`zh-ph-main`、`zh-ph-title`、`zh-ph-back`、`zh-ph-sec`、`zh-ph-actions`、`zh-ph-meta`、`zh-ph--compact`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `zh-ph` | <header>（class） |  | 页头容器，上方一般放面包屑 |
| `zh-ph-main` | 容器 |  | 标题和操作按钮所在的一行，空间不够会换行 |
| `zh-ph-title` | 容器 | 里面放 <h4>，可带 zh-ph-back 返回按钮与 zh-ph-sec 副标题 | 手机宽度隐藏副标题 |
| `zh-ph-actions` | 容器 | 里面放 zh-btn | 右侧操作区 |
| `zh-ph-meta` | <dl> | 多个 <div><dt>…</dt><dd>…</dd></div> | 标题下面的一行元信息 |
| `zh-ph--compact` | .zh-ph |  | 紧凑版：标题、标签页、操作排在一行 |

### 无障碍

- 返回按钮是图标按钮，必须有 aria-label
- 页面的唯一一级标题放在 zh-ph-title 里

## 常见问题

### 页头是什么？

纯样式组件：不需要 JS。后台内容区顶部的标题区：返回按钮、标题、说明、操作按钮和一行元信息。

### 怎么使用页头？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 页头支持键盘和读屏吗？

返回按钮是图标按钮，必须有 aria-label；页面的唯一一级标题放在 zh-ph-title 里。

### 页头需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 分页

分页器，页码数量恒定不跳动，支持每页条数、跳转框、简洁模式、多种尺寸。声明式写 data-zh-pager，或用 ZhaoUI.pager 创建。库不管数据，只管页码，翻页后你自己取数据。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<nav class="zh-pg" id="pg1" data-zh-pager data-total="486" data-size="10" data-show-size-changer data-show-jumper aria-label="文章分页"></nav>
<nav class="zh-pg" data-zh-pager data-total="200" data-simple aria-label="简洁分页"></nav>

<script>
document.getElementById('pg1').addEventListener('zh:page-change', function (e) {
  console.log('第', e.detail.page, '页，每页', e.detail.size, '条');
});
</script>
```

### 样式类

`zh-pg`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-zh-pager` | .zh-pg 或任意容器 | 无 | 声明这是一个分页器，用下面的 data-* 配置 |
| `data-total / data-page / data-page-size（等同 data-size）` | 容器 | 整数 | 总条数 / 当前页（默认 1）/ 每页条数（默认 10）。注意：data-size 和 data-page-size 是每页多少条，不是控件大小；控件大小用 data-size-name |
| `data-sizes` | 容器 | 逗号分隔，如 10,20,50 | 每页条数的可选项，配合 data-show-size-changer |
| `data-show-total / data-show-size-changer / data-show-jumper` | 容器 | 布尔属性 | 显示总数（默认开）/ 每页条数选择 / 跳转输入框 |
| `data-simple / data-bordered / data-disabled / data-hide-on-single-page` | 容器 | 布尔属性 | 简洁模式 / 带边框 / 禁用 / 只有一页时隐藏 |
| `data-size-name` | 容器 | sm \| md（默认）\| lg | 控件的大小，不是每页条数（每页条数用 data-page-size） |
| `data-siblings / data-boundary` | 容器 | 整数，默认 1 | 当前页两侧与首尾各保留几个页码 |

### 方法

- `ZhaoUI.pager(el, { total, page, size, ..., onChange })`：命令式创建，返回 { get(), set(partial), go(page) }。选项与上面的 data-* 一一对应（驼峰写法）
- `el.__zhPager.set({ total })`：数据条数变化后更新（例如筛选后），页码会自动收敛到有效范围

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:page-change` | 容器 | { page, size } | 页码或每页条数变化时触发（冒泡） |

### 无障碍

- 当前页带 aria-current="page"，每个页码按钮有「第 N 页」的 aria-label
- 翻页后通过 aria-live 朗读「第 3 页，共 49 页」
- 上一页 / 下一页在首尾时用 aria-disabled，不会丢失焦点
- 页码过多时用「…」按钮，可以一次向前 / 向后跳多页
- 跳转框输入非法页码时标记 aria-invalid 并朗读提示
- 翻页后表格内容要你自己换：库只管页码，监听 zh:page-change 取数据，再用 el.__zhPager.set({ total }) 更新总数

## 常见问题

### 分页是什么？

分页器，页码数量恒定不跳动，支持每页条数、跳转框、简洁模式、多种尺寸。声明式写 data-zh-pager，或用 ZhaoUI.pager 创建。库不管数据，只管页码，翻页后你自己取数据。

### 怎么使用分页？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写；需要用代码控制时，用「方法」里列出的接口。

### 分页有哪些事件？

zh:page-change（页码或每页条数变化时触发（冒泡））。

### 分页有哪些方法？

ZhaoUI.pager(el, { total, page, size, ..., onChange })：命令式创建，返回 { get(), set(partial), go(page) }。选项与上面的 data-* 一一对应（驼峰写法）；el.__zhPager.set({ total })：数据条数变化后更新（例如筛选后），页码会自动收敛到有效范围。

### 分页支持键盘和读屏吗？

当前页带 aria-current="page"，每个页码按钮有「第 N 页」的 aria-label；翻页后通过 aria-live 朗读「第 3 页，共 49 页」；上一页 / 下一页在首尾时用 aria-disabled，不会丢失焦点。

### 分页需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 气泡确认

挂在触发按钮旁的小确认框，用于轻量的二次确认（删除一行、下线一篇）。比模态框轻；破坏性很大的操作仍用确认对话框。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<button class="zh-btn" data-zh-popconfirm="删除这个文件？" data-desc="删除后 30 天内可在回收站找回。" data-ok="删除" data-danger id="pc-del">删除</button>
<script>
  document.getElementById('pc-del').addEventListener('zh:popconfirm', function (e) {
    if (e.detail.action === 'ok') ZhaoUI.message('已删除');
  });
</script>
```

### 样式类

`zh-pc`、`zh-pc-body`、`zh-pc-title`、`zh-pc-desc`、`zh-pc-foot`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-zh-popconfirm` | 触发按钮 | 确认问题，如“删除这个文件？” | 声明气泡确认，值是标题 |
| `data-desc` | 同上 | 补充说明 | 可选 |
| `data-ok / data-cancel` | 同上 | 按钮文字，默认“确定”“取消” | 确认按钮写动作，如“删除” |
| `data-danger` | 同上 |  | 破坏性操作：图标和确认按钮用危险色 |
| `data-kind` | 同上 | warning（默认）\| info | 图标语气 |
| `data-placement` | 同上 | top（默认）\| bottom \| left \| right | 位置 |

### 方法

- `ZhaoUI.popconfirm(anchor, options)`：命令式用法。options：title、desc、okText、cancelText、kind、danger、placement、onConfirm()。onConfirm 返回 Promise 时，确认按钮显示加载中，成功后关闭，失败则保持打开

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:popconfirm` | 触发按钮 | { action: 'ok' \| 'cancel' } | 用户点了确认或取消。在 ok 时执行真正的操作 |

### 无障碍

- 焦点被限制在气泡内，Tab 在两个按钮间切换，Esc 取消并回到触发按钮
- 标题通过 aria-labelledby 关联
- 加载中时气泡外的点击与 Esc 被忽略，避免重复提交

## 常见问题

### 气泡确认是什么？

挂在触发按钮旁的小确认框，用于轻量的二次确认（删除一行、下线一篇）。比模态框轻；破坏性很大的操作仍用确认对话框。

### 怎么使用气泡确认？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写；需要用代码控制时，用「方法」里列出的接口。

### 气泡确认有哪些事件？

zh:popconfirm（用户点了确认或取消。在 ok 时执行真正的操作）。

### 气泡确认有哪些方法？

ZhaoUI.popconfirm(anchor, options)：命令式用法。options：title、desc、okText、cancelText、kind、danger、placement、onConfirm()。onConfirm 返回 Promise 时，确认按钮显示加载中，成功后关闭，失败则保持打开。

### 气泡确认支持键盘和读屏吗？

焦点被限制在气泡内，Tab 在两个按钮间切换，Esc 取消并回到触发按钮；标题通过 aria-labelledby 关联；加载中时气泡外的点击与 Esc 被忽略，避免重复提交。

### 气泡确认需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 气泡卡片

点击（或悬停、聚焦）触发的浮层，里面可以放任意内容：说明、小表单、操作列表。内容写在页面里的一个隐藏元素中，库会复制进浮层。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<button class="zh-btn" data-zh-popover="#pv-card" data-arrow>查看详情</button>
<div id="pv-card" hidden>
  <p><strong>李明</strong></p>
  <p>内容组 · 最近更新 2 小时前</p>
</div>
```

### 样式类

`zh-pop`、`zh-pop--popover`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-zh-popover` | 触发按钮 | 内容元素的选择器，如 #panel | 该元素会被隐藏，打开时把它的内容复制进浮层 |
| `data-placement` | 同上 | top \| bottom \| left \| right，可加 -start / -end，默认 bottom-start | 位置，空间不够自动翻转 |
| `data-trigger` | 同上 | click（默认）\| hover \| focus | 触发方式 |
| `data-arrow` | 同上 |  | 显示指向触发元素的小箭头 |

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:popover-open` | 触发按钮 | { popover } | 浮层打开后，popover 是浮层元素 |
| `zh:popover-close` | 触发按钮 | 无 | 浮层关闭 |

### 无障碍

- 点击触发时焦点被限制在浮层里，按 Esc 或点击外部关闭，焦点回到触发按钮
- 触发按钮会自动带 aria-expanded 和 aria-controls
- 浮层里的元素是复制品：事件请用事件委托或监听 zh:popover-open，不要给原元素绑定

## 常见问题

### 气泡卡片是什么？

点击（或悬停、聚焦）触发的浮层，里面可以放任意内容：说明、小表单、操作列表。内容写在页面里的一个隐藏元素中，库会复制进浮层。

### 怎么使用气泡卡片？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 气泡卡片有哪些事件？

zh:popover-open（浮层打开后，popover 是浮层元素）；zh:popover-close（浮层关闭）。

### 气泡卡片支持键盘和读屏吗？

点击触发时焦点被限制在浮层里，按 Esc 或点击外部关闭，焦点回到触发按钮；触发按钮会自动带 aria-expanded 和 aria-controls；浮层里的元素是复制品：事件请用事件委托或监听 zh:popover-open，不要给原元素绑定。

### 气泡卡片需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 进度条

线性进度条，支持标签位置、状态、分步、缓冲、目标线和不确定进度。只写一个带 data-* 的空元素，内容由库生成。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div class="zh-progress" id="pg" data-value="36" data-name="导入数据"></div>
<div class="zh-progress" data-label="top" data-title="存储空间" data-value="62" data-name="存储空间"></div>
<div class="zh-progress" data-status="exception" data-value="42" data-name="上传失败"></div>
<div class="zh-progress" data-steps="10" data-value="60" data-name="完成步骤"></div>
<div class="zh-progress" data-indeterminate="true" data-label="none" data-name="加载中"></div>

<script>
ZhaoUI.progress.set('#pg', 80);
</script>
```

### 样式类

`zh-progress`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-value` | .zh-progress | 0 到 100 | 当前进度 |
| `data-label` | .zh-progress | outside（默认）\| inside \| top \| none | 百分比文字的位置；top 时用 data-title 作标题 |
| `data-name` | .zh-progress | 字符串 | 无障碍名称（aria-label），务必填写 |
| `data-status` | .zh-progress | normal \| success \| warning \| exception | 状态色；进度到 100 且未指定状态时自动变为 success，data-auto="off" 可关闭 |
| `data-steps` | .zh-progress | 整数 | 分步显示，如 10 表示十格 |
| `data-buffer` | .zh-progress | 0 到 100 | 缓冲进度（比如视频缓冲），画在主进度之下 |
| `data-target / data-target-label` | .zh-progress | 0 到 1 / 字符串 | 目标线位置（0.8 表示 80%）与它的文字 |
| `data-indeterminate` | .zh-progress | true | 不确定进度：显示循环动画，无数值 |
| `data-size` | .zh-progress | sm \| lg | 尺寸 |
| `is-active / is-striped` | .zh-progress | class | 进行中的流光 / 条纹效果 |

### 方法

- `ZhaoUI.progress.set(el, value)`：更新进度（0 到 100），同步更新文字、状态色和 aria-valuenow。el 可以是元素或选择器

### 无障碍

- 元素自动带 role="progressbar" 与 aria-valuenow / aria-valuetext（如「64%，已完成」）
- 不确定进度带 aria-busy="true"，读作「加载中」
- 状态不只靠颜色：成功和失败会在文字位置显示图标
- 开启「减少动态效果」时，流光和循环动画会停止

## 常见问题

### 进度条是什么？

线性进度条，支持标签位置、状态、分步、缓冲、目标线和不确定进度。只写一个带 data-* 的空元素，内容由库生成。

### 怎么使用进度条？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写；需要用代码控制时，用「方法」里列出的接口。

### 进度条有哪些方法？

ZhaoUI.progress.set(el, value)：更新进度（0 到 100），同步更新文字、状态色和 aria-valuenow。el 可以是元素或选择器。

### 进度条支持键盘和读屏吗？

元素自动带 role="progressbar" 与 aria-valuenow / aria-valuetext（如「64%，已完成」）；不确定进度带 aria-busy="true"，读作「加载中」；状态不只靠颜色：成功和失败会在文字位置显示图标。

### 进度条需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 评分

星形或心形评分，支持半星、只读、清除、文字标签。交互版本是一组 radio，键盘与读屏都可用。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div class="zh-rating" id="rt" data-value="3" data-label="服务评分" data-labels="很差,较差,一般,满意,很好"></div>
<div class="zh-rating" data-value="3.5" data-half data-show-value data-label="口味评分"></div>
<div class="zh-rating" data-readonly data-value="4.27" data-show-value data-label="综合评分"></div>

<script>
document.getElementById('rt').addEventListener('zh:rating', function (e) {
  console.log(e.detail.value);
});
</script>
```

### 样式类

`zh-rating`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-value` | .zh-rating | 数字 | 当前评分；只读时可以是小数（如 4.27），会按比例填充 |
| `data-count` | .zh-rating | 整数，默认 5 | 总数 |
| `data-half` | .zh-rating | 布尔属性 | 允许半星 |
| `data-readonly / data-disabled` | .zh-rating | 布尔属性 | 只读展示 / 禁用 |
| `data-clear` | .zh-rating | 布尔属性 | 再次点击同一个分数、或按 Delete / Backspace 清除评分 |
| `data-icon` | .zh-rating | star（默认）\| heart | 图标 |
| `data-labels` | .zh-rating | 逗号分隔的文字，如 很差,较差,一般,满意,很好 | 每一档的文字，选中时显示在旁边 |
| `data-show-value` | .zh-rating | 布尔属性 | 在旁边显示数字 |
| `data-label` | .zh-rating | 字符串 | 无障碍名称，默认「评分」 |

### 方法

- `el.zhRating.get()`：读取当前评分

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:rating` | .zh-rating | { value } | 评分变化时触发（冒泡） |

### 无障碍

- 交互评分是 radiogroup，每个分值一个 radio，方向键切换，带「3 星 · 一般」形式的 aria-label
- 只读评分是 role="img"，读作「综合评分 4.3 分，满分 5 分」
- 悬停时预览分数，移开后还原

## 常见问题

### 评分是什么？

星形或心形评分，支持半星、只读、清除、文字标签。交互版本是一组 radio，键盘与读屏都可用。

### 怎么使用评分？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写；需要用代码控制时，用「方法」里列出的接口。

### 评分有哪些事件？

zh:rating（评分变化时触发（冒泡））。

### 评分有哪些方法？

el.zhRating.get()：读取当前评分。

### 评分支持键盘和读屏吗？

交互评分是 radiogroup，每个分值一个 radio，方向键切换，带「3 星 · 一般」形式的 aria-label；只读评分是 role="img"，读作「综合评分 4.3 分，满分 5 分」；悬停时预览分数，移开后还原。

### 评分需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 结果页

纯样式组件：不需要 JS。操作完成、失败或页面不存在时的反馈块：图标（或大号错误码）、标题、说明、补充信息、操作按钮，居中排列。用 data-tone 选语气。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div class="zh-card" style="padding:0">
  <div class="zh-result" data-tone="success" aria-live="polite">
    <div class="zh-result-icon"><i data-i="circle-check"></i></div>
    <h4 class="zh-result-title">提交成功</h4>
    <p class="zh-result-desc">审批单已提交，预计 1 个工作日内处理。</p>
    <div class="zh-result-actions">
      <button class="zh-btn primary">查看详情</button>
      <button class="zh-btn">返回列表</button>
    </div>
  </div>
</div>
```

### 样式类

`zh-result`、`zh-result-icon`、`zh-result-code`、`zh-result-title`、`zh-result-desc`、`zh-result-extra`、`zh-result-actions`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `zh-result` | 容器（class） |  | 居中的结果块，通常放在 .zh-card 里 |
| `data-tone` | .zh-result | success \| error \| info \| warning（默认中性灰） | 决定图标圆底和图标的颜色 |
| `zh-result-icon` | 图标容器 | 里面放 <i data-i="..."> | 圆形底色图标 |
| `zh-result-code` | 大号文字 | 如 404 | 错误页用，装饰性，加 aria-hidden="true" |
| `zh-result-title / zh-result-desc` | <h4> / <p> |  | 标题和说明，说明最宽约 46 个字符 |
| `zh-result-extra` | 补充块 | 里面放 <ul> | 失败原因、后续步骤等，左对齐的灰底块 |
| `zh-result-actions` | 按钮容器 | 里面放 zh-btn | 居中排列；手机宽度按钮各占一行 |
| `is-in` | .zh-result |  | 可选：加上后播放入场动画（图标弹出，其余依次升起） |

### 无障碍

- 结果出现在已有页面里（不是整页跳转）时，给 .zh-result 加 aria-live="polite"
- 只靠颜色不够：标题要写明成功还是失败
- 大号错误码是装饰，加 aria-hidden="true"，意思放在标题里

## 常见问题

### 结果页是什么？

纯样式组件：不需要 JS。操作完成、失败或页面不存在时的反馈块：图标（或大号错误码）、标题、说明、补充信息、操作按钮，居中排列。用 data-tone 选语气。

### 怎么使用结果页？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 结果页支持键盘和读屏吗？

结果出现在已有页面里（不是整页跳转）时，给 .zh-result 加 aria-live="polite"；只靠颜色不够：标题要写明成功还是失败；大号错误码是装饰，加 aria-hidden="true"，意思放在标题里。

### 结果页需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 环形进度

圆环、仪表盘（270°）、半圆三种形状的进度，中心显示百分比或自定义内容。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div class="zh-ring" id="ring" data-value="65" data-name="完成率"></div>
<div class="zh-ring" data-size="lg" data-value="88" data-name="目标" data-caption="完成率"></div>
<div class="zh-ring" data-shape="gauge" data-value="72" data-name="仪表"></div>
<div class="zh-ring" data-value="42" data-status="exception" data-name="失败"></div>

<script>
ZhaoUI.ring.set('#ring', 90);
</script>
```

### 样式类

`zh-ring`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-value` | .zh-ring | 0 到 100 | 当前进度；必须写，库据此初始化 |
| `data-shape` | .zh-ring | full（默认）\| gauge \| semi | 圆环 / 仪表盘 / 半圆 |
| `data-size` | .zh-ring | sm \| lg | 尺寸，默认中号 |
| `data-caption` | .zh-ring | 字符串 | 百分比下方的小字 |
| `data-status` | .zh-ring | normal \| success \| warning \| exception | 状态色；到 100 自动变为 success，中心换成对勾 |
| `data-name` | .zh-ring | 字符串 | 无障碍名称 |

### 方法

- `ZhaoUI.ring.set(el, value, centerHtml?)`：更新进度；centerHtml 可选，传入则替换中心内容。centerHtml 按 HTML 处理，不要放用户输入

### 无障碍

- 自动带 role="progressbar" 与 aria-valuenow
- 到 100 时中心显示对勾，失败时显示叉，不只靠颜色区分

## 常见问题

### 环形进度是什么？

圆环、仪表盘（270°）、半圆三种形状的进度，中心显示百分比或自定义内容。

### 怎么使用环形进度？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写；需要用代码控制时，用「方法」里列出的接口。

### 环形进度有哪些方法？

ZhaoUI.ring.set(el, value, centerHtml?)：更新进度；centerHtml 可选，传入则替换中心内容。centerHtml 按 HTML 处理，不要放用户输入。

### 环形进度支持键盘和读屏吗？

自动带 role="progressbar" 与 aria-valuenow；到 100 时中心显示对勾，失败时显示叉，不只靠颜色区分。

### 环形进度需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 下拉选择

增强原生 <select>：单选、多选、搜索、分组、清除、选项描述，选中值同步回原生 select 并触发原生 change，表单提交、name、required 照常工作。也可用 ZhaoUI.select 命令式创建，支持远程搜索和自动完成。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。只用核心包时，还要加 `modular/select.min.js` 和 `modular/select.min.css`；全量版已包含。

### 用法

```html
<label for="region">区域</label>
<select id="region" name="region" data-zh-select data-clearable required>
  <option value="">请选择区域</option>
  <option value="east">华东</option>
  <option value="south">华南</option>
  <option value="north">华北</option>
</select>

<label for="city">城市</label>
<select id="city" name="city" data-zh-select data-searchable data-empty-text="没有这个城市">
  <option value="">请选择城市</option>
  <optgroup label="直辖市">
    <option value="bj" data-keys="beijing bj" data-desc="首都">北京</option>
    <option value="sh" data-keys="shanghai sh">上海</option>
  </optgroup>
  <optgroup label="广东省">
    <option value="gz" data-keys="guangzhou gz">广州</option>
    <option value="sz" data-keys="shenzhen sz" disabled>深圳</option>
  </optgroup>
</select>

<label for="tags">标签</label>
<select id="tags" name="tags" multiple data-zh-select data-searchable data-clearable data-max-tags="2">
  <option value="fe" selected>前端</option>
  <option value="be" selected>后端</option>
  <option value="ux">设计</option>
</select>

<div id="remote"></div>

<script>
document.getElementById('region').addEventListener('change', function (e) {
  console.log(e.target.value);
});

// 远程搜索
ZhaoUI.select('#remote', {
  searchable: true, clearable: true, placeholder: '搜索技术',
  source: function (q) {
    return fetch('/api/tech?q=' + encodeURIComponent(q)).then(function (r) { return r.json(); });   // 返回 [{ value, label }, …]
  }
});
</script>
```

### 样式类

`zh-sel`、`zh-sel-native`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-zh-select` | <select> | 无 | 声明要增强这个 select；选项、optgroup、disabled、multiple、selected 都从它读取 |
| `multiple` | <select> | 布尔属性 | 多选：选中项显示为标签，列表保持打开 |
| `data-searchable` | <select> | 布尔属性 | 可输入搜索；按选项文字、data-desc、data-keys 匹配并高亮 |
| `data-clearable` | <select> | 布尔属性 | 有值时显示清除按钮 |
| `data-size` | <select> | sm \| md（默认）\| lg | 尺寸 |
| `data-placeholder` | <select> | 字符串 | 占位文字；不写则取值为空的那个 <option> 的文字，再没有则是「请选择」 |
| `data-empty-text` | <select> | 字符串 | 搜索无结果时的提示，默认「无匹配项」 |
| `data-max-tags` | <select multiple> | 整数 | 最多显示几个标签，其余折叠为「+N」 |
| `data-prefix-icon` | <select> | 图标名 | 输入框前的图标 |
| `data-desc / data-icon / data-keys` | <option> | 字符串 | 选项的第二行说明 / 图标 / 额外的搜索关键词（如拼音） |
| `value=""` | <option> | 空值 | 放一个空值的 option 作为占位；它不会出现在选项列表里，清除后 select 会回到它 |
| `aria-invalid="true"` | <select> | true | 错误状态外观 |

### 方法

- `selectEl.zhSelect.get() / .set(value)`：读取或设置值（多选传数组）。set 会同步原生 select，但不触发 change
- `selectEl.zhSelect.setOptions([{ value, label, desc?, icon?, disabled? }, …])`：更换选项（支持分组：{ label, options: [...] }）。原生 <select> 里的 <option> 会一起重建，已选且仍存在的值会保留，不再存在的会被移除
- `selectEl.zhSelect.setDisabled(bool) / .setInvalid(bool) / .open() / .close()`：禁用、错误状态、打开、关闭
- `ZhaoUI.select(host, config)`：命令式创建。host 是一个空 <div> 或选择器；config：options、value、multiple、searchable、clearable、size、placeholder、emptyText、maxTags、prefixIcon、disabled、invalid、labelledby、onChange(value, labels)。
远程搜索：source(query) 返回 Promise<选项数组>，可配 debounce（毫秒，默认 250）和 loading。
自动完成：freeText: true，输入的文字本身就是值，chevron: false 可隐藏箭头。返回同一套方法（get / set / setOptions / setDisabled / setInvalid / open / close）

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `change / input` | 原生 <select> | 原生事件 | 选中值变化时在原生 select 上触发（冒泡），已有的表单代码不用改 |
| `zh:select-change` | 生成的控件（select 后面的 .zh-sel） | { value, labels } | 单选时 value 是字符串，多选时是数组；labels 是对应的文字数组 |

### 无障碍

- 输入框是 role="combobox"，带 aria-expanded / aria-controls / aria-activedescendant；列表是 role="listbox"，选项是 role="option"，多选时有 aria-multiselectable
- <label for> 指向原生 select 时，点击 label 或表单校验聚焦，都会转到可见的输入框
- ↓ ↑ 打开并移动（到头会循环），Home / End 到首尾，Enter 选中，Esc 关闭，Tab 关闭并继续；不可搜索时直接输入字母可跳到对应选项，空格打开
- 多选时在空输入上按退格删除最后一个标签；标签上有带 aria-label 的移除按钮
- 禁用的选项标记 aria-disabled，不可选中，方向键会跳过
- 原生 select 保留在表单里（视觉隐藏、aria-hidden、不可 Tab），所以 required 的浏览器校验仍然有效

## 常见问题

### 下拉选择是什么？

增强原生 <select>：单选、多选、搜索、分组、清除、选项描述，选中值同步回原生 select 并触发原生 change，表单提交、name、required 照常工作。也可用 ZhaoUI.select 命令式创建，支持远程搜索和自动完成。

### 怎么使用下拉选择？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写；需要用代码控制时，用「方法」里列出的接口。

### 下拉选择有哪些事件？

change / input（选中值变化时在原生 select 上触发（冒泡），已有的表单代码不用改）；zh:select-change（单选时 value 是字符串，多选时是数组；labels 是对应的文字数组）。

### 下拉选择有哪些方法？

selectEl.zhSelect.get() / .set(value)：读取或设置值（多选传数组）。set 会同步原生 select，但不触发 change；selectEl.zhSelect.setOptions([{ value, label, desc?, icon?, disabled? }, …])：更换选项（支持分组：{ label, options: [...] }）。原生 <select> 里的 <option> 会一起重建，已选且仍存在的值会保留，不再存在的会被移除；selectEl.zhSelect.setDisabled(bool) / .setInvalid(bool) / .open() / .close()：禁用、错误状态、打开、关闭；ZhaoUI.select(host, config)：命令式创建。host 是一个空 <div> 或选择器；config：options、value、multiple、searchable、clearable、size、placeholder、emptyText、maxTags、prefixIcon、disabled、invalid、labelledby、onChange(value, labels)。
远程搜索：source(query) 返回 Promise<选项数组>，可配 debounce（毫秒，默认 250）和 loading。
自动完成：freeText: true，输入的文字本身就是值，chevron: false 可隐藏箭头。返回同一套方法（get / set / setOptions / setDisabled / setInvalid / open / close）。

### 下拉选择支持键盘和读屏吗？

输入框是 role="combobox"，带 aria-expanded / aria-controls / aria-activedescendant；列表是 role="listbox"，选项是 role="option"，多选时有 aria-multiselectable；<label for> 指向原生 select 时，点击 label 或表单校验聚焦，都会转到可见的输入框；↓ ↑ 打开并移动（到头会循环），Home / End 到首尾，Enter 选中，Esc 关闭，Tab 关闭并继续；不可搜索时直接输入字母可跳到对应选项，空格打开。

### 下拉选择需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 侧边菜单

后台常见的左侧导航：多级分组、当前页标记、可折叠成 64px 图标栏，支持键盘（方向键、Home/End、字母）。用嵌套的 <ul> 写，库会补齐 ARIA 树结构。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<nav class="zh-side" data-zh-side aria-label="站点导航" style="height:420px">
  <div class="zh-side-head"><i aria-hidden="true"></i><span>ZhaoUI</span></div>
  <ul>
    <li class="zh-side-group">工作台</li>
    <li><a href="#" data-icon="layout-dashboard">概览</a></li>
    <li><a href="#" data-icon="file-text">内容管理</a>
      <ul>
        <li><a href="#" aria-current="page" data-badge="12" data-badge-tone="soft">文章</a></li>
        <li><a href="#">媒体库</a></li>
      </ul>
    </li>
    <li><a href="#" data-icon="settings">系统设置</a></li>
  </ul>
</nav>
```

### 样式类

`zh-side`、`zh-side-head`、`zh-side-scroll`、`zh-side-group`、`zh-side-foot`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-zh-side` | <nav class="zh-side"> |  | 声明为侧边菜单；里面放一个嵌套 <ul> |
| `data-icon` | 每个 <a> | 图标名 | 可选，菜单项前的图标 |
| `data-num` | 每个 <a> | 序号文字，如 1 | 可选，在名称前显示序号（文档导航常用）；读屏读名称时忽略序号，折叠成图标栏时隐藏 |
| `data-badge` | <a> | 文字 \| dot | 可选，右侧角标；dot 是小红点 |
| `data-badge-tone` | <a> | soft | 角标用淡色底而不是红底 |
| `aria-current="page"` | 当前页的 <a> | page | 当前页；它所在的分组会默认展开 |
| `aria-disabled="true"` | <a> | true | 禁用的菜单项，不可点、不可跳转 |
| `data-open` | 含子菜单的 <li> |  | 该分组默认展开 |
| `data-collapsed` | <nav> |  | 初始为折叠的图标栏 |
| `data-collapsible` | <nav> | false | 不显示折叠按钮 |
| `zh-side-group` | <li>（class） | 分组标题文字 | 菜单里的分组小标题，不可点 |

### 方法

- `ZhaoUI.side.setActive(nav, hrefOrElement)`：按链接地址或元素设置当前页，并展开它的祖先；找不到返回 false
- `ZhaoUI.side.collapse(nav, collapsed?)`：折叠（默认）或展开图标栏

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:side-select` | nav.zh-side | { item, href, label, path } | 点击叶子项时触发，可 preventDefault 取消；path 是从顶层到该项的名称数组。href 为 # 或为空时库不会跳转，只切换当前页 |
| `zh:side-collapse` | nav.zh-side | { collapsed } | 折叠或展开图标栏 |

### 无障碍

- 外层是 <nav aria-label="…">，库给列表加 role=tree，项加 role=treeitem 和 aria-level
- 键盘：上下键移动，右键展开或进入子级，左键收起或回到父级，Home/End 到首尾，空格激活
- 折叠成图标栏后，每项通过 title 显示名称；点击有子菜单的项会先展开侧栏

## 常见问题

### 侧边菜单是什么？

后台常见的左侧导航：多级分组、当前页标记、可折叠成 64px 图标栏，支持键盘（方向键、Home/End、字母）。用嵌套的 <ul> 写，库会补齐 ARIA 树结构。

### 怎么使用侧边菜单？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写；需要用代码控制时，用「方法」里列出的接口。

### 侧边菜单有哪些事件？

zh:side-select（点击叶子项时触发，可 preventDefault 取消；path 是从顶层到该项的名称数组。href 为 # 或为空时库不会跳转，只切换当前页）；zh:side-collapse（折叠或展开图标栏）。

### 侧边菜单有哪些方法？

ZhaoUI.side.setActive(nav, hrefOrElement)：按链接地址或元素设置当前页，并展开它的祖先；找不到返回 false；ZhaoUI.side.collapse(nav, collapsed?)：折叠（默认）或展开图标栏。

### 侧边菜单支持键盘和读屏吗？

外层是 <nav aria-label="…">，库给列表加 role=tree，项加 role=treeitem 和 aria-level；键盘：上下键移动，右键展开或进入子级，左键收起或回到父级，Home/End 到首尾，空格激活；折叠成图标栏后，每项通过 title 显示名称；点击有子菜单的项会先展开侧栏。

### 侧边菜单需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 滑块

单值或范围滑块，支持刻度、步进、竖直、颜色分档，键盘与指针都可操作。只写一个带 data-* 的空元素。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div class="zh-slider" id="vol" data-value="40" data-label="音量" data-fmt="{v}%"></div>
<div class="zh-slider" data-value="50" data-step="25" data-label="清晰度" data-marks="0:流畅,25:标清,50:高清,75:超清,100:蓝光"></div>
<div class="zh-slider" data-value="800,3200" data-min="0" data-max="5000" data-step="50" data-gap="200" data-label="价格" data-fmt="¥{v}"></div>
<div class="zh-slider" data-value="78" data-label="存储用量" data-fmt="{v}%" data-colors="0:primary,70:warning,90:danger" data-status="0:正常,70:偏高,90:危险"></div>

<script>
document.getElementById('vol').addEventListener('zh:slider', function (e) {
  if (e.detail.type === 'change') console.log(e.detail.values[0]);
});
</script>
```

### 样式类

`zh-slider`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-value` | .zh-slider | 数字，或「下限,上限」 | 写两个值即为范围滑块，如 800,3200 |
| `data-min / data-max / data-step` | .zh-slider | 数字，默认 0 / 100 / 1 | 范围与步长，值会吸附到步长上 |
| `data-label` | .zh-slider | 字符串 | 无障碍名称；范围滑块会自动加「最小值 / 最大值」 |
| `data-fmt` | .zh-slider | 含 {v} 的模板，如 {v}% | 显示与朗读时的数值格式 |
| `data-marks` | .zh-slider | 值:文字 逗号分隔，如 0:低,50:中,100:高 | 刻度；点击刻度可直接跳到该值 |
| `data-colors / data-status` | .zh-slider | 值:颜色 或 值:文字 逗号分隔 | 按数值分档变色（primary、warning、danger 等）或附加状态文字 |
| `data-gap` | .zh-slider | 数字 | 范围滑块两个滑块之间的最小间隔 |
| `data-vertical / data-disabled` | .zh-slider | 布尔属性 | 竖直 / 禁用；竖直滑块用 --zh-slider-len 设定长度 |
| `data-out` | .zh-slider | <output> 的选择器 | 把当前值写到这个元素里 |
| `data-link` | .zh-slider | 数字输入框的选择器，逗号分隔 | 与输入框双向同步 |

### 方法

- `el.zhSlider.get() / el.zhSlider.set([values])`：读取或设置当前值（数组）

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:slider` | .zh-slider | { type: 'input' \| 'change', values } | 拖动中触发 input，松手或按键后触发 change（冒泡） |

### 无障碍

- 每个滑块都是 role="slider"，带 aria-valuemin / aria-valuemax / aria-valuenow / aria-valuetext
- ← → ↑ ↓ 加减一个步长，PageUp / PageDown 加减约十分之一范围，Home / End 到两端
- RTL 页面中水平滑块的方向会自动反过来
- 颜色分档同时给出状态文字，不只靠颜色

## 常见问题

### 滑块是什么？

单值或范围滑块，支持刻度、步进、竖直、颜色分档，键盘与指针都可操作。只写一个带 data-* 的空元素。

### 怎么使用滑块？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写；需要用代码控制时，用「方法」里列出的接口。

### 滑块有哪些事件？

zh:slider（拖动中触发 input，松手或按键后触发 change（冒泡））。

### 滑块有哪些方法？

el.zhSlider.get() / el.zhSlider.set([values])：读取或设置当前值（数组）。

### 滑块支持键盘和读屏吗？

每个滑块都是 role="slider"，带 aria-valuemin / aria-valuemax / aria-valuenow / aria-valuetext；← → ↑ ↓ 加减一个步长，PageUp / PageDown 加减约十分之一范围，Home / End 到两端；RTL 页面中水平滑块的方向会自动反过来。

### 滑块需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 加载中

纯样式组件：不需要 JS，写好标记即可。一个转动的圆圈，表示正在加载。三个大小：sm、默认、lg。系统开启“减少动态效果”时圈会静止，所以旁边请同时写“加载中”之类的文字。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div class="zh-row" role="status"><span class="zh-spinner" aria-hidden="true"></span><span>加载中…</span></div>
<span class="zh-spinner sm" aria-hidden="true"></span> <span class="zh-spinner lg" aria-hidden="true"></span>
```

### 样式类

`zh-spinner`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `zh-spinner` | <span>（class） |  | 转动的圆圈；可加 sm 或 lg |
| `role="status"` | 外层容器 |  | 读屏会读出里面的文字 |

### 无障碍

- 圆圈本身加 aria-hidden="true"，用旁边的文字或外层 role="status" 告诉读屏用户
- 按钮上的加载态用 is-loading，不需要这个组件

## 常见问题

### 加载中是什么？

一个转动的圆圈，表示正在加载。三个大小：sm、默认、lg。系统开启“减少动态效果”时圈会静止，所以旁边请同时写“加载中”之类的文字。

### 怎么使用加载中？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 加载中支持键盘和读屏吗？

圆圈本身加 aria-hidden="true"，用旁边的文字或外层 role="status" 告诉读屏用户；按钮上的加载态用 is-loading，不需要这个组件。

### 加载中需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 步骤条

表示多步流程走到了哪一步：数字或图标标记、连接线、当前步骤、出错步骤。你只写每步的标题，库生成标记并按当前步骤算出完成、进行中、未开始。容器放不下时自动改成纵向。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div class="zh-stack">
  <ol data-zh-steps data-current="1" aria-label="开通流程">
    <li data-title="填写信息" data-desc="企业与联系人"></li>
    <li data-title="资质审核" data-desc="约 1 个工作日"></li>
    <li data-title="开通完成"></li>
  </ol>
  <ol data-zh-steps data-mode="icon" data-current="2" data-error="1" data-error-text="文件过大" aria-label="上传流程">
    <li data-title="选择文件" data-icon="file-text"></li>
    <li data-title="上传" data-icon="settings"></li>
    <li data-title="完成" data-icon="check"></li>
  </ol>
</div>
```

### 样式类

`zh-steps`、`zh-steps--h`、`zh-steps--v`、`zh-steps--sm`、`zh-steps--lg`、`zh-steps--dot`、`zh-step`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-zh-steps` | <ol> | 里面放 <li data-title="…"> | 声明为步骤条；<li> 里的内容会被替换 |
| `data-title / data-desc` | <li> | 文字 | 步骤标题与说明（图标模式不显示说明） |
| `data-icon` | <li> | 图标名 | 图标模式下该步的图标；完成变成对勾，出错变成叉 |
| `data-current` | <ol> | 从 0 开始的序号，默认 0 | 当前步骤；之前的算已完成，之后的未开始 |
| `data-error` | <ol> | 出错步骤的序号 | 该步显示为错误；可配 data-error-text 写出错说明 |
| `data-done` | <ol> |  | 全部完成 |
| `data-mode` | <ol> | icon | 用图标代替数字 |
| `data-clickable` | <ol> |  | 每一步变成按钮，点击触发 zh:step-click；data-reach 指定最远可点到哪一步，默认只到当前步 |
| `zh-steps--v / --sm / --lg / --dot` | <ol>（class） |  | 纵向 / 小尺寸 / 大尺寸 / 极简圆点；默认是横向 |

### 方法

- `ZhaoUI.steps.set(el, { current, error, done })`：更新状态并重绘；设置 current 会清除错误态
- `ZhaoUI.steps.get(el)`：返回 { current, error, done }

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:step-click` | <ol> | undefined | 可点击模式下点了某一步。是否真的跳转由你决定（比如先校验表单），然后调用 ZhaoUI.steps.set |

### 无障碍

- 当前步骤带 aria-current="step"
- 状态不只靠颜色：完成是对勾，出错是叉，并且可以写出错文字
- 外面的 <ol> 请加 aria-label 说明是什么流程

## 常见问题

### 步骤条是什么？

表示多步流程走到了哪一步：数字或图标标记、连接线、当前步骤、出错步骤。你只写每步的标题，库生成标记并按当前步骤算出完成、进行中、未开始。容器放不下时自动改成纵向。

### 怎么使用步骤条？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写；需要用代码控制时，用「方法」里列出的接口。

### 步骤条有哪些事件？

zh:step-click（可点击模式下点了某一步。是否真的跳转由你决定（比如先校验表单），然后调用 ZhaoUI.steps.set）。

### 步骤条有哪些方法？

ZhaoUI.steps.set(el, { current, error, done })：更新状态并重绘；设置 current 会清除错误态；ZhaoUI.steps.get(el)：返回 { current, error, done }。

### 步骤条支持键盘和读屏吗？

当前步骤带 aria-current="step"；状态不只靠颜色：完成是对勾，出错是叉，并且可以写出错文字；外面的 <ol> 请加 aria-label 说明是什么流程。

### 步骤条需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 表格

带圆角边框的数据表：表头底色、行悬停高亮、数字列右对齐。窄屏（≤ 767px）默认变成卡片列表，也可以改成横向滚动。样式部分不需要 JS；加 data-zh-table 后可以点表头排序、用复选框选择行。分页用 data-zh-pager。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div class="zh-table-wrap">
  <table class="zh-table">
    <thead><tr><th scope="col">标题</th><th scope="col">状态</th><th scope="col" class="num">阅读</th><th scope="col">操作</th></tr></thead>
    <tbody>
      <tr><td data-label="标题">产品发布会回顾</td><td data-label="状态"><span class="zh-tag success">已发布</span></td><td data-label="阅读" class="num">12,480</td><td data-label="操作"><button class="zh-btn sm text">编辑</button></td></tr>
      <tr><td data-label="标题">季度运营复盘</td><td data-label="状态"><span class="zh-tag warning">待审核</span></td><td data-label="阅读" class="num">980</td><td data-label="操作"><button class="zh-btn sm text">编辑</button></td></tr>
    </tbody>
  </table>
</div>

<!-- 列很多、窄屏也想保持表格：加 zh-table-wrap--scroll -->
<div class="zh-table-wrap zh-table-wrap--scroll" tabindex="0" role="region" aria-label="订单列表（可横向滚动）">
  <table class="zh-table">
    <thead><tr><th scope="col">订单号</th><th scope="col">客户</th><th scope="col">地区</th><th scope="col">渠道</th><th scope="col">状态</th><th scope="col" class="num">金额</th><th scope="col">下单时间</th></tr></thead>
    <tbody>
      <tr><td>20261004-0086</td><td>张三</td><td>上海</td><td>官网</td><td>已发货</td><td class="num">1,286.00</td><td>2026-10-04 15:20</td></tr>
      <tr><td>20261004-0087</td><td>李四</td><td>北京</td><td>小程序</td><td>待发货</td><td class="num">329.00</td><td>2026-10-04 15:42</td></tr>
    </tbody>
  </table>
</div>

<div class="zh-table-wrap">
<table class="zh-table" data-zh-table id="tbl-sel">
  <thead><tr><th class="zh-col-check"><input type="checkbox" data-zh-all aria-label="全选"></th><th data-sort="text">标题</th><th data-sort="number" class="num">阅读量</th><th data-sort="text">更新时间</th></tr></thead>
  <tbody>
    <tr><td class="zh-col-check"><input type="checkbox" data-zh-row aria-label="选择产品发布会回顾"></td><td>产品发布会回顾</td><td class="num">12,480</td><td data-sort-value="2026-10-04T15:20">2 小时前</td></tr>
    <tr><td class="zh-col-check"><input type="checkbox" data-zh-row aria-label="选择季度运营复盘"></td><td>季度运营复盘</td><td class="num">980</td><td data-sort-value="2026-10-04T11:02">6 小时前</td></tr>
    <tr><td class="zh-col-check"><input type="checkbox" data-zh-row aria-label="选择新版设计规范说明"></td><td>新版设计规范说明</td><td class="num">8,326</td><td data-sort-value="2026-10-03T18:45">昨天</td></tr>
  </tbody>
</table>
</div>
```

### 样式类

`zh-table-wrap`、`zh-table`、`zh-table-wrap--scroll`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `zh-table-wrap` | 外层 <div>（class） | 里面放 <table class="zh-table"> | 圆角边框与裁切；必须有，圆角靠它 |
| `zh-table` | <table>（class） | 正常的 thead / tbody / tr / th / td | 表格样式 |
| `num` | <th> / <td>（class） | 数字、金额 | 右对齐 |
| `data-label` | 每个 <td> | 该列的名称，如 data-label="状态" | 窄屏变卡片列表时显示在值的左侧；不写则左侧为空 |
| `zh-table-wrap--scroll` | 外层 wrap 上（class） | 加在 zh-table-wrap 上 | 窄屏不变卡片，保持表格并允许横向滚动，适合列很多的后台表格 |
| `data-zh-table` | <table> |  | 开启排序和行选择的行为 |
| `data-sort` | 表头 <th> | text \| number | 该列可排序：表头变成按钮，点击在升序、降序、恢复原顺序之间切换。number 会忽略逗号、百分号和货币符号；空值始终排在最后 |
| `data-sort-value` | 单元格 <td> | 用于排序的值 | 单元格显示的文字不适合排序时（如“2 小时前”）用它指定排序值，如 ISO 时间 |
| `data-sort-mode` | <table> | server | 只触发事件、不在页面里重排，用于服务端排序；你在事件里请求新数据 |
| `data-zh-all` | 表头里的 <input type="checkbox"> |  | 全选框；部分行选中时显示半选状态 |
| `data-zh-row` | 每行里的 <input type="checkbox"> |  | 行选择框；选中的行会加上 is-selected 高亮；加 disabled 的行不参与全选 |
| `zh-col-check` | 选择框所在的 <th>/<td> |  | 把该列收窄到刚好放下复选框 |

### 方法

- `ZhaoUI.table.selected(table)`：返回当前选中的 <tr> 数组
- `ZhaoUI.table.clear(table)`：取消全部选择

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:table-sort` | <table> | { index, key, direction } | 排序变化。direction 为 ascending、descending 或 none；key 取 th 的 data-key，没有就用表头文字 |
| `zh:table-select` | <table> | { rows, count, all } | 选择变化。rows 是选中的 <tr> 数组 |

### 无障碍

- 请保留 <thead> 与 <th scope="col">，读屏靠它们读出列名
- 窄屏卡片模式下表头被移出屏幕但仍可被读屏读到；每个 td 的 data-label 同时给视觉用户字段名
- 行内操作按钮（编辑、删除）要有文字或 aria-label
- 行悬停高亮只是辅助，不要把信息只放在悬停上
- 排序与选择需要自己实现：排序列的 <th> 请加 aria-sort，选择框请有 aria-label
- 可排序的表头里是真正的 <button>，键盘可聚焦、回车切换；当前排序列带 aria-sort
- 每个行选择框都要有 aria-label，如“选择《产品发布会回顾》”；全选框写“全选”
- 排序后读屏不会自动朗读结果；需要时在事件里用 ZhaoUI.message 或 aria-live 区域告知
- 横向滚动的容器（zh-table-wrap--scroll）必须加 tabindex="0"、role="region" 和 aria-label，键盘用户才能用方向键左右滚动

## 常见问题

### 表格是什么？

带圆角边框的数据表：表头底色、行悬停高亮、数字列右对齐。窄屏（≤ 767px）默认变成卡片列表，也可以改成横向滚动。样式部分不需要 JS；加 data-zh-table 后可以点表头排序、用复选框选择行。分页用 data-zh-pager。

### 怎么使用表格？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写；需要用代码控制时，用「方法」里列出的接口。

### 表格有哪些事件？

zh:table-sort（排序变化。direction 为 ascending、descending 或 none；key 取 th 的 data-key，没有就用表头文字）；zh:table-select（选择变化。rows 是选中的 <tr> 数组）。

### 表格有哪些方法？

ZhaoUI.table.selected(table)：返回当前选中的 <tr> 数组；ZhaoUI.table.clear(table)：取消全部选择。

### 表格支持键盘和读屏吗？

请保留 <thead> 与 <th scope="col">，读屏靠它们读出列名；窄屏卡片模式下表头被移出屏幕但仍可被读屏读到；每个 td 的 data-label 同时给视觉用户字段名；行内操作按钮（编辑、删除）要有文字或 aria-label。

### 表格需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 标签页

横向或纵向标签页。标签用 aria-controls 关联面板，面板的显示隐藏由库处理。也可以当「分段开关」用：几个标签指向同一个面板，在 zh:tab-change 里换内容。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div class="zh-tabs" role="tablist" aria-label="分区">
  <button role="tab" aria-selected="true" aria-controls="p1">概览</button>
  <button role="tab" aria-selected="false" aria-controls="p2">正文</button>
</div>
<div id="p1">概览内容</div>
<div id="p2">正文内容</div>

<!-- 分段开关：三个标签共用一个面板，由事件换内容 -->
<div class="zh-tabs" role="tablist" id="range" aria-label="统计周期">
  <button role="tab" aria-selected="true" aria-controls="kpi">今日</button>
  <button role="tab" aria-selected="false" aria-controls="kpi">近 7 天</button>
  <button role="tab" aria-selected="false" aria-controls="kpi">近 30 天</button>
</div>
<section id="kpi" aria-live="polite">…</section>
<script>
function render(i) { document.getElementById('kpi').textContent = ['今日数据', '近 7 天数据', '近 30 天数据'][i]; }
// 初始化时也会触发一次 zh:tab-change，所以第一次进来就会按当前选中的标签渲染
document.getElementById('range').addEventListener('zh:tab-change', function (e) { render(e.detail.index); });
</script>
```

### 样式类

`zh-tabs`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `role="tablist"` | .zh-tabs | 必填 | 标识这是标签列表，库据此初始化 |
| `aria-orientation` | .zh-tabs | vertical | 纵向标签页：方向键改为上下 |
| `aria-controls` | 每个 [role=tab] | 对应面板的 id | 对应面板的 id。多个标签可以指向同一个面板：只要当前选中的标签指向它，它就是显示的；不写则只切换选中状态，不管理面板 |
| `aria-selected` | 每个 [role=tab] | true \| false | 初始选中项；都没写则选中第一个 |

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:tab-change` | .zh-tabs | { index, tab } | 选中项变化时触发（冒泡），初始化时也会触发一次 |

### 无障碍

- 只有当前标签在 Tab 顺序里（roving tabindex），方向键在标签间移动并同时激活，Home / End 跳到首尾，到边界会循环
- 面板自动加上 role="tabpanel"，隐藏的面板用 hidden

## 常见问题

### 标签页是什么？

横向或纵向标签页。标签用 aria-controls 关联面板，面板的显示隐藏由库处理。也可以当「分段开关」用：几个标签指向同一个面板，在 zh:tab-change 里换内容。

### 怎么使用标签页？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 标签页有哪些事件？

zh:tab-change（选中项变化时触发（冒泡），初始化时也会触发一次）。

### 标签页支持键盘和读屏吗？

只有当前标签在 Tab 顺序里（roving tabindex），方向键在标签间移动并同时激活，Home / End 跳到首尾，到边界会循环；面板自动加上 role="tabpanel"，隐藏的面板用 hidden。

### 标签页需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 标签

标签：普通的彩色标签、可关闭的标签，以及可选中的标签（单选组、多选）。普通标签只要 class="zh-tag" 加颜色类，不需要 zh-tag--x；zh-tag--x 才表示可关闭或可选。新增标签的输入框不在库里，按你的业务自己做。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<span class="zh-tag success">已发布</span>
<span class="zh-tag warning">待审核</span>
<span class="zh-tag">草稿</span>

<div id="tag-demo">
  <span class="zh-tag zh-tag--x primary"><span>设计</span><button type="button" class="zh-tag-close" aria-label="移除 设计"><i data-i="x"></i></button></span>
  <span class="zh-tag zh-tag--x"><span>研发</span><button type="button" class="zh-tag-close" aria-label="移除 研发"><i data-i="x"></i></button></span>
</div>

<div class="zh-tag-group" id="period" role="radiogroup" aria-label="选择周期">
  <button class="zh-tag zh-tag--x zh-tag--check" role="radio" aria-checked="true" tabindex="0"><i data-i="check" data-s="12" class="zh-tag-tick"></i>今天</button>
  <button class="zh-tag zh-tag--x zh-tag--check" role="radio" aria-checked="false" tabindex="-1"><i data-i="check" data-s="12" class="zh-tag-tick"></i>近 7 天</button>
</div>

<script>
document.getElementById('period').addEventListener('zh:tag-change', function (e) {
  console.log(e.detail.value);
});
</script>
```

### 样式类

`zh-tag`、`zh-tag--x`、`zh-tag--check`、`zh-tag-close`、`zh-tag-group`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `zh-tag` | <span>（class） | 可加 primary \| success \| warning \| danger | 普通标签。不加颜色类就是中性灰（适合「草稿」「默认」这类状态）；加 zh-tag--x 才有关闭按钮或选中行为 |
| `zh-tag-close` | .zh-tag--x 内的按钮（class） | 无 | 点击后移除所在标签；按钮必须有 aria-label（如「移除 设计」） |
| `role="radio"` | .zh-tag--check | 放在 role="radiogroup" 里 | 单选：点击或方向键切换，roving tabindex |
| `role="checkbox"` | .zh-tag--check | aria-checked="true\|false" | 多选：点击切换 |
| `primary / success / warning / danger / info` | .zh-tag | class | 颜色 |
| `zh-tag--filled / zh-tag--outline / zh-tag--sm / zh-tag--lg` | .zh-tag | class | 填充或描边外观、小或大尺寸，可与颜色类组合 |

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:tag-remove` | 被点击的 .zh-tag | { label, tag } | 移除前触发（冒泡，可取消）；调用 preventDefault() 则保留标签 |
| `zh:tag-change` | 单选：radiogroup；多选：被点击的标签 | 单选 { value, values }；多选 { value, checked, values } | 选中状态变化时触发（冒泡） |

### 无障碍

- 单选组使用 radiogroup / radio 语义，方向键移动并选中；多选使用 checkbox 语义
- 移除后，如果相邻元素可以聚焦（比如「新增」按钮），焦点会移过去；普通标签本身不可聚焦，所以没有可移的目标时焦点回到页面
- 选中不只靠颜色：选中的标签左侧显示对勾

## 常见问题

### 标签是什么？

标签：普通的彩色标签、可关闭的标签，以及可选中的标签（单选组、多选）。普通标签只要 class="zh-tag" 加颜色类，不需要 zh-tag--x；zh-tag--x 才表示可关闭或可选。新增标签的输入框不在库里，按你的业务自己做。

### 怎么使用标签？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 标签有哪些事件？

zh:tag-remove（移除前触发（冒泡，可取消）；调用 preventDefault() 则保留标签）；zh:tag-change（选中状态变化时触发（冒泡））。

### 标签支持键盘和读屏吗？

单选组使用 radiogroup / radio 语义，方向键移动并选中；多选使用 checkbox 语义；移除后，如果相邻元素可以聚焦（比如「新增」按钮），焦点会移过去；普通标签本身不可聚焦，所以没有可移的目标时焦点回到页面；选中不只靠颜色：选中的标签左侧显示对勾。

### 标签需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 多行文本

随内容增高的文本域，带字数统计。硬上限用 maxlength，软上限 data-soft-max 允许继续输入但提示超出。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div class="zh-ta" data-max-rows="6">
  <textarea class="zh-textarea" rows="2" maxlength="80" placeholder="输入内容，最多 80 字" aria-label="简介"></textarea>
  <span class="zh-ta-count" aria-hidden="true">0 / 80</span>
</div>

<div class="zh-ta" data-soft-max="30" data-max-rows="6">
  <textarea class="zh-textarea" rows="2" placeholder="超过 30 字会标红，仍可继续输入" aria-label="备注">这段文字已经超过了三十个字的软上限，计数会变红并提示超出多少字。</textarea>
  <span class="zh-ta-count" aria-hidden="true"></span>
</div>
```

### 样式类

`zh-ta`、`zh-textarea`、`zh-ta-count`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-max-rows` | .zh-ta | 整数，默认 6 | 最多增高到几行，超过后出现滚动条 |
| `data-soft-max` | .zh-ta | 整数 | 软上限：超过后计数变红、textarea 设 aria-invalid，但仍可输入 |
| `maxlength` | textarea | 整数 | 硬上限：浏览器阻止继续输入，计数显示「当前 / 上限」 |
| `data-ta-msg` | .zh-ta 的兄弟元素 | 带 hidden 的提示容器，内含一个 <span> | 可选：超出软上限时显示「超出 N 字」 |

### 无障碍

- 计数文字是 aria-hidden；若在旁边放一个 .zh-inp-sr（视觉隐藏的 aria-live 区域），越过或回到软上限时会朗读「已超出字数上限」
- 超出软上限时 textarea 会设置 aria-invalid="true"

## 常见问题

### 多行文本是什么？

随内容增高的文本域，带字数统计。硬上限用 maxlength，软上限 data-soft-max 允许继续输入但提示超出。

### 怎么使用多行文本？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 多行文本支持键盘和读屏吗？

计数文字是 aria-hidden；若在旁边放一个 .zh-inp-sr（视觉隐藏的 aria-live 区域），越过或回到软上限时会朗读「已超出字数上限」；超出软上限时 textarea 会设置 aria-invalid="true"。

### 多行文本需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 时间选择

时、分（可选秒）三列滚动选择，也可以直接键入。分钟可按步长取整。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。只用核心包时，还要加 `modular/date.min.js` 和 `modular/date.min.css`；全量版已包含。

### 用法

```html
<div data-zh-time data-name="at" data-value="09:30" aria-label="提醒时间"></div>
<div data-zh-time data-seconds data-step-minutes="15" data-value="14:15:10" aria-label="精确时间"></div>

<script>
document.querySelector('[data-zh-time]').addEventListener('zh:time-change', function (e) {
  console.log(e.detail.value);   // 09:45
});
</script>
```

### 样式类

`zh-dp`、`zh-tp-panel`、`zh-tp-cols`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-zh-time` | <div> | 无 | 声明这是时间选择 |
| `data-value` | 容器 | HH:mm 或 HH:mm:ss | 初始时间 |
| `data-seconds` | 容器 | 布尔属性 | 显示并允许选择秒 |
| `data-step-minutes` | 容器 | 整数，默认 1 | 分钟的步长，如 15；键入的分钟会四舍五入到最近的步长 |
| `data-name` | 容器 | 字段名 | 生成隐藏 <input name=…> 参与表单提交 |
| `data-size` | 容器 | sm \| md（默认）\| lg | 尺寸 |
| `aria-label / data-labelledby / data-label` | 容器 | 字符串 / 标签元素 id / 弹层标题 | 输入框的无障碍名称；data-label 是弹出面板的标题 |
| `<label for="容器 id">` | 容器所在页面的 <label> | for 指向容器的 id | label 会成为输入框的无障碍名称，点击 label 会聚焦输入框；容器是空 <div>，label 的 for 指向它的 id 即可 |

### 方法

- `ZhaoUI.timePicker(host, { value: { h, m, s }, seconds, stepM, size, label, onChange })`：命令式创建；value 是 { h, m, s } 对象
- `el.zhTime.get() / .set(value) / .open() / .close()`：get 返回 { h, m, s } 或 null；set 接受对象或 HH:mm 字符串，不触发事件

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:time-change` | 容器 | { value: 'HH:mm' \| 'HH:mm:ss' \| '', time: { h, m, s } \| null } | 选择、键入确认、点「此刻」或清除后触发（冒泡） |

### 无障碍

- 每一列是一个 listbox，↑ ↓ 逐项移动，PageUp / PageDown 一次移动五个步长，Home / End 到首尾，← → 在时分秒列之间切换，Enter 确定
- 键入不合法（如 25:00）时标记 aria-invalid
- 面板底部有「此刻」和「确定」按钮

## 常见问题

### 时间选择是什么？

时、分（可选秒）三列滚动选择，也可以直接键入。分钟可按步长取整。

### 怎么使用时间选择？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写；需要用代码控制时，用「方法」里列出的接口。

### 时间选择有哪些事件？

zh:time-change（选择、键入确认、点「此刻」或清除后触发（冒泡））。

### 时间选择有哪些方法？

ZhaoUI.timePicker(host, { value: { h, m, s }, seconds, stepM, size, label, onChange })：命令式创建；value 是 { h, m, s } 对象；el.zhTime.get() / .set(value) / .open() / .close()：get 返回 { h, m, s } 或 null；set 接受对象或 HH:mm 字符串，不触发事件。

### 时间选择支持键盘和读屏吗？

每一列是一个 listbox，↑ ↓ 逐项移动，PageUp / PageDown 一次移动五个步长，Home / End 到首尾，← → 在时分秒列之间切换，Enter 确定；键入不合法（如 25:00）时标记 aria-invalid；面板底部有「此刻」和「确定」按钮。

### 时间选择需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 时间线

按时间顺序展示事件：左侧一条轨道和圆点，右侧是标题、时间、说明。圆点颜色表示状态（primary、success、warning、danger、info），进行中的项显示转圈。可以带头像、引用、附件，以及点击展开的详情。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<ol class="zh-tl">
  <li class="zh-tl-item zh-tl-item--success"><div class="zh-tl-rail"><span class="zh-tl-dot" aria-hidden="true"></span></div>
    <div class="zh-tl-body"><div class="zh-tl-head"><span class="zh-tl-title">订单已创建</span><time class="zh-tl-time" datetime="2026-10-04T09:00">09:00</time></div><div class="zh-tl-desc">订单 #20261004</div></div></li>
  <li class="zh-tl-item zh-tl-item--primary"><div class="zh-tl-rail"><span class="zh-tl-dot" aria-hidden="true"></span></div>
    <div class="zh-tl-body"><div class="zh-tl-head"><span class="zh-tl-title">仓库已接单</span><time class="zh-tl-time" datetime="2026-10-04T09:12">09:12</time></div>
      <button type="button" class="zh-tl-toggle" aria-expanded="false" aria-controls="tl-d1"><i data-i="chevron-right" data-s="14"></i><span>展开详情</span></button>
      <div class="zh-tl-detail" id="tl-d1"><div class="zh-tl-detail-wrap"><div class="zh-tl-detail-in">上海仓 · 拣货员 A12 已接单，预计 20 分钟内出库。</div></div></div></div></li>
  <li class="zh-tl-item zh-tl-item--pending" aria-label="进行中：派送中"><div class="zh-tl-rail"><span class="zh-tl-dot zh-tl-dot--icon" aria-hidden="true"><i data-i="loader-circle" data-s="14" class="zh-tl-spin"></i></span></div>
    <div class="zh-tl-body"><div class="zh-tl-head"><span class="zh-tl-title">派送中</span></div></div></li>
</ol>
```

### 样式类

`zh-tl`、`zh-tl-item`、`zh-tl-rail`、`zh-tl-dot`、`zh-tl-body`、`zh-tl-head`、`zh-tl-title`、`zh-tl-time`、`zh-tl-desc`、`zh-tl-quote`、`zh-tl-toggle`、`zh-tl-detail`、`zh-tl--alt`、`zh-tl--right`、`zh-tl--compact`、`zh-tl--feed`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `zh-tl` | <ol>（class） | 里面放 zh-tl-item | 时间线容器 |
| `zh-tl-item--primary\|success\|warning\|danger\|info\|pending` | <li>（class） |  | 圆点和轨道的状态色；pending 表示进行中，圆点换成转圈 |
| `zh-tl-dot--hollow` | 圆点（class） |  | 空心点；zh-tl-dot--icon 放图标，再加 zh-tl-dot--lg 变大 |
| `zh-tl-quote` | 正文里的容器 |  | 引用块，如审批意见 |
| `zh-tl-toggle + zh-tl-detail` | 展开按钮与详情容器 |  | 点击按钮展开详情，库负责切换 aria-expanded 与文字；按钮上可用 data-open / data-close 自定义文字 |
| `zh-tl--alt / --right / --compact / --feed` | <ol>（class） |  | 左右交替 / 靠右 / 紧凑 / 动态流（带头像） |

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:timeline-toggle` | <ol> | undefined | 详情展开或收起 |

### 无障碍

- 用有序列表 <ol>，顺序对读屏有意义
- 时间用 <time datetime="…">
- 圆点是装饰，加 aria-hidden="true"；状态要在文字里体现，不要只靠颜色
- 进行中的项给 <li> 加 aria-label，如“进行中：派送中”

## 常见问题

### 时间线是什么？

按时间顺序展示事件：左侧一条轨道和圆点，右侧是标题、时间、说明。圆点颜色表示状态（primary、success、warning、danger、info），进行中的项显示转圈。可以带头像、引用、附件，以及点击展开的详情。

### 怎么使用时间线？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 时间线有哪些事件？

zh:timeline-toggle（详情展开或收起）。

### 时间线支持键盘和读屏吗？

用有序列表 <ol>，顺序对读屏有意义；时间用 <time datetime="…">；圆点是装饰，加 aria-hidden="true"；状态要在文字里体现，不要只靠颜色。

### 时间线需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 文字提示

悬停或键盘聚焦时显示的小气泡，自动避让屏幕边缘，带箭头。适合解释图标按钮或被禁用的按钮。不用 JS 的简易版见「样式类」里的 zh-tip。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。

### 用法

```html
<div class="zh-row">
  <button class="zh-btn" data-zh-tt="保存当前草稿">保存</button>
  <span data-zh-tt="没有编辑权限，请联系管理员开通" data-zh-tt-placement="bottom"><button class="zh-btn primary" disabled aria-disabled="true">提交审核</button></span>
</div>
```

### 样式类

`zh-pop`、`zh-pop--tooltip`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-zh-tt` | 任意元素 | 提示文字 | 声明提示；元素不可聚焦时库会补 tabindex=0，使键盘也能看到 |
| `data-zh-tt-placement` | 同上 | top \| bottom \| left \| right（可加 -start / -end），默认 top | 出现的位置，空间不够会自动翻转 |
| `data-zh-tt-delay` | 同上 | 毫秒，默认 80 | 悬停多久后出现 |

### 无障碍

- 提示内容通过 aria-describedby 关联到元素，读屏会读出
- 被禁用的按钮不能聚焦也收不到悬停：外面包一层 <span data-zh-tt="…">，把提示放在 span 上
- 提示只放补充说明，关键信息不要只写在提示里

## 常见问题

### 文字提示是什么？

悬停或键盘聚焦时显示的小气泡，自动避让屏幕边缘，带箭头。适合解释图标按钮或被禁用的按钮。不用 JS 的简易版见「样式类」里的 zh-tip。

### 怎么使用文字提示？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写。

### 文字提示支持键盘和读屏吗？

提示内容通过 aria-describedby 关联到元素，读屏会读出；被禁用的按钮不能聚焦也收不到悬停：外面包一层 <span data-zh-tt="…">，把提示放在 span 上；提示只放补充说明，关键信息不要只写在提示里。

### 文字提示需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 树

可展开的层级列表：文件目录、组织架构、分类。写一个嵌套的 <ul>，库渲染成带展开箭头的行；可选复选框（父级根据子级显示全选、半选、未选）、单选高亮和完整的键盘操作。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。只用核心包时，还要加 `modular/tree.min.js` 和 `modular/tree.min.css`；全量版已包含。

### 用法

```html
<div class="zh-tree" data-zh-tree data-checkable aria-label="文件" style="max-width:20rem">
  <ul>
    <li data-id="src" data-open data-icon="file-text">src
      <ul>
        <li data-id="a" data-checked>index.js</li>
        <li data-id="b">style.css</li>
        <li data-id="c" data-disabled>locked.txt</li>
      </ul>
    </li>
    <li data-id="docs" data-icon="file-text">docs
      <ul><li data-id="d">readme.md</li></ul>
    </li>
  </ul>
</div>
```

### 样式类

`zh-tree`、`zh-tree-row`、`zh-tree-toggle`、`zh-tree-check`、`zh-tree-icon`、`zh-tree-label`、`zh-tree--guides`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-zh-tree` | <div class="zh-tree"> | 里面放一个嵌套的 <ul> | 声明为树；<li> 的文字是节点名称，子级写在它里面的 <ul> 里 |
| `data-id` | <li> | 唯一标识 | 事件和方法里用它指代节点；不写会自动生成 |
| `data-icon` | <li> | 图标名 | 节点前的图标 |
| `data-open` | <li> |  | 该节点默认展开 |
| `data-checked` | <li> |  | 默认选中（仅复选模式；父级的状态由子级算出） |
| `data-disabled` | <li> |  | 禁用，不可选择、不可勾选 |
| `data-checkable` | 容器 |  | 显示复选框 |
| `data-no-select` | 容器 |  | 不要点击高亮（只做展开或勾选时用） |
| `data-toggle-on-click` | 容器 |  | 点击整行也展开或收起，不只是点箭头 |
| `zh-tree--guides` | 容器（class） |  | 显示缩进参考线 |

### 方法

- `ZhaoUI.tree.checked(el)`：返回选中的叶子节点 id 数组
- `ZhaoUI.tree.expandAll(el) / collapseAll(el)`：全部展开 / 收起
- `ZhaoUI.tree.select(el, id)`：选中某个节点并展开它的祖先；找不到返回 false

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:tree-select` | 容器 | undefined | 点击或回车选中某个节点 |
| `zh:tree-check` | 容器 | undefined | 勾选变化；ids 是当前全部选中的叶子节点的 data-id |
| `zh:tree-toggle` | 容器 | undefined | 展开或收起 |

### 无障碍

- 容器 role=tree，行 role=treeitem，带 aria-level、aria-expanded、aria-checked、aria-selected
- 键盘：上下键移动，右键展开或进入子级，左键收起或回到父级，Home/End 到首尾，回车选中，空格勾选（无复选框时选中）
- 勾选结果通过隐藏的 aria-live 区域读出
- 请给容器加 aria-label 说明这棵树是什么
- 不含拖拽排序、行内重命名和按需加载子节点；这些需要你自己处理数据后重新渲染

## 常见问题

### 树是什么？

可展开的层级列表：文件目录、组织架构、分类。写一个嵌套的 <ul>，库渲染成带展开箭头的行；可选复选框（父级根据子级显示全选、半选、未选）、单选高亮和完整的键盘操作。

### 怎么使用树？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写；需要用代码控制时，用「方法」里列出的接口。

### 树有哪些事件？

zh:tree-select（点击或回车选中某个节点）；zh:tree-check（勾选变化；ids 是当前全部选中的叶子节点的 data-id）；zh:tree-toggle（展开或收起）。

### 树有哪些方法？

ZhaoUI.tree.checked(el)：返回选中的叶子节点 id 数组；ZhaoUI.tree.expandAll(el) / collapseAll(el)：全部展开 / 收起；ZhaoUI.tree.select(el, id)：选中某个节点并展开它的祖先；找不到返回 false。

### 树支持键盘和读屏吗？

容器 role=tree，行 role=treeitem，带 aria-level、aria-expanded、aria-checked、aria-selected；键盘：上下键移动，右键展开或进入子级，左键收起或回到父级，Home/End 到首尾，回车选中，空格勾选（无复选框时选中）；勾选结果通过隐藏的 aria-live 区域读出。

### 树需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。

---

## 文件上传

拖拽或点击选择文件，带文件列表、进度条、类型与大小校验、数量限制，失败可重试，上传中可取消。可以用 data-action 直接 POST 到接口，也可以用自己的函数上传；两者都不给时只收集文件，由你在提交表单时取。只有列表模式；头像上传和图片卡片墙没有做。

**依赖**：`zhaoui.css` 与 `zhaoui.js`（原生 HTML、CSS、JS，不需要框架或 jQuery）。只用核心包时，还要加 `modular/upload.min.js` 和 `modular/upload.min.css`；全量版已包含。

### 用法

```html
<div class="zh-upload" data-zh-upload data-accept=".pdf,.png,.jpg" data-max="3" data-max-mb="5" data-hint="PDF、PNG、JPG · 单个不超过 5 MB · 最多 3 个" style="max-width:32rem">
  <div class="zh-upload-foot"><span class="zh-upload-count zh-hint">已添加 0 / 3 个</span></div>
</div>
```

### 样式类

`zh-upload`、`zh-upload-drop`、`zh-upload-list`、`zh-upload-item`、`zh-upload-title`、`zh-upload-hint`、`zh-upload-link`、`zh-upload-errors`

### 属性

| 属性 | 用在 | 取值 | 说明 |
|---|---|---|---|
| `data-zh-upload` | <div class="zh-upload"> |  | 声明为上传；没有写 zh-upload-drop 时库会生成默认的拖拽区 |
| `data-accept` | 容器 | 如 .pdf,.png,image/* | 允许的类型：扩展名或 MIME；也会传给系统的文件选择窗口 |
| `data-max-mb` | 容器 | 数字 | 单个文件大小上限（MB） |
| `data-max` | 容器 | 数字 | 最多文件数；设为 1 时选新文件会替换旧的 |
| `data-action` | 容器 | 接口地址 | 用 XHR 以 multipart/form-data 上传到这里，文件字段名由 data-field 指定（默认 file）；返回 2xx 算成功 |
| `data-credentials` | 容器 |  | 跨域上传时带上 Cookie |
| `data-hint` | 容器 | 提示文字 | 生成默认拖拽区时显示的限制说明 |
| `is-disabled` | 容器（class） |  | 禁用，不能选择也不能拖入 |

### 方法

- `ZhaoUI.upload.files(el)`：返回列表里的 File 数组，可自己放进 FormData 提交
- `ZhaoUI.upload.uploader(el, fn)`：设置自己的上传函数 fn(file, { onProgress(百分比), onAbort(回调) })，返回 Promise；会替代 data-action
- `ZhaoUI.upload.add(el, files)`：以代码方式加入文件（同样会校验）
- `ZhaoUI.upload.clear(el)`：清空列表

### 事件

| 事件 | 触发于 | detail | 说明 |
|---|---|---|---|
| `zh:upload-add` | 容器 | undefined | 文件通过校验并加入列表 |
| `zh:upload-reject` | 容器 | undefined | 文件没通过校验（类型、大小、数量） |
| `zh:upload-done` | 容器 | undefined | 上传成功；result 是服务器返回的文本或你的函数的返回值 |
| `zh:upload-error` | 容器 | undefined | 上传失败 |
| `zh:upload-remove` | 容器 | undefined | 从列表移除（含上传中取消） |

### 无障碍

- 拖拽区是 role=button，可聚焦，回车或空格打开文件选择；不会只支持拖拽
- 校验错误写在 role=alert 区域，会被读屏立即朗读
- 进度条是 role=progressbar，带文件名和 aria-valuenow
- 列表里的按钮都带文件名，如“移除 报告.pdf”
- 只靠前端校验不可靠，服务端必须再校验类型与大小

## 常见问题

### 文件上传是什么？

拖拽或点击选择文件，带文件列表、进度条、类型与大小校验、数量限制，失败可重试，上传中可取消。可以用 data-action 直接 POST 到接口，也可以用自己的函数上传；两者都不给时只收集文件，由你在提交表单时取。只有列表模式；头像上传和图片卡片墙没有做。

### 怎么使用文件上传？

先在页面里引入 zhaoui.css 和 zhaoui.js（放在 </body> 前，不加 defer），再照本页「用法」里的标记书写；需要用代码控制时，用「方法」里列出的接口。

### 文件上传有哪些事件？

zh:upload-add（文件通过校验并加入列表）；zh:upload-reject（文件没通过校验（类型、大小、数量））；zh:upload-done（上传成功；result 是服务器返回的文本或你的函数的返回值）；zh:upload-error（上传失败）；zh:upload-remove（从列表移除（含上传中取消））。

### 文件上传有哪些方法？

ZhaoUI.upload.files(el)：返回列表里的 File 数组，可自己放进 FormData 提交；ZhaoUI.upload.uploader(el, fn)：设置自己的上传函数 fn(file, { onProgress(百分比), onAbort(回调) })，返回 Promise；会替代 data-action；ZhaoUI.upload.add(el, files)：以代码方式加入文件（同样会校验）；ZhaoUI.upload.clear(el)：清空列表。

### 文件上传支持键盘和读屏吗？

拖拽区是 role=button，可聚焦，回车或空格打开文件选择；不会只支持拖拽；校验错误写在 role=alert 区域，会被读屏立即朗读；进度条是 role=progressbar，带文件名和 aria-valuenow。

### 文件上传需要依赖框架吗？

不需要。ZhaoUI 是原生 HTML、CSS 和 JavaScript，不依赖 jQuery、Vue 或 React。
