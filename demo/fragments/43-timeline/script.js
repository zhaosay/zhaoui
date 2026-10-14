var esc = ZH.esc, ic = ZH.iconHtml;
var host = document.getElementById('timeline');

/* ---------- Timeline ---------- */
var DATA = {
  basic: [
    { t: '提交订单', time: '09-27 18:02', iso: '2026-09-27T18:02', desc: '用户提交订单 #20260927', status: 'primary' },
    { t: '支付成功', time: '09-27 18:05', iso: '2026-09-27T18:05', desc: '微信支付 ¥1,286.00', status: 'success' },
    { t: '仓库拣货', time: '09-28 09:12', iso: '2026-09-28T09:12', desc: '已从上海仓完成拣货' },
    { t: '地址待确认', time: '09-28 14:40', iso: '2026-09-28T14:40', desc: '收件地址不完整，等待客户确认', status: 'warning' }
  ],
  types: [
    { t: '实心圆点', time: '10:00', desc: '默认，最轻量，用于普通记录' },
    { t: '空心圆点', time: '10:20', desc: '表示计划中或未完成', dot: 'hollow', status: 'primary' },
    { t: '图标圆点', time: '10:45', desc: '用图标补充含义', dot: 'icon', icon: 'circle-check', status: 'success' },
    { t: '风险提醒', time: '11:10', desc: '警告与危险必须配图标', dot: 'icon', icon: 'triangle-alert', status: 'warning' },
    { t: '大号图标', time: '11:30', desc: '里程碑节点，一条时间线不超过 2 个', dot: 'large', icon: 'rocket', status: 'primary' },
    { t: '发布失败', time: '11:52', desc: '回滚至上一版本', dot: 'icon', icon: 'circle-x', status: 'danger' }
  ],
  files: [
    { t: '部门主管审批', time: '09-28 09:30', desc: '同意，请财务复核预算。', status: 'success', dot: 'icon', icon: 'check',
      files: [{ name: '预算表.xlsx', size: '128 KB' }, { name: '合同草案.pdf', size: '2.4 MB' }],
      detail: '审批意见：预算合理，同意采购 12 台设备。抄送：行政部、财务部。审批耗时 42 分钟。' },
    { t: '财务复核', time: '09-28 11:05', desc: '金额与预算一致', status: 'primary', dot: 'icon', icon: 'clipboard-check',
      detail: '复核结果：总额 ¥38,600，与预算一致；税率 6%，发票抬头已核对。' },
    { t: '法务审阅', time: '待处理', desc: '预计 1 个工作日', dot: 'hollow' }
  ],
  grouped: [
    { g: '今天', n: 3 },
    { t: '编辑了文章', time: '14:20', desc: '产品发布公告' },
    { t: '上传了 3 张图片', time: '11:08' },
    { t: '创建了草稿', time: '09:41', status: 'primary' },
    { g: '昨天', n: 2 },
    { t: '审核通过', time: '17:30', status: 'success' },
    { t: '提交审核', time: '16:02' }
  ],
  compact: [
    { t: '登录', time: '08:59' }, { t: '查看仪表盘', time: '09:03' }, { t: '导出报表', time: '09:16', status: 'primary' },
    { t: '修改密码', time: '09:40', status: 'warning' }, { t: '退出登录', time: '10:12' }
  ],
  feed: [
    { who: '张三', t: '提交了审核', time: '10:24', avatar: true, status: 'primary', comment: '请重点看第 3 节的数据来源。' },
    { who: '李四', t: '通过了审核', time: '10:51', avatar: true, status: 'success' },
    { who: '王五', t: '发布了《季度复盘》', time: '11:20', avatar: true, status: 'info' }
  ]
};
var LIVE0 = [
  { t: '订单已创建', time: '09:00', desc: '订单 #20260929', status: 'primary' },
  { t: '仓库已接单', time: '09:12', desc: '上海仓', status: 'success' }
];

