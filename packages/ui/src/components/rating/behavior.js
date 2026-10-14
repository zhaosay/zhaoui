// Star / heart rating. Config via data-*: value, count (5), half, readonly, disabled, clear, icon (star | heart), labels ("差,一般,好"), show-value, label.
// Fires zh:rating { value }. Read through el.zhRating.get().
var nf = function (v, dec) { return Number(v).toLocaleString('zh-CN', { maximumFractionDigits: dec == null ? 2 : dec }); };
function initRating(root) {
  var d = root.dataset;
  var count = d.count ? +d.count : 5, half = d.half != null, ro = d.readonly != null, dis = d.disabled != null, clear = d.clear != null;
  var icon = d.icon || 'star', unit = icon === 'heart' ? '心' : '星';
  var labels = d.labels ? d.labels.split(',') : null, show = d.showValue != null, aria = d.label || '评分';
  var val = d.value ? +d.value : 0, name = ZH.uid('rt');
  root.classList.toggle('is-half', half); root.classList.toggle('is-readonly', ro); root.classList.toggle('is-disabled', dis);
  if (icon === 'heart') root.classList.add('is-heart');
  var interactive = !ro;

  var cells = '';
  for (var k = 0; k < count; k++) {
    var inputs = '';
    if (interactive) {
      var vs = half ? [k + 0.5, k + 1] : [k + 1];
      inputs = vs.map(function (v, j) {
        var lab = v + ' ' + unit + (labels && labels[Math.ceil(v) - 1] ? ' · ' + labels[Math.ceil(v) - 1] : '');
        return '<input class="zh-rating-in' + (j ? ' hi' : '') + '" type="radio" name="' + name + '" value="' + v + '" aria-label="' + ZH.esc(lab) + '"' + (dis ? ' disabled' : '') + '>';
      }).join('');
    }
    cells += '<span class="zh-rating-cell">' + inputs + '<span class="zh-rating-icons">' + ZH.iconHtml(icon, null, 'zh-rating-base') + '<span class="zh-rating-part">' + ZH.iconHtml(icon) + '</span></span></span>';
  }
  var stars = '<span class="zh-rating-stars"' + (interactive ? ' role="radiogroup" aria-label="' + ZH.esc(aria) + '"' : ' role="img"') + '>' + cells + '</span>';
  root.innerHTML = stars + (show ? '<span class="zh-rating-num"></span>' : '') + (labels ? '<span class="zh-rating-text" aria-live="polite"></span>' : '');
  var box = root.querySelector('.zh-rating-stars'), parts = [].slice.call(root.querySelectorAll('.zh-rating-part'));
  var radios = [].slice.call(root.querySelectorAll('.zh-rating-in')), num = root.querySelector('.zh-rating-num'), txt = root.querySelector('.zh-rating-text');

  function render(pv) {
    var v = pv != null ? pv : val;
    parts.forEach(function (p, i) { p.style.width = Math.max(0, Math.min(1, v - i)) * 100 + '%'; });
    if (num) num.textContent = v ? v.toFixed(half || ro ? 1 : 0) : '—';
    if (txt) { txt.textContent = v ? labels[Math.ceil(v) - 1] || '' : '未评分'; txt.classList.toggle('is-empty', !v); }
    if (!interactive) box.setAttribute('aria-label', aria + ' ' + val + ' 分，满分 ' + count + ' 分');
    else radios.forEach(function (r) { r.checked = val > 0 && +r.value === val; });
  }
  function set(v) { val = v; render(); root.dispatchEvent(new CustomEvent('zh:rating', { bubbles: true, detail: { value: val } })); }
  if (interactive && !dis) {
    box.addEventListener('change', function (e) { set(+e.target.value); });
    box.addEventListener('click', function (e) { var t = e.target; if (t.classList.contains('zh-rating-in') && document.activeElement !== t) t.focus({ preventScroll: true }); if (clear && t.classList.contains('zh-rating-in') && +t.value === val) { t.checked = false; set(0); } });
    box.addEventListener('pointerover', function (e) { if (e.target.classList.contains('zh-rating-in')) render(+e.target.value); });
    box.addEventListener('pointerleave', function () { render(); });
    box.addEventListener('keydown', function (e) { if (clear && (e.key === 'Backspace' || e.key === 'Delete')) { e.preventDefault(); set(0); } });
  }
  root.zhRating = { get: function () { return val; } };
  render();
}


ZhaoUI.component('rating', { selector: '.zh-rating', init: initRating });
