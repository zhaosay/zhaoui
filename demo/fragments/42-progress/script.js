var root = document.getElementById('progress');
if (!root) return;

function clamp(v) { return Math.max(0, Math.min(100, v)); }
function toneOf(el, v) {
  var st = el.dataset.status || 'normal';
  if (st !== 'normal') return st;
  return v >= 100 && el.dataset.auto !== 'off' && el.dataset.indeterminate !== 'true' ? 'success' : 'normal';
}

/* ---------- Linear ---------- */
function mountProgress(el) {
  var label = el.dataset.label || 'outside', steps = +el.dataset.steps || 0, indet = el.dataset.indeterminate === 'true';
  el.classList.toggle('zh-progress--steps', !!steps);
  var head = '', track, extra = '';
  if (label === 'top') head = '<div class="zh-progress-head"><span>' + ZH.esc(el.dataset.title || el.dataset.name || '') + '</span><span class="pct"></span></div>';
  if (steps) { track = '<div class="zh-progress-track">' + new Array(steps + 1).join('<i></i>') + '</div>'; }
  else {
    track = '<div class="zh-progress-track">' + (el.dataset.buffer ? '<div class="zh-progress-buffer"></div>' : '') +
      '<div class="zh-progress-fill">' + (label === 'inside' ? '<span class="zh-progress-in"></span>' : '') + '</div></div>';
  }
  if (el.dataset.target) extra = '<span class="zh-progress-target" style="--zh-t:' + (+el.dataset.target) + '"><em>' + ZH.esc(el.dataset.targetLabel || '目标') + '</em></span>';
  el.innerHTML = head + '<div class="zh-progress-bar' + (extra ? ' has-target' : '') + '">' + track + extra + '</div>' + (label === 'outside' && !indet ? '<span class="zh-progress-label"></span>' : '');
  el.setAttribute('role', 'progressbar'); el.setAttribute('aria-valuemin', '0'); el.setAttribute('aria-valuemax', '100');
  el.setAttribute('aria-label', el.dataset.name || el.dataset.title || '进度');
  if (indet) { el.setAttribute('aria-busy', 'true'); el.removeAttribute('aria-valuenow'); el.setAttribute('aria-valuetext', '加载中'); return; }
  setProgress(el, +el.dataset.value || 0);
}
function setProgress(el, v) {
  v = clamp(v); el.dataset.value = String(v);
  el.style.setProperty('--zh-p', v / 100);
  if (el.dataset.buffer) el.style.setProperty('--zh-b', clamp(+el.dataset.buffer) / 100);
  var tone = toneOf(el, v); el.dataset.tone = tone;
  el.setAttribute('aria-valuenow', String(Math.round(v))); el.setAttribute('aria-valuetext', Math.round(v) + '%' + (tone === 'success' ? '，已完成' : tone === 'exception' ? '，失败' : ''));
  var txt = Math.round(v) + '%';
  var icon = tone === 'success' ? ZH.iconHtml('circle-check') : tone === 'exception' ? ZH.iconHtml('circle-x') : '';
  var lab = el.querySelector('.zh-progress-label'); if (lab) lab.innerHTML = icon || txt;
  var pct = el.querySelector('.pct'); if (pct) pct.innerHTML = icon ? icon + txt : txt;
  var inn = el.querySelector('.zh-progress-in'); if (inn) { inn.textContent = txt; inn.classList.toggle('is-hidden', v < 14); }
  var steps = el.querySelectorAll('.zh-progress-track i');
  if (steps.length) { var on = Math.round(v / 100 * steps.length); steps.forEach(function (s, i) { s.classList.toggle('on', i < on); }); }
}
root.querySelectorAll('.zh-progress').forEach(mountProgress);

