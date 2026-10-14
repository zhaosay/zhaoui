// Config-driven menus: ZhaoUI.menu(button, items, options) opens a menu with groups, separators, checkbox/radio items, shortcuts, icons and nested submenus;
// ZhaoUI.contextMenu(area, items, options) opens the same menu on right click (or Shift+F10 / the Menu key).  Item: { label, icon, shortcut, danger, disabled, type: 'sep'|'group'|'check'|'radio', checked, name, sub: [...] }.
function menuItemHtml(it, k) {
  if (it.type === 'sep') return '<div class="zh-dd-sep" role="separator"></div>';
  if (it.type === 'group') return '<div class="zh-dd-group" role="presentation">' + ZH.esc(it.label) + '</div>';
  var role = it.type === 'check' ? 'menuitemcheckbox' : it.type === 'radio' ? 'menuitemradio' : 'menuitem';
  var a = ' role="' + role + '" tabindex="-1" data-k="' + k + '"';
  if (it.type === 'check' || it.type === 'radio') a += ' aria-checked="' + !!it.checked + '"';
  if (it.disabled) a += ' aria-disabled="true"';
  if (it.sub) a += ' aria-haspopup="menu" aria-expanded="false"';
  var lead = it.type === 'radio' ? '<span class="zh-dd-radio"></span>' : it.type === 'check' ? ZH.iconHtml('check', 14) : it.icon ? ZH.iconHtml(it.icon, 16) : '';
  return '<div class="zh-dd-item' + (it.danger ? ' is-danger' : '') + '"' + a + '><span class="zh-dd-lead">' + lead + '</span><span class="zh-dd-label">' + ZH.esc(it.label) + '</span>' +
    (it.shortcut ? '<span class="zh-dd-kbd">' + ZH.esc(it.shortcut) + '</span>' : '') +
    (it.sub ? '<span class="zh-dd-caret">' + ZH.iconHtml('chevron-right', 14) + '</span>' : '') + '</div>';
}

function zhMenu(anchor, items, o) {
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
    box.innerHTML = list.map(menuItemHtml).join('');
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

function zhContextMenu(area, items, o) {
  o = o || {};
  var v = null;
  function openAt(x, y) {
    v = document.createElement('span'); v.className = 'zh-dd-vanchor'; v.style.left = x + 'px'; v.style.top = y + 'px';
    ZH.layer().appendChild(v);
    var mine = v;
    var p = zhMenu(mine, items, {
      trigger: 'manual', placement: 'bottom-start', offset: 2, restoreFocus: false, label: o.label || '上下文菜单',
      onSelect: o.onSelect || null,
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


ZhaoUI.menu = function (anchor, items, o) { anchor = ZhaoUI.ensure(anchor); return zhMenu(anchor, items, o); };
ZhaoUI.contextMenu = function (area, items, o) { area = ZhaoUI.ensure(area); if (!area.hasAttribute('tabindex')) area.tabIndex = 0; zhContextMenu(area, items, o); };
