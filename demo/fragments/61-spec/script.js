var root = document.getElementById('spec'); if (!root) return;
var $ = function (s) { return root.querySelector(s); }, E = ZH.esc;
var LV = [
  ['主按钮', 'primary', '页面唯一的主要动作：提交、保存、创建'],
  ['次按钮', '', '与主按钮并列的次要动作：取消、返回'],
  ['主色描边', 'zh-bm-outline', '需要强调、但不是主动作：导出、添加'],
  ['文字按钮', 'text', '表格行内、卡片角落的低干扰动作'],
  ['危险 · 描边', 'danger', '删除、停用；配合确认框'],
  ['危险 · 满色', 'zh-bm-danger-fill', '确认框内的最终确认按钮']
];
$('#bmBody').innerHTML = LV.map(function (l) {
  var cell = function (sz) { return '<td><button type="button" class="zh-btn ' + l[1] + ' ' + sz + '">按钮</button></td>'; };
  return '<tr><td>' + E(l[0]) + '</td>' + cell('sm') + cell('') + cell('lg') + '<td>' + E(l[2]) + '</td></tr>';
}).join('');

var ST = [
  ['主按钮', function (s, extra) { return '<button type="button" class="zh-btn primary ' + s + '"' + extra + '>保存</button>'; }],
  ['次按钮', function (s, extra) { return '<button type="button" class="zh-btn ' + s + '"' + extra + '>取消</button>'; }],
  ['输入框', function (s, extra) { return '<input class="zh-input zh-bm-state-input ' + s + '" value="内容" aria-label="示例输入框"' + extra + '>'; }],
  ['开关', function (s, extra) { return '<input type="checkbox" class="zh-switch ' + s + '" role="switch" checked aria-label="示例开关"' + extra + '>'; }]
];
var states = ['', 'is-hover', 'is-active', 'is-focus', 'is-disabled', 'is-loading'];
$('#stBody').innerHTML = ST.map(function (row, ri) {
  return '<tr><td>' + row[0] + '</td>' + states.map(function (s) {
    var cls = s === 'is-loading' ? '' : s, extra = s === 'is-disabled' ? ' disabled tabindex="-1"' : '';
    var h = row[1](cls, extra);
    if (s === 'is-loading') h = ri < 2 ? '<button type="button" class="zh-btn ' + (ri === 0 ? 'primary' : '') + '" aria-busy="true"><span class="zh-bm-spin"></span>处理中</button>' : '<span class="zh-hint" style="margin:0">—</span>';
    if (s === 'is-hover' && ri === 2) h = row[1]('', ' style="border-color:var(--zh-color-primary)"');
    if (s === 'is-focus' && ri === 2) h = row[1]('', ' style="border-color:var(--zh-color-primary);box-shadow:0 0 0 3px var(--zh-color-primary-subtle)"');
    if (s === 'is-focus' && ri === 3) h = row[1]('', ' style="box-shadow:var(--zh-focus-ring)"');
    return '<td>' + h + '</td>';
  }).join('') + '</tr>';
}).join('');
root.querySelectorAll('#stBody input[type="checkbox"]').forEach(function (c) { c.style.pointerEvents = 'none'; });
ZH.hydrateIcons(root);

/* button group */
var grp = $('#bmGroup');
grp.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; [].forEach.call(grp.children, function (x) { x.setAttribute('aria-checked', String(x === b)); x.tabIndex = x === b ? 0 : -1; }); });
grp.addEventListener('keydown', function (e) {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; var l = [].slice.call(grp.children), i = l.indexOf(document.activeElement); if (i < 0) return;
  e.preventDefault(); var n = l[(i + (e.key === 'ArrowRight' ? 1 : l.length - 1)) % l.length]; n.click(); n.focus();
});
[].forEach.call(grp.children, function (b, i) { b.tabIndex = i === 0 ? 0 : -1; });

/* split button menu */
var main = $('#bmSplitMain'), caret = $('#bmSplitCaret');
main.addEventListener('click', function () { ZH.toast('已导出为 EPUB'); });
ZH.popover(caret, { placement: 'bottom-end', role: 'menu', z: 'dropdown', trapFocus: false, content: function (api) {
  var ul = document.createElement('div'); ul.style.cssText = 'padding:6px;min-width:150px;display:grid;gap:2px';
  ['导出为 TXT', '导出为 DOCX', '导出为 PDF'].forEach(function (t) {
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.className = 'zh-btn text'; b.style.cssText = 'justify-content:flex-start;color:var(--zh-text)'; b.textContent = t;
    b.addEventListener('click', function () { ZH.toast('已' + t); api.close(); }); ul.appendChild(b);
  });
  ZH.rovingFocus(ul, '[role=menuitem]'); return ul;
}, onOpen: function (el) { var f = el.querySelector('[role=menuitem]'); if (f) f.focus(); } });

/* form validation */
var RULES = {
  bmPhone: function (v) { return v ? (/^\d{11}$/.test(v) ? '' : '手机号应为 11 位数字') : '请输入手机号'; },
  bmMail: function (v) { return v ? (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : '邮箱格式应为 name@example.com') : '请输入邮箱'; }
}, HINT = { bmPhone: '11 位数字', bmMail: '例如 name@example.com' }, touched = {};
function check(id) {
  var el = $('#' + id), msg = RULES[id](el.value.trim()), hint = $('#' + id + 'Msg');
  el.classList.toggle('is-bad', !!msg); hint.classList.toggle('is-bad', !!msg); el.setAttribute('aria-invalid', msg ? 'true' : 'false'); hint.textContent = msg || HINT[id]; return msg;
}
Object.keys(RULES).forEach(function (id) {
  var el = $('#' + id);
  el.addEventListener('blur', function () { touched[id] = 1; check(id); });
  el.addEventListener('input', function () { if (touched[id]) check(id); });
});
$('#bmForm').addEventListener('submit', function (e) {
  e.preventDefault(); var bad = Object.keys(RULES).filter(function (id) { touched[id] = 1; return check(id); }), sum = $('#bmSum');
  if (bad.length) { sum.hidden = false; sum.textContent = '有 ' + bad.length + ' 项需要修改'; $('#' + bad[0]).focus(); return; }
  sum.hidden = true; var btn = $('#bmSubmit'), sp = btn.querySelector('.zh-bm-spin'); btn.disabled = true; btn.setAttribute('aria-busy', 'true'); sp.hidden = false;
  setTimeout(function () { btn.disabled = false; btn.removeAttribute('aria-busy'); sp.hidden = true; ZH.toast('提交成功'); }, 900);
});
$('#bmReset').addEventListener('click', function () { touched = {}; $('#bmForm').reset(); $('#bmSum').hidden = true; Object.keys(RULES).forEach(function (id) { var el = $('#' + id), h = $('#' + id + 'Msg'); el.classList.remove('is-bad'); el.removeAttribute('aria-invalid'); h.classList.remove('is-bad'); h.textContent = HINT[id]; }); });
