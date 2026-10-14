var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
var sec = document.getElementById('preview');
ZH.hydrateIcons(sec);
var esc = ZH.esc;

/* ---------- self-generated artwork (SVG data URIs, no network) ---------- */
function rng(seed) { var a = seed * 2654435761 >>> 0; return function () { a += 0x6D2B79F5; var t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var HUES = [265, 200, 340, 32, 150, 285, 12, 222];
function art(i, w, h) {
  var r = rng(i + 7), h1 = HUES[i % HUES.length], h2 = (h1 + 46 + Math.floor(r() * 40)) % 360, blur = Math.round(Math.max(w, h) / 45), s = '';
  for (var k = 0; k < 5; k++) {
    var cx = Math.round(r() * w), cy = Math.round(r() * h), rad = Math.round((0.1 + r() * 0.22) * Math.max(w, h)), hh = (h1 + Math.round(r() * 90)) % 360;
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + rad + '" fill="hsl(' + hh + ',85%,' + (55 + Math.round(r() * 25)) + '%)" opacity="' + (0.25 + r() * 0.35).toFixed(2) + '"/>';
  }
  var arcs = '';
  for (var j = 0; j < 4; j++) {
    var ay = Math.round(h * (0.25 + j * 0.16)), amp = Math.round(h * (0.05 + r() * 0.09));
    arcs += '<path d="M0 ' + ay + ' C ' + Math.round(w * 0.3) + ' ' + (ay - amp) + ', ' + Math.round(w * 0.6) + ' ' + (ay + amp) + ', ' + w + ' ' + (ay - amp / 2) + '" fill="none" stroke="rgba(255,255,255,' + (0.14 + j * 0.05).toFixed(2) + ')" stroke-width="' + Math.max(2, Math.round(w / 500)) + '"/>';
  }
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '"><defs>' +
    '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(' + h1 + ',72%,58%)"/><stop offset="1" stop-color="hsl(' + h2 + ',78%,40%)"/></linearGradient>' +
    '<radialGradient id="a" cx=".22" cy=".18" r=".65"><stop offset="0" stop-color="hsl(' + h2 + ',95%,82%)" stop-opacity=".85"/><stop offset="1" stop-color="hsl(' + h2 + ',95%,82%)" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="b" cx=".82" cy=".88" r=".6"><stop offset="0" stop-color="hsl(' + h1 + ',80%,22%)" stop-opacity=".75"/><stop offset="1" stop-color="hsl(' + h1 + ',80%,22%)" stop-opacity="0"/></radialGradient>' +
    '<filter id="f" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="' + blur + '"/></filter></defs>' +
    '<rect width="' + w + '" height="' + h + '" fill="url(#g)"/><g filter="url(#f)">' + s + '</g><rect width="' + w + '" height="' + h + '" fill="url(#a)"/><rect width="' + w + '" height="' + h + '" fill="url(#b)"/>' + arcs + '</svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
var GALLERY = [
  { t: '晨雾', w: 1200, h: 800 }, { t: '深海', w: 1200, h: 800 }, { t: '蔷薇', w: 960, h: 1200 }, { t: '暮光', w: 1280, h: 720 },
  { t: '森林', w: 1000, h: 1000 }, { t: '极光', w: 1200, h: 800 }, { t: '余烬', w: 1200, h: 900 }, { t: '远山', w: 1280, h: 720 }
].map(function (g, i) { g.i = i; g.src = art(i, g.w, g.h); return g; });

/* ---------- Image states ---------- */
var BROKEN = 'data:image/png;base64,AAAA';
function setupImg(fig) {
  var kind = fig.getAttribute('data-zh-img'), img = $('img', fig), i = +(fig.getAttribute('data-art') || 0), timer = null;
  function state(s) { fig.setAttribute('data-state', s); if (s === 'loading') fig.setAttribute('aria-busy', 'true'); else fig.removeAttribute('aria-busy'); }
  function load(delay, src) {
    clearTimeout(timer); state('loading'); img.removeAttribute('src');
    timer = setTimeout(function () { img.src = src || art(i, 600, 450); }, delay);
  }
  img.addEventListener('load', function () { state('loaded'); });
  img.addEventListener('error', function () { if (img.getAttribute('src')) state('error'); });
  $('[data-retry]', fig).addEventListener('click', function () { load(500); });
  fig.zhStart = function () {
    if (kind === 'ok') load(0);
    else if (kind === 'slow') load(1800);
    else if (kind === 'broken') { state('loading'); setTimeout(function () { img.src = BROKEN; }, 600); }
    else state('placeholder');
  };
  fig.zhStart();
}
$$('[data-zh-img]', sec).forEach(setupImg);
$('#zhImgReload').addEventListener('click', function () { $('[data-zh-img="slow"]', sec).zhStart(); });
$('#zhImgBreak').addEventListener('click', function () { $('[data-zh-img="broken"]', sec).zhStart(); });
$$('[data-zh-fit]', sec).forEach(function (fig) {
  var img = $('img', fig), frame = $('.zh-img-frame', fig), i = +(fig.getAttribute('data-art') || 3), wide = fig.getAttribute('data-zh-fit') !== 'cover' || !fig.hasAttribute('data-art');
  frame.style.setProperty('--zh-img-fit', fig.getAttribute('data-zh-fit'));
  img.addEventListener('load', function () { fig.setAttribute('data-state', 'loaded'); });
  img.src = wide ? art(3, 1280, 720) : art(i, 800, 800);
});

/* ---------- Lightbox ---------- */
var locks = 0;
function lockScroll() { if (!locks++) document.documentElement.style.overflow = 'hidden'; }
function unlockScroll() { if (!--locks) document.documentElement.style.overflow = ''; }
var lastTrigger = null, lastClickAt = 0;
document.addEventListener('click', function (e) { lastTrigger = e.target.closest ? e.target.closest('button, a, [tabindex]') : null; lastClickAt = Date.now(); }, true);

function lightbox(items, start, opener) {
  var fsOK = document.fullscreenEnabled || document.webkitFullscreenEnabled;
  var root = document.createElement('div');
  root.className = 'zh-lb'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', '图片查看器'); root.tabIndex = -1;
  var btn = function (k, label, icon, extra) { return '<button type="button" class="zh-lb-btn" data-lb="' + k + '" aria-label="' + label + '" title="' + label + '"' + (extra || '') + '>' + ZH.iconHtml(icon) + '</button>'; };
  root.innerHTML =
    '<div class="zh-lb-top"><div class="zh-lb-count"></div><div class="zh-lb-tools" role="toolbar" aria-label="图片操作">' +
    btn('out', '缩小', 'zoom-out') + '<button type="button" class="zh-lb-btn zh-lb-pct" data-lb="reset" aria-label="重置缩放" title="重置缩放">100%</button>' + btn('in', '放大', 'zoom-in') + '<i class="zh-lb-sep"></i>' +
    btn('ccw', '逆时针旋转', 'rotate-ccw') + btn('cw', '顺时针旋转', 'rotate-cw') + btn('fliph', '水平翻转', 'flip-horizontal') + btn('flipv', '垂直翻转', 'flip-vertical') + '<i class="zh-lb-sep"></i>' +
    '<a class="zh-lb-btn" data-lb="dl" aria-label="下载图片" title="下载图片" download="image.svg" href="#">' + ZH.iconHtml('download') + '</a>' +
    (fsOK ? btn('fs', '全屏', 'maximize') : '') + btn('close', '关闭', 'x') + '</div></div>' +
    '<div class="zh-lb-stage"><img class="zh-lb-img" alt="" draggable="false"></div>' +
    '<button type="button" class="zh-lb-nav zh-lb-prev" data-lb="prev" aria-label="上一张">' + ZH.iconHtml('chevron-left') + '</button>' +
    '<button type="button" class="zh-lb-nav zh-lb-next" data-lb="next" aria-label="下一张">' + ZH.iconHtml('chevron-right') + '</button>' +
    '<div class="zh-lb-thumbs" role="group" aria-label="缩略图">' + items.map(function (g, i) { return '<button type="button" class="zh-lb-thumb" data-i="' + i + '" aria-label="第 ' + (i + 1) + ' 张：' + esc(g.t) + '"><img alt="" src="' + g.src + '" draggable="false"></button>'; }).join('') + '</div>' +
    '<div class="zh-lb-live" aria-live="polite"></div>';
  var stage = $('.zh-lb-stage', root), img = $('.zh-lb-img', root), pct = $('.zh-lb-pct', root), count = $('.zh-lb-count', root), live = $('.zh-lb-live', root);
  var thumbs = $$('.zh-lb-thumb', root), prev = $('[data-lb="prev"]', root), next = $('[data-lb="next"]', root), dl = $('[data-lb="dl"]', root);
  var st = { i: 0, s: 1, rot: 0, fx: 1, fy: 1, x: 0, y: 0 }, fit = { w: 0, h: 0 }, closed = false;

  function stageSize() {
    var r = stage.getBoundingClientRect(), cs = getComputedStyle(stage), pt = parseFloat(cs.paddingTop) || 0, pb = parseFloat(cs.paddingBottom) || 0;
    return { w: r.width, h: r.height - pt - pb, l: r.left, t: r.top + pt };
  }
  function computeFit() {
    var ss = stageSize(), nw = img.naturalWidth || items[st.i].w, nh = img.naturalHeight || items[st.i].h;
    var k = Math.min(ss.w / nw, ss.h / nh, 1); fit.w = nw * k; fit.h = nh * k;
    img.style.width = fit.w + 'px'; img.style.height = fit.h + 'px';
  }
  function odd() { return Math.abs(st.rot / 90) % 2 === 1; }
  function eff() { var ss = stageSize(); return st.s * (odd() ? Math.min(ss.w / fit.h, ss.h / fit.w, 1) : 1); }
  function clamp() {
    var ss = stageSize(), e = eff(), bw = (odd() ? fit.h : fit.w) * e, bh = (odd() ? fit.w : fit.h) * e;
    var mx = Math.max(0, (bw - ss.w) / 2), my = Math.max(0, (bh - ss.h) / 2);
    st.x = Math.max(-mx, Math.min(mx, st.x)); st.y = Math.max(-my, Math.min(my, st.y));
  }
  function paint() {
    clamp();
    img.style.transform = 'translate3d(' + st.x + 'px,' + st.y + 'px,0) rotate(' + st.rot + 'deg) scale(' + (st.fx * eff()) + ',' + (st.fy * eff()) + ')';
    pct.textContent = Math.round(st.s * 100) + '%';
    stage.classList.toggle('is-zoomed', st.s > 1.001);
  }
  function zoomTo(ns, cx, cy) {
    ns = Math.max(0.5, Math.min(8, ns));
    var k = ns / st.s; st.x = cx - (cx - st.x) * k; st.y = cy - (cy - st.y) * k; st.s = ns; paint();
  }
  function reset() { st.s = 1; st.rot = 0; st.fx = 1; st.fy = 1; st.x = 0; st.y = 0; paint(); }
  function show(i, initial) {
    st.i = Math.max(0, Math.min(items.length - 1, i));
    var g = items[st.i];
    count.innerHTML = '<b>' + (st.i + 1) + ' / ' + items.length + '</b> · ' + esc(g.t);
    live.textContent = '第 ' + (st.i + 1) + ' 张，共 ' + items.length + ' 张：' + g.t;
    thumbs.forEach(function (t, k) { if (k === st.i) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current'); });
    prev.disabled = st.i === 0; next.disabled = st.i === items.length - 1;
    dl.href = g.src; dl.setAttribute('download', g.t + '.svg');
    img.alt = g.t;
    st.s = 1; st.rot = 0; st.fx = 1; st.fy = 1; st.x = 0; st.y = 0;
    function ready() { computeFit(); paint(); img.style.opacity = 1; }
    if (initial) { img.onload = ready; img.src = g.src; if (img.complete) ready(); }
    else { img.style.opacity = 0; setTimeout(function () { img.onload = ready; img.src = g.src; if (img.complete) ready(); }, ZH.reduced() ? 0 : 110); }
    var t = thumbs[st.i]; if (t && t.scrollIntoView) t.scrollIntoView({ block: 'nearest', inline: 'center' });
    [st.i - 1, st.i + 1].forEach(function (n) { if (items[n]) new Image().src = items[n].src; });
  }
  function go(d) { var n = st.i + d; if (n >= 0 && n < items.length) show(n); }
  function toggleFs() {
    var doc = document, cur = doc.fullscreenElement || doc.webkitFullscreenElement;
    if (cur) (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc);
    else (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
  }
  function fsChange() {
    var b = $('[data-lb="fs"]', root); if (!b) return;
    var on = !!(document.fullscreenElement || document.webkitFullscreenElement);
    b.innerHTML = ZH.iconHtml(on ? 'minimize' : 'maximize'); b.setAttribute('aria-label', on ? '退出全屏' : '全屏');
  }
  function close() {
    if (closed) return; closed = true;
    if (document.fullscreenElement || document.webkitFullscreenElement) { try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) { /* ignore */ } }
    document.removeEventListener('fullscreenchange', fsChange); document.removeEventListener('webkitfullscreenchange', fsChange); window.removeEventListener('resize', onResize);
    root.classList.remove('is-open'); release && release(); unlockScroll();
    setTimeout(function () { root.remove(); }, ZH.reduced() ? 0 : 200);
    if (opener && opener.focus && document.contains(opener)) opener.focus();
  }
  function onResize() { computeFit(); paint(); }

  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-lb]'), th = e.target.closest('.zh-lb-thumb');
    if (th) return show(+th.getAttribute('data-i'));
    if (!b) return;
    var k = b.getAttribute('data-lb');
    if (k === 'close') close(); else if (k === 'prev') go(-1); else if (k === 'next') go(1);
    else if (k === 'in') zoomTo(st.s * 1.25, 0, 0); else if (k === 'out') zoomTo(st.s / 1.25, 0, 0);
    else if (k === 'reset') reset();
    else if (k === 'cw') { st.rot += 90; paint(); } else if (k === 'ccw') { st.rot -= 90; paint(); }
    else if (k === 'fliph') { st.fx *= -1; paint(); } else if (k === 'flipv') { st.fy *= -1; paint(); }
    else if (k === 'fs') toggleFs();
  });
  root.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'Tab') {
      e.preventDefault(); e.stopImmediatePropagation();
      var f = $$('button:not([disabled]), a[href]', root).filter(function (n) { return n.getClientRects().length; });
      if (!f.length) return;
      var at = f.indexOf(document.activeElement);
      f[(at + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      return;
    }
    if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); return close(); }
    if (e.target.closest && e.target.closest('input, textarea, select')) return;
    if (k === 'ArrowLeft') { e.preventDefault(); go(-1); } else if (k === 'ArrowRight') { e.preventDefault(); go(1); }
    else if (k === '+' || k === '=') { e.preventDefault(); zoomTo(st.s * 1.25, 0, 0); } else if (k === '-' || k === '_') { e.preventDefault(); zoomTo(st.s / 1.25, 0, 0); }
    else if (k === '0') { e.preventDefault(); reset(); }
    else if (k === 'r') { st.rot += 90; paint(); } else if (k === 'R') { st.rot -= 90; paint(); }
    else if (k === 'h' || k === 'H') { st.fx *= -1; paint(); } else if (k === 'v' || k === 'V') { st.fy *= -1; paint(); }
  });
  stage.addEventListener('wheel', function (e) {
    e.preventDefault();
    var ss = stageSize(); zoomTo(st.s * Math.exp(-e.deltaY * 0.0015), e.clientX - (ss.l + ss.w / 2), e.clientY - (ss.t + ss.h / 2));
  }, { passive: false });
  stage.addEventListener('dblclick', function (e) {
    var ss = stageSize();
    if (st.s > 1.001) { st.s = 1; st.x = 0; st.y = 0; paint(); } else zoomTo(2.5, e.clientX - (ss.l + ss.w / 2), e.clientY - (ss.t + ss.h / 2));
  });

  /* pointers: pan when zoomed, swipe when not, pinch with two fingers */
  var ptrs = {}, drag = null, pinch = null, moved = 0, downOnBackdrop = false;
  function dist() { var a = Object.keys(ptrs).map(function (k) { return ptrs[k]; }); return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); }
  stage.addEventListener('pointerdown', function (e) {
    if (e.button && e.pointerType === 'mouse') return;
    ptrs[e.pointerId] = { x: e.clientX, y: e.clientY }; try { stage.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
    moved = 0; if (Object.keys(ptrs).length === 1) downOnBackdrop = e.target === stage;
    if (Object.keys(ptrs).length === 2) { pinch = { d: dist(), s: st.s }; drag = null; }
    else drag = { x: e.clientX, y: e.clientY, ox: st.x, oy: st.y, zoomed: st.s > 1.001 };
    stage.classList.add('is-dragging');
  });
  stage.addEventListener('pointermove', function (e) {
    if (!ptrs[e.pointerId]) return;
    ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (pinch && Object.keys(ptrs).length === 2) { zoomTo(pinch.s * dist() / pinch.d, 0, 0); return; }
    if (!drag) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y; moved = Math.max(moved, Math.hypot(dx, dy));
    if (drag.zoomed) { st.x = drag.ox + dx; st.y = drag.oy + dy; paint(); }
    else { st.x = dx * 0.6; st.y = 0; paint(); }
  });
  function end(e) {
    if (!ptrs[e.pointerId]) return;
    var d = drag; delete ptrs[e.pointerId];
    if (Object.keys(ptrs).length < 2) pinch = null;
    if (Object.keys(ptrs).length === 0) {
      stage.classList.remove('is-dragging');
      if (d && !d.zoomed) {
        var dx = e.clientX - d.x, dy = e.clientY - d.y;
        st.x = 0; st.y = 0;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { paint(); go(dx < 0 ? 1 : -1); } else paint();
      }
      if (moved < 4 && downOnBackdrop) close();
      drag = null;
    }
  }
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);

  document.body.appendChild(root);
  lockScroll();
  var release = ZH.trapFocus(root);
  root.focus();
  document.addEventListener('fullscreenchange', fsChange); document.addEventListener('webkitfullscreenchange', fsChange); window.addEventListener('resize', onResize);
  show(start, true);
  requestAnimationFrame(function () { root.classList.add('is-open'); });
  return { close: close, root: root };
}