function itemHtml(it, opp) {
  if (it.g) return '<li class="zh-tl-date"><span>' + esc(it.g) + '<em>' + it.n + ' 条</em></span></li>';
  var id = ZH.uid('tl');
  var cls = 'zh-tl-item' + (it.status ? ' zh-tl-item--' + it.status : '') + (it.pending ? ' zh-tl-item--pending' : '') + (it.fresh ? ' zh-tl-item--new' : '');
  var dot;
  if (it.pending) dot = '<span class="zh-tl-dot zh-tl-dot--icon">' + ic('loader-circle', 14, 'zh-tl-spin') + '</span>';
  else if (it.avatar) dot = '<span class="zh-tl-avatar" aria-hidden="true">' + esc(it.who.slice(0, 1)) + '</span>';
  else if (it.dot === 'icon' || it.dot === 'large') dot = '<span class="zh-tl-dot zh-tl-dot--icon' + (it.dot === 'large' ? ' zh-tl-dot--lg' : '') + '" aria-hidden="true">' + ic(it.icon || 'circle', it.dot === 'large' ? 18 : 14) + '</span>';
  else dot = '<span class="zh-tl-dot' + (it.dot === 'hollow' ? ' zh-tl-dot--hollow' : '') + '" aria-hidden="true"></span>';
  var time = it.time ? '<time class="zh-tl-time' + (opp ? ' zh-tl-time--opp' : '') + '"' + (it.iso ? ' datetime="' + it.iso + '"' : '') + '>' + esc(it.time) + '</time>' : '';
  var title = (it.avatar ? '<b>' + esc(it.who) + '</b> ' : '') + esc(it.t);
  var body = '<div class="zh-tl-head"><span class="zh-tl-title">' + title + '</span>' + (opp ? '' : time) + '</div>' +
    (it.desc ? '<div class="zh-tl-desc">' + esc(it.desc) + '</div>' : '') +
    (it.comment ? '<div class="zh-tl-quote">' + esc(it.comment) + '</div>' : '') +
    (it.files ? '<div class="zh-tl-files">' + it.files.map(function (f) { return '<button type="button" class="zh-tl-file" data-file="' + esc(f.name) + '">' + ic('paperclip', 14) + esc(f.name) + '<span class="zh-tl-fsize">' + esc(f.size) + '</span></button>'; }).join('') + '</div>' : '') +
    (it.detail ? '<button type="button" class="zh-tl-toggle" aria-expanded="false" aria-controls="' + id + '">' + ic('chevron-right', 14) + '<span>展开详情</span></button><div class="zh-tl-detail" id="' + id + '"><div class="zh-tl-detail-wrap"><div class="zh-tl-detail-in">' + esc(it.detail) + '</div></div></div>' : '');
  return '<li class="' + cls + '"' + (it.pending ? ' aria-label="进行中：' + esc(it.t) + '"' : '') + '><div class="zh-tl-rail">' + dot + '</div>' + (opp ? time : '') + '<div class="zh-tl-body">' + body + '</div></li>';
}
function renderList(ol, list) {
  ol.innerHTML = list.map(function (it) { return itemHtml(it, ol.hasAttribute('data-opp')); }).join('');
  ZH.hydrateIcons(ol);
}
host.querySelectorAll('[data-tl]').forEach(function (ol) { renderList(ol, DATA[ol.getAttribute('data-tl')]); });

host.addEventListener('click', function (e) {
  var b = e.target.closest('.zh-tl-toggle');
  if (b) {
    var open = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', String(open));
    b.querySelector('span').textContent = open ? '收起详情' : '展开详情';
    b.closest('.zh-tl-body').classList.toggle('is-open', open);
    return;
  }
  var f = e.target.closest('.zh-tl-file');
  if (f) ZH.toast('已开始下载 ' + f.getAttribute('data-file') + '（演示）');
});

/* live timeline: the last item is "pending"; advancing resolves it and appends the next one */
var LIVE_STEPS = ['拣货完成', '快递揽收', '干线运输', '到达分拣中心', '派送中', '已签收'];
var live = document.getElementById('zhTlLive'), liveList, liveN;
function liveRender() { renderList(live, liveList); }
function liveReset() {
  liveN = 0;
  liveList = LIVE0.concat([{ t: LIVE_STEPS[0], pending: true, desc: '正在处理…' }]);
  liveRender();
}
function pad2(n) { return (n < 10 ? '0' : '') + n; }
document.getElementById('zhTlAdvance').addEventListener('click', function () {
  var last = liveList[liveList.length - 1];
  if (!last.pending) { ZH.toast('已全部完成，点击「重置」重新开始'); return; }
  var d = new Date(2026, 8, 29, 9 + liveN, 20 + liveN * 7);
  last.pending = false; last.time = pad2(d.getHours()) + ':' + pad2(d.getMinutes()); last.desc = '已完成'; last.status = liveN === LIVE_STEPS.length - 1 ? 'success' : undefined;
  liveN++;
  if (liveN < LIVE_STEPS.length) liveList.push({ t: LIVE_STEPS[liveN], pending: true, desc: '正在处理…', fresh: true });
  liveRender();
});
document.getElementById('zhTlReset').addEventListener('click', liveReset);
liveReset();

