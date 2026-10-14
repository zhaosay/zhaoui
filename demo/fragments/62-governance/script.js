var root = document.getElementById('governance'); if (!root) return;
var $ = function (s) { return root.querySelector(s); }, E = ZH.esc, Z = ZH.Z, docEl = document.documentElement;
function tok(n) { return getComputedStyle(docEl).getPropertyValue(n).trim(); }
function hex(n) { var v = tok(n); return /^#[0-9a-f]{6}$/i.test(v) ? v : null; }

/* live colour rules */
function drawRules() {
  var brand = ['--zh-color-primary', '--zh-success', '--zh-warning', '--zh-danger', '--zh-info'].map(hex).filter(Boolean).map(function (h) { return Z.hexToOklch(h); });
  var Ls = brand.map(function (o) { return o[0]; }), Lspread = Math.max.apply(0, Ls) - Math.min.apply(0, Ls);
  var neutrals = ['--zh-bg-subtle', '--zh-border', '--zh-border-strong'].map(hex).filter(Boolean).map(function (h) { return Z.hexToOklch(h)[1]; });
  var nmax = Math.max.apply(0, neutrals);
  var bg = hex('--zh-bg'), pairs = [['--zh-text', 4.5], ['--zh-text-secondary', 4.5], ['--zh-text-tertiary', 4.5], ['--zh-text-success', 4.5], ['--zh-text-warning', 4.5], ['--zh-text-danger', 4.5], ['--zh-color-primary-text', 4.5]];
  var worst = 99, wname = ''; pairs.forEach(function (p) { var h = hex(p[0]); if (h && bg) { var c = Z.contrast(h, bg); if (c < worst) { worst = c; wname = p[0]; } } });
  var prim = hex('--zh-color-primary'), on = hex('--zh-on-primary'), pc = prim && on ? Z.contrast(prim, on) : 0;
  var rows = [
    ['强调色明度接近', '品牌、成功、警告、危险、信息的明度差 ≤ 0.25', Lspread.toFixed(2), Lspread <= 0.25],
    ['中性色几乎无色', '背景、边框的彩度 ≤ 0.02', nmax.toFixed(3), nmax <= 0.02],
    ['文字可读', '主、次、辅助、状态文字对比度 ≥ 4.5:1', worst.toFixed(1) + ':1（' + wname.replace('--zh-', '') + '）', worst >= 4.5],
    ['主色按钮可读', '按钮文字与主色对比度 ≥ 4.5:1', pc.toFixed(1) + ':1', pc >= 4.5]
  ];
  $('#gvRules').innerHTML = rows.map(function (r) { return '<tr><td>' + E(r[0]) + '</td><td>' + E(r[1]) + '</td><td class="zh-tabular-nums" style="font-variant-numeric:tabular-nums">' + E(r[2]) + '</td><td><span class="zh-gv-res ' + (r[3] ? 'ok' : 'bad') + '">' + ZH.iconHtml(r[3] ? 'circle-check' : 'triangle-alert', 16) + (r[3] ? '通过' : '需关注') + '</span></td></tr>'; }).join('');
}
drawRules();
new MutationObserver(function () { requestAnimationFrame(drawRules); }).observe(docEl, { attributes: true, attributeFilter: ['data-mode', 'style', 'data-audience'] });

/* scanner */
function labOf(h) { var o = Z.hexToOklch(h); return [o[0], o[1] * Math.cos(o[2] * Math.PI / 180), o[1] * Math.sin(o[2] * Math.PI / 180)]; }
var COLOR_TOKENS = ['--zh-text', '--zh-text-secondary', '--zh-text-tertiary', '--zh-bg', '--zh-bg-subtle', '--zh-bg-elevated', '--zh-border', '--zh-border-strong', '--zh-color-primary', '--zh-success', '--zh-warning', '--zh-danger', '--zh-info'];
var LIGHT = (Z.modes && Z.modes.light) || {};
function nearestColor(h) {
  var a = labOf(h), best = null, bd = 9;
  COLOR_TOKENS.forEach(function (t) {
    var key = t.replace('--zh-', ''), v = LIGHT[key]; if (t === '--zh-color-primary') v = Z.generateBrand(Z.brands.indigo).light.primary;
    if (!v || v.charAt(0) !== '#') return; var b = labOf(v), d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    if (d < bd) { bd = d; best = { t: t, hex: v, d: d }; }
  });
  return best;
}
function scan() {
  var css = $('#gvIn').value, hits = [], seen = {};
  function add(kind, found, token, note, sw) { var k = kind + found; if (seen[k]) return; seen[k] = 1; hits.push({ kind: kind, found: found, token: token, note: note, sw: sw }); }
  (css.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) || []).forEach(function (h) {
    var full = h.length === 4 ? '#' + h.slice(1).replace(/(.)/g, '$1$1') : h, n = nearestColor(full.toLowerCase());
    if (n) add('颜色', h, 'var(' + n.t + ')', n.d < 0.03 ? '几乎相同' : n.d < 0.09 ? '接近，建议替换' : '差异较大，确认意图后替换', full);
  });
  var rad = { sm: 4, md: 6, lg: 10 };
  (css.match(/border-radius:\s*\d+px/g) || []).forEach(function (m) {
    var px = +m.match(/\d+/)[0], k = Object.keys(rad).sort(function (a, b) { return Math.abs(rad[a] - px) - Math.abs(rad[b] - px); })[0];
    add('圆角', px + 'px', 'var(--zh-radius-' + k + ')', 'B 端 ' + rad[k] + 'px，C 端随预设变化');
  });
  var zs = [['sticky', 100], ['dropdown', 1000], ['drawer', 1100], ['modal', 1200], ['popover', 1300], ['toast', 1400], ['tooltip', 1500]];
  (css.match(/z-index:\s*\d+/g) || []).forEach(function (m) {
    var n = +m.match(/\d+/)[0], best = zs.slice().sort(function (a, b) { return Math.abs(a[1] - n) - Math.abs(b[1] - n); })[0];
    add('层级', n, 'var(--zh-z-' + best[0] + ')', '按用途选：下拉、抽屉、模态框、消息提示……');
  });
  var ds = [['instant', 80], ['fast', 120], ['base', 200], ['slow', 320], ['slower', 480]];
  (css.match(/\b\d{2,4}ms\b/g) || []).forEach(function (m) {
    var n = parseInt(m, 10), best = ds.slice().sort(function (a, b) { return Math.abs(a[1] - n) - Math.abs(b[1] - n); })[0];
    add('时长', m, 'var(--zh-dur-' + best[0] + ')', '曲线改用 --zh-ease-*');
  });
  if (/box-shadow:\s*[^;]*rgba?\(/.test(css)) add('阴影', '自定义阴影', 'var(--zh-shadow-sm / md / lg)', '按层级选一档');
  if (/transition:\s*all\b/.test(css)) add('过渡', 'transition: all', '只写需要的属性', '只动 transform 和 opacity');
  $('#gvSum').textContent = hits.length ? '发现 ' + hits.length + ' 处可以替换' : '没有发现硬编码';
  $('#gvOut').innerHTML = hits.length ? hits.map(function (h) {
    return '<div class="zh-gv-hit"><span class="zh-tag">' + E(h.kind) + '</span><span>' + (h.sw ? '<i class="zh-gv-sw" style="background:' + E(h.sw) + '"></i>' : '') + '<code>' + E(String(h.found)) + '</code> → <span class="tk">' + E(h.token) + '</span></span><span></span><span class="zh-hint" style="margin:0">' + E(h.note) + '</span></div>';
  }).join('') : '<div class="zh-gv-none">这段 CSS 已经全部使用 Token。</div>';
}
$('#gvScan').addEventListener('click', scan); scan();

/* do / don't */
var DD = [
  ['一个区域只放一个主按钮', '<button class="zh-btn primary">保存</button><button class="zh-btn">取消</button>', '<button class="zh-btn primary">保存</button><button class="zh-btn primary">发布</button><button class="zh-btn primary">导出</button>'],
  ['状态用图标加文字', '<span class="zh-tag success">' + ZH.iconHtml('circle-check', 14) + '&nbsp;已完成</span><span class="zh-tag danger">' + ZH.iconHtml('circle-x', 14) + '&nbsp;失败</span>', '<span class="zh-dot" style="width:10px;height:10px;border-radius:50%;background:var(--zh-success);display:inline-block"></span><span class="zh-dot" style="width:10px;height:10px;border-radius:50%;background:var(--zh-danger);display:inline-block"></span>'],
  ['数字右对齐，带千分位', '<div style="width:100%;text-align:right;font-variant-numeric:tabular-nums">12,480<br>986<br>1,204,000</div>', '<div style="width:100%">12480<br>986<br>1204000</div>'],
  ['选项 ≤5 个时平铺', '<div class="zh-gv-seg"><button aria-checked="true" role="radio" style="background:var(--zh-bg-elevated);color:var(--zh-color-primary-text)">EPUB</button><button role="radio">TXT</button><button role="radio">DOCX</button></div>', '<div class="zh-select" style="width:150px"><select aria-label="格式"><option>EPUB</option><option>TXT</option><option>DOCX</option></select></div>'],
  ['文字用文字令牌', '<span style="color:var(--zh-text-secondary)">次要说明文字</span>', '<span style="color:var(--zh-chart-4)">次要说明文字</span>'],
  ['图标按钮要有名称', '<button class="zh-btn icon" aria-label="删除">' + ZH.iconHtml('trash-2', 16) + '</button><span class="zh-hint" style="margin:0">读屏读出「删除」</span>', '<button class="zh-btn icon">' + ZH.iconHtml('trash-2', 16) + '</button><span class="zh-hint" style="margin:0">读屏读出「按钮」</span>']
];
$('#gvDd').innerHTML = DD.map(function (d) {
  return '<div class="pair"><div class="box good"><div class="demo">' + d[1] + '</div><div class="cap"><b>推荐</b><span>' + E(d[0]) + '</span></div></div><div class="box badbox"><div class="demo">' + d[2] + '</div><div class="cap"><b>避免</b><span>与上面相反的写法</span></div></div></div>';
}).join('');
ZH.hydrateIcons($('#gvDd'));

/* a11y checklist */
var A = ['所有交互元素都能用 Tab 到达，顺序符合视觉顺序', '焦点环始终可见，不被裁剪', '正文和状态文字对比度 ≥ 4.5:1', '纯图标按钮都有 aria-label', '表单每个输入都有关联的 label', '错误提示与输入框用 aria-describedby 关联', '状态不只靠颜色表达', '触控目标不小于 44px', '弹窗打开后焦点进入，关闭后回到触发处', '动画尊重「减少动态效果」', '图表提供数据表或文字说明', '页面只有一个 h1，标题层级不跳级'], ac = A.map(function () { return false; });
function drawA() {
  var n = ac.filter(Boolean).length;
  $('#gvA11y').innerHTML = A.map(function (t, i) { return '<li><label><input type="checkbox" data-i="' + i + '"' + (ac[i] ? ' checked' : '') + '><span>' + E(t) + '</span></label></li>'; }).join('');
  $('#gvA11yN').textContent = n + ' / ' + A.length; var b = $('#gvA11yBar'); b.style.setProperty('--p', n / A.length); b.setAttribute('aria-valuenow', Math.round(n / A.length * 100));
}
$('#gvA11y').addEventListener('change', function (e) { ac[+e.target.getAttribute('data-i')] = e.target.checked; drawA(); });
$('#gvA11yBar').innerHTML = '<i></i>'; drawA();
