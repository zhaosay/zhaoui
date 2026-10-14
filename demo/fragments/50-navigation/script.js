var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
var sec = $('#navigation');
var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
$$('[data-mod]').forEach(function (n) { if (isMac) n.innerHTML = '<i data-i="command" data-s="12"></i>'; else n.textContent = 'Ctrl'; });
ZH.hydrateIcons(sec);
$('#navSearch').setAttribute('aria-label', '搜索，快捷键 ' + (isMac ? 'Command K' : 'Ctrl K'));
var smooth = function () { return ZH.reduced() ? 'auto' : 'smooth'; };
function raf(fn) { var q = 0; return function () { if (q) return; q = requestAnimationFrame(function () { q = 0; fn(); }); }; }
function watchSize(el, fn) { if (window.ResizeObserver) new ResizeObserver(raf(fn)).observe(el); else window.addEventListener('resize', fn); }
sec.addEventListener('click', function (e) { if (e.target.closest('a[data-nav-noop]')) e.preventDefault(); });

// ---------- shared menu popup ----------
// items: {type:'head'|'group'|'sep'} or {label, icon, kbd, danger, disabled, current, onSelect}. kind 'menu' = actions (role=menuitem), 'links' = navigation links.
function menuHtml(items, kind) {
  var n = 0;
  return items.map(function (it) {
    if (it.type === 'head') return '<div class="zh-nav-mhead"><b>' + ZH.esc(it.title) + '</b><span>' + ZH.esc(it.sub || '') + '</span></div>';
    if (it.type === 'group') return '<div class="zh-nav-mgroup" role="presentation">' + ZH.esc(it.label) + '</div>';
    if (it.type === 'sep') return '<div class="zh-nav-sep" role="separator"></div>';
    var i = n++, cls = 'zh-nav-mi' + (it.danger ? ' zh-nav-mi--danger' : '') + (it.indent ? ' zh-nav-mi--sub' : '');
    var inner = (it.icon ? '<i data-i="' + it.icon + '" data-s="18"></i>' : '') + '<span>' + ZH.esc(it.label) + '</span>' + (it.kbd ? '<span class="zh-kbd">' + ZH.esc(it.kbd) + '</span>' : '');
    var dis = it.disabled ? ' aria-disabled="true"' : '', cur = it.current ? ' aria-current="page"' : '';
    if (kind === 'links') return '<a class="' + cls + '" href="#" data-n="' + i + '" tabindex="-1"' + dis + cur + '>' + inner + '</a>';
    return '<button type="button" class="' + cls + '" role="menuitem" data-n="' + i + '" tabindex="-1"' + dis + '>' + inner + '</button>';
  }).join('');
}
function openMenu(anchor, items, o) {
  o = o || {};
  var kind = o.kind || 'menu';
  var api = ZH.popover(anchor, {
    role: kind === 'menu' ? 'menu' : 'group', z: o.z || 'dropdown', placement: o.placement || 'bottom-end', offset: o.offset == null ? 6 : o.offset,
    content: function () { var d = document.createElement('div'); d.className = 'zh-nav-menu'; d.setAttribute('aria-label', o.label || '菜单'); d.innerHTML = menuHtml(typeof items === 'function' ? items() : items, kind); return d; },
    onOpen: function (el) {
      var menu = $('.zh-nav-menu', el), sel = kind === 'menu' ? '[role=menuitem]' : 'a.zh-nav-mi';
      var rf = ZH.rovingFocus(menu, sel); rf.focusFirst();
      menu.addEventListener('keydown', function (e) { if (e.key === 'Tab') api.close(); if (o.onKey) o.onKey(e, api); });
      menu.addEventListener('click', function (e) {
        var b = e.target.closest('.zh-nav-mi'); if (!b) return; e.preventDefault();
        if (b.getAttribute('aria-disabled') === 'true') return;
        var list = typeof items === 'function' ? items() : items, act = list.filter(function (x) { return !x.type; })[+b.getAttribute('data-n')];
        api.close(); if (act && act.onSelect) act.onSelect(act); else if (act) ZH.toast((kind === 'menu' ? '已选择：' : '前往：') + act.label);
      });
    }
  });
  anchor.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' && !api.isOpen()) { e.preventDefault(); api.open(); } });
  return api;
}

