// Tags. Closable: a .zh-tag--x with a .zh-tag-close button is removed when the button is clicked (fires zh:tag-remove { label }, cancelable).
// Selectable: .zh-tag--check with role="radio" inside role="radiogroup" (single choice, arrow keys) or role="checkbox" (toggle).
// Both fire zh:tag-change { value, values } on the group / on the tag.
function tagLabel(t) { var s = t.querySelector(':scope > span:first-child'); return (s ? s.textContent : t.firstChild ? t.firstChild.textContent : '').trim(); }
document.addEventListener('click', function (e) {
  var c = e.target.closest && e.target.closest('.zh-tag-close'); if (!c) return;
  var tag = c.closest('.zh-tag'); if (!tag) return;
  var label = tagLabel(tag), ev = new CustomEvent('zh:tag-remove', { bubbles: true, cancelable: true, detail: { label: label, tag: tag } });
  if (!tag.dispatchEvent(ev)) return;                         // preventDefault() keeps the tag
  var next = tag.nextElementSibling || tag.previousElementSibling;
  tag.classList.add('is-leaving');
  setTimeout(function () { tag.remove(); if (next && next.focus && /^(BUTTON|INPUT|A)$/.test(next.tagName)) next.focus(); }, ZH.reduced() ? 0 : 160);
});
ZhaoUI.component('tag-radio', { selector: '.zh-tag--check[role="radio"]', init: function (tag) {
  var group = tag.closest('[role="radiogroup"]'); if (!group || group.__zhTagGroup) return; group.__zhTagGroup = true;
  var items = function () { return [].slice.call(group.querySelectorAll('[role="radio"]')); };
  function select(el, silent) {
    items().forEach(function (x) { var on = x === el; x.setAttribute('aria-checked', String(on)); x.tabIndex = on ? 0 : -1; });
    if (!silent) group.dispatchEvent(new CustomEvent('zh:tag-change', { bubbles: true, detail: { value: el.textContent.trim(), values: [el.textContent.trim()] } }));
  }
  var cur = group.querySelector('[aria-checked="true"]') || items()[0]; if (cur) select(cur, true);
  group.addEventListener('click', function (e) { var r = e.target.closest('[role="radio"]'); if (r && group.contains(r)) select(r); });
  ZH.rovingFocus(group, '[role="radio"]', { orientation: 'horizontal', typeahead: false, onFocus: select });
} });
ZhaoUI.component('tag-check', { selector: '.zh-tag--check[role="checkbox"]', init: function (tag) {
  tag.addEventListener('click', function () {
    var on = tag.getAttribute('aria-checked') !== 'true'; tag.setAttribute('aria-checked', String(on));
    var group = tag.parentNode, values = [].slice.call(group.querySelectorAll('[role="checkbox"][aria-checked="true"]')).map(function (x) { return x.textContent.trim(); });
    tag.dispatchEvent(new CustomEvent('zh:tag-change', { bubbles: true, detail: { value: tag.textContent.trim(), checked: on, values: values } }));
  });
} });
