(function () {
  var root = document.documentElement;
  var stage = document.getElementById('stage');
  var Z = window.ZhaoUI;
  var state = { audience: 'b', mode: 'light', density: 'standard', screen: 'auto', brand: Z.brands.indigo, trend: 'cn', style: 'flat' };
  var presets = Object.keys(Z.brands).map(function (k) { return Z.brands[k]; });

  try {
    var saved = JSON.parse(localStorage.getItem('zhaoui-demo') || '{}');
    Object.keys(saved).forEach(function (k) { if (k in state) state[k] = saved[k]; });
    if (state.style !== 'flat' && state.style !== 'glass') state.style = 'flat';
  } catch (e) {}
  var qs = new URLSearchParams(location.search);
  Object.keys(state).forEach(function (k) { if (qs.get(k)) state[k] = qs.get(k); });
  if (!localStorage.getItem('zhaoui-demo') && !qs.get('mode') && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) state.mode = 'dark';

  var contrast = Z.contrast, buildScale = Z.buildScale;

  /* ---------- 应用主题 ---------- */
  function apply() {
    root.setAttribute('data-audience', state.audience);
    root.setAttribute('data-mode', state.mode);
    root.setAttribute('data-density', state.density);
    root.setAttribute('data-trend', state.trend);
    root.setAttribute('data-style', state.style);
    stage.setAttribute('data-screen', state.screen);
    root.setAttribute('data-screen', state.screen);

    Z.applyBrand(root, state.brand);
    var bm = Z.generateBrand(state.brand)[state.mode === 'dark' ? 'dark' : 'light'];
    var ratio = contrast(bm.primary, bm.on);
    document.getElementById('contrastBadge').textContent = ratio.toFixed(1) + ':1 ' + (ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : '未达标');

    document.querySelectorAll('[data-ctl]').forEach(function (g) {
      var k = g.getAttribute('data-ctl');
      g.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === state[k])); });
    });
    document.querySelectorAll('#brandSwatches button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-c') === state.brand)); });
    var picker = document.getElementById('brandPicker'); if (picker) picker.value = state.brand;

    fit();

    try { localStorage.setItem('zhaoui-demo', JSON.stringify(state)); } catch (e) {}
    requestAnimationFrame(render);
  }

  /* ---------- 展示内容渲染 ---------- */
  function cs(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }
  function render() {
    var sc = buildScale(state.brand);
    document.getElementById('brandScale').innerHTML = sc.map(function (c, i) {
      var fg = contrast(c, '#fff') > 3 ? '#fff' : '#111';
      return '<div style="background:' + c + ';color:' + fg + '"><b>' + (i + 1) + '</b>' + c + '</div>';
    }).join('');

    function chips(list) {
      return list.map(function (t) {
        return '<div class="chip"><i style="background:var(' + t[0] + ')"></i><span>' + t[1] + '<small>' + t[0] + '</small></span></div>';
      }).join('');
    }
    document.getElementById('semanticChips').innerHTML = chips([
      ['--zh-color-primary', '主色'], ['--zh-color-primary-hover', '主色悬停'], ['--zh-color-primary-subtle', '主色浅底'],
      ['--zh-success', '成功'], ['--zh-warning', '警告'], ['--zh-danger', '危险'], ['--zh-info', '信息'], ['--zh-color-primary-text', '主色文字']
    ]);
    document.getElementById('neutralChips').innerHTML = chips([
      ['--zh-bg', '背景'], ['--zh-bg-subtle', '次级背景'], ['--zh-bg-elevated', '浮层背景'], ['--zh-border', '边框'],
      ['--zh-border-strong', '强边框'], ['--zh-text', '主文字'], ['--zh-text-secondary', '次文字'], ['--zh-text-tertiary', '辅助文字']
    ]);

    var sizes = [['display', 2.29, 700, '视觉设计语言'], ['h1', 1.71, 700, '页面标题 Page Title'], ['h2', 1.43, 600, '区块标题 Section Title'],
                 ['h3', 1.14, 600, '卡片标题 Card Title'], ['body', 1, 400, '正文内容用于阅读，行高保证段落舒适。The quick brown fox.'],
                 ['caption', .86, 400, '辅助说明与标注文字']];
    var base = parseFloat(cs('--zh-font-base')) || 14;
    document.getElementById('typeScale').innerHTML = sizes.map(function (r) {
      return '<div class="type-row"><span>' + r[0] + ' · ' + Math.round(base * r[1]) + 'px</span><span style="font-size:' + r[1] + 'em;font-weight:' + r[2] + ';line-height:1.35">' + r[3] + '</span></div>';
    }).join('');

    var sp = [1, 2, 3, 4, 5, 6, 8, 10, 12];
    document.getElementById('spaceScale').innerHTML = sp.map(function (n) {
      return '<div style="display:grid;grid-template-columns:132px 1fr;gap:12px;align-items:center"><span class="mono" style="color:var(--zh-text-tertiary)">space-' + n + ' · ' + n * 4 + 'px</span><div class="space-bar" style="width:' + n * 4 * 3 + 'px"></div></div>';
    }).join('');

    document.getElementById('motionMs').textContent = cs('--zh-motion');
    fillContrast(); sizeReadout();

    var names = ['--zh-color-primary', '--zh-color-primary-hover', '--zh-color-primary-active', '--zh-color-primary-subtle', '--zh-color-primary-text', '--zh-on-primary',
      '--zh-bg', '--zh-bg-subtle', '--zh-bg-elevated', '--zh-border', '--zh-border-strong', '--zh-text', '--zh-text-secondary', '--zh-text-tertiary',
      '--zh-success', '--zh-warning', '--zh-danger', '--zh-info',
      '--zh-text-disabled', '--zh-text-success', '--zh-text-warning', '--zh-text-danger', '--zh-text-info',
      '--zh-trend-up', '--zh-trend-down', '--zh-trend-flat', '--zh-num-good', '--zh-num-warn', '--zh-num-bad',
      '--zh-chart-1', '--zh-chart-2', '--zh-chart-3', '--zh-chart-4', '--zh-chart-5', '--zh-chart-6', '--zh-chart-7', '--zh-chart-8',
      '--zh-chart-grid', '--zh-chart-axis', '--zh-chart-muted',
      '--zh-z-sticky', '--zh-z-dropdown', '--zh-z-drawer', '--zh-z-modal', '--zh-z-popover', '--zh-z-toast', '--zh-z-tooltip', '--zh-icon-stroke',
      '--zh-radius-sm', '--zh-radius-md', '--zh-radius-lg', '--zh-font-base', '--zh-control-h-base', '--zh-density', '--zh-motion'];
    var lines = names.map(function (n) { return '  ' + n + ': ' + cs(n) + ';'; });
    for (var i = 1; i <= 10; i++) lines.push('  --zh-brand-' + i + ': ' + cs('--zh-brand-' + i) + ';');
    document.getElementById('tokenDump').textContent = ':root {\n  /* audience=' + state.audience + ' mode=' + state.mode + ' density=' + state.density + ' */\n' + lines.join('\n') + '\n}';
  }

  /* ---------- 屏幕档位：自适应 / 固定宽度预览（超出可用宽度时等比缩放） ---------- */
  var wrap = document.querySelector('.stage-wrap');
  var inner = stage.querySelector('.stage-inner');
  var NOM = { phone: 390, tablet: 820, desktop: 1280, large: 1920, wall: 1920 };
  var curZoom = 1;
  function tierOf(w) { return w < 768 ? '手机' : w < 1200 ? '平板' : w < 1920 ? '桌面' : '大屏'; }
  function fit() {
    var n = NOM[state.screen];
    if (n) { curZoom = Math.min(1, wrap.clientWidth / n); stage.style.width = n + 'px'; stage.style.zoom = curZoom < 1 ? curZoom : ''; }
    else { curZoom = 1; stage.style.width = ''; stage.style.zoom = ''; }
    updateInfo();
  }
  function updateInfo() {
    var w = NOM[state.screen] || stage.clientWidth;
    var st = getComputedStyle(inner);
    var tier = state.screen === 'wall' ? '中控大屏' : tierOf(w);
    var cols = st.getPropertyValue('--cols').trim(), gut = st.getPropertyValue('--zh-gutter').trim(), pad = st.getPropertyValue('--zh-inner-pad').trim();
    document.getElementById('stageLabel').textContent = '预览宽度 ' + w + 'px' + (curZoom < 1 ? '（缩放 ' + Math.round(curZoom * 100) + '%）' : '') + ' · 档位 ' + tier + ' · ' + state.audience.toUpperCase() + ' 端 / ' + state.mode + ' / ' + state.density;
    var t = document.getElementById('tierInfo');
    if (t) t.innerHTML = '<span>当前档位 <b>' + tier + '</b></span><span>宽度 <b>' + w + 'px</b></span><span>栅格 <b>' + cols + ' 列</b></span><span>列间距 <b>' + gut + '</b></span><span>外边距 <b>' + pad + '</b></span>';
  }
  if (window.ResizeObserver) {
    var later = function (fn) { return function () { requestAnimationFrame(fn); }; };
    new ResizeObserver(later(fit)).observe(wrap);
    new ResizeObserver(later(updateInfo)).observe(stage);
  } else { window.addEventListener('resize', fit); }

  var tplTabs = document.getElementById('tplTabs');
  tplTabs.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    tplTabs.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
    document.querySelectorAll('.tpl').forEach(function (p) { p.hidden = p.getAttribute('data-tpl') !== b.getAttribute('data-t'); });
  });

  if (qs.get('tpl')) { var tb = tplTabs.querySelector('[data-t="' + qs.get('tpl') + '"]'); if (tb) tb.click(); }
  if (qs.get('only')) document.querySelectorAll('section.block').forEach(function (s) { s.hidden = s.id !== qs.get('only'); });

  /* ---------- 图标：<i data-i="name" data-s="size"> → SVG 精灵图引用 ---------- */
  function iconHtml(name, size, cls) {
    var st = size ? ' style="width:' + size + 'px;height:' + size + 'px"' : '';
    return '<svg class="ico' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"' + st + '><use href="#zi-' + name + '" xlink:href="#zi-' + name + '"></use></svg>';
  }
  function hydrateIcons(scope) {
    scope.querySelectorAll('i[data-i]').forEach(function (el) {
      var tmp = document.createElement('span');
      tmp.innerHTML = iconHtml(el.getAttribute('data-i'), el.getAttribute('data-s'), el.className);
      var svg = tmp.firstChild, extra = el.getAttribute('style');
      if (extra) svg.setAttribute('style', (svg.getAttribute('style') || '') + ';' + extra);
      el.replaceWith(svg);
    });
  }
  function toast(msg) {
    var m = document.createElement('div'); m.className = 'zh-message'; m.innerHTML = iconHtml('circle-check');
    m.appendChild(document.createTextNode(msg));
    document.getElementById('toastHost').appendChild(m); setTimeout(function () { m.remove(); }, 2000);
  }
  var ICON_GROUPS = [
    ['导航', ['house', 'layout-dashboard', 'menu', 'search', 'chevron-left', 'chevron-right', 'chevron-up', 'chevron-down', 'arrow-left', 'arrow-right', 'arrow-up', 'arrow-down', 'arrow-up-right', 'arrow-down-right', 'external-link', 'log-in', 'log-out']],
    ['操作', ['plus', 'minus', 'x', 'check', 'pencil', 'trash-2', 'copy', 'download', 'upload', 'share-2', 'refresh-cw', 'filter', 'sliders-horizontal', 'settings', 'eye', 'eye-off', 'link', 'ellipsis', 'ellipsis-vertical']],
    ['状态与提醒', ['info', 'triangle-alert', 'circle-check', 'circle-x', 'circle-alert', 'circle-help', 'lock', 'unlock', 'bell', 'shield-check', 'wifi', 'wifi-off', 'flag', 'star', 'heart', 'bookmark']],
    ['数据', ['activity', 'chart-bar', 'chart-column', 'chart-line', 'chart-pie', 'trending-up', 'trending-down', 'database', 'layers', 'grid-2x2', 'list']],
    ['内容', ['file-text', 'folder', 'image', 'video', 'music', 'mail', 'message-square', 'calendar', 'clock', 'tag', 'inbox', 'archive', 'map-pin', 'globe', 'phone']],
    ['文件与媒体', ['file', 'files', 'file-plus', 'file-image', 'file-video', 'file-audio', 'file-archive', 'file-spreadsheet', 'file-code', 'file-json', 'file-check', 'file-x', 'file-warning', 'file-up', 'file-down', 'folder-open', 'folder-plus', 'images', 'image-plus', 'image-off', 'camera', 'play', 'pause', 'skip-back', 'skip-forward', 'volume-2', 'volume-x', 'mic', 'headphones', 'film', 'cloud-upload', 'cloud-download', 'paperclip', 'printer', 'clipboard', 'clipboard-check']],
    ['编辑与查看', ['zoom-in', 'zoom-out', 'rotate-cw', 'rotate-ccw', 'flip-horizontal', 'flip-vertical', 'maximize', 'minimize', 'expand', 'shrink', 'crop', 'scissors', 'save', 'undo-2', 'redo-2', 'bold', 'italic', 'underline', 'strikethrough', 'align-left', 'align-center', 'align-right', 'list-ordered', 'list-checks', 'list-todo', 'quote', 'heading', 'type', 'palette', 'brush', 'eraser', 'grip-vertical', 'grip-horizontal', 'move', 'chevrons-up-down', 'arrow-up-down', 'arrow-left-right', 'panel-left', 'panel-right', 'layout-grid', 'layout-list', 'columns-2', 'table', 'list-filter', 'filter-x', 'search-x']],
    ['状态与反馈', ['check-check', 'square-check', 'square', 'circle-dashed', 'circle-plus', 'circle-minus', 'circle-slash', 'circle-pause', 'circle-play', 'circle-stop', 'octagon-alert', 'shield-alert', 'shield-x', 'ban', 'bug', 'loader', 'loader-circle', 'hourglass', 'timer', 'alarm-clock', 'history', 'badge-check', 'badge-alert', 'badge-info', 'bell-ring', 'bell-off', 'thumbs-up', 'thumbs-down', 'smile', 'frown', 'meh', 'star-half', 'heart-off', 'sparkles', 'lightbulb', 'rocket', 'target', 'trophy', 'gift', 'flame', 'crown', 'medal']],
    ['日期与人员', ['calendar-days', 'calendar-check', 'calendar-range', 'calendar-clock', 'sunrise', 'sunset', 'user-plus', 'user-check', 'user-x', 'user-round', 'users-round', 'contact', 'at-sign', 'hash', 'pin', 'pin-off', 'share', 'forward', 'reply', 'send', 'send-horizontal', 'message-circle', 'messages-square', 'phone-call', 'megaphone', 'mail-open']],
    ['开发与设备', ['code', 'code-xml', 'terminal', 'square-terminal', 'braces', 'binary', 'git-branch', 'git-merge', 'git-pull-request', 'git-commit-horizontal', 'workflow', 'network', 'webhook', 'hard-drive', 'microchip', 'usb', 'plug', 'battery', 'battery-charging', 'power', 'radio', 'signal', 'bluetooth', 'router', 'server-cog', 'cloud-cog', 'settings-2', 'sliders-vertical', 'wrench', 'hammer', 'cog', 'toggle-left', 'toggle-right', 'bot', 'brain', 'gauge', 'chart-area', 'chart-spline', 'chart-scatter', 'radar']],
    ['商业与出行', ['building', 'building-2', 'store', 'briefcase', 'landmark', 'receipt', 'banknote', 'coins', 'percent', 'tags', 'ticket', 'qr-code', 'barcode', 'scan-line', 'package-open', 'boxes', 'map', 'navigation', 'compass', 'locate', 'route', 'car', 'plane', 'ship', 'bike', 'shirt']],
    ['设备与业务', ['monitor', 'smartphone', 'tablet', 'cpu', 'server', 'zap', 'users', 'user', 'key', 'shopping-cart', 'wallet', 'credit-card', 'package', 'truck', 'sun', 'moon']]
  ];
  (function buildIconGrid() {
    var total = 0, html = '';
    ICON_GROUPS.forEach(function (g) {
      var cells = g[1].filter(function (n) { return document.getElementById('zi-' + n); });
      total += cells.length;
      html += '<h4 style="margin:18px 0 8px;font-size:.93em;color:var(--zh-text-secondary)">' + g[0] + '</h4><div class="icon-grid">' +
        cells.map(function (n) { return '<button class="icon-cell" data-name="' + n + '" aria-label="复制图标名 ' + n + '">' + iconHtml(n) + '<span>' + n + '</span></button>'; }).join('') + '</div>';
    });
    document.getElementById('iconGroups').innerHTML = html;
    document.getElementById('iconCount').textContent = '本页展示 ' + total + ' 个';
    document.getElementById('iconGroups').addEventListener('click', function (e) {
      var b = e.target.closest('.icon-cell'); if (!b) return;
      var n = b.getAttribute('data-name');
      (navigator.clipboard ? navigator.clipboard.writeText(n) : Promise.reject()).then(function () { toast('已复制 ' + n); }, function () { toast(n); });
    });
  })();
  hydrateIcons(document);

  /* ---------- 文字对比度实测 / 尺寸实测 ---------- */
  function rgbOf(s) { var m = s.match(/[\d.]+/g) || [0, 0, 0]; return [+m[0], +m[1], +m[2]]; }
  function lumRgb(c) { var v = c.map(function (x) { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; }
  function fillContrast() {
    var bg = rgbOf(getComputedStyle(stage).backgroundColor);
    document.querySelectorAll('.text-row').forEach(function (r) {
      var cr = r.querySelector('.cr'); if (!cr || cr.getAttribute('data-skip')) return;
      if (cr.textContent === '—' && !cr.getAttribute('data-done')) { cr.setAttribute('data-skip', '1'); return; }
      var a = lumRgb(rgbOf(getComputedStyle(r.firstElementChild).color)), b = lumRgb(bg);
      var v = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
      cr.textContent = v.toFixed(1) + ':1 ' + (v >= 7 ? 'AAA' : v >= 4.5 ? 'AA' : '未达标'); cr.setAttribute('data-done', '1');
    });
  }
  function sizeReadout() {
    var h = function (id) { return document.getElementById(id).offsetHeight; };
    document.getElementById('sizeReadout').textContent = '当前实测高度：' + h('szS') + ' / ' + h('szM') + ' / ' + h('szL') + ' px';
  }

  /* ---------- 数据展示：图表全部用 SVG 生成，颜色引用 CSS 变量，切换主题不需要重画 ---------- */
  function fmtN(n) { return n.toLocaleString('zh-CN'); }
  function chartW(el) { return Math.max(300, Math.round(el.clientWidth) || 560); }
  function nice(max, ticks) {
    var raw = max / ticks, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    var step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
    return { step: step, max: Math.ceil(max / step - 1e-9) * step };
  }
  function tipEl(el) { var t = el.querySelector('.tt'); if (!t) { t = document.createElement('div'); t.className = 'tt'; t.setAttribute('role', 'status'); el.appendChild(t); } return t; }
  function showTip(el, t, html, x) {
    t.innerHTML = html; t.classList.add('on');
    t.style.left = Math.max(0, Math.min(x + 12, el.clientWidth - t.offsetWidth)) + 'px'; t.style.top = '4px';
  }
  function interact(el, svg, W, N, X, html, mark) {
    var t = tipEl(el), idx = null;
    function at(i) { idx = i; mark(i); var r = svg.getBoundingClientRect(), er = el.getBoundingClientRect(); showTip(el, t, html(i), X(i) / W * r.width + r.left - er.left); }
    function off() { idx = null; mark(null); t.classList.remove('on'); }
    svg.addEventListener('mousemove', function (e) {
      var r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, best = 0, bd = 1e9;
      for (var i = 0; i < N; i++) { var d = Math.abs(X(i) - x); if (d < bd) { bd = d; best = i; } }
      at(best);
    });
    svg.addEventListener('mouseleave', off); svg.addEventListener('blur', off);
    svg.addEventListener('focus', function () { at(N - 1); });
    svg.addEventListener('keydown', function (e) {
      var cur = idx == null ? N - 1 : idx;
      if (e.key === 'ArrowRight') { at(Math.min(N - 1, cur + 1)); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { at(Math.max(0, cur - 1)); e.preventDefault(); }
      else if (e.key === 'Escape') off();
    });
  }
  function gridLines(L, R, W, T, ph, n, fmt) {
    var s = '';
    for (var v = 0; v <= n.max + 1e-9; v += n.step) {
      var y = T + ph * (1 - v / n.max);
      s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '" style="stroke:' + (v === 0 ? 'var(--zh-chart-axis)' : 'var(--zh-chart-grid)') + '" stroke-width="1"/>' +
        '<text x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-size="11" style="fill:var(--zh-text-tertiary)">' + fmt(v) + '</text>';
    }
    return s;
  }
  var CUR = [820, 932, 901, 934, 1290, 1330, 1320, 1010, 1180, 1210, 1290, 1420, 1560, 1490];
  var PREV = [760, 810, 850, 880, 980, 1010, 1060, 900, 940, 1010, 1080, 1130, 1200, 1240];
  var rangeN = 7;

  function lineChart() {
    var el = document.getElementById('chartLine'), N = rangeN;
    var cur = CUR.slice(-N), prev = PREV.slice(-N), labels = [];
    for (var k = N - 1; k >= 0; k--) { var d = new Date(2026, 8, 29 - k); labels.push((d.getMonth() + 1) + '/' + d.getDate()); }
    var W = chartW(el), H = 240, L = 44, R = 84, T = 12, B = 28, pw = W - L - R, ph = H - T - B;
    var n = nice(Math.max.apply(null, cur.concat(prev)), 4);
    var X = function (i) { return L + pw * i / (N - 1); }, Y = function (v) { return T + ph * (1 - v / n.max); };
    var pts = function (a) { return a.map(function (v, i) { return X(i).toFixed(1) + ',' + Y(v).toFixed(1); }).join(' '); };
    var s = gridLines(L, R, W, T, ph, n, fmtN), step = Math.ceil(N / 7);
    labels.forEach(function (lb, i) { if (i % step === 0 || i === N - 1) s += '<text x="' + X(i) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" style="fill:var(--zh-text-tertiary)">' + lb + '</text>'; });
    s += '<polyline points="' + pts(prev) + '" fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" style="stroke:var(--zh-chart-muted)"/>';
    s += '<polygon points="' + X(0) + ',' + Y(0) + ' ' + pts(cur) + ' ' + X(N - 1) + ',' + Y(0) + '" style="fill:var(--zh-color-primary);opacity:.1"/>';
    s += '<polyline points="' + pts(cur) + '" fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" style="stroke:var(--zh-color-primary)"/>';
    [[prev, 'var(--zh-chart-muted)', '上期'], [cur, 'var(--zh-color-primary)', '本期']].forEach(function (x) {
      var last = x[0][N - 1];
      s += '<circle cx="' + X(N - 1) + '" cy="' + Y(last) + '" r="4" stroke-width="2" style="fill:' + x[1] + ';stroke:var(--zh-bg-elevated)"/>' +
        '<text x="' + (X(N - 1) + 10) + '" y="' + (Y(last) + 4) + '" font-size="12" style="fill:var(--zh-text-secondary)">' + x[2] + ' ' + fmtN(last) + '</text>';
    });
    s += '<line id="lcX" y1="' + T + '" y2="' + Y(0) + '" stroke-width="1" style="stroke:var(--zh-chart-axis);display:none"/>' +
      '<circle id="lcD1" r="4" stroke-width="2" style="fill:var(--zh-color-primary);stroke:var(--zh-bg-elevated);display:none"/>' +
      '<circle id="lcD2" r="4" stroke-width="2" style="fill:var(--zh-chart-muted);stroke:var(--zh-bg-elevated);display:none"/>';
    var legend = '<div class="legend"><span><i style="background:var(--zh-color-primary)"></i>本期</span><span><i style="background:var(--zh-chart-muted)"></i>上期</span></div>';
    var aria = '访问量折线图，共 ' + N + ' 天。本期最新 ' + fmtN(cur[N - 1]) + '，上期同期 ' + fmtN(prev[N - 1]) + '。可用左右方向键逐日查看。';
    el.innerHTML = legend + '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" tabindex="0" aria-label="' + aria + '" style="display:block;width:100%;height:auto;outline-offset:4px">' + s + '</svg>';
    var svg = el.querySelector('svg'), xh = svg.querySelector('#lcX'), d1 = svg.querySelector('#lcD1'), d2 = svg.querySelector('#lcD2');
    interact(el, svg, W, N, X, function (i) {
      return '<b>' + labels[i] + '</b><div><span><i class="legend-dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--zh-color-primary);margin-right:6px"></i>本期</span><span>' + fmtN(cur[i]) + '</span></div>' +
        '<div><span><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--zh-chart-muted);margin-right:6px"></i>上期</span><span>' + fmtN(prev[i]) + '</span></div>';
    }, function (i) {
      var on = i != null; [xh, d1, d2].forEach(function (e) { e.style.display = on ? '' : 'none'; });
      if (on) { xh.setAttribute('x1', X(i)); xh.setAttribute('x2', X(i)); d1.setAttribute('cx', X(i)); d1.setAttribute('cy', Y(cur[i])); d2.setAttribute('cx', X(i)); d2.setAttribute('cy', Y(prev[i])); }
    });
    var rows = labels.map(function (lb, i) { return '<tr><td>' + lb + '</td><td class="num">' + fmtN(cur[i]) + '</td><td class="num">' + fmtN(prev[i]) + '</td></tr>'; }).join('');
    document.getElementById('lineTable').innerHTML = '<table class="matrix" style="min-width:0"><thead><tr><th>日期</th><th class="num">本期</th><th class="num">上期</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function barChart() {
    var el = document.getElementById('chartBar');
    var labels = ['10月', '11月', '12月', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月'];
    var vals = [62, 58, 71, 84, 79, 92, 88, 96, 105, 99, 112, 128], N = vals.length;
    var W = chartW(el), H = 240, L = 40, R = 12, T = 22, B = 28, pw = W - L - R, ph = H - T - B, band = pw / N, bw = Math.min(24, band * .6);
    var n = nice(Math.max.apply(null, vals), 4);
    var X = function (i) { return L + band * i + band / 2; }, Y = function (v) { return T + ph * (1 - v / n.max); };
    var s = gridLines(L, R, W, T, ph, n, fmtN), r = 4, base = Y(0);
    vals.forEach(function (v, i) {
      var x = X(i) - bw / 2, y = Y(v);
      s += '<path class="bar" data-i="' + i + '" d="M' + x + ',' + base + ' V' + (y + r) + ' Q' + x + ',' + y + ' ' + (x + r) + ',' + y + ' H' + (x + bw - r) + ' Q' + (x + bw) + ',' + y + ' ' + (x + bw) + ',' + (y + r) + ' V' + base + ' Z" style="fill:' + (i === N - 1 ? 'var(--zh-color-primary)' : 'var(--zh-chart-muted-fill)') + '"/>';
      s += '<text x="' + X(i) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" style="fill:var(--zh-text-tertiary)">' + labels[i] + '</text>';
    });
    s += '<text x="' + X(N - 1) + '" y="' + (Y(vals[N - 1]) - 6) + '" text-anchor="middle" font-size="12" font-weight="600" style="fill:var(--zh-text)">' + vals[N - 1] + '</text>';
    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" tabindex="0" aria-label="月度营收柱状图，9月最高，为 128 万。可用左右方向键逐月查看。" style="display:block;width:100%;height:auto;outline-offset:4px">' + s + '</svg>';
    var svg = el.querySelector('svg'), bars = svg.querySelectorAll('.bar');
    interact(el, svg, W, N, X, function (i) { return '<b>' + labels[i] + '</b><div><span>营收</span><span>' + vals[i] + ' 万</span></div>'; }, function (i) {
      bars.forEach(function (b, k) { b.style.fill = k === i ? 'var(--zh-color-primary-hover)' : (k === N - 1 ? 'var(--zh-color-primary)' : 'var(--zh-chart-muted-fill)'); });
    });
  }

  function ring(pct, size) {
    var c = 2 * Math.PI * 42, d = pct / 100 * c;
    return '<svg viewBox="0 0 100 100" width="' + size + '" height="' + size + '" role="img" aria-label="完成 ' + pct + '%" style="display:block"><circle cx="50" cy="50" r="42" fill="none" stroke-width="10" style="stroke:var(--zh-meter-track)"/>' +
      '<circle cx="50" cy="50" r="42" fill="none" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + d.toFixed(1) + ' ' + (c - d).toFixed(1) + '" transform="rotate(-90 50 50)" style="stroke:var(--zh-color-primary)"/></svg>';
  }
  function spark(data, w, h) {
    var mx = Math.max.apply(null, data), mn = Math.min.apply(null, data), p = 4;
    var pts = data.map(function (v, i) { return [p + (w - 2 * p) * i / (data.length - 1), p + (h - 2 * p) * (1 - (v - mn) / (mx - mn || 1))]; });
    var str = function (a) { return a.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' '); }, last = pts[pts.length - 1];
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="最近 12 个周期的趋势，整体上升" style="display:block;width:100%;height:auto;overflow:visible">' +
      '<polyline points="' + str(pts) + '" fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" style="stroke:var(--zh-chart-muted)"/>' +
      '<polyline points="' + str(pts.slice(-3)) + '" fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" style="stroke:var(--zh-color-primary)"/>' +
      '<circle cx="' + last[0] + '" cy="' + last[1] + '" r="4" stroke-width="2" style="fill:var(--zh-color-primary);stroke:var(--zh-bg-elevated)"/></svg>';
  }

  function donutChart() {
    var data = [['自然搜索', 42], ['直接访问', 28], ['社交媒体', 18], ['推荐', 12]], c = 2 * Math.PI * 48, acc = 0, s = '';
    data.forEach(function (d, i) {
      var len = d[1] / 100 * c;
      s += '<circle cx="60" cy="60" r="48" fill="none" stroke-width="16" stroke-dasharray="' + (len - 2).toFixed(1) + ' ' + (c - len + 2).toFixed(1) + '" stroke-dashoffset="' + (-acc).toFixed(1) + '" transform="rotate(-90 60 60)" style="stroke:var(--zh-chart-' + (i + 1) + ')"/>';
      acc += len;
    });
    var legend = data.map(function (d, i) {
      return '<li style="display:grid;grid-template-columns:12px 1fr auto;gap:8px;align-items:center"><i style="width:10px;height:10px;border-radius:3px;background:var(--zh-chart-' + (i + 1) + ')"></i><span>' + d[0] + '</span><span class="num" style="font-weight:600">' + d[1] + '%</span></li>';
    }).join('');
    document.getElementById('chartDonut').innerHTML = '<div class="ring-wrap" style="width:150px;margin:0 auto 14px"><svg viewBox="0 0 120 120" width="150" height="150" role="img" aria-label="渠道占比：自然搜索 42%，直接访问 28%，社交媒体 18%，推荐 12%" style="display:block">' + s + '</svg><div class="ring-center"><div><div class="metric metric-md">48.2<span class="unit">万</span></div><div class="zh-hint">总访问</div></div></div></div>' +
      '<ul style="list-style:none;margin:0;padding:0;display:grid;gap:8px">' + legend + '</ul>';
  }

  function funnelChart() {
    var st = [['访问', 10000], ['注册', 4200], ['加购', 1800], ['下单', 960]], top = st[0][1];
    document.getElementById('chartFunnel').innerHTML = st.map(function (x, i) {
      var conv = i === 0 ? '' : '<div class="zh-hint">转化 ' + (x[1] / st[i - 1][1] * 100).toFixed(1) + '%</div>';
      return '<div class="funnel-row"><span>' + x[0] + '</span><div class="bar" style="width:' + Math.max(8, x[1] / top * 100) + '%;background:var(--zh-brand-' + (i + 4) + ')"></div><div class="conv"><b style="color:var(--zh-text)">' + fmtN(x[1]) + '</b>' + conv + '</div></div>';
    }).join('');
  }

  function heatChart() {
    var el = document.getElementById('chartHeat'), days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    var W = chartW(el), L = 34, T = 4, cw = (W - L) / 24, ch = Math.max(22, Math.min(40, Math.round(cw * .55))), H = T + ch * 7 + 22, vals = [], mx = 0;
    for (var d = 0; d < 7; d++) { vals[d] = []; for (var h = 0; h < 24; h++) {
      var v = 8 + (d < 5 ? 80 : 40) * Math.exp(-Math.pow(h - 10, 2) / 9) + (d < 5 ? 60 : 50) * Math.exp(-Math.pow(h - 15, 2) / 12) + ((d * 7 + h * 13) % 11);
      v = Math.round(v); vals[d][h] = v; if (v > mx) mx = v; } }
    var s = '';
    for (d = 0; d < 7; d++) {
      s += '<text x="' + (L - 6) + '" y="' + (T + ch * d + ch / 2 + 4) + '" text-anchor="end" font-size="11" style="fill:var(--zh-text-tertiary)">' + days[d] + '</text>';
      for (h = 0; h < 24; h++) s += '<rect class="cell" data-d="' + d + '" data-h="' + h + '" x="' + (L + cw * h + 1) + '" y="' + (T + ch * d + 1) + '" width="' + (cw - 2) + '" height="' + (ch - 2) + '" rx="3" style="fill:var(--zh-seq-' + Math.min(7, Math.floor(vals[d][h] / mx * 7.999)) + ')"/>';
    }
    for (h = 0; h < 24; h += 3) s += '<text x="' + (L + cw * h + cw / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="11" style="fill:var(--zh-text-tertiary)">' + h + ':00</text>';
    var scale = ''; for (var k = 0; k < 8; k++) scale += '<i style="background:var(--zh-seq-' + k + ')"></i>';
    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="一周 7 天 24 小时的活跃度热力图。工作日 9 点到 11 点、14 点到 17 点最活跃，周末整体较低。" style="display:block;width:100%;height:auto">' + s + '</svg><div class="heat-scale">少 ' + scale + ' 多</div>';
    var svg = el.querySelector('svg'), t = tipEl(el);
    svg.addEventListener('mousemove', function (e) {
      var c = e.target.closest ? e.target.closest('.cell') : null;
      if (!c) { t.classList.remove('on'); return; }
      var dd = +c.getAttribute('data-d'), hh = +c.getAttribute('data-h'), er = el.getBoundingClientRect();
      showTip(el, t, '<b>' + days[dd] + ' ' + hh + ':00</b><div><span>活跃人数</span><span>' + vals[dd][hh] + '</span></div>', e.clientX - er.left);
    });
    svg.addEventListener('mouseleave', function () { t.classList.remove('on'); });
  }

  function renderData() {
    lineChart(); barChart(); donutChart(); funnelChart(); heatChart();
    var series = [31, 34, 33, 38, 36, 41, 40, 44, 43, 47, 46, 52];
    document.getElementById('spHero').innerHTML = spark(series, 240, 56);
    document.getElementById('spCard').innerHTML = spark(series, 160, 36);
    document.getElementById('ringKpi').innerHTML = ring(72, 84);
    var rc = document.getElementById('ringC');
    rc.innerHTML = ring(72, 132) + '<div class="ring-center"><div class="metric metric-md">72<span class="unit">%</span></div></div>';
    hydrateIcons(document.getElementById('data'));
  }
  document.getElementById('rangeSeg').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    rangeN = +b.getAttribute('data-v');
    this.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    lineChart();
  });
  renderData();
  if (window.ResizeObserver) {
    var redraw = { chartLine: lineChart, chartBar: barChart, chartHeat: heatChart };
    Object.keys(redraw).forEach(function (id) {
      var el = document.getElementById(id), last = el.clientWidth;
      new ResizeObserver(function () { requestAnimationFrame(function () { var w = el.clientWidth; if (w && Math.abs(w - last) > 8) { last = w; redraw[id](); } }); }).observe(el);
    });
  }

  /* ---------- 目录：滚动高亮 ---------- */
  if (window.IntersectionObserver) {
    var links = {};
    document.querySelectorAll('.toc a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting || !links[e.target.id]) return;
        Object.keys(links).forEach(function (k) { links[k].classList.remove('active'); });
        links[e.target.id].classList.add('active');
      });
    }, { rootMargin: '-15% 0px -75% 0px' });
    document.querySelectorAll('section.block').forEach(function (s) { spy.observe(s); });
  }

  if (!(window.CSS && CSS.supports && CSS.supports('container-type: inline-size'))) document.getElementById('compatBanner').hidden = false;

  var ZH = { Z: Z, iconHtml: iconHtml, hydrateIcons: hydrateIcons, toast: toast, fmtN: fmtN, state: state, root: root, stage: stage };
  document.querySelectorAll('.seg[aria-labelledby]').forEach(function (g) { var l = document.getElementById(g.getAttribute('aria-labelledby')); if (l) g.title = l.textContent; });
  /* ---------- brand kit: logo -> brand colour, default when there is no logo ---------- */
  (function brandKit() {
    var report = document.getElementById('logoReport'), samples = document.getElementById('logoSamples');
    var file = document.getElementById('logoFile'), drop = document.getElementById('logoDrop'), blobUrl = null;
    var svg = function (w, inner) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">' + inner + '</svg>'); };
    var SAMPLES = [
      { name: 'Nimbus', src: svg(0, '<circle cx="58" cy="64" r="40" fill="#0f9d8a"/><circle cx="96" cy="38" r="16" fill="#f2711c"/>') },
      { name: 'Rosa', src: svg(0, '<rect x="16" y="16" width="96" height="96" rx="28" fill="#e0407a"/><path d="M64 34c14 14 14 38 0 60-14-22-14-46 0-60z" fill="#fff"/>') },
      { name: 'Atlas', src: svg(0, '<path d="M64 10l46 26v56l-46 26-46-26V36z" fill="#0b2a6f"/><path d="M44 88l20-48 20 48M52 74h24" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>') },
      { name: 'Sunny', src: svg(0, '<circle cx="64" cy="64" r="30" fill="#f5c400"/><g stroke="#f5c400" stroke-width="8" stroke-linecap="round"><path d="M64 12v14M64 102v14M12 64h14M102 64h14M27 27l10 10M91 91l10 10M27 101l10-10M91 37l10-10"/></g>') },
      { name: 'Mono', src: svg(0, '<rect width="128" height="128" fill="#fff"/><path d="M24 96V32l40 40 40-40v64" stroke="#111" stroke-width="14" fill="none" stroke-linejoin="round"/>') }
    ];
    var esc = function (t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
    samples.innerHTML = SAMPLES.map(function (s, i) { return '<button class="brandkit-sample" data-i="' + i + '" aria-label="示例 Logo ' + s.name + '"><img alt="" src="' + s.src + '"></button>'; }).join('');

    function view(rep, thumb, title) {
      var b = rep.brand, seed = rep.seed;
      var checks = rep.checks.map(function (c) { return '<li>' + iconHtml(c.pass ? 'circle-check' : 'triangle-alert', 0, c.pass ? 'n-good' : 'n-warn') + '<span>' + c.label + ' <b class="num">' + c.value.toFixed(1) + ':1</b></span></li>'; }).join('');
      var warns = rep.warnings.map(function (w) { return '<div class="bk-note">' + iconHtml('info', 0, 't-warning') + '<span>' + esc(w) + '</span></div>'; }).join('');
      report.innerHTML =
        '<div class="bk-head">' + (thumb ? '<div class="bk-logo"><img alt="" src="' + thumb + '"></div>' : '') +
        '<div class="bk-swatch" style="background:' + seed + '"></div>' +
        '<div><div style="font-weight:600">' + esc(title) + '</div><div class="zh-hint" style="margin:2px 0 0">主色 <span class="mono">' + seed + '</span>' + (rep.fallback ? ' · 默认色' : '') + '</div>' +
        (rep.secondary ? '<div class="zh-row" style="--g:8px;margin-top:6px"><span class="bk-swatch sm" style="background:' + rep.secondary + '"></span><span class="zh-hint" style="margin:0">强调色 <span class="mono">' + rep.secondary + '</span></span></div>' : '') + '</div></div>' +
        '<div><div class="zh-hint" style="margin:0 0 6px">派生色阶 · 按钮文字：' + (b.strategy === 'ink' ? '深色' : '白色') + '</div><div class="bk-scale">' + b.scale.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</div></div>' +
        '<ul class="bk-list">' + checks + '<li>' + iconHtml('info', 0, 't-info') + '<span>Logo 中颜色占比 <b class="num">' + Math.round(rep.colourShare * 100) + '%</b>，其余为白、黑、灰或透明</span></li></ul>' + warns +
        '<div class="zh-hint" style="margin:0">已应用为当前品牌色。顶部的色点可以换回预设。</div>';
      hydrateIcons(report);
    }
    function showDefault() {
      report.innerHTML = '<div class="bk-head"><div class="bk-swatch" style="background:' + Z.DEFAULT_SEED + '"></div><div><div style="font-weight:600">使用默认色</div><div class="zh-hint" style="margin:2px 0 0">还没有 Logo。默认靛蓝 <span class="mono">' + Z.DEFAULT_SEED + '</span></div></div></div>';
    }
    function use(src, thumb, title) {
      Z.analyzeLogoImage(src).then(function (rep) { state.brand = rep.seed; apply(); view(rep, thumb, title); },
        function () { report.innerHTML = '<div class="bk-note">' + iconHtml('triangle-alert', 0, 't-warning') + '<span>无法读取这张图片，请换一张，或使用默认色。</span></div>'; hydrateIcons(report); });
    }
    function fromFile(f) { if (!f) return; if (blobUrl) URL.revokeObjectURL(blobUrl); blobUrl = URL.createObjectURL(f); use(f, blobUrl, f.name); }
    samples.addEventListener('click', function (e) { var b = e.target.closest('.brandkit-sample'); if (!b) return; var s = SAMPLES[+b.getAttribute('data-i')]; use(s.src, s.src, s.name); });
    file.addEventListener('change', function () { fromFile(file.files[0]); file.value = ''; });
    drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); } });
    ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
    ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('is-over'); if (t === 'drop') fromFile(e.dataTransfer.files[0]); }); });
    document.getElementById('logoReset').addEventListener('click', function () { state.brand = Z.DEFAULT_SEED; apply(); showDefault(); });
    showDefault();
  })();

  /* @fragments:js */

  /* ---------- 控件事件 ---------- */
  document.querySelectorAll('[data-ctl]').forEach(function (g) {
    g.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var k = g.getAttribute('data-ctl'); state[k] = b.getAttribute('data-v');
      if (k === 'screen' && state.screen === 'wall') state.mode = 'dark';
      apply();
    });
  });
  var sw = document.getElementById('brandSwatches');
  presets.forEach(function (c) {
    var b = document.createElement('button'); b.style.background = c; b.setAttribute('data-c', c); b.setAttribute('aria-label', '品牌色 ' + c);
    b.addEventListener('click', function () { state.brand = c; apply(); }); sw.appendChild(b);
  });
  var picker = document.createElement('input'); picker.type = 'color'; picker.id = 'brandPicker'; picker.setAttribute('aria-label', '自定义品牌色');
  picker.addEventListener('input', function () { state.brand = picker.value; apply(); }); sw.appendChild(picker);

  /* ---------- 组件交互 ---------- */
  var tabs = document.getElementById('demoTabs');
  tabs.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    tabs.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
  });
  var modal = document.getElementById('modal');
  document.getElementById('openModal').onclick = function () { modal.showModal(); };
  document.getElementById('mCancel').onclick = document.getElementById('mOk').onclick = function () { modal.close(); };
  var drawer = document.getElementById('drawer');
  document.getElementById('openDrawer').onclick = function () { drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); };
  document.getElementById('closeDrawer').onclick = function () { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); };
  document.getElementById('showMsg').onclick = function () { toast('保存成功'); };
  var phone = document.getElementById('phone');
  document.getElementById('openSheet').onclick = function () { phone.classList.add('sheet-open'); };
  document.getElementById('sheetMask').onclick = document.getElementById('closeSheet').onclick = function () { phone.classList.remove('sheet-open'); };
  document.querySelectorAll('.sheet button').forEach(function (b) { b.addEventListener('click', function () { phone.classList.remove('sheet-open'); }); });

  var panel = document.getElementById('permPanel');
  document.getElementById('roleSeg').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    panel.setAttribute('data-role', b.getAttribute('data-v'));
    this.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
  });
  document.getElementById('copyTokens').onclick = function () {
    var t = document.getElementById('tokenDump').textContent, out = document.getElementById('copyState');
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { out.textContent = '已复制'; }, function () { out.textContent = '请手动选中复制'; });
    setTimeout(function () { out.textContent = ''; }, 1800);
  };

  apply();
})();
