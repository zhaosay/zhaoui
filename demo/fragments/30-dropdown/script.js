var sec = document.getElementById('dropdown');
var ic = ZH.iconHtml;
function $(s, r) { return (r || document).querySelector(s); }
function isPhone() { return window.matchMedia('(max-width: 767px)').matches || document.documentElement.getAttribute('data-screen') === 'phone'; }
function hl(text, q) {
  text = String(text);
  if (!q) return ZH.esc(text);
  var i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return ZH.esc(text);
  return ZH.esc(text.slice(0, i)) + '<mark class="zh-sel-hl">' + ZH.esc(text.slice(i, i + q.length)) + '</mark>' + ZH.esc(text.slice(i + q.length));
}
function flatten(list) {
  var out = [];
  list.forEach(function (o) {
    if (o.options) o.options.forEach(function (x) { out.push(Object.assign({}, x, { group: o.label })); });
    else out.push(o);
  });
  return out;
}
function wait(ms, v) { return new Promise(function (r) { setTimeout(function () { r(v); }, ms); }); }

/* ============================ Dropdown menu ============================ */
function itemHtml(it, k) {
  if (it.type === 'sep') return '<div class="zh-dd-sep" role="separator"></div>';
  if (it.type === 'group') return '<div class="zh-dd-group" role="presentation">' + ZH.esc(it.label) + '</div>';
  var role = it.type === 'check' ? 'menuitemcheckbox' : it.type === 'radio' ? 'menuitemradio' : 'menuitem';
  var a = ' role="' + role + '" tabindex="-1" data-k="' + k + '"';
  if (it.type === 'check' || it.type === 'radio') a += ' aria-checked="' + !!it.checked + '"';
  if (it.disabled) a += ' aria-disabled="true"';
  if (it.sub) a += ' aria-haspopup="menu" aria-expanded="false"';
  var lead = it.type === 'radio' ? '<span class="zh-dd-radio"></span>' : it.type === 'check' ? ic('check', 14) : it.icon ? ic(it.icon, 16) : '';
  return '<div class="zh-dd-item' + (it.danger ? ' is-danger' : '') + '"' + a + '><span class="zh-dd-lead">' + lead + '</span><span class="zh-dd-label">' + ZH.esc(it.label) + '</span>' +
    (it.shortcut ? '<span class="zh-dd-kbd">' + ZH.esc(it.shortcut) + '</span>' : '') +
    (it.sub ? '<span class="zh-dd-caret">' + ic('chevron-right', 14) + '</span>' : '') + '</div>';
}

