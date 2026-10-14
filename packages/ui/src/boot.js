// Boot: wire everything present now, then keep watching for components added later.
function boot() {
  ZhaoUI.init(document); ZhaoUI._ready = true;
  if (window.MutationObserver) {
    var pending = false;
    new MutationObserver(function () { if (pending) return; pending = true; requestAnimationFrame(function () { pending = false; ZhaoUI.init(document); }); })
      .observe(document.body, { childList: true, subtree: true });
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
