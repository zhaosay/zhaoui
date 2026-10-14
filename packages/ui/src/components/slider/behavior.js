// Slider (single or range). Config via data-*: value ("40" or "20,80" for a range), min, max, step, label, fmt ("{v}%"), marks ("0:低,50:中,100:高"),
// vertical, disabled, gap, colors, status, out (selector of an <output>), link (selector(s) of number inputs kept in sync).
// Fires zh:slider { type: 'input' | 'change', values }. Read or set through el.zhSlider.get() / .set([values]).
var nf = function (v, dec) { return Number(v).toLocaleString('zh-CN', { maximumFractionDigits: dec == null ? 2 : dec }); };
var pair = function (s) { return String(s).split(',').map(function (x) { var i = x.indexOf(':'); return { k: parseFloat(x.slice(0, i)), t: x.slice(i + 1) }; }); };

function initSlider(root) {
  var d = root.dataset;
  var min = d.min != null ? +d.min : 0, max = d.max != null ? +d.max : 100, step = d.step ? +d.step : 1;
  var vals = String(d.value != null ? d.value : min).split(',').map(Number);
  var range = vals.length === 2;
  var vertical = d.vertical != null, gap = d.gap ? +d.gap : 0, disabled = d.disabled != null;
  var dec = (String(step).split('.')[1] || '').length;
  var fmt = d.fmt || '{v}';
  var marks = d.marks ? pair(d.marks) : [], colors = d.colors ? pair(d.colors) : null, status = d.status ? pair(d.status) : null;
  var label = d.label || '滑块';
  var rtl = !vertical && getComputedStyle(root).direction === 'rtl';
  var out = d.out ? document.querySelector(d.out) : null;
  var links = d.link ? d.link.split(',').map(function (s) { return document.querySelector(s.trim()); }) : [];

  root.classList.toggle('is-vertical', vertical);
  root.classList.toggle('is-disabled', disabled);
  root.classList.toggle('has-marks', marks.length > 0);
  root.style.setProperty('--zh-dir', rtl ? -1 : 1);

  var html = '<div class="zh-slider-rail"><div class="zh-slider-fill"></div></div>';
  if (marks.length) html += '<div class="zh-slider-marks">' + marks.map(function (m, i) { return '<div class="zh-slider-mark" data-i="' + i + '"><span class="zh-slider-dot"></span><span class="zh-slider-mlabel">' + ZH.esc(m.t) + '</span></div>'; }).join('') + '</div>';
  vals.forEach(function (_, i) {
    var name = range ? label + (i ? ' 最大值' : ' 最小值') : label;
    html += '<div class="zh-slider-thumb" role="slider" tabindex="' + (disabled ? -1 : 0) + '" data-i="' + i + '" aria-label="' + ZH.esc(name) + '"' + (vertical ? ' aria-orientation="vertical"' : '') + (disabled ? ' aria-disabled="true"' : '') + '><span class="zh-slider-tip"></span></div>';
  });
  root.innerHTML = html;
  var rail = root.querySelector('.zh-slider-rail'), fill = root.querySelector('.zh-slider-fill');
  var thumbs = [].slice.call(root.querySelectorAll('.zh-slider-thumb'));
  var markEls = [].slice.call(root.querySelectorAll('.zh-slider-mark'));

  var pct = function (v) { return (v - min) / (max - min) * 100; };
  var fm = function (v) { return fmt.replace('{v}', nf(v, dec)); };
  var statusOf = function (v) { if (!status) return ''; var s = ''; status.forEach(function (x) { if (v >= x.k) s = x.t; }); return s; };
  var lead = function () { return vals[range ? 1 : 0]; };

  function render() {
    var p = vals.map(pct), lo = range ? p[0] : 0, hi = range ? p[1] : p[0];
    if (vertical) { fill.style.bottom = lo + '%'; fill.style.height = (hi - lo) + '%'; }
    else { fill.style.insetInlineStart = lo + '%'; fill.style.width = (hi - lo) + '%'; }
    thumbs.forEach(function (t, i) {
      if (vertical) t.style.bottom = p[i] + '%'; else t.style.insetInlineStart = p[i] + '%';
      var st = statusOf(vals[i]);
      t.setAttribute('aria-valuemin', range && i === 1 ? vals[0] + gap : min);
      t.setAttribute('aria-valuemax', range && i === 0 ? vals[1] - gap : max);
      t.setAttribute('aria-valuenow', vals[i]);
      t.setAttribute('aria-valuetext', fm(vals[i]) + (st ? '，' + st : ''));
      t.firstChild.textContent = fm(vals[i]);
    });
    markEls.forEach(function (m, i) {
      var v = marks[i].k, mp = pct(v);
      if (vertical) m.style.bottom = mp + '%'; else m.style.insetInlineStart = mp + '%';
      m.classList.toggle('is-in', v >= (range ? vals[0] : min) && v <= lead());
      m.classList.toggle('is-cur', vals.indexOf(v) >= 0);
      m.classList.toggle('is-first', v === min); m.classList.toggle('is-last', v === max);
    });
    if (colors) {
      var c = colors[0].t; colors.forEach(function (x) { if (lead() >= x.k) c = x.t; });
      root.style.setProperty('--zh-slider-c', c === 'primary' ? 'var(--zh-color-primary)' : 'var(--zh-' + c + ')');
      root.style.setProperty('--zh-slider-halo', c === 'primary' ? 'var(--zh-primary-a14)' : 'var(--zh-' + c + '-bg)');
    }
    if (out) { var s = statusOf(lead()); out.textContent = (range ? fm(vals[0]) + ' – ' + fm(vals[1]) : fm(vals[0])) + (s ? ' · ' + s : ''); }
    links.forEach(function (inp, i) { if (inp && document.activeElement !== inp) inp.value = vals[i]; });
  }
  function fire(type) { root.dispatchEvent(new CustomEvent('zh:slider', { bubbles: true, detail: { type: type, values: vals.slice() } })); }
  function snap(v) { v = Math.round((v - min) / step) * step + min; return Math.max(min, Math.min(max, +v.toFixed(dec))); }
  function setVal(i, v, emit) {
    v = snap(v);
    if (range) { v = i === 0 ? Math.min(v, vals[1] - gap) : Math.max(v, vals[0] + gap); v = Math.max(min, Math.min(max, v)); }
    if (v === vals[i]) return false;
    vals[i] = v; render(); if (emit) fire('input'); return true;
  }
  function fromEvent(e) {
    var r = rail.getBoundingClientRect();
    var ratio = vertical ? (r.bottom - e.clientY) / r.height : (e.clientX - r.left) / r.width;
    if (rtl) ratio = 1 - ratio;
    return min + Math.max(0, Math.min(1, ratio)) * (max - min);
  }

  var active = null;
  root.addEventListener('pointerdown', function (e) {
    if (disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
    var t = e.target.closest('.zh-slider-thumb'), m = e.target.closest('.zh-slider-mark'), i;
    var v = m ? marks[+m.dataset.i].k : fromEvent(e);
    if (t) i = +t.dataset.i;
    else {
      i = 0;
      if (range) i = vals[0] === vals[1] ? (v < vals[0] ? 0 : 1) : (Math.abs(v - vals[0]) <= Math.abs(v - vals[1]) ? 0 : 1);
      setVal(i, v, true);
    }
    active = i; thumbs[i].classList.add('is-drag'); thumbs[i].focus({ preventScroll: true });
    try { thumbs[i].setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault();
  });
  root.addEventListener('pointermove', function (e) { if (active != null) setVal(active, fromEvent(e), true); });
  function end(e) {
    if (active == null) return;
    thumbs[active].classList.remove('is-drag');
    try { thumbs[active].releasePointerCapture(e.pointerId); } catch (_) {}
    active = null; fire('change');
  }
  root.addEventListener('pointerup', end); root.addEventListener('pointercancel', end);

  thumbs.forEach(function (t, i) {
    t.addEventListener('keydown', function (e) {
      if (disabled) return;
      var k = e.key, big = Math.max(step, Math.round((max - min) / 10 / step) * step), dir = rtl ? -1 : 1, nv = null;
      if (k === 'ArrowRight') nv = vals[i] + step * dir; else if (k === 'ArrowUp') nv = vals[i] + step;
      else if (k === 'ArrowLeft') nv = vals[i] - step * dir; else if (k === 'ArrowDown') nv = vals[i] - step;
      else if (k === 'PageUp') nv = vals[i] + big; else if (k === 'PageDown') nv = vals[i] - big;
      else if (k === 'Home') nv = min; else if (k === 'End') nv = max;
      if (nv == null) return;
      e.preventDefault(); setVal(i, nv, true); fire('change');
    });
  });
  links.forEach(function (inp, i) {
    if (!inp) return;
    inp.min = min; inp.max = max; inp.step = step; inp.disabled = disabled;
    inp.addEventListener('input', function () { var v = parseFloat(inp.value); if (!isNaN(v) && v >= min && v <= max) setVal(i, v, true); });
    inp.addEventListener('change', function () { var v = parseFloat(inp.value); if (!isNaN(v)) setVal(i, v, true); render(); fire('change'); });
  });
  root.zhSlider = { get: function () { return vals.slice(); }, set: function (a) { a.forEach(function (v, i) { setVal(i, v, true); }); } };
  render();
}


ZhaoUI.component('slider', { selector: '.zh-slider', init: initSlider });
