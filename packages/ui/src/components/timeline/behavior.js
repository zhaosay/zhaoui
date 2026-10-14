// Timeline: the markup is plain HTML; this only makes the "展开详情" buttons inside a .zh-tl work.
ZhaoUI.component('timeline', { selector: '.zh-tl', init: function (tl) {
  tl.addEventListener('click', function (e) {
    var b = e.target.closest('.zh-tl-toggle'); if (!b || !tl.contains(b)) return;
    var open = b.getAttribute('aria-expanded') !== 'true', label = b.querySelector('span');
    b.setAttribute('aria-expanded', String(open)); if (label) label.textContent = open ? (b.getAttribute('data-close') || '收起详情') : (b.getAttribute('data-open') || '展开详情');
    b.closest('.zh-tl-body').classList.toggle('is-open', open);
    tl.dispatchEvent(new CustomEvent('zh:timeline-toggle', { bubbles: true, detail: { item: b.closest('.zh-tl-item'), open: open } }));
  });
} });
