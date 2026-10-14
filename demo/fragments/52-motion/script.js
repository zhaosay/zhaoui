var root = document.getElementById('animation');
if (!root) return;
var cs = getComputedStyle(document.documentElement);
function $(sel, scope) { return (scope || root).querySelector(sel); }
function $$(sel, scope) { return [].slice.call((scope || root).querySelectorAll(sel)); }
function tok(n) { return cs.getPropertyValue(n).trim(); }
function reflow(el) { void el.offsetWidth; }
function isReduced() { return root.classList.contains('zh-reduce-motion') || ZH.reduced(); }
function copy(text) {
  function done() { ZH.toast('已复制 ' + text); }
  function fb() { var t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;top:0;left:0;opacity:0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { ZH.toast(text); } t.remove(); }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fb); else fb();
}
function onVisible(el, fn) {
  if (!('IntersectionObserver' in window)) { fn(); return; }
  var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); fn(); } }, { threshold: 0.2 });
  io.observe(el);
}

/* ---------- reduce-motion switch ---------- */
var reduceSwitch = $('#zhMoReduce');
if (ZH.reduced()) { reduceSwitch.checked = true; root.classList.add('zh-reduce-motion'); }
reduceSwitch.addEventListener('change', function () { root.classList.toggle('zh-reduce-motion', reduceSwitch.checked); });

/* ---------- token table + race ---------- */
$$('[data-tok]').forEach(function (td) { td.textContent = tok(td.getAttribute('data-tok')); });
var DURS = [['instant', '--zh-dur-instant'], ['fast', '--zh-dur-fast'], ['base', '--zh-dur-base'], ['slow', '--zh-dur-slow'], ['slower', '--zh-dur-slower']];
$('#zhMoRace').innerHTML = DURS.map(function (d) {
  var v = tok(d[1]);
  return '<div><span>' + d[0] + '</span><span class="zh-mo-track"><i style="--d:' + v + '"></i></span><span>' + v + '</span></div>';
}).join('');
function runRace() {
  $$('#zhMoRace i, #zhMoStag i').forEach(function (i) { i.classList.remove('is-run'); });
  reflow($('#zhMoRace'));
  requestAnimationFrame(function () { $$('#zhMoRace i, #zhMoStag i').forEach(function (i) { i.classList.add('is-run'); }); });
}
$('#zhMoRaceGo').addEventListener('click', runRace);
onVisible($('#zhMoRace'), runRace);

/* ---------- audience defaults ---------- */
$$('[data-mo-aud]').forEach(function (btn) {
  var wrap = btn.closest('.zh-mo-aud'), box = $('.zh-mo-abox', wrap), note = $('[data-mo-aud-note]', wrap), n = 0;
  var st = getComputedStyle(wrap);
  var d = st.getPropertyValue('--zh-mo-default').trim();
  note.textContent = '默认时长 ' + d + '　·　现有组件 --zh-motion ' + st.getPropertyValue('--zh-motion').trim();
  box.textContent = '内容 A';
  btn.addEventListener('click', function () {
    box.classList.add('is-out');
    setTimeout(function () { n++; box.textContent = '内容 ' + (n % 2 ? 'B' : 'A'); box.classList.remove('is-out'); }, isReduced() ? 0 : parseFloat(d) || 120);
  });
});

