// ZH core helpers. Available to every fragment as ZH.* (also on window.ZHDemo for debugging).
ZH.uid = (function () { var n = 0; return function (p) { return (p || 'zh') + '-' + (++n); }; })();
ZH.esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
ZH.visible = function (n) { return !!(n.offsetWidth || n.offsetHeight || n.getClientRects().length); };
ZH.reduced = function () { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); };

ZH.layer = function () {
  var l = document.getElementById('zhLayer');
  if (!l) { l = document.createElement('div'); l.id = 'zhLayer'; l.className = 'zh-layer'; document.body.appendChild(l); }
  return l;
};
// A <dialog> lives in the browser top layer, so popups opened from inside one must be mounted inside it.
ZH.mountFor = function (anchor) { return (anchor && anchor.closest && anchor.closest('dialog[open]')) || ZH.layer(); };

ZH.onOutside = function (els, fn) {
  els = [].concat(els);
  function h(e) { if (!els.some(function (el) { return el && el.contains(e.target); })) fn(e); }
  document.addEventListener('mousedown', h, true); document.addEventListener('touchstart', h, true);
  return function () { document.removeEventListener('mousedown', h, true); document.removeEventListener('touchstart', h, true); };
};

/** Position `el` (position:fixed) next to `anchor`. placement: top|bottom|left|right[-start|-end]. Flips and shifts to stay on screen. */
ZH.place = function (anchor, el, o) {
  o = o || {};
  var gap = o.offset == null ? 6 : o.offset, pad = 8;
  var a = anchor.getBoundingClientRect();
  var w = el.offsetWidth, h = el.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
  var parts = (o.placement || 'bottom-start').split('-'), main = parts[0], al = parts[1] || 'center';
  function at(m) {
    var x, y;
    if (m === 'bottom') y = a.bottom + gap; else if (m === 'top') y = a.top - h - gap;
    else if (m === 'left') x = a.left - w - gap; else x = a.right + gap;
    if (m === 'top' || m === 'bottom') x = al === 'start' ? a.left : al === 'end' ? a.right - w : a.left + (a.width - w) / 2;
    else y = al === 'start' ? a.top : al === 'end' ? a.bottom - h : a.top + (a.height - h) / 2;
    return { x: x, y: y, m: m };
  }
  function fits(p) {
    return p.m === 'bottom' ? p.y + h <= vh - pad : p.m === 'top' ? p.y >= pad : p.m === 'left' ? p.x >= pad : p.x + w <= vw - pad;
  }
  var p = at(main);
  if (o.flip !== false && !fits(p)) {
    var q = at({ bottom: 'top', top: 'bottom', left: 'right', right: 'left' }[main]);
    if (fits(q)) p = q;
  }
  p.x = Math.max(pad, Math.min(p.x, vw - w - pad)); p.y = Math.max(pad, Math.min(p.y, vh - h - pad));
  el.style.left = p.x + 'px'; el.style.top = p.y + 'px';
  el.setAttribute('data-placement', p.m + (al !== 'center' ? '-' + al : ''));
  el.style.setProperty('--zh-arrow-x', Math.max(14, Math.min(w - 14, a.left + a.width / 2 - p.x)) + 'px');
  el.style.setProperty('--zh-arrow-y', Math.max(14, Math.min(h - 14, a.top + a.height / 2 - p.y)) + 'px');
  return p;
};

/**
 * Attach a floating surface to an anchor.
 *   var pop = ZH.popover(btn, { content: node|html|fn(api), trigger: 'click'|'hover'|'focus'|'manual',
 *     placement, offset, arrow, z: 'dropdown'|'popover'|'tooltip', role, className, matchWidth, trapFocus,
 *     closeOnOutside, closeOnEsc, hoverDelay: [open, close], onOpen(el, api), onClose(api) });
 *   pop.open() / close() / toggle() / update() / destroy() / isOpen() / pop.el
 */