// ---------- command palette (declared early: navbar uses it) ----------
var palette = (function () {
  var CMDS = [
    { id: 'overview', g: '页面', l: '概览', ico: 'layout-dashboard', kw: 'overview home dashboard 首页 工作台' },
    { id: 'content', g: '页面', l: '内容管理', ico: 'file-text', kw: 'content articles cms 文章' },
    { id: 'devices', g: '页面', l: '设备监控', ico: 'monitor', kw: 'devices monitor 设备 告警' },
    { id: 'users', g: '页面', l: '用户与权限', ico: 'users', kw: 'users roles permission 角色' },
    { id: 'reports', g: '页面', l: '数据报表', ico: 'chart-bar', kw: 'reports analytics 统计' },
    { id: 'settings', g: '页面', l: '系统设置', ico: 'settings', kw: 'settings preferences 偏好 配置' },
    { id: 'new', g: '操作', l: '新建文章', ico: 'file-plus', kw: 'new create article 创建 写', hint: 'N' },
    { id: 'export', g: '操作', l: '导出数据', ico: 'download', kw: 'export download csv 下载' },
    { id: 'invite', g: '操作', l: '邀请成员', ico: 'user-plus', kw: 'invite member 添加 用户' },
    { id: 'refresh', g: '操作', l: '刷新缓存', ico: 'refresh-cw', kw: 'refresh cache reload 清理' },
    { id: 'lang', g: '操作', l: '切换语言', ico: 'languages', kw: 'language locale english 语言' },
    { id: 'docs', g: '帮助', l: '查看文档', ico: 'book-open', kw: 'docs documentation help 帮助' },
    { id: 'keys', g: '帮助', l: '键盘快捷键', ico: 'keyboard', kw: 'shortcuts keyboard hotkeys 快捷' },
    { id: 'support', g: '帮助', l: '联系支持', ico: 'message-circle', kw: 'support contact chat 客服' }
  ];
  var byId = {}; CMDS.forEach(function (c) { byId[c.id] = c; });
  var recent = ['settings', 'devices'], flat = [], sel = 0, opener = null, closing = false;
  var dlg = document.createElement('dialog');
  dlg.className = 'zh-cmd'; dlg.setAttribute('aria-label', '命令面板');
  dlg.innerHTML = '<div class="zh-cmd-input"><i data-i="search" data-s="20"></i><input id="zhCmdInput" type="text" role="combobox" aria-expanded="true" aria-controls="zhCmdList" aria-autocomplete="list" aria-label="搜索页面与操作" placeholder="搜索页面与操作…" autocomplete="off" spellcheck="false"><span class="zh-kbd">Esc</span></div>' +
    '<div class="zh-cmd-list" id="zhCmdList" role="listbox" aria-label="搜索结果"></div><div class="zh-cmd-empty" hidden>没有找到相关结果<div class="zh-hint" style="margin-top:4px">试试「设置」「导出」或「docs」</div></div>' +
    '<div class="zh-cmd-foot"><span><span class="zh-kbd"><i data-i="arrow-up" data-s="12"></i></span><span class="zh-kbd"><i data-i="arrow-down" data-s="12"></i></span>选择</span><span><span class="zh-kbd"><i data-i="corner-down-left" data-s="12"></i></span>执行</span><span><span class="zh-kbd">Esc</span>关闭</span></div><div class="zh-nav-sr" role="status" aria-live="polite"></div>';
  document.body.appendChild(dlg);
  ZH.hydrateIcons(dlg);
  var input = $('input', dlg), list = $('.zh-cmd-list', dlg), empty = $('.zh-cmd-empty', dlg), live = $('[role=status]', dlg);

  function fuzzy(q, text) {
    var t = text.toLowerCase(), idx = [], score = 0, last = -2, ti = 0;
    for (var i = 0; i < q.length; i++) { var f = t.indexOf(q[i], ti); if (f < 0) return null; idx.push(f); score += (f === last + 1 ? 8 : 1) + (f === 0 ? 6 : 0); last = f; ti = f + 1; }
    return { score: score - (idx[idx.length - 1] - idx[0]) * 0.2, idx: idx };
  }
  function hl(text, idx) {
    var set = {}; (idx || []).forEach(function (i) { set[i] = 1; });
    return text.split('').map(function (ch, i) { return set[i] ? '<mark>' + ZH.esc(ch) + '</mark>' : ZH.esc(ch); }).join('');
  }
  function build(q) {
    var groups = [];
    q = q.toLowerCase().replace(/\s+/g, '');
    if (!q) {
      var rc = recent.map(function (id) { return { c: byId[id], idx: null }; });
      if (rc.length) groups.push({ name: '最近', items: rc });
      ['页面', '操作', '帮助'].forEach(function (g) { groups.push({ name: g, items: CMDS.filter(function (c) { return c.g === g; }).map(function (c) { return { c: c, idx: null }; }) }); });
    } else {
      var hits = [];
      CMDS.forEach(function (c) {
        var m = fuzzy(q, c.l), k = m ? null : fuzzy(q, c.kw);
        if (m) hits.push({ c: c, idx: m.idx, s: m.score + 10 }); else if (k) hits.push({ c: c, idx: null, s: k.score });
      });
      hits.sort(function (a, b) { return b.s - a.s; });
      ['页面', '操作', '帮助'].forEach(function (g) { var it = hits.filter(function (h) { return h.c.g === g; }); if (it.length) groups.push({ name: g, items: it }); });
    }
    return groups;
  }
  function render() {
    var q = input.value, groups = build(q), n = 0, html = '';
    flat = [];
    groups.forEach(function (g, gi) {
      html += '<div role="group" aria-labelledby="zhCmdG' + gi + '"><div class="zh-cmd-gl" id="zhCmdG' + gi + '" role="presentation">' + g.name + '</div>';
      g.items.forEach(function (it) {
        var i = n++; flat.push(it.c);
        html += '<div class="zh-cmd-item" role="option" id="zhCmdO' + i + '" data-n="' + i + '" aria-selected="false"><i data-i="' + it.c.ico + '" data-s="18"></i><span>' + (it.idx ? hl(it.c.l, it.idx) : ZH.esc(it.c.l)) + '</span><span class="zh-cmd-hint">' + (it.c.hint ? '<span class="zh-kbd">' + it.c.hint + '</span>' : ZH.esc(it.c.g)) + '</span></div>';
      });
      html += '</div>';
    });
    list.innerHTML = html; ZH.hydrateIcons(list);
    empty.hidden = flat.length > 0; list.hidden = !flat.length;
    live.textContent = flat.length ? (q ? flat.length + ' 个结果' : '') : '没有找到相关结果';
    select(0);
  }
  function select(i) {
    if (!flat.length) { input.removeAttribute('aria-activedescendant'); return; }
    sel = (i + flat.length) % flat.length;
    $$('.zh-cmd-item', list).forEach(function (el, k) { el.setAttribute('aria-selected', String(k === sel)); });
    var cur = $('#zhCmdO' + sel, list); input.setAttribute('aria-activedescendant', 'zhCmdO' + sel);
    if (cur) { var top = cur.offsetTop - list.offsetTop, bot = top + cur.offsetHeight; if (top < list.scrollTop + 30) list.scrollTop = Math.max(0, top - 30); else if (bot > list.scrollTop + list.clientHeight) list.scrollTop = bot - list.clientHeight + 8; }
  }
  function open(from) {
    if (dlg.open) return;
    opener = from && from !== document.body ? from : document.activeElement;
    input.value = ''; dlg.showModal(); render(); input.focus();
  }
  function close() {
    if (!dlg.open || closing) return;
    var done = function () { closing = false; dlg.classList.remove('is-closing'); dlg.close(); if (opener && opener.focus && document.contains(opener)) opener.focus(); };
    if (ZH.reduced()) { done(); return; }
    closing = true; dlg.classList.add('is-closing'); setTimeout(done, 130);
  }
  function run(c) {
    if (!c) return;
    recent = [c.id].concat(recent.filter(function (x) { return x !== c.id; })).slice(0, 3);
    var msg = (c.g === '操作' ? '已执行：' : c.g === '页面' ? '已跳转：' : '已打开：') + c.l;
    close(); ZH.toast(msg); var last = $('#cmdLast'); if (last) last.textContent = msg;
  }
  input.addEventListener('input', render);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); select(sel + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); select(sel - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); run(flat[sel]); }
  });
  list.addEventListener('mousemove', function (e) { var it = e.target.closest('.zh-cmd-item'); if (it && +it.getAttribute('data-n') !== sel) select(+it.getAttribute('data-n')); });
  list.addEventListener('click', function (e) { var it = e.target.closest('.zh-cmd-item'); if (it) run(flat[+it.getAttribute('data-n')]); });
  dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
  dlg.addEventListener('mousedown', function (e) { if (e.target === dlg) close(); });
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') { e.preventDefault(); if (dlg.open) close(); else open(document.activeElement); }
  });
  $('#cmdOpen').addEventListener('click', function (e) { open(e.currentTarget); });
  return { open: open, close: close, el: dlg };
})();

