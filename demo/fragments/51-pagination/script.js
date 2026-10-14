// ---- data: 86 rows ----
var TITLES = ['产品发布公告', '季度运营复盘', '设备巡检规范', '数据安全白皮书', '客户成功手册', '版本更新说明', '权限管理指南', '接口变更通知', '用户增长报告', '品牌视觉规范', '中控系统运维', '内容审核标准'];
var DEPTS = ['产品部', '运营部', '技术部', '安全部', '市场部'];
var STATUS = [['已发布', 'success'], ['待审核', 'warning'], ['草稿', ''], ['已下线', 'danger']];
var ROWS = [];
for (var i = 1; i <= 86; i++) {
  var d = new Date(2026, 8, 28 - Math.floor(i / 2));
  ROWS.push({ id: i, title: TITLES[(i * 7) % TITLES.length] + (i > 12 ? ' ' + i : ''), dept: DEPTS[(i * 3) % DEPTS.length], status: STATUS[(i * 5) % 4], date: d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) });
}

// ---- page list with a constant number of slots ----
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
  o = Object.assign({ total: 0, page: 1, size: 10, sizes: [10, 20, 50, 100], showTotal: true, showSizeChanger: false, showJumper: false, simple: false, sizeName: 'md', bordered: false, disabled: false, hideOnSinglePage: false, siblings: 1, boundary: 1 }, o || {});
  var inner = document.createElement('div'), live = document.createElement('span');
  live.className = 'zh-pg-sr'; live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite');
  root.appendChild(inner); root.appendChild(live);
  var step = o.boundary * 2 + o.siblings * 2 + 1;

  function pages() { return Math.max(1, Math.ceil(o.total / o.size)); }
  function clamp(p) { return Math.max(1, Math.min(pages(), p)); }

  function render(focusKey) {
    var N = pages(); o.page = clamp(o.page);
    root.className = 'zh-pg' + (o.sizeName !== 'md' ? ' zh-pg--' + o.sizeName : '') + (o.bordered ? ' zh-pg--bordered' : '') + (o.simple ? ' zh-pg--simple' : '');
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
    if (o.onChange) o.onChange(o.page, o.size);
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
      if (o.onChange) o.onChange(o.page, o.size);
    }
  });
  render();
  return {
    get: function () { return { page: o.page, size: o.size, total: o.total, pages: pages() }; },
    set: function (part) { Object.assign(o, part); render(); },
    go: go, root: root
  };
}

// ---- main demo: table + filter + skeleton ----
var body = document.getElementById('pgxBody'), wrap = document.getElementById('pgxTableWrap'), empty = document.getElementById('pgxEmpty');
var search = document.getElementById('pgxSearch'), tableEl = wrap.querySelector('table');
var filtered = ROWS.slice(), token = 0;
function rowHtml(r) {
  return '<tr><td class="num" data-label="编号">' + r.id + '</td><td data-label="标题">' + ZH.esc(r.title) + '</td><td data-label="部门">' + ZH.esc(r.dept) + '</td><td data-label="状态"><span class="zh-tag' + (r.status[1] ? ' ' + r.status[1] : '') + '">' + r.status[0] + '</span></td><td data-label="更新时间">' + r.date + '</td></tr>';
}
function skelHtml(n) {
  var w = ['30px', '64%', '52px', '48px', '76px'], h = '';
  for (var i = 0; i < n; i++) h += '<tr>' + ['编号', '标题', '部门', '状态', '更新时间'].map(function (l, k) { return '<td data-label="' + l + '"><span class="zh-skeleton" style="display:inline-block;width:' + w[k] + '"></span></td>'; }).join('') + '</tr>';
  return h;
}
var main = Pager(document.getElementById('pgxMain'), {
  total: filtered.length, size: 10, sizes: [10, 20, 50], showSizeChanger: true, showJumper: true, bordered: true,
  onChange: function () { load(true); }
});
function load(withDelay) {
  var st = main.get(), my = ++token;
  wrap.setAttribute('aria-busy', 'true');
  var show = function () {
    if (my !== token) return; // stale response
    var from = (st.page - 1) * st.size, rows = filtered.slice(from, from + st.size);
    body.innerHTML = rows.map(rowHtml).join(''); wrap.removeAttribute('aria-busy');
  };
  if (withDelay) { body.innerHTML = skelHtml(Math.min(st.size, 10)); setTimeout(show, 420); } else show();
}
function applyFilter() {
  var q = search.value.trim().toLowerCase();
  filtered = ROWS.filter(function (r) { return !q || r.title.toLowerCase().indexOf(q) >= 0; });
  var none = !filtered.length;
  empty.hidden = !none; tableEl.style.display = none ? 'none' : '';
  main.root.parentNode.style.display = none ? 'none' : '';
  main.set({ total: filtered.length, page: 1 }); load(false);
}
search.addEventListener('input', applyFilter);
document.getElementById('pgxClear').addEventListener('click', function () { search.value = ''; applyFilter(); search.focus(); });
load(false);

