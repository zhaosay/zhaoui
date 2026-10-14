// Badge mark: <span class="zh-bdg"><...anything...><span class="zh-bdg-mark" data-count="5" data-tone="danger" data-label="条未读"></span></span>
// Config via data-*: count, max (99), show-zero, dot="true", text ("NEW"), tone (danger | primary | success | warning | info | neutral), label (read by screen readers).
// After changing data-count etc., call ZhaoUI.badge.paint(el); ZhaoUI.badge.pop(el) adds the little bounce.
function paintMark(m) {
  var dot = m.dataset.dot === 'true', text = m.dataset.text, label = m.dataset.label || '';
  var n = +m.dataset.count || 0, max = +(m.dataset.max || 99), showZero = m.dataset.showZero === 'true';
  m.classList.toggle('is-dot', dot);
  m.classList.toggle('is-text', !!text && !dot);
  var hidden = !dot && !text && n <= 0 && !showZero;
  m.classList.toggle('is-hidden', hidden);
  m.setAttribute('aria-hidden', hidden ? 'true' : 'false');
  if (dot) { m.innerHTML = '<span class="zh-bdg-sr">' + ZH.esc(label || '有更新') + '</span>'; return; }
  if (text) { m.innerHTML = '<span aria-hidden="true">' + ZH.esc(text) + '</span><span class="zh-bdg-sr">' + ZH.esc(text) + '</span>'; return; }
  var shown = n > max ? max + '+' : String(Math.max(0, n));
  m.innerHTML = '<span aria-hidden="true">' + shown + '</span><span class="zh-bdg-sr">' + n + ' ' + ZH.esc(label) + '</span>';
}
function popMark(m) {
  if (ZH.reduced()) return;
  m.classList.remove('is-pop'); void m.offsetWidth; m.classList.add('is-pop');
}

ZhaoUI.component('badge', { selector: '.zh-bdg-mark', init: paintMark });
ZhaoUI.badge = { paint: function (el) { el = typeof el === 'string' ? document.querySelector(el) : el; if (el) paintMark(el); }, pop: function (el) { el = typeof el === 'string' ? document.querySelector(el) : el; if (el) popMark(el); } };