// ---------- top navbar ----------
(function () {
  var frame = $('#navFrame'), wrap = $('#navLinkWrap'), ink = $('#navInk'), first = true;
  function moveInk() {
    var cur = $('a.zh-nav-link[aria-current="page"]', wrap);
    if (!cur || !wrap.offsetWidth) { ink.classList.remove('is-on'); return; }
    if (first) ink.style.transition = 'none';
    ink.style.setProperty('--ink-x', (cur.offsetLeft + 12) + 'px'); ink.style.setProperty('--ink-w', Math.max(0, cur.offsetWidth - 24) + 'px'); ink.classList.add('is-on');
    if (first) { void ink.offsetWidth; ink.style.transition = ''; first = false; }
  }
  watchSize(wrap, moveInk); moveInk(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInk);
  $$('a.zh-nav-link', wrap).forEach(function (a) {
    a.addEventListener('click', function () { $$('a.zh-nav-link', wrap).forEach(function (x) { x.removeAttribute('aria-current'); }); a.setAttribute('aria-current', 'page'); moveInk(); });
  });

  var PRODUCTS = [['layout-dashboard', '中控台', '设备与内容的统一管理入口'], ['chart-line', '数据分析', '实时看板与自助报表'], ['shield-check', '权限中心', '角色、审计与安全策略'], ['workflow', '工作流', '可视化编排审批与自动化'], ['bot', 'AI 助手', '用自然语言查询与操作'], ['database', '数据集成', '对接数据库与第三方服务']];
  function disclosure(btn, label, content) {
    var api = ZH.popover(btn, {
      role: 'group', z: 'dropdown', placement: 'bottom-start', offset: 8, content: content,
      onOpen: function (el) {
        el.setAttribute('aria-label', label);
        var body = $('.zh-pop-body', el), sel = 'a';
        var rf = ZH.rovingFocus(body, sel, { typeahead: false });
        body.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight') { e.preventDefault(); document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })); }
          else if (e.key === 'ArrowLeft') { e.preventDefault(); document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })); }
          else if (e.key === 'Tab') api.close();
        });
        body.addEventListener('click', function (e) { var a = e.target.closest('a'); if (!a) return; e.preventDefault(); api.close(); ZH.toast('前往：' + a.getAttribute('data-title')); });
      }
    });
    btn.addEventListener('keydown', function (e) {
      var go = function () { requestAnimationFrame(function () { var el = api.el; var a = el && $('a', el); if (a) a.focus(); }); };
      if (e.key === 'ArrowDown') { e.preventDefault(); if (!api.isOpen()) api.open(); go(); }
      else if (e.key === 'Tab' && !e.shiftKey && api.isOpen()) { e.preventDefault(); go(); }
    });
    return api;
  }
  disclosure($('#navProd'), '产品', function () {
    var d = document.createElement('div'); d.className = 'zh-nav-mega';
    d.innerHTML = PRODUCTS.map(function (p) { return '<a href="#" data-title="' + p[1] + '"><span class="zh-nav-mi-ico"><i data-i="' + p[0] + '" data-s="20"></i></span><span><b>' + p[1] + '</b><small>' + p[2] + '</small></span></a>'; }).join('') +
      '<div class="zh-nav-mega-foot"><span>查看全部产品与定价</span><a href="#" data-title="全部产品" style="display:inline-flex;gap:4px;padding:0;color:var(--zh-color-primary-text);font-weight:600">浏览<i data-i="arrow-right" data-s="16"></i></a></div>';
    return d;
  });
  disclosure($('#navRes'), '资源', function () {
    var d = document.createElement('div'); d.className = 'zh-nav-menu'; d.style.minWidth = '220px';
    d.innerHTML = [['book-open', '文档'], ['history', '更新日志'], ['messages-square', '社区'], ['activity', '服务状态']].map(function (r) { return '<a class="zh-nav-mi" href="#" data-title="' + r[1] + '"><i data-i="' + r[0] + '" data-s="18"></i><span>' + r[1] + '</span></a>'; }).join('');
    return d;
  });
  openMenu($('#navUser'), [
    { type: 'head', title: '赵伟', sub: 'name@example.com' }, { type: 'sep' },
    { label: '个人资料', icon: 'user' }, { label: '账户设置', icon: 'settings' }, { label: '键盘快捷键', icon: 'keyboard', kbd: '?' },
    { type: 'sep' }, { label: '退出登录', icon: 'log-out', danger: true }
  ], { label: '账户菜单', placement: 'bottom-end' });

  // phone drawer
  var drawer = $('#navDrawer'), burger = $('#navBurger'), panel = $('#navPanel'), release = null, dsub = $('#navDsub');
  dsub.firstElementChild.inert = true;
  function onDrawerKey(e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeDrawer(); } }
  panel.tabIndex = -1;
  function openDrawer() {
    if (drawer.classList.contains('is-open')) return;
    document.addEventListener('keydown', onDrawerKey, true);
    drawer.classList.add('is-open'); drawer.setAttribute('aria-hidden', 'false'); burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', '关闭导航菜单');
    release = ZH.trapFocus(panel); $('#navDClose').focus();
  }
  function closeDrawer() {
    if (!drawer.classList.contains('is-open')) return;
    document.removeEventListener('keydown', onDrawerKey, true);
    drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden', 'true'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', '打开导航菜单');
    if (release) { release(); release = null; } burger.focus();
  }
  burger.addEventListener('click', function () { if (drawer.classList.contains('is-open')) closeDrawer(); else openDrawer(); });
  $('#navDClose').addEventListener('click', closeDrawer); $('#navMask').addEventListener('click', closeDrawer);
  // Safari does not focus a button on click and drops focus to <body>; keep it inside the drawer so Tab and Esc keep working.
  panel.addEventListener('mousedown', function (e) { if (!e.target.closest('a,button,input')) panel.focus(); });
  panel.addEventListener('click', function (e) {
    var b = e.target.closest('button.zh-nav-dl[aria-controls]');
    if (b) { b.focus(); var open = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', String(open)); dsub.classList.toggle('is-open', open); dsub.firstElementChild.inert = !open; return; }
    var a = e.target.closest('a.zh-nav-dl'); if (a) { a.focus(); $$('a.zh-nav-dl', panel).forEach(function (x) { x.removeAttribute('aria-current'); }); a.setAttribute('aria-current', 'page'); closeDrawer(); }
  });
  $('#navDSearch').addEventListener('click', function () { closeDrawer(); palette.open($('#navSearchIcon')); });
  $('#navSearch').addEventListener('click', function (e) { palette.open(e.currentTarget); });
  $('#navSearchIcon').addEventListener('click', function (e) { palette.open(e.currentTarget); });
  watchSize(frame, function () { if (getComputedStyle(burger).display === 'none') closeDrawer(); });
})();

