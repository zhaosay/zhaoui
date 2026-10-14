var root = document.getElementById('panel');
if (!root) return;

/* ---------- Generated cover art from the brand ramp (adapts to theme and brand) ---------- */
function art(seed) {
  var s = +seed || 1, x1 = 20 + (s * 17) % 50, y2 = 55 + (s * 11) % 30;
  return '<svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="160" height="90" style="fill:var(--zh-seq-1)"/>' +
    '<circle cx="' + x1 + '" cy="30" r="46" style="fill:var(--zh-seq-3)"/><circle cx="' + (150 - x1 / 2) + '" cy="' + y2 + '" r="42" style="fill:var(--zh-seq-5);opacity:.85"/>' +
    '<circle cx="' + (60 + s * 9 % 40) + '" cy="88" r="26" style="fill:var(--zh-seq-6);opacity:.55"/></svg>';
}
root.querySelectorAll('[data-art]').forEach(function (el) { el.innerHTML = art(el.dataset.art); });

/* ---------- Selectable cards (radio group) ---------- */
var plans = root.querySelector('#cardPlans');
function pick(el) {
  plans.querySelectorAll('[role=radio]').forEach(function (x) { var on = x === el; x.setAttribute('aria-checked', String(on)); x.tabIndex = on ? 0 : -1; });
}
plans.addEventListener('click', function (e) { var c = e.target.closest('[role=radio]'); if (c && c.getAttribute('aria-disabled') !== 'true') pick(c); });
ZH.rovingFocus(plans, '[role=radio]', { orientation: 'horizontal', typeahead: false, onFocus: pick });

/* ---------- Loading skeleton card ---------- */
var loadCard = root.querySelector('#cardLoad'), loadSwitch = root.querySelector('#cardLoadSwitch');
function syncLoad() {
  var on = loadSwitch.checked;
  loadCard.setAttribute('aria-busy', String(on));
  loadCard.querySelector('.zh-cardx-loading').hidden = !on;
  loadCard.querySelector('.zh-cardx-ready').hidden = on;
}
loadSwitch.addEventListener('change', syncLoad); syncLoad();

/* ---------- Collapse (WAI-ARIA accordion) ---------- */
function wireCollapse(c) {
  if (c.dataset.wired) return; c.dataset.wired = '1';
  var items = [].slice.call(c.children).filter(function (x) { return x.classList.contains('zh-collapse-item'); });
  items.forEach(function (it) {
    var t = it.querySelector(':scope > .zh-collapse-h > .zh-collapse-trigger'), p = it.querySelector(':scope > .zh-collapse-panel');
    var id = ZH.uid('zc'); t.id = id + '-t'; p.id = id + '-p'; t.setAttribute('aria-controls', p.id);
    p.setAttribute('role', 'region'); p.setAttribute('aria-labelledby', t.id);
    t.setAttribute('aria-expanded', String(it.classList.contains('is-open')));
    if (t.hasAttribute('disabled')) t.setAttribute('aria-disabled', 'true');
  });
  function set(it, open) {
    it.classList.toggle('is-open', open);
    it.querySelector(':scope > .zh-collapse-h > .zh-collapse-trigger').setAttribute('aria-expanded', String(open));
  }
  c.addEventListener('click', function (e) {
    var t = e.target.closest('.zh-collapse-trigger'); if (!t || t.closest('.zh-collapse') !== c || t.disabled) return;
    var it = t.closest('.zh-collapse-item'), open = !it.classList.contains('is-open');
    if (open && c.dataset.mode === 'single') items.forEach(function (o) { if (o !== it) set(o, false); });
    set(it, open);
  });
  c.addEventListener('keydown', function (e) {
    var t = e.target.closest('.zh-collapse-trigger'); if (!t || t.closest('.zh-collapse') !== c) return;
    var list = items.map(function (it) { return it.querySelector(':scope > .zh-collapse-h > .zh-collapse-trigger'); }).filter(function (x) { return !x.disabled; });
    var i = list.indexOf(t), n = null;
    if (e.key === 'ArrowDown') n = list[(i + 1) % list.length]; else if (e.key === 'ArrowUp') n = list[(i - 1 + list.length) % list.length];
    else if (e.key === 'Home') n = list[0]; else if (e.key === 'End') n = list[list.length - 1];
    if (n) { e.preventDefault(); n.focus(); }
  });
}
root.querySelectorAll('.zh-collapse').forEach(wireCollapse);

