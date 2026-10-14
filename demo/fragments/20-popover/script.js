var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
var secP = document.getElementById('popover'), secD = document.getElementById('dialogs');
ZH.hydrateIcons(secP); ZH.hydrateIcons(secD);
var esc = ZH.esc;

/* ---------- helpers ---------- */
var locks = 0;
function lock() { if (!locks++) document.documentElement.style.overflow = 'hidden'; }
function unlock() { if (!--locks) document.documentElement.style.overflow = ''; }
function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
var lastTrigger = null, lastClickAt = 0;
document.addEventListener('click', function (e) { lastTrigger = e.target.closest ? e.target.closest('button, a, input, select, textarea, [tabindex]') : null; lastClickAt = Date.now(); }, true);
// Safari does not move focus to a clicked button, so the element that opened an overlay is the last clicked one, not activeElement.
function currentOpener() {
  if (lastTrigger && Date.now() - lastClickAt < 800 && document.contains(lastTrigger)) return lastTrigger;
  var a = document.activeElement; return a && a !== document.body ? a : lastTrigger;
}
var TYPE_ICON = { info: 'info', success: 'circle-check', warning: 'triangle-alert', error: 'circle-x' };

/* ---------- Tooltip ---------- */
$$('[data-zh-tt]', secP).forEach(function (a) {
  var api = ZH.popover(a, {
    content: '<span>' + esc(a.getAttribute('data-zh-tt')) + '</span>', trigger: 'hover', z: 'tooltip', role: 'tooltip', arrow: true, offset: 8,
    placement: a.getAttribute('data-zh-tt-placement') || 'top',
    hoverDelay: [parseInt(a.getAttribute('data-zh-tt-delay') || '80', 10), 120]
  });
  if (a.hasAttribute('data-zh-tt-visual')) a.removeAttribute('aria-describedby');
});
ZH.popover($('[data-zh-tt-rich]', secP), {
  trigger: 'hover', z: 'tooltip', role: 'tooltip', arrow: true, offset: 8, placement: 'bottom',
  content: '<div class="zh-tt-rich"><div class="zh-tt-row"><strong>保存草稿</strong><span class="zh-tt-key">Ctrl S</span></div><span>内容会同步到云端，换设备也能继续编辑</span></div>'
});

/* ---------- Popover ---------- */
var pvBtn = $('#zhPvDemo'), pvSel = $('#zhPvPlace'), pvTrig = 'click', pv = null;
function buildPv() {
  if (pv) pv.destroy();
  pv = ZH.popover(pvBtn, {
    trigger: pvTrig, placement: pvSel.value, arrow: true, offset: 10, z: 'popover', role: 'dialog',
    content: function (api) {
      var d = el('div', 'zh-pv', '<p class="zh-pv-title">位置与触发</p><p class="zh-pv-text">当前位置 <code>' + esc(pvSel.value) + '</code>，触发方式：' + (pvTrig === 'click' ? '点击' : '悬停') + '。空间不足时会自动翻转，并贴边避让。</p>' +
        (pvTrig === 'click' ? '<div class="zh-pv-actions"><button class="zh-btn sm primary" data-a="ok">知道了</button></div>' : ''));
      d.addEventListener('click', function (e) { if (e.target.closest('[data-a="ok"]')) api.close(); });
      return d;
    },
    onOpen: function (node) { if (pvTrig === 'click') { var b = node.querySelector('button'); if (b) b.focus(); } }
  });
}
buildPv();
pvSel.addEventListener('change', function () { buildPv(); if (pvTrig === 'click') pv.open(); });
$('#zhPvTrigger').addEventListener('click', function (e) {
  var b = e.target.closest('button'); if (!b) return;
  pvTrig = b.getAttribute('data-v');
  $$('button', this).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
  buildPv();
});