ZH.popover = function (anchor, o) {
  o = Object.assign({ trigger: 'click', placement: 'bottom-start', offset: 6, arrow: false, z: 'popover', role: 'dialog', closeOnOutside: true, closeOnEsc: true, hoverDelay: [80, 120], matchWidth: false, restoreFocus: true }, o || {});
  var el = null, timer = null, offOutside = null, release = null, api = {}, id = o.id || ZH.uid('pop');

  function build() {
    var pop = document.createElement('div');
    pop.className = 'zh-pop zh-pop--' + o.z + (o.className ? ' ' + o.className : '');
    pop.id = id; pop.setAttribute('role', o.role);
    if (o.arrow) { var ar = document.createElement('div'); ar.className = 'zh-pop-arrow'; pop.appendChild(ar); }
    var body = document.createElement('div'); body.className = 'zh-pop-body';
    var c = typeof o.content === 'function' ? o.content(api) : o.content;
    if (typeof c === 'string') body.innerHTML = c; else if (c) body.appendChild(c);
    pop.appendChild(body);
    return pop;
  }
  function update() {
    if (!el) return;
    if (o.matchWidth) el.style.minWidth = anchor.getBoundingClientRect().width + 'px';
    ZH.place(anchor, el, o);
  }
  function onKey(e) { if (e.key === 'Escape' && el && o.closeOnEsc) { e.preventDefault(); e.stopPropagation(); close(true); } }
  function open() {
    clearTimeout(timer);
    if (el) return;
    el = build();
    ZH.mountFor(anchor).appendChild(el);
    ZH.hydrateIcons(el);
    update();
    requestAnimationFrame(function () { if (el) el.classList.add('is-open'); });
    anchor.setAttribute('aria-expanded', 'true'); anchor.setAttribute('aria-controls', id);
    if (o.closeOnOutside && o.trigger !== 'hover') offOutside = ZH.onOutside([el, anchor], function () { close(); });
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', update, true); window.addEventListener('resize', update);
    if (o.trapFocus) release = ZH.trapFocus(el);
    if (o.trigger === 'hover') { el.addEventListener('mouseenter', function () { clearTimeout(timer); }); el.addEventListener('mouseleave', hoverClose); }
    if (o.onOpen) o.onOpen(el, api);
  }
  function close(restore) {
    clearTimeout(timer);
    if (!el) return;
    var e = el; el = null;
    if (offOutside) offOutside(); offOutside = null;
    if (release) release(); release = null;
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update);
    e.classList.remove('is-open'); e.classList.add('is-closing');
    anchor.setAttribute('aria-expanded', 'false');
    setTimeout(function () { e.remove(); }, ZH.reduced() ? 0 : 140);
    if (restore === true && o.restoreFocus) anchor.focus();
    if (o.onClose) o.onClose(api);
  }
  function hoverOpen() { clearTimeout(timer); timer = setTimeout(open, o.hoverDelay[0]); }
  function hoverClose() { clearTimeout(timer); timer = setTimeout(close, o.hoverDelay[1]); }
  var listeners = [];
  function on(t, ev, fn) { t.addEventListener(ev, fn); listeners.push([t, ev, fn]); }
  if (o.trigger === 'click') on(anchor, 'click', function () { api.toggle(); });
  else if (o.trigger === 'hover') { on(anchor, 'mouseenter', hoverOpen); on(anchor, 'mouseleave', hoverClose); on(anchor, 'focus', open); on(anchor, 'blur', hoverClose); }
  else if (o.trigger === 'focus') { on(anchor, 'focusin', open); on(anchor, 'focusout', function () { close(); }); }
  if (!anchor.hasAttribute('aria-haspopup') && o.role !== 'tooltip') anchor.setAttribute('aria-haspopup', o.role === 'dialog' ? 'dialog' : o.role);
  if (o.trigger !== 'hover') anchor.setAttribute('aria-expanded', 'false');
  if (o.role === 'tooltip') anchor.setAttribute('aria-describedby', id);

  api.open = open; api.close = function () { close(true); }; api.update = update; api.anchor = anchor;
  api.toggle = function () { if (el) close(); else open(); };
  api.isOpen = function () { return !!el; };
  api.destroy = function () { close(); listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2]); }); listeners = []; };
  Object.defineProperty(api, 'el', { get: function () { return el; } });
  return api;
};

