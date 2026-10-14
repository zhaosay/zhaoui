var root = document.getElementById('formexample'); if (!root) return;
var $ = function (s) { return root.querySelector(s); }, E = ZH.esc;
var frame = $('#fxFrame'), form = $('#fxForm'), grid = $('.zh-fx-grid'), slider = $('#fxWidth'), readout = $('#fxReadout');

/* width simulator + live column count */
function limit() { var max = Math.floor(root.clientWidth); slider.max = Math.max(280, max); return +slider.max; }
function cols() { return getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length; }
function paint() {
  var w = Math.min(+slider.value, limit()); frame.style.width = w >= limit() ? '' : w + 'px';
  var n = cols(); frame.setAttribute('data-cols', n);
  readout.textContent = Math.round(form.getBoundingClientRect().width) + 'px · ' + n + ' 列';
}
slider.addEventListener('input', paint);
$('#fxFull').addEventListener('click', function () { slider.value = slider.max; paint(); });
if (window.ResizeObserver) new ResizeObserver(function () { requestAnimationFrame(paint); }).observe(root);
slider.value = limit(); paint();

/* segmented radios */
root.querySelectorAll('.zh-fx-seg').forEach(function (g) {
  var bs = [].slice.call(g.children); bs.forEach(function (b) { b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1; });
  function pick(b) { bs.forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); x.tabIndex = x === b ? 0 : -1; }); b.focus(); }
  g.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) pick(b); });
  g.addEventListener('keydown', function (e) {
    var i = bs.indexOf(document.activeElement); if (i < 0) return;
    var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return;
    e.preventDefault(); pick(bs[(i + d + bs.length) % bs.length]);
  });
});

/* counter */
var note = $('#fxNote'), noteMsg = $('#fxNoteMsg');
note.addEventListener('input', function () { noteMsg.textContent = note.value.length + ' / 200'; });

/* validation */
var RULES = {
  fxName: function (v) { return !v ? '请输入设备名称' : v.length < 2 || v.length > 20 ? '设备名称应为 2–20 个字' : ''; },
  fxCode: function (v) { return !v ? '请输入设备编号' : /^ZH-\d{4}$/.test(v) ? '' : '编号格式应为 ZH-0001'; },
  fxOwner: function (v) { return v ? '' : '请填写负责人'; },
  fxIp: function (v) { if (!v) return '请输入 IP 地址'; var p = v.split('.'); return p.length === 4 && p.every(function (x) { return /^\d{1,3}$/.test(x) && +x <= 255; }) ? '' : 'IP 地址应为 4 段数字，每段 0–255'; },
  fxPort: function (v) { return !v ? '请输入端口' : /^\d+$/.test(v) && +v >= 1 && +v <= 65535 ? '' : '端口应为 1–65535 之间的整数'; }
}, HINT = { fxName: '2–20 个字', fxCode: '格式：ZH-加 4 位数字', fxOwner: '填写姓名', fxIp: 'IPv4，每段 0–255', fxPort: '1–65535' }, LABEL = { fxName: '设备名称', fxCode: '设备编号', fxOwner: '负责人', fxIp: 'IP 地址', fxPort: '端口' }, touched = {};
function check(id) {
  var el = $('#' + id), msg = RULES[id](el.value.trim()), h = $('#' + id + 'Msg');
  el.classList.toggle('is-bad', !!msg); h.classList.toggle('is-bad', !!msg); el.setAttribute('aria-invalid', msg ? 'true' : 'false'); h.textContent = msg || HINT[id]; return msg;
}
Object.keys(RULES).forEach(function (id) {
  var el = $('#' + id);
  el.addEventListener('blur', function () { touched[id] = 1; check(id); });
  el.addEventListener('input', function () { if (touched[id]) check(id); });
});

function values() {
  var seg = function (id) { var b = $('#' + id + ' [aria-checked="true"]'); return b ? b.textContent : ''; };
  return {
    name: $('#fxName').value.trim(), code: $('#fxCode').value.trim(), type: $('#fxType').value, owner: $('#fxOwner').value.trim(), region: $('#fxRegion').value, launch: $('#fxDate').value,
    ip: $('#fxIp').value.trim(), port: +$('#fxPort').value, protocol: seg('fxProto'), encryption: seg('fxEnc'), alertLevel: $('#fxLevel').value,
    remote: $('#fxRemote').checked, autoUpdate: $('#fxAuto').checked,
    channels: [].map.call(root.querySelectorAll('.zh-fx-checks input:checked'), function (c) { return c.parentNode.textContent.trim(); }), note: note.value.trim()
  };
}
function show(v) { $('#fxResultCard').hidden = false; $('#fxResult').textContent = JSON.stringify(v, null, 2); }
form.addEventListener('submit', function (e) {
  e.preventDefault();
  var bad = Object.keys(RULES).filter(function (id) { touched[id] = 1; return check(id); }), sum = $('#fxSummary');
  if (bad.length) {
    sum.hidden = false; sum.textContent = '有 ' + bad.length + ' 项需要修改：' + bad.map(function (id) { return LABEL[id]; }).join('、');
    $('#' + bad[0]).focus(); return;
  }
  sum.hidden = true;
  var btn = $('#fxSubmit'), sp = btn.querySelector('.zh-fx-spin'); btn.disabled = true; btn.setAttribute('aria-busy', 'true'); sp.hidden = false;
  setTimeout(function () { btn.disabled = false; btn.removeAttribute('aria-busy'); sp.hidden = true; show(values()); ZH.toast('设备已创建'); }, 800);
});
$('#fxDraft').addEventListener('click', function () { ZH.toast('草稿已保存'); });
$('#fxReset').addEventListener('click', function () {
  touched = {}; form.reset(); $('#fxSummary').hidden = true; $('#fxResultCard').hidden = true; noteMsg.textContent = '0 / 200';
  Object.keys(RULES).forEach(function (id) { var el = $('#' + id), h = $('#' + id + 'Msg'); el.classList.remove('is-bad'); el.removeAttribute('aria-invalid'); h.classList.remove('is-bad'); h.textContent = HINT[id]; });
  root.querySelectorAll('.zh-fx-seg').forEach(function (g, gi) { var want = gi === 0 ? 0 : 1, bs = [].slice.call(g.children); bs.forEach(function (b, i) { b.setAttribute('aria-checked', String(i === want)); b.tabIndex = i === want ? 0 : -1; }); });
});
ZH.hydrateIcons(root);
