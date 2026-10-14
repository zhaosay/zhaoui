// One-time-code input. <div class="zh-otp" data-length="6" aria-labelledby="labelId"></div> — the cells are generated.
// Fires zh:otp-complete when every cell is filled. Verification is yours: call ZhaoUI.otp.ok(el) / error(el) with the result.
ZhaoUI.component('otp', { selector: '.zh-otp', init: function (box) {
  var n = +box.dataset.length || 6, html = '';
  for (var i = 0; i < n; i++) html += '<input class="zh-otp-cell" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" aria-label="第 ' + (i + 1) + ' 位，共 ' + n + ' 位" autocomplete="' + (i ? 'off' : 'one-time-code') + '">';
  box.setAttribute('role', 'group'); box.innerHTML = html;
  var cells = [].slice.call(box.querySelectorAll('.zh-otp-cell'));
  var value = function () { return cells.map(function (c) { return c.value; }).join(''); };
  function check() {
    box.classList.remove('is-error', 'is-ok');
    cells.forEach(function (c) { c.classList.toggle('is-filled', !!c.value); });
    var v = value();
    if (v.length === n) box.dispatchEvent(new CustomEvent('zh:otp-complete', { bubbles: true, detail: { value: v } }));
  }
  box.__zhOtp = { cells: cells, value: value, check: check };
  cells.forEach(function (c, i) {
    c.addEventListener('input', function () { c.value = c.value.replace(/\D/g, '').slice(-1); if (c.value && i < n - 1) cells[i + 1].focus(); check(); });
    c.addEventListener('focus', function () { c.select(); });
    c.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !c.value && i > 0) { e.preventDefault(); cells[i - 1].value = ''; cells[i - 1].focus(); check(); }
      else if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); cells[i - 1].focus(); }
      else if (e.key === 'ArrowRight' && i < n - 1) { e.preventDefault(); cells[i + 1].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); cells[0].focus(); } else if (e.key === 'End') { e.preventDefault(); cells[n - 1].focus(); }
    });
    c.addEventListener('paste', function (e) {
      var cd = e.clipboardData || window.clipboardData; if (!cd) return;
      var t = (cd.getData('text') || '').replace(/\D/g, '');
      if (!t) return; e.preventDefault();
      for (var k = 0; k < t.length && i + k < n; k++) cells[i + k].value = t[k];
      cells[Math.min(i + t.length, n - 1)].focus(); check();
    });
  });
} });
function otpOf(el) { el = ZhaoUI.ensure(el); return el && el.__zhOtp ? { el: el, api: el.__zhOtp } : null; }
ZhaoUI.otp = {
  value: function (el) { var o = otpOf(el); return o ? o.api.value() : ''; },
  error: function (el) { var o = otpOf(el); if (!o) return; o.el.classList.remove('is-ok', 'is-error'); void o.el.offsetWidth; o.el.classList.add('is-error'); },
  ok: function (el) { var o = otpOf(el); if (!o) return; o.el.classList.remove('is-error'); o.el.classList.add('is-ok'); },
  clear: function (el) { var o = otpOf(el); if (!o) return; o.api.cells.forEach(function (c) { c.value = ''; }); o.api.check(); o.api.cells[0].focus(); }
};