function createMenu(anchor, items, o) {
  o = Object.assign({ placement: 'bottom-start', offset: 6, trigger: 'click', onSelect: null, onClose: null, label: '', restoreFocus: true }, o || {});
  var SEL = '.zh-dd-item:not([aria-disabled="true"])';
  var subs = [], offOut = null, want = 'first', pop;

  function allEls() { var a = [pop.el, anchor]; subs.forEach(function (s) { if (s.el) a.push(s.el); }); return a; }
  function closeFrom(lvl, keep) {
    subs = subs.filter(function (s) { if (s.lvl >= lvl && s.itemEl !== keep) { s.destroy(); return false; } return true; });
  }
  function openSub(itemEl, it, lvl) {
    var ex = subs.filter(function (s) { return s.itemEl === itemEl; })[0];
    if (ex && ex.isOpen()) return ex;
    closeFrom(lvl, itemEl);
    var sp = ZH.popover(itemEl, {
      content: function () { return buildBox(it.sub, lvl); }, trigger: 'manual', placement: 'right-start', offset: -4,
      role: 'menu', z: 'dropdown', closeOnOutside: false, closeOnEsc: false, restoreFocus: false
    });
    sp.itemEl = itemEl; sp.lvl = lvl; subs.push(sp); sp.open();
    return sp;
  }
  function pick(it, list, el) {
    if (it.type === 'check') { it.checked = !it.checked; el.setAttribute('aria-checked', String(it.checked)); if (o.onSelect) o.onSelect(it); return; }
    if (it.type === 'radio') {
      [].forEach.call(el.parentNode.querySelectorAll('[role=menuitemradio]'), function (n) {
        var x = list[+n.getAttribute('data-k')];
        if (x.name === it.name) { x.checked = (x === it); n.setAttribute('aria-checked', String(x === it)); }
      });
      if (o.onSelect) o.onSelect(it);
      return;
    }
    if (o.onSelect) o.onSelect(it);
    pop.close();
  }
  function buildBox(list, level) {
    var box = document.createElement('div');
    box.className = 'zh-dd-menu'; box.setAttribute('role', 'menu');
    if (o.label && level === 0) box.setAttribute('aria-label', o.label);
    box.innerHTML = list.map(itemHtml).join('');
    ZH.rovingFocus(box, SEL, { typeahead: true });
    box.addEventListener('click', function (e) {
      var el = e.target.closest('.zh-dd-item'); if (!el || !box.contains(el)) return;
      var it = list[+el.getAttribute('data-k')];
      if (!it || it.disabled) return;
      if (it.sub) { openSub(el, it, level + 1); return; }
      pick(it, list, el);
    });
    var ht;
    box.addEventListener('mouseover', function (e) {
      var el = e.target.closest('.zh-dd-item'); if (!el || !box.contains(el)) return;
      var it = list[+el.getAttribute('data-k')], dis = el.getAttribute('aria-disabled') === 'true';
      if (!dis && el !== document.activeElement) el.focus({ preventScroll: true });
      clearTimeout(ht);
      ht = setTimeout(function () { if (!dis && it && it.sub) openSub(el, it, level + 1); else closeFrom(level + 1); }, it && it.sub ? 120 : 40);
    });
    box.addEventListener('keydown', function (e) {
      var el = e.target.closest('.zh-dd-item');
      if (e.key === 'ArrowRight' && el && el.hasAttribute('aria-haspopup') && el.getAttribute('aria-disabled') !== 'true') {
        e.preventDefault();
        var sp = openSub(el, list[+el.getAttribute('data-k')], level + 1);
        var first = sp.el && sp.el.querySelector(SEL); if (first) first.focus({ preventScroll: true });
      } else if (e.key === 'ArrowLeft' && level > 0) {
        e.preventDefault();
        var owner = subs.filter(function (s) { return s.el && s.el.contains(box); })[0];
        if (owner) { var back = owner.itemEl; owner.destroy(); subs = subs.filter(function (s) { return s !== owner; }); back.focus({ preventScroll: true }); }
      }
    });
    return box;
  }
  pop = ZH.popover(anchor, {
    content: function () { return buildBox(items, 0); }, trigger: o.trigger, placement: o.placement, offset: o.offset,
    role: 'menu', z: 'dropdown', closeOnOutside: false, restoreFocus: o.restoreFocus,
    onOpen: function (el) {
      offOut = ZH.onOutside({ contains: function (t) { return allEls().some(function (n) { return n && n.contains(t); }); } }, function () { if (pop.isOpen()) pop.toggle(); });
      anchor.classList.add('is-open');
      requestAnimationFrame(function () {
        var list = el.querySelectorAll(SEL), t = want === 'last' ? list[list.length - 1] : list[0];
        want = 'first'; if (t) t.focus({ preventScroll: true });
      });
    },
    onClose: function () {
      if (offOut) offOut(); offOut = null;
      closeFrom(1); anchor.classList.remove('is-open');
      if (o.onClose) o.onClose();
    }
  });
  anchor.addEventListener('keydown', function (e) {
    if (o.trigger !== 'click' || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
    e.preventDefault(); want = e.key === 'ArrowUp' ? 'last' : 'first';
    if (!pop.isOpen()) pop.open();
  });
  return pop;
}

function contextMenu(area, items) {
  var v = null;
  function openAt(x, y) {
    v = document.createElement('span'); v.className = 'zh-dd-vanchor'; v.style.left = x + 'px'; v.style.top = y + 'px';
    ZH.layer().appendChild(v);
    var mine = v;
    var p = createMenu(mine, items, {
      trigger: 'manual', placement: 'bottom-start', offset: 2, restoreFocus: false, label: '上下文菜单',
      onSelect: function (it) { if (it.type !== 'check' && it.type !== 'radio') ZH.toast('已执行：' + it.label); },
      onClose: function () {
        area.classList.remove('is-open');
        var ae = document.activeElement;
        if (!ae || ae === document.body || (ae.closest && ae.closest('.zh-pop'))) area.focus({ preventScroll: true });
        setTimeout(function () { mine.remove(); }, 200);
      }
    });
    area.classList.add('is-open'); p.open();
  }
  area.addEventListener('contextmenu', function (e) { e.preventDefault(); openAt(e.clientX, e.clientY); });
  area.addEventListener('keydown', function (e) {
    if ((e.shiftKey && e.key === 'F10') || e.key === 'ContextMenu') {
      e.preventDefault(); var r = area.getBoundingClientRect(); openAt(r.left + r.width / 2, r.top + r.height / 2);
    }
  });
}

var fileMenu = [
  { type: 'group', label: '文件' },
  { label: '重命名', icon: 'pencil', shortcut: 'F2' },
  { label: '复制', icon: 'copy', shortcut: 'Ctrl+C' },
  { label: '移动到', icon: 'folder-open', sub: [{ label: '我的文档', icon: 'folder-open' }, { label: '项目归档', icon: 'archive' }, { label: '新建文件夹…', icon: 'folder-plus' }] },
  { type: 'sep' },
  { label: '分享', icon: 'share-2', sub: [{ label: '复制链接', icon: 'link' }, { label: '发送邮件', icon: 'mail' }, { label: '生成二维码', icon: 'qr-code' }] },
  { label: '导出为 PDF', icon: 'download', disabled: true },
  { type: 'sep' },
  { label: '删除', icon: 'trash-2', danger: true, shortcut: 'Del' }
];
var viewMenu = [
  { type: 'group', label: '显示' },
  { type: 'check', label: '网格线', checked: true },
  { type: 'check', label: '标尺', checked: false },
  { type: 'check', label: '缩略图', checked: true },
  { type: 'sep' },
  { type: 'group', label: '排序方式' },
  { type: 'radio', name: 'sort', label: '按名称', checked: true },
  { type: 'radio', name: 'sort', label: '按修改时间' },
  { type: 'radio', name: 'sort', label: '按大小' }
];
var userMenu = [
  { label: '个人资料', icon: 'user', shortcut: 'G P' },
  { label: '账户设置', icon: 'settings' },
  { label: '通知', icon: 'bell' },
  { type: 'sep' },
  { label: '退出登录', icon: 'log-out', danger: true }
];
var splitMenu = [
  { label: '保存并关闭', icon: 'save' },
  { label: '另存为副本', icon: 'copy' },
  { label: '保存为模板', icon: 'file-plus' }
];
var ctxMenu = [
  { label: '刷新', icon: 'refresh-cw', shortcut: 'F5' },
  { label: '新建文件', icon: 'file-plus' },
  { label: '新建文件夹', icon: 'folder-plus' },
  { type: 'sep' },
  { type: 'check', label: '显示隐藏文件', checked: false },
  { type: 'sep' },
  { label: '属性', icon: 'settings' }
];
function act(it) { if (it.type !== 'check' && it.type !== 'radio') ZH.toast('已执行：' + it.label); }

createMenu($('#ddBasic'), fileMenu, { onSelect: act, label: '文件操作' });
createMenu($('#ddView'), viewMenu, { label: '视图' });
createMenu($('#ddUser'), userMenu, { onSelect: act, placement: 'bottom-start', label: '账户' });
createMenu($('#ddSplitCaret'), splitMenu, { onSelect: act, placement: 'bottom-end', label: '保存方式' });
$('#ddSplitMain').addEventListener('click', function () { ZH.toast('已保存'); });
contextMenu($('#ddCtx'), ctxMenu);

var PLACES = [['top-start', '上 · 左'], ['top', '上 · 中'], ['top-end', '上 · 右'], ['bottom-start', '下 · 左'], ['bottom', '下 · 中'], ['bottom-end', '下 · 右'],
  ['left-start', '左 · 上'], ['left', '左 · 中'], ['left-end', '左 · 下'], ['right-start', '右 · 上'], ['right', '右 · 中'], ['right-end', '右 · 下']];
var placeItems = [{ label: '刷新', icon: 'refresh-cw' }, { label: '复制', icon: 'copy' }, { label: '分享', icon: 'share-2' }, { type: 'sep' }, { label: '删除', icon: 'trash-2', danger: true }];
var placeBtn = $('#ddPlaceBtn'), placeMenu = null, curPlace = 'bottom-start';
var chips = $('#ddChips');
chips.innerHTML = PLACES.map(function (p) { return '<button type="button" class="zh-dd-chip" data-p="' + p[0] + '" aria-pressed="' + (p[0] === curPlace) + '">' + p[1] + '</button>'; }).join('');
function buildPlace(open) {
  if (placeMenu) placeMenu.destroy();
  placeMenu = createMenu(placeBtn, placeItems, { placement: curPlace, onSelect: act, label: '位置示例' });
  if (open) setTimeout(function () { placeMenu.open(); }, 0);
}
buildPlace(false);
chips.addEventListener('click', function (e) {
  var b = e.target.closest('.zh-dd-chip'); if (!b) return;
  curPlace = b.getAttribute('data-p');
  [].forEach.call(chips.children, function (n) { n.setAttribute('aria-pressed', String(n === b)); });
  buildPlace(true);
});

/* ============================ Combobox: select + autocomplete ============================ */
function Combo(root, cfg) {
  var c = Object.assign({ multiple: false, searchable: false, clearable: false, size: 'md', placeholder: '请选择', options: [], maxTags: Infinity, freeText: false,
    chevron: true, prefixIcon: '', debounce: 250, emptyText: '无匹配项', labelledby: '', value: null, source: null, onChange: null, disabled: false, invalid: false, loading: false }, cfg);
  var id = ZH.uid('sel'), listId = id + '-list';
  var flat = flatten(c.options), cache = {};
  flat.forEach(function (o) { cache[o.value] = o; });
  var selected = c.value == null ? [] : [].concat(c.value);
  var query = '', dirty = false, active = -1, visible = [], loading = !!c.loading, token = 0, dtimer = null, buf = '', bt = null;
  var staticLoading = !!c.loading, pop;

  root.className = 'zh-sel zh-sel--' + c.size + (c.multiple ? ' is-multi' : '') + (c.clearable ? ' can-clear' : '') + (c.chevron ? '' : ' no-chev') +
    (c.disabled ? ' is-disabled' : '') + (c.invalid ? ' is-invalid' : '');
  root.innerHTML = '<div class="zh-sel-trigger">' + (c.prefixIcon ? '<span class="zh-sel-prefix">' + ic(c.prefixIcon, 16) + '</span>' : '') +
    '<input class="zh-sel-input" type="text" autocomplete="off" spellcheck="false" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-autocomplete="' + (c.searchable ? 'list' : 'none') + '"' +
    (c.searchable ? '' : ' readonly') + (c.disabled ? ' disabled' : '') + (c.invalid ? ' aria-invalid="true"' : '') + (c.labelledby ? ' aria-labelledby="' + c.labelledby + '"' : '') + '>' +
    '<span class="zh-sel-suffix"><span class="zh-sel-spin">' + ic('loader-circle', 16) + '</span><button type="button" class="zh-sel-clear" tabindex="-1" aria-label="清除">' + ic('x', 12) + '</button>' +
    (c.chevron ? '<span class="zh-sel-chev">' + ic('chevron-down', 16) + '</span>' : '') + '</span></div>';
  var trigger = root.firstChild, input = trigger.querySelector('.zh-sel-input');
  if (staticLoading) root.classList.add('is-loading');

  function labelOf(v) { var o = cache[v]; return o ? o.label : String(v); }
  function hasValue() { return c.freeText ? !!input.value : selected.length > 0; }
  function shownQuery() { return (dirty || c.freeText) ? query.trim() : ''; }
  function syncInput() {
    if (c.multiple) input.placeholder = selected.length ? '' : c.placeholder;
    else { if (!c.freeText) input.value = selected.length ? labelOf(selected[0]) : ''; input.placeholder = c.placeholder; }
    root.classList.toggle('has-value', hasValue());
  }
  function renderTags() {
    [].forEach.call(trigger.querySelectorAll('.zh-sel-tag'), function (t) { t.remove(); });
    if (!c.multiple) return;
    var show = selected.slice(0, c.maxTags), rest = selected.length - show.length;
    show.forEach(function (v, i) {
      var t = document.createElement('span'); t.className = 'zh-sel-tag'; t.setAttribute('data-i', i);
      t.innerHTML = '<span>' + ZH.esc(labelOf(v)) + '</span>' + (c.disabled ? '' : '<button type="button" tabindex="-1" aria-label="移除 ' + ZH.esc(labelOf(v)) + '">' + ic('x', 12) + '</button>');
      trigger.insertBefore(t, input);
    });
    if (rest > 0) {
      var m = document.createElement('span'); m.className = 'zh-sel-tag zh-sel-tag--more';
      m.title = selected.slice(c.maxTags).map(labelOf).join('、'); m.setAttribute('aria-label', '另有 ' + rest + ' 项：' + m.title);
      m.innerHTML = '<span>+' + rest + '</span>'; trigger.insertBefore(m, input);
    }
  }
  function emit() {
    var v = c.multiple ? selected.slice() : (c.freeText ? input.value : selected[0]);
    var labels = c.freeText ? [input.value] : selected.map(labelOf);
    if (c.onChange) c.onChange(v, labels);
    root.dispatchEvent(new CustomEvent('zh-sel-change', { detail: { value: v, labels: labels }, bubbles: true }));
  }

  function computeVisible() {
    var q = shownQuery().toLowerCase();
    visible = c.source ? flat.slice() : flat.filter(function (o) {
      return !q || String(o.label).toLowerCase().indexOf(q) > -1 || String(o.desc || '').toLowerCase().indexOf(q) > -1 || String(o.keys || '').toLowerCase().indexOf(q) > -1;
    });
  }
  function optHtml(o, i, q) {
    var sel = !c.freeText && selected.indexOf(o.value) > -1;
    return '<div class="zh-sel-opt" role="option" id="' + id + '-o' + i + '" data-i="' + i + '" aria-selected="' + sel + '"' + (o.disabled ? ' aria-disabled="true"' : '') + '>' +
      (c.multiple ? '<span class="zh-sel-box">' + ic('check', 12) + '</span>' : '') +
      (o.icon ? '<span class="zh-sel-ico">' + ic(o.icon, 16) + '</span>' : '') +
      '<span class="zh-sel-text"><span class="zh-sel-label">' + hl(o.label, q) + '</span>' + (o.desc ? '<span class="zh-sel-desc">' + hl(o.desc, q) + '</span>' : '') + '</span>' +
      (!c.multiple && sel ? '<span class="zh-sel-check">' + ic('check', 16) + '</span>' : '') + '</div>';
  }
  function listHtml() {
    if (loading) return '<div class="zh-sel-msg" role="option" aria-disabled="true"><span class="zh-sel-rot">' + ic('loader-circle', 16) + '</span>加载中…</div>';
    if (!visible.length) return '<div class="zh-sel-msg" role="option" aria-disabled="true">' + ic('search-x', 16) + ZH.esc(c.emptyText) + '</div>';
    var q = shownQuery(), html = '', last, openG = false;
    visible.forEach(function (o, i) {
      if (o.group !== last) {
        if (openG) html += '</div>';
        openG = false;
        if (o.group != null) { var gid = id + '-g' + i; html += '<div role="group" aria-labelledby="' + gid + '"><div class="zh-sel-group" id="' + gid + '" role="presentation">' + ZH.esc(o.group) + '</div>'; openG = true; }
        last = o.group;
      }
      html += optHtml(o, i, q);
    });
    return html + (openG ? '</div>' : '');
  }
  function listEl() { return pop && pop.el ? pop.el.querySelector('.zh-sel-list') : null; }
  function edge(dir) {
    var i, n = visible.length;
    if (dir > 0) { for (i = 0; i < n; i++) if (!visible[i].disabled) return i; } else { for (i = n - 1; i >= 0; i--) if (!visible[i].disabled) return i; }
    return -1;
  }
  function firstIdx() {
    if (c.freeText) return -1;
    if (!dirty) for (var i = 0; i < visible.length; i++) if (!visible[i].disabled && selected.indexOf(visible[i].value) > -1) return i;
    return edge(1);
  }
  function setActive(i, scroll) {
    active = i;
    var l = listEl(); if (!l) return;
    var prev = l.querySelector('.zh-sel-opt.is-active'); if (prev) prev.classList.remove('is-active');
    if (i < 0 || !visible[i]) { input.removeAttribute('aria-activedescendant'); return; }
    var el = document.getElementById(id + '-o' + i); if (!el) return;
    el.classList.add('is-active'); input.setAttribute('aria-activedescendant', el.id);
    if (scroll) el.scrollIntoView({ block: 'nearest' });
  }
  function move(d) {
    var n = visible.length; if (!n) return;
    var i = active < 0 && d < 0 ? 0 : active;
    for (var k = 0; k < n; k++) { i = (i + d + n) % n; if (!visible[i].disabled) { setActive(i, true); return; } }
  }
  function refresh(keep) {
    computeVisible();
    var l = listEl(); if (!l) return;
    l.innerHTML = listHtml(); ZH.hydrateIcons(l); l.setAttribute('aria-busy', String(loading));
    setActive(keep ? Math.min(active, visible.length - 1) : firstIdx(), true);
    pop.update();
  }
  function search(q) {
    var t = ++token; loading = true; root.classList.add('is-loading'); refresh();
    Promise.resolve(c.source(q)).then(function (res) {
      if (t !== token) return;
      flat = flatten(res); flat.forEach(function (o) { cache[o.value] = o; });
      loading = staticLoading; if (!staticLoading) root.classList.remove('is-loading');
      refresh();
    });
  }
  function closeList() { if (pop && pop.isOpen()) pop.toggle(); }
  function openList() {
    if (c.disabled || pop.isOpen()) return;
    computeVisible(); pop.open();
    if (c.source && !staticLoading) search(dirty ? query : '');
  }
  function choose(o) {
    if (!o || o.disabled) return;
    if (c.freeText) { input.value = o.label; query = o.label; syncInput(); emit(); closeList(); return; }
    if (c.multiple) {
      var k = selected.indexOf(o.value);
      if (k > -1) selected.splice(k, 1); else selected.push(o.value);
      query = ''; dirty = false; input.value = ''; renderTags(); syncInput(); emit(); refresh(true); setActive(visible.indexOf(o), true);
      return;
    }
    selected = [o.value]; dirty = false; query = ''; syncInput(); emit(); closeList();
  }
  function clearAll() { selected = []; input.value = ''; query = ''; dirty = false; renderTags(); syncInput(); emit(); closeList(); }
  function removeAt(i) { selected.splice(i, 1); renderTags(); syncInput(); emit(); if (pop.isOpen()) refresh(true); }

  pop = ZH.popover(root, {
    content: function () {
      var l = document.createElement('div'); l.className = 'zh-sel-list'; l.id = listId; l.setAttribute('role', 'listbox');
      if (c.multiple) l.setAttribute('aria-multiselectable', 'true');
      if (c.labelledby) l.setAttribute('aria-labelledby', c.labelledby);
      l.innerHTML = listHtml(); return l;
    },
    trigger: 'manual', role: 'presentation', z: 'dropdown', placement: 'bottom-start', offset: 4, matchWidth: true, restoreFocus: false,
    onOpen: function (el) {
      root.removeAttribute('aria-expanded'); root.removeAttribute('aria-controls');
      root.classList.add('is-open'); input.setAttribute('aria-expanded', 'true'); input.setAttribute('aria-controls', listId);
      var l = el.querySelector('.zh-sel-list');
      l.addEventListener('mousedown', function (e) { e.preventDefault(); });
      l.addEventListener('click', function (e) { var n = e.target.closest('.zh-sel-opt'); if (n && n.getAttribute('data-i') != null) choose(visible[+n.getAttribute('data-i')]); });
      l.addEventListener('mousemove', function (e) { var n = e.target.closest('.zh-sel-opt'); if (n && n.getAttribute('data-i') != null && !visible[+n.getAttribute('data-i')].disabled && +n.getAttribute('data-i') !== active) setActive(+n.getAttribute('data-i'), false); });
      setActive(firstIdx(), true);
      if (!c.multiple && c.searchable && !c.freeText) input.select();
    },
    onClose: function () {
      root.removeAttribute('aria-expanded'); root.removeAttribute('aria-controls');
      root.classList.remove('is-open'); input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-controls'); input.removeAttribute('aria-activedescendant'); active = -1;
      if (!c.freeText) { dirty = false; query = ''; syncInput(); }
    }
  });
  root.removeAttribute('aria-haspopup'); root.removeAttribute('aria-expanded');

  trigger.addEventListener('click', function (e) {
    if (c.disabled) return;
    if (e.target.closest('.zh-sel-clear')) { clearAll(); input.focus(); return; }
    var rm = e.target.closest('.zh-sel-tag button');
    if (rm) { removeAt(+rm.parentNode.getAttribute('data-i')); input.focus(); return; }
    input.focus();
    if (pop.isOpen()) { if (e.target !== input || !c.searchable) closeList(); } else if (!(c.freeText)) openList();
  });
  input.addEventListener('input', function () {
    if (!c.searchable) return;
    query = input.value; dirty = true; root.classList.toggle('has-value', hasValue());
    if (c.freeText && !query.trim()) { closeList(); return; }
    if (!pop.isOpen()) { computeVisible(); pop.open(); }
    if (c.source) { clearTimeout(dtimer); loading = true; root.classList.add('is-loading'); refresh(); dtimer = setTimeout(function () { search(query); }, c.debounce); }
    else { refresh(); }
  });
  input.addEventListener('keydown', function (e) {
    if (c.disabled) return;
    var k = e.key, open = pop.isOpen();
    if (k === 'ArrowDown' || k === 'ArrowUp') {
      e.preventDefault();
      if (!open) { openList(); if (k === 'ArrowUp') setActive(edge(-1), true); } else move(k === 'ArrowDown' ? 1 : -1);
    } else if (k === 'Enter') {
      if (open && active >= 0) { e.preventDefault(); choose(visible[active]); } else if (!open && !c.freeText) { e.preventDefault(); openList(); }
    } else if ((k === 'Home' || k === 'End') && !c.searchable) {
      e.preventDefault(); if (!open) openList(); setActive(edge(k === 'Home' ? 1 : -1), true);
    } else if (k === 'Tab') { if (open) closeList(); }
    else if (k === 'Backspace' && c.multiple && !input.value && selected.length) { removeAt(selected.length - 1); }
    else if (k === ' ' && !c.searchable) { e.preventDefault(); if (open && active >= 0) choose(visible[active]); else openList(); }
    else if (!c.searchable && k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      buf += k.toLowerCase(); clearTimeout(bt); bt = setTimeout(function () { buf = ''; }, 600);
      if (!open) openList();
      var hit = -1; visible.forEach(function (o, i) { if (hit < 0 && !o.disabled && String(o.label).toLowerCase().indexOf(buf) === 0) hit = i; });
      if (hit > -1) setActive(hit, true);
    }
  });
  root.addEventListener('focusout', function (e) { if (!root.contains(e.relatedTarget)) closeList(); });

  renderTags(); syncInput();
  var api = {
    el: root, input: input, get: function () { return c.multiple ? selected.slice() : (c.freeText ? input.value : selected[0]); },
    set: function (v) { selected = v == null ? [] : [].concat(v); renderTags(); syncInput(); },
    setInvalid: function (b) { root.classList.toggle('is-invalid', b); if (b) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); },
    open: openList, close: closeList, isOpen: function () { return pop.isOpen(); }, pop: pop
  };
  return api;
}

