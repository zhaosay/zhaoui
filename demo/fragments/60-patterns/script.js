var root = document.getElementById('patterns'); if (!root) return;
var $ = function (s) { return root.querySelector(s); };
var E = ZH.esc;

/* filter chips: apply immediately */
var WORKS = [['18 岁成人后我觉醒了异能', 'run'], ['沉默的窗外', 'ok'], ['星河尽头的信', 'ok'], ['旧城纪事', 'warn'], ['雾中来客', 'bad'], ['夜航船', 'run'], ['长街灯火', 'ok']];
var LABEL = { ok: '已完成', run: '进行中', warn: '待复核', bad: '失败' }, filter = 'all';
function drawFilter() {
  var counts = { all: WORKS.length }; WORKS.forEach(function (w) { counts[w[1]] = (counts[w[1]] || 0) + 1; });
  $('#patChips').innerHTML = [['all', '全部']].concat(Object.keys(LABEL).map(function (k) { return [k, LABEL[k]]; })).map(function (c) {
    return '<button type="button" class="zh-pat-chip" data-f="' + c[0] + '" aria-pressed="' + (filter === c[0]) + '">' + E(c[1]) + '<b>' + (counts[c[0]] || 0) + '</b></button>';
  }).join('');
  var rows = WORKS.filter(function (w) { return filter === 'all' || w[1] === filter; });
  $('#patRows').innerHTML = rows.map(function (w) { return '<tr><td>' + E(w[0]) + '</td><td><span class="zh-pat-dot ' + w[1] + '"></span>' + LABEL[w[1]] + '</td></tr>'; }).join('');
  $('#patCount').textContent = '显示 ' + rows.length + ' / ' + WORKS.length + ' 项';
}
$('#patChips').addEventListener('click', function (e) { var b = e.target.closest('[data-f]'); if (b) { filter = b.getAttribute('data-f'); drawFilter(); } });
drawFilter();

/* checklist */
var TODO = ['创建第一个作品', '导入素材', '生成一章正文', '预览并发布'], done = [true, false, false, false];
function drawTodo() {
  var n = done.filter(Boolean).length;
  $('#patTodo').innerHTML = TODO.map(function (t, i) { return '<li><label><input type="checkbox" data-i="' + i + '"' + (done[i] ? ' checked' : '') + '><span>' + E(t) + '</span></label></li>'; }).join('');
  var p = $('#patProg'); p.style.setProperty('--p', n / TODO.length); p.setAttribute('aria-valuenow', n);
  $('#patTodoHint').textContent = n === TODO.length ? '全部完成，可以收起这张卡片了。' : '还剩 ' + (TODO.length - n) + ' 步，下一步：' + TODO[done.indexOf(false)];
}
$('#patTodo').addEventListener('change', function (e) { var i = +e.target.getAttribute('data-i'); done[i] = e.target.checked; drawTodo(); });
drawTodo();
$('#patProg').innerHTML = '<i></i>';

/* batch selection */
var BATCH = ['第 1 章 · 雨夜', '第 2 章 · 来信', '第 3 章 · 旧城', '第 4 章 · 远行'], sel = {};
function drawBatch() {
  $('#patBatchRows').innerHTML = BATCH.map(function (t, i) { return '<li class="' + (sel[i] ? 'is-sel' : '') + '"><input type="checkbox" data-i="' + i + '" aria-label="选择 ' + E(t) + '"' + (sel[i] ? ' checked' : '') + '><span class="grow">' + E(t) + '</span></li>'; }).join('');
  var n = Object.keys(sel).length, bar = $('#patBar'); bar.hidden = n === 0; $('#patBarN').textContent = '已选 ' + n + ' 项';
}
$('#patBatchRows').addEventListener('change', function (e) { var i = e.target.getAttribute('data-i'); if (e.target.checked) sel[i] = 1; else delete sel[i]; drawBatch(); });
$('#patBar').addEventListener('click', function (e) {
  var b = e.target.closest('[data-pat-bulk]'); if (!b) return; var a = b.getAttribute('data-pat-bulk'), n = Object.keys(sel).length;
  if (a === 'clear') { sel = {}; drawBatch(); return; }
  if (a === 'delete') { BATCH = BATCH.filter(function (_, i) { return !sel[i]; }); sel = {}; drawBatch(); ZH.toast('已删除 ' + n + ' 项'); return; }
  ZH.toast('已导出 ' + n + ' 项');
});
drawBatch();

