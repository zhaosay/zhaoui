var esc = ZH.esc, ic = ZH.iconHtml;
function $(id) { return document.getElementById(id); }
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function pad2(n) { return (n < 10 ? '0' : '') + n; }

/* stay pinned to the bottom only while the reader is there; otherwise offer "跳到最新" */
function pin(box, btn) {
  var pinned = true, user = false, down = false, ut;
  function near() { return box.scrollHeight - box.scrollTop - box.clientHeight < 24; }
  // Only a real gesture may release the pin; layout shifts (font size, resize) also fire "scroll" and must not.
  function mark() { user = true; clearTimeout(ut); ut = setTimeout(function () { user = false; }, 400); }
  // An explicit upward gesture releases the pin at once. WebKit scrolls asynchronously, so its scroll event can land
  // after the gesture window closes; waiting for that event let the next chunk drag the reader back down.
  box.addEventListener('wheel', function (e) { mark(); if (e.deltaY < 0) pinned = false; }, { passive: true });
  box.addEventListener('keydown', function (e) { mark(); if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'Home') pinned = false; }, { passive: true });
  ['touchstart', 'touchmove'].forEach(function (ev) { box.addEventListener(ev, mark, { passive: true }); });
  box.addEventListener('pointerdown', function () { down = true; mark(); }, { passive: true });
  window.addEventListener('pointerup', function () { down = false; });
  box.addEventListener('scroll', function () { if (!user && !down) return; pinned = near(); if (pinned) btn.hidden = true; }, { passive: true });
  if (window.ResizeObserver) new ResizeObserver(function () { if (pinned) box.scrollTop = box.scrollHeight; }).observe(box);
  btn.addEventListener('click', function () { pinned = true; btn.hidden = true; box.scrollTop = box.scrollHeight; box.focus({ preventScroll: true }); });
  return {
    stick: function (fresh) { if (pinned) box.scrollTop = box.scrollHeight; else if (fresh !== false) btn.hidden = false; },
    isPinned: function () { return pinned; },
    reset: function () { pinned = true; btn.hidden = true; box.scrollTop = box.scrollHeight; }
  };
}

var TITLES = ['组件库 2.0 发布：新增 12 个组件', '暗色模式最佳实践', '如何把 Token 编译成 CSS 变量', '无障碍检查清单', '图表配色与色盲友好', '表单校验的十个细节', '动效：什么时候该克制', '响应式：从断点到容器', '图标体系的统一规则', '从零搭建文档站', '权限呈现的三种方式', '设计走查怎么做'];
var TAGS = ['公告', '教程', '案例', '规范'], ICONS = ['file-text', 'book-open', 'lightbulb', 'palette'];
function itemHtml(n, cls, style) {
  var i = n - 1;
  return '<li class="zh-inf-item' + (cls || '') + '" tabindex="-1" data-n="' + n + '"' + (style ? ' style="' + style + '"' : '') + '><span class="zh-inf-ava" aria-hidden="true">' + ic(ICONS[i % 4], 18) + '</span><div class="zh-inf-main"><div class="zh-inf-title">' +
    esc(TITLES[i % TITLES.length]) + ' · ' + n + '</div><div class="zh-inf-meta">2026-09-' + pad2(29 - (i % 20)) + ' · 阅读 ' + (1200 + (i * 373) % 8800).toLocaleString('zh-CN') + '</div></div><span class="zh-tag">' + TAGS[i % 4] + '</span></li>';
}
function skRow() { return '<div class="zh-inf-sk"><span class="zh-skeleton" style="width:36px;height:36px;border-radius:50%"></span><div class="zh-stack" style="--g:8px"><span class="zh-skeleton" style="width:60%"></span><span class="zh-skeleton" style="width:35%"></span></div></div>'; }

