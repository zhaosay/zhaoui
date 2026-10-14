var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
var sec = document.getElementById('input'); if (!sec) return;

/* 清除 / 密码开关 / 搜索 */
$$('.zh-inp', sec).forEach(function (box) {
  var el = $('.zh-inp-el', box); if (!el || box.classList.contains('zh-num')) return;
  var clr = $('.zh-inp-clear', box), eye = $('.zh-inp-eye', box);
  function sync() { if (clr) clr.hidden = !el.value || el.disabled || el.readOnly; }
  el.addEventListener('input', sync); sync();
  if (clr) clr.addEventListener('click', function () { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); sync(); el.focus(); });
  if (eye) eye.addEventListener('click', function () {
    var show = el.type === 'password'; el.type = show ? 'text' : 'password';
    eye.setAttribute('aria-pressed', String(show)); eye.setAttribute('aria-label', show ? '隐藏密码' : '显示密码');
    eye.innerHTML = ZH.iconHtml(show ? 'eye-off' : 'eye', 18); el.focus();
  });
  if (box.hasAttribute('data-search')) {
    var out = document.querySelector(box.getAttribute('data-out'));
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault(); var q = el.value.trim();
        if (out) out.textContent = q ? '已搜索：“' + q + '”' : '请输入关键词';
        box.dispatchEvent(new CustomEvent('zh-search', { bubbles: true, detail: { query: q } }));
      } else if (e.key === 'Escape' && el.value) {
        e.preventDefault(); e.stopPropagation(); el.value = ''; sync(); if (out) out.textContent = '尚未搜索';
      }
    });
  }
});

/* 数字步进 */
$$('.zh-num', sec).forEach(function (box) {
  var el = $('.zh-inp-el', box), o = box.dataset, btns = $$('.zh-num-btn', box);
  var min = o.min != null ? +o.min : -Infinity, max = o.max != null ? +o.max : Infinity, step = +(o.step || 1);
  var prec = o.precision != null ? +o.precision : (String(step).split('.')[1] || '').length;
  var parse = function (s) { var v = parseFloat(String(s).replace(/,/g, '')); return isNaN(v) ? null : v; };
  var last = parse(el.value);
  var fix = function (v) { return +Math.max(min, Math.min(max, v)).toFixed(prec); };
  function paint() {
    var v = parse(el.value);
    el.setAttribute('aria-valuenow', v == null ? '' : v);
    if (isFinite(min)) el.setAttribute('aria-valuemin', min); if (isFinite(max)) el.setAttribute('aria-valuemax', max);
    btns.forEach(function (b) { var dir = +b.dataset.dir; b.disabled = v != null && ((dir > 0 && v >= max) || (dir < 0 && v <= min)); });
  }
  function commit(v) { v = fix(v); last = v; el.value = v.toFixed(prec); paint(); box.dispatchEvent(new CustomEvent('zh-number', { bubbles: true, detail: { value: v } })); }
  function bump(dir, mult) { var v = parse(el.value); if (v == null) v = last != null ? last : (isFinite(min) ? min : 0); commit(v + dir * step * (mult || 1)); }
  function normalize() { var v = parse(el.value); if (v == null) el.value = last != null ? last.toFixed(prec) : ''; else commit(v); paint(); }
  el.addEventListener('keydown', function (e) {
    var m = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowUp') { e.preventDefault(); bump(1, m); } else if (e.key === 'ArrowDown') { e.preventDefault(); bump(-1, m); }
    else if (e.key === 'PageUp') { e.preventDefault(); bump(1, 10); } else if (e.key === 'PageDown') { e.preventDefault(); bump(-1, 10); }
    else if (e.key === 'Enter') normalize();
  });
  el.addEventListener('blur', normalize); el.addEventListener('input', paint);
  var t1, t2;
  function stop() { clearTimeout(t1); clearInterval(t2); document.removeEventListener('pointerup', stop); document.removeEventListener('pointercancel', stop); }
  btns.forEach(function (b) {
    b.addEventListener('pointerdown', function (e) {
      if (b.disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault(); var dir = +b.dataset.dir, n = 0; bump(dir);
      t1 = setTimeout(function () { t2 = setInterval(function () { n++; bump(dir, n > 12 ? 5 : 1); }, 70); }, 400);
      document.addEventListener('pointerup', stop); document.addEventListener('pointercancel', stop);
    });
  });
  paint();
});

/* 验证码 */
$$('.zh-otp', sec).forEach(function (box) {
  var n = +box.dataset.length || 6, out = document.querySelector(box.dataset.out), idle = out ? out.textContent : '', html = '';
  for (var i = 0; i < n; i++) html += '<input class="zh-otp-cell" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" aria-label="第 ' + (i + 1) + ' 位，共 ' + n + ' 位" autocomplete="' + (i ? 'off' : 'one-time-code') + '">';
  box.setAttribute('role', 'group'); box.innerHTML = html;
  var cells = $$('.zh-otp-cell', box);
  var say = function (t, cls) { if (out) { out.textContent = t; out.classList.toggle('err', cls === 'err'); } };
  function check() {
    box.classList.remove('is-error', 'is-ok');
    cells.forEach(function (c) { c.classList.toggle('is-filled', !!c.value); });
    var v = cells.map(function (c) { return c.value; }).join('');
    if (v.length === n) {
      say('验证码已填写，正在校验…');
      box.dispatchEvent(new CustomEvent('zh-otp-complete', { bubbles: true, detail: { value: v } }));
      setTimeout(function () {
        if (cells.map(function (c) { return c.value; }).join('') !== v) return;
        if (v === '123456') { box.classList.add('is-ok'); say('验证通过'); } else { fail(); }
      }, 700);
    } else say(idle);
  }
  function fail() { box.classList.remove('is-error'); void box.offsetWidth; box.classList.add('is-error'); say('验证码不正确，请重新输入', 'err'); }
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
      var t = ((e.clipboardData || window.clipboardData).getData('text') || '').replace(/\D/g, '');
      if (!t) return; e.preventDefault();
      for (var k = 0; k < t.length && i + k < n; k++) cells[i + k].value = t[k];
      cells[Math.min(i + t.length, n - 1)].focus(); check();
    });
  });
  var errBtn = document.getElementById('otp-err'), clrBtn = document.getElementById('otp-clear');
  if (errBtn) errBtn.addEventListener('click', fail);
  if (clrBtn) clrBtn.addEventListener('click', function () { cells.forEach(function (c) { c.value = ''; }); check(); cells[0].focus(); });
});

