// Carousel on top of CSS scroll-snap: arrows, dots, keyboard, optional autoplay (data-autoplay in ms; paused on hover, focus and when the page is hidden; off with reduced motion).
ZhaoUI.component('carousel', { selector: '[data-zh-carousel]', init: function (root) {
  root.classList.add('zh-carousel');
  var track = root.querySelector('.zh-carousel-track'), slides = [].slice.call(root.querySelectorAll('.zh-carousel-slide')); if (!track || !slides.length) return;
  root.setAttribute('role', 'region'); root.setAttribute('aria-roledescription', '轮播'); if (!root.hasAttribute('aria-label')) root.setAttribute('aria-label', '轮播');
  track.tabIndex = 0; track.setAttribute('aria-live', 'off');
  slides.forEach(function (s, i) { s.setAttribute('role', 'group'); s.setAttribute('aria-roledescription', '幻灯片'); s.setAttribute('aria-label', (i + 1) + ' / ' + slides.length); });
  function arrow(dir, icon, label) { var b = document.createElement('button'); b.type = 'button'; b.className = 'zh-carousel-arrow ' + dir; b.setAttribute('aria-label', label); b.innerHTML = '<i data-i="' + icon + '" data-s="20"></i>'; root.appendChild(b); return b; }
  var prev = arrow('prev', 'chevron-left', '上一张'), next = arrow('next', 'chevron-right', '下一张');
  var dots = document.createElement('div'); dots.className = 'zh-carousel-dots'; root.appendChild(dots);
  var dotEls = slides.map(function (s, i) { var d = document.createElement('button'); d.type = 'button'; d.className = 'zh-carousel-dot'; d.setAttribute('aria-label', '第 ' + (i + 1) + ' 张'); dots.appendChild(d); d.addEventListener('click', function () { go(i); }); return d; });
  ZH.hydrateIcons(root);
  var cur = 0, timer = null, reduce = function () { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; };
  function sync() { var i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth)); i = Math.max(0, Math.min(slides.length - 1, i)); if (i !== cur || !dotEls[i].hasAttribute('aria-current')) { var ch = i !== cur; cur = i; if (ch) root.dispatchEvent(new CustomEvent('zh:carousel-change', { bubbles: true, detail: { index: cur, slide: slides[cur] } })); }
    dotEls.forEach(function (d, k) { if (k === cur) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); }); prev.disabled = cur === 0 && root.getAttribute('data-loop') == null; next.disabled = cur === slides.length - 1 && root.getAttribute('data-loop') == null; }
  function go(i) { if (i < 0) i = slides.length - 1; if (i >= slides.length) i = 0; track.scrollTo({ left: i * track.clientWidth, behavior: reduce() ? 'auto' : 'smooth' }); }
  prev.addEventListener('click', function () { go(cur - 1); }); next.addEventListener('click', function () { go(cur + 1); });
  var q = 0; track.addEventListener('scroll', function () { if (!q) q = requestAnimationFrame(function () { q = 0; sync(); }); }, { passive: true });
  track.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); } else if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); } });
  window.addEventListener('resize', function () { track.scrollLeft = cur * track.clientWidth; });
  var ap = +root.getAttribute('data-autoplay') || 0, held = false;
  function stop() { clearInterval(timer); timer = null; } function start() { stop(); if (ap && !held && !reduce() && !document.hidden) timer = setInterval(function () { go(cur + 1); }, ap); }
  ['mouseenter', 'focusin'].forEach(function (t) { root.addEventListener(t, function () { held = true; stop(); track.setAttribute('aria-live', 'polite'); }); });
  ['mouseleave', 'focusout'].forEach(function (t) { root.addEventListener(t, function () { held = false; track.setAttribute('aria-live', 'off'); start(); }); });
  document.addEventListener('visibilitychange', start);
  root._zhCarousel = { go: go }; sync(); start();
} });
ZhaoUI.carousel = { go: function (el, i) { el = ZhaoUI.ensure(el); el._zhCarousel.go(i); } };