/* ---------- Result pages ---------- */
var RESULTS = {
  success: { label: '成功', tone: 'success', icon: 'circle-check', title: '提交成功', desc: '已通知审批人，通常 1 个工作日内处理。', actions: [['查看进度', 'primary'], ['返回列表', '']] },
  error: { label: '失败', tone: 'error', icon: 'circle-x', title: '提交失败', desc: '请检查下面的问题后重新提交。', extra: ['账号已被冻结', '当前网络不稳定，请稍后重试'], actions: [['重新提交', 'primary'], ['联系管理员', '']] },
  info: { label: '提示', tone: 'info', icon: 'info', title: '已收到你的申请', desc: '我们会在审核完成后通过邮件通知你。', actions: [['我知道了', 'primary']] },
  warning: { label: '警告', tone: 'warning', icon: 'triangle-alert', title: '部分数据未同步', desc: '有 3 条记录同步失败，可以稍后重试。', actions: [['立即重试', 'primary'], ['忽略', '']] },
  403: { label: '403', tone: 'warning', icon: 'lock', code: '403', title: '没有访问权限', desc: '你所在的角色不能查看这个页面。', actions: [['申请权限', 'primary'], ['返回首页', '']] },
  404: { label: '404', tone: 'info', icon: 'search-x', code: '404', title: '页面不存在', desc: '链接可能已失效，或者页面被移动了。', actions: [['返回首页', 'primary'], ['搜索内容', '']] },
  500: { label: '500', tone: 'error', icon: 'server-cog', code: '500', title: '服务开小差了', desc: '我们已经收到报警，正在处理。', actions: [['刷新重试', 'primary'], ['反馈问题', '']] }
};
var resSeg = root.querySelector('#resultSeg'), resCard = root.querySelector('#resultCard');
var ORDER = ['success', 'error', 'info', 'warning', '403', '404', '500'];
resSeg.innerHTML = ORDER.map(function (k, i) { return '<button data-v="' + k + '" aria-pressed="' + (i === 0) + '">' + RESULTS[k].label + '</button>'; }).join('');
function showResult(k) {
  var r = RESULTS[k];
  resSeg.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === k)); });
  resCard.dataset.tone = r.tone;
  resCard.innerHTML = (r.code ? '<div class="zh-result-code" aria-hidden="true">' + r.code + '</div>' : '') +
    '<div class="zh-result-icon">' + ZH.iconHtml(r.icon) + '</div>' +
    '<h4 class="zh-result-title">' + ZH.esc(r.title) + '</h4><p class="zh-result-desc">' + ZH.esc(r.desc) + '</p>' +
    (r.extra ? '<div class="zh-result-extra"><ul>' + r.extra.map(function (x) { return '<li>' + ZH.esc(x) + '</li>'; }).join('') + '</ul></div>' : '') +
    '<div class="zh-result-actions">' + r.actions.map(function (a) { return '<button class="zh-btn ' + a[1] + '">' + ZH.esc(a[0]) + '</button>'; }).join('') + '</div>';
  resCard.classList.remove('is-in'); void resCard.offsetWidth; resCard.classList.add('is-in');
}
resSeg.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) showResult(b.dataset.v); });
showResult('success');