/* 多行文本 */
$$('.zh-ta', sec).forEach(function (box) {
  var ta = $('textarea', box), cnt = $('.zh-ta-count', box), soft = box.dataset.softMax ? +box.dataset.softMax : null, hard = ta.maxLength > 0 ? ta.maxLength : null;
  var rows = +box.dataset.maxRows || 6, holder = box.parentNode, msg = $('[data-ta-msg]', holder), sr = $('.zh-inp-sr', holder), was = false;
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
    if (msg) { msg.hidden = !over; if (over) $('span', msg).textContent = '超出 ' + (len - soft) + ' 字，请删减后再提交'; }
    if (sr && over !== was) { sr.textContent = over ? '已超出字数上限' : '字数已恢复正常'; was = over; }
    grow();
  }
  ta.addEventListener('input', update); update();
});

/* 字段校验 */
$$('[data-validate="email"]', sec).forEach(function (f) {
  var el = $('.zh-inp-el', f), inp = $('.zh-inp', f), msg = $('.zh-inp-msg', f), st = $('.zh-inp-status', f), touched = false;
  function check(v) { if (!v) return '请输入邮箱'; return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : '邮箱格式不正确，例如 name@example.com'; }
  function show(err, ok) {
    inp.classList.toggle('is-error', !!err); inp.classList.toggle('is-success', ok); el.setAttribute('aria-invalid', String(!!err));
    msg.hidden = !err; msg.className = 'zh-inp-msg is-error'; msg.innerHTML = err ? ZH.iconHtml('circle-alert', 16) + '<span>' + ZH.esc(err) + '</span>' : '';
    st.innerHTML = ok ? ZH.iconHtml('circle-check', 18) : '';
  }
  el.addEventListener('blur', function () { touched = true; var e = check(el.value.trim()); show(e, !e); });
  el.addEventListener('input', function () { if (!touched) return; var e = check(el.value.trim()); show(e, !e); });
});

/* 行内编辑 */
$$('.zh-edit', sec).forEach(function (host) {
  var view = $('.zh-edit-view', host), text = $('.zh-edit-text', host), out = document.getElementById('ed-o'), val = text.textContent, editing = false;
  var say = function (t) { if (out) out.textContent = t || ' '; };
  function start() {
    if (editing) return; editing = true;
    var wrap = document.createElement('div'); wrap.className = 'zh-inp';
    wrap.innerHTML = '<span class="zh-inp-box"><input class="zh-inp-el" aria-label="名称" value="' + ZH.esc(val) + '"></span>';
    var inp = $('input', wrap); host.replaceChild(wrap, view); inp.focus(); inp.select();
    function finish(save, viaBlur) {
      if (!editing) return; var v = inp.value.trim();
      if (save && !v) {
        if (!viaBlur) { wrap.classList.add('is-error'); inp.setAttribute('aria-invalid', 'true'); say(host.dataset.emptyMsg || '不能为空'); inp.focus(); return; }
        save = false; say('名称不能为空，已还原');
      }
      if (save && v !== val) { val = v; text.textContent = v; view.setAttribute('aria-label', '编辑名称：' + v); say('已保存为“' + v + '”'); }
      else if (!save && !viaBlur) say('已取消');
      editing = false; host.replaceChild(view, wrap); if (!viaBlur) view.focus();
    }
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); finish(true); } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(false); }
    });
    inp.addEventListener('blur', function () { finish(true, true); });
  }
  view.addEventListener('click', start);
  view.addEventListener('keydown', function (e) { if (e.key === 'F2') { e.preventDefault(); start(); } });
});

ZH.hydrateIcons(sec);
