// Tree: write a nested <ul> inside <div class="zh-tree" data-zh-tree>; the script renders rows with expand toggles, optional checkboxes (parents show a mixed state), single selection and keyboard control.
ZhaoUI.component('tree', { selector: '[data-zh-tree]', init: function (host) {
  var src = host.querySelector('ul'); if (!src) return;
  var checkable = host.hasAttribute('data-checkable'), selectable = !host.hasAttribute('data-no-select'), nodes = [], byId = {}, cur = null, seq = 0;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function parse(ul, level, parent) {
    [].slice.call(ul.children).forEach(function (li) {
      var sub = li.querySelector(':scope > ul'), c = li.cloneNode(true), cu = c.querySelector(':scope > ul'); if (cu) c.removeChild(cu);
      var n = { id: li.getAttribute('data-id') || 'zt' + (++seq), label: li.getAttribute('data-label') || c.textContent.replace(/\s+/g, ' ').trim(), icon: li.getAttribute('data-icon'), level: level, parent: parent, kids: [],
        open: li.hasAttribute('data-open'), checked: li.hasAttribute('data-checked'), disabled: li.hasAttribute('data-disabled') };
      nodes.push(n); byId[n.id] = n; if (parent) parent.kids.push(n); if (sub) parse(sub, level + 1, n);
    });
  }
  parse(src, 1, null);
  host.classList.add('zh-tree'); host.setAttribute('role', 'tree'); if (!host.hasAttribute('aria-label') && !host.hasAttribute('aria-labelledby')) host.setAttribute('aria-label', '树');
  if (checkable) host.setAttribute('aria-multiselectable', 'true');
  host.innerHTML = nodes.map(function (n) {
    return '<div class="zh-tree-row" role="treeitem" data-id="' + esc(n.id) + '" aria-level="' + n.level + '" tabindex="-1" style="--zh-tree-lvl:' + n.level + '"' + (n.disabled ? ' aria-disabled="true"' : '') + '>' +
      '<span class="zh-tree-toggle' + (n.kids.length ? '' : ' zh-tree-toggle--leaf') + '" aria-hidden="true"><i data-i="chevron-right" data-s="14"></i></span>' +
      (checkable ? '<span class="zh-tree-check" aria-hidden="true"><i data-i="check" data-s="12"></i><i data-i="minus" data-s="12"></i></span>' : '') +
      (n.icon ? '<span class="zh-tree-icon" aria-hidden="true"><i data-i="' + esc(n.icon) + '" data-s="16"></i></span>' : '') + '<span class="zh-tree-label">' + esc(n.label) + '</span></div>';
  }).join('');
  ZH.hydrateIcons(host);
  var live = document.createElement('span'); live.className = 'zh-tree-live'; live.setAttribute('aria-live', 'polite'); host.insertAdjacentElement('afterend', live);   // outside role=tree, which may only contain tree items
  var rows = [].slice.call(host.querySelectorAll('.zh-tree-row')); nodes.forEach(function (n, i) { n.el = rows[i]; });

  function recalc(n) { // parents derive their state from their children
    if (n.kids.length) { n.kids.forEach(recalc); var ks = n.kids.filter(function (k) { return !k.disabled; }); if (!ks.length) return; var on = ks.filter(function (k) { return k.checked === true; }).length, mixed = ks.some(function (k) { return k.checked === 'mixed'; }); n.checked = on === ks.length ? true : (on || mixed ? 'mixed' : false); }   // disabled children do not count
  }
  function visible(n) { for (var p = n.parent; p; p = p.parent) if (!p.open) return false; return true; }
  function paint() {
    nodes.forEach(function (n) {
      var e = n.el; e.hidden = !visible(n); e.classList.toggle('is-open', n.open);
      if (n.kids.length) e.setAttribute('aria-expanded', String(n.open)); else e.removeAttribute('aria-expanded');
      if (checkable) { e.setAttribute('aria-checked', String(n.checked)); var ics = e.querySelectorAll('.zh-tree-check .ico, .zh-tree-check svg'); if (ics.length > 1) { ics[0].style.display = n.checked === true ? '' : 'none'; ics[1].style.display = n.checked === 'mixed' ? '' : 'none'; } }
    });
  }
  function checkedIds() { return nodes.filter(function (n) { return n.checked === true && !n.kids.length; }).map(function (n) { return n.id; }); }
  function emit(name, d) { host.dispatchEvent(new CustomEvent('zh:tree-' + name, { bubbles: true, detail: d })); }
  function setOpen(n, v) { if (!n.kids.length || n.open === v) return; n.open = v; paint(); emit('toggle', { id: n.id, open: v }); }
  function setCheck(n, v) { if (n.disabled) return; (function down(x) { if (!x.disabled) x.checked = v; x.kids.forEach(down); })(n); nodes.filter(function (x) { return !x.parent; }).forEach(recalc); paint(); emit('check', { id: n.id, checked: v, ids: checkedIds() }); live.textContent = n.label + (v ? '，已选中' : '，已取消'); }
  function select(n, focus) { if (n.disabled) return; if (selectable) { nodes.forEach(function (x) { x.el.classList.remove('is-selected'); x.el.removeAttribute('aria-selected'); }); n.el.classList.add('is-selected'); n.el.setAttribute('aria-selected', 'true'); emit('select', { id: n.id, label: n.label }); } rove(n, focus); }
  function rove(n, focus) { nodes.forEach(function (x) { x.el.tabIndex = -1; }); n.el.tabIndex = 0; cur = n; if (focus !== false) n.el.focus(); }
  nodes.filter(function (x) { return !x.parent; }).forEach(recalc); paint(); rove(nodes[0], false);

  host.addEventListener('click', function (e) {
    var row = e.target.closest('.zh-tree-row'); if (!row || !host.contains(row)) return; var n = byId[row.getAttribute('data-id')]; if (!n || n.disabled) return;
    if (e.target.closest('.zh-tree-toggle')) { setOpen(n, !n.open); rove(n); return; }
    if (e.target.closest('.zh-tree-check')) { setCheck(n, n.checked !== true); rove(n); return; }
    select(n); if (n.kids.length && host.hasAttribute('data-toggle-on-click')) setOpen(n, !n.open);
  });
  host.addEventListener('keydown', function (e) {
    var row = e.target.closest('.zh-tree-row'); if (!row) return; var n = byId[row.getAttribute('data-id')], vis = nodes.filter(function (x) { return !x.el.hidden; }), i = vis.indexOf(n), to = null;
    if (e.key === 'ArrowDown') to = vis[Math.min(i + 1, vis.length - 1)]; else if (e.key === 'ArrowUp') to = vis[Math.max(i - 1, 0)]; else if (e.key === 'Home') to = vis[0]; else if (e.key === 'End') to = vis[vis.length - 1];
    else if (e.key === 'ArrowRight') { if (n.kids.length && !n.open) setOpen(n, true); else if (n.kids.length) to = n.kids[0]; }
    else if (e.key === 'ArrowLeft') { if (n.kids.length && n.open) setOpen(n, false); else if (n.parent) to = n.parent; }
    else if (e.key === 'Enter') { select(n); }
    else if (e.key === ' ') { if (checkable && !n.disabled) setCheck(n, n.checked !== true); else select(n); }
    else return;
    e.preventDefault(); if (to) rove(to);
  });
  host._zhTree = { checked: checkedIds, expand: function (v) { nodes.forEach(function (n) { if (n.kids.length) n.open = v; }); paint(); }, select: function (id) { var n = byId[id]; if (n) { var p = n.parent; while (p) { p.open = true; p = p.parent; } paint(); select(n, false); } return !!n; } };
} });
ZhaoUI.tree = { checked: function (el) { el = ZhaoUI.ensure(el); return el._zhTree.checked(); }, expandAll: function (el) { el = ZhaoUI.ensure(el); el._zhTree.expand(true); }, collapseAll: function (el) { el = ZhaoUI.ensure(el); el._zhTree.expand(false); }, select: function (el, id) { el = ZhaoUI.ensure(el); return el._zhTree.select(id); } };
