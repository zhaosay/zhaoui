// Tooltip, popover and popconfirm, all built on ZH.popover (placement with collision flip, outside click, Esc, focus handling).
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

// <span data-zh-tt="text" data-zh-tt-placement="top" data-zh-tt-delay="80">
ZhaoUI.component('tooltip', { selector: '[data-zh-tt]', init: function (a) {
  if (!a.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(a.tagName)) a.tabIndex = 0;
  ZH.popover(a, { content: '<span>' + esc(a.getAttribute('data-zh-tt')) + '</span>', trigger: 'hover', z: 'tooltip', role: 'tooltip', arrow: true, offset: 8,
    placement: a.getAttribute('data-zh-tt-placement') || 'top', hoverDelay: [parseInt(a.getAttribute('data-zh-tt-delay') || '80', 10), 120] });
} });

// <button data-zh-popover="#panelId" data-placement="bottom-start" data-trigger="click|hover|focus">; the target's contents are copied into the popover.
ZhaoUI.component('popover', { selector: '[data-zh-popover]', init: function (a) {
  var src = document.querySelector(a.getAttribute('data-zh-popover')); if (!src) return;
  src.hidden = true;
  var trig = a.getAttribute('data-trigger') || 'click';
  var api = ZH.popover(a, { content: function () { var n = src.cloneNode(true); n.removeAttribute('id'); n.hidden = false; return n; }, trigger: trig, arrow: a.hasAttribute('data-arrow'), className: 'zh-pop-card',
    placement: a.getAttribute('data-placement') || 'bottom-start', role: 'dialog', trapFocus: trig === 'click', restoreFocus: true,
    onOpen: function (el) { a.dispatchEvent(new CustomEvent('zh:popover-open', { bubbles: true, detail: { popover: el } })); },
    onClose: function () { a.dispatchEvent(new CustomEvent('zh:popover-close', { bubbles: true })); } });
  a._zhPopover = api;
} });

// Imperative: ZhaoUI.popconfirm(anchor, { title, desc, okText, cancelText, kind: 'warning'|'info', danger, placement, onConfirm() }); onConfirm may return a promise, the button shows a spinner until it settles.
function popconfirm(anchor, o) {
  o = Object.assign({ title: '', desc: '', okText: '确定', cancelText: '取消', kind: 'warning', danger: false, placement: 'top' }, o);
  var loading = false, tid = ZH.uid('zhpc'), guardOff = null;
  function guard(e) { if (!loading) return; if (e.type === 'keydown') { if (e.key === 'Escape') e.stopPropagation(); return; } var pop = document.getElementById(anchor.getAttribute('aria-controls')); if (!pop || !pop.contains(e.target)) e.stopPropagation(); }
  var api = ZH.popover(anchor, { placement: o.placement, arrow: true, offset: 10, role: 'dialog', className: 'zh-pc', trapFocus: true, restoreFocus: true,
    content: function (a) {
      var d = document.createElement('div');
      d.innerHTML = '<div class="zh-pc-body"><span class="zh-pc-ico ' + (o.danger ? 'danger' : o.kind) + '">' + ZH.iconHtml(o.kind === 'info' ? 'circle-alert' : 'triangle-alert', 20) + '</span><div><p class="zh-pc-title" id="' + tid + '">' + esc(o.title) + '</p>' + (o.desc ? '<p class="zh-pc-desc">' + esc(o.desc) + '</p>' : '') + '</div></div>' +
        '<div class="zh-pc-foot"><button class="zh-btn sm" data-a="cancel">' + esc(o.cancelText) + '</button><button class="zh-btn sm primary' + (o.danger ? ' zh-pc-danger' : '') + '" data-a="ok">' + esc(o.okText) + '</button></div>';
      d.addEventListener('keydown', function (e) { if (e.key !== 'Tab') return; e.preventDefault(); e.stopPropagation(); var bs = [].slice.call(d.querySelectorAll('button:not([disabled])')); if (!bs.length) return; var i = bs.indexOf(document.activeElement); bs[(i + (e.shiftKey ? -1 : 1) + bs.length) % bs.length].focus(); });
      d.addEventListener('click', function (e) {
        var b = e.target.closest('[data-a]'); if (!b || loading) return;
        if (b.getAttribute('data-a') === 'cancel') { a.close(); anchor.dispatchEvent(new CustomEvent('zh:popconfirm', { bubbles: true, detail: { action: 'cancel' } })); return; }
        var r = o.onConfirm ? o.onConfirm() : null, done = function () { a.close(); anchor.dispatchEvent(new CustomEvent('zh:popconfirm', { bubbles: true, detail: { action: 'ok' } })); };
        if (r && r.then) {
          loading = true; b.setAttribute('aria-busy', 'true'); b.innerHTML = '<span class="spin" aria-hidden="true"></span>' + esc(o.okText); var cancel = d.querySelector('[data-a="cancel"]'); cancel.disabled = true;
          r.then(function () { loading = false; done(); }, function () { loading = false; b.removeAttribute('aria-busy'); b.textContent = o.okText; cancel.disabled = false; });
        } else done();
      });
      return d;
    },
    onOpen: function (node) { node.setAttribute('aria-labelledby', tid); ['keydown', 'mousedown', 'touchstart'].forEach(function (t) { window.addEventListener(t, guard, true); }); guardOff = function () { ['keydown', 'mousedown', 'touchstart'].forEach(function (t) { window.removeEventListener(t, guard, true); }); }; },
    onClose: function () { if (guardOff) guardOff(); guardOff = null; } });
  return api;
}
ZhaoUI.popconfirm = popconfirm;
// Declarative: <button data-zh-popconfirm="删除这个文件？" data-desc="…" data-ok="删除" data-cancel="取消" data-danger data-placement="top">; listen for zh:popconfirm (detail.action 'ok' | 'cancel').
ZhaoUI.component('popconfirm', { selector: '[data-zh-popconfirm]', init: function (a) {
  popconfirm(a, { title: a.getAttribute('data-zh-popconfirm'), desc: a.getAttribute('data-desc') || '', okText: a.getAttribute('data-ok') || '确定', cancelText: a.getAttribute('data-cancel') || '取消',
    kind: a.getAttribute('data-kind') || 'warning', danger: a.hasAttribute('data-danger'), placement: a.getAttribute('data-placement') || 'top' });
} });