/* ---------- easing curves ---------- */
var CURVES = [
  ['standard', '--zh-ease-standard', '通用过渡：颜色、位置、尺寸的变化'],
  ['enter', '--zh-ease-enter', '进入：弹层、抽屉、提示出现（先快后慢）'],
  ['exit', '--zh-ease-exit', '退出：元素消失，配合更短的时长（先慢后快）'],
  ['spring', '--zh-ease-spring', '回弹：强调与反馈，如点赞、拖拽落位'],
  ['linear', null, '匀速：进度、持续旋转、颜色渐变']
];
function parseBezier(s) { var m = (s || '').match(/-?\d*\.?\d+/g); return m && m.length === 4 ? m.map(Number) : [0, 0, 1, 1]; }
function bez(p, s) { var u = 1 - s; return [3 * u * u * s * p[0] + 3 * u * s * s * p[2] + s * s * s, 3 * u * u * s * p[1] + 3 * u * s * s * p[3] + s * s * s]; }
function yAt(p, x) { var lo = 0, hi = 1; for (var i = 0; i < 30; i++) { var mid = (lo + hi) / 2; if (bez(p, mid)[0] < x) lo = mid; else hi = mid; } return bez(p, (lo + hi) / 2)[1]; }
var PX = function (x) { return 14 + x * 92; }, PY = function (v) { return 88 - ((v + 0.05) / 1.3) * 72; };
var curveEls = [];
$('#zhMoCurves').innerHTML = CURVES.map(function (c, idx) {
  var raw = c[1] ? tok(c[1]) : 'linear', p = c[1] ? parseBezier(raw) : [0, 0, 1, 1], pts = [];
  for (var i = 0; i <= 48; i++) { var b = bez(p, i / 48); pts.push(PX(b[0]).toFixed(1) + ',' + PY(b[1]).toFixed(1)); }
  return '<div class="zh-mo-curve" data-c="' + idx + '"><div class="zh-mo-cardhead"><b>' + c[0] + '</b><button type="button" class="zh-btn sm icon" data-mo-curve="' + idx + '" aria-label="重播 ' + c[0] + '"><i data-i="rotate-ccw"></i></button></div>' +
    '<svg viewBox="0 0 120 100" role="img" aria-label="' + c[0] + ' 缓动曲线"><line class="grid" x1="14" x2="106" y1="' + PY(0) + '" y2="' + PY(0) + '"/><line class="grid" x1="14" x2="106" y1="' + PY(1) + '" y2="' + PY(1) + '"/><line class="axis" x1="14" x2="14" y1="10" y2="' + PY(0) + '"/>' +
    '<text class="lbl" x="106" y="97" text-anchor="end">时间</text><text class="lbl" x="4" y="16">进度</text><polyline class="line" points="' + pts.join(' ') + '"/><circle class="mk" cx="' + PX(0) + '" cy="' + PY(0) + '" r="4"/></svg>' +
    '<small>' + (c[1] ? c[1] + ' · ' : '') + ZH.esc(raw) + '</small><p>' + ZH.esc(c[2]) + '</p><div class="zh-mo-lane"><i></i></div></div>';
}).join('');
ZH.hydrateIcons($('#zhMoCurves'));
$$('.zh-mo-curve').forEach(function (el, idx) {
  var c = CURVES[idx];
  curveEls.push({ el: el, p: c[1] ? parseBezier(tok(c[1])) : [0, 0, 1, 1], css: c[1] ? 'var(' + c[1] + ')' : 'linear', raf: 0 });
});
function playCurve(o) {
  var lane = $('.zh-mo-lane', o.el), dot = $('i', lane), mk = $('.mk', o.el), T = 1200;
  cancelAnimationFrame(o.raf);
  dot.classList.remove('is-run'); dot.style.transition = 'none'; reflow(dot);
  lane.style.setProperty('--zh-mo-lane-w', (lane.clientWidth - 22) + 'px');
  dot.style.transition = 'transform ' + T + 'ms ' + o.css; dot.classList.add('is-run');
  var t0 = performance.now();
  (function tick(now) {
    var t = Math.min(1, (now - t0) / T);
    mk.setAttribute('cx', PX(t)); mk.setAttribute('cy', PY(yAt(o.p, t)));
    if (t < 1) o.raf = requestAnimationFrame(tick);
  })(t0);
}
function playAll() { curveEls.forEach(playCurve); }
$('#zhMoCurvesGo').addEventListener('click', playAll);
$('#zhMoCurves').addEventListener('click', function (e) { var b = e.target.closest('[data-mo-curve]'); if (b) playCurve(curveEls[+b.getAttribute('data-mo-curve')]); });
onVisible($('#zhMoCurves'), playAll);

