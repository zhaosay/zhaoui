// Number stepper. Config on the .zh-num element: data-min, data-max, data-step, data-precision. Keys: ↑↓ step, Shift ×10, PageUp/PageDown ×10, Enter normalises.
ZhaoUI.component('number', { selector: '.zh-num', init: function (box) {
  var el = box.querySelector('.zh-inp-el'); if (!el) return;
  var o = box.dataset, btns = [].slice.call(box.querySelectorAll('.zh-num-btn'));
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
  function commit(v) { v = fix(v); last = v; el.value = v.toFixed(prec); paint(); box.dispatchEvent(new CustomEvent('zh:number', { bubbles: true, detail: { value: v } })); }
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
      t1 = setTimeout(function () { t2 = setInterval(function () { n++; bump(dir, n > 12 ? 5 : 1); }, 70); }, 400);   // hold to repeat, accelerating
      document.addEventListener('pointerup', stop); document.addEventListener('pointercancel', stop);
    });
  });
  paint();
} });
