// Auto-growing textarea with a character counter. <div class="zh-ta" data-max-rows="6" data-soft-max="30"><textarea class="zh-textarea" maxlength="80">…</textarea><span class="zh-ta-count"></span></div>
// maxlength is a hard limit; data-soft-max lets the user type past it but turns the counter red and sets aria-invalid.
ZhaoUI.component('textarea', { selector: '.zh-ta', init: function (box) {
  var ta = box.querySelector('textarea'), cnt = box.querySelector('.zh-ta-count'); if (!ta || !cnt) return;
  var soft = box.dataset.softMax ? +box.dataset.softMax : null, hard = ta.maxLength > 0 ? ta.maxLength : null, rows = +box.dataset.maxRows || 6;
  var holder = box.parentNode, msg = holder.querySelector('[data-ta-msg]'), sr = holder.querySelector('.zh-inp-sr'), was = false;
  function grow() {
    var cs = getComputedStyle(ta), lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5;
    var pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom), bd = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
    ta.style.height = 'auto';
    var need = ta.scrollHeight + bd, cap = lh * rows + pad + bd;
    ta.style.height = Math.ceil(Math.min(need, cap)) + 'px'; ta.style.overflowY = need > cap ? 'auto' : 'hidden';
  }
  function update() {
    var len = ta.value.length, lim = hard || soft;
    cnt.textContent = lim ? len + ' / ' + lim : String(len);
    var over = soft != null && len > soft;
    box.classList.toggle('is-over', over); ta.setAttribute('aria-invalid', String(over));
    if (msg) { msg.hidden = !over; var s = msg.querySelector('span'); if (over && s) s.textContent = '超出 ' + (len - soft) + ' 字，请删减后再提交'; }
    if (sr && over !== was) { sr.textContent = over ? '已超出字数上限' : '字数已恢复正常'; was = over; }
    grow();
  }
  ta.addEventListener('input', update); update();
} });