/* ---------- Steps ---------- */
var STEPS = {
  basic: { items: [['填写信息', '姓名与联系方式'], ['验证身份', '短信验证码'], ['选择方案', '按需选择'], ['完成', '开通成功']], cur: 1 },
  icons: { items: [['账户', 'user'], ['支付', 'credit-card'], ['发货', 'package'], ['完成', 'check-check']], cur: 1 },
  error: { items: [['选择文件', ''], ['上传', '网络中断'], ['校验', ''], ['完成', '']], cur: 1, err: 1 },
  small: { items: [['提交'], ['审核'], ['发布']], cur: 1 },
  vertical: { items: [['创建项目', '2026-09-27'], ['配置环境', '2026-09-28'], ['部署上线', '进行中'], ['验收', '']], cur: 2 }
};
function stepsHtml(cfg, mode, opts) {
  opts = opts || {};
  return cfg.items.map(function (s, i) {
    var st = cfg.done ? 'finish' : (cfg.err === i ? 'error' : i < cfg.cur ? 'finish' : i === cfg.cur ? 'process' : 'wait'), isCur = !cfg.done && i === cfg.cur;
    var inner;
    if (mode === 'icon') inner = ic(st === 'finish' && !opts.keepIcon ? 'check' : st === 'error' ? 'x' : s[1], 16);
    else inner = st === 'finish' ? ic('check', 16) : st === 'error' ? ic('x', 16) : String(i + 1);
    var desc = mode === 'icon' ? '' : (s[1] || '');
    var main = '<span class="zh-step-main"><span class="zh-step-title">' + esc(s[0]) + '</span>' + (desc ? '<span class="zh-step-desc" style="display:block">' + esc(desc) + '</span>' : '') + (opts.msg && opts.msg[i] ? '<span class="zh-step-msg" style="display:block">' + esc(opts.msg[i]) + '</span>' : '') + '</span>';
    var hit = opts.click
      ? '<button type="button" class="zh-step-hit" data-step="' + i + '"' + (i > cfg.reach ? ' disabled' : '') + (isCur ? ' aria-current="step"' : '') + '><span class="zh-step-icon" aria-hidden="true">' + inner + '</span>' + main + '</button>'
      : '<span class="zh-step-hit"><span class="zh-step-icon" aria-hidden="true">' + inner + '</span>' + main + '</span>';
    return '<li class="zh-step is-' + st + '"' + (!opts.click && isCur ? ' aria-current="step"' : '') + '>' + hit + '<span class="zh-step-line" aria-hidden="true"><i></i></span></li>';
  }).join('');
}
host.querySelectorAll('[data-steps]').forEach(function (ol) {
  if (ol.id) return;
  ol.innerHTML = stepsHtml(STEPS[ol.getAttribute('data-steps')], ol.getAttribute('data-mode'), { keepIcon: false });
  ZH.hydrateIcons(ol);
});

