// Chapter numbers for navigation links. The number is the section's position among section.block elements in the DOM,
// which is exactly what the CSS counter in style.css renders next to each heading, so the two always agree.
var order = {};
Array.prototype.forEach.call(document.querySelectorAll('section.block'), function (s, i) { if (s.id) order[s.id] = i + 1; });
Array.prototype.forEach.call(document.querySelectorAll('.toc a, .zh-ov-map a'), function (a) {
  var id = (a.getAttribute('href') || '').replace('#', '');
  if (order[id]) a.setAttribute('data-n', String(order[id]));
});

// Keep the current chapter visible inside the sidebar (it scrolls independently from the page).
var tocEl = document.querySelector('.toc');
if (tocEl && window.MutationObserver) {
  var reveal = function (a) {
    var top = a.offsetTop, bottom = top + a.offsetHeight, pad = 48;
    if (top < tocEl.scrollTop + pad) tocEl.scrollTop = Math.max(0, top - pad);
    else if (bottom > tocEl.scrollTop + tocEl.clientHeight - pad) tocEl.scrollTop = bottom - tocEl.clientHeight + pad;
  };
  new MutationObserver(function (list) {
    list.forEach(function (m) { if (m.target.tagName === 'A' && m.target.classList.contains('active')) reveal(m.target); });
  }).observe(tocEl, { attributes: true, attributeFilter: ['class'], subtree: true });
}