ZH.popover($('#zhPvInvite'), {
  placement: 'bottom-start', arrow: true, offset: 10, trapFocus: true, role: 'dialog',
  content: function (api) {
    var fid = ZH.uid('zhpv'), d = el('div', 'zh-pv',
      '<p class="zh-pv-title">邀请成员</p><p class="zh-pv-text">输入邮箱，对方会收到邀请链接。</p>' +
      '<div class="zh-field" style="margin-top:12px"><label for="' + fid + '">邮箱</label><input id="' + fid + '" class="zh-input" type="email" placeholder="name@company.com" aria-describedby="' + fid + '-e">' +
      '<span class="zh-hint err" id="' + fid + '-e" style="display:none">请输入正确的邮箱地址</span></div>' +
      '<div class="zh-pv-actions"><button class="zh-btn sm" data-a="cancel">取消</button><button class="zh-btn sm primary" data-a="ok">发送邀请</button></div>');
    var input = d.querySelector('input'), err = d.querySelector('.err');
    function submit() {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) { input.setAttribute('aria-invalid', 'true'); err.style.display = 'block'; input.focus(); return; }
      api.close(); ZH.toast('已向 ' + input.value + ' 发送邀请');
    }
    d.addEventListener('click', function (e) { var b = e.target.closest('[data-a]'); if (!b) return; if (b.getAttribute('data-a') === 'cancel') api.close(); else submit(); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
    input.addEventListener('input', function () { input.removeAttribute('aria-invalid'); err.style.display = 'none'; });
    return d;
  }
});
ZH.popover($('#zhPvUser'), {
  trigger: 'hover', placement: 'bottom-start', arrow: true, offset: 10, hoverDelay: [150, 200], role: 'dialog',
  content: '<div class="zh-pv"><div class="zh-pv-user"><span class="zh-pv-avatar" aria-hidden="true">LM</span><div><p class="zh-pv-title" style="margin:0">李明</p><p class="zh-pv-text">产品设计 · 上海</p></div></div>' +
    '<div class="zh-pv-stats"><div><b>128</b><span>发布</span></div><div><b>3.2k</b><span>阅读</span></div><div><b>46</b><span>关注</span></div></div></div>'
});

/* ---------- Popconfirm ---------- */
var pcResult = $('#zhPcResult');
function say(t) { pcResult.textContent = t; }
function popconfirm(anchor, o) {
  o = Object.assign({ title: '', desc: '', okText: '确定', cancelText: '取消', kind: 'warning', danger: false, placement: 'top' }, o);
  var loading = false, tid = ZH.uid('zhpc'), guardOff = null;
  function guard(e) {
    if (!loading) return;
    if (e.type === 'keydown') { if (e.key === 'Escape') e.stopPropagation(); return; }
    var pop = document.getElementById(anchor.getAttribute('aria-controls'));
    if (!pop || !pop.contains(e.target)) e.stopPropagation();
  }
  var api = ZH.popover(anchor, {
    placement: o.placement, arrow: true, offset: 10, role: 'dialog', className: 'zh-pc', trapFocus: true,
    content: function (a) {
      var d = el('div', null,
        '<div class="zh-pc-body"><span class="zh-pc-ico ' + (o.danger ? 'danger' : o.kind) + '">' + ZH.iconHtml(o.kind === 'info' ? 'circle-help' : 'triangle-alert', 20) + '</span>' +
        '<div><p class="zh-pc-title" id="' + tid + '">' + esc(o.title) + '</p>' + (o.desc ? '<p class="zh-pc-desc">' + esc(o.desc) + '</p>' : '') + '</div></div>' +
        '<div class="zh-pc-foot"><button class="zh-btn sm" data-a="cancel">' + esc(o.cancelText) + '</button>' +
        '<button class="zh-btn sm primary' + (o.danger ? ' zh-pc-danger' : '') + '" data-a="ok">' + esc(o.okText) + '</button></div>');
      d.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') return;
        e.preventDefault(); e.stopPropagation();
        var bs = [].slice.call(d.querySelectorAll('button:not([disabled])')); if (!bs.length) return;
        var i = bs.indexOf(document.activeElement);
        bs[(i + (e.shiftKey ? -1 : 1) + bs.length) % bs.length].focus();
      });
      d.addEventListener('click', function (e) {
        var b = e.target.closest('[data-a]'); if (!b || loading) return;
        if (b.getAttribute('data-a') === 'cancel') { a.close(); say('已取消：' + o.title); return; }
        var r = o.onConfirm ? o.onConfirm() : null;
        if (r && r.then) {
          loading = true; b.setAttribute('aria-busy', 'true'); b.innerHTML = '<span class="spin" aria-hidden="true"></span>' + esc(o.okText);
          var cancel = d.querySelector('[data-a="cancel"]'); cancel.disabled = true;
          r.then(function () { loading = false; a.close(); }, function () { loading = false; b.removeAttribute('aria-busy'); b.textContent = o.okText; cancel.disabled = false; });
        } else a.close();
      });
      return d;
    },
    onOpen: function (node) {
      node.setAttribute('aria-labelledby', tid);
      ['keydown', 'mousedown', 'touchstart'].forEach(function (t) { window.addEventListener(t, guard, true); });
      guardOff = function () { ['keydown', 'mousedown', 'touchstart'].forEach(function (t) { window.removeEventListener(t, guard, true); }); };
    },
    onClose: function () { if (guardOff) guardOff(); guardOff = null; }
  });
  return api;
}
popconfirm($('#zhPcBasic'), { title: '删除这个文件？', desc: '删除后 30 天内可在回收站找回。', okText: '删除', onConfirm: function () { say('已删除文件'); ZH.toast('已删除'); } });
popconfirm($('#zhPcDanger'), { title: '永久删除？', desc: '此操作无法撤销，数据将被彻底清除。', okText: '永久删除', danger: true, onConfirm: function () { say('已永久删除'); } });
popconfirm($('#zhPcCustom'), { title: '下线这篇文章？', desc: '下线后读者将无法访问。', okText: '下线', cancelText: '再想想', kind: 'info', onConfirm: function () { say('文章已下线'); } });
popconfirm($('#zhPcAsync'), {
  title: '提交审核？', desc: '提交后无法修改，审核约需 1 个工作日。', okText: '提交', kind: 'info',
  onConfirm: function () { return new Promise(function (res) { setTimeout(function () { say('已提交审核'); ZH.toast('已提交审核'); res(); }, 1200); }); }
});
popconfirm($('#zhPcBottom'), { title: '重置全部设置？', okText: '重置', placement: 'bottom', onConfirm: function () { say('已重置'); } });

