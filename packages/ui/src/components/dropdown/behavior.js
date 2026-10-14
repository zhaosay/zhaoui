// Dropdown menu: <button data-zh-dropdown="#menuId"> and a hidden <ul class="zh-menu" id="menuId" hidden>.
// Emits `zh:select` on the trigger with detail { value, item }. Placement: data-zh-placement="bottom-start" (default).
ZhaoUI.component('dropdown', { selector: '[data-zh-dropdown]', init: function (btn) {
  var src = document.querySelector(btn.getAttribute('data-zh-dropdown'));
  if (!src) return;
  src.hidden = true;
  var pop = ZH.popover(btn, {
    trigger: 'click', placement: btn.getAttribute('data-zh-placement') || 'bottom-start', z: 'dropdown', role: 'menu', matchWidth: true, className: 'zh-dropdown-pop',
    content: function () { var c = src.cloneNode(true); c.hidden = false; c.removeAttribute('id'); return c; },
    onOpen: function (el, api) {
      [].forEach.call(el.querySelectorAll('a, button'), function (i) { i.setAttribute('role', 'menuitem'); i.tabIndex = -1; });
      var rf = ZH.rovingFocus(el, '[role="menuitem"]'); rf.focusFirst();
      el.addEventListener('click', function (e) {
        var it = e.target.closest('[role="menuitem"]'); if (!it || it.getAttribute('aria-disabled') === 'true' || it.disabled) return;
        if (it.getAttribute('href') === '#') e.preventDefault();
        btn.dispatchEvent(new CustomEvent('zh:select', { bubbles: true, detail: { value: it.getAttribute('data-value') || it.textContent.trim(), item: it } }));
        api.close();
      });
    }
  });
  btn.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); pop.open(); } });
} });
