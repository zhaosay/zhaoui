// Pagination. Declarative: <div data-zh-pager data-total="486" data-size="10" data-show-size-changer data-show-jumper></div>
// Options (data-*): total, page, size, sizes ("10,20,50"), show-total, show-size-changer, show-jumper, simple, size-name (sm | md | lg), bordered, disabled, hide-on-single-page, siblings, boundary.
// Imperative: ZhaoUI.pager(el, { total, page, size, onChange }) returns { get, set, go }. Fires zh:page-change { page, size } either way.
function range(a, b) { var r = []; for (var i = a; i <= b; i++) r.push(i); return r; }
function pageItems(c, N, sib, bnd) {
  var slots = bnd * 2 + sib * 2 + 3;
  if (N <= slots) return range(1, N);
  var ls = Math.max(c - sib, bnd + 1), rs = Math.min(c + sib, N - bnd);
  var dotsL = ls > bnd + 2, dotsR = rs < N - bnd - 1, edge = 3 + 2 * sib;
  if (!dotsL && dotsR) return range(1, edge).concat(['r'], range(N - bnd + 1, N));
  if (dotsL && !dotsR) return range(1, bnd).concat(['l'], range(N - edge + 1, N));
  return range(1, bnd).concat(['l'], range(ls, rs), ['r'], range(N - bnd + 1, N));
}

/**
 * Pager component. Options: total, page, size, sizes[], showTotal, showSizeChanger, showJumper, simple, sizeName('sm'|'md'|'lg'),
 * bordered, disabled, hideOnSinglePage, onChange(page, size). Returns {get, set, go}.
 */