/* ---------- Modal ---------- */
function shake(dlg) { dlg.classList.remove('is-shaking'); void dlg.offsetWidth; dlg.classList.add('is-shaking'); setTimeout(function () { dlg.classList.remove('is-shaking'); }, 400); }
function modal(o) {
  o = Object.assign({ size: 'md', title: '', desc: '', body: '', footer: [{ text: '取消' }, { text: '确定', primary: true }], closable: true, mask: true, esc: true, kind: null, focus: null }, o);
  var opener = currentOpener(), dlg = el('dialog'), tid = ZH.uid('zhm'), did = ZH.uid('zhm'), closed = false, busyBtn = null;
  dlg.className = 'zh-modal zh-modal--svc zh-modal--' + o.size + (o.kind ? ' zh-modal--confirm' : '');
  dlg.setAttribute('role', o.kind ? 'alertdialog' : 'dialog');
  dlg.setAttribute('aria-labelledby', tid); dlg.setAttribute('aria-describedby', did);
  var html = '<div class="zh-modal-grab" aria-hidden="true"></div>';
  if (o.kind) html += '<div class="body"><div class="zh-cf"><span class="zh-cf-ico ' + o.kind + '">' + ZH.iconHtml(TYPE_ICON[o.kind], 22) + '</span><div><p class="zh-cf-title" id="' + tid + '">' + esc(o.title) + '</p><p class="zh-cf-desc" id="' + did + '">' + esc(o.desc) + '</p></div></div></div>';
  else html += '<header class="zh-modal-head"><span id="' + tid + '">' + esc(o.title) + '</span>' + (o.closable ? '<button type="button" class="zh-btn icon text sm" data-x aria-label="关闭">' + ZH.iconHtml('x') + '</button>' : '') + '</header><div class="body" id="' + did + '"></div>';
  html += '<footer></footer>';
  dlg.innerHTML = html;
  if (!o.kind) { var body = $('.body', dlg); if (typeof o.body === 'string') body.innerHTML = o.body; else body.appendChild(o.body); }

  var ctx = { dlg: dlg, busy: false, close: close, shake: function () { shake(dlg); } };
  ctx.setBusy = function (on, btn) {
    ctx.busy = on; busyBtn = on ? btn : null;
    $$('footer .zh-btn, [data-x]', dlg).forEach(function (b) {
      if (on) { b.disabled = true; if (b === btn) { b.setAttribute('aria-busy', 'true'); b.dataset.label = b.textContent; b.innerHTML = '<span class="spin" aria-hidden="true"></span>' + esc(b.dataset.label); } }
      else { b.disabled = false; if (b.hasAttribute('aria-busy')) { b.removeAttribute('aria-busy'); b.textContent = b.dataset.label; } }
    });
  };
  o.footer.forEach(function (b) {
    var n = el('button', 'zh-btn' + (b.danger ? ' primary zh-pc-danger' : b.primary ? ' primary' : ''), esc(b.text)); n.type = 'button';
    n.addEventListener('click', function () {
      if (ctx.busy) return;
      var r = b.onClick ? b.onClick(ctx) : undefined;
      if (r === false) return;
      if (r && r.then) { ctx.setBusy(true, n); r.then(function (v) { ctx.setBusy(false); if (v !== false) close(); }, function () { ctx.setBusy(false); }); }
      else close();
    });
    $('footer', dlg).appendChild(n);
  });

  function fin() {
    if (closed === 'done') return; closed = 'done';
    try { dlg.close(); } catch (e) { /* already closed */ }
    dlg.remove(); unlock();
    if (opener && opener.focus && document.contains(opener)) opener.focus();
    if (o.onClose) o.onClose();
  }
  function close() {
    if (closed) return; closed = true;
    dlg.classList.add('is-closing');
    if (ZH.reduced()) fin(); else { dlg.addEventListener('animationend', function (e) { if (e.target === dlg) fin(); }); setTimeout(fin, 320); }
  }
  dlg.addEventListener('cancel', function (e) { e.preventDefault(); if (ctx.busy || !o.esc) shake(dlg); else close(); });
  var downOut = false;
  function outside(e) { var r = dlg.getBoundingClientRect(); return e.target === dlg && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom); }
  dlg.addEventListener('mousedown', function (e) { downOut = outside(e); });
  dlg.addEventListener('click', function (e) {
    var x = e.target.closest('[data-x]'); if (x) { if (ctx.busy) shake(dlg); else close(); return; }
    if (downOut && outside(e)) { downOut = false; if (ctx.busy || !o.mask) shake(dlg); else close(); }
  });
  document.body.appendChild(dlg);
  lock();
  dlg.showModal();
  ZH.trapFocus(dlg);
  var fb = o.focus ? $(o.focus, dlg) : (o.kind ? $$('footer .zh-btn', dlg).pop() : null);
  if (fb) fb.focus();
  return ctx;
}

