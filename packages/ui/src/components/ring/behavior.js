// Circular progress. Config via data-*: value, shape (full | gauge | semi), size, caption, status, name. Update with ZhaoUI.ring.set(el, 0..100).
// toneOf / clamp are shared with the linear bar, so they are repeated here (each component file is self-contained).
function clamp(v) { return Math.max(0, Math.min(100, v)); }
function toneOf(el, v) {
  var st = el.dataset.status || 'normal';
  if (st !== 'normal') return st;
  return v >= 100 && el.dataset.auto !== 'off' && el.dataset.indeterminate !== 'true' ? 'success' : 'normal';
}
var C_FULL = 263.89;
function mountRing(el) {
  var shape = el.dataset.shape || 'full';
  el.classList.toggle('zh-ring--gauge', shape === 'gauge'); el.classList.toggle('zh-ring--semi', shape === 'semi');
  var rot = shape === 'gauge' ? 135 : shape === 'semi' ? 180 : -90, vb = shape === 'semi' ? '0 0 100 58' : '0 0 100 100';
  el.innerHTML = '<svg viewBox="' + vb + '" aria-hidden="true"><circle class="zh-ring-track" cx="50" cy="50" r="42" transform="rotate(' + rot + ' 50 50)"/><circle class="zh-ring-arc" cx="50" cy="50" r="42" transform="rotate(' + rot + ' 50 50)"/></svg>' +
    '<div class="zh-ring-center"></div>' + (shape === 'gauge' ? '<div class="zh-ring-ends"><span>0</span><span>100</span></div>' : '');
  if (el.getAttribute('role') !== 'timer') el.setAttribute('role', 'progressbar');
  el.setAttribute('aria-valuemin', '0'); el.setAttribute('aria-valuemax', '100');
  if (el.dataset.name) el.setAttribute('aria-label', el.dataset.name);
  setRing(el, +el.dataset.value || 0);
}
function setRing(el, v, centerOverride) {
  v = clamp(v); el.dataset.value = String(v);
  el.style.setProperty('--zh-p', v / 100); el.classList.toggle('is-zero', v <= 0);
  var tone = toneOf(el, v); el.dataset.tone = tone;
  if (el.getAttribute('role') !== 'timer') { el.setAttribute('aria-valuenow', String(Math.round(v))); el.setAttribute('aria-valuetext', Math.round(v) + '%'); }
  var c = el.querySelector('.zh-ring-center'), cap = el.dataset.caption ? '<small>' + ZH.esc(el.dataset.caption) + '</small>' : '';
  if (centerOverride != null) c.innerHTML = centerOverride;
  else if (tone === 'success' && el.dataset.shape !== 'gauge' && el.dataset.shape !== 'semi') c.innerHTML = ZH.iconHtml('check');
  else if (tone === 'exception' && !el.dataset.shape) c.innerHTML = ZH.iconHtml('x');
  else c.innerHTML = '<span>' + Math.round(v) + '<span style="font-size:.55em;font-weight:500">%</span>' + cap + '</span>';
}

ZhaoUI.component('ring', { selector: '.zh-ring[data-value]', init: mountRing });
ZhaoUI.ring = { set: function (el, v, center) { el = ZhaoUI.ensure(el); if (el) setRing(el, +v, center); } };
