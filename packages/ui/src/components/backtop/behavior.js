// Back to top: a button that appears after scrolling down and returns to the top.  data-threshold is the scroll distance in px (default 400); data-target is a selector for a scrolling container (default the page).
ZhaoUI.component('backtop', { selector: '[data-zh-backtop]', init: function (btn) {
  var sel = btn.getAttribute('data-target'), box = sel ? document.querySelector(sel) : null, th = +(btn.getAttribute('data-threshold') || 400);
  if (!btn.classList.contains('zh-backtop')) btn.classList.add('zh-backtop'); if (!box) btn.classList.add('zh-backtop--fixed');
  if (btn.tagName !== 'BUTTON') { btn.setAttribute('role', 'button'); btn.tabIndex = 0; } else btn.type = 'button';
  if (!btn.hasAttribute('aria-label') && !btn.textContent.trim()) btn.setAttribute('aria-label', '返回顶部');
  if (!btn.firstElementChild && !btn.textContent.trim()) { btn.innerHTML = '<i data-i="chevron-up" data-s="20"></i>'; ZH.hydrateIcons(btn); }
  var src = box || window, y = function () { return box ? box.scrollTop : (window.pageYOffset || document.documentElement.scrollTop); }, q = 0;
  function update() { q = 0; var on = y() > th; btn.classList.toggle('is-on', on); btn.setAttribute('aria-hidden', String(!on)); btn.tabIndex = on ? 0 : -1; }
  src.addEventListener('scroll', function () { if (!q) q = requestAnimationFrame(update); }, { passive: true });
  function go() { var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, o = { top: 0, behavior: reduce ? 'auto' : 'smooth' }; (box || window).scrollTo(o); btn.dispatchEvent(new CustomEvent('zh:backtop', { bubbles: true })); }
  btn.addEventListener('click', go); btn.addEventListener('keydown', function (e) { if (btn.tagName !== 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); go(); } });
  update();
} });