var LOREM = '这是一段用来撑出高度的示例文字，用来演示内容超出时，标题栏和操作栏固定不动，只有中间的内容区域滚动。';
var SIZE_TEXT = { sm: '360px，一句话加两个按钮的确认。', md: '520px，短表单、设置项，是最常用的尺寸。', lg: '720px，较复杂的内容，例如选择器或预览。', full: '整屏减 32px，用于编辑器和长流程。手机上铺满整个屏幕。' };
secD.addEventListener('click', function (e) {
  var b = e.target.closest('[data-zh-modal]'); if (b) return openModalDemo(b.getAttribute('data-zh-modal'));
  var c = e.target.closest('[data-zh-confirm]'); if (c) return openConfirm(c.getAttribute('data-zh-confirm'));
  var d = e.target.closest('[data-zh-drawer]'); if (d) return openDrawerDemo(d.getAttribute('data-zh-drawer'));
  var n = e.target.closest('[data-zh-notice]'); if (n) return noticeDemo(n.getAttribute('data-zh-notice'));
  var np = e.target.closest('[data-zh-notice-pos]'); if (np) return notify({ type: 'info', placement: np.getAttribute('data-zh-notice-pos'), title: '提示位置', desc: '这条通知出现在' + np.textContent + '角，5 秒后消失。' });
  var m = e.target.closest('[data-zh-msg]'); if (m) return messageDemo(m.getAttribute('data-zh-msg'));
});