// ---------- side menu ----------
(function () {
  var root = $('#sideNav'), scroll = $('#sideScroll'), toggle = $('#sideToggle'), demo = $('#sideDemo'), here = $('#sideHere'), note = $('#sideNote');
  var DATA = [
    { group: '工作台' },
    { id: 'overview', en: 'overview', label: '概览', icon: 'layout-dashboard' },
    { id: 'content', en: 'content', label: '内容管理', icon: 'file-text', children: [
      { id: 'articles', en: 'articles', label: '文章', badge: '12', soft: true }, { id: 'media', en: 'media', label: '媒体库' },
      { id: 'cats', en: 'categories', label: '分类与标签', children: [{ id: 'cat-a', en: 'category', label: '分类' }, { id: 'cat-b', en: 'tags', label: '标签' }] }] },
    { id: 'devices', en: 'devices', label: '设备监控', icon: 'monitor', badge: 'dot', children: [
      { id: 'd-list', en: 'list', label: '设备列表' }, { id: 'd-alert', en: 'alerts', label: '告警中心', badge: '3' }, { id: 'd-map', en: 'map', label: '分布地图', disabled: true }] },
    { group: '运营' },
    { id: 'users', en: 'users', label: '用户与权限', icon: 'users', children: [{ id: 'u-list', en: 'members', label: '成员' }, { id: 'u-role', en: 'roles', label: '角色' }] },
    { id: 'reports', en: 'reports', label: '数据报表', icon: 'chart-bar' },
    { id: 'orders', en: 'orders', label: '订单', icon: 'receipt', disabled: true },
    { group: '系统' },
    { id: 'settings', en: 'settings', label: '系统设置', icon: 'settings' }
  ];
  var byId = {}, parentOf = {}, open = { content: true }, activeId = 'articles', focusId = 'articles', collapsed = false, forced = false, saved = false;
  (function idx(list, parent) { list.forEach(function (n) { if (n.group) return; byId[n.id] = n; parentOf[n.id] = parent; if (n.children) idx(n.children, n.id); }); })(DATA, null);
  function labels(id) { var r = []; while (id) { r.unshift(byId[id].label); id = parentOf[id]; } return r; }
  function containsActive(n) { return (n.children || []).some(function (c) { return c.id === activeId || containsActive(c); }); }

  function itemHtml(n, level) {
    var kids = n.children && n.children.length, isOpen = !!open[n.id];
    var badge = n.badge ? '<span class="zh-side-badge' + (n.badge === 'dot' ? ' zh-side-badge--dot' : n.soft ? ' zh-side-badge--soft' : '') + '">' + (n.badge === 'dot' ? '' : n.badge) + '</span>' : '';
    return '<li role="none"><a role="treeitem" class="zh-side-item" href="#" data-id="' + n.id + '" data-ta="' + n.en + '" aria-level="' + level + '"' + (kids ? ' aria-expanded="' + isOpen + '" aria-owns="side-g-' + n.id + '"' : '') + (n.disabled ? ' aria-disabled="true"' : '') + ' tabindex="-1">' +
      (n.icon ? '<i data-i="' + n.icon + '"></i>' : '') + '<span class="zh-side-label">' + ZH.esc(n.label) + '</span>' + badge + (kids ? '<i class="zh-side-caret" data-i="chevron-right" data-s="16"></i>' : '') + '</a>' +
      (kids ? '<div class="zh-side-sub' + (isOpen ? ' is-open' : '') + '"' + (isOpen ? '' : ' inert') + '><ul role="group" id="side-g-' + n.id + '">' + n.children.map(function (c) { return itemHtml(c, level + 1); }).join('') + '</ul></div>' : '') + '</li>';
  }
  scroll.innerHTML = '<ul role="tree" aria-label="站点导航">' + DATA.map(function (n) { return n.group ? '<li role="presentation" class="zh-side-group">' + n.group + '</li>' : itemHtml(n, 1); }).join('') + '</ul>';
  ZH.hydrateIcons(scroll);
  var el = function (id) { return $('[data-id="' + id + '"]', scroll); };
  var treeitems = function () { return $$('[role=treeitem]', scroll); };

  function syncActive() {
    treeitems().forEach(function (a) {
      var id = a.getAttribute('data-id'), n = byId[id];
      if (id === activeId) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      a.classList.toggle('has-active', !!(n.children && containsActive(n)));
    });
    here.textContent = labels(activeId).join(' / ');
  }
  function setRoving(a, focus) {
    treeitems().forEach(function (x) { x.tabIndex = -1; }); a.tabIndex = 0; focusId = a.getAttribute('data-id'); if (focus !== false) a.focus();
  }
  function setOpen(id, val) {
    open[id] = val; var a = el(id), sub = a.nextElementSibling;
    a.setAttribute('aria-expanded', String(collapsed ? false : val)); sub.classList.toggle('is-open', val); sub.inert = !val;
  }
  function visible() {
    return treeitems().filter(function (a) {
      if (collapsed && +a.getAttribute('aria-level') > 1) return false;
      var sub = a.closest('.zh-side-sub');
      while (sub) { if (!sub.classList.contains('is-open')) return false; sub = sub.parentElement.closest('.zh-side-sub'); }
      return true;
    });
  }
  function activate(id) { if (byId[id].disabled) return; activeId = id; syncActive(); closeFly(); }

  // collapsed rail: tooltips + flyout submenus
  var tips = {}, fly = null, flyFor = null, hoverT = null;
  function enableTips() {
    $$('[role=treeitem][aria-level="1"]', scroll).forEach(function (a) {
      var id = a.getAttribute('data-id'); if (byId[id].children || tips[id]) return;
      tips[id] = ZH.popover(a, { trigger: 'hover', role: 'tooltip', z: 'tooltip', placement: 'right', arrow: true, offset: 10, hoverDelay: [200, 60], content: byId[id].label });
    });
  }
  function disableTips() { Object.keys(tips).forEach(function (id) { tips[id].destroy(); el(id).removeAttribute('aria-describedby'); delete tips[id]; }); }
  function flat(n, lvl, out) { (n.children || []).forEach(function (c) { out.push({ id: c.id, label: c.label, indent: lvl > 0, disabled: c.disabled, current: c.id === activeId, isGroup: !!c.children }); if (c.children) flat(c, lvl + 1, out); }); return out; }
  function openFly(a, focusFirst) {
    var id = a.getAttribute('data-id');
    if (fly && flyFor === id) { if (focusFirst) { var f = $('a.zh-nav-mi', fly.el); if (f) f.focus(); } return; }
    closeFly();
    var node = byId[id], items = flat(node, 0, []).filter(function (x) { return !x.isGroup || true; });
    flyFor = id;
    fly = ZH.popover(a, {
      trigger: 'manual', role: 'group', z: 'dropdown', placement: 'right-start', offset: 10,
      content: function () {
        var d = document.createElement('div'); d.className = 'zh-nav-menu'; d.setAttribute('aria-label', node.label);
        d.innerHTML = '<div class="zh-nav-mgroup" role="presentation">' + ZH.esc(node.label) + '</div>' + items.map(function (x) { return '<a class="zh-nav-mi" href="#" tabindex="-1" data-id="' + x.id + '"' + (x.disabled ? ' aria-disabled="true"' : '') + (x.current ? ' aria-current="page"' : '') + (x.indent ? ' style="padding-left:28px"' : '') + '><span>' + ZH.esc(x.label) + '</span></a>'; }).join('');
        return d;
      },
      onOpen: function (pop) {
        a.setAttribute('aria-expanded', 'true');
        var menu = $('.zh-nav-menu', pop), rf = ZH.rovingFocus(menu, 'a.zh-nav-mi', { typeahead: false });
        if (focusFirst) rf.focusFirst();
        menu.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowLeft') { e.preventDefault(); closeFly(true); }
          else if (e.key === 'Tab') closeFly(true);
        });
        menu.addEventListener('click', function (e) {
          var x = e.target.closest('a.zh-nav-mi'); if (!x) return; e.preventDefault();
          if (x.getAttribute('aria-disabled') === 'true') return; var t = x.getAttribute('data-id'); closeFly(true); activate(t);
        });
        pop.addEventListener('mouseenter', function () { clearTimeout(hoverT); }); pop.addEventListener('mouseleave', leaveFly);
      },
      onClose: function () { a.setAttribute('aria-expanded', 'false'); }
    });
    fly.open();
  }
  function closeFly(restore) {
    clearTimeout(hoverT);
    if (!fly) return; var f = fly, a = el(flyFor); fly = null; flyFor = null;
    if (restore) f.close(); else { f.destroy(); if (a) a.setAttribute('aria-expanded', 'false'); }
    if (restore && a) a.focus();
  }
  function leaveFly() { clearTimeout(hoverT); hoverT = setTimeout(function () { if (fly && !(fly.el && fly.el.contains(document.activeElement)) && document.activeElement !== el(flyFor)) closeFly(); }, 200); }

  scroll.addEventListener('mouseover', function (e) {
    if (!collapsed) return; var a = e.target.closest('[role=treeitem]'); if (!a) return;
    var n = byId[a.getAttribute('data-id')];
    if (n.children) { clearTimeout(hoverT); hoverT = setTimeout(function () { openFly(a, false); }, 120); }
    else if (fly) { leaveFly(); }
  });
  scroll.addEventListener('mouseout', function (e) { if (collapsed && e.target.closest('[role=treeitem]') && byId[e.target.closest('[role=treeitem]').getAttribute('data-id')].children) leaveFly(); });

  scroll.addEventListener('click', function (e) {
    var a = e.target.closest('[role=treeitem]'); if (!a) return; e.preventDefault();
    var id = a.getAttribute('data-id'), n = byId[id]; setRoving(a);
    if (n.disabled) return;
    if (n.children) { if (collapsed) openFly(a, true); else setOpen(id, !open[id]); } else activate(id);
  });
  var buf = '', bt;
  scroll.addEventListener('keydown', function (e) {
    var a = e.target.closest('[role=treeitem]'); if (!a) return;
    var list = visible(), i = list.indexOf(a), id = a.getAttribute('data-id'), n = byId[id], kids = !!n.children;
    if (e.key === 'ArrowDown') { e.preventDefault(); setRoving(list[Math.min(i + 1, list.length - 1)]); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setRoving(list[Math.max(i - 1, 0)]); }
    else if (e.key === 'Home') { e.preventDefault(); setRoving(list[0]); }
    else if (e.key === 'End') { e.preventDefault(); setRoving(list[list.length - 1]); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); if (kids) { if (collapsed) openFly(a, true); else if (!open[id]) setOpen(id, true); else setRoving(el(n.children[0].id)); } }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); if (kids && open[id] && !collapsed) setOpen(id, false); else if (parentOf[id]) setRoving(el(parentOf[id])); }
    else if (e.key === ' ') { e.preventDefault(); a.click(); }
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      buf += e.key.toLowerCase(); clearTimeout(bt); bt = setTimeout(function () { buf = ''; }, 600);
      var hit = list.filter(function (x) { return x.getAttribute('data-ta').indexOf(buf) === 0 || byId[x.getAttribute('data-id')].label.indexOf(buf) === 0; })[0];
      if (hit) setRoving(hit);
    }
  });

  function setCollapsed(v) {
    collapsed = v; closeFly(); disableTips();
    root.classList.toggle('is-collapsed', v);
    toggle.setAttribute('aria-expanded', String(!v));
    var label = $('.zh-side-label', toggle), ico = $('use', toggle);
    label.textContent = v ? '展开侧栏' : '折叠侧栏';
    ico.setAttribute('href', '#zi-' + (v ? 'panel-left-open' : 'panel-left-close')); ico.setAttribute('xlink:href', '#zi-' + (v ? 'panel-left-open' : 'panel-left-close'));
    toggle.setAttribute('aria-label', v ? '展开侧栏' : '折叠侧栏');
    Object.keys(open).forEach(function (id) { var a = el(id); if (a) a.setAttribute('aria-expanded', String(v ? false : open[id])); });
    $$('[role=treeitem][aria-expanded]', scroll).forEach(function (a) { if (v) a.setAttribute('aria-expanded', 'false'); else a.setAttribute('aria-expanded', String(!!open[a.getAttribute('data-id')])); });
    if (v) enableTips();
    // keep the roving item visible
    if (!visible().some(function (x) { return x.getAttribute('data-id') === focusId; })) setRoving(el(parentOf[focusId] || 'overview'), false);
  }
  toggle.addEventListener('click', function () { if (forced) return; setCollapsed(!collapsed); });
  function fit() {
    var narrow = demo.clientWidth < 560;
    if (narrow && !forced) { forced = true; saved = collapsed; setCollapsed(true); toggle.setAttribute('aria-disabled', 'true'); note.textContent = '宽度不足 560px：侧栏固定为图标栏。手机上更常见的做法是底部 Tab（见「应用骨架」）。'; }
    else if (!narrow && forced) { forced = false; setCollapsed(saved); toggle.removeAttribute('aria-disabled'); note.textContent = ''; }
  }
  watchSize(demo, fit);
  syncActive(); setRoving(el(focusId), false); fit();
})();