// ---- variants ----
Pager(document.getElementById('pgStd'), { total: 486, size: 10, showSizeChanger: true, showJumper: true });
Pager(document.getElementById('pgSimple'), { total: 200, size: 10, simple: true, showTotal: false });
Pager(document.getElementById('pgMini'), { total: 120, size: 10, sizeName: 'sm', showTotal: false });
Pager(document.getElementById('pgBordered'), { total: 300, size: 10, bordered: true, showTotal: false });
Pager(document.getElementById('pgDisabled'), { total: 300, size: 10, page: 3, disabled: true, showTotal: false });
Pager(document.getElementById('pgSm'), { total: 200, size: 10, sizeName: 'sm', showTotal: false, bordered: true });
Pager(document.getElementById('pgMd'), { total: 200, size: 10, showTotal: false, bordered: true });
Pager(document.getElementById('pgLg'), { total: 200, size: 10, sizeName: 'lg', showTotal: false, bordered: true });
var one = Pager(document.getElementById('pgOne'), { total: 8, size: 10, hideOnSinglePage: true, bordered: true });
var oneHint = document.getElementById('pgOneHint');
function oneSync() { var n = one.get(); oneHint.textContent = n.pages <= 1 ? '只有 1 页，分页已隐藏' : '共 ' + n.pages + ' 页，显示分页'; }
oneSync();
document.getElementById('pgOneSeg').addEventListener('click', function (e) {
  var b = e.target.closest('button'); if (!b) return;
  this.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
  one.set({ total: +b.getAttribute('data-v'), page: 1 }); oneSync();
});

// ---- load more ----
var moreList = document.getElementById('pgxMoreList'), moreBtn = document.getElementById('pgxMoreBtn'), moreBar = document.getElementById('pgxMoreBar'), moreCount = document.getElementById('pgxMoreCount');
var moreShown = 0, moreBusy = false;
function liHtml(r, i) { return '<li style="--zh-i:' + i + '"><span class="zh-pgx-id">#' + r.id + '</span><span class="zh-pgx-t">' + ZH.esc(r.title) + '</span><span class="zh-pgx-d">' + r.date.slice(5) + '</span></li>'; }
function moreSync() {
  moreBar.style.width = (moreShown / ROWS.length * 100) + '%';
  moreCount.textContent = '已加载 ' + moreShown + ' / ' + ROWS.length;
  var done = moreShown >= ROWS.length;
  moreBtn.disabled = done; moreBtn.textContent = done ? '没有更多了' : '加载更多';
  moreBtn.removeAttribute('aria-busy');
}
function loadMore(n, first) {
  if (moreBusy) return; moreBusy = true;
  moreBtn.setAttribute('aria-busy', 'true'); moreBtn.innerHTML = '<span class="spin" aria-hidden="true"></span>加载中';
  setTimeout(function () {
    var rows = ROWS.slice(moreShown, moreShown + n);
    moreList.insertAdjacentHTML('beforeend', rows.map(function (r, i) { return liHtml(r, i); }).join(''));
    moreShown += rows.length; moreBusy = false; moreSync();
    if (!first) { var items = moreList.querySelectorAll('li'); var target = items[moreShown - rows.length]; if (target) target.scrollIntoView({ block: 'nearest', behavior: ZH.reduced() ? 'auto' : 'smooth' }); }
  }, first ? 0 : 500);
}
moreBtn.addEventListener('click', function () { loadMore(6, false); });
loadMore(6, true);

// ---- cursor ----
var curList = document.getElementById('pgxCurList'), curPrev = document.getElementById('pgxCurPrev'), curNext = document.getElementById('pgxCurNext'), curInfo = document.getElementById('pgxCurInfo');
var CUR_SIZE = 6, curStack = [0], curBusy = false;
function curRender() {
  var start = curStack[curStack.length - 1], rows = ROWS.slice(start, start + CUR_SIZE), hasNext = start + CUR_SIZE < ROWS.length;
  curList.innerHTML = rows.map(function (r, i) { return liHtml(r, i); }).join('');
  curPrev.setAttribute('aria-disabled', String(curStack.length === 1)); curNext.setAttribute('aria-disabled', String(!hasNext));
  curInfo.textContent = '第 ' + curStack.length + ' 页' + (hasNext ? '' : ' · 已到末尾');
}
function curMove(dir) {
  var btn = dir > 0 ? curNext : curPrev;
  if (curBusy || btn.getAttribute('aria-disabled') === 'true') return;
  curBusy = true; curList.style.opacity = '.55';
  setTimeout(function () {
    if (dir > 0) curStack.push(curStack[curStack.length - 1] + CUR_SIZE); else curStack.pop();
    curBusy = false; curList.style.opacity = ''; curRender();
    if (btn.getAttribute('aria-disabled') === 'true') (dir > 0 ? curPrev : curNext).focus();
  }, 320);
}
curNext.addEventListener('click', function () { curMove(1); });
curPrev.addEventListener('click', function () { curMove(-1); });
curRender();
ZH.hydrateIcons(document.getElementById('pagination'));
