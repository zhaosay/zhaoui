// Text input helpers: clear button, password toggle, search (Enter / Esc). Markup: .zh-inp > .zh-inp-box > input.zh-inp-el (+ buttons).
ZhaoUI.component('input', { selector: '.zh-inp:not(.zh-num)', init: function (box) {
  var el = box.querySelector('.zh-inp-el'); if (!el) return;
  var clr = box.querySelector('.zh-inp-clear'), eye = box.querySelector('.zh-inp-eye');
  function sync() { if (clr) clr.hidden = !el.value || el.disabled || el.readOnly; }
  el.addEventListener('input', sync); sync();
  if (clr) clr.addEventListener('click', function () { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); sync(); el.focus(); });
  if (eye) eye.addEventListener('click', function () {
    var show = el.type === 'password'; el.type = show ? 'text' : 'password';
    eye.setAttribute('aria-pressed', String(show)); eye.setAttribute('aria-label', show ? '隐藏密码' : '显示密码');
    eye.innerHTML = ZH.iconHtml(show ? 'eye-off' : 'eye', 18); el.focus();
  });
  if (box.hasAttribute('data-search')) {
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); box.dispatchEvent(new CustomEvent('zh:search', { bubbles: true, detail: { query: el.value.trim() } })); }
      else if (e.key === 'Escape' && el.value) { e.preventDefault(); e.stopPropagation(); el.value = ''; sync(); box.dispatchEvent(new CustomEvent('zh:search-clear', { bubbles: true })); }
    });
  }
} });