/* ---------- Split panel ---------- */
var sp = root.querySelector('#spDemo'), bar = root.querySelector('#spBar'), spRead = root.querySelector('#spReadout');
var DEFAULT_SIZE = 36, MIN_PX = 160, size = DEFAULT_SIZE;
function bounds() {
  var w = sp.clientWidth || 1;
  return { min: Math.max(15, MIN_PX / w * 100), max: Math.min(85, 100 - MIN_PX / w * 100) };
}
function setSize(p) {
  var b = bounds(); size = Math.max(b.min, Math.min(b.max, p));
  sp.style.setProperty('--zh-sp-size', size + '%');
  bar.setAttribute('aria-valuenow', String(Math.round(size))); bar.setAttribute('aria-valuemin', String(Math.round(b.min))); bar.setAttribute('aria-valuemax', String(Math.round(b.max)));
  spRead.textContent = '左 ' + Math.round(size) + '% · 右 ' + Math.round(100 - size) + '%';
}
bar.addEventListener('pointerdown', function (e) {
  if (sp.classList.contains('is-collapsed')) return;
  e.preventDefault(); bar.setPointerCapture(e.pointerId); bar.classList.add('is-drag');
});
bar.addEventListener('pointermove', function (e) {
  if (!bar.classList.contains('is-drag')) return;
  var r = sp.getBoundingClientRect(); setSize((e.clientX - r.left) / r.width * 100);
});
function endDrag(e) { if (bar.classList.contains('is-drag')) { bar.classList.remove('is-drag'); try { bar.releasePointerCapture(e.pointerId); } catch (x) {} } }
bar.addEventListener('pointerup', endDrag); bar.addEventListener('pointercancel', endDrag);
bar.addEventListener('dblclick', function () { setSize(DEFAULT_SIZE); });
bar.addEventListener('keydown', function (e) {
  var step = e.shiftKey ? 10 : 2, b = bounds();
  if (e.key === 'ArrowLeft') setSize(size - step); else if (e.key === 'ArrowRight') setSize(size + step);
  else if (e.key === 'Home') setSize(b.min); else if (e.key === 'End') setSize(b.max); else return;
  e.preventDefault();
});
var toggle = root.querySelector('#spToggle');
toggle.addEventListener('click', function () {
  var collapsed = !sp.classList.contains('is-collapsed');
  if (!ZH.reduced()) { sp.classList.add('is-animating'); setTimeout(function () { sp.classList.remove('is-animating'); }, 260); }
  sp.classList.toggle('is-collapsed', collapsed);
  toggle.setAttribute('aria-expanded', String(!collapsed));
  toggle.innerHTML = ZH.iconHtml(collapsed ? 'panel-left-open' : 'panel-left-close') + (collapsed ? '展开' : '收起');
  bar.tabIndex = collapsed ? -1 : 0;
});
var DOCS = [['概览', 'layout-dashboard', '这里是概览。分隔条可以拖动，也可以用键盘调整。'], ['色彩', 'palette', '品牌色阶、语义色与图表色板。'], ['字体', 'type', '系统字体栈，B 端 14px，C 端 16px。'], ['间距', 'move', '4px 栅格，随密度缩放。'], ['动效', 'zap', '时长与缓动 Token，退出比进入更快。'], ['图标', 'sparkles', 'Lucide，24px 网格，2px 描边。']];
var list = root.querySelector('#spList'), body = root.querySelector('#spBody'), title = root.querySelector('#spTitle');
list.innerHTML = DOCS.map(function (d, i) { return '<li><button type="button" data-i="' + i + '"' + (i === 0 ? ' aria-current="true"' : '') + '>' + ZH.iconHtml(d[1]) + ZH.esc(d[0]) + '</button></li>'; }).join('');
function showDoc(i) {
  list.querySelectorAll('button').forEach(function (b) { if (+b.dataset.i === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
  title.textContent = DOCS[i][0]; body.innerHTML = '<p style="margin:0 0 8px">' + ZH.esc(DOCS[i][2]) + '</p><p class="zh-hint" style="margin:0">左右两个面板各自滚动，互不影响。</p>';
}
list.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) showDoc(+b.dataset.i); });
ZH.rovingFocus(list, 'button', { typeahead: false });
showDoc(0); setSize(DEFAULT_SIZE);
if (window.ResizeObserver) new ResizeObserver(function () { requestAnimationFrame(function () { setSize(size); }); }).observe(sp);

/* ---------- Settings panel with dirty tracking ---------- */
var ps = root.querySelector('#psDemo'), psBar = root.querySelector('#psBar'), psCount = root.querySelector('#psCount');
var ctl = [].slice.call(ps.querySelectorAll('[data-k]')), base = {};
function val(c) { return c.type === 'checkbox' ? c.checked : c.value; }
function snapshot() { ctl.forEach(function (c) { base[c.dataset.k] = val(c); }); }
function dirty() { return ctl.filter(function (c) { return val(c) !== base[c.dataset.k]; }); }
function sync() {
  var n = dirty().length; psBar.hidden = n === 0; psCount.textContent = '有 ' + n + ' 项未保存的更改';
}
ps.addEventListener('input', sync); ps.addEventListener('change', sync);
root.querySelector('#psReset').addEventListener('click', function () { ctl.forEach(function (c) { if (c.type === 'checkbox') c.checked = base[c.dataset.k]; else c.value = base[c.dataset.k]; }); sync(); });
root.querySelector('#psSave').addEventListener('click', function () { snapshot(); sync(); ZH.toast('设置已保存'); });
snapshot(); sync();

ZH.hydrateIcons(root);
