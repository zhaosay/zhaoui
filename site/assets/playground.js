// Playground: the editor on the left, a sandboxed frame on the right.  ?c=<component> starts from that component's example; #code=<base64> restores shared code.
(function () {
  var data = JSON.parse(document.getElementById('pg-examples').textContent), pick = document.getElementById('pg-pick'), area = document.getElementById('pg-code'), frame = document.getElementById('pg-frame'), status = document.getElementById('pg-status');
  var t = 0;
  function enc(s) { return btoa(unescape(encodeURIComponent(s))); } function dec(s) { return decodeURIComponent(escape(atob(s))); }
  // The library is inlined into the frame, so the sandbox needs no network or file access (and works from the file system too).
  function doc(code) {
    var h = document.documentElement, attrs = ['audience', 'mode', 'density', 'style', 'brand'].map(function (k) { return h.getAttribute('data-' + k) ? ' data-' + k + '="' + h.getAttribute('data-' + k) + '"' : ''; }).join('');
    return '<!doctype html><html lang="zh-CN"' + attrs + '><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>' + window.ZH_PG.css + '</style>' +
      '<style>body{margin:0;padding:16px;background:var(--zh-bg);color:var(--zh-text);font-family:var(--zh-font-sans);font-size:calc(var(--zh-font-base) * var(--zh-scale,1));line-height:var(--zh-line)}</style></head><body>' +
      '<script>' + window.ZH_PG.js.replace(/<\/script/gi, '<\\/script') + '<\/script>\n' + code + '\n</body></html>';
  }
  function run() { frame.srcdoc = doc(area.value); status.textContent = '已更新预览。'; }
  function schedule() { clearTimeout(t); t = setTimeout(run, 350); }
  function load(name) { if (data[name]) { area.value = data[name].code; pick.value = name; run(); } }
  area.addEventListener('input', schedule);
  area.addEventListener('keydown', function (e) { if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); var s = area.selectionStart; area.value = area.value.slice(0, s) + '  ' + area.value.slice(area.selectionEnd); area.selectionStart = area.selectionEnd = s + 2; schedule(); } });
  pick.addEventListener('change', function () { load(pick.value); });
  document.getElementById('pg-run').addEventListener('click', run);
  document.getElementById('pg-reset').addEventListener('click', function () { load(pick.value); status.textContent = '已还原为「' + data[pick.value].title + '」的示例。'; });
  document.getElementById('pg-share').addEventListener('click', function () {
    var url = location.href.split('#')[0].split('?')[0] + '#code=' + enc(area.value);
    function ok() { status.textContent = '分享链接已复制。'; } function fail() { location.hash = 'code=' + enc(area.value); status.textContent = '已写入地址栏，请直接复制地址。'; }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(ok, fail); else fail();
  });
  var q = new URLSearchParams(location.search).get('c'), m = location.hash.match(/^#code=(.+)$/);
  if (m) { try { area.value = dec(m[1]); run(); } catch (e) { load('dialog'); } } else load(data[q] ? q : 'dialog');
})();
