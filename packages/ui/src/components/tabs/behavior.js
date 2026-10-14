// Tabs: <div class="zh-tabs" role="tablist"> with <button role="tab" aria-controls="panelId">. Panels are shown/hidden with [hidden].
ZhaoUI.component('tabs', { selector: '.zh-tabs[role="tablist"]', init: function (list) {
  var tabs = [].slice.call(list.querySelectorAll('[role="tab"]'));
  if (!tabs.length) return;
  var vertical = list.getAttribute('aria-orientation') === 'vertical';
  function panel(t) { var id = t.getAttribute('aria-controls'); return id ? document.getElementById(id) : null; }
  function select(i, focus) {
    // A panel is shown when the SELECTED tab controls it. Several tabs may share one panel (a segmented switch that swaps content via zh:tab-change).
    var activeId = tabs[i].getAttribute('aria-controls');
    tabs.forEach(function (t, j) { var on = i === j; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
    tabs.forEach(function (t) { var p = panel(t); if (p) { p.hidden = p.id !== activeId; if (!p.hasAttribute('role')) p.setAttribute('role', 'tabpanel'); } });
    if (focus) tabs[i].focus();
    list.dispatchEvent(new CustomEvent('zh:tab-change', { bubbles: true, detail: { index: i, tab: tabs[i] } }));
  }
  var start = tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; });
  tabs.forEach(function (t, j) { if (t.disabled) return; t.addEventListener('click', function () { select(j); }); });
  list.addEventListener('keydown', function (e) {
    var i = tabs.indexOf(document.activeElement); if (i < 0) return;
    var next = vertical ? 'ArrowDown' : 'ArrowRight', prev = vertical ? 'ArrowUp' : 'ArrowLeft', n = tabs.length, to = -1;
    if (e.key === next) to = (i + 1) % n; else if (e.key === prev) to = (i - 1 + n) % n; else if (e.key === 'Home') to = 0; else if (e.key === 'End') to = n - 1;
    if (to < 0) return;
    e.preventDefault();
    for (var k = 0; k < n && tabs[to].disabled; k++) to = (to + (e.key === prev || e.key === 'End' ? -1 : 1) + n) % n;
    select(to, true);
  });
  select(start < 0 ? 0 : start);
  list.dispatchEvent(new CustomEvent('zh:tab-ready', { bubbles: true }));
} });