/* ---- demo data ---- */
var REGIONS = [{ value: 'east', label: '华东' }, { value: 'south', label: '华南' }, { value: 'north', label: '华北' }, { value: 'west', label: '西南' }, { value: 'ne', label: '东北' }];
var PEOPLE = [
  { value: 'zs', label: '张三', desc: '产品经理', icon: 'user-round', keys: 'zhangsan zs' }, { value: 'ls', label: '李四', desc: '视觉设计师', icon: 'user-round', keys: 'lisi ls' },
  { value: 'ww', label: '王五', desc: '前端工程师', icon: 'user-round', keys: 'wangwu ww' }, { value: 'zl', label: '赵六', desc: '后端工程师', icon: 'user-round', keys: 'zhaoliu zl' },
  { value: 'cq', label: '陈七', desc: '测试工程师', icon: 'user-round', keys: 'chenqi cq' }, { value: 'zb', label: '周八', desc: '运营专员', icon: 'user-round', keys: 'zhouba zb' }
];
var DEPTS = [
  { label: '研发中心', options: [{ value: 'fe', label: '前端组' }, { value: 'be', label: '后端组' }, { value: 'qa', label: '测试组' }] },
  { label: '产品设计', options: [{ value: 'pm', label: '产品组' }, { value: 'ux', label: '设计组' }] },
  { label: '运营支持', options: [{ value: 'op', label: '运营组' }, { value: 'cs', label: '客服组' }] }
];
var PLANS = [{ value: 'basic', label: '基础版', desc: '个人使用' }, { value: 'std', label: '标准版', desc: '小团队' }, { value: 'pro', label: '专业版', desc: '暂不可选', disabled: true }, { value: 'ent', label: '企业版', desc: '大型组织' }];
var TAGS = ['前端', '后端', '设计', '测试', '运维', '产品', '运营'].map(function (t) { return { value: t, label: t }; });
var TECH = ['Vue', 'React', 'Svelte', 'Angular', 'Solid', 'Preact', 'Nuxt', 'Next.js', 'Astro', 'Vite', 'Webpack', 'Rollup', 'esbuild', 'TypeScript', 'JavaScript', 'Node.js', 'Deno', 'Bun', 'Tailwind', 'Sass'];
var CITIES = [['北京', 'beijing bj', '直辖市'], ['上海', 'shanghai sh', '直辖市'], ['广州', 'guangzhou gz', '广东省'], ['深圳', 'shenzhen sz', '广东省'], ['杭州', 'hangzhou hz', '浙江省'], ['南京', 'nanjing nj', '江苏省'],
  ['成都', 'chengdu cd', '四川省'], ['武汉', 'wuhan wh', '湖北省'], ['西安', 'xian xa', '陕西省'], ['重庆', 'chongqing cq', '直辖市'], ['苏州', 'suzhou sz', '江苏省'], ['天津', 'tianjin tj', '直辖市'],
  ['长沙', 'changsha cs', '湖南省'], ['郑州', 'zhengzhou zz', '河南省'], ['青岛', 'qingdao qd', '山东省'], ['厦门', 'xiamen xm', '福建省'], ['宁波', 'ningbo nb', '浙江省'], ['南昌', 'nanchang nc', '江西省'],
  ['沈阳', 'shenyang sy', '辽宁省'], ['大连', 'dalian dl', '辽宁省'], ['昆明', 'kunming km', '云南省'], ['合肥', 'hefei hf', '安徽省']].map(function (x) { return { value: x[0], label: x[0], desc: x[2], keys: x[1], icon: 'map-pin' }; });