function openModalDemo(kind) {
  if (['sm', 'md', 'lg', 'full'].indexOf(kind) >= 0) return modal({ size: kind, title: '尺寸 · ' + kind, body: '<p style="margin:0">' + SIZE_TEXT[kind] + '</p>' });
  if (kind === 'form') {
    var body = el('div', 'zh-modal-form', '<div class="zh-field"><label for="zhmfName">名称 <span class="t-danger" aria-hidden="true">*</span></label><input id="zhmfName" class="zh-input" placeholder="例如：中控系统" aria-describedby="zhmfNameE" required><span class="zh-hint err" id="zhmfNameE">请填写名称</span></div>' +
      '<div class="zh-field"><label for="zhmfType">类型</label><div class="zh-select"><select id="zhmfType"><option>内容管理</option><option>设备监控</option><option>数据报表</option></select></div></div>' +
      '<div class="zh-field"><label for="zhmfNote">备注</label><textarea id="zhmfNote" class="zh-textarea" placeholder="选填"></textarea></div>');
    var input = $('input', body);
    input.addEventListener('input', function () { input.removeAttribute('aria-invalid'); });
    return modal({ size: 'md', title: '新建项目', body: body, focus: '#zhmfName', footer: [{ text: '取消' }, { text: '保存', primary: true, onClick: function () {
      if (!input.value.trim()) { input.setAttribute('aria-invalid', 'true'); input.focus(); return false; }
      return new Promise(function (r) { setTimeout(function () { ZH.toast('已创建「' + input.value.trim() + '」'); r(); }, 900); });
    } }] });
  }
  if (kind === 'scroll') {
    var long = ''; for (var i = 1; i <= 24; i++) long += '<p>' + i + '. ' + LOREM + '</p>';
    return modal({ size: 'md', title: '用户协议', body: '<div class="zh-modal-long">' + long + '</div>', footer: [{ text: '不同意' }, { text: '同意并继续', primary: true }] });
  }
  if (kind === 'nested') {
    var nb = el('div', null, '<p style="margin:0 0 14px">需要二次确认时，可以在对话框上再叠一层。后打开的在最上面，Esc 一次只关一层。</p><button class="zh-btn" data-n>打开第二层</button>');
    nb.addEventListener('click', function (e) { if (e.target.closest('[data-n]')) modal({ size: 'sm', title: '第二层', body: '<p style="margin:0">关闭这一层后，焦点回到「打开第二层」按钮。</p>', footer: [{ text: '我知道了', primary: true }] }); });
    return modal({ size: 'md', title: '第一层', body: nb });
  }
  if (kind === 'loading') return modal({ size: 'sm', title: '提交订单', body: '<p style="margin:0">点击「提交」后按钮进入加载态，处理期间不能通过 Esc、遮罩或关闭按钮退出。</p>', footer: [{ text: '取消' }, { text: '提交', primary: true, onClick: function () { return new Promise(function (r) { setTimeout(function () { ZH.toast('订单已提交'); r(); }, 1600); }); } }] });
  if (kind === 'closable') {
    var mk = $('#zhMdMask').checked, es = $('#zhMdEsc').checked;
    return modal({ size: 'sm', title: '可关闭性', mask: mk, esc: es, body: '<p style="margin:0">点击遮罩：' + (mk ? '可关闭' : '不可关闭') + '；Esc：' + (es ? '可关闭' : '不可关闭') + '。被禁止时对话框会轻轻抖动提示。</p>', footer: [{ text: '关闭', primary: true }] });
  }
}
function openConfirm(kind) {
  var map = {
    info: { title: '有新版本可用', desc: '刷新页面即可使用最新版本。', footer: [{ text: '知道了', primary: true }] },
    success: { title: '发布成功', desc: '文章已发布，可以在前台查看。', footer: [{ text: '完成', primary: true }] },
    warning: { title: '离开此页面？', desc: '未保存的修改将会丢失。', footer: [{ text: '留在此页' }, { text: '离开', danger: true }] },
    error: { title: '提交失败', desc: '网络异常，请检查网络后重试。', footer: [{ text: '取消' }, { text: '重试', primary: true }] }
  }[kind];
  modal({ size: 'sm', kind: kind, title: map.title, desc: map.desc, footer: map.footer });
}

