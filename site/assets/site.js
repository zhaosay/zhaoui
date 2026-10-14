// Site behaviour: theme switch (remembered), search (command palette over the page index), copy buttons, "run example" buttons.
(function () {
  var root = document.documentElement, KEY = 'zhaoui-site-theme', base = document.body.getAttribute('data-site-root') || './';
  function saved() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function store(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* private mode */ } }
  function sync() { [].forEach.call(document.querySelectorAll('[data-site-theme]'), function (b) { var kv = b.getAttribute('data-site-theme').split(':'); b.setAttribute('aria-pressed', String(root.getAttribute('data-' + kv[0]) === kv[1])); }); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-site-theme]'); if (!b) return;
    var kv = b.getAttribute('data-site-theme').split(':'), o = {}; o[kv[0]] = kv[1]; ZhaoUI.setTheme(o); var s = saved(); s[kv[0]] = kv[1]; store(s); sync();
  });
  document.addEventListener('zh:popover-open', sync); sync();

  // search: the index is a plain script (assets/search-index.js) so it also works from the file system
  var icons = { '组件': 'layout-dashboard', '指南': 'book-open', '设计': 'palette', '工具': 'play', '首页': 'chevron-right' }, palette = null;
  function build() {
    if (palette || !window.ZH_SITE_INDEX || !ZhaoUI.commandPalette) return palette;
    palette = ZhaoUI.commandPalette({ hotkey: true, placeholder: '搜索组件、指南、类名、事件…', label: '站内搜索', emptyText: '没有找到相关页面', recent: 0,
      commands: window.ZH_SITE_INDEX.map(function (p) { return { id: p.u, label: p.t, group: p.g, icon: icons[p.g] || 'chevron-right', keywords: (p.d || '') + ' ' + (p.k || ''), run: function () { location.href = base + p.u; } }; }) });
    return palette;
  }
  build();
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-site-search]'); if (b && build()) palette.open(b); });
  if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) [].forEach.call(document.querySelectorAll('[data-mod]'), function (k) { k.textContent = '⌘'; });

  // copy buttons: the ones written into the page, plus one for every other code block
  [].forEach.call(document.querySelectorAll('.doc-code'), function (w) { if (!w.querySelector('[data-site-copy]')) { var b = document.createElement('button'); b.type = 'button'; b.className = 'zh-btn sm s-copy'; b.setAttribute('aria-label', '复制代码'); b.setAttribute('data-site-copy', ''); b.textContent = '复制'; w.insertBefore(b, w.firstChild); } });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-site-copy]'); if (!b) return; var pre = b.parentNode.querySelector('pre'); if (!pre) return; var text = pre.textContent;
    function done(msg) { var old = b.textContent; b.textContent = msg || '已复制'; setTimeout(function () { b.textContent = old; }, 1800); }
    function select() { var r = document.createRange(); r.selectNodeContents(pre); var s = getSelection(); s.removeAllRanges(); s.addRange(r); done('已选中，按 Ctrl+C'); }
    function fallback() { var t = document.createElement('textarea'); t.value = text; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (er) { ok = false; } t.remove(); if (ok) done(); else select(); }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { done(); }, fallback); else fallback();
  });
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-site-run]'); if (b) (new Function(b.getAttribute('data-code')))(); });
})();
