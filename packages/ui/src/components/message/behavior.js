// ZhaoUI.message(text, { type: 'success' | 'info' | 'warning' | 'error', duration: 2400 }). Returns a function that dismisses it.
var MSG_ICON = { success: 'circle-check', info: 'info', warning: 'triangle-alert', error: 'circle-x' };
function toastHost() {
  var h = document.getElementById('zhToastHost');
  if (!h) { h = document.createElement('div'); h.id = 'zhToastHost'; h.className = 'zh-toast-host'; h.setAttribute('aria-live', 'polite'); h.setAttribute('data-zh-float', ''); document.body.appendChild(h); }
  // A modal <dialog> sits in the browser top layer, above everything on the page. A host created while one is open must live inside it.
  var dlg = document.querySelector('dialog[open]');
  if (dlg && !dlg.contains(h)) {
    dlg.appendChild(h);
    dlg.addEventListener('close', function back() { dlg.removeEventListener('close', back); if (h.parentNode === dlg) document.body.appendChild(h); });
  }
  return h;
}
ZhaoUI.message = function (text, o) {
  o = Object.assign({ type: 'success', duration: 2400 }, o || {});
  var m = document.createElement('div'); m.className = 'zh-message' + (o.type === 'success' ? '' : ' zh-message--' + o.type);
  m.setAttribute('role', o.type === 'error' ? 'alert' : 'status');
  m.innerHTML = ZH.iconHtml(MSG_ICON[o.type] || MSG_ICON.info);
  m.appendChild(document.createTextNode(text));
  toastHost().appendChild(m);
  function dismiss() { if (m.parentNode) m.remove(); }
  if (o.duration > 0) setTimeout(dismiss, o.duration);
  return dismiss;
};
