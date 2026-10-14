var root = document.getElementById('tilesRoot'), tpl = document.getElementById('tilesTpl');
var LABEL = { flat: '扁平 FLAT', glass: '玻璃拟态 GLASS' };
['flat', 'glass'].forEach(function (style) {
  var col = document.createElement('div');
  col.className = 'zh-tiles-col'; col.setAttribute('data-style', style);
  var tag = document.createElement('div'); tag.className = 'zh-tiles-tag'; tag.textContent = LABEL[style]; col.appendChild(tag);
  var html = tpl.innerHTML.replace(/\{ID\}/g, style);
  var holder = document.createElement('div'); holder.innerHTML = html;
  while (holder.firstChild) col.appendChild(holder.firstChild);
  root.appendChild(col);
  ZH.hydrateIcons(col);

  var knob = col.querySelector('.zh-tiles-knob'), arc = col.querySelector('.zh-tiles-knobarc'), val = col.querySelector('.zh-tiles-knobval span');
  var MIN = 16, MAX = 30, v = 22;
  function setV(n) {
    v = Math.max(MIN, Math.min(MAX, Math.round(n * 2) / 2));
    var f = (v - MIN) / (MAX - MIN);
    knob.style.setProperty('--zh-knob-angle', (-135 + f * 270) + 'deg');
    arc.setAttribute('stroke-dasharray', (f * 282.7).toFixed(1) + ' 999');
    knob.setAttribute('aria-valuenow', v); knob.setAttribute('aria-valuetext', v.toFixed(1) + ' 摄氏度');
    val.innerHTML = v.toFixed(1) + '<small></small>';
  }
  function fromPointer(e) {
    var r = knob.getBoundingClientRect(), a = Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180 / Math.PI;
    if (a > 135 || a < -135) a = a > 0 ? 135 : -135;
    setV(MIN + (a + 135) / 270 * (MAX - MIN));
  }
  knob.addEventListener('pointerdown', function (e) { knob.setPointerCapture(e.pointerId); knob.focus(); fromPointer(e); });
  knob.addEventListener('pointermove', function (e) { if (knob.hasPointerCapture(e.pointerId)) fromPointer(e); });
  knob.addEventListener('keydown', function (e) {
    var d = { ArrowUp: .5, ArrowRight: .5, ArrowDown: -.5, ArrowLeft: -.5, PageUp: 2, PageDown: -2 }[e.key];
    if (d) { e.preventDefault(); setV(v + d); }
    else if (e.key === 'Home') { e.preventDefault(); setV(MIN); } else if (e.key === 'End') { e.preventDefault(); setV(MAX); }
  });
  setV(v);

  var range = col.querySelector('.zh-tiles-range'), rv = col.querySelector('.zh-tiles-rangeval');
  function setR() { range.style.setProperty('--p', range.value + '%'); rv.textContent = range.value + '%'; }
  range.addEventListener('input', setR); setR();

  col.querySelectorAll('.seg').forEach(function (g) {
    g.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; g.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); });
  });
});