function echo(name, fn) { var el = sec.querySelector('[data-echo="' + name + '"]'); return function (v, labels) { if (el) el.textContent = fn(v, labels); }; }
function mount(name, cfg) { var host = sec.querySelector('[data-sel="' + name + '"]'); return Combo(host, cfg); }
var sels = {};
sels.basic = mount('basic', { options: REGIONS, placeholder: '请选择区域', labelledby: 'lbSelBasic', onChange: echo('basic', function (v, l) { return '当前值：' + l[0]; }) });
sels.clear = mount('clear', { options: REGIONS, value: 'east', clearable: true, placeholder: '请选择区域', labelledby: 'lbSelClear', onChange: echo('clear', function (v, l) { return '当前值：' + (l[0] || '—'); }) });
sels.search = mount('search', { options: PEOPLE, searchable: true, clearable: true, placeholder: '搜索姓名或拼音（如 zs）', labelledby: 'lbSelSearch', onChange: echo('search', function (v, l) { return '当前值：' + l[0]; }) });
sels.group = mount('group', { options: DEPTS, searchable: true, placeholder: '请选择部门', labelledby: 'lbSelGroup', onChange: echo('group', function (v, l) { return '当前值：' + l[0]; }) });
sels.disopt = mount('disopt', { options: PLANS, placeholder: '请选择套餐', labelledby: 'lbSelDis' });
sels.remote = mount('remote', {
  searchable: true, clearable: true, placeholder: '搜索前端技术…', labelledby: 'lbSelRemote', debounce: 300,
  source: function (q) { return wait(550).then(function () { return TECH.filter(function (t) { return !q || t.toLowerCase().indexOf(q.toLowerCase()) > -1; }).map(function (t) { return { value: t, label: t }; }); }); }
});
sels.multi = mount('multi', { options: TAGS, multiple: true, searchable: true, value: ['前端', '设计'], placeholder: '请选择标签', labelledby: 'lbSelMulti', onChange: echo('multi', function (v) { return '已选 ' + v.length + ' 项'; }) });
sels.max = mount('max', { options: TAGS, multiple: true, maxTags: 2, value: ['前端', '后端', '设计', '测试'], clearable: true, placeholder: '请选择标签', labelledby: 'lbSelMax', onChange: echo('max', function (v) { return '已选 ' + v.length + ' 项'; }) });
mount('sm', { options: REGIONS, size: 'sm', placeholder: '请选择', labelledby: 'lbSelSm' });
mount('md', { options: REGIONS, size: 'md', placeholder: '请选择', labelledby: 'lbSelMd' });
mount('lg', { options: REGIONS, size: 'lg', placeholder: '请选择', labelledby: 'lbSelLg' });
var errMsg = $('#selErrMsg');
sels.error = mount('error', { options: DEPTS, invalid: true, placeholder: '请选择部门', labelledby: 'lbSelErr', onChange: function (v) { sels.error.setInvalid(!v); errMsg.style.display = v ? 'none' : ''; } });
mount('disabled', { options: REGIONS, value: 'east', disabled: true, labelledby: 'lbSelOff' });
mount('loading', { options: REGIONS, loading: true, placeholder: '正在加载选项…', labelledby: 'lbSelLoad' });
mount('empty', { options: [], emptyText: '暂无可选项', placeholder: '请选择', labelledby: 'lbSelEmpty' });
sels.ac = mount('ac', {
  freeText: true, searchable: true, chevron: false, prefixIcon: 'search', placeholder: '输入城市名或拼音', labelledby: 'lbAc', debounce: 250, emptyText: '没有匹配的城市，可直接使用输入的文字',
  source: function (q) { q = q.trim().toLowerCase(); return wait(450).then(function () { return CITIES.filter(function (o) { return o.label.indexOf(q) > -1 || o.keys.indexOf(q) > -1; }).slice(0, 8); }); },
  onChange: echo('ac', function (v) { return '当前值：' + v; })
});