/* ---------- Circular ---------- */
var C_FULL = 263.89;
function mountRing(el) {
  var shape = el.dataset.shape || 'full';
  el.classList.toggle('zh-ring--gauge', shape === 'gauge'); el.classList.toggle('zh-ring--semi', shape === 'semi');
  var rot = shape === 'gauge' ? 135 : shape === 'semi' ? 180 : -90, vb = shape === 'semi' ? '0 0 100 58' : '0 0 100 100';
  el.innerHTML = '<svg viewBox="' + vb + '" aria-hidden="true"><circle class="zh-ring-track" cx="50" cy="50" r="42" transform="rotate(' + rot + ' 50 50)"/><circle class="zh-ring-arc" cx="50" cy="50" r="42" transform="rotate(' + rot + ' 50 50)"/></svg>' +
    '<div class="zh-ring-center"></div>' + (shape === 'gauge' ? '<div class="zh-ring-ends"><span>0</span><span>100</span></div>' : '');
  if (el.getAttribute('role') !== 'timer') el.setAttribute('role', 'progressbar');
  el.setAttribute('aria-valuemin', '0'); el.setAttribute('aria-valuemax', '100');
  if (el.dataset.name) el.setAttribute('aria-label', el.dataset.name);
  setRing(el, +el.dataset.value || 0);
}
function setRing(el, v, centerOverride) {
  v = clamp(v); el.dataset.value = String(v);
  el.style.setProperty('--zh-p', v / 100); el.classList.toggle('is-zero', v <= 0);
  var tone = toneOf(el, v); el.dataset.tone = tone;
  if (el.getAttribute('role') !== 'timer') { el.setAttribute('aria-valuenow', String(Math.round(v))); el.setAttribute('aria-valuetext', Math.round(v) + '%'); }
  var c = el.querySelector('.zh-ring-center'), cap = el.dataset.caption ? '<small>' + ZH.esc(el.dataset.caption) + '</small>' : '';
  if (centerOverride != null) c.innerHTML = centerOverride;
  else if (tone === 'success' && el.dataset.shape !== 'gauge' && el.dataset.shape !== 'semi') c.innerHTML = ZH.iconHtml('check');
  else if (tone === 'exception' && !el.dataset.shape) c.innerHTML = ZH.iconHtml('x');
  else c.innerHTML = '<span>' + Math.round(v) + '<span style="font-size:.55em;font-weight:500">%</span>' + cap + '</span>';
}
root.querySelectorAll('.zh-ring[data-value]:not(#cdRing)').forEach(mountRing);

/* concentric rings */
(function () {
  var host = root.querySelector('#pgMulti'), data = [['移动', 82, 'a1', 42], ['锻炼', 54, 'a2', 32], ['站立', 90, 'a3', 22]];
  var svg = data.map(function (d) {
    var c = 2 * Math.PI * d[3];
    return '<circle class="zh-ring-track" cx="50" cy="50" r="' + d[3] + '" transform="rotate(-90 50 50)"/><circle class="zh-ring-arc ' + d[2] + '" cx="50" cy="50" r="' + d[3] + '" transform="rotate(-90 50 50)" style="--zh-p:' + d[1] / 100 + ';stroke-dasharray:' + c.toFixed(2) + 'px ' + c.toFixed(2) + 'px;stroke-dashoffset:calc(' + c.toFixed(2) + 'px * (1 - var(--zh-p)))"/>';
  }).join('');
  host.className = 'zh-pgd-lab'; host.style.cssText = 'flex-direction:row;gap:16px';
  host.innerHTML = '<div class="zh-ring zh-ring--multi" role="img" aria-label="每日目标：' + data.map(function (d) { return d[0] + ' ' + d[1] + '%'; }).join('，') + '"><svg viewBox="0 0 100 100" aria-hidden="true">' + svg + '</svg></div>' +
    '<ul class="zh-progress-legend" style="flex-direction:column;margin:0;padding:0;list-style:none;gap:6px">' + data.map(function (d, i) {
      return '<li><i style="--c:var(--zh-seq-' + [6, 5, 3][i] + ')"></i>' + d[0] + '<b>' + d[1] + '%</b></li>'; }).join('') + '</ul>';
})();

/* stacked */
(function () {
  var data = [['已完成', 52, 'var(--zh-chart-1)'], ['进行中', 28, 'var(--zh-chart-2)'], ['待开始', 14, 'var(--zh-chart-3)'], ['已搁置', 6, 'var(--zh-chart-4)']];
  root.querySelector('#pgStack').innerHTML = '<div class="zh-progress-stack" role="img" aria-label="任务构成：' + data.map(function (d) { return d[0] + ' ' + d[1] + '%'; }).join('，') + '" style="--zh-progress-h:12px">' +
    data.map(function (d) { return '<i style="--w:' + d[1] + ';--c:' + d[2] + '"></i>'; }).join('') + '</div>' +
    '<div class="zh-progress-legend">' + data.map(function (d) { return '<span><i style="--c:' + d[2] + '"></i>' + d[0] + '<b>' + d[1] + '%</b></span>'; }).join('') + '</div>';
})();