/* preview diff */
var REWRITES = ['他望着窗外的雨，一言不发。', '窗外雨声不止，他始终没有开口。', '雨落个不停，他只是静静看着。'], ri = 0;
$('#patDiff').parentNode.addEventListener('click', function (e) {
  var b = e.target.closest('[data-pat-diff]'); if (!b) return; var a = b.getAttribute('data-pat-diff'), st = $('#patDiffState');
  if (a === 'again') { ri = (ri + 1) % REWRITES.length; $('#patNew').textContent = REWRITES[ri]; st.textContent = '待确认'; return; }
  st.textContent = a === 'save' ? '已保存改动' : '已放弃，保留原文'; ZH.toast(st.textContent);
});

/* status flow */
var FLOW = [['第 3 章检查', 0], ['封面审核', 1], ['简介校对', 2]], STEPS = [['待处理', 'warn', '开始处理'], ['处理中', 'run', '标记完成'], ['已完成', 'ok', null]];
function drawFlow() {
  $('#patFlow').innerHTML = FLOW.map(function (f, i) {
    var s = STEPS[f[1]];
    return '<li><span class="grow">' + E(f[0]) + '</span><span><span class="zh-pat-dot ' + s[1] + '"></span>' + s[0] + '</span>' + (s[2] ? '<button type="button" class="zh-btn sm" data-i="' + i + '">' + s[2] + '</button>' : '<button type="button" class="zh-btn sm text" data-undo="' + i + '">撤回</button>') + '</li>';
  }).join('');
}
$('#patFlow').addEventListener('click', function (e) {
  var b = e.target.closest('button'); if (!b) return;
  if (b.hasAttribute('data-undo')) { var k = +b.getAttribute('data-undo'); if (!window.confirm) return; FLOW[k][1] = 1; drawFlow(); ZH.toast('已撤回到「处理中」'); return; }
  var i = +b.getAttribute('data-i'); FLOW[i][1]++; drawFlow(); ZH.toast('已更新为「' + STEPS[FLOW[i][1]][0] + '」');
});
drawFlow();

/* tour bubble */
var tourBtn = $('#patTourBtn'), tour;
function startTour() {
  if (tour) tour.destroy();
  tour = ZH.popover(tourBtn, { trigger: 'manual', placement: 'bottom-start', arrow: true, role: 'dialog', z: 'popover', content: function (api) {
    var d = document.createElement('div'); d.className = 'zh-pat-tour';
    d.innerHTML = '<b>从这里开始</b><p>点击「新建作品」创建你的第一个作品，之后可以随时在设置里重看引导。</p><button type="button" class="zh-btn primary sm">知道了</button>';
    d.querySelector('button').addEventListener('click', function () { api.close(); });
    return d;
  } });
  tour.open();
}
$('#patTourReplay').addEventListener('click', startTour);

/* option-count rule */
var OPT = ['EPUB', 'TXT', 'DOCX', 'PDF', 'MOBI', 'HTML', 'MD', 'RTF', 'ODT', 'FB2', 'AZW3', 'CBZ', 'LRF', 'PDB'], val = 0;
function drawOpt() {
  var n = +$('#patN').value, list = OPT.slice(0, n); val = Math.min(val, n - 1);
  $('#patNOut').textContent = n + ' 个';
  $('#patRule').textContent = n <= 5 ? '规则：平铺展示' : n <= 12 ? '规则：下拉选择' : '规则：可搜索下拉';
  var h;
  if (n <= 5) h = '<div class="zh-pat-seg" role="radiogroup" aria-label="导出格式">' + list.map(function (o, i) { return '<button type="button" role="radio" aria-checked="' + (i === val) + '" data-i="' + i + '" tabindex="' + (i === val ? 0 : -1) + '">' + E(o) + '</button>'; }).join('') + '</div>';
  else if (n <= 12) h = '<div class="zh-select" style="max-width:240px"><select aria-label="导出格式">' + list.map(function (o) { return '<option>' + E(o) + '</option>'; }).join('') + '</select></div>';
  else h = '<div class="zh-field" style="max-width:240px"><input class="zh-input" list="patDL" placeholder="搜索格式" aria-label="导出格式"><datalist id="patDL">' + list.map(function (o) { return '<option value="' + E(o) + '">'; }).join('') + '</datalist></div>';
  $('#patOptions').innerHTML = h;
}
$('#patN').addEventListener('input', drawOpt);
$('#patOptions').addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (b) { val = +b.getAttribute('data-i'); drawOpt(); var nb = $('#patOptions [aria-checked="true"]'); if (nb) nb.focus(); } });
$('#patOptions').addEventListener('keydown', function (e) {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; var n = +$('#patN').value; e.preventDefault();
  val = (val + (e.key === 'ArrowRight' ? 1 : n - 1)) % n; drawOpt(); $('#patOptions [aria-checked="true"]').focus();
});
drawOpt();