/* ---------- playground ---------- */
var pDur = $('#zhMoDur'), pEase = $('#zhMoEase'), pProp = $('#zhMoProp'), pBox = $('#zhMoBox'), pArena = $('#zhMoArena'), pOn = false;
var EASES = { standard: 'var(--zh-ease-standard)', enter: 'var(--zh-ease-enter)', exit: 'var(--zh-ease-exit)', spring: 'var(--zh-ease-spring)', linear: 'linear' };
var PROPS = {
  tx: { css: 'transform', js: 'transform', a: 'translateX(0)', b: function () { return 'translateX(' + Math.max(40, pArena.clientWidth - 32 - 52) + 'px)'; }, note: 'translateX(160px)', perf: ['success', '只走合成层：推荐'] },
  scale: { css: 'transform', js: 'transform', a: 'scale(1)', b: function () { return 'scale(1.6)'; }, note: 'scale(1.6)', perf: ['success', '只走合成层：推荐'] },
  rotate: { css: 'transform', js: 'transform', a: 'rotate(0)', b: function () { return 'rotate(180deg)'; }, note: 'rotate(180deg)', perf: ['success', '只走合成层：推荐'] },
  opacity: { css: 'opacity', js: 'opacity', a: '1', b: function () { return '.15'; }, note: '.15', perf: ['success', '只走合成层：推荐'] },
  bg: { css: 'background-color', js: 'backgroundColor', a: 'var(--zh-color-primary)', b: function () { return 'var(--zh-success)'; }, note: 'var(--zh-success)', perf: ['warning', '触发重绘：谨慎'] },
  width: { css: 'width', js: 'width', a: '52px', b: function () { return Math.max(80, pArena.clientWidth - 32) + 'px'; }, note: '240px', perf: ['danger', '触发布局：避免'] },
  left: { css: 'left', js: 'left', a: '16px', b: function () { return Math.max(40, pArena.clientWidth - 16 - 52) + 'px'; }, note: '160px', perf: ['danger', '触发布局：避免'] }
};
function resetBox() {
  pBox.style.transition = 'none'; pBox.style.transform = ''; pBox.style.opacity = ''; pBox.style.backgroundColor = ''; pBox.style.width = ''; pBox.style.left = '';
  reflow(pBox); pOn = false;
}
function writeCode() {
  var pr = PROPS[pProp.value];
  $('#zhMoCode').textContent = '.box {\n  transition: ' + pr.css + ' ' + pDur.value + 'ms ' + EASES[pEase.value] + ';\n}\n.box.is-on {\n  ' + pr.css + ': ' + pr.note + ';\n}';
  var perf = $('#zhMoPerf'); perf.className = 'zh-tag ' + pr.perf[0]; perf.textContent = pr.perf[1];
  $('#zhMoDurOut').textContent = pDur.value + 'ms';
}
function playBox() {
  var pr = PROPS[pProp.value];
  pOn = !pOn;
  pBox.style.transition = pr.css + ' ' + pDur.value + 'ms ' + EASES[pEase.value];
  pBox.style[pr.js] = pOn ? pr.b() : pr.a;
}
[pDur, pEase].forEach(function (c) { c.addEventListener('input', function () { writeCode(); playBox(); }); c.addEventListener('change', function () { writeCode(); }); });
pProp.addEventListener('change', function () { resetBox(); writeCode(); setTimeout(playBox, 30); });
$('#zhMoPlay').addEventListener('click', playBox);
$('#zhMoDurQuick').addEventListener('click', function (e) { var b = e.target.closest('[data-v]'); if (!b) return; pDur.value = b.getAttribute('data-v'); writeCode(); playBox(); });
writeCode();

/* ---------- transition recipes ---------- */
function setT(el, enter) {
  el.style.setProperty('--zh-mo-dur', enter ? 'var(--zh-dur-base)' : 'calc(var(--zh-dur-base) * .7)');
  el.style.setProperty('--zh-mo-ease', enter ? 'var(--zh-ease-enter)' : 'var(--zh-ease-exit)');
}
function cycle(kind) {
  $$('[data-mo="' + kind + '"]').forEach(function (el) {
    clearTimeout(el._t1); clearTimeout(el._t2);
    el.classList.add('no-anim', 'is-out'); reflow(el); el.classList.remove('no-anim');
    setT(el, true); el.classList.remove('is-out');
    el._t1 = setTimeout(function () {
      setT(el, false); el.classList.add('is-out');
      el._t2 = setTimeout(function () { setT(el, true); el.classList.remove('is-out'); }, 600);
    }, 1100);
  });
}
root.addEventListener('click', function (e) { var b = e.target.closest('[data-mo-cycle]'); if (b) cycle(b.getAttribute('data-mo-cycle')); });

var colBtn = $('#zhMoCollapseBtn'), col = $('#zhMoCollapse');
colBtn.addEventListener('click', function () { var closed = col.classList.toggle('is-closed'); colBtn.setAttribute('aria-expanded', String(!closed)); });
var flipEl = $('#zhMoFlip');
$('#zhMoFlipBtn').addEventListener('click', function () { flipEl.classList.toggle('is-flipped'); });
flipEl.addEventListener('click', function () { flipEl.classList.toggle('is-flipped'); });