/* ---------- Playground ---------- */
var pgMain = root.querySelector('#pgMain'), pgRing = root.querySelector('#pgRing'), pgValue = 36, pgTimer = null, pgSim = root.querySelector('#pgSim');
function pgSet(v) { pgValue = clamp(v); setProgress(pgMain, pgValue); setRing(pgRing, pgValue); if (pgValue >= 100) pgStop(); }
function pgStop() { clearInterval(pgTimer); pgTimer = null; pgSim.innerHTML = ZH.iconHtml('play') + '模拟'; }
root.querySelector('#pgMinus').addEventListener('click', function () { pgSet(pgValue - 10); });
root.querySelector('#pgPlus').addEventListener('click', function () { pgSet(pgValue + 10); });
root.querySelector('#pgReset').addEventListener('click', function () { pgStop(); pgSet(0); });
pgSim.addEventListener('click', function () {
  if (pgTimer) { pgStop(); return; }
  if (pgValue >= 100) pgSet(0);
  pgSim.innerHTML = ZH.iconHtml('pause') + '暂停';
  pgTimer = setInterval(function () { pgSet(pgValue + 2 + Math.random() * 4); }, 260);
});
function bindSeg(id, fn) {
  var g = root.querySelector(id);
  g.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; g.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); fn(b.dataset.v); });
}
bindSeg('#pgStatus', function (v) { pgMain.dataset.status = v; pgRing.dataset.status = v; setProgress(pgMain, pgValue); setRing(pgRing, pgValue); });
bindSeg('#pgSize', function (v) { pgMain.dataset.size = v; mountProgress(pgMain); });
bindSeg('#pgLabel', function (v) { pgMain.dataset.label = v; mountProgress(pgMain); });
pgSet(36);

/* ---------- Countdown ---------- */
var cd = root.querySelector('#cdRing'), cdToggle = root.querySelector('#cdToggle'), cdMsg = root.querySelector('#cdMsg');
var cdTotal = 10000, cdLeft = 10000, cdTimer = null, cdLast = 0;
cd.dataset.name = '倒计时'; mountRing(cd);
function cdPaint() {
  var s = Math.ceil(cdLeft / 1000);
  cd.dataset.status = cdLeft <= 0 ? 'exception' : cdLeft <= 3000 ? 'warning' : 'normal';
  setRing(cd, cdLeft / cdTotal * 100, '<span>' + s + '<small>秒</small></span>');
  cd.setAttribute('aria-label', cdLeft <= 0 ? '倒计时结束' : '倒计时，剩余 ' + s + ' 秒');
}
function cdStop() { clearInterval(cdTimer); cdTimer = null; cdToggle.innerHTML = ZH.iconHtml('play') + (cdLeft > 0 && cdLeft < cdTotal ? '继续' : '开始'); }
function cdStart() {
  if (cdLeft <= 0) cdLeft = cdTotal;
  cdLast = performance.now(); cdToggle.innerHTML = ZH.iconHtml('pause') + '暂停';
  cdTimer = setInterval(function () {
    var now = performance.now(); cdLeft = Math.max(0, cdLeft - (now - cdLast)); cdLast = now; cdPaint();
    if (cdLeft <= 0) { cdStop(); cdMsg.textContent = '倒计时结束'; }
  }, 100);
  cdMsg.textContent = '倒计时中…';
}
cdToggle.addEventListener('click', function () { if (cdTimer) { cdStop(); cdMsg.textContent = '已暂停'; } else cdStart(); });
function cdReset() { cdStop(); cdLeft = cdTotal; cdPaint(); cdMsg.textContent = '剩余 3 秒时变为警告色，结束时变为红色。'; }
root.querySelector('#cdReset').addEventListener('click', cdReset);
bindSeg('#cdLen', function (v) { cdTotal = +v * 1000; cdReset(); });
cdPaint();

