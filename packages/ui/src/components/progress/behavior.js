// Linear progress. Config via data-*: value, label (outside | inside | top | none), status (normal | success | warning | exception), steps, buffer, target, target-label, indeterminate="true", name.
// The element is filled in for you; update it with ZhaoUI.progress.set(el, 0..100).
function clamp(v) { return Math.max(0, Math.min(100, v)); }
function toneOf(el, v) {
  var st = el.dataset.status || 'normal';
  if (st !== 'normal') return st;
  return v >= 100 && el.dataset.auto !== 'off' && el.dataset.indeterminate !== 'true' ? 'success' : 'normal';
}

/* ---------- Linear ---------- */
function mountProgress(el) {
  var label = el.dataset.label || 'outside', steps = +el.dataset.steps || 0, indet = el.dataset.indeterminate === 'true';
  el.classList.toggle('zh-progress--steps', !!steps);
  var head = '', track, extra = '';
  if (label === 'top') head = '<div class="zh-progress-head"><span>' + ZH.esc(el.dataset.title || el.dataset.name || '') + '</span><span class="pct"></span></div>';
  if (steps) { track = '<div class="zh-progress-track">' + new Array(steps + 1).join('<i></i>') + '</div>'; }
  else {
    track = '<div class="zh-progress-track">' + (el.dataset.buffer ? '<div class="zh-progress-buffer"></div>' : '') +
      '<div class="zh-progress-fill">' + (label === 'inside' ? '<span class="zh-progress-in"></span>' : '') + '</div></div>';
  }
  if (el.dataset.target) extra = '<span class="zh-progress-target" style="--zh-t:' + (+el.dataset.target) + '"><em>' + ZH.esc(el.dataset.targetLabel || '目标') + '</em></span>';
  el.innerHTML = head + '<div class="zh-progress-bar' + (extra ? ' has-target' : '') + '">' + track + extra + '</div>' + (label === 'outside' && !indet ? '<span class="zh-progress-label"></span>' : '');
  el.setAttribute('role', 'progressbar'); el.setAttribute('aria-valuemin', '0'); el.setAttribute('aria-valuemax', '100');
  el.setAttribute('aria-label', el.dataset.name || el.dataset.title || '进度');
  if (indet) { el.setAttribute('aria-busy', 'true'); el.removeAttribute('aria-valuenow'); el.setAttribute('aria-valuetext', '加载中'); return; }
  setProgress(el, +el.dataset.value || 0);
}
function setProgress(el, v) {
  v = clamp(v); el.dataset.value = String(v);
  el.style.setProperty('--zh-p', v / 100);
  if (el.dataset.buffer) el.style.setProperty('--zh-b', clamp(+el.dataset.buffer) / 100);
  var tone = toneOf(el, v); el.dataset.tone = tone;
  el.setAttribute('aria-valuenow', String(Math.round(v))); el.setAttribute('aria-valuetext', Math.round(v) + '%' + (tone === 'success' ? '，已完成' : tone === 'exception' ? '，失败' : ''));
  var txt = Math.round(v) + '%';
  var icon = tone === 'success' ? ZH.iconHtml('circle-check') : tone === 'exception' ? ZH.iconHtml('circle-x') : '';
  var lab = el.querySelector('.zh-progress-label'); if (lab) lab.innerHTML = icon || txt;
  var pct = el.querySelector('.pct'); if (pct) pct.innerHTML = icon ? icon + txt : txt;
  var inn = el.querySelector('.zh-progress-in'); if (inn) { inn.textContent = txt; inn.classList.toggle('is-hidden', v < 14); }
  var steps = el.querySelectorAll('.zh-progress-track i');
  if (steps.length) { var on = Math.round(v / 100 * steps.length); steps.forEach(function (s, i) { s.classList.toggle('on', i < on); }); }
}

ZhaoUI.component('progress', { selector: '.zh-progress', init: mountProgress });
ZhaoUI.progress = { set: function (el, v) { el = ZhaoUI.ensure(el); if (el) setProgress(el, +v); } };
