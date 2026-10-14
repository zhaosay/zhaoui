// Collapse / accordion. data-mode="single" keeps one item open; "multiple" (default) lets several stay open.
ZhaoUI.component('collapse', { selector: '.zh-collapse', init: function (c) {
  var single = c.getAttribute('data-mode') === 'single';
  function items() { return [].slice.call(c.children).filter(function (x) { return x.classList.contains('zh-collapse-item'); }); }
  function trigger(it) { return it.querySelector(':scope > .zh-collapse-h > .zh-collapse-trigger'); }
  function sync(it) {
    var t = trigger(it), p = it.querySelector(':scope > .zh-collapse-panel'), open = it.classList.contains('is-open');
    if (!t || !p) return;
    if (!p.id) p.id = ZH.uid('zh-cp'); if (!t.id) t.id = ZH.uid('zh-ct');
    t.setAttribute('aria-expanded', String(open)); t.setAttribute('aria-controls', p.id);
    p.setAttribute('role', 'region'); p.setAttribute('aria-labelledby', t.id);
    if (open) p.removeAttribute('inert'); else p.setAttribute('inert', '');
  }
  function set(it, open) {
    it.classList.toggle('is-open', open); sync(it);
    c.dispatchEvent(new CustomEvent('zh:collapse-toggle', { bubbles: true, detail: { item: it, open: open } }));
  }
  items().forEach(sync);
  c.addEventListener('click', function (e) {
    var t = e.target.closest('.zh-collapse-trigger'); if (!t || t.closest('.zh-collapse') !== c || t.disabled) return;
    var it = t.closest('.zh-collapse-item'), open = !it.classList.contains('is-open');
    if (open && single) items().forEach(function (o) { if (o !== it && o.classList.contains('is-open')) set(o, false); });
    set(it, open);
  });
  c.addEventListener('keydown', function (e) {
    var t = e.target.closest('.zh-collapse-trigger'); if (!t || t.closest('.zh-collapse') !== c) return;
    var list = items().map(trigger).filter(function (x) { return x && !x.disabled; }), i = list.indexOf(t), to = -1;
    if (e.key === 'ArrowDown') to = (i + 1) % list.length; else if (e.key === 'ArrowUp') to = (i - 1 + list.length) % list.length;
    else if (e.key === 'Home') to = 0; else if (e.key === 'End') to = list.length - 1;
    if (to >= 0) { e.preventDefault(); list[to].focus(); }
  });
} });