var pages = $$('.zh-mo-page', $('#zhMoPages')), pIdx = 0, stepBtns = $$('[data-mo-step]');
function showStep() {
  pages.forEach(function (p, i) {
    p.classList.toggle('is-active', i === pIdx); p.classList.toggle('is-before', i < pIdx); p.classList.toggle('is-after', i > pIdx);
    p.setAttribute('aria-hidden', String(i !== pIdx));
  });
  stepBtns.forEach(function (b) { var n = pIdx + +b.getAttribute('data-mo-step'); b.disabled = n < 0 || n >= pages.length; });
}
stepBtns.forEach(function (b) { b.addEventListener('click', function () { pIdx = Math.max(0, Math.min(pages.length - 1, pIdx + +b.getAttribute('data-mo-step'))); showStep(); }); });
showStep();

var ROUTES = [['layout-dashboard', '概览', '128 台设备在线'], ['monitor', '设备', '3 台需要关注'], ['settings', '设置', '主题、通知与权限']];
var xf = $('#zhMoXfade'), layers = [document.createElement('div'), document.createElement('div')], cur = 0;
layers.forEach(function (l) { l.className = 'zh-mo-layer'; xf.appendChild(l); });
function fillLayer(l, r) { l.innerHTML = ZH.iconHtml(r[0], 28) + '<div><b>' + ZH.esc(r[1]) + '</b><small>' + ZH.esc(r[2]) + '</small></div>'; }
fillLayer(layers[0], ROUTES[0]); layers[0].classList.add('is-in');
$('#zhMoRouteTabs').addEventListener('click', function (e) {
  var b = e.target.closest('[data-r]'); if (!b) return;
  var i = +b.getAttribute('data-r'), nxt = 1 - cur;
  if (b.classList.contains('primary')) return;
  $$('#zhMoRouteTabs .zh-btn').forEach(function (x) { x.classList.toggle('primary', x === b); x.setAttribute('aria-current', x === b ? 'page' : 'false'); });
  fillLayer(layers[nxt], ROUTES[i]);
  layers[cur].classList.remove('is-in'); layers[nxt].classList.add('is-in'); cur = nxt;
});

/* list: stagger enter, leave, FLIP reorder */
var list = $('#zhMoList'), LI = ['部署到预发环境', '等待审核', '发布 v2.4', '回滚检查', '通知相关同学'], items = LI.map(function (t, i) { return { id: i, t: t }; }), nextId = LI.length;
function renderList(enter) {
  list.innerHTML = items.map(function (it, i) { return '<li data-id="' + it.id + '"' + (enter ? ' class="is-enter" style="--i:' + Math.min(i, 8) + '"' : '') + '>' + ZH.iconHtml('grip-vertical', 16) + '<span>' + ZH.esc(it.t) + '</span></li>'; }).join('');
  $('[data-mo-list="remove"]').disabled = items.length < 2;
  $('[data-mo-list="add"]').disabled = items.length >= 8;
}
function tops() { var m = {}; $$('li', list).forEach(function (li) { m[li.getAttribute('data-id')] = li.getBoundingClientRect().top; }); return m; }
function flip(before) {
  if (isReduced()) return;
  $$('li', list).forEach(function (li) {
    var b = before[li.getAttribute('data-id')]; if (b == null) return;
    var d = b - li.getBoundingClientRect().top; if (!d) return;
    li.style.transition = 'none'; li.style.transform = 'translateY(' + d + 'px)'; reflow(li);
    li.style.transition = 'transform var(--zh-dur-base) var(--zh-ease-standard)'; li.style.transform = '';
  });
}
renderList(false);
onVisible(list, function () { renderList(true); });
root.addEventListener('click', function (e) {
  var b = e.target.closest('[data-mo-list]'); if (!b) return;
  var a = b.getAttribute('data-mo-list'), before;
  if (a === 'add') {
    before = tops(); items.unshift({ id: nextId, t: '新任务 ' + nextId }); nextId++; renderList(false);
    var first = list.firstElementChild; first.classList.add('is-enter'); first.style.setProperty('--i', 0); flip(before);
  } else if (a === 'remove') {
    var victim = list.children[1]; if (!victim) return;
    victim.classList.add('is-leave');
    setTimeout(function () { before = tops(); items.splice(1, 1); renderList(false); flip(before); }, isReduced() ? 120 : 150);
  } else if (a === 'shuffle') {
    before = tops();
    for (var i = items.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = items[i]; items[i] = items[j]; items[j] = t; }
    renderList(false); flip(before);
  } else if (a === 'replay') { renderList(true); }
});