/* ============================ Cascader ============================ */
var REGION_TREE = [
  { label: '浙江', children: [{ label: '杭州', children: [{ label: '西湖区' }, { label: '余杭区' }, { label: '滨江区' }] }, { label: '宁波', children: [{ label: '海曙区' }, { label: '鄞州区' }] }, { label: '温州', children: [{ label: '鹿城区' }, { label: '龙湾区' }] }] },
  { label: '江苏', children: [{ label: '南京', children: [{ label: '玄武区' }, { label: '鼓楼区' }, { label: '江宁区' }] }, { label: '苏州', children: [{ label: '姑苏区' }, { label: '工业园区' }] }] },
  { label: '广东', children: [{ label: '广州', children: [{ label: '天河区' }, { label: '越秀区' }] }, { label: '深圳', children: [{ label: '南山区' }, { label: '福田区' }, { label: '宝安区' }] }] },
  { label: '四川', children: [{ label: '成都', children: [{ label: '锦江区' }, { label: '武侯区' }, { label: '高新区' }] }] },
  { label: '北京', children: [{ label: '北京市', children: [{ label: '朝阳区' }, { label: '海淀区' }] }] },
  { label: '上海', children: [{ label: '上海市', children: [{ label: '浦东新区' }, { label: '徐汇区' }] }] },
  { label: '海南', disabled: true, children: [{ label: '海口', children: [{ label: '龙华区' }] }] }
];

