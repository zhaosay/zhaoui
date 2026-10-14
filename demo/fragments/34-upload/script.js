var sec = document.getElementById('upload'); if (!sec) return;
var ICON = { png: 'file-image', jpg: 'file-image', jpeg: 'file-image', gif: 'file-image', webp: 'file-image', svg: 'file-image', bmp: 'file-image', mp4: 'file-video', mov: 'file-video', webm: 'file-video', mp3: 'file-audio', wav: 'file-audio', m4a: 'file-audio', zip: 'file-archive', rar: 'file-archive', '7z': 'file-archive', gz: 'file-archive', xls: 'file-spreadsheet', xlsx: 'file-spreadsheet', csv: 'file-spreadsheet', js: 'file-code', ts: 'file-code', html: 'file-code', css: 'file-code', json: 'file-json', pdf: 'file-text', doc: 'file-text', docx: 'file-text', txt: 'file-text', md: 'file-text' };
var extOf = function (n) { var m = /\.([a-z0-9]+)$/i.exec(n || ''); return m ? m[1].toLowerCase() : ''; };
var iconOf = function (n) { return ICON[extOf(n)] || 'file'; };
var isImg = function (f) { return /^image\//.test(f.type) || /^(png|jpe?g|gif|webp|bmp|svg)$/.test(extOf(f.name)); };
var fmtBytes = function (n) { return n < 1024 ? Math.round(n) + ' B' : n < 1048576 ? (n / 1024).toFixed(n < 102400 ? 1 : 0) + ' KB' : (n / 1048576).toFixed(1) + ' MB'; };
var urls = [];
var mkUrl = function (f) { var u = URL.createObjectURL(f); urls.push(u); return u; };
var freeUrl = function (u) { if (!u) return; var i = urls.indexOf(u); if (i >= 0) urls.splice(i, 1); URL.revokeObjectURL(u); };
window.addEventListener('pagehide', function () { urls.slice().forEach(freeUrl); });

/* 预览弹层（只建一次） */
var pv = null, pvFrom = null;
function preview(item, trigger) {
  if (!pv) {
    pv = document.createElement('dialog'); pv.className = 'zh-modal zh-upload-pv'; pv.setAttribute('aria-labelledby', 'up-pv-t');
    pv.innerHTML = '<header id="up-pv-t"></header><div class="body" style="text-align:center"></div><footer><button type="button" class="zh-btn">关闭</button></footer>';
    document.body.appendChild(pv);
    pv.querySelector('footer button').addEventListener('click', function () { pv.close(); });
    pv.addEventListener('click', function (e) { if (e.target === pv) pv.close(); });
    pv.addEventListener('close', function () { if (pvFrom && pvFrom.focus) pvFrom.focus(); });
  }
  pv.style.width = 'min(720px, calc(100vw - 32px))';
  pv.querySelector('header').textContent = item.name;
  var body = pv.querySelector('.body');
  if (item.isImg) body.innerHTML = '<img alt="" style="max-width:100%;max-height:60vh;border-radius:8px;object-fit:contain">'; else body.innerHTML = ZH.iconHtml(iconOf(item.name), 48) + '<div class="zh-hint" style="margin-top:8px">暂不支持预览该类型的文件</div>';
  if (item.isImg) { var im = body.querySelector('img'); im.src = item.url; im.alt = item.name; }
  pvFrom = trigger || document.activeElement; pv.showModal();
}

function Upload(root) {
  var d = root.dataset, mode = d.mode || 'list', maxN = d.max ? +d.max : Infinity, maxMB = d.maxMb ? +d.maxMb : Infinity;
  var accept = (d.accept || '').toLowerCase().split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var disabled = d.disabled != null;
  var input = root.querySelector('.zh-upload-input'), drop = root.querySelector('.zh-upload-drop') || root.querySelector('.zh-upload-add') || root.querySelector('.zh-upload-avatar');
  var list = root.querySelector('.zh-upload-list, .zh-upload-cards'), errBox = root.querySelector('.zh-upload-errors'), live = root.querySelector('.zh-upload-sr');
  var countEl = root.querySelector('.zh-upload-count'), addBtn = root.querySelector('.zh-upload-add'), avatarBtn = root.querySelector('.zh-upload-avatar'), rmBtn = root.querySelector('[data-act="remove"]');
  var items = [], seq = 0, running = 0, MAXPAR = 3;
  var say = function (t) { if (live) live.textContent = t; };
  if (disabled || !input) return;

  function typeOk(f) {
    if (!accept.length) return true;
    var e = '.' + extOf(f.name), t = (f.type || '').toLowerCase();
    return accept.some(function (a) { return a === e || (a.slice(-2) === '/*' ? t.indexOf(a.slice(0, -1)) === 0 : a === t); });
  }
  function reason(f) {
    if (!typeOk(f)) return '类型不支持' + (accept.length ? '（仅支持 ' + accept.join(' ') + '）' : '');
    if (f.size > maxMB * 1048576) return '超过 ' + maxMB + ' MB（当前 ' + fmtBytes(f.size) + '）';
    if (items.some(function (i) { return i.name === f.name && i.size === f.size; })) return '已在列表中';
    return '';
  }
  function showErrors(errs) {
    if (!errBox) return;
    errBox.innerHTML = errs.map(function (e) { return '<div class="zh-upload-err">' + ZH.iconHtml('circle-alert', 16) + '<span>' + ZH.esc(e) + '</span></div>'; }).join('');
    if (errs.length && mode !== 'avatar') { var x = document.createElement('button'); x.type = 'button'; x.className = 'zh-btn text sm zh-upload-errx'; x.textContent = '知道了'; x.addEventListener('click', function () { errBox.innerHTML = ''; }); errBox.firstChild.appendChild(x); }
  }
  function count() {
    if (!countEl) return;
    var unit = mode === 'card' ? '张' : '个', tail = mode === 'card' ? ' · 悬停或聚焦图片可预览、删除' : '';
    countEl.textContent = '已添加 ' + items.length + ' / ' + (isFinite(maxN) ? maxN : '∞') + ' ' + unit + tail;
    if (addBtn) addBtn.disabled = items.length >= maxN;
  }

  function addFiles(files) {
    var errs = [];
    files = [].slice.call(files);
    files.forEach(function (f) {
      if (mode === 'avatar') { var r0 = !typeOk(f) ? '请选择图片文件' : f.size > maxMB * 1048576 ? '图片超过 ' + maxMB + ' MB（当前 ' + fmtBytes(f.size) + '）' : ''; if (r0) { errs.push(f.name + '：' + r0); return; } if (items.length) remove(items[0], true); make(f); return; }
      if (items.length >= maxN) { errs.push(f.name + '：已达上限（最多 ' + maxN + (mode === 'card' ? ' 张' : ' 个') + '）'); return; }
      var r = reason(f); if (r) { errs.push(f.name + '：' + r); return; }
      make(f);
    });
    showErrors(errs); count(); pump();
    if (errs.length) say('有 ' + errs.length + ' 个文件未通过校验'); else if (files.length) say('已添加 ' + files.length + ' 个文件');
  }
  function make(f) {
    var it = { id: ++seq, file: f, name: f.name, size: f.size, isImg: isImg(f), state: 'queued', loaded: 0, speed: 0, retried: false, failAt: 0, timer: null, url: null };
    if (mode !== 'list' && it.isImg) it.url = mkUrl(f);
    if (it.isImg && !it.url && mode === 'list') it.url = null;
    it.fail = /fail/i.test(f.name);
    items.push(it); build(it);
  }
  function pump() { items.forEach(function (it) { if (it.state === 'queued' && running < MAXPAR) begin(it); }); }
  function begin(it) {
    var mul = +root.dataset.speed || 1, dur = (mode === 'avatar' ? 900 : 1800 + Math.random() * 2200) / mul, last = Date.now();
    it.state = 'uploading'; running++; it.t0 = last; it.failAt = it.fail && !it.retried ? 0.3 + Math.random() * 0.4 : 0;
    it.rate = it.size / dur; paint(it);
    it.timer = setInterval(function () {
      var now = Date.now(), dt = now - last; last = now;
      it.loaded = Math.min(it.size, it.loaded + it.rate * dt * (0.75 + Math.random() * 0.5));
      it.speed = it.rate * 1000 * (0.85 + Math.random() * 0.3);
      if (it.failAt && it.loaded / it.size >= it.failAt) return finish(it, 'error');
      if (it.loaded >= it.size) return finish(it, 'done');
      paint(it);
    }, 80);
  }
  function finish(it, st) {
    clearInterval(it.timer); it.timer = null; running = Math.max(0, running - 1); it.state = st; if (st === 'done') it.loaded = it.size;
    paint(it); say(it.name + (st === 'done' ? ' 上传完成' : ' 上传失败'));
    if (mode === 'avatar' && st === 'done') ZH.toast('头像已更新');
    pump();
  }
  function retry(it) { it.retried = true; it.loaded = 0; it.state = 'queued'; paint(it); pump(); }
  function remove(it, silent) {
    if (it.timer) { clearInterval(it.timer); it.timer = null; running = Math.max(0, running - 1); }
    freeUrl(it.url); var i = items.indexOf(it), wasUp = it.state === 'uploading';
    items.splice(i, 1); if (it.el) it.el.remove();
    if (mode === 'avatar') paintAvatar();
    if (!silent) {
      say(it.name + (wasUp ? ' 已取消' : ' 已移除')); count();
      var nxt = items[Math.min(i, items.length - 1)]; var f = nxt && nxt.el && nxt.el.querySelector('button'); (f || drop || avatarBtn).focus();
      pump();
    }
  }

  /* ---- 渲染 ---- */
  var pct = function (it) { return Math.round(it.loaded / it.size * 100); };
  var eta = function (it) { var s = Math.max(1, Math.ceil((it.size - it.loaded) / Math.max(1, it.speed || it.rate * 1000))); return s; };
  function statusText(it) {
    if (it.state === 'queued') return it.retried ? '等待重试' : '等待上传';
    if (it.state === 'uploading') return '上传中 ' + pct(it) + '% · ' + fmtBytes(it.speed) + '/s · 剩余 ' + eta(it) + ' 秒';
    if (it.state === 'done') return '上传完成';
    return '上传失败（网络中断），可重试';
  }
  function actionBtns(it) {
    var n = ZH.esc(it.name), b = function (act, icon, label) { return '<button type="button" class="zh-btn text icon sm" data-act="' + act + '" aria-label="' + label + ' ' + n + '">' + ZH.iconHtml(icon, 18) + '</button>'; };
    if (it.state === 'uploading' || it.state === 'queued') return b('cancel', 'x', '取消上传');
    if (it.state === 'error') return b('retry', 'refresh-cw', '重试上传') + b('remove', 'trash-2', '移除');
    return b('remove', 'trash-2', '移除');
  }
  function build(it) {
    var li = document.createElement('li'); li.dataset.id = it.id; it.el = li;
    if (mode === 'list') { li.className = 'zh-upload-item'; list.appendChild(li); }
    else if (mode === 'card') { li.className = 'zh-upload-card'; list.insertBefore(li, list.lastElementChild); }
    if (mode !== 'avatar') paint(it); else paintAvatar();
  }
  function paint(it) {
    if (mode === 'avatar') return paintAvatar();
    var li = it.el; if (!li) return;
    var n = ZH.esc(it.name), st = it.state;
    li.classList.remove('is-queued', 'is-uploading', 'is-done', 'is-error'); li.classList.add('is-' + st);
    if (mode === 'list') {
      var icon = st === 'done' ? 'circle-check' : st === 'error' ? 'circle-alert' : iconOf(it.name);
      if (!li.firstChild || li.dataset.st !== st) {
        li.dataset.st = st;
        li.innerHTML = '<span class="zh-upload-ico">' + ZH.iconHtml(icon, 20) + '</span><div style="min-width:0"><div class="zh-upload-name" title="' + n + '">' + n + '</div><div class="zh-upload-meta"><span>' + fmtBytes(it.size) + '</span><span class="zh-upload-status"></span></div><div class="zh-upload-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-label="' + n + ' 上传进度"><i></i></div></div><div class="zh-upload-actions">' + actionBtns(it) + '</div>';
      }
      li.querySelector('.zh-upload-status').textContent = statusText(it);
      var bar = li.querySelector('.zh-upload-bar'); bar.setAttribute('aria-valuenow', pct(it)); bar.firstChild.style.width = pct(it) + '%';
    } else {
      if (!li.dataset.built) {
        li.dataset.built = '1';
        var media = it.isImg ? '<img alt="' + n + '" src="' + it.url + '">' : '<div class="zh-upload-file">' + ZH.iconHtml(iconOf(it.name), 32) + '<span>' + ZH.esc(extOf(it.name).toUpperCase() || '文件') + '</span></div>';
        li.innerHTML = media + '<div class="zh-upload-cardx"></div>';
      }
      var x = li.querySelector('.zh-upload-cardx');
      var b = function (act, icon, label) { return '<button type="button" class="zh-upload-card-btn" data-act="' + act + '" aria-label="' + label + ' ' + n + '">' + ZH.iconHtml(icon, 16) + '</button>'; };
      var ov = '<div class="zh-upload-card-ov">' + (st === 'error' ? b('retry', 'refresh-cw', '重试上传') : (it.isImg || true) && st === 'done' ? b('preview', 'eye', '预览') : '') + b(st === 'uploading' || st === 'queued' ? 'cancel' : 'remove', st === 'uploading' || st === 'queued' ? 'x' : 'trash-2', st === 'uploading' || st === 'queued' ? '取消上传' : '删除') + '</div>';
      var prog = st === 'uploading' || st === 'queued' ? '<div class="zh-upload-card-prog"><span>' + (st === 'queued' ? '等待中' : pct(it) + '%') + '</span><div class="zh-upload-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct(it) + '" aria-label="' + n + ' 上传进度"><i style="width:' + pct(it) + '%"></i></div></div>' : '';
      var err = st === 'error' ? '<div class="zh-upload-card-err">' + ZH.iconHtml('circle-alert', 14) + '上传失败</div>' : '';
      var key = st + (st === 'uploading' ? '' : '');
      if (li.dataset.st !== st) { li.dataset.st = st; x.innerHTML = ov + err + prog; }
      else if (prog) { var bi = x.querySelector('.zh-upload-bar'); if (bi) { bi.setAttribute('aria-valuenow', pct(it)); bi.firstChild.style.width = pct(it) + '%'; x.querySelector('.zh-upload-card-prog span').textContent = pct(it) + '%'; } }
    }
  }
  function paintAvatar() {
    var it = items[0];
    avatarBtn.classList.toggle('is-loading', !!it && it.state === 'uploading');
    var ph = avatarBtn.querySelector('.zh-upload-avatar-ph'), img = avatarBtn.querySelector('img');
    if (it && it.isImg) {
      if (!it.url) it.url = mkUrl(it.file);
      if (!img) { img = document.createElement('img'); avatarBtn.insertBefore(img, avatarBtn.firstChild); }
      img.src = it.url; img.alt = '头像预览'; ph.hidden = true;
    } else { if (img) img.remove(); ph.hidden = false; }
    var ov = avatarBtn.querySelector('.zh-upload-avatar-ov');
    ov.innerHTML = ZH.iconHtml(it && it.state === 'uploading' ? 'loader-circle' : 'camera', 20) + '<span>' + (it && it.state === 'uploading' ? '上传中' : '更换') + '</span>';
    if (rmBtn) rmBtn.hidden = !it;
    avatarBtn.setAttribute('aria-label', it ? '更换头像，当前' + (it.state === 'uploading' ? '正在上传' : '已设置') : '上传头像，点击选择图片');
  }

  /* ---- 事件 ---- */
  var pick = function () { input.click(); };
  if (drop && mode !== 'avatar') {
    drop.addEventListener('click', function (e) { if (!e.target.closest('.zh-upload-errx')) pick(); });
    drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  }
  if (avatarBtn) avatarBtn.addEventListener('click', pick);
  input.addEventListener('change', function () { var fs = [].slice.call(input.files); input.value = ''; if (fs.length) addFiles(fs); });
  var zone = mode === 'card' ? root.querySelector('.zh-upload-cards') : (mode === 'avatar' ? root : drop);
  var over = zone === drop ? drop : (addBtn || avatarBtn), depth = 0;
  var hasFiles = function (e) { return e.dataTransfer && [].slice.call(e.dataTransfer.types || []).indexOf('Files') >= 0; };
  zone.addEventListener('dragenter', function (e) { if (!hasFiles(e)) return; e.preventDefault(); depth++; over.classList.add('is-over'); });
  zone.addEventListener('dragover', function (e) { if (!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; over.classList.add('is-over'); });
  zone.addEventListener('dragleave', function () { depth = Math.max(0, depth - 1); if (!depth) over.classList.remove('is-over'); });
  zone.addEventListener('drop', function (e) { e.preventDefault(); depth = 0; over.classList.remove('is-over'); if (e.dataTransfer && e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });
  [drop, addBtn].forEach(function (t) {
    if (!t) return;
    t.addEventListener('paste', function (e) {
      var fs = [].slice.call((e.clipboardData && e.clipboardData.files) || []); if (!fs.length) return; e.preventDefault();
      addFiles(fs.map(function (f) { return !f.name || /^image\.(png|jpe?g)$/i.test(f.name) ? new File([f], 'pasted-' + Date.now() + '.png', { type: f.type }) : f; }));
    });
  });
  if (list) list.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var li = b.closest('[data-id]'), it = items.filter(function (x) { return x.id === +li.dataset.id; })[0]; if (!it) return;
    var act = b.dataset.act;
    if (act === 'cancel' || act === 'remove') remove(it); else if (act === 'retry') retry(it); else if (act === 'preview') preview(it, b);
  });
  if (rmBtn) rmBtn.addEventListener('click', function () { if (items[0]) { remove(items[0], true); showErrors([]); count(); say('头像已移除'); avatarBtn.focus(); } });
  if (mode === 'avatar') paintAvatar();
  count();
}

[].slice.call(sec.querySelectorAll('.zh-upload')).forEach(Upload);

/* 文件夹上传 */
(function () {
  var btn = document.getElementById('up-dirbtn'), inp = document.getElementById('up-dir'), out = document.getElementById('up-dirout'), ul = document.getElementById('up-dirlist');
  if (!btn || !inp) return;
  btn.addEventListener('click', function () { inp.click(); });
  inp.addEventListener('change', function () {
    var fs = [].slice.call(inp.files); if (!fs.length) return;
    var total = fs.reduce(function (s, f) { return s + f.size; }, 0), first = fs[0].webkitRelativePath || fs[0].name, folder = first.indexOf('/') > 0 ? first.split('/')[0] : '';
    out.textContent = '已选择 ' + fs.length + ' 个文件，共 ' + fmtBytes(total) + (folder ? '（文件夹“' + folder + '”）' : '');
    ul.hidden = false; ul.innerHTML = '';
    fs.slice(0, 5).forEach(function (f) { var li = document.createElement('li'); li.textContent = f.webkitRelativePath || f.name; ul.appendChild(li); });
    if (fs.length > 5) { var m = document.createElement('li'); m.textContent = '… 等 ' + (fs.length - 5) + ' 个文件'; ul.appendChild(m); }
    inp.value = '';
  });
})();

ZH.hydrateIcons(sec);
