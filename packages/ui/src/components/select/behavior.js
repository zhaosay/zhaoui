// Select / combobox. Two ways in:
//   1. Enhance a native <select>:   <select data-zh-select name="region"> <option value="east">华东</option> ... </select>
//      Options, optgroups, disabled, multiple, required, name and the selected value all come from the <select>; the chosen value is written back to it and
//      a native `change` event fires, so forms and existing code keep working. data-*: searchable, clearable, size (sm|md|lg), placeholder, empty-text, max-tags, prefix-icon.
//      Option extras: data-desc (second line), data-icon, data-keys (extra search words).
//   2. Imperative:   ZhaoUI.select(hostElement, { options, multiple, searchable, clearable, source(q) -> Promise, freeText, ... })  (autocomplete = freeText + source)
// Fires zh:select-change { value, labels } on the control. Returned api: get, set, setOptions, setDisabled, setInvalid, open, close.
var ic = ZH.iconHtml;
function keepClasses(el) { return (el.className || '').split(/\s+/).filter(function (x) { return x && x.indexOf('zh-sel') !== 0 && x !== 'is-multi' && x !== 'can-clear' && x !== 'no-chev' && x !== 'is-disabled' && x !== 'is-invalid' && x !== 'is-open' && x !== 'has-value' && x !== 'is-loading'; }).join(' ') + ' '; }
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
function Combo(root, cfg) {
  var c = Object.assign({ multiple: false, searchable: false, clearable: false, size: 'md', placeholder: '请选择', options: [], maxTags: Infinity, freeText: false,
    chevron: true, prefixIcon: '', debounce: 250, emptyText: '无匹配项', labelledby: '', value: null, source: null, onChange: null, disabled: false, invalid: false, loading: false }, cfg);
  var id = ZH.uid('sel'), listId = id + '-list';
  var flat = flatten(c.options), cache = {};
  flat.forEach(function (o) { cache[o.value] = o; });
  var selected = c.value == null ? [] : [].concat(c.value);
  var query = '', dirty = false, active = -1, visible = [], loading = !!c.loading, token = 0, dtimer = null, buf = '', bt = null;
  var staticLoading = !!c.loading, pop;

  root.className = keepClasses(root) + 'zh-sel zh-sel--' + c.size + (c.multiple ? ' is-multi' : '') + (c.clearable ? ' can-clear' : '') + (c.chevron ? '' : ' no-chev') +
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
    root.dispatchEvent(new CustomEvent('zh:select-change', { detail: { value: v, labels: labels }, bubbles: true }));
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
    open: openList, close: closeList, isOpen: function () { return pop.isOpen(); }, pop: pop,
    setOptions: function (list) {
      c.options = list; flat = flatten(list); cache = {}; flat.forEach(function (o) { cache[o.value] = o; });
      selected = selected.filter(function (v) { return cache[v]; });
      renderTags(); syncInput(); if (pop.isOpen()) refresh(true);
    },
    setDisabled: function (b) {
      c.disabled = !!b; root.classList.toggle('is-disabled', c.disabled); input.disabled = c.disabled; renderTags();
      if (c.disabled) closeList();
    }
  };
  return api;
}



function readSelect(sel) {
  var opts = [], placeholder = sel.getAttribute('data-placeholder') || '', hasEmpty = false;
  function one(o) { return { value: o.value, label: o.textContent.trim(), desc: o.dataset.desc || '', icon: o.dataset.icon || '', keys: o.dataset.keys || '', disabled: o.disabled }; }
  [].forEach.call(sel.children, function (ch) {
    if (ch.tagName === 'OPTGROUP') opts.push({ label: ch.label, options: [].map.call(ch.querySelectorAll('option'), one) });
    else if (ch.tagName === 'OPTION') {
      if (ch.value === '') { hasEmpty = true; if (!placeholder) placeholder = ch.textContent.trim(); return; }   // the empty option is the placeholder, not a choice
      opts.push(one(ch));
    }
  });
  var vals = [].filter.call(sel.options, function (o) { return o.selected && o.value !== ''; }).map(function (o) { return o.value; });
  return { options: opts, placeholder: placeholder || '请选择', hasEmpty: hasEmpty, values: vals };
}
function writeSelect(sel, v, hasEmpty) {
  var arr = v == null || v === '' ? [] : [].concat(v);
  [].forEach.call(sel.options, function (o) { o.selected = arr.indexOf(o.value) > -1; });
  if (!arr.length) { if (hasEmpty) sel.value = ''; else if (!sel.multiple) sel.selectedIndex = -1; }
}
ZhaoUI.component('select', { selector: 'select[data-zh-select]', init: function (sel) {
  var info = readSelect(sel), d = sel.dataset, host = document.createElement('div');
  var label = sel.id ? document.querySelector('label[for="' + sel.id + '"]') : null;
  if (label && !label.id) label.id = ZH.uid('zh-lb');
  sel.insertAdjacentElement('afterend', host);
  sel.classList.add('zh-sel-native'); sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
  var api = Combo(host, {
    options: info.options, placeholder: info.placeholder, multiple: sel.multiple, searchable: d.searchable != null, clearable: d.clearable != null,
    size: d.size || 'md', emptyText: d.emptyText || '无匹配项', maxTags: d.maxTags ? +d.maxTags : Infinity, prefixIcon: d.prefixIcon || '',
    disabled: sel.disabled, invalid: sel.getAttribute('aria-invalid') === 'true', labelledby: label ? label.id : '',
    value: sel.multiple ? info.values : (info.values[0] != null ? info.values[0] : null),
    onChange: function (v) { writeSelect(sel, v, info.hasEmpty); sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  if (sel.getAttribute('aria-label')) api.input.setAttribute('aria-label', sel.getAttribute('aria-label'));
  var baseSet = api.set; api.set = function (v) { baseSet(v); writeSelect(sel, v, info.hasEmpty); };   // programmatic set keeps the native select in step, without firing change
  var baseSetOptions = api.setOptions;                                                                   // keep the native <option>s in step with the control, so form data never disagrees with what is shown
  api.setOptions = function (list) {
    baseSetOptions(list);
    var keep = api.get(); sel.innerHTML = '';
    if (info.hasEmpty) { var e = document.createElement('option'); e.value = ''; e.textContent = info.placeholder; sel.appendChild(e); }
    function add(parent, o) { var x = document.createElement('option'); x.value = o.value; x.textContent = o.label; if (o.disabled) x.disabled = true; if (o.desc) x.dataset.desc = o.desc; parent.appendChild(x); }
    list.forEach(function (o) { if (o.options) { var g = document.createElement('optgroup'); g.label = o.label; o.options.forEach(function (x) { add(g, x); }); sel.appendChild(g); } else add(sel, o); });
    writeSelect(sel, keep, info.hasEmpty);
  };
  sel.addEventListener('focus', function () { api.input.focus(); });                                     // <label for> and form validation focus the native select; forward it
  if (sel.form) sel.form.addEventListener('reset', function () { setTimeout(function () { var r = readSelect(sel); baseSet(sel.multiple ? r.values : (r.values[0] != null ? r.values[0] : null)); }, 0); });
  sel.zhSelect = api;
} });
ZhaoUI.select = function (host, cfg) {
  host = typeof host === 'string' ? document.querySelector(host) : host; if (!host) return null;
  var api = Combo(host, cfg || {}); host.zhSelect = api; return api;
};
