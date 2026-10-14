// Upload (list mode): a drop zone plus a file list with progress.  Checks type, size and count; uploads with XHR to data-action or with your own function.
// Without either, files are only collected: read them with ZhaoUI.upload.files(el) when the form is submitted.
ZhaoUI.component('upload', { selector: '[data-zh-upload]', init: function (root) {
  var max = +(root.getAttribute('data-max') || 0), maxBytes = (+(root.getAttribute('data-max-mb') || 0)) * 1048576, multiple = max !== 1;
  var accept = (root.getAttribute('data-accept') || '').split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
  var items = [], seq = 0, action = root.getAttribute('data-action'), field = root.getAttribute('data-field') || 'file', custom = null;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n) { return n < 1024 ? Math.round(n) + ' B' : n < 1048576 ? (n / 1024).toFixed(n < 102400 ? 1 : 0) + ' KB' : (n / 1048576).toFixed(1) + ' MB'; }

  var drop = root.querySelector('.zh-upload-drop');
  if (!drop) { drop = document.createElement('div'); drop.className = 'zh-upload-drop'; drop.innerHTML = '<i data-i="cloud-upload" data-s="32"></i><div class="zh-upload-title">拖拽文件到此处，或 <span class="zh-upload-link">点击选择</span></div>' + (root.getAttribute('data-hint') ? '<div class="zh-upload-hint">' + esc(root.getAttribute('data-hint')) + '</div>' : ''); root.insertBefore(drop, root.firstChild); }
  drop.setAttribute('role', 'button'); drop.tabIndex = 0; if (!drop.hasAttribute('aria-label')) drop.setAttribute('aria-label', '上传文件：点击选择，或把文件拖到此处');
  var input = root.querySelector('input[type=file]') || root.appendChild(document.createElement('input')); input.type = 'file'; input.multiple = multiple; input.hidden = true; input.tabIndex = -1; input.setAttribute('aria-hidden', 'true'); if (accept.length) input.accept = accept.join(',');
  var foot = root.querySelector('.zh-upload-foot'), put = function (el) { return foot ? root.insertBefore(el, foot) : root.appendChild(el); };
  var errs = root.querySelector('.zh-upload-errors') || put(Object.assign(document.createElement('div'), { className: 'zh-upload-errors' })); errs.setAttribute('role', 'alert');
  var list = root.querySelector('.zh-upload-list') || put(Object.assign(document.createElement('ul'), { className: 'zh-upload-list' })); list.setAttribute('aria-label', '文件列表');
  var count = root.querySelector('.zh-upload-count'); ZH.hydrateIcons(root);

  function ok(f) {
    var name = f.name.toLowerCase(), ext = '.' + name.split('.').pop();
    if (accept.length && !accept.some(function (a) { return a === ext || (a.slice(-2) === '/*' && f.type.indexOf(a.slice(0, -1)) === 0) || a === f.type; })) return f.name + '：不支持这种文件类型';
    if (maxBytes && f.size > maxBytes) return f.name + '：超过 ' + (maxBytes / 1048576) + ' MB';
    return '';
  }
  function showErrors(msgs) { errs.innerHTML = msgs.map(function (m) { return '<div class="zh-upload-err">' + ZH.iconHtml('circle-alert', 16) + '<span>' + esc(m) + '</span></div>'; }).join(''); }
  function paint(it) {
    var li = it.el, st = it.state; li.className = 'zh-upload-item is-' + st;
    li.innerHTML = '<span class="zh-upload-ico">' + ZH.iconHtml(st === 'done' ? 'circle-check' : st === 'error' ? 'circle-alert' : 'file-text', 20) + '</span><div style="min-width:0"><div class="zh-upload-name" title="' + esc(it.file.name) + '">' + esc(it.file.name) + '</div><div class="zh-upload-meta"><span>' + fmt(it.file.size) + '</span><span class="zh-upload-status">' + (st === 'uploading' ? it.pct + '%' : st === 'done' ? '上传成功' : st === 'error' ? esc(it.msg || '上传失败') : st === 'ready' ? '待上传' : '等待中') + '</span></div>' +
      '<div class="zh-upload-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + it.pct + '" aria-label="' + esc(it.file.name) + ' 上传进度"><i style="width:' + it.pct + '%"></i></div></div>' +
      '<div class="zh-upload-actions">' + (st === 'error' ? '<button type="button" class="zh-btn sm text" data-act="retry" aria-label="重试 ' + esc(it.file.name) + '">重试</button>' : '') + '<button type="button" class="zh-btn sm text" data-act="remove" aria-label="' + (st === 'uploading' ? '取消上传 ' : '移除 ') + esc(it.file.name) + '">' + (st === 'uploading' ? '取消' : '移除') + '</button></div>';
    ZH.hydrateIcons(li); if (count) count.textContent = '已添加 ' + items.length + (max ? ' / ' + max : '') + ' 个';
  }
  function emit(name, d) { root.dispatchEvent(new CustomEvent('zh:upload-' + name, { bubbles: true, detail: d })); }
  function send(it) {
    var up = custom || (action ? function (file, o) { return new Promise(function (res, rej) { var x = new XMLHttpRequest(), fd = new FormData(); fd.append(field, file); x.open('POST', action); x.withCredentials = root.hasAttribute('data-credentials'); o.onAbort(function () { x.abort(); });
      x.upload.onprogress = function (e) { if (e.lengthComputable) o.onProgress(e.loaded / e.total * 100); }; x.onload = function () { x.status >= 200 && x.status < 300 ? res(x.responseText) : rej(new Error('服务器返回 ' + x.status)); }; x.onerror = function () { rej(new Error('网络错误')); }; x.onabort = function () { rej(new Error('已取消')); }; x.send(fd); }); } : null);
    if (!up) { it.state = 'ready'; paint(it); return; }
    it.state = 'uploading'; it.pct = 0; paint(it); var aborts = [];
    it.cancel = function () { aborts.forEach(function (f) { f(); }); };
    up(it.file, { onProgress: function (p) { it.pct = Math.max(0, Math.min(100, Math.round(p))); var bar = it.el.querySelector('.zh-upload-bar'); if (bar) { bar.setAttribute('aria-valuenow', it.pct); bar.firstChild.style.width = it.pct + '%'; } var s = it.el.querySelector('.zh-upload-status'); if (s) s.textContent = it.pct + '%'; }, onAbort: function (f) { aborts.push(f); } })
      .then(function (r) { it.state = 'done'; it.pct = 100; it.result = r; paint(it); emit('done', { file: it.file, result: r }); },
        function (e) { it.state = 'error'; it.msg = e && e.message || '上传失败'; paint(it); emit('error', { file: it.file, reason: it.msg }); });
  }
  function add(files) {
    var msgs = [], arr = [].slice.call(files);
    if (!multiple) { items.slice().forEach(remove); arr = arr.slice(0, 1); }
    arr.forEach(function (f) {
      var bad = ok(f); if (!bad && max && items.length >= max) bad = f.name + '：最多添加 ' + max + ' 个';
      if (bad) { msgs.push(bad); emit('reject', { file: f, reason: bad }); return; }
      var it = { id: ++seq, file: f, state: 'queued', pct: 0, el: document.createElement('li') }; items.push(it); list.appendChild(it.el); paint(it); emit('add', { file: f }); send(it);
    });
    showErrors(msgs);
  }
  function remove(it) { if (it.cancel && it.state === 'uploading') it.cancel(); items.splice(items.indexOf(it), 1); it.el.remove(); if (count) count.textContent = '已添加 ' + items.length + (max ? ' / ' + max : '') + ' 个'; emit('remove', { file: it.file }); }
  function open() { if (!root.classList.contains('is-disabled')) input.click(); }
  drop.addEventListener('click', open); drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  input.addEventListener('change', function () { add(input.files); input.value = ''; });
  ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); if (!root.classList.contains('is-disabled')) drop.classList.add('is-over'); }); });
  ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('is-over'); if (t === 'drop' && !root.classList.contains('is-disabled') && e.dataTransfer) add(e.dataTransfer.files); }); });
  list.addEventListener('click', function (e) { var b = e.target.closest('[data-act]'); if (!b) return; var li = b.closest('.zh-upload-item'), it = items.filter(function (x) { return x.el === li; })[0]; if (!it) return; if (b.getAttribute('data-act') === 'remove') remove(it); else { it.msg = ''; send(it); } });
  root._zhUpload = { files: function () { return items.map(function (i) { return i.file; }); }, add: add, uploader: function (fn) { custom = fn; }, clear: function () { items.slice().forEach(remove); showErrors([]); } };
} });
ZhaoUI.upload = { files: function (el) { el = ZhaoUI.ensure(el); return el._zhUpload.files(); }, add: function (el, files) { el = ZhaoUI.ensure(el); el._zhUpload.add(files); }, clear: function (el) { el = ZhaoUI.ensure(el); el._zhUpload.clear(); },
  /** fn(file, { onProgress(percent), onAbort(cb) }) returns a Promise; replaces data-action */ uploader: function (el, fn) { el = ZhaoUI.ensure(el); el._zhUpload.uploader(fn); } };