/* ---------- Upload queue ---------- */
var FILES = [
  { name: '季度报告.pdf', size: '8.4 MB', icon: 'file-text', dur: 5 },
  { name: '封面图.png', size: '3.2 MB', icon: 'file-image', dur: 3 },
  { name: '数据备份.zip', size: '24.6 MB', icon: 'file-archive', dur: 9, failAt: 66 },
  { name: '录屏.mp4', size: '120 MB', icon: 'file-video', dur: 14 }
];
var upq = root.querySelector('#upq'), upLive = root.querySelector('#upqLive'), upAll = root.querySelector('#upqAll'), upTimer = null, rows = [];
function seed() { rows = FILES.map(function (f, i) { return { id: i, f: f, pct: 0, state: 'uploading', failed: false }; }); renderQueue(); tick(); }
function meta(r) {
  var left = Math.ceil((100 - r.pct) / (100 / (r.f.dur * 5)) * .2);
  return r.state === 'done' ? '已完成' : r.state === 'error' ? '上传失败 · ' + Math.round(r.pct) + '%' : r.state === 'paused' ? '已暂停 · ' + Math.round(r.pct) + '%' : Math.round(r.pct) + '% · 剩余 ' + left + ' 秒';
}
function actions(r) {
  var b = function (label, icon, act) { return '<button class="zh-btn sm icon text" data-act="' + act + '" aria-label="' + label + ' ' + ZH.esc(r.f.name) + '">' + ZH.iconHtml(icon) + '</button>'; };
  if (r.state === 'done') return b('移除', 'x', 'remove');
  if (r.state === 'error') return b('重试', 'refresh-cw', 'retry') + b('取消', 'x', 'remove');
  return b(r.state === 'paused' ? '继续' : '暂停', r.state === 'paused' ? 'play' : 'pause', 'toggle') + b('取消', 'x', 'remove');
}
function renderQueue() {
  upq.innerHTML = rows.map(function (r) {
    return '<li data-id="' + r.id + '" data-state="' + r.state + '"><span class="zh-upq-ico">' + ZH.iconHtml(r.f.icon, 18) + '</span><div><div class="zh-upq-name"><b>' + ZH.esc(r.f.name) + '</b><span class="zh-upq-meta"></span></div>' +
      '<div class="zh-progress" data-size="sm" data-label="none" data-name="' + ZH.esc(r.f.name) + ' 上传进度" data-value="' + r.pct + '"' + (r.state === 'error' ? ' data-status="exception"' : '') + '></div></div><div class="zh-upq-act">' + actions(r) + '</div></li>';
  }).join('');
  upq.querySelectorAll('.zh-progress').forEach(mountProgress);
  rows.forEach(function (r) { upq.querySelector('[data-id="' + r.id + '"] .zh-upq-meta').textContent = meta(r); });
  var running = rows.some(function (r) { return r.state === 'uploading'; });
  upAll.innerHTML = (running ? ZH.iconHtml('pause') + '全部暂停' : ZH.iconHtml('play') + '全部继续');
}
function paintRow(r) {
  var li = upq.querySelector('[data-id="' + r.id + '"]'); if (!li) return;
  setProgress(li.querySelector('.zh-progress'), r.pct); li.querySelector('.zh-upq-meta').textContent = meta(r);
}
function tick() {
  if (upTimer) return;
  upTimer = setInterval(function () {
    var active = rows.filter(function (r) { return r.state === 'uploading'; });
    if (!active.length) { clearInterval(upTimer); upTimer = null; return; }
    active.forEach(function (r) {
      r.pct = Math.min(100, r.pct + 100 / (r.f.dur * 5));
      if (r.f.failAt && !r.failed && r.pct >= r.f.failAt) { r.failed = true; r.state = 'error'; r.pct = r.f.failAt; renderQueue(); upLive.textContent = r.f.name + ' 上传失败'; return; }
      if (r.pct >= 100) { r.state = 'done'; renderQueue(); upLive.textContent = r.f.name + ' 上传完成'; return; }
      paintRow(r);
    });
  }, 200);
}
upq.addEventListener('click', function (e) {
  var b = e.target.closest('[data-act]'); if (!b) return;
  var li = b.closest('li'), r = rows.filter(function (x) { return x.id === +li.dataset.id; })[0], a = b.dataset.act;
  if (a === 'toggle') { r.state = r.state === 'paused' ? 'uploading' : 'paused'; renderQueue(); tick(); }
  else if (a === 'retry') { r.state = 'uploading'; renderQueue(); tick(); }
  else if (a === 'remove') { rows = rows.filter(function (x) { return x !== r; }); renderQueue(); upLive.textContent = r.f.name + ' 已移除'; }
  ZH.hydrateIcons(upq);
});
upAll.addEventListener('click', function () {
  var running = rows.some(function (r) { return r.state === 'uploading'; });
  rows.forEach(function (r) { if (running && r.state === 'uploading') r.state = 'paused'; else if (!running && r.state === 'paused') r.state = 'uploading'; });
  renderQueue(); tick();
});
root.querySelector('#upqRestart').addEventListener('click', function () { clearInterval(upTimer); upTimer = null; seed(); });
seed();

ZH.hydrateIcons(root);