function Cascader(root, cfg) {
  var c = Object.assign({ expandTrigger: 'click', searchable: false, clearable: true, size: 'md', placeholder: '请选择地区', data: [], labelledby: '', sep: ' / ', onChange: null, value: null }, cfg);
  var id = ZH.uid('cas'), pop, path = [], cursor = [], aL = 0, aI = 0, q = '', results = [], rI = 0, drill = false, ht, kb = false;

  root.className = 'zh-sel zh-sel--' + c.size + (c.clearable ? ' can-clear' : '');
  root.innerHTML = '<div class="zh-sel-trigger"><input class="zh-sel-input" type="text" autocomplete="off" spellcheck="false" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-autocomplete="' + (c.searchable ? 'list' : 'none') + '"' +
    (c.searchable ? '' : ' readonly') + (c.labelledby ? ' aria-labelledby="' + c.labelledby + '"' : '') + ' placeholder="' + ZH.esc(c.placeholder) + '">' +
    '<span class="zh-sel-suffix"><button type="button" class="zh-sel-clear" tabindex="-1" aria-label="清除">' + ic('x', 12) + '</button><span class="zh-sel-chev">' + ic('chevron-down', 16) + '</span></span></div>';
  var trigger = root.firstChild, input = trigger.querySelector('input');

  function cols() { var out = [c.data]; cursor.forEach(function (n) { if (n.children && n.children.length) out.push(n.children); }); return out; }
  function pathText(nodes) { return nodes.map(function (n) { return n.label; }).join(c.sep); }
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
    if (c.onChange) c.onChange(path.map(function (n) { return n.label; }), pathText(path));
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
    if (e.target.closest('.zh-sel-clear')) { path = []; syncInput(); if (c.onChange) c.onChange([], ''); input.focus(); close(); return; }
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
  return { el: root, input: input, open: open, close: close, get: function () { return path.map(function (n) { return n.label; }); } };
}
function mountCas(name, cfg) { return Cascader(sec.querySelector('[data-cas="' + name + '"]'), cfg); }
var cas = {};
cas.click = mountCas('click', { data: REGION_TREE, labelledby: 'lbCas1', onChange: echo('cas1', function (v, t) { return '当前值：' + (t || '—'); }) });
cas.hover = mountCas('hover', { data: REGION_TREE, expandTrigger: 'hover', value: ['浙江', '杭州', '西湖区'], labelledby: 'lbCas2', onChange: echo('cas2', function (v, t) { return '当前值：' + (t || '—'); }) });
cas.search = mountCas('search', { data: REGION_TREE, searchable: true, labelledby: 'lbCas3', placeholder: '搜索地区', onChange: echo('cas3', function (v, t) { return '当前值：' + (t || '—'); }) });
window.ZHDropdown = { createMenu: createMenu, Combo: Combo, Cascader: Cascader, sels: sels, cas: cas };
