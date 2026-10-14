// Anchor / table of contents: links to #ids on the page; the one whose section is currently at the top gets aria-current="location".
// data-offset: distance in px kept above the target (default 16, raise it under a sticky header). data-target: selector of a scrolling box instead of the page.
ZhaoUI.component('anchor', { selector: '[data-zh-anchor]', init: function (nav) {
  var sel = nav.getAttribute('data-target'), box = sel ? document.querySelector(sel) : null, off = +(nav.getAttribute('data-offset') || 16), src = box || window;
  var links = [].slice.call(nav.querySelectorAll('a[href^="#"]')).filter(function (a) { return a.getAttribute('href').length > 1; });
  nav.classList.add('zh-anchor'); if (!nav.hasAttribute('aria-label')) nav.setAttribute('aria-label', '本页目录');
  function target(a) { try { return document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))); } catch (e) { return null; } }
  function topOf(el) { var r = el.getBoundingClientRect(), b = box ? box.getBoundingClientRect().top : 0; return r.top - b; }
  var cur = null, locked = 0, q = 0;
  function set(a) { if (a === cur) return; cur = a; links.forEach(function (x) { if (x === a) x.setAttribute('aria-current', 'location'); else x.removeAttribute('aria-current'); }); nav.dispatchEvent(new CustomEvent('zh:anchor-change', { bubbles: true, detail: { id: a ? a.getAttribute('href').slice(1) : null, link: a } })); }
  function spy() {
    q = 0; if (locked && Date.now() < locked) return; var best = null;
    links.forEach(function (a) { var t = target(a); if (t && topOf(t) <= off + 1) best = a; });
    var scrollEnd = box ? box.scrollTop + box.clientHeight >= box.scrollHeight - 2 : window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 2;
    if (scrollEnd && links.length) { var lastVisible = links.filter(function (a) { var t = target(a); return t && topOf(t) < (box ? box.clientHeight : window.innerHeight); }); best = lastVisible.length ? lastVisible[lastVisible.length - 1] : best; }
    set(best || (links.length && topOf(target(links[0]) || document.body) > off ? null : links[0]));
  }
  src.addEventListener('scroll', function () { if (!q) q = requestAnimationFrame(spy); }, { passive: true }); window.addEventListener('resize', spy);
  nav.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]'); if (!a || links.indexOf(a) < 0) return; var t = target(a); if (!t) return; e.preventDefault();
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, y = topOf(t) - off + (box ? box.scrollTop : window.pageYOffset);
    locked = Date.now() + 700; set(a); (box || window).scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    if (history.replaceState && !box) history.replaceState(null, '', a.getAttribute('href')); t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true });
  });
  spy();
} });
