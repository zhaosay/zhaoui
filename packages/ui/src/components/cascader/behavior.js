// Cascader (multi-level select). Two ways in:
//   1. Declarative, data written as nested lists (readable without JS, friendly to server rendering):
//        <div data-zh-cascader data-name="region" data-searchable data-value="浙江/杭州/西湖区" data-placeholder="请选择地区" aria-label="地区">
//          <ul hidden><li>浙江<ul><li>杭州<ul><li>西湖区</li></ul></li></ul></li><li data-disabled>海南</li></ul>
//        </div>
//      data-*: name (adds a hidden input for forms), value ("a/b/c" label path), placeholder, searchable, clearable (default on; data-clearable="false" to turn off), size (sm|md|lg),
//      expand-trigger ("hover" opens the next level on hover; default click), sep (text between levels, default " / "), labelledby. On <li>: data-disabled, data-value.
//   2. Imperative: ZhaoUI.cascader(host, { data: [{ label, children, disabled, ...yours }], value: ['a','b'], searchable, expandTrigger, onChange(labels, text, nodes) })
// Fires zh:cascader-change { path, text, nodes } on the control. On narrow screens (<= 767px) it turns into a drill-down list with a back button.
var ic = ZH.iconHtml;
function hl(text, q) {
  text = String(text);
  if (!q) return ZH.esc(text);
  var i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return ZH.esc(text);
  return ZH.esc(text.slice(0, i)) + '<mark class="zh-sel-hl">' + ZH.esc(text.slice(i, i + q.length)) + '</mark>' + ZH.esc(text.slice(i + q.length));
}
function isPhone() { return window.matchMedia('(max-width: 767px)').matches; }
function keepClasses(el) { return (el.className || '').split(/\s+/).filter(function (x) { return x && x.indexOf('zh-sel') !== 0 && x !== 'can-clear' && x !== 'is-open' && x !== 'has-value'; }).join(' ') + ' '; }
function Cascader(root, cfg) {
  var c = Object.assign({ expandTrigger: 'click', searchable: false, clearable: true, size: 'md', placeholder: '请选择地区', data: [], labelledby: '', sep: ' / ', onChange: null, value: null }, cfg);
  var id = ZH.uid('cas'), pop, path = [], cursor = [], aL = 0, aI = 0, q = '', results = [], rI = 0, drill = false, ht, kb = false;

  root.className = keepClasses(root) + 'zh-sel zh-sel--' + c.size + (c.clearable ? ' can-clear' : '');
  root.innerHTML = '<div class="zh-sel-trigger"><input class="zh-sel-input" type="text" autocomplete="off" spellcheck="false" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-autocomplete="' + (c.searchable ? 'list' : 'none') + '"' +
    (c.searchable ? '' : ' readonly') + (c.labelledby ? ' aria-labelledby="' + c.labelledby + '"' : '') + ' placeholder="' + ZH.esc(c.placeholder) + '">' +
    '<span class="zh-sel-suffix"><button type="button" class="zh-sel-clear" tabindex="-1" aria-label="清除">' + ic('x', 12) + '</button><span class="zh-sel-chev">' + ic('chevron-down', 16) + '</span></span></div>';
  var trigger = root.firstChild, input = trigger.querySelector('input');

  function cols() { var out = [c.data]; cursor.forEach(function (n) { if (n.children && n.children.length) out.push(n.children); }); return out; }
  function pathText(nodes) { return nodes.map(function (n) { return n.label; }).join(c.sep); }
  function emit() {
    var labels = path.map(function (n) { return n.label; }), text = pathText(path);
    if (c.onChange) c.onChange(labels, text, path.slice());
    root.dispatchEvent(new CustomEvent('zh:cascader-change', { bubbles: true, detail: { path: labels, text: text, nodes: path.slice() } }));
  }
  function syncInput() { input.value = pathText(path); root.classList.toggle('has-value', path.length > 0); }
  function enabledIdx(col, from, dir) {
    for (var k = 0, n = col.length, i = from; k < n; k++) { i = (i + dir + n) % n; if (!col[i].disabled) return i; }
    return -1;
  }
  function firstEnabled(col) { for (var i = 0; i < col.length; i++) if (!col[i].disabled) return i; return 0; }
  function inPath(n) { return path.indexOf(n) > -1; }
  function idOf(l, i) { return id + '-' + l + '-' + i; }

  function collectLeaves(nodes, trail, out) {
    nodes.forEach(function (n) {
      var t = trail.concat([n]);
      if (n.children && n.children.length) collectLeaves(n.children, t, out); else out.push(t);
    });
    return out;
  }
  function panelHtml() {
    if (q) {
      var lq = q.toLowerCase();
      results = collectLeaves(c.data, [], []).filter(function (t) { return pathText(t).toLowerCase().indexOf(lq) > -1; });
      if (!results.length) return '<div class="zh-sel-msg" role="option" aria-disabled="true">' + ic('search-x', 16) + '无匹配项</div>';
      return '<ul class="zh-cas-results" role="listbox" aria-label="搜索结果">' + results.map(function (t, i) {
        var dis = t.some(function (n) { return n.disabled; });
        return '<li class="zh-cas-item' + (i === rI ? ' is-active' : '') + '" role="option" id="' + idOf('r', i) + '" data-r="' + i + '" aria-selected="' + (pathText(t) === pathText(path)) + '"' + (dis ? ' aria-disabled="true"' : '') + '><span>' + hl(pathText(t), q) + '</span></li>';
      }).join('') + '</ul>';
    }
    var cs = cols(), last = cs.length - 1, html = '';
    if (drill) {
      var head = cursor.length ? '<button type="button" class="zh-cas-back" aria-label="返回上一级" tabindex="-1">' + ic('chevron-left', 16) + '</button><strong>' + ZH.esc(pathText(cursor)) + '</strong>' : '<strong>请选择</strong>';
      html += '<div class="zh-cas-head">' + head + '</div>';
    }
    cs.forEach(function (col, L) {
      if (drill && L !== last) return;
      html += '<ul class="zh-cas-col" role="listbox" aria-label="第 ' + (L + 1) + ' 级" data-l="' + L + '">' + col.map(function (n, i) {
        var branch = n.children && n.children.length;
        return '<li class="zh-cas-item' + (cursor[L] === n ? ' is-expanded' : '') + (L === aL && i === aI ? ' is-active' : '') + '" role="option" id="' + idOf(L, i) + '" data-l="' + L + '" data-i="' + i + '" aria-selected="' + inPath(n) + '"' + (n.disabled ? ' aria-disabled="true"' : '') + '>' +
          '<span>' + ZH.esc(n.label) + '</span>' + (branch ? '<span class="zh-cas-arrow">' + ic('chevron-right', 14) + '</span>' : '') + '</li>';
      }).join('') + '</ul>';
    });
    return html;
  }
  function panelEl() { return pop && pop.el ? pop.el.querySelector('.zh-cas-panel') : null; }
  function render() {
    var p = panelEl(); if (!p) return;
    p.className = 'zh-cas-panel' + (drill ? ' is-drill' : '') + (kb ? ' is-kbd' : '');
    p.innerHTML = panelHtml(); ZH.hydrateIcons(p); syncActive(); pop.update();
  }
  function syncActive() {
    var el = q ? document.getElementById(idOf('r', rI)) : document.getElementById(idOf(aL, aI));
    if (el) { input.setAttribute('aria-activedescendant', el.id); el.scrollIntoView({ block: 'nearest' }); } else input.removeAttribute('aria-activedescendant');
  }
  function expand(L, node) { cursor = cursor.slice(0, L).concat([node]); aL = L + 1; aI = firstEnabled(cols()[aL] || []); }
  function commit(nodes) {
    path = nodes; syncInput();
    emit();
    q = ''; if (pop.isOpen()) pop.toggle();
  }
  function activate(L, i) {
    var col = cols()[L], n = col && col[i]; if (!n || n.disabled) return;
    if (n.children && n.children.length) { expand(L, n); render(); } else commit(cursor.slice(0, L).concat([n]));
  }
  function initCursor() {
    q = ''; rI = 0; drill = isPhone();
    if (path.length) {
      cursor = path.slice(0, -1); aL = cursor.length; aI = Math.max(0, (cols()[aL] || []).indexOf(path[path.length - 1]));
      if (drill) aL = cursor.length;
    } else { cursor = []; aL = 0; aI = firstEnabled(c.data); }
  }

  pop = ZH.popover(root, {
    content: function () { var d = document.createElement('div'); d.className = 'zh-cas-panel' + (drill ? ' is-drill' : '') + (kb ? ' is-kbd' : ''); d.setAttribute('role', 'group'); d.setAttribute('aria-label', '级联选择'); d.innerHTML = panelHtml(); return d; },
    trigger: 'manual', role: 'presentation', z: 'dropdown', placement: 'bottom-start', offset: 4, restoreFocus: false,
    onOpen: function (el) {
      root.removeAttribute('aria-expanded'); root.removeAttribute('aria-controls');
      root.classList.add('is-open'); input.setAttribute('aria-expanded', 'true'); input.setAttribute('aria-controls', id + '-panel');
      var p = el.querySelector('.zh-cas-panel'); p.id = id + '-panel';
      if (drill) el.style.minWidth = root.getBoundingClientRect().width + 'px';
      p.addEventListener('mousedown', function (e) { e.preventDefault(); });
      p.addEventListener('mousemove', function () { if (kb) { kb = false; p.classList.remove('is-kbd'); } });
      p.addEventListener('click', function (e) {
        kb = false;
        if (e.target.closest('.zh-cas-back')) { var prev = cursor[cursor.length - 1]; cursor = cursor.slice(0, -1); aL = cursor.length; aI = Math.max(0, (cols()[aL] || []).indexOf(prev)); render(); return; }
        var r = e.target.closest('[data-r]');
        if (r) { var t = results[+r.getAttribute('data-r')]; if (t && !t.some(function (n) { return n.disabled; })) commit(t); return; }
        var it = e.target.closest('.zh-cas-item'); if (it) activate(+it.getAttribute('data-l'), +it.getAttribute('data-i'));
      });
      if (c.expandTrigger === 'hover' && !drill) p.addEventListener('mouseover', function (e) {
        var it = e.target.closest('.zh-cas-item[data-l]'); if (!it) return;
        var L = +it.getAttribute('data-l'), i = +it.getAttribute('data-i'), n = cols()[L][i];
        clearTimeout(ht);
        ht = setTimeout(function () {
          if (!n || n.disabled || cursor[L] === n) return;
          aL = L; aI = i;
          if (n.children && n.children.length) expand(L, n); else { cursor = cursor.slice(0, L); }
          aL = L; aI = i; render();
        }, 90);
      });
      syncActive();
    },
    onClose: function () {
      root.removeAttribute('aria-expanded'); root.removeAttribute('aria-controls'); root.classList.remove('is-open');
      input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-controls'); input.removeAttribute('aria-activedescendant');
      q = ''; syncInput();
    }
  });
  root.removeAttribute('aria-haspopup'); root.removeAttribute('aria-expanded');

  function open() { if (pop.isOpen()) return; kb = false; initCursor(); pop.open(); }
  function close() { if (pop.isOpen()) pop.toggle(); }
  trigger.addEventListener('click', function (e) {
    if (e.target.closest('.zh-sel-clear')) { path = []; syncInput(); emit(); input.focus(); close(); return; }
    input.focus();
    if (pop.isOpen()) { if (e.target !== input || !c.searchable) close(); } else open();
  });
  input.addEventListener('input', function () {
    if (!c.searchable) return;
    q = input.value.trim(); rI = 0; if (!pop.isOpen()) { initCursor(); q = input.value.trim(); pop.open(); }
    render();
  });
  input.addEventListener('keydown', function (e) {
    var k = e.key, isOpen = pop.isOpen();
    if (!isOpen) { if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || (k === ' ' && !c.searchable)) { e.preventDefault(); open(); } return; }
    if (k === 'Tab') { close(); return; }
    if (q) {
      if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); rI = (rI + (k === 'ArrowDown' ? 1 : -1) + results.length) % Math.max(1, results.length); render(); }
      else if (k === 'Enter') { e.preventDefault(); var t = results[rI]; if (t && !t.some(function (n) { return n.disabled; })) commit(t); }
      return;
    }
    var col = cols()[aL] || [];
    if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(k) > -1) kb = true;
    if (k === 'ArrowDown' || k === 'ArrowUp') {
      e.preventDefault(); var ni = enabledIdx(col, aI, k === 'ArrowDown' ? 1 : -1);
      if (ni > -1) { aI = ni; cursor = cursor.slice(0, aL); render(); }
    } else if (k === 'Home' && !c.searchable) { e.preventDefault(); aI = firstEnabled(col); cursor = cursor.slice(0, aL); render(); }
    else if (k === 'End' && !c.searchable) { e.preventDefault(); aI = enabledIdx(col, 0, -1); cursor = cursor.slice(0, aL); render(); }
    else if (k === 'ArrowRight') {
      var n = col[aI]; if (n && !n.disabled && n.children && n.children.length) { e.preventDefault(); expand(aL, n); render(); }
    } else if (k === 'ArrowLeft') {
      if (aL > 0) { e.preventDefault(); var parent = cursor[aL - 1]; cursor = cursor.slice(0, aL - 1); aL = aL - 1; aI = Math.max(0, (cols()[aL] || []).indexOf(parent)); render(); }
    } else if (k === 'Enter' || (k === ' ' && !c.searchable)) { e.preventDefault(); activate(aL, aI); }
  });
  root.addEventListener('focusout', function (e) { if (!root.contains(e.relatedTarget)) close(); });
  window.addEventListener('resize', function () { if (pop.isOpen() && drill !== isPhone()) { drill = isPhone(); render(); } });

  if (c.value) {
    var trail = [], nodes = c.data;
    c.value.forEach(function (lb) { var n = nodes.filter(function (x) { return x.label === lb; })[0]; if (n) { trail.push(n); nodes = n.children || []; } });
    path = trail;
  }
  syncInput();
  function pick(labels) {
    var trail = [], nodes = c.data;
    (labels || []).forEach(function (lb) { var n = nodes.filter(function (x) { return x.label === lb; })[0]; if (n) { trail.push(n); nodes = n.children || []; } });
    return trail;
  }
  return {
    el: root, input: input, open: open, close: close,
    get: function () { return path.map(function (n) { return n.label; }); },
    getNodes: function () { return path.slice(); },
    set: function (labels) { path = pick(labels); syncInput(); },             // does not fire change
    setData: function (data) { c.data = data; path = pick(path.map(function (n) { return n.label; })); syncInput(); if (pop.isOpen()) { initCursor(); render(); } }
  };
}