/* ---------- Drawer ---------- */
var dDepth = 0;
function drawer(o) {
  o = Object.assign({ placement: 'right', size: 'md', title: '', body: '', footer: null, mask: true, maskClosable: true, esc: true }, o);
  var opener = currentOpener(), depth = ++dDepth, tid = ZH.uid('zhd'), gone = false, mask = null;
  if (o.mask) { mask = el('div', 'zh-drawer-mask'); mask.style.zIndex = 'calc(var(--zh-z-drawer) + ' + (depth * 2 - 1) + ')'; document.body.appendChild(mask); }
  var d = el('aside', 'zh-drawer zh-drawer--svc zh-drawer--' + o.placement + ' zh-drawer--' + o.size,
    '<div class="zh-drawer-head"><div class="zh-drawer-title" id="' + tid + '">' + esc(o.title) + '</div><button type="button" class="zh-btn icon text sm" data-x aria-label="关闭">' + ZH.iconHtml('x') + '</button></div><div class="zh-drawer-body"></div>' + (o.footer ? '<div class="zh-drawer-foot"></div>' : ''));
  d.style.zIndex = 'calc(var(--zh-z-drawer) + ' + (depth * 2) + ')';
  d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', tid);
  var bd = $('.zh-drawer-body', d); if (typeof o.body === 'string') bd.innerHTML = o.body; else bd.appendChild(o.body);
  var api = { el: d, close: close };
  if (o.footer) o.footer.forEach(function (b) {
    var n = el('button', 'zh-btn' + (b.primary ? ' primary' : ''), esc(b.text)); n.type = 'button';
    n.addEventListener('click', function () { if (b.onClick && b.onClick(api) === false) return; close(); });
    $('.zh-drawer-foot', d).appendChild(n);
  });
  document.body.appendChild(d); lock();
  void d.offsetWidth;
  d.classList.add('open'); if (mask) mask.classList.add('is-open');
  var release = ZH.trapFocus(d);
  function close() {
    if (gone) return; gone = true;
    d.classList.remove('open'); if (mask) mask.classList.remove('is-open');
    release(); if (opener && opener.focus && document.contains(opener)) opener.focus(); dDepth--; unlock();
    setTimeout(function () { d.remove(); if (mask) mask.remove(); }, ZH.reduced() ? 0 : 320);
  }
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && o.esc) { e.stopPropagation(); close(); } });
  d.addEventListener('click', function (e) { if (e.target.closest('[data-x]')) close(); });
  if (mask) mask.addEventListener('click', function () { if (o.maskClosable) close(); else ZH.toast('此抽屉需点击关闭按钮'); });
  return api;
}
function openDrawerDemo(kind) {
  var text = '<p style="margin:0 0 12px">' + LOREM + '</p>';
  var long = ''; for (var i = 0; i < 14; i++) long += text;
  if (['right', 'left', 'top', 'bottom'].indexOf(kind) >= 0) return drawer({ placement: kind, title: '抽屉 · ' + ({ right: '右侧', left: '左侧', top: '顶部', bottom: '底部' }[kind]), body: long });
  if (kind === 'sm' || kind === 'lg') return drawer({ size: kind, title: '尺寸 · ' + kind, body: long });
  if (kind === 'footer') return drawer({ size: 'md', title: '编辑成员', body: '<div class="zh-modal-form"><div class="zh-field"><label for="zhdfN">姓名</label><input id="zhdfN" class="zh-input" value="李明"></div><div class="zh-field"><label for="zhdfR">角色</label><div class="zh-select"><select id="zhdfR"><option>管理员</option><option>编辑</option></select></div></div></div><div style="margin-top:24px">' + long + '</div>', footer: [{ text: '取消' }, { text: '保存', primary: true, onClick: function () { ZH.toast('已保存'); } }] });
  if (kind === 'nested') {
    var nb = el('div', null, '<p style="margin:0 0 14px">抽屉里还能再打开一层。后打开的在上层，Esc 一次关一层。</p><button class="zh-btn" data-n>再打开一层</button>');
    nb.addEventListener('click', function (e) { if (e.target.closest('[data-n]')) drawer({ size: 'sm', title: '第二层', body: '<p style="margin:0">关闭后焦点回到「再打开一层」。</p>' }); });
    return drawer({ size: 'lg', title: '第一层', body: nb });
  }
  if (kind === 'nomask') return drawer({ size: 'md', title: '不可点遮罩关闭', maskClosable: false, body: '<p style="margin:0">点击遮罩不会关闭，必须点右上角的关闭按钮或按 Esc。</p>' });
}