/* ---------------- 1. infinite scroll ---------------- */
(function () {
  var box = $('zhInfBox'), list = $('zhInfList'), foot = $('zhInfFoot'), cnt = $('zhInfCount'), st = $('zhInfStatus'), failBox = $('zhInfFail');
  var page = 0, MAX = 5, PER = 8, loading = false, ended = false, failed = false, n = 0, io = null;
  function near() { var fr = foot.getBoundingClientRect(), br = box.getBoundingClientRect(); return fr.top < br.bottom + 120; }
  function load() {
    if (loading || ended) return;
    loading = true; box.setAttribute('aria-busy', 'true'); foot.innerHTML = skRow() + skRow() + skRow();
    sleep(700).then(function () {
      loading = false; box.setAttribute('aria-busy', 'false');
      if (page === 2 && failBox.checked && !failed) {
        failed = true;
        foot.innerHTML = '<div class="zh-inf-error" role="alert">' + ic('circle-x', 16) + '第 3 页加载失败<button type="button" class="zh-btn sm" data-retry>重试</button></div>'; ZH.hydrateIcons(foot);
        st.textContent = '第 3 页加载失败，已加载的 ' + n + ' 条保留，可点击重试'; return;
      }
      var h = ''; for (var i = 0; i < PER; i++) { n++; h += itemHtml(n, ' is-new', '--zh-i:' + i); }
      list.insertAdjacentHTML('beforeend', h); ZH.hydrateIcons(list); page++;
      cnt.innerHTML = n + '<span class="unit">条</span>'; st.textContent = '已加载 ' + n + ' 条，第 ' + page + ' / ' + MAX + ' 页';
      if (page >= MAX) { ended = true; if (io) io.disconnect(); foot.innerHTML = '<div class="zh-inf-end">' + ic('check-check', 16) + '已经到底了，共 ' + n + ' 条</div>'; ZH.hydrateIcons(foot); st.textContent = '已加载全部 ' + n + ' 条'; }
      else { foot.innerHTML = ''; requestAnimationFrame(function () { if (near()) load(); }); }
    });
  }
  foot.addEventListener('click', function (e) { if (e.target.closest('[data-retry]')) load(); });
  if ('IntersectionObserver' in window) { io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) load(); }, { root: box, rootMargin: '0px 0px 120px 0px' }); io.observe(foot); }
  else box.addEventListener('scroll', function () { if (near()) load(); }, { passive: true });
  $('zhInfReset').addEventListener('click', function () {
    list.innerHTML = ''; foot.innerHTML = ''; page = 0; n = 0; ended = false; failed = false; loading = false; box.scrollTop = 0; cnt.innerHTML = '0<span class="unit">条</span>';
    if (io) { io.disconnect(); io.observe(foot); } load();
  });
  $('zhInfTop').addEventListener('click', function () { box.scrollTo({ top: 0, behavior: ZH.reduced() ? 'auto' : 'smooth' }); });
})();

/* ---------------- 2. load-more button ---------------- */
(function () {
  var list = $('zhMoreList'), foot = $('zhMoreFoot'), n = 0, TOTAL = 17, PER = 5, busy = false;
  var live = document.createElement('div'); live.className = 'zh-stream-live'; live.setAttribute('role', 'status'); foot.parentNode.appendChild(live);
  function add(k) { var h = ''; for (var i = 0; i < k; i++) { n++; h += itemHtml(n, ' is-new', '--zh-i:' + i); } list.insertAdjacentHTML('beforeend', h); ZH.hydrateIcons(list); }
  function draw() {
    foot.innerHTML = n >= TOTAL ? '<span class="zh-inf-end" style="padding:6px">' + ic('check-check', 16) + '没有更多了，共 ' + n + ' 条</span>'
      : '<button type="button" class="zh-btn" data-more>' + ic('chevron-down', 16) + '加载更多（剩余 ' + (TOTAL - n) + ' 条）</button>';
    ZH.hydrateIcons(foot);
  }
  foot.addEventListener('click', function (e) {
    var b = e.target.closest('[data-more]'); if (!b || busy) return;
    busy = true; b.disabled = true; b.setAttribute('aria-busy', 'true'); b.innerHTML = ic('loader-circle', 16, 'zh-stream-spin') + '加载中…'; ZH.hydrateIcons(b);
    sleep(650).then(function () {
      var first = n + 1, k = Math.min(PER, TOTAL - n); add(k); busy = false; draw();
      live.textContent = '已加载 ' + k + ' 条，共 ' + n + ' 条';
      var el = list.querySelector('[data-n="' + first + '"]'); if (el) el.focus();
    });
  });
  add(5); draw();
})();