// ---------- tabs ----------
(function () {
  var TEXT = '这是「{t}」的内容区域。标签页只负责切换视图，不要在切换时丢失用户已填写的数据。';
  var CFG = {
    line: { variant: 'line', label: '概览分区', tabs: [{ label: '概览' }, { label: '成员', count: 12 }, { label: '设置' }, { label: '日志', count: '99+' }] },
    pill: { variant: 'pill', label: '视图', tabs: [{ label: '概览', icon: 'layout-grid' }, { label: '趋势', icon: 'chart-line' }, { label: '用户', icon: 'users' }, { label: '设置', icon: 'settings' }] },
    card: { variant: 'card', label: '工作区', closable: true, addable: true, max: 12, tabs: ['首页', '文章管理', '用户列表', '订单详情 #20260928', '系统设置', '设备监控', '数据报表', '操作日志'].map(function (l) { return { label: l }; }) },
    'seg-sm': { variant: 'segmented', size: 'sm', activation: 'manual', panels: false, caption: '手动激活 · 当前：', label: '时间范围（手动激活）', tabs: [{ label: '日' }, { label: '周' }, { label: '月' }, { label: '年' }] },
    'seg-md': { variant: 'segmented', panels: false, caption: '当前：', label: '布局', tabs: [{ label: '列表', icon: 'list' }, { label: '网格', icon: 'layout-grid' }, { label: '看板', icon: 'columns-2' }] },
    'seg-lg': { variant: 'segmented', size: 'lg', panels: false, caption: '当前：', label: '受众', tabs: [{ label: 'B 端' }, { label: 'C 端' }, { label: '中控' }] },
    vertical: { variant: 'vertical', label: '设置分类', tabs: [{ label: '个人资料', icon: 'user' }, { label: '安全', icon: 'shield-check' }, { label: '通知', icon: 'bell' }, { label: '外观', icon: 'palette' }] },
    header: { variant: 'line', label: '设备分区', panels: false, tabs: [{ label: '概览' }, { label: '监控' }, { label: '配置' }, { label: '日志', count: 8 }] },
    compact: { variant: 'line', label: '设备分区（紧凑）', panels: false, tabs: [{ label: '概览' }, { label: '监控' }, { label: '配置' }] }
  };

  function Tabs(host, cfg) {
    var uid = ZH.uid('tb'), vertical = cfg.variant === 'vertical', n = 0, tabs = [], selId = null, first = true;
    cfg = Object.assign({ activation: 'auto', panels: true, closable: false, addable: false, max: 12, size: 'md' }, cfg);
    cfg.tabs.forEach(function (t) { tabs.push({ id: uid + '-' + (++n), label: t.label, icon: t.icon, count: t.count }); });
    var inkOn = cfg.variant !== 'card';
    var tablist = '<div class="zh-tabs zh-tabs--' + cfg.variant + (inkOn ? ' zh-tabs--ink' : '') + (cfg.size !== 'md' ? ' zh-tabs--' + cfg.size : '') + '" role="tablist" aria-label="' + ZH.esc(cfg.label) + '"' + (vertical ? ' aria-orientation="vertical"' : '') + '>' + (inkOn ? '<span class="zh-tabs-ink" aria-hidden="true"></span>' : '') + '</div>';
    var addBtn = cfg.addable ? '<button class="zh-tabs-add" type="button" aria-label="添加标签页"><i data-i="plus" data-s="16"></i></button>' : '';
    var arrow = function (dir) { return '<button class="zh-tabs-arrow zh-tabs-arrow--' + dir + '" type="button" tabindex="-1" aria-hidden="true"><i data-i="chevron-' + (dir === 'start' ? 'left' : 'right') + '" data-s="16"></i></button>'; };
    host.innerHTML = (vertical
      ? '<div class="zh-tabs-vwrap"><div class="zh-tabs-wrap is-vertical">' + tablist + '</div><div class="zh-tabs-panels"></div></div>'
      : '<div class="zh-tabs-wrap"><div class="zh-tabs-scroll">' + arrow('start') + tablist + arrow('end') + '</div>' + addBtn + '</div>' + (cfg.panels ? '<div class="zh-tabs-panels"></div>' : '')) +
      (cfg.caption ? '<div class="zh-hint" style="margin:8px 0 0"><span class="zh-tabs-cap">' + cfg.caption + '</span><b></b></div>' : '') + '<div class="zh-nav-sr" role="status" aria-live="polite"></div>';
    var wrap = $('.zh-tabs-scroll', host) || $('.zh-tabs-wrap', host), list = $('.zh-tabs', host), ink = $('.zh-tabs-ink', host), panels = $('.zh-tabs-panels', host), live = $('[role=status]', host), add = $('.zh-tabs-add', host), cap = $('.zh-tabs-cap + b', host);
    var els = function () { return $$('[role=tab]', list); };
    var tabEl = function (id) { return document.getElementById(id); };

    function tabHtml(t) {
      return '<button type="button" role="tab" id="' + t.id + '" aria-selected="false" tabindex="-1"' + (cfg.panels ? ' aria-controls="p-' + t.id + '"' : '') + (cfg.closable ? ' aria-keyshortcuts="Delete"' : '') + '>' +
        (t.icon ? '<i data-i="' + t.icon + '"></i>' : '') + '<span>' + ZH.esc(t.label) + '</span>' + (t.count != null ? '<span class="zh-tabs-count">' + t.count + '</span>' : '') + (cfg.closable ? '<span class="zh-tabs-x" aria-hidden="true" title="关闭"><i data-i="x"></i></span>' : '') + '</button>';
    }
    function panelHtml(t) { return '<div role="tabpanel" class="zh-tabpanel" id="p-' + t.id + '" aria-labelledby="' + t.id + '" tabindex="0" hidden><h4>' + ZH.esc(t.label) + '</h4><p>' + ZH.esc(TEXT.replace('{t}', t.label)) + '</p></div>'; }
    tabs.forEach(function (t) { list.insertAdjacentHTML('beforeend', tabHtml(t)); if (cfg.panels) panels.insertAdjacentHTML('beforeend', panelHtml(t)); });
    ZH.hydrateIcons(host);

    function moveInk() {
      if (!ink) return; var s = tabEl(selId);
      if (!s || !s.offsetWidth) { list.classList.remove('is-ink'); return; }
      if (first) ink.style.transition = 'none';
      if (vertical) { ink.style.setProperty('--ink-y', s.offsetTop + 'px'); ink.style.setProperty('--ink-h', s.offsetHeight + 'px'); }
      else if (cfg.variant === 'line') { ink.style.setProperty('--ink-x', (s.offsetLeft + 12) + 'px'); ink.style.setProperty('--ink-w', Math.max(0, s.offsetWidth - 24) + 'px'); }
      else { ink.style.setProperty('--ink-x', s.offsetLeft + 'px'); ink.style.setProperty('--ink-y', s.offsetTop + 'px'); ink.style.setProperty('--ink-w', s.offsetWidth + 'px'); ink.style.setProperty('--ink-h', s.offsetHeight + 'px'); }
      list.classList.add('is-ink');
      if (first) { void ink.offsetWidth; ink.style.transition = ''; first = false; }
    }
    function overflow() {
      if (vertical) return; var sl = list.scrollLeft;
      if (sl > 1) wrap.setAttribute('data-start', ''); else wrap.removeAttribute('data-start');
      if (sl + list.clientWidth < list.scrollWidth - 1) wrap.setAttribute('data-end', ''); else wrap.removeAttribute('data-end');
    }
    function reveal(t) {
      if (vertical) return; var l = t.offsetLeft, r = l + t.offsetWidth, m = 40;
      if (l < list.scrollLeft + m) list.scrollTo({ left: Math.max(0, l - m), behavior: smooth() });
      else if (r > list.scrollLeft + list.clientWidth - m) list.scrollTo({ left: r - list.clientWidth + m, behavior: smooth() });
    }
    function roving(t) { els().forEach(function (x) { x.tabIndex = -1; }); t.tabIndex = 0; }
    function select(id, focus) {
      selId = id;
      tabs.forEach(function (x) {
        var e = tabEl(x.id); if (!e) return; var on = x.id === id;
        e.setAttribute('aria-selected', String(on)); if (cfg.activation === 'auto' || on) e.tabIndex = on ? 0 : -1;
        var p = document.getElementById('p-' + x.id); if (p) p.hidden = !on;
      });
      var t = tabEl(id); if (!t) return;
      if (cfg.activation === 'manual') roving(t);
      if (focus) t.focus(); reveal(t); moveInk();
      if (cap) cap.textContent = tabs.filter(function (x) { return x.id === id; })[0].label;
      host.dispatchEvent(new CustomEvent('zh-tab-change', { detail: { id: id } }));
    }
    function remove(id, viaKey) {
      var i = tabs.findIndex(function (x) { return x.id === id; }); if (i < 0) return; var gone = tabs[i];
      tabs.splice(i, 1); var t = tabEl(id); if (t) t.remove(); var p = document.getElementById('p-' + id); if (p) p.remove();
      live.textContent = '已关闭标签「' + gone.label + '」';
      if (add) add.removeAttribute('aria-disabled');
      if (selId === id) { var nx = tabs[i] || tabs[i - 1]; if (nx) select(nx.id, viaKey); else selId = null; }
      else if (viaKey && selId) tabEl(selId).focus();
      if (!tabs.length) { moveInk(); if (panels) panels.innerHTML = '<div class="zh-tabpanel"><p>所有标签都已关闭。点击「+」新建。</p></div>'; }
      requestAnimationFrame(function () { overflow(); moveInk(); });
    }
    function addTab() {
      if (tabs.length >= cfg.max) return;
      var t = { id: uid + '-' + (++n), label: '新标签 ' + n }; tabs.push(t);
      if (panels && !cfg.panels) return;
      if (panels && panels.firstElementChild && !panels.firstElementChild.hasAttribute('role')) panels.innerHTML = '';
      list.insertAdjacentHTML('beforeend', tabHtml(t)); if (panels) panels.insertAdjacentHTML('beforeend', panelHtml(t)); ZH.hydrateIcons(list);
      select(t.id, true); live.textContent = '已新建标签「' + t.label + '」';
      if (tabs.length >= cfg.max) add.setAttribute('aria-disabled', 'true');
      requestAnimationFrame(function () { overflow(); reveal(tabEl(t.id)); });
    }

    list.addEventListener('click', function (e) {
      var t = e.target.closest('[role=tab]'); if (!t) return;
      if (e.target.closest('.zh-tabs-x')) { remove(t.id, false); return; }
      select(t.id, false);
    });
    list.addEventListener('keydown', function (e) {
      var t = e.target.closest('[role=tab]'); if (!t) return;
      var all = els(), i = all.indexOf(t), next = vertical ? 'ArrowDown' : 'ArrowRight', prev = vertical ? 'ArrowUp' : 'ArrowLeft', to = null;
      if (e.key === next) to = all[(i + 1) % all.length]; else if (e.key === prev) to = all[(i - 1 + all.length) % all.length];
      else if (e.key === 'Home') to = all[0]; else if (e.key === 'End') to = all[all.length - 1];
      else if ((e.key === 'Enter' || e.key === ' ') && cfg.activation === 'manual') { e.preventDefault(); select(t.id, false); return; }
      else if (e.key === 'Delete' && cfg.closable) { e.preventDefault(); remove(t.id, true); return; }
      if (to) { e.preventDefault(); if (cfg.activation === 'auto') select(to.id, true); else { roving(to); to.focus(); reveal(to); } }
    });
    if (add) add.addEventListener('click', function () { if (add.getAttribute('aria-disabled') !== 'true') addTab(); });
    var arrows = $$('.zh-tabs-arrow', host);
    arrows.forEach(function (b) { b.addEventListener('click', function () { list.scrollBy({ left: (b.classList.contains('zh-tabs-arrow--start') ? -1 : 1) * list.clientWidth * 0.6, behavior: smooth() }); }); });
    list.addEventListener('scroll', raf(overflow), { passive: true });
    watchSize(list, function () { overflow(); moveInk(); });
    select(tabs[cfg.selected || 0].id, false); overflow();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveInk(); overflow(); });
    return { select: select, host: host };
  }
  $$('[data-tabs]', sec).forEach(function (h) { Tabs(h, CFG[h.getAttribute('data-tabs')]); });
})();