function Pager(root, o) {
  function fire() { if (o.onChange) o.onChange(o.page, o.size); root.dispatchEvent(new CustomEvent('zh:page-change', { bubbles: true, detail: { page: o.page, size: o.size } })); }
  o = Object.assign({ total: 0, page: 1, size: 10, sizes: [10, 20, 50, 100], showTotal: true, showSizeChanger: false, showJumper: false, simple: false, sizeName: 'md', bordered: false, disabled: false, hideOnSinglePage: false, siblings: 1, boundary: 1 }, o || {});
  var inner = document.createElement('div'), live = document.createElement('span');
  live.className = 'zh-pg-sr'; live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite');
  root.appendChild(inner); root.appendChild(live);
  var step = o.boundary * 2 + o.siblings * 2 + 1;

  function pages() { return Math.max(1, Math.ceil(o.total / o.size)); }
  function clamp(p) { return Math.max(1, Math.min(pages(), p)); }

  function render(focusKey) {
    var N = pages(); o.page = clamp(o.page);
    root.className = root.className.replace(/(^|\s)zh-pg(--\S+)?(?=\s|$)/g, ' ').replace(/\s+/g, ' ').trim() + ' zh-pg' + (o.sizeName !== 'md' ? ' zh-pg--' + o.sizeName : '') + (o.bordered ? ' zh-pg--bordered' : '') + (o.simple ? ' zh-pg--simple' : '');
    if (o.disabled) root.setAttribute('aria-disabled', 'true'); else root.removeAttribute('aria-disabled');
    root.hidden = !!(o.hideOnSinglePage && N <= 1);
    var dis = o.disabled ? ' disabled' : '';
    var atFirst = o.page <= 1, atLast = o.page >= N, h = '';
    if (o.showTotal) h += '<span class="zh-pg-total">共 <b>' + ZH.fmtN(o.total) + '</b> 条</span>';
    if (o.showSizeChanger) {
      h += '<div class="zh-select zh-pg-size"><select aria-label="每页条数"' + dis + '>' + o.sizes.map(function (s) { return '<option value="' + s + '"' + (s === o.size ? ' selected' : '') + '>' + s + ' 条/页</option>'; }).join('') + '</select></div>';
    }
    h += '<button type="button" class="zh-pg-btn zh-pg-prev" data-act="prev" aria-label="上一页"' + (atFirst ? ' aria-disabled="true"' : '') + dis + '><i data-i="chevron-left"></i></button>';
    h += '<ul class="zh-pg-list">' + pageItems(o.page, N, o.siblings, o.boundary).map(function (it) {
      if (it === 'l' || it === 'r') {
        var back = it === 'l';
        return '<li><button type="button" class="zh-pg-btn zh-pg-ellipsis" data-act="' + (back ? 'jb' : 'jf') + '" aria-label="' + (back ? '向前' : '向后') + ' ' + step + ' 页"' + dis + '><span class="zh-pg-dots" aria-hidden="true">…</span><i class="zh-pg-jump" data-i="' + (back ? 'chevrons-left' : 'chevrons-right') + '"></i></button></li>';
      }
      var cur = it === o.page;
      return '<li><button type="button" class="zh-pg-btn" data-p="' + it + '" aria-label="第 ' + it + ' 页"' + (cur ? ' aria-current="page"' : '') + dis + '>' + it + '</button></li>';
    }).join('') + '</ul>';
    h += '<span class="zh-pg-mid"><input class="zh-input zh-pg-num" inputmode="numeric" aria-label="当前页，回车跳转" value="' + o.page + '"' + dis + '> <span aria-hidden="true">/</span> <span>' + N + '</span></span>';
    h += '<button type="button" class="zh-pg-btn zh-pg-next" data-act="next" aria-label="下一页"' + (atLast ? ' aria-disabled="true"' : '') + dis + '><i data-i="chevron-right"></i></button>';
    if (o.showJumper) h += '<label class="zh-pg-jumpbox">跳至 <input class="zh-input zh-pg-num" data-jump inputmode="numeric" aria-label="跳转到第几页，回车确认"' + dis + '> 页</label>';
    inner.className = 'zh-pg-in'; inner.innerHTML = h; ZH.hydrateIcons(inner);
    if (focusKey) {
      var t = focusKey === 'prev' && !atFirst ? inner.querySelector('.zh-pg-prev') : focusKey === 'next' && !atLast ? inner.querySelector('.zh-pg-next') : inner.querySelector('[aria-current="page"]');
      if (t) t.focus();
    }
  }
  function announce() { live.textContent = ''; setTimeout(function () { live.textContent = '第 ' + o.page + ' 页，共 ' + pages() + ' 页'; }, 30); }
  function go(p, focusKey) {
    p = clamp(p);
    if (p === o.page) { render(focusKey); return; }
    o.page = p; render(focusKey); announce();
    fire();
  }
  function jump(input) {
    var raw = input.value.trim();
    if (!/^\d+$/.test(raw)) { input.setAttribute('aria-invalid', 'true'); live.textContent = '请输入 1 到 ' + pages() + ' 之间的页码'; return; }
    input.removeAttribute('aria-invalid');
    var n = parseInt(raw, 10); go(n, 'cur');
    var again = inner.querySelector('[data-jump]'); if (again) again.value = '';
  }

  root.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || !root.contains(b) || b.disabled || b.getAttribute('aria-disabled') === 'true') return;
    var act = b.getAttribute('data-act'), p = b.getAttribute('data-p');
    if (p) go(+p, 'cur');
    else if (act === 'prev') go(o.page - 1, 'prev');
    else if (act === 'next') go(o.page + 1, 'next');
    else if (act === 'jb') go(o.page - step, 'cur');
    else if (act === 'jf') go(o.page + step, 'cur');
  });
  root.addEventListener('keydown', function (e) {
    var t = e.target;
    if (e.key === 'Enter' && t.matches && t.matches('input.zh-pg-num')) { e.preventDefault(); jump(t); }
  });
  root.addEventListener('input', function (e) { if (e.target.matches && e.target.matches('input.zh-pg-num')) e.target.removeAttribute('aria-invalid'); });
  root.addEventListener('change', function (e) {
    if (e.target.tagName === 'SELECT') {
      var first = (o.page - 1) * o.size, ns = parseInt(e.target.value, 10);
      o.size = ns; o.page = Math.floor(first / ns) + 1; render(); announce();
      fire();
    }
  });
  render();
  return {
    get: function () { return { page: o.page, size: o.size, total: o.total, pages: pages() }; },
    set: function (part) { Object.assign(o, part); render(); },
    go: go, root: root
  };
}


var BOOL = ['showTotal', 'showSizeChanger', 'showJumper', 'simple', 'bordered', 'disabled', 'hideOnSinglePage'], NUM = ['total', 'page', 'size', 'siblings', 'boundary'];
function fromData(el) {
  var d = el.dataset, o = {};
  NUM.forEach(function (k) { if (d[k] != null) o[k] = +d[k]; });
  BOOL.forEach(function (k) { if (d[k] != null) o[k] = d[k] !== 'false'; });
  if (d.pageSize != null) o.size = +d.pageSize;               // data-page-size is the same as data-size, spelled so it cannot be mistaken for the visual size
  if (d.sizes) o.sizes = d.sizes.split(',').map(Number);
  if (d.sizeName) o.sizeName = d.sizeName;
  return o;
}
ZhaoUI.component('pager', { selector: '[data-zh-pager]', init: function (el) { el.__zhPager = Pager(el, fromData(el)); } });
ZhaoUI.pager = function (el, o) { el = typeof el === 'string' ? document.querySelector(el) : el; if (!el) return null; el.__zhPager = Pager(el, o || {}); return el.__zhPager; };