/* ---------------- 3. long list ---------------- */
(function () {
  var list = $('zhLngList'), cb = $('zhLngCv'), box = $('zhLngBox'), stat = $('zhLngStat');
  function build() {
    var t0 = performance.now(), h = '';
    for (var i = 1; i <= 2000; i++) h += '<li class="zh-lng-item"><span class="zh-lng-n">#' + i + '</span><span class="zh-inf-title" style="font-weight:500">' + esc(TITLES[i % TITLES.length]) + '</span><span class="zh-tag" style="margin-left:auto">' + TAGS[i % 4] + '</span></li>';
    list.innerHTML = h; box.classList.toggle('zh-lng-off', !cb.checked); void box.offsetHeight;
    stat.textContent = '2,000 行 · 构建并布局 ' + Math.round(performance.now() - t0) + ' ms · ' + (cb.checked ? '屏幕外行已跳过' : '全部参与布局');
  }
  cb.addEventListener('change', build); build();
})();

/* ---------------- 4. AI streaming ---------------- */
(function () {
  var FULL = [
    '## 设计系统落地建议', '',
    '先说结论：**先做 Token，再做组件**。可以分三步走：', '',
    '1. 统一颜色、间距、圆角，输出 `--zh-*` 变量',
    '2. 用 Token 搭出 Button、Input、Table 三个核心组件',
    '3. 写文档并加入可访问性检查', '',
    '下面是一个最小的 Token 示例：', '',
    '```css', ':root {', '  --zh-color-primary: #5868ee;', '  --zh-radius-md: 6px;', '  --zh-space-4: 16px;', '}', '```', '',
    '## 落地时最容易踩的坑', '',
    '- 每个组件都要覆盖 hover、focus、disabled 三种状态',
    '- 暗色模式不是「反色」，而是重新选色并检查对比度',
    '- 图标只用一套库，不要混用',
    '- 先在真实页面里用起来，再抽象成规范', '',
    '需要我把其中某一步展开成检查清单吗？'
  ].join('\n');
  var body = $('zhAiBody'), md = $('zhAiMd'), stateEl = $('zhAiState'), tokEl = $('zhAiTok'), go = $('zhAiGo'), re = $('zhAiRe'), copy = $('zhAiCopy'), jump = $('zhAiJump'), live = $('zhAiLive'), errBox = $('zhAiErr'), speedSeg = $('zhAiSpeed');
  var pinner = pin(body, jump), pos = 0, state = 'idle', timer = null, speed = 32, t0 = 0, errAt = 0;

  function inline(t) { return esc(t).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>'); }
  function codeBlock(lang, lines) { return '<div class="zh-ai-code"><div class="zh-ai-code-h">' + esc(lang || 'text') + '</div><pre><code>' + esc(lines.join('\n')) + '</code></pre></div>'; }
  function mdRender(src) {
    var out = [], inCode = false, code = [], lang = '', list = null;
    function close() { if (list) { out.push('</' + list + '>'); list = null; } }
    src.split('\n').forEach(function (l) {
      var f = l.match(/^```(\w*)/);
      if (f) { if (!inCode) { close(); inCode = true; lang = f[1]; code = []; } else { out.push(codeBlock(lang, code)); inCode = false; } return; }
      if (inCode) { code.push(l); return; }
      var h = l.match(/^(#{1,3})\s+(.*)/); if (h) { close(); out.push('<div class="zh-ai-h" role="heading" aria-level="4">' + inline(h[2]) + '</div>'); return; }
      var ul = l.match(/^[-*]\s+(.*)/), ol = l.match(/^\d+\.\s+(.*)/);
      if (ul || ol) { var tag = ul ? 'ul' : 'ol'; if (list !== tag) { close(); out.push('<' + tag + '>'); list = tag; } out.push('<li>' + inline((ul || ol)[1]) + '</li>'); return; }
      close(); if (l.trim() === '') return; out.push('<p>' + inline(l) + '</p>');
    });
    if (inCode) out.push(codeBlock(lang, code)); // an unclosed fence while streaming is still safe
    close(); return out.join('');
  }
  var LABEL = { idle: ['空闲', ''], streaming: ['生成中', 'primary'], stopped: ['已停止', 'warning'], done: ['已完成', 'success'], error: ['连接中断', 'danger'] };
  function tokens() { return Math.round(pos / 1.6); }
  function warn(msg) { return '<div class="zh-ai-warn" role="status">' + ic(state === 'error' ? 'wifi-off' : 'circle-pause', 16) + '<span>' + msg + '</span><button type="button" class="zh-btn sm" data-ai="resume">' + ic('play', 14) + '继续生成</button><button type="button" class="zh-btn sm" data-ai="redo">重新生成</button></div>'; }
  function view() {
    var html = mdRender(FULL.slice(0, pos) + (state === 'streaming' ? '\u0001' : ''));
    html = html.replace('\u0001', '<span class="zh-ai-cursor" aria-hidden="true"></span>');
    if (state === 'stopped') html += warn('已停止生成，已保留 ' + tokens() + ' 个 token');
    if (state === 'error') html += warn('连接中断，已生成的内容已保留');
    if (state === 'idle') html = '<p class="zh-hint" style="margin:0">点击下方「生成」，体验逐字输出、停止、继续与重新生成。</p>';
    md.innerHTML = html; ZH.hydrateIcons(md); pinner.stick();
    var l = LABEL[state]; stateEl.className = 'zh-tag' + (l[1] ? ' ' + l[1] : ''); stateEl.textContent = l[0];
    var sec = (Date.now() - t0) / 1000; tokEl.textContent = pos ? '≈ ' + tokens() + ' tokens' + (state === 'streaming' && sec > 0.5 ? ' · ' + Math.round(tokens() / sec) + '/s' : '') : '';
    var streaming = state === 'streaming';
    go.innerHTML = streaming ? ic('circle-stop', 16) + '停止' : (state === 'stopped' || state === 'error') ? ic('play', 16) + '继续生成' : ic('play', 16) + '生成';
    go.className = 'zh-btn sm ' + (streaming ? 'danger' : 'primary'); ZH.hydrateIcons(go);
    re.disabled = !pos; copy.disabled = !pos; body.setAttribute('aria-busy', String(streaming));
  }
  function tick() {
    if (state !== 'streaming') return;
    var step = speed > 50 ? 1 + Math.floor(Math.random() * 2) : speed > 20 ? 2 + Math.floor(Math.random() * 3) : 4 + Math.floor(Math.random() * 5);
    pos = Math.min(FULL.length, pos + step);
    if (errAt && pos >= errAt) { pos = errAt; errAt = 0; state = 'error'; live.textContent = '连接中断，已保留已生成的内容，可继续生成'; view(); return; }
    if (pos >= FULL.length) { state = 'done'; live.textContent = '生成完成，约 ' + tokens() + ' 个 token'; view(); return; }
    view(); timer = setTimeout(tick, speed);
  }
  function start() { clearTimeout(timer); pos = 0; state = 'streaming'; errAt = errBox.checked ? Math.floor(FULL.length * 0.6) : 0; t0 = Date.now(); live.textContent = '开始生成'; pinner.reset(); view(); timer = setTimeout(tick, 200); }
  function resume() { clearTimeout(timer); state = 'streaming'; errAt = 0; live.textContent = '继续生成'; view(); timer = setTimeout(tick, 150); }
  function stop() { clearTimeout(timer); state = 'stopped'; live.textContent = '已停止生成'; view(); }
  go.addEventListener('click', function () { if (state === 'streaming') stop(); else if (state === 'stopped' || state === 'error') resume(); else start(); });
  re.addEventListener('click', start);
  md.addEventListener('click', function (e) { var b = e.target.closest('[data-ai]'); if (!b) return; if (b.getAttribute('data-ai') === 'resume') resume(); else start(); });
  copy.addEventListener('click', function () {
    var t = FULL.slice(0, pos);
    var p = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(t) : new Promise(function (res, rej) { var ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (x) { } ta.remove(); ok ? res() : rej(); });
    p.then(function () { ZH.toast('已复制 ' + t.length + ' 个字符'); }, function () { ZH.toast('复制失败，请手动选择文字'); });
  });
  speedSeg.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; speed = +b.getAttribute('data-v'); speedSeg.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); });
  (window.ZHStream = window.ZHStream || {}).md = mdRender;
  view();
})();

/* ---------------- 5. live log tail ---------------- */
(function () {
  var box = $('zhLogBox'), stat = $('zhLogStat'), pauseBtn = $('zhLogPause'), clearBtn = $('zhLogClear'), filt = $('zhLogFilter'), jump = $('zhLogJump');
  var MAX = 200, BUF = 400, buf = [], shown = 0, cut = 0, paused = false, missed = 0, level = 'all', n = 0, visible = true, pinner = pin(box, jump);
  var MSGS = { info: ['GET /api/orders 200 12ms', '缓存命中 user:1024', '任务 sync-inventory 已完成', '连接池空闲 8/20', '收到 webhook payment.succeeded', '会话续期 sid=a83f'], warn: ['响应变慢：GET /api/report 1.8s', '重试第 2 次：inventory-service', '磁盘使用率 82%'], error: ['POST /api/pay 502 上游超时', '数据库连接被重置', '队列积压 1,204 条'] };
  var LV = { info: ['info', 'INFO'], warn: ['triangle-alert', 'WARN'], error: ['circle-x', 'ERROR'] };
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function make() { var r = Math.random(), lv = r < .72 ? 'info' : r < .92 ? 'warn' : 'error', d = new Date(); n++; return { id: n, lv: lv, t: pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds()), m: pick(MSGS[lv]) }; }
  function lineHtml(l) { return '<div class="zh-log-line is-' + l.lv + '" data-id="' + l.id + '"><span class="zh-log-t">' + l.t + '</span><span class="zh-log-lv">' + ic(LV[l.lv][0], 13) + LV[l.lv][1] + '</span><span class="zh-log-m">' + esc(l.m) + '</span></div>'; }
  function cutEl() { var c = box.querySelector('.zh-log-cut'); if (!c) { c = document.createElement('div'); c.className = 'zh-log-cut'; box.insertBefore(c, box.firstChild); } c.textContent = '已截断较早的 ' + cut + ' 行日志'; }
  function stats() { stat.textContent = '共 ' + buf.length + ' 条缓存 · 显示 ' + shown + ' 行' + (paused ? ' · 已暂停，新增 ' + missed + ' 条' : ''); }
  function renderAll() {
    var m = buf.filter(function (l) { return level === 'all' || l.lv === level; }), vis = m.slice(-MAX);
    shown = vis.length; cut = m.length - vis.length;
    box.innerHTML = (cut ? '<div class="zh-log-cut">已截断较早的 ' + cut + ' 行日志</div>' : '') + vis.map(lineHtml).join(''); ZH.hydrateIcons(box); pinner.reset(); stats();
  }
  function add(l) {
    buf.push(l); if (buf.length > BUF) buf.shift();
    if (paused) { missed++; stats(); return; }
    if (level !== 'all' && l.lv !== level) { stats(); return; }
    box.insertAdjacentHTML('beforeend', lineHtml(l)); ZH.hydrateIcons(box.lastElementChild); shown++;
    while (shown > MAX) {
      var first = box.querySelector('.zh-log-line'), h = first.offsetHeight; first.remove(); shown--; cut++;
      if (!pinner.isPinned()) box.scrollTop = Math.max(0, box.scrollTop - h); // overflow-anchor is off, so keep the reader's place ourselves
    }
    if (cut) cutEl();
    pinner.stick(); stats();
  }
  pauseBtn.addEventListener('click', function () {
    paused = !paused; missed = 0;
    pauseBtn.innerHTML = paused ? ic('play', 14) + '继续' : ic('pause', 14) + '暂停'; ZH.hydrateIcons(pauseBtn);
    pauseBtn.setAttribute('aria-pressed', String(paused));
    if (!paused) renderAll(); else stats();
  });
  clearBtn.addEventListener('click', function () { buf = []; shown = 0; cut = 0; missed = 0; box.innerHTML = ''; stats(); });
  filt.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; level = b.getAttribute('data-v'); filt.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); renderAll(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(box);
  (window.ZHStream = window.ZHStream || {}).logPush = function (k) { for (var j = 0; j < k; j++) add(make()); };
  for (var i = 0; i < 14; i++) buf.push(make());
  renderAll(); requestAnimationFrame(function () { pinner.reset(); });
  (function loop() { if (visible && !document.hidden) add(make()); setTimeout(loop, 350 + Math.random() * 400); })();
})();

/* ---------------- 6. progressive reveal ---------------- */
(function () {
  var list = $('zhProgList'), btn = $('zhProgGo'), timer;
  function show() { var h = ''; for (var i = 0; i < 6; i++) h += itemHtml(i + 1, ' zh-prog-row is-in', '--zh-i:' + i); list.innerHTML = h; ZH.hydrateIcons(list); list.setAttribute('aria-busy', 'false'); }
  function reload() {
    clearTimeout(timer); list.setAttribute('aria-busy', 'true');
    var h = ''; for (var i = 0; i < 6; i++) h += '<li class="zh-inf-item" aria-hidden="true"><span class="zh-skeleton" style="width:36px;height:36px;border-radius:50%"></span><div class="zh-stack" style="--g:8px;flex:1"><span class="zh-skeleton" style="width:60%"></span><span class="zh-skeleton" style="width:35%"></span></div></li>';
    list.innerHTML = h; timer = setTimeout(show, 900);
  }
  btn.addEventListener('click', reload); show();
})();

/* ---------------- 7. optimistic append ---------------- */
(function () {
  var list = $('zhOptList'), form = $('zhOptForm'), inp = $('zhOptIn'), failCb = $('zhOptFail'), jump = $('zhOptJump'), pinner = pin(list, jump);
  function status(el, st) {
    el.classList.remove('is-sending', 'is-error'); var s = el.querySelector('.zh-opt-st');
    if (st === 'sending') { el.classList.add('is-sending'); s.innerHTML = ic('loader-circle', 12, 'zh-stream-spin') + '发送中…'; }
    else if (st === 'done') s.innerHTML = ic('check-check', 12) + '已发送';
    else if (st === 'error') { el.classList.add('is-error'); s.innerHTML = ic('circle-x', 12) + '发送失败<button type="button" data-act="retry">重试</button>·<button type="button" data-act="del">删除</button>'; }
    ZH.hydrateIcons(s);
  }
  function add(who, text, st) {
    var el = document.createElement('div'); el.className = 'zh-opt-msg' + (who === 'in' ? ' is-in' : '');
    el.innerHTML = '<div class="zh-opt-bub"></div><div class="zh-opt-st"></div>'; el.querySelector('.zh-opt-bub').textContent = text;
    list.appendChild(el); if (st) status(el, st); else el.querySelector('.zh-opt-st').textContent = '客服 · 10:24'; return el;
  }
  function send(el) { status(el, 'sending'); sleep(900).then(function () { if (el._fail) { el._fail = false; status(el, 'error'); } else status(el, 'done'); pinner.stick(false); }); }
  add('in', '你好，订单 #20260929 发货了吗？'); add('out', '已发货，预计明天送达。', 'done'); pinner.reset();
  form.addEventListener('submit', function () {
    var t = inp.value.trim(); if (!t) return;
    inp.value = ''; var el = add('out', t, 'sending'); el._fail = failCb.checked; failCb.checked = false; pinner.reset(); send(el);
  });
  list.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return; var el = b.closest('.zh-opt-msg');
    if (b.getAttribute('data-act') === 'del') el.remove(); else send(el);
  });
})();