// ---------- breadcrumb ----------
(function () {
  var PATHS = {
    slash: [{ l: '首页', ico: 'house' }, { l: '内容管理' }, { l: '文章' }, { l: '编辑「产品发布公告」' }],
    chevron: [{ l: '首页', ico: 'house' }, { l: '内容管理' }, { l: '专题活动' }, { l: '2026 秋季发布会' }, { l: '素材库' }, { l: '视频素材' }, { l: '开场短片（终版）.mp4' }]
  };
  function Bc(nav, path) {
    var ol = $('ol', nav), menu = null;
    function draw(c) {
      if (menu) { menu.destroy(); menu = null; }
      var html = '';
      path.forEach(function (it, i) {
        if (c && i >= 1 && i < 1 + c) { if (i === 1) html += '<li><button class="zh-bc-more" type="button" aria-label="显示隐藏的 ' + c + ' 级路径" aria-haspopup="menu" aria-expanded="false"><i data-i="ellipsis" data-s="16"></i></button></li>'; return; }
        var last = i === path.length - 1;
        html += '<li>' + (last ? '<span class="zh-bc-cur" aria-current="page" title="' + ZH.esc(it.l) + '">' + ZH.esc(it.l) + '</span>' : '<a href="#" data-idx="' + i + '">' + (it.ico ? '<i data-i="' + it.ico + '"></i>' : '') + ZH.esc(it.l) + '</a>') + '</li>';
      });
      ol.innerHTML = html; ZH.hydrateIcons(ol);
      if (c) {
        var hidden = path.slice(1, 1 + c).map(function (x) { return { label: x.l }; });
        menu = openMenu($('.zh-bc-more', ol), hidden, { kind: 'links', placement: 'bottom-start', label: '隐藏的路径' });
      }
    }
    function fit() {
      var c = 0, max = Math.max(0, path.length - 3); draw(0);
      var over = function () { var cur = $('.zh-bc-cur', ol); return ol.scrollWidth > ol.clientWidth + 1 || (cur && cur.scrollWidth > cur.clientWidth + 1); };
      while (over() && c < max) { c++; draw(c); }
    }
    nav.addEventListener('click', function (e) { var a = e.target.closest('a[data-idx]'); if (a) { e.preventDefault(); ZH.toast('前往：' + path[+a.getAttribute('data-idx')].l); } });
    watchSize(nav, fit); fit(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  }
  $$('.zh-bc[data-bc]', sec).forEach(function (n) { if (n.hasAttribute('data-static')) return; Bc(n, PATHS[n.getAttribute('data-bc')]); });
  $('#bcWidth').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    this.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    $('#bcBox').style.maxWidth = b.getAttribute('data-v');
  });
})();