/* ---------- keyframe library ---------- */
var chip = function (c, x) { return '<div class="zh-mo-chip' + (c ? ' ' + c : '') + '"' + (x || '') + '>Aa</div>'; };
var TILES = [
  { c: 'fade-in', once: 1, vis: function (c) { return chip(); } },
  { c: 'fade-out', once: 1, restore: 1, vis: function () { return chip(); } },
  { c: 'slide-up', once: 1, vis: function () { return chip(); } },
  { c: 'slide-down', once: 1, vis: function () { return chip(); } },
  { c: 'scale-in', once: 1, vis: function () { return chip(); } },
  { c: 'pop', once: 1, vis: function () { return chip(); } },
  { c: 'shake', once: 1, vis: function () { return chip('', ' style="border-color:var(--zh-danger-border);background:var(--zh-danger-bg-subtle);color:var(--zh-text-danger)"'); } },
  { c: 'pulse', vis: function (c) { return '<span class="zh-mo-dot ' + c + ' loop"></span>'; } },
  { c: 'ping', vis: function (c) { return '<span class="zh-mo-dot ' + c + ' loop"></span>'; } },
  { c: 'bounce', vis: function (c) { return '<span class="zh-mo-dot ' + c + ' loop"></span>'; } },
  { c: 'spin', vis: function (c) { return '<i data-i="loader-circle" data-s="30" class="' + c + ' loop"></i>'; } },
  { c: 'float', vis: function (c) { return '<div class="zh-mo-chip ' + c + ' loop">Aa</div>'; } },
  { c: 'wiggle', vis: function (c) { return '<i data-i="bell" data-s="30" class="' + c + ' loop"></i>'; } },
  { c: 'heartbeat', vis: function (c) { return '<i data-i="heart" data-s="30" class="' + c + ' loop" style="fill:currentColor;color:var(--zh-text-danger)"></i>'; } },
  { c: 'shimmer', vis: function (c) { return '<div class="' + c + ' loop" style="width:120px;height:14px;border-radius:7px"></div>'; } },
  { c: 'wave', vis: function (c) { return '<span class="' + c + ' loop"><i></i><i></i><i></i><i></i><i></i></span>'; } },
  { c: 'typing-dots', vis: function (c) { return '<span class="' + c + ' loop"><i></i><i></i><i></i></span>'; } },
  { c: 'draw-check', once: 1, vis: function (c) { return '<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--zh-text-success)"><circle cx="12" cy="12" r="10" opacity=".25"/><g class="zh-anim-draw-check"><path pathLength="30" d="M7 12.5l3.5 3.5L17 9"/></g></svg>'; } }
];
$('#zhMoTiles').innerHTML = TILES.map(function (t, i) {
  var cls = 'zh-anim-' + t.c;
  return '<div class="zh-mo-tile" data-i="' + i + '"><div class="vis">' + t.vis(t.once ? '' : cls) + '</div><div class="meta"><button type="button" class="cls" data-copy="' + cls + '" title="复制类名">.' + cls + '</button>' +
    '<button type="button" class="zh-btn icon sm" data-act aria-label="' + (t.once ? '重播 ' : '播放 ') + t.c + '"' + (t.once ? '' : ' aria-pressed="false"') + '>' + ZH.iconHtml(t.once ? 'rotate-ccw' : 'play', 14) + '</button></div></div>';
}).join('');
ZH.hydrateIcons($('#zhMoTiles'));
function replayTile(tile, t) {
  var cls = 'zh-anim-' + t.c, target = t.c === 'draw-check' ? $('.zh-anim-draw-check', tile) || $('g', tile) : $('.vis > *', tile);
  clearTimeout(tile._t);
  target.classList.remove(cls); if (t.c === 'draw-check') target.classList.remove('zh-anim-draw-check');
  reflow(target); target.classList.add(cls);
  if (t.restore) tile._t = setTimeout(function () { target.classList.remove(cls); }, 1500);
}
$('#zhMoTiles').addEventListener('click', function (e) {
  var c = e.target.closest('[data-copy]'); if (c) { copy(c.getAttribute('data-copy')); return; }
  var b = e.target.closest('[data-act]'); if (!b) return;
  var tile = b.closest('.zh-mo-tile'), t = TILES[+tile.getAttribute('data-i')];
  if (t.once) { replayTile(tile, t); return; }
  tile._pin = !tile._pin; tile.classList.toggle('is-on', tile._pin); b.setAttribute('aria-pressed', String(tile._pin));
  b.innerHTML = ZH.iconHtml(tile._pin ? 'pause' : 'play', 14);
});
$$('.zh-mo-tile', $('#zhMoTiles')).forEach(function (tile) {
  var t = TILES[+tile.getAttribute('data-i')];
  if (t.once) return;
  tile.addEventListener('mouseenter', function () { tile.classList.add('is-on'); });
  tile.addEventListener('mouseleave', function () { if (!tile._pin) tile.classList.remove('is-on'); });
});