/* ---------- Notification ---------- */
var hosts = {}, NOTICE_MAX = 4;
function noticeHost(pos) {
  if (!hosts[pos]) { var h = el('div', 'zh-notice-host zh-notice-host--' + pos); h.setAttribute('role', 'region'); h.setAttribute('aria-label', '通知'); h.setAttribute('data-zh-float', ''); (document.querySelector('dialog[open]') || document.body).appendChild(h); hosts[pos] = h; }
  return hosts[pos];
}
function notify(o) {
  o = Object.assign({ type: 'info', title: '', desc: '', duration: 5000, placement: 'tr', actions: [] }, o);
  var host = noticeHost(o.placement);
  var live = [].slice.call(host.children).filter(function (n) { return !n.classList.contains('is-leaving'); });
  while (live.length >= NOTICE_MAX) live.pop().remove();
  var n = el('div', 'zh-notice zh-notice--' + o.type,
    '<span class="zh-notice-ico">' + ZH.iconHtml(TYPE_ICON[o.type], 18) + '</span><div class="zh-notice-main"><p class="zh-notice-title">' + esc(o.title) + '</p>' + (o.desc ? '<p class="zh-notice-desc">' + esc(o.desc) + '</p>' : '') +
    (o.actions.length ? '<div class="zh-notice-actions"></div>' : '') + '</div>' +
    '<button type="button" class="zh-notice-x" aria-label="关闭通知">' + ZH.iconHtml('x', 16) + '</button>' +
    (o.duration ? '<i class="zh-notice-bar" style="--zh-notice-dur:' + o.duration + 'ms"></i>' : ''));
  n.setAttribute('role', o.type === 'warning' || o.type === 'error' ? 'alert' : 'status');
  var timer = null, remaining = o.duration, started = 0, gone = false;
  function dismiss() {
    if (gone) return; gone = true; clearTimeout(timer);
    n.classList.add('is-leaving'); setTimeout(function () { n.remove(); }, ZH.reduced() ? 0 : 240);
  }
  function begin() { if (!o.duration || gone) return; started = Date.now(); timer = setTimeout(dismiss, remaining); }
  function pause() { if (timer) { clearTimeout(timer); timer = null; remaining -= Date.now() - started; n.classList.add('is-paused'); } }
  function resume() { if (!timer && o.duration && !gone) { n.classList.remove('is-paused'); begin(); } }
  o.actions.forEach(function (a) {
    var b = el('button', 'zh-btn sm' + (a.primary ? ' primary' : ''), esc(a.text)); b.type = 'button';
    b.addEventListener('click', function () { if (a.onClick) a.onClick(); dismiss(); });
    $('.zh-notice-actions', n).appendChild(b);
  });
  $('.zh-notice-x', n).addEventListener('click', dismiss);
  n.addEventListener('mouseenter', pause); n.addEventListener('mouseleave', resume);
  n.addEventListener('focusin', pause); n.addEventListener('focusout', function (e) { if (!n.contains(e.relatedTarget)) resume(); });
  host.insertBefore(n, host.firstChild);
  begin();
  return { close: dismiss, el: n };
}
var stackN = 0;
function noticeDemo(kind) {
  if (kind === 'clear') { Object.keys(hosts).forEach(function (k) { [].slice.call(hosts[k].children).forEach(function (x) { x.classList.add('is-leaving'); setTimeout(function () { x.remove(); }, 240); }); }); return; }
  if (kind === 'action') return notify({ type: 'info', title: '有 3 篇文章待审核', desc: '来自「运营部」的稿件正在等待你的处理。', duration: 8000, actions: [{ text: '去审核', primary: true, onClick: function () { ZH.toast('已跳转到审核列表'); } }, { text: '稍后提醒' }] });
  if (kind === 'sticky') return notify({ type: 'warning', title: '存档即将到期', desc: '存档将在 3 天后到期，续期后才能继续访问历史数据。', duration: 0, actions: [{ text: '立即续期', primary: true }] });
  if (kind === 'stack') { for (var i = 1; i <= 6; i++) notify({ type: 'info', title: '第 ' + (++stackN) + ' 条通知', desc: '同一位置最多同时显示 4 条，最早的会被挤掉。', duration: 6000 }); return; }
  var t = { info: ['系统维护提醒', '今晚 23:00 起维护 30 分钟，期间部分功能不可用。'], success: ['导出完成', '「9 月运营数据」已导出，可在下载中心查看。'], warning: ['磁盘空间不足', '剩余空间不足 10%，请及时清理。'], error: ['同步失败', '与设备的连接已断开，请检查网络。'] }[kind];
  notify({ type: kind, title: t[0], desc: t[1] });
}