// ---------- anchor / toc / back to top ----------
(function () {
  var scroll = $('#ancScroll'), listEl = $('#ancList'), ink = $('#ancInk'), bar = $('#ancBar'), top = $('#ancTop');
  var SECS = [
    ['简介', 0], ['安装', 0], ['快速开始', 0], ['主题定制', 0], ['品牌色', 1], ['暗色模式', 1], ['API 参考', 0], ['常见问题', 0]
  ];
  var P = ['ZhaoUI 把品牌色、间距、圆角和动效都做成设计令牌，一处修改，所有组件同步更新。', '每个组件都有键盘操作说明与读屏标注，默认满足 WCAG AA 对比度，不需要额外配置。', '文档中的示例都可以直接复制；示例里用到的颜色、尺寸全部来自令牌，不写死数值。'];
  var html = '', toc = '';
  SECS.forEach(function (s, i) {
    var id = 'anc-' + (i + 1);
    html += '<section class="zh-anchor-sec"><h' + (s[1] ? 5 : 4) + ' id="' + id + '" tabindex="-1" data-anc>' + s[0] + '</h' + (s[1] ? 5 : 4) + '><p>' + P[i % 3] + '</p><p>' + P[(i + 1) % 3] + '</p></section>';
    toc += '<li><a href="#' + id + '" data-target="' + id + '"' + (s[1] ? ' class="is-sub"' : '') + '>' + s[0] + '</a></li>';
  });
  scroll.insertAdjacentHTML('beforeend', html); listEl.innerHTML = toc;
  var heads = $$('[data-anc]', scroll), lock = false, activeId = '';
  function setActive(id) {
    if (id === activeId) return; activeId = id;
    $$('a', listEl).forEach(function (a) { if (a.getAttribute('data-target') === id) { a.setAttribute('aria-current', 'location'); ink.style.setProperty('--ink-y', a.offsetTop + 'px'); ink.style.setProperty('--ink-h', a.offsetHeight + 'px'); } else a.removeAttribute('aria-current'); });
  }
  function spy() {
    var t = scroll.scrollTop, y = t + 28, cur = heads[0];
    heads.forEach(function (h) { if (h.offsetTop <= y) cur = h; });
    if (t + scroll.clientHeight >= scroll.scrollHeight - 2) cur = heads[heads.length - 1];
    if (!lock) setActive(cur.id);
    var max = scroll.scrollHeight - scroll.clientHeight, p = max > 0 ? Math.min(1, t / max) : 0;
    bar.style.setProperty('--p', p); top.style.setProperty('--zh-ring', (p * 100).toFixed(1));
    var on = t > 180; top.classList.toggle('is-on', on); top.tabIndex = on ? 0 : -1;
  }
  scroll.addEventListener('scroll', raf(spy), { passive: true });
  listEl.addEventListener('click', function (e) {
    var a = e.target.closest('a'); if (!a) return; e.preventDefault();
    var h = document.getElementById(a.getAttribute('data-target')); lock = true; setActive(h.id);
    scroll.scrollTo({ top: Math.max(0, h.offsetTop - 12), behavior: smooth() });
    h.focus({ preventScroll: true });
    setTimeout(function () { lock = false; spy(); }, ZH.reduced() ? 0 : 750);
  });
  top.addEventListener('click', function () { scroll.scrollTo({ top: 0, behavior: smooth() }); scroll.focus({ preventScroll: true }); });
  watchSize(scroll, function () { activeId = ''; spy(); }); spy();
})();

// ---------- page header ----------
(function () {
  var frame = $('#phFrame');
  openMenu($('#phMore'), function () {
    var narrow = frame.clientWidth < 560, base = [{ label: '复制设备 ID', icon: 'copy' }, { label: '查看审计日志', icon: 'history' }];
    var sec2 = narrow ? [{ label: '重启', icon: 'refresh-cw' }, { label: '导出日志', icon: 'download' }] : [];
    return sec2.concat(base, [{ type: 'sep' }, { label: '删除设备', icon: 'trash-2', danger: true }]);
  }, { label: '更多操作', placement: 'bottom-end' });
})();