/* connector animation demo */
var play = document.getElementById('zhStepsPlay'), playBtn = document.getElementById('zhStepsPlayBtn'), pcfg = { items: STEPS.basic.items, cur: -1 }, timer = null;
function playRender() { play.innerHTML = stepsHtml(pcfg, null); ZH.hydrateIcons(play); }
function playStop() { clearInterval(timer); timer = null; playBtn.innerHTML = ic('play') + '播放'; ZH.hydrateIcons(playBtn); }
playBtn.addEventListener('click', function () {
  if (timer) { playStop(); return; }
  pcfg.cur = -1; playRender();
  playBtn.innerHTML = ic('pause') + '暂停'; ZH.hydrateIcons(playBtn);
  var lines = 0;
  timer = setInterval(function () {
    pcfg.cur++;
    if (pcfg.cur > pcfg.items.length) { pcfg.done = true; playStop(); return; }
    /* update classes in place so the connector transitions instead of being re-created */
    play.querySelectorAll('.zh-step').forEach(function (li, i) {
      var st = i < pcfg.cur ? 'finish' : i === pcfg.cur ? 'process' : 'wait';
      li.className = 'zh-step is-' + st;
      var icon = li.querySelector('.zh-step-icon');
      icon.innerHTML = st === 'finish' ? ic('check', 16) : String(i + 1);
      if (st === 'process') li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    ZH.hydrateIcons(play);
  }, ZH.reduced() ? 400 : 1000);
});
pcfg.cur = 1; playRender();

/* ---------- Wizard (clickable steps + validation gating) ---------- */
var wiz = { cur: 0, reach: 0, err: -1, done: false, msg: {}, vals: { name: '', mail: '', plan: '' } };
var W = { root: document.getElementById('zhWiz'), steps: document.getElementById('zhWizSteps'), prev: document.getElementById('zhWizPrev'), next: document.getElementById('zhWizNext'), msg: document.getElementById('zhWizMsg') };
var WITEMS = [['账户信息', '姓名与邮箱'], ['选择方案', '必选一项'], ['确认提交', '核对信息']];
function wizValidate(i) {
  var n = document.getElementById('zhWizName'), m = document.getElementById('zhWizMail'), p = W.root.querySelector('input[name="zhWizPlan"]:checked');
  var ok = true, first = null;
  if (i === 0) {
    var okName = n.value.trim().length > 0, okMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.value.trim());
    n.setAttribute('aria-invalid', String(!okName)); m.setAttribute('aria-invalid', String(!okMail));
    document.getElementById('zhWizNameE').hidden = okName; document.getElementById('zhWizMailE').hidden = okMail;
    if (!okName) first = n; else if (!okMail) first = m;
    ok = okName && okMail;
  } else if (i === 1) {
    ok = !!p; document.getElementById('zhWizPlanE').hidden = ok;
    if (!ok) first = W.root.querySelector('input[name="zhWizPlan"]');
  }
  return { ok: ok, first: first };
}
function wizRender() {
  var cfg = { items: WITEMS, cur: wiz.cur, err: wiz.err, reach: wiz.reach, done: wiz.done };
  W.steps.innerHTML = stepsHtml(cfg, null, { click: true, reach: wiz.reach, msg: wiz.msg });
  ZH.hydrateIcons(W.steps);
  W.root.querySelectorAll('.zh-wiz-panel').forEach(function (p) { p.hidden = +p.getAttribute('data-i') !== wiz.cur; });
  W.prev.disabled = wiz.cur === 0; W.next.textContent = wiz.cur === WITEMS.length - 1 ? '提交' : '下一步';
  if (wiz.cur === 2) {
    document.getElementById('zhWizSum').innerHTML = '<div><dt>姓名</dt><dd>' + esc(document.getElementById('zhWizName').value.trim()) + '</dd></div><div><dt>邮箱</dt><dd>' + esc(document.getElementById('zhWizMail').value.trim()) + '</dd></div><div><dt>方案</dt><dd>' + esc((W.root.querySelector('input[name="zhWizPlan"]:checked') || {}).value || '') + '</dd></div>';
  }
}
function wizGo(to) { wiz.cur = to; wiz.err = -1; wiz.msg = {}; wiz.reach = Math.max(wiz.reach, to); W.msg.textContent = ''; wizRender(); }
W.next.addEventListener('click', function () {
  if (wiz.done) { wiz.done = false; wiz.cur = 0; wiz.reach = 0; wizRender(); return; }
  var v = wizValidate(wiz.cur);
  if (!v.ok) {
    wiz.err = wiz.cur; wiz.msg = {}; wiz.msg[wiz.cur] = '请先完成此步骤';
    W.msg.textContent = '当前步骤未通过校验，请修正后继续';
    wizRender(); if (v.first) v.first.focus(); return;
  }
  if (wiz.cur === WITEMS.length - 1) { wiz.done = true; wiz.err = -1; W.msg.textContent = '提交成功'; wizRender(); W.next.textContent = '重新开始'; ZH.toast('注册信息已提交（演示）'); return; }
  wizGo(wiz.cur + 1);
});
W.prev.addEventListener('click', function () { if (wiz.cur > 0) wizGo(wiz.cur - 1); });
W.steps.addEventListener('click', function (e) {
  var b = e.target.closest('.zh-step-hit'); if (!b || b.disabled) return;
  var to = +b.getAttribute('data-step');
  if (to > wiz.cur) { var v = wizValidate(wiz.cur); if (!v.ok) { wiz.err = wiz.cur; wiz.msg = {}; wiz.msg[wiz.cur] = '请先完成此步骤'; W.msg.textContent = '当前步骤未通过校验，请修正后继续'; wizRender(); if (v.first) v.first.focus(); return; } }
  wiz.done = false; wizGo(to);
});
W.root.addEventListener('input', function (e) { if (wiz.err === wiz.cur) { var v = wizValidate(wiz.cur); if (v.ok) { wiz.err = -1; wiz.msg = {}; W.msg.textContent = ''; wizRender(); } } });
wizRender();

// Steps fit: measure the row at its natural width; if it overflows its container, stack it vertically.
(function () {
  var rows = Array.prototype.slice.call(document.querySelectorAll('.zh-steps:not(.zh-steps--v)'));
  function fit(ol) { ol.classList.remove('is-stacked'); if (ol.scrollWidth > ol.clientWidth + 1) ol.classList.add('is-stacked'); }
  function fitAll() { rows.forEach(fit); }
  if (window.ResizeObserver) { var ro = new ResizeObserver(fitAll); rows.forEach(function (ol) { if (ol.parentElement) ro.observe(ol.parentElement); }); }
  else window.addEventListener('resize', fitAll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
  fitAll();
})();