/** Trap Tab focus inside `el` (modals, drawers). Returns a release function. */
ZH.trapFocus = function (el) {
  var prev = document.activeElement;
  var sel = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  function keys() { return [].slice.call(el.querySelectorAll(sel)).filter(function (n) { return ZH.visible(n) || n === document.activeElement; }); }
  function h(e) {
    if (e.key !== 'Tab') return;
    var f = keys(); if (!f.length) { e.preventDefault(); return; }
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  el.addEventListener('keydown', h);
  var f0 = keys(); if (f0.length && !el.contains(document.activeElement)) f0[0].focus();
  return function () { el.removeEventListener('keydown', h); if (prev && prev.focus) prev.focus(); };
};

/** Arrow-key navigation over a set of items (menus, listboxes, trees, tabs). Enter / Space clicks the item. */
ZH.rovingFocus = function (container, itemSel, o) {
  o = Object.assign({ orientation: 'vertical', loop: true, typeahead: true }, o || {});
  var buf = '', bt;
  function items() { return [].slice.call(container.querySelectorAll(itemSel)).filter(function (n) { return !n.hasAttribute('disabled') && n.getAttribute('aria-disabled') !== 'true' && ZH.visible(n); }); }
  function go(list, i) { if (!list.length) return; i = o.loop ? (i + list.length) % list.length : Math.max(0, Math.min(list.length - 1, i)); list.forEach(function (n) { n.tabIndex = -1; }); list[i].tabIndex = 0; list[i].focus(); if (o.onFocus) o.onFocus(list[i]); }
  function h(e) {
    var list = items(), i = list.indexOf(document.activeElement);
    var next = o.orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight', prev = o.orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    if (e.key === next) { e.preventDefault(); go(list, i + 1); }
    else if (e.key === prev) { e.preventDefault(); go(list, i < 0 ? list.length - 1 : i - 1); }
    else if (e.key === 'Home') { e.preventDefault(); go(list, 0); }
    else if (e.key === 'End') { e.preventDefault(); go(list, list.length - 1); }
    else if ((e.key === 'Enter' || e.key === ' ') && i >= 0 && !(list[i].tagName === 'BUTTON' || list[i].tagName === 'A')) { e.preventDefault(); list[i].click(); }
    else if (o.typeahead && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      buf += e.key.toLowerCase(); clearTimeout(bt); bt = setTimeout(function () { buf = ''; }, 500);
      var hit = list.filter(function (n) { return n.textContent.trim().toLowerCase().indexOf(buf) === 0; })[0];
      if (hit) go(list, list.indexOf(hit));
    }
  }
  container.addEventListener('keydown', h);
  return { focusFirst: function () { go(items(), 0); }, focusLast: function () { var l = items(); go(l, l.length - 1); }, destroy: function () { container.removeEventListener('keydown', h); } };
};

// <dialog>.showModal() puts the dialog in the browser top layer, above everything with any z-index. Elements marked
// data-zh-float (toast and notification hosts) ride along inside the open dialog and go back when it closes.
// Restoring is synchronous on close() (apps often remove the dialog right after), with the close event and a
// removal observer as fallbacks for Esc and for dialogs that are removed while open.
(function () {
  var proto = window.HTMLDialogElement && HTMLDialogElement.prototype;
  if (!proto || proto.__zhFloat) return;
  var open = proto.showModal, shut = proto.close;
  proto.__zhFloat = true;
  function restore(rec) {
    if (rec.done) return;
    rec.done = true; if (rec.mo) rec.mo.disconnect();
    rec.moved.forEach(function (m) { (m[1] && m[1].isConnected ? m[1] : document.body).appendChild(m[0]); });
  }
  proto.showModal = function () {
    var dlg = this, r = open.apply(dlg, arguments);
    var rec = { done: false, moved: [].slice.call(document.querySelectorAll('[data-zh-float]')).map(function (h) { var from = h.parentNode; dlg.appendChild(h); return [h, from]; }) };
    dlg.__zhRec = rec;
    dlg.addEventListener('close', function () { restore(rec); }, { once: true });
    if (window.MutationObserver) { rec.mo = new MutationObserver(function () { if (!dlg.isConnected) restore(rec); }); rec.mo.observe(document.documentElement, { childList: true, subtree: true }); }
    return r;
  };
  proto.close = function () { var r = shut.apply(this, arguments); if (this.__zhRec) restore(this.__zhRec); return r; };
})();

window.ZHDemo = ZH;