/* ---------- micro-interactions ---------- */
var like = $('#zhMoLike'), likeN = $('#zhMoLikeN'), likes = 128;
like.addEventListener('click', function () {
  var on = like.classList.toggle('is-liked');
  like.setAttribute('aria-pressed', String(on)); likes += on ? 1 : -1; likeN.textContent = likes;
  if (on) { like.classList.remove('is-bursting'); reflow(like); like.classList.add('is-bursting'); clearTimeout(like._t); like._t = setTimeout(function () { like.classList.remove('is-bursting'); }, 900); }
});

function countUp() {
  $$('[data-mo-count]').forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-mo-count')), dec = +(el.getAttribute('data-dec') || 0);
    var fmt = function (v) { return v.toLocaleString('zh-CN', { minimumFractionDigits: dec, maximumFractionDigits: dec }); };
    cancelAnimationFrame(el._raf);
    if (isReduced()) { el.textContent = fmt(target); return; }
    var t0 = performance.now(), T = 900;
    (function tick(now) {
      var t = Math.min(1, (now - t0) / T), v = t === 1 ? target : target * (1 - Math.pow(2, -10 * t));
      el.textContent = fmt(v);
      if (t < 1) el._raf = requestAnimationFrame(tick);
    })(t0);
  });
}
$('#zhMoCountGo').addEventListener('click', countUp);
onVisible($('#zhMoCountGo'), countUp);

var prog = $('#zhMoProg'), progN = $('#zhMoProgN');
root.addEventListener('click', function (e) {
  var b = e.target.closest('[data-mo-prog]'); if (!b) return;
  var v = +b.getAttribute('data-mo-prog');
  prog.style.setProperty('--p', v / 100); prog.setAttribute('aria-valuenow', v); progN.textContent = v + '%';
});

/* ---------- scroll reveal ---------- */
var scroller = $('#zhMoScroller'), io;
var REV = [['rocket', '发布上线', '灰度 10% → 全量'], ['shield-check', '安全扫描', '0 个高危漏洞'], ['activity', '性能监控', 'P95 延迟 38ms'], ['users', '团队协作', '12 位成员在线'], ['bell-ring', '告警规则', '3 条规则已启用'], ['database', '数据备份', '每日 03:00 自动'], ['git-branch', '分支策略', 'main 受保护'], ['sparkles', '智能建议', '发现 2 处可优化']];
function buildReveal() {
  if (io) io.disconnect();
  scroller.scrollTop = 0;
  scroller.innerHTML = REV.map(function (r) { return '<div class="zh-mo-reveal">' + ZH.iconHtml(r[0], 20) + '<div><b>' + ZH.esc(r[1]) + '</b><div class="zh-hint" style="margin:0">' + ZH.esc(r[2]) + '</div></div></div>'; }).join('');
  var els = [].slice.call(scroller.children);
  if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
  io = new IntersectionObserver(function (es) {
    var vis = es.filter(function (x) { return x.isIntersecting; }).map(function (x) { return x.target; }).sort(function (a, b) { return els.indexOf(a) - els.indexOf(b); });
    vis.forEach(function (el, k) { el.style.setProperty('--i', Math.min(k, 8)); el.classList.add('is-in'); io.unobserve(el); });
  }, { root: scroller, threshold: 0.15 });
  els.forEach(function (el) { io.observe(el); });
}
buildReveal();
$('#zhMoRevealGo').addEventListener('click', buildReveal);

/* ---------- skeleton ---------- */
var swap = $('#zhMoSwap');
$('#zhMoSkelGo').addEventListener('click', function () { var loaded = swap.classList.toggle('is-loaded'); swap.setAttribute('aria-busy', String(!loaded)); });
