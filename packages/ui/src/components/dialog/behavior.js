// Modal (native <dialog>) and drawer. Triggers are delegated, so they also work for content added later.
// Safari does not focus a button on mouse click, so "the element focused before opening" is <body> there. We remember the trigger ourselves.
function restoreFocus(opener, closing) {
  var a = document.activeElement;
  // WebKit still reports the focused button inside a just-closed dialog during the close event, so "inside the closing container" counts too.
  var lost = !a || a === document.body || (closing && closing.contains(a));
  if (opener && opener.isConnected && lost && opener.focus) opener.focus();
}
function resolve(t) { return typeof t === 'string' ? document.querySelector(t) : t; }
function openDrawer(el, opener) {
  if (el.classList.contains('open')) return;
  el.__zhOpener = opener || null;
  el.classList.add('open'); el.setAttribute('aria-hidden', 'false'); el.removeAttribute('inert');
  el.__zhRelease = ZH.trapFocus(el);                       // remembers the opener and restores focus on release
  el.__zhKey = function (e) { if (e.key === 'Escape') closeDrawer(el); };
  document.addEventListener('keydown', el.__zhKey);
  el.dispatchEvent(new CustomEvent('zh:open', { bubbles: true }));
}
function closeDrawer(el) {
  if (!el.classList.contains('open')) return;
  el.classList.remove('open'); el.setAttribute('aria-hidden', 'true'); el.setAttribute('inert', '');
  document.removeEventListener('keydown', el.__zhKey);
  if (el.__zhRelease) { el.__zhRelease(); el.__zhRelease = null; }
  restoreFocus(el.__zhOpener, el);
  el.dispatchEvent(new CustomEvent('zh:close', { bubbles: true }));
}
/** Open a dialog or drawer. `opener` (optional) is the element to return focus to when it closes. */
ZhaoUI.open = function (target, opener) {
  var el = resolve(target); if (!el) return;
  if (el.tagName === 'DIALOG') {
    if (el.open) return;
    el.showModal();
    if (opener) el.addEventListener('close', function back() { el.removeEventListener('close', back); restoreFocus(opener, el); });
  } else if (el.classList.contains('zh-drawer')) openDrawer(el, opener);
};
ZhaoUI.close = function (target) {
  var el = resolve(target); if (!el) return;
  if (el.tagName === 'DIALOG') { if (el.open) el.close(); } else if (el.classList.contains('zh-drawer')) closeDrawer(el);
};
document.addEventListener('click', function (e) {
  var opener = e.target.closest && e.target.closest('[data-zh-open]');
  if (opener) { e.preventDefault(); ZhaoUI.open(opener.getAttribute('data-zh-open'), opener); return; }
  var closer = e.target.closest && e.target.closest('[data-zh-close]');
  if (closer) {
    var v = closer.getAttribute('data-zh-close');
    ZhaoUI.close(v ? v : closer.closest('dialog[open], .zh-drawer.open'));
    return;
  }
  // a click on the <dialog> element itself (not its children) is a backdrop click
  if (e.target.tagName === 'DIALOG' && e.target.hasAttribute('data-zh-backdrop-close') && e.target.open) e.target.close();
});
ZhaoUI.component('drawer', { selector: '.zh-drawer', init: function (el) {
  if (!el.classList.contains('open')) { el.setAttribute('aria-hidden', 'true'); el.setAttribute('inert', ''); }
} });

/** Confirm-style dialog. Resolves true (ok) or false (cancel / Esc / backdrop). Text is escaped; pass a Node as content for markup. */
ZhaoUI.dialog = function (o) {
  o = Object.assign({ title: '', content: '', ok: '确定', cancel: '取消', danger: false, backdropClose: false }, o || {});
  return new Promise(function (resolveDialog) {
    var d = document.createElement('dialog'), tid = ZH.uid('zh-dlg'), result = false;
    d.className = 'zh-modal'; d.setAttribute('aria-labelledby', tid);
    var h = document.createElement('header'); h.id = tid; h.textContent = o.title;
    var b = document.createElement('div'); b.className = 'body';
    if (o.content instanceof Node) b.appendChild(o.content); else b.textContent = o.content;
    var f = document.createElement('footer');
    function btn(label, cls, val) { var x = document.createElement('button'); x.type = 'button'; x.className = 'zh-btn' + (cls ? ' ' + cls : ''); x.textContent = label; x.onclick = function () { result = val; d.close(); }; f.appendChild(x); return x; }
    if (o.cancel !== false) btn(o.cancel, '', false);
    var ok = btn(o.ok, o.danger ? 'danger' : 'primary', true);
    d.appendChild(h); d.appendChild(b); d.appendChild(f);
    if (o.backdropClose) d.setAttribute('data-zh-backdrop-close', '');
    d.addEventListener('close', function () { d.remove(); resolveDialog(result); });
    document.body.appendChild(d); d.showModal(); ok.focus();
  });
};
