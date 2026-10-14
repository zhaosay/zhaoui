// Side menu: turns a nested <ul> of links into an ARIA tree with expandable groups, a current-page marker and a collapsible icon rail.
ZhaoUI.component('side', { selector: '[data-zh-side]', init: function (root) {
  var scroll = root.querySelector('.zh-side-scroll'), tree = root.querySelector('ul');
  if (!tree) return;
  if (!scroll) { scroll = document.createElement('div'); scroll.className = 'zh-side-scroll'; tree.parentNode.insertBefore(scroll, tree); scroll.appendChild(tree); }
  var collapsed = false, seq = 0;

  function text(a) { return (a.getAttribute('data-label') || a.textContent).replace(/\s+/g, ' ').trim(); }
  function build(ul, level) {
    ul.setAttribute('role', level === 1 ? 'tree' : 'group'); if (level === 1 && !ul.hasAttribute('aria-label')) ul.setAttribute('aria-label', root.getAttribute('aria-label') || '导航');
    [].slice.call(ul.children).forEach(function (li) {
      if (li.classList.contains('zh-side-group')) { li.setAttribute('role', 'presentation'); return; }
      li.setAttribute('role', 'none');
      var a = li.querySelector(':scope > a'), sub = li.querySelector(':scope > ul'); if (!a) return;
      var label = text(a), icon = a.getAttribute('data-icon'), badge = a.getAttribute('data-badge');
      a.className = 'zh-side-item'; a.setAttribute('role', 'treeitem'); a.setAttribute('aria-level', String(level)); a.tabIndex = -1; a.setAttribute('data-title', label);
      var num = a.getAttribute('data-num');
      a.innerHTML = (icon ? '<i data-i="' + icon + '"></i>' : '') + (num ? '<span class="zh-side-num" aria-hidden="true">' + num.replace(/[<>&]/g, '') + '</span>' : '') + '<span class="zh-side-label"></span>';
      a.querySelector('.zh-side-label').textContent = label;
      if (badge) { var b = document.createElement('span'); b.className = 'zh-side-badge' + (badge === 'dot' ? ' zh-side-badge--dot' : a.getAttribute('data-badge-tone') === 'soft' ? ' zh-side-badge--soft' : ''); if (badge !== 'dot') b.textContent = badge; a.appendChild(b); }
      if (sub) {
        var id = 'zh-side-g' + (++seq), open = li.hasAttribute('data-open') || !!sub.querySelector('[aria-current="page"]');
        var wrap = document.createElement('div'); wrap.className = 'zh-side-sub' + (open ? ' is-open' : ''); if (!open) wrap.inert = true; sub.id = id;
        li.replaceChild(wrap, sub); wrap.appendChild(sub);
        a.setAttribute('aria-expanded', String(open)); a.setAttribute('aria-owns', id);
        var c = document.createElement('i'); c.className = 'zh-side-caret'; c.setAttribute('data-i', 'chevron-right'); c.setAttribute('data-s', '16'); a.appendChild(c);
        build(sub, level + 1);
      }
    });
  }
  build(tree, 1);

  var foot = root.querySelector('.zh-side-foot'), toggle = root.querySelector('.zh-side-toggle');
  if (!toggle && root.getAttribute('data-collapsible') !== 'false') {
    foot = foot || root.appendChild(Object.assign(document.createElement('div'), { className: 'zh-side-foot' }));
    toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'zh-side-toggle'; toggle.innerHTML = '<i data-i="panel-left-close" data-s="20"></i><span class="zh-side-label"></span>'; foot.appendChild(toggle);
  }
  ZH.hydrateIcons(root);

  function items() { return [].slice.call(tree.querySelectorAll('[role=treeitem]')); }
  function visible() { return items().filter(function (a) { var s = a.closest('.zh-side-sub'); if (collapsed && +a.getAttribute('aria-level') > 1) return false; while (s) { if (!s.classList.contains('is-open')) return false; s = s.parentElement.closest('.zh-side-sub'); } return true; }); }
  function rove(a, focus) { items().forEach(function (x) { x.tabIndex = -1; }); a.tabIndex = 0; if (focus) a.focus(); }
  function path(a) { var r = [], n = a; while (n) { r.unshift(n.getAttribute('data-title')); var up = n.closest('li').parentElement.closest('li'); n = up && up.querySelector(':scope > [role=treeitem]'); } return r; }
  function sync() { items().forEach(function (a) { var sub = a.nextElementSibling; a.classList.toggle('has-active', !!(sub && sub.querySelector('[aria-current="page"]'))); }); }
  function setOpen(a, open) { var sub = a.nextElementSibling; if (!sub) return; a.setAttribute('aria-expanded', String(open && !collapsed)); sub.classList.toggle('is-open', open); sub.inert = !open; }
  function setActive(a) { items().forEach(function (x) { x.removeAttribute('aria-current'); }); a.setAttribute('aria-current', 'page'); for (var p = a.closest('.zh-side-sub'); p; p = p.parentElement.closest('.zh-side-sub')) setOpen(p.previousElementSibling, true); sync(); }
  function setCollapsed(v, quiet) {
    collapsed = v; root.classList.toggle('is-collapsed', v);
    items().forEach(function (a) { if (v) a.title = a.getAttribute('data-title'); else a.removeAttribute('title'); var s = a.nextElementSibling; if (s && s.classList.contains('zh-side-sub')) a.setAttribute('aria-expanded', String(!v && s.classList.contains('is-open'))); });
    if (toggle) { var l = v ? '展开侧栏' : '折叠侧栏'; toggle.querySelector('.zh-side-label').textContent = l; toggle.setAttribute('aria-label', l); toggle.setAttribute('aria-expanded', String(!v)); var u = toggle.querySelector('use'); if (u) { var h = '#zi-' + (v ? 'panel-left-open' : 'panel-left-close'); u.setAttribute('href', h); u.setAttribute('xlink:href', h); } }
    if (!quiet) root.dispatchEvent(new CustomEvent('zh:side-collapse', { bubbles: true, detail: { collapsed: v } }));
  }
  if (toggle) toggle.addEventListener('click', function () { setCollapsed(!collapsed); });

  root.addEventListener('click', function (e) {
    var a = e.target.closest('[role=treeitem]'); if (!a || !tree.contains(a)) return;
    if (a.getAttribute('aria-disabled') === 'true') { e.preventDefault(); return; }
    rove(a, false);
    if (a.nextElementSibling && a.nextElementSibling.classList.contains('zh-side-sub')) {
      e.preventDefault(); if (collapsed) setCollapsed(false); setOpen(a, a.getAttribute('aria-expanded') !== 'true' || collapsed); return;
    }
    var href = a.getAttribute('href'), ev = new CustomEvent('zh:side-select', { bubbles: true, cancelable: true, detail: { item: a, href: href, label: a.getAttribute('data-title'), path: path(a) } });
    if (!root.dispatchEvent(ev)) { e.preventDefault(); return; }
    if (!href || href === '#') e.preventDefault(); setActive(a);
  });
  root.addEventListener('keydown', function (e) {
    var a = e.target.closest('[role=treeitem]'); if (!a) return; var list = visible(), i = list.indexOf(a), to = null, sub = a.nextElementSibling, has = sub && sub.classList.contains('zh-side-sub'), open = a.getAttribute('aria-expanded') === 'true';
    if (e.key === 'ArrowDown') to = list[Math.min(i + 1, list.length - 1)]; else if (e.key === 'ArrowUp') to = list[Math.max(i - 1, 0)];
    else if (e.key === 'Home') to = list[0]; else if (e.key === 'End') to = list[list.length - 1];
    else if (e.key === 'ArrowRight' && has) { if (!open) setOpen(a, true); else to = sub.querySelector('[role=treeitem]'); }
    else if (e.key === 'ArrowLeft') { if (has && open) setOpen(a, false); else { var up = a.closest('.zh-side-sub'); if (up) to = up.previousElementSibling; } }
    else if (e.key === ' ') { e.preventDefault(); a.click(); return; }
    else return;
    e.preventDefault(); if (to) rove(to, true);
  });

  var cur = tree.querySelector('[aria-current="page"]'); sync();
  rove(cur || items()[0], false); if (root.hasAttribute('data-collapsed')) setCollapsed(true, true); else if (toggle) setCollapsed(false, true);
  root._zhSide = { setActive: function (t) { var a = typeof t === 'string' ? tree.querySelector('[role=treeitem][href="' + t + '"]') : t; if (a) { setActive(a); rove(a, false); } return !!a; }, collapse: function (v) { setCollapsed(v !== false); } };
} });
ZhaoUI.side = { setActive: function (el, target) { el = ZhaoUI.ensure(el); return !!(el._zhSide && el._zhSide.setActive(target)); }, collapse: function (el, v) { el = ZhaoUI.ensure(el); el._zhSide.collapse(v); } };