/* ---------- Message ---------- */
var MSG_MAX = 4;
function message(opts) {
  var o = Object.assign({ type: 'info', text: '', closable: false }, opts);
  if (!('duration' in o)) o.duration = o.type === 'loading' ? 0 : 2600;
  var host = document.getElementById('toastHost'), n = el('div'), timer = null, gone = false;
  var live = $$('.zh-message--svc:not(.zh-message--leaving)', host);
  while (live.length >= MSG_MAX) live.shift().remove();
  function render() {
    n.className = 'zh-message zh-message--svc zh-message--' + o.type;
    n.setAttribute('role', o.type === 'error' ? 'alert' : 'status');
    n.innerHTML = (o.type === 'loading' ? '<span class="spin" aria-hidden="true"></span>' : ZH.iconHtml(TYPE_ICON[o.type] || 'info')) + '<span>' + esc(o.text) + '</span>' +
      (o.closable ? '<button type="button" class="zh-message-x" aria-label="关闭消息">' + ZH.iconHtml('x', 14) + '</button>' : '');
  }
  function close() { if (gone) return; gone = true; clearTimeout(timer); n.classList.add('zh-message--leaving'); setTimeout(function () { n.remove(); }, ZH.reduced() ? 0 : 160); }
  function arm() { clearTimeout(timer); if (o.duration) timer = setTimeout(close, o.duration); }
  render(); host.appendChild(n); arm();
  n.addEventListener('click', function (e) { if (e.target.closest('.zh-message-x')) close(); });
  return { close: close, el: n, update: function (p) { Object.assign(o, p); if (p.type && p.type !== 'loading' && !('duration' in p)) o.duration = 2600; render(); arm(); } };
}
function messageDemo(kind) {
  if (kind === 'loading') { var m = message({ type: 'loading', text: '正在保存…' }); return setTimeout(function () { m.update({ type: 'success', text: '已保存' }); }, 1500); }
  if (kind === 'closable') return message({ type: 'info', text: '这条消息可以手动关闭，10 秒后自动消失', closable: true, duration: 10000 });
  message({ type: kind, text: { info: '已切换到新视图', success: '保存成功', warning: '内容超过 200 字，已自动截断', error: '复制失败，请重试' }[kind] });
}
