// Inline edit: click (or F2) turns the text into an input; Enter / blur saves, Esc cancels, empty text is rejected.
// Fires zh:edit-save { value, previous } and zh:edit-cancel. data-label names the field for screen readers (default 名称).
ZhaoUI.component('inline-edit', { selector: '.zh-edit', init: function (host) {
  var view = host.querySelector('.zh-edit-view'), text = host.querySelector('.zh-edit-text'); if (!view || !text) return;
  var val = text.textContent, editing = false, label = host.dataset.label || '名称';
  function start() {
    if (editing) return; editing = true;
    var wrap = document.createElement('div'); wrap.className = 'zh-inp';
    wrap.innerHTML = '<span class="zh-inp-box"><input class="zh-inp-el" aria-label="' + ZH.esc(label) + '" value="' + ZH.esc(val) + '"></span>';
    var inp = wrap.querySelector('input'); host.replaceChild(wrap, view); inp.focus(); inp.select();
    function finish(save, viaBlur) {
      if (!editing) return; var v = inp.value.trim();
      if (save && !v) {
        if (!viaBlur) { wrap.classList.add('is-error'); inp.setAttribute('aria-invalid', 'true'); inp.focus(); return; }   // Enter on empty: stay and flag it
        save = false;                                                                                                       // blur on empty: revert
      }
      var changed = save && v !== val, prev = val;
      if (changed) { val = v; text.textContent = v; view.setAttribute('aria-label', '编辑' + label + '：' + v); }
      editing = false; host.replaceChild(view, wrap); if (!viaBlur) view.focus();
      if (changed) host.dispatchEvent(new CustomEvent('zh:edit-save', { bubbles: true, detail: { value: v, previous: prev } }));
      else if (!save) host.dispatchEvent(new CustomEvent('zh:edit-cancel', { bubbles: true }));
    }
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); finish(true); } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(false); }
    });
    inp.addEventListener('blur', function () { finish(true, true); });
  }
  view.addEventListener('click', start);
  view.addEventListener('keydown', function (e) { if (e.key === 'F2') { e.preventDefault(); start(); } });
} });
