// Command palette: ZhaoUI.commandPalette({ commands, ... }) -> { open, close, setCommands, el }.  A modal search box over a grouped, fuzzy-filtered list of pages and actions.
// command: { id, label, group, icon, keywords, hint, run() }.  Options: placeholder, label, emptyText, recent (how many recent items to show, default 3), hotkey (true = Ctrl/Cmd+K toggles it; off by default), onRun(command).
ZhaoUI.commandPalette = function (o) {
  o = Object.assign({ commands: [], placeholder: '搜索页面与操作…', label: '命令面板', emptyText: '没有找到相关结果', recent: 3, hotkey: false, onRun: null }, o || {});
  var cmds = o.commands.slice(), byId = {}, recent = [], flat = [], sel = 0, opener = null, closing = false, uid = ZH.uid('zhcmd');
  function index() { byId = {}; cmds.forEach(function (c) { byId[c.id] = c; }); }
  index();
  var dlg = document.createElement('dialog'); dlg.className = 'zh-cmd'; dlg.setAttribute('aria-label', o.label);
  dlg.innerHTML = '<div class="zh-cmd-input"><i data-i="search" data-s="20"></i><input type="text" role="combobox" aria-expanded="true" aria-controls="' + uid + '-l" aria-autocomplete="list" aria-label="' + o.label + '" placeholder="' + o.placeholder + '" autocomplete="off" spellcheck="false"></div>' +
    '<div class="zh-cmd-list" id="' + uid + '-l" role="listbox" aria-label="搜索结果"></div><div class="zh-cmd-empty" hidden>' + o.emptyText + '</div>' +
    '<div class="zh-cmd-foot"><span><span class="zh-kbd">↑</span><span class="zh-kbd">↓</span>选择</span><span><span class="zh-kbd">Enter</span>执行</span><span><span class="zh-kbd">Esc</span>关闭</span></div><div class="zh-upload-sr" role="status" aria-live="polite" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)"></div>';
  document.body.appendChild(dlg); ZH.hydrateIcons(dlg);
  var input = dlg.querySelector('input'), list = dlg.querySelector('.zh-cmd-list'), empty = dlg.querySelector('.zh-cmd-empty'), live = dlg.querySelector('[role=status]');
  function fuzzy(q, text) { var t = String(text || '').toLowerCase(), idx = [], score = 0, last = -2, ti = 0; for (var i = 0; i < q.length; i++) { var f = t.indexOf(q[i], ti); if (f < 0) return null; idx.push(f); score += (f === last + 1 ? 8 : 1) + (f === 0 ? 6 : 0); last = f; ti = f + 1; } return { score: score - (idx[idx.length - 1] - idx[0]) * 0.2, idx: idx }; }
  function hl(text, idx) { var s = {}; (idx || []).forEach(function (i) { s[i] = 1; }); return text.split('').map(function (ch, i) { return s[i] ? '<mark>' + ZH.esc(ch) + '</mark>' : ZH.esc(ch); }).join(''); }
  function groupsOf(items) { var order = [], map = {}; items.forEach(function (h) { var g = h.c.group || '命令'; if (!map[g]) { map[g] = []; order.push(g); } map[g].push(h); }); return order.map(function (g) { return { name: g, items: map[g] }; }); }
  function build(q) {
    q = q.toLowerCase().replace(/\s+/g, '');
    if (!q) { var out = []; var rc = recent.filter(function (id) { return byId[id]; }).map(function (id) { return { c: byId[id], idx: null }; }); if (rc.length && o.recent) out.push({ name: '最近', items: rc }); return out.concat(groupsOf(cmds.map(function (c) { return { c: c, idx: null }; }))); }
    var hits = []; cmds.forEach(function (c) { var m = fuzzy(q, c.label), k = m ? null : fuzzy(q, c.keywords); if (m) hits.push({ c: c, idx: m.idx, s: m.score + 10 }); else if (k) hits.push({ c: c, idx: null, s: k.score }); });
    hits.sort(function (a, b) { return b.s - a.s; }); return groupsOf(hits);
  }
  function render() {
    var q = input.value, groups = build(q), n = 0, html = ''; flat = [];
    groups.forEach(function (g, gi) {
      html += '<div role="group" aria-labelledby="' + uid + '-g' + gi + '"><div class="zh-cmd-gl" id="' + uid + '-g' + gi + '" role="presentation">' + ZH.esc(g.name) + '</div>';
      g.items.forEach(function (it) { var i = n++; flat.push(it.c); html += '<div class="zh-cmd-item" role="option" id="' + uid + '-o' + i + '" data-n="' + i + '" aria-selected="false">' + (it.c.icon ? '<i data-i="' + it.c.icon + '" data-s="18"></i>' : '') + '<span>' + (it.idx ? hl(it.c.label, it.idx) : ZH.esc(it.c.label)) + '</span><span class="zh-cmd-hint">' + (it.c.hint ? '<span class="zh-kbd">' + ZH.esc(it.c.hint) + '</span>' : '') + '</span></div>'; });
      html += '</div>';
    });
    list.innerHTML = html; ZH.hydrateIcons(list); empty.hidden = flat.length > 0; list.hidden = !flat.length; live.textContent = flat.length ? (q ? flat.length + ' 个结果' : '') : o.emptyText; select(0);
  }
  function select(i) {
    if (!flat.length) { input.removeAttribute('aria-activedescendant'); return; }
    sel = (i + flat.length) % flat.length; [].forEach.call(list.querySelectorAll('.zh-cmd-item'), function (el, k) { el.setAttribute('aria-selected', String(k === sel)); });
    var cur = document.getElementById(uid + '-o' + sel); input.setAttribute('aria-activedescendant', uid + '-o' + sel);
    if (cur) { var top = cur.offsetTop - list.offsetTop, bot = top + cur.offsetHeight; if (top < list.scrollTop + 30) list.scrollTop = Math.max(0, top - 30); else if (bot > list.scrollTop + list.clientHeight) list.scrollTop = bot - list.clientHeight + 8; }
  }
  function open(from) { if (dlg.open) return; opener = from && from !== document.body ? from : document.activeElement; input.value = ''; dlg.showModal(); render(); input.focus(); }
  function close() { if (!dlg.open || closing) return; var done = function () { closing = false; dlg.classList.remove('is-closing'); dlg.close(); if (opener && opener.focus && document.contains(opener)) opener.focus(); }; if (ZH.reduced()) { done(); return; } closing = true; dlg.classList.add('is-closing'); setTimeout(done, 130); }
  function run(c) { if (!c) return; recent = [c.id].concat(recent.filter(function (x) { return x !== c.id; })).slice(0, Math.max(1, o.recent)); close(); if (c.run) c.run(c); if (o.onRun) o.onRun(c); dlg.dispatchEvent(new CustomEvent('zh:command-run', { bubbles: true, detail: { id: c.id, command: c } })); }
  input.addEventListener('input', render);
  input.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); select(sel + 1); } else if (e.key === 'ArrowUp') { e.preventDefault(); select(sel - 1); } else if (e.key === 'Enter') { e.preventDefault(); run(flat[sel]); } });
  list.addEventListener('mousemove', function (e) { var it = e.target.closest('.zh-cmd-item'); if (it && +it.getAttribute('data-n') !== sel) select(+it.getAttribute('data-n')); });
  list.addEventListener('click', function (e) { var it = e.target.closest('.zh-cmd-item'); if (it) run(flat[+it.getAttribute('data-n')]); });
  dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
  dlg.addEventListener('mousedown', function (e) { if (e.target === dlg) close(); });
  if (o.hotkey) document.addEventListener('keydown', function (e) { if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') { e.preventDefault(); if (dlg.open) close(); else open(document.activeElement); } });
  return { open: open, close: close, el: dlg, setCommands: function (c) { cmds = c.slice(); index(); if (dlg.open) render(); } };
};