/* gallery */
var gal = $('#zhGal');
gal.innerHTML = GALLERY.map(function (g, i) {
  return '<button type="button" role="listitem" class="zh-gal-item" data-i="' + i + '" aria-label="预览第 ' + (i + 1) + ' 张：' + esc(g.t) + '"><img alt="" loading="lazy" src="' + art(g.i, 480, 480) + '"><span>' + esc(g.t) + '</span></button>';
}).join('');
gal.addEventListener('click', function (e) {
  var b = e.target.closest('.zh-gal-item'); if (!b) return;
  var opener = lastTrigger && Date.now() - lastClickAt < 800 ? lastTrigger : b;
  lightbox(GALLERY, +b.getAttribute('data-i'), opener);
});

/* ---------- Carousel ---------- */
var SLIDES = [
  { t: '晨雾', s: '清晨的第一缕光穿过山谷', i: 0 }, { t: '深海', s: '沉入蓝色的最深处', i: 1 }, { t: '蔷薇', s: '柔和的粉紫色渐变', i: 2 },
  { t: '暮光', s: '日落之后的十分钟', i: 3 }, { t: '森林', s: '安静的绿意', i: 4 }
];
function carousel(host, o) {
  o = Object.assign({ effect: 'slide', autoplay: false, interval: 4000, loop: true, label: '精选图片' }, o);
  var n = SLIDES.length, idx = 0, timer = null, userPaused = false, hover = false, dragging = false, reduced = ZH.reduced();
  var playing = o.autoplay && !reduced;
  var car = document.createElement('div');
  car.className = 'zh-car'; car.tabIndex = 0; car.setAttribute('data-effect', o.effect); car.dataset.interval = o.interval;
  car.setAttribute('role', 'region'); car.setAttribute('aria-roledescription', 'carousel'); car.setAttribute('aria-label', o.label);
  car.innerHTML =
    '<div class="zh-car-viewport"><div class="zh-car-track">' + SLIDES.map(function (s, k) {
      return '<div class="zh-car-slide" role="group" aria-roledescription="slide" aria-label="第 ' + (k + 1) + ' 张，共 ' + n + ' 张"><img alt="' + esc(s.t) + '：' + esc(s.s) + '" draggable="false" src="' + art(s.i, 1600, 600) + '"><div class="zh-car-cap"><strong>' + esc(s.t) + '</strong><span>' + esc(s.s) + '</span></div></div>';
    }).join('') + '</div></div>' +
    '<button type="button" class="zh-car-arrow zh-car-prev" aria-label="上一张">' + ZH.iconHtml('chevron-left', 20) + '</button>' +
    '<button type="button" class="zh-car-arrow zh-car-next" aria-label="下一张">' + ZH.iconHtml('chevron-right', 20) + '</button>' +
    '<div class="zh-car-bar"><div class="zh-car-dots" role="tablist" aria-label="选择幻灯片">' + SLIDES.map(function (s, k) { return '<button type="button" class="zh-car-dot" role="tab" aria-label="第 ' + (k + 1) + ' 张：' + esc(s.t) + '"></button>'; }).join('') + '</div>' +
    (o.autoplay && !reduced ? '<button type="button" class="zh-car-play" aria-label="暂停自动播放">' + ZH.iconHtml('pause') + '</button>' : '') + '</div>';
  host.appendChild(car);
  var track = $('.zh-car-track', car), slides = $$('.zh-car-slide', car), dots = $$('.zh-car-dot', car), prev = $('.zh-car-prev', car), next = $('.zh-car-next', car), play = $('.zh-car-play', car), vp = $('.zh-car-viewport', car);

  function render() {
    if (o.effect === 'slide') track.style.transform = 'translateX(' + (-idx * 100) + '%)';
    slides.forEach(function (s, k) { s.classList.toggle('is-active', k === idx); s.setAttribute('aria-hidden', String(k !== idx)); });
    dots.forEach(function (d, k) { d.setAttribute('aria-selected', String(k === idx)); d.tabIndex = k === idx ? 0 : -1; });
    prev.disabled = !o.loop && idx === 0; next.disabled = !o.loop && idx === n - 1;
    car.style.setProperty('--zh-car-int', (parseInt(car.dataset.interval, 10) || 4000) + 'ms');
    car.classList.toggle('is-playing', running());
    car.classList.toggle('is-hold', hover || dragging);
    car.querySelector('.zh-car-track').setAttribute('aria-live', running() ? 'off' : 'polite');
  }
  function running() { return playing && !userPaused; }
  function go(k, fromUser) {
    if (o.loop) k = (k + n) % n; else k = Math.max(0, Math.min(n - 1, k));
    idx = k; if (o.effect === 'slide') track.style.transform = 'translateX(' + (-idx * 100) + '%)';
    render(); schedule();
  }
  function schedule() {
    clearTimeout(timer);
    if (!running() || hover || dragging || document.visibilityState === 'hidden' || car.contains(document.activeElement) && car.matches(':focus-within') && false) return;
    timer = setTimeout(function () { if (!running() || hover || dragging || document.hidden) return schedule(); if (!o.loop && idx === n - 1) return; go(idx + 1); }, parseInt(car.dataset.interval, 10) || 4000);
  }
  prev.addEventListener('click', function () { go(idx - 1, true); });
  next.addEventListener('click', function () { go(idx + 1, true); });
  dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k, true); }); });
  ZH.rovingFocus($('.zh-car-dots', car), '[role="tab"]', { orientation: 'horizontal', typeahead: false, onFocus: function (b) { go(dots.indexOf(b), true); } });
  if (play) play.addEventListener('click', function () {
    userPaused = !userPaused;
    play.innerHTML = ZH.iconHtml(userPaused ? 'play' : 'pause'); play.setAttribute('aria-label', userPaused ? '开始自动播放' : '暂停自动播放');
    render(); schedule();
  });
  function hold(v) { hover = v; render(); schedule(); }
  car.addEventListener('mouseenter', function () { hold(true); }); car.addEventListener('mouseleave', function () { hold(false); });
  car.addEventListener('focusin', function () { hover = true; render(); clearTimeout(timer); });
  car.addEventListener('focusout', function (e) { if (!car.contains(e.relatedTarget)) { hover = false; render(); schedule(); } });
  car.addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('.zh-car-dots')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1, true); } else if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1, true); }
    else if (e.key === 'Home') { e.preventDefault(); go(0, true); } else if (e.key === 'End') { e.preventDefault(); go(n - 1, true); }
  });
  document.addEventListener('visibilitychange', schedule);

  /* drag / swipe */
  var d0 = null;
  vp.addEventListener('pointerdown', function (e) {
    if (e.button && e.pointerType === 'mouse') return;
    d0 = { x: e.clientX, y: e.clientY, w: vp.getBoundingClientRect().width, id: e.pointerId, dx: 0 };
    dragging = true; car.classList.add('is-dragging'); try { vp.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } render(); clearTimeout(timer);
  });
  vp.addEventListener('pointermove', function (e) {
    if (!d0 || e.pointerId !== d0.id) return;
    d0.dx = e.clientX - d0.x;
    if (o.effect === 'slide') {
      var edge = !o.loop && ((idx === 0 && d0.dx > 0) || (idx === n - 1 && d0.dx < 0)) ? 0.25 : 1;
      track.style.transform = 'translateX(calc(' + (-idx * 100) + '% + ' + d0.dx * edge + 'px))';
    }
  });
  function up(e) {
    if (!d0 || e.pointerId !== d0.id) return;
    var dx = d0.dx, w = d0.w; d0 = null; dragging = false; car.classList.remove('is-dragging');
    if (Math.abs(dx) > Math.min(60, w / 5)) go(idx + (dx < 0 ? 1 : -1), true); else go(idx);
  }
  vp.addEventListener('pointerup', up); vp.addEventListener('pointercancel', up);
  render(); schedule();
  return { go: go, el: car };
}
carousel($('#zhCarA'), { effect: 'slide', autoplay: true, interval: 4000, loop: true, label: '精选图片（滑动）' });
carousel($('#zhCarB'), { effect: 'fade', autoplay: false, loop: false, label: '精选图片（渐变）' });