function parseList(ul) {
  return [].filter.call(ul.children, function (li) { return li.tagName === 'LI'; }).map(function (li) {
    var t = ''; [].forEach.call(li.childNodes, function (n) { if (n.nodeType === 3) t += n.textContent; });
    var node = { label: t.trim(), disabled: li.hasAttribute('data-disabled') };
    if (li.dataset.value != null) node.value = li.dataset.value;
    var sub = li.querySelector(':scope > ul'); if (sub) node.children = parseList(sub);
    return node;
  });
}
ZhaoUI.component('cascader', { selector: '[data-zh-cascader]', init: function (host) {
  var d = host.dataset, list = host.querySelector(':scope > ul'), data = list ? parseList(list) : [];
  var hidden = d.name ? document.createElement('input') : null;
  var ariaLabel = host.getAttribute('aria-label');
  function formValue(nodes) { return nodes.length && nodes.every(function (n) { return n.value != null; }) ? nodes.map(function (n) { return n.value; }).join('/') : nodes.map(function (n) { return n.label; }).join('/'); }
  var api = Cascader(host, {
    data: data, value: d.value ? d.value.split('/') : null, placeholder: d.placeholder || '请选择', searchable: d.searchable != null, clearable: d.clearable !== 'false',
    size: d.size || 'md', expandTrigger: d.expandTrigger || 'click', sep: d.sep != null ? d.sep : ' / ', labelledby: d.labelledby || '',
    onChange: function (labels, text, nodes) { if (hidden) hidden.value = formValue(nodes); }
  });
  if (ariaLabel) api.input.setAttribute('aria-label', ariaLabel);
  var lab = host.id ? document.querySelector('label[for="' + host.id + '"]') : null;          // <label for="hostId"> names the input and focuses it on click
  if (lab) { if (!lab.id) lab.id = ZH.uid('zh-lb'); api.input.setAttribute('aria-labelledby', lab.id); lab.addEventListener('click', function () { api.input.focus(); }); }
  if (hidden) { hidden.type = 'hidden'; hidden.name = d.name; hidden.value = formValue(api.getNodes()); host.appendChild(hidden); }
  var baseSet = api.set; api.set = function (labels) { baseSet(labels); if (hidden) hidden.value = formValue(api.getNodes()); };
  host.zhCascader = api;
} });
ZhaoUI.cascader = function (host, cfg) {
  host = typeof host === 'string' ? document.querySelector(host) : host; if (!host) return null;
  var api = Cascader(host, cfg || {}); host.zhCascader = api; return api;
};
