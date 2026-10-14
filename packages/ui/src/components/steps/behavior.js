// Steps: write <li data-title data-desc data-icon> items; the script builds the numbered/icon markers, the connector lines and the states from data-current (0-based) and data-error.
ZhaoUI.component('steps', { selector: '[data-zh-steps]', init: function (ol) {
  var items = [].slice.call(ol.children).filter(function (x) { return x.tagName === 'LI'; }).map(function (li) { return { title: li.getAttribute('data-title') || li.textContent.trim(), desc: li.getAttribute('data-desc') || '', icon: li.getAttribute('data-icon') || '', msg: li.getAttribute('data-msg') || '' }; });
  ol.classList.add('zh-steps'); if (!/zh-steps--(h|v)\b/.test(ol.className)) ol.classList.add('zh-steps--h');
  var st = { cur: +(ol.getAttribute('data-current') || 0), err: ol.hasAttribute('data-error') ? +ol.getAttribute('data-error') : -1, done: ol.hasAttribute('data-done') }, click = ol.hasAttribute('data-clickable');
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function render() {
    var icon = ol.getAttribute('data-mode') === 'icon', reach = ol.hasAttribute('data-reach') ? +ol.getAttribute('data-reach') : st.cur;
    ol.innerHTML = items.map(function (s, i) {
      var state = st.done ? 'finish' : st.err === i ? 'error' : i < st.cur ? 'finish' : i === st.cur ? 'process' : 'wait', isCur = !st.done && i === st.cur;
      var inner = icon ? ZH.iconHtml(state === 'finish' ? 'check' : state === 'error' ? 'x' : (s.icon || 'circle'), 16) : state === 'finish' ? ZH.iconHtml('check', 16) : state === 'error' ? ZH.iconHtml('x', 16) : String(i + 1);
      var msg = s.msg || (state === 'error' && ol.getAttribute('data-error-text')) || '';
      var main = '<span class="zh-step-main"><span class="zh-step-title">' + esc(s.title) + '</span>' + (!icon && s.desc ? '<span class="zh-step-desc" style="display:block">' + esc(s.desc) + '</span>' : '') + (msg ? '<span class="zh-step-msg" style="display:block">' + esc(msg) + '</span>' : '') + '</span>';
      var hit = click ? '<button type="button" class="zh-step-hit" data-step="' + i + '"' + (i > reach ? ' disabled' : '') + (isCur ? ' aria-current="step"' : '') + '><span class="zh-step-icon" aria-hidden="true">' + inner + '</span>' + main + '</button>'
        : '<span class="zh-step-hit"><span class="zh-step-icon" aria-hidden="true">' + inner + '</span>' + main + '</span>';
      return '<li class="zh-step is-' + state + '"' + (!click && isCur ? ' aria-current="step"' : '') + '>' + hit + '<span class="zh-step-line" aria-hidden="true"><i></i></span></li>';
    }).join('');
    ZH.hydrateIcons(ol); fit();
  }
  function fit() { if (ol.classList.contains('zh-steps--v')) return; ol.classList.remove('is-stacked'); if (ol.scrollWidth > ol.clientWidth + 1) ol.classList.add('is-stacked'); }   // too wide for its container: stack vertically
  if (click) ol.addEventListener('click', function (e) { var b = e.target.closest('[data-step]'); if (!b || b.disabled) return; var i = +b.getAttribute('data-step'); ol.dispatchEvent(new CustomEvent('zh:step-click', { bubbles: true, detail: { index: i, title: items[i].title } })); });
  if (window.ResizeObserver && ol.parentElement) new ResizeObserver(function () { fit(); }).observe(ol.parentElement);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  ol._zhSteps = { set: function (o) { if (o.current != null) st.cur = o.current; st.err = o.error != null ? o.error : (o.current != null ? -1 : st.err); if (o.done != null) st.done = !!o.done; render(); }, get: function () { return { current: st.cur, error: st.err, done: st.done }; } };
  render();
} });
ZhaoUI.steps = { set: function (el, o) { el = ZhaoUI.ensure(el); el._zhSteps.set(o); }, get: function (el) { el = ZhaoUI.ensure(el); return el._zhSteps.get(); } };
