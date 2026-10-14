// Table sorting and row selection.  Sorting: <th data-sort="text|number"> turns the header into a button and reorders the rows (data-sort-mode="server" only reports).
// Selection: <input type="checkbox" data-zh-all> in the header, <input type="checkbox" data-zh-row> in each row.
ZhaoUI.component('table', { selector: 'table[data-zh-table]', init: function (t) {
  var body = t.tBodies[0]; if (!body) return;
  var server = t.getAttribute('data-sort-mode') === 'server', heads = [].slice.call(t.querySelectorAll('thead th[data-sort]'));
  function rows() { return [].slice.call(body.rows); }
  function cellVal(tr, i, kind) {
    var c = tr.cells[i], v = c ? (c.hasAttribute('data-sort-value') ? c.getAttribute('data-sort-value') : c.textContent.trim()) : '';
    if (kind === 'number') { var n = parseFloat(String(v).replace(/[,\s%¥$]/g, '')); return isNaN(n) ? null : n; }
    return v;
  }
  function sortBy(th, dir) {
    var i = th.cellIndex, kind = th.getAttribute('data-sort') || 'text';
    heads.forEach(function (h) { if (h === th && dir) h.setAttribute('aria-sort', dir === 'asc' ? 'ascending' : 'descending'); else h.setAttribute('aria-sort', 'none'); });
    if (!server && dir) {
      var list = rows().map(function (r, k) { return { r: r, k: k, v: cellVal(r, i, kind) }; });
      list.sort(function (a, b) {
        if (a.v === b.v) return a.k - b.k; if (a.v === null) return 1; if (b.v === null) return -1;     // empty values always last
        var c = kind === 'number' ? a.v - b.v : String(a.v).localeCompare(String(b.v), 'zh-Hans-CN', { numeric: true });
        return (dir === 'asc' ? c : -c) || a.k - b.k;
      });
      list.forEach(function (x) { body.appendChild(x.r); });
    } else if (!server && !dir) { rows().sort(function (a, b) { return (a._zhi || 0) - (b._zhi || 0); }).forEach(function (r) { body.appendChild(r); }); }
    t.dispatchEvent(new CustomEvent('zh:table-sort', { bubbles: true, detail: { index: i, key: th.getAttribute('data-key') || th.textContent.trim(), direction: dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none' } }));
  }
  rows().forEach(function (r, k) { r._zhi = k; });
  heads.forEach(function (th) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'zh-sort';
    while (th.firstChild) b.appendChild(th.firstChild); th.appendChild(b); if (!th.hasAttribute('aria-sort')) th.setAttribute('aria-sort', 'none');
    b.addEventListener('click', function () { var cur = th.getAttribute('aria-sort'); sortBy(th, cur === 'ascending' ? 'desc' : cur === 'descending' ? null : 'asc'); });
  });

  var all = t.querySelector('thead input[data-zh-all]');
  function checks() { return [].slice.call(body.querySelectorAll('input[data-zh-row]')); }
  function selected() { return checks().filter(function (c) { return c.checked; }).map(function (c) { return c.closest('tr'); }); }
  function sync(emit) {
    var cs = checks(), n = 0; cs.forEach(function (c) { c.closest('tr').classList.toggle('is-selected', c.checked); if (c.checked) n++; });
    if (all) { all.checked = n > 0 && n === cs.length; all.indeterminate = n > 0 && n < cs.length; }
    if (emit) t.dispatchEvent(new CustomEvent('zh:table-select', { bubbles: true, detail: { rows: selected(), count: n, all: n > 0 && n === cs.length } }));
  }
  t.addEventListener('change', function (e) {
    var el = e.target; if (!el.matches || !t.contains(el)) return;
    if (el === all) { checks().forEach(function (c) { if (!c.disabled) c.checked = all.checked; }); sync(true); }
    else if (el.matches('input[data-zh-row]')) sync(true);
  });
  sync(false);
  t._zhTable = { selected: selected, clear: function () { checks().forEach(function (c) { c.checked = false; }); sync(true); } };
} });
ZhaoUI.table = { selected: function (el) { el = ZhaoUI.ensure(el); return el._zhTable.selected(); }, clear: function (el) { el = ZhaoUI.ensure(el); el._zhTable.clear(); } };
