var esc = ZH.esc, ic = ZH.iconHtml;
var FILEICON = { json: 'file-json', md: 'file-text', txt: 'file-text', log: 'file-text', png: 'file-image', jpg: 'file-image', jpeg: 'file-image', svg: 'file-image', js: 'file-code', ts: 'file-code', vue: 'file-code', css: 'file-code', html: 'file-code', xlsx: 'file-spreadsheet', csv: 'file-spreadsheet', zip: 'file-archive', mp4: 'file-video', mp3: 'file-audio' };
function N(label, children, extra) { var o = { label: label }; if (children) o.children = children; return Object.assign(o, extra || {}); }

/* ---------------------------------------------------------------- engine */
function createTree(el, o) {
  o = Object.assign({ checkable: false, strict: false, multiple: false, dir: false, actions: false, draggable: false, virtual: false, data: [], load: null, selected: [] }, o || {});
  var roots, byId = {}, focusKey = null, sel = new Set(), filter = '', editing = null, enter = {}, rowH = 32, vis = [], visIdx = {}, ls = {}, destroyed = false;
  var drag = null, dragJust = false, raf = 0, taBuf = '', taT;
  el.classList.add('zh-tree'); el.setAttribute('role', 'tree');
  if (o.checkable || o.multiple) el.setAttribute('aria-multiselectable', 'true');
  var live = document.createElement('div'); live.className = 'zh-tree-live'; live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite');
  el.parentNode.insertBefore(live, el.nextSibling);
  function say(t) { live.textContent = ''; setTimeout(function () { live.textContent = t; }, 30); }

  function prep(list, parent) {
    (list || []).forEach(function (n) {
      if (!n.id) n.id = ZH.uid('n');
      n.parent = parent || null; byId[n.id] = n;
      if (n.expanded === undefined) n.expanded = false;
      if (n.checked === undefined) n.checked = false;
      if (n.children) prep(n.children, n);
    });
    return list || [];
  }
  function recompute(n) {
    (n.children || []).forEach(recompute);
    if (n.children && n.children.length && !o.strict) {
      var k = n.children.filter(function (c) { return !c.disabled; });
      if (k.length) n.checked = k.every(function (c) { return c.checked === true; }) ? true : k.every(function (c) { return !c.checked; }) ? false : 'mixed';
    }
  }
  function setData(d) { byId = {}; roots = prep(d, null); if (o.checkable) roots.forEach(recompute); sel = new Set(o.selected || []); render(); }
  function isDesc(n, anc) { for (var p = n && n.parent; p; p = p.parent) if (p === anc) return true; return false; }
  function countDesc(n) { var c = 0; (n.children || []).forEach(function (k) { c += 1 + countDesc(k); }); return c; }
  function iconFor(n, open) {
    if (n.icon) return n.icon;
    if (o.dir) { if (n.children || n.lazy) return open ? 'folder-open' : 'folder'; return FILEICON[(n.label.split('.').pop() || '').toLowerCase()] || 'file'; }
    return null;
  }
  function on(ev, fn) { (ls[ev] = ls[ev] || []).push(fn); return api; }
  function emit(ev, a, b) { (ls[ev] || []).forEach(function (fn) { fn(a, b); }); }

  function computeRows() {
    var fl = filter.trim().toLowerCase(), keep = null;
    if (fl) {
      keep = {};
      (function mark(list) {
        var any = false;
        list.forEach(function (n) {
          var self = n.label.toLowerCase().indexOf(fl) >= 0, kids = n.children ? mark(n.children) : false;
          n._hit = self; if (self || kids) { keep[n.id] = 1; any = true; }
        });
        return any;
      })(roots);
    }
    var out = [];
    (function walk(list, level) {
      var sibs = keep ? list.filter(function (n) { return keep[n.id]; }) : list;
      sibs.forEach(function (n, i) {
        var kids = !!((n.children && n.children.length) || (n.lazy && !n.loaded)), open = kids && (keep ? true : n.expanded);
        out.push({ key: n.id, n: n, level: level, set: sibs.length, pos: i + 1, kids: kids, open: open });
        if (open) {
          if (n.lazy && !n.loaded) { if (n.loading) out.push({ key: n.id + ':st', n: n, level: level + 1, st: 'loading' }); else if (n.error) out.push({ key: n.id + ':st', n: n, level: level + 1, st: 'error' }); }
          else if (n.children) walk(n.children, level + 1);
        }
      });
    })(roots, 1);
    return out;
  }

  function hl(label) {
    var fl = filter.trim().toLowerCase();
    if (!fl) return esc(label);
    var i = label.toLowerCase().indexOf(fl);
    if (i < 0) return esc(label);
    return esc(label.slice(0, i)) + '<mark class="zh-mark">' + esc(label.slice(i, i + fl.length)) + '</mark>' + esc(label.slice(i + fl.length));
  }
  function rowHtml(r, idx, stop) {
    var tab = r.key === stop ? 0 : -1;
    if (r.st) {
      return '<div class="zh-tree-row zh-tree-row--status' + (r.st === 'error' ? ' is-error' : '') + '" role="treeitem" aria-level="' + r.level + '" data-key="' + r.key + '" tabindex="' + tab + '" style="--zh-tree-lvl:' + r.level + '"><span class="zh-tree-toggle zh-tree-toggle--leaf"></span>' +
        (r.st === 'loading' ? ic('loader-circle', 14, 'zh-tree-spin') + '<span class="zh-tree-label">加载中…</span>' : ic('circle-x', 14) + '<span class="zh-tree-label">加载失败</span><button type="button" class="zh-tree-retry" tabindex="-1">重试</button>') + '</div>';
    }
    var n = r.n, cls = 'zh-tree-row' + (r.open ? ' is-open' : '') + (sel.has(n.id) ? ' is-selected' : '') + (enter[r.key] !== undefined ? ' is-enter' : '');
    var a = 'role="treeitem" aria-level="' + r.level + '" aria-setsize="' + r.set + '" aria-posinset="' + r.pos + '"' + (r.kids ? ' aria-expanded="' + !!r.open + '"' : '') +
      (o.checkable ? ' aria-checked="' + (n.checked === true ? 'true' : n.checked === 'mixed' ? 'mixed' : 'false') + '"' : '') + ' aria-selected="' + sel.has(n.id) + '"' + (n.disabled ? ' aria-disabled="true"' : '');
    var icon = iconFor(n, r.open);
    var label = editing === n.id ? '<input class="zh-tree-edit" value="' + esc(n.label) + '" maxlength="40" aria-label="节点名称">' : hl(n.label);
    var acts = o.actions && !n.disabled ? '<span class="zh-tree-actions">' + (n.lazy && !n.loaded ? '' : '<button type="button" class="zh-tree-act" data-act="add" tabindex="-1" aria-label="给「' + esc(n.label) + '」添加子节点">' + ic('plus', 14) + '</button>') +
      '<button type="button" class="zh-tree-act" data-act="edit" tabindex="-1" aria-label="重命名「' + esc(n.label) + '」">' + ic('pencil', 14) + '</button><button type="button" class="zh-tree-act" data-act="remove" tabindex="-1" aria-label="删除「' + esc(n.label) + '」">' + ic('trash-2', 14) + '</button></span>' : '';
    return '<div class="' + cls + '" ' + a + ' data-key="' + n.id + '" tabindex="' + tab + '" style="--zh-tree-lvl:' + r.level + (enter[r.key] !== undefined ? ';--zh-i:' + enter[r.key] : '') + '">' +
      '<span class="zh-tree-toggle' + (r.kids ? '' : ' zh-tree-toggle--leaf') + '" aria-hidden="true">' + (n.loading ? ic('loader-circle', 14, 'zh-tree-spin') : ic('chevron-right', 14)) + '</span>' +
      (o.checkable ? '<span class="zh-tree-check" aria-hidden="true">' + (n.checked === true ? ic('check', 12) : n.checked === 'mixed' ? ic('minus', 12) : '') + '</span>' : '') +
      (icon ? '<span class="zh-tree-icon" aria-hidden="true">' + ic(icon, 16) + '</span>' : '') + '<span class="zh-tree-label">' + label + '</span>' + acts + '</div>';
  }

  function render() {
    if (destroyed) return;
    var ae = document.activeElement, hadFocus = ae && el.contains(ae) && ae !== el, activeKey = hadFocus ? ae.getAttribute('data-key') : null;
    vis = computeRows(); visIdx = {}; vis.forEach(function (r, i) { visIdx[r.key] = i; });
    var n = vis.length, start = 0, end = n, virt = o.virtual && n > 80;
    if (virt) { var h = el.clientHeight || 320; start = Math.max(0, Math.floor(el.scrollTop / rowH) - 8); end = Math.min(n, Math.ceil((el.scrollTop + h) / rowH) + 8); }
    var stop = focusKey, present = false, i;
    for (i = start; i < end; i++) if (vis[i].key === stop) { present = true; break; }
    if (!present) stop = vis[start] ? vis[start].key : null;
    var html = virt ? '<div aria-hidden="true" style="height:' + start * rowH + 'px"></div>' : '';
    for (i = start; i < end; i++) html += rowHtml(vis[i], i, stop);
    if (virt) html += '<div aria-hidden="true" style="height:' + (n - end) * rowH + 'px"></div>';
    if (!n) html = '<div class="zh-tree-empty">' + (filter ? '没有匹配的节点' : '暂无数据') + '</div>';
    var keepTop = el.scrollTop;
    el.innerHTML = html; ZH.hydrateIcons(el); enter = {};
    if (virt && Math.abs(el.scrollTop - keepTop) > 1) el.scrollTop = keepTop; // WebKit clamps scrollTop to 0 while children are replaced
    var first = el.querySelector('.zh-tree-row');
    if (first && first.offsetHeight && Math.abs(first.offsetHeight - rowH) > 0.5) { rowH = first.offsetHeight; if (virt) { render(); return; } }
    if (editing) { var inp = el.querySelector('.zh-tree-edit'); if (inp) { inp.focus(); inp.select(); } }
    else if (activeKey) { var t = el.querySelector('[data-key="' + activeKey + '"]'); if (t) t.focus({ preventScroll: true }); }
    if (o.onRender) o.onRender({ total: n, rendered: end - start, virtual: virt });
  }
  function ensureVisible(key) {
    var i = visIdx[key]; if (i === undefined) return;
    var top = i * rowH, bottom = top + rowH;
    if (top < el.scrollTop) el.scrollTop = top; else if (bottom > el.scrollTop + el.clientHeight) el.scrollTop = bottom - el.clientHeight;
  }
  function focusRow(key) {
    focusKey = key; ensureVisible(key); render();
    var t = el.querySelector('[data-key="' + key + '"]'); if (t) t.focus({ preventScroll: true });
  }

  function markEnter(n) { (n.children || []).forEach(function (c, i) { enter[c.id] = i; }); }
  function load(n) {
    if (n.loading || !o.load) return;
    n.loading = true; n.error = false; n.expanded = true; render();
    Promise.resolve(o.load(n)).then(function (kids) {
      n.loading = false; n.loaded = true; n.children = prep(kids, n); markEnter(n); emit('load', n); render();
    }, function () { n.loading = false; n.error = true; render(); say('加载「' + n.label + '」失败'); });
  }
  function expand(n) {
    if (n.lazy && !n.loaded) { load(n); return; }
    if (n.expanded) return;
    n.expanded = true; markEnter(n); emit('expand', n); render();
  }
  function collapse(n) {
    if (!n.expanded) return;
    var i = visIdx[n.id], gone = [];
    if (i !== undefined) for (var j = i + 1; j < vis.length && vis[j].level > vis[i].level; j++) gone.push(vis[j].key);
    n.expanded = false; emit('collapse', n);
    if (focusKey && byId[focusKey] && isDesc(byId[focusKey], n)) focusKey = n.id;
    var self = el.querySelector('[data-key="' + n.id + '"]');
    if (self) { self.setAttribute('aria-expanded', 'false'); self.classList.remove('is-open'); }
    if (gone.length && !ZH.reduced()) {
      gone.forEach(function (k) { var d = el.querySelector('[data-key="' + k + '"]'); if (d) d.classList.add('is-leave'); });
      setTimeout(render, 120);
    } else render();
  }
  function toggle(n) { if (n.expanded && !filter.trim()) collapse(n); else expand(n); }
  function all(open) {
    (function walk(list) { list.forEach(function (n) { if (n.children && n.children.length) { n.expanded = open; walk(n.children); } }); })(roots);
    render();
  }

  function select(n, additive) {
    if (n.disabled) return;
    if (o.multiple || additive) { if (sel.has(n.id)) sel.delete(n.id); else sel.add(n.id); }
    else { sel.clear(); sel.add(n.id); }
    emit('select', getSelected()); render();
  }
  function getSelected() { return Array.from(sel).map(function (id) { return byId[id]; }).filter(Boolean); }
  function down(n, v) { (n.children || []).forEach(function (c) { if (!c.disabled) { c.checked = v; down(c, v); } }); }
  function up(p) {
    for (; p; p = p.parent) {
      var k = (p.children || []).filter(function (c) { return !c.disabled; });
      if (k.length) p.checked = k.every(function (c) { return c.checked === true; }) ? true : k.every(function (c) { return !c.checked; }) ? false : 'mixed';
    }
  }
  function toggleCheck(n) {
    if (n.disabled) return;
    n.checked = n.checked === true ? false : true;
    if (!o.strict) { down(n, n.checked); up(n.parent); }
    emit('check', getChecked()); render();
  }
  function getChecked() {
    var out = [];
    (function walk(list) { list.forEach(function (n) { if (n.checked === true) { out.push(n); if (o.strict) walk(n.children || []); } else walk(n.children || []); }); })(roots);
    return out;
  }

  function startEdit(n) { if (!o.actions || n.disabled) return; editing = n.id; focusKey = n.id; render(); }
  function commitEdit(v) {
    var n = byId[editing]; editing = null; if (!n) return;
    v = v.trim(); if (v && v !== n.label) { var old = n.label; n.label = v; emit('rename', n, old); say('已重命名为 ' + v); }
    render(); focusRow(n.id);
  }
  function cancelEdit() { var n = byId[editing]; editing = null; render(); if (n) focusRow(n.id); }
  function addChild(n) {
    if (n.lazy && !n.loaded) return;
    var c = prep([{ label: '新节点' }], n)[0]; n.children = n.children || []; n.children.push(c); n.loaded = true; n.expanded = true;
    if (!o.strict) up(n); markEnter(n); emit('add', c); startEdit(c);
  }
  function removeNode(n) {
    var list = n.parent ? n.parent.children : roots, i = list.indexOf(n), p = n.parent;
    var next = list[i + 1] || list[i - 1] || p;
    (function forget(x) { delete byId[x.id]; sel.delete(x.id); (x.children || []).forEach(forget); })(n);
    list.splice(i, 1); if (!o.strict) up(p);
    emit('remove', n); say('已删除 ' + n.label);
    if (next) { focusKey = next.id; render(); focusRow(next.id); } else render();
  }
  function confirmRemove(n, anchor) {
    var cnt = countDesc(n);
    var pop = ZH.popover(anchor, {
      trigger: 'manual', placement: 'bottom-end', arrow: true, z: 'popover', role: 'dialog', className: 'zh-tree-confirm',
      content: function (api) {
        var d = document.createElement('div'); d.style.cssText = 'padding:12px;max-width:240px';
        d.innerHTML = '<div style="font-weight:600">删除「' + esc(n.label) + '」？</div>' + (cnt ? '<div class="zh-hint" style="margin:4px 0 0">其下 ' + cnt + ' 个子节点会一起删除</div>' : '') +
          '<div class="zh-row" style="--g:8px;margin-top:10px;justify-content:flex-end"><button type="button" class="zh-btn sm" data-c="no">取消</button><button type="button" class="zh-btn sm danger" data-c="yes">删除</button></div>';
        d.addEventListener('click', function (e) { var b = e.target.closest('[data-c]'); if (!b) return; var yes = b.getAttribute('data-c') === 'yes'; pop.close(); if (yes) removeNode(n); });
        return d;
      },
      onOpen: function (p) { var b = p.querySelector('[data-c="no"]'); if (b) b.focus(); },
      onClose: function () { setTimeout(function () { pop.destroy(); }, 300); }
    });
    pop.open();
  }
  function moveSibling(n, dir) {
    var list = n.parent ? n.parent.children : roots, i = list.indexOf(n), j = i + dir;
    if (j < 0 || j >= list.length) return;
    list.splice(i, 1); list.splice(j, 0, n); emit('move', n, { parent: n.parent, pos: dir < 0 ? 'before' : 'after' });
    say(n.label + ' 已移到第 ' + (j + 1) + ' 位，共 ' + list.length + ' 项'); render(); focusRow(n.id);
  }
  function doAct(act, n, btn) {
    if (act === 'add') addChild(n); else if (act === 'edit') startEdit(n); else if (act === 'remove') confirmRemove(n, btn);
  }

  /* drag to reorder (mouse / pen; touch users get Alt+arrows on keyboards and the row actions) */
  function clearDrop() { el.querySelectorAll('.is-drop-before,.is-drop-after,.is-drop-inside').forEach(function (x) { x.classList.remove('is-drop-before', 'is-drop-after', 'is-drop-inside'); }); }
  function endDrag(d) {
    document.removeEventListener('pointermove', onDragMove); document.removeEventListener('pointerup', onDragUp); document.removeEventListener('pointercancel', onDragCancel); document.removeEventListener('keydown', onDragKey, true);
    if (d) { clearTimeout(d.timer); if (d.ghost) d.ghost.remove(); }
    document.body.classList.remove('zh-tree-dragging'); clearDrop();
    el.querySelectorAll('.is-dragging').forEach(function (x) { x.classList.remove('is-dragging'); });
  }
  function onDragMove(e) {
    if (!drag) return;
    if (!drag.on) {
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 5) return;
      drag.on = true; document.body.classList.add('zh-tree-dragging');
      drag.ghost = document.createElement('div'); drag.ghost.className = 'zh-tree-ghost'; drag.ghost.innerHTML = ic(iconFor(drag.n, false) || 'grip-vertical', 14) + esc(drag.n.label); document.body.appendChild(drag.ghost); ZH.hydrateIcons(drag.ghost);
      var src = el.querySelector('[data-key="' + drag.n.id + '"]'); if (src) src.classList.add('is-dragging');
    }
    drag.ghost.style.left = (e.clientX + 14) + 'px'; drag.ghost.style.top = (e.clientY + 10) + 'px';
    var box = el.getBoundingClientRect();
    if (e.clientY < box.top + 28) el.scrollTop -= 12; else if (e.clientY > box.bottom - 28) el.scrollTop += 12;
    var t = document.elementFromPoint(e.clientX, e.clientY), rowEl = t && t.closest ? t.closest('.zh-tree-row') : null;
    clearDrop(); drag.drop = null; clearTimeout(drag.timer);
    if (!rowEl || !el.contains(rowEl)) return;
    var r2 = vis[visIdx[rowEl.getAttribute('data-key')]]; if (!r2 || r2.st) return;
    var tn = r2.n; if (tn === drag.n || isDesc(tn, drag.n)) return;
    var rect = rowEl.getBoundingClientRect(), y = (e.clientY - rect.top) / rect.height, pos = y < .25 ? 'before' : y > .75 ? 'after' : 'inside';
    if (pos === 'inside' && ((tn.lazy && !tn.loaded) || tn.disabled)) pos = y < .5 ? 'before' : 'after';
    drag.drop = { n: tn, pos: pos }; rowEl.classList.add('is-drop-' + pos);
    if (pos === 'inside' && r2.kids && !tn.expanded && !(tn.lazy && !tn.loaded)) drag.timer = setTimeout(function () { if (drag && drag.drop && drag.drop.n === tn) { tn.expanded = true; render(); } }, 650);
  }
  function onDragUp() {
    var d = drag; drag = null; endDrag(d);
    if (!d || !d.on) return;
    dragJust = true; setTimeout(function () { dragJust = false; }, 0);
    if (!d.drop) return;
    var n = d.n, tg = d.drop.n, pos = d.drop.pos, oldP = n.parent;
    var oldList = oldP ? oldP.children : roots; oldList.splice(oldList.indexOf(n), 1);
    if (pos === 'inside') { tg.children = tg.children || []; tg.children.push(n); n.parent = tg; tg.expanded = true; }
    else { var tl = tg.parent ? tg.parent.children : roots; tl.splice(tl.indexOf(tg) + (pos === 'after' ? 1 : 0), 0, n); n.parent = tg.parent; }
    if (!o.strict) { up(oldP); up(n.parent); }
    enter[n.id] = 0; emit('move', n, { parent: n.parent, pos: pos, target: tg });
    say('已移动 ' + n.label + (pos === 'inside' ? ' 到 ' + tg.label + ' 内' : pos === 'before' ? ' 到 ' + tg.label + ' 之前' : ' 到 ' + tg.label + ' 之后'));
    render(); focusRow(n.id);
  }
  function onDragCancel() { var d = drag; drag = null; endDrag(d); }
  function onDragKey(e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onDragCancel(); } }
  el.addEventListener('pointerdown', function (e) {
    if (!o.draggable || e.button !== 0 || e.pointerType === 'touch') return;
    var rowEl = e.target.closest('.zh-tree-row'); if (!rowEl || e.target.closest('.zh-tree-act,.zh-tree-edit,.zh-tree-toggle,.zh-tree-check') || editing) return;
    var r = vis[visIdx[rowEl.getAttribute('data-key')]]; if (!r || r.st || r.n.disabled) return;
    drag = { n: r.n, sx: e.clientX, sy: e.clientY, on: false, drop: null };
    document.addEventListener('pointermove', onDragMove); document.addEventListener('pointerup', onDragUp); document.addEventListener('pointercancel', onDragCancel); document.addEventListener('keydown', onDragKey, true);
  });

  /* pointer + keyboard */
  el.addEventListener('click', function (e) {
    if (dragJust) return;
    var rowEl = e.target.closest('.zh-tree-row'); if (!rowEl || !el.contains(rowEl)) return;
    var key = rowEl.getAttribute('data-key'), r = vis[visIdx[key]]; if (!r) return;
    if (r.st) { if (e.target.closest('.zh-tree-retry')) load(r.n); return; }
    var n = r.n, act = e.target.closest('.zh-tree-act');
    if (act) { doAct(act.getAttribute('data-act'), n, act); return; }
    if (e.target.closest('.zh-tree-edit')) return;
    focusKey = key;
    if (e.target.closest('.zh-tree-toggle')) { if (r.kids) toggle(n); focusRow(key); return; }
    if (n.disabled) { focusRow(key); return; }
    if (e.target.closest('.zh-tree-check')) { toggleCheck(n); focusRow(key); return; }
    select(n, e.ctrlKey || e.metaKey);
    if (o.dir && r.kids) toggle(n);
    focusRow(key);
  });
  el.addEventListener('dblclick', function (e) {
    var rowEl = e.target.closest('.zh-tree-row'); if (!rowEl || !o.actions || e.target.closest('.zh-tree-act,.zh-tree-edit')) return;
    var r = vis[visIdx[rowEl.getAttribute('data-key')]]; if (r && !r.st) startEdit(r.n);
  });
  el.addEventListener('focusout', function (e) {
    if (editing && e.target.classList && e.target.classList.contains('zh-tree-edit')) { var v = e.target.value; setTimeout(function () { if (editing) commitEdit(v); }, 0); }
  });
  el.addEventListener('keydown', function (e) {
    var inp = e.target.closest && e.target.closest('.zh-tree-edit');
    if (inp) {
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); commitEdit(inp.value); } else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
      return;
    }
    var rowEl = e.target.closest('.zh-tree-row'); if (!rowEl) return;
    var key = rowEl.getAttribute('data-key'), i = visIdx[key], r = vis[i]; if (!r) return;
    var n = r.n, go = function (j) { focusRow(vis[Math.max(0, Math.min(vis.length - 1, j))].key); }, used = true;
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && o.draggable && !r.st) moveSibling(n, e.key === 'ArrowUp' ? -1 : 1);
    else switch (e.key) {
      case 'ArrowDown': go(i + 1); break;
      case 'ArrowUp': go(i - 1); break;
      case 'Home': go(0); break;
      case 'End': go(vis.length - 1); break;
      case 'ArrowRight':
        if (r.st) break;
        var open = filter.trim() ? r.open : !!n.expanded;
        if (r.kids && !open) expand(n); else if (r.kids && open && vis[i + 1] && vis[i + 1].level > r.level) go(i + 1);
        break;
      case 'ArrowLeft':
        if (r.st) { focusRow(n.id); break; }
        if (r.kids && n.expanded && !filter.trim()) collapse(n); else if (n.parent) focusRow(n.parent.id);
        break;
      case 'Enter':
        if (r.st) { if (r.st === 'error') load(n); break; }
        select(n, false); if (o.dir && r.kids) toggle(n); break;
      case ' ':
        if (r.st) break;
        if (o.checkable) toggleCheck(n); else select(n, false); break;
      case '*': (n.parent ? n.parent.children : roots).forEach(function (s) { if (s.children && s.children.length) s.expanded = true; }); render(); break;
      case 'F2': if (!r.st) startEdit(n); break;
      case 'Delete': if (!r.st && o.actions) confirmRemove(n, rowEl.querySelector('[data-act="remove"]') || rowEl); break;
      default:
        used = false;
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          taBuf += e.key.toLowerCase(); clearTimeout(taT); taT = setTimeout(function () { taBuf = ''; }, 600);
          for (var k = 1; k <= vis.length; k++) { var c = vis[(i + k) % vis.length]; if (!c.st && c.n.label.toLowerCase().indexOf(taBuf) === 0) { focusRow(c.key); used = true; break; } }
        }
    }
    if (used) e.preventDefault();
  });
  if (o.virtual) el.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; render(); }); }, { passive: true });

  var api = {
    el: el, render: render, setData: setData, on: on, rows: function () { return vis; },
    expandAll: function () { all(true); }, collapseAll: function () { all(false); },
    setFilter: function (t) { filter = t || ''; render(); }, setStrict: function (b) { o.strict = !!b; render(); },
    stats: function () { var m = 0; if (filter.trim()) vis.forEach(function (r) { if (r.n._hit && !r.st) m++; }); return { matches: m, visible: vis.length }; },
    getChecked: getChecked, getSelected: getSelected, node: function (id) { return byId[id]; },
    focus: function () { var k = focusKey && visIdx[focusKey] !== undefined ? focusKey : (vis[0] && vis[0].key); if (k) focusRow(k); },
    destroy: function () { destroyed = true; if (live.parentNode) live.remove(); el.innerHTML = ''; }
  };
  setData(o.data);
  return api;
}

/* ---------------------------------------------------------------- demos */
var tsel = function (id) { return document.getElementById(id); };
function log(ev, text) {
  var ol = tsel('zhTreeLog'); if (ol.firstElementChild && ol.firstElementChild.classList.contains('zh-hint')) ol.innerHTML = '';
  var li = document.createElement('li'); li.innerHTML = '<b>' + esc(ev) + '</b><span>' + esc(text) + '</span>'; ol.insertBefore(li, ol.firstChild);
  while (ol.children.length > 8) ol.lastChild.remove();
}
var names = function (a) { return a.length ? a.map(function (n) { return n.label; }).join('、') : '无'; };

/* 1. basic checkable */
var basic = createTree(tsel('zhTreeBasic'), {
  checkable: true, data: [
    N('产品中心', [N('设计系统', [N('色彩', null, { checked: true }), N('字体'), N('图标', null, { disabled: true })], { expanded: true }), N('组件库', [N('Button'), N('Input'), N('Table'), N('Tree')]), N('文档站')], { icon: 'layers', expanded: true }),
    N('研发部', [N('前端组', [N('Vue 团队'), N('H5 团队')]), N('后端组', [N('订单服务'), N('用户服务')])], { icon: 'code' }),
    N('运营部', [N('内容运营'), N('用户增长')], { icon: 'megaphone' })
  ]
});
function refreshChecked() { tsel('zhTrChecked').textContent = '已勾选：' + names(basic.getChecked()); }
basic.on('check', function (a) { log('check', names(a)); refreshChecked(); }).on('select', function (a) { log('select', names(a)); })
  .on('expand', function (n) { log('expand', n.label); }).on('collapse', function (n) { log('collapse', n.label); });
refreshChecked();
tsel('zhTrExpand').addEventListener('click', function () { basic.expandAll(); });
tsel('zhTrCollapse').addEventListener('click', function () { basic.collapseAll(); });
tsel('zhTrStrict').addEventListener('change', function (e) { basic.setStrict(e.target.checked); log('checkStrictly', String(e.target.checked)); });

/* 2. filter */
var flt = createTree(tsel('zhTreeFilter'), {
  data: [N('集团总部', [
    N('产品部', [N('设计组'), N('前端组'), N('后端组', [N('订单服务'), N('用户服务'), N('支付服务')])], { expanded: true }),
    N('运营部', [N('内容组'), N('增长组'), N('客服组')]),
    N('人力资源部', [N('招聘组'), N('绩效组')])
  ], { expanded: true, icon: 'building-2' })]
});
var fInput = tsel('zhTrFilter'), fN = tsel('zhTrFilterN');
fInput.addEventListener('input', function () { flt.setFilter(fInput.value); var s = flt.stats(); fN.textContent = fInput.value.trim() ? (s.matches ? '找到 ' + s.matches + ' 个匹配项' : '没有匹配的节点') : ''; });

/* 3. lazy */
var COLS = ['id', 'name', 'created_at', 'status'];
createTree(tsel('zhTreeLazy'), {
  data: [N('MySQL', null, { lazy: true, icon: 'database' }), N('PostgreSQL', null, { lazy: true, icon: 'database', failOnce: true }), N('Redis', null, { lazy: true, icon: 'database' })],
  load: function (n) {
    return new Promise(function (res, rej) {
      setTimeout(function () {
        if (n.failOnce) { n.failOnce = false; rej(new Error('timeout')); return; }
        if (n.parent) { res(COLS.map(function (c) { return N(c, null, { icon: 'hash' }); })); return; }
        res(['users', 'orders', 'payments', 'logs'].map(function (t) { return N(t, null, { icon: 'table', lazy: n.label === 'MySQL' && t === 'orders' }); }));
      }, 700);
    });
  }
});

/* 4. edit + drag */
var edit = createTree(tsel('zhTreeEdit'), {
  actions: true, draggable: true, data: [
    N('迭代 12', [N('设计评审'), N('接口联调'), N('性能优化', [N('首屏加载'), N('图片压缩')])], { expanded: true }),
    N('待办', [N('补充文档'), N('修复 #482')], { expanded: true })
  ]
});
edit.on('move', function (n) { ZH.toast('已移动「' + n.label + '」'); });

/* 5. directory */
var dir = createTree(tsel('zhTreeDir'), {
  dir: true, data: [
    N('src', [N('components', [N('Button.vue'), N('Tree.vue'), N('Table.vue')], { expanded: true }), N('utils', [N('date.ts'), N('format.js')]), N('assets', [N('logo.png'), N('hero.jpg')])], { expanded: true }),
    N('docs', [N('README.md'), N('guide.md')]), N('tests', []),
    N('package.json'), N('vite.config.ts'), N('data.csv'), N('release.zip')
  ]
});
dir.on('select', function (a) {
  var n = a[0]; if (!n) return;
  var p = [n.label]; for (var x = n.parent; x; x = x.parent) p.unshift(x.label);
  tsel('zhTrDirPath').textContent = '已选择：' + p.join('/');
});

/* 6. TreeSelect */
var REGIONS = function () {
  return [N('广东省', [N('广州市', [N('天河区'), N('越秀区'), N('海珠区')]), N('深圳市', [N('南山区'), N('福田区'), N('宝安区')])]),
    N('浙江省', [N('杭州市', [N('西湖区'), N('余杭区')]), N('宁波市', [N('鄞州区'), N('海曙区')])]),
    N('江苏省', [N('南京市', [N('鼓楼区'), N('玄武区')]), N('苏州市', [N('工业园区'), N('姑苏区')])])];
};
function treeSelect(host, o) {
  var data = REGIONS(), tree = null, val = [], pop;
  var ids = {};
  (function walk(l, p) { l.forEach(function (n) { n.id = ZH.uid('r'); n.parent = p; ids[n.id] = n; if (n.children) walk(n.children, n); }); })(data, null);
  function draw() {
    var chips = val.length ? '' : '<span class="zh-tselect-ph">' + (o.multiple ? '请选择覆盖地区' : '请选择所在地区') + '</span>';
    if (o.multiple) {
      val.slice(0, 2).forEach(function (n) { chips += '<span class="zh-tselect-chip">' + esc(n.label) + '<button type="button" class="zh-tselect-x" data-id="' + n.id + '" tabindex="-1" aria-label="移除 ' + esc(n.label) + '">' + ic('x', 12) + '</button></span>'; });
      if (val.length > 2) chips += '<span class="zh-tselect-chip">+' + (val.length - 2) + '</span>';
    } else if (val[0]) chips = esc(val[0].label);
    host.innerHTML = '<span class="zh-tselect-val">' + chips + '</span>' + ic('chevron-down', 16, 'zh-tselect-caret'); ZH.hydrateIcons(host);
    host.setAttribute('aria-label', val.length ? (o.multiple ? '已选 ' : '已选 ') + val.map(function (n) { return n.label; }).join('、') : '');
  }
  pop = ZH.popover(host, {
    trigger: 'click', placement: 'bottom-start', matchWidth: true, z: 'dropdown', role: 'dialog', offset: 6,
    content: function () {
      var box = document.createElement('div'); box.className = 'zh-tselect-pop'; var t = document.createElement('div'); t.style.maxHeight = '240px'; t.setAttribute('aria-label', '地区'); box.appendChild(t);
      tree = createTree(t, { data: data, checkable: !!o.multiple, multiple: false, selected: val.map(function (n) { return n.id; }) });
      if (o.multiple) tree.on('check', function (a) { val = a; draw(); pop.update(); });
      else tree.on('select', function (a) { val = a.slice(0, 1); draw(); pop.close(); });
      return box;
    },
    onOpen: function () { tree.focus(); },
    onClose: function () { if (tree) { tree.destroy(); tree = null; } }
  });
  host.addEventListener('keydown', function (e) { if ((e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') && !pop.isOpen() && e.target === host) { e.preventDefault(); pop.open(); } });
  host.addEventListener('click', function (e) {
    var x = e.target.closest('.zh-tselect-x'); if (!x) return;
    e.stopPropagation(); var n = ids[x.getAttribute('data-id')]; if (!n) return;
    n.checked = false; (function dn(m) { (m.children || []).forEach(function (c) { c.checked = false; dn(c); }); })(n);
    (function up(p) { for (; p; p = p.parent) { var k = p.children; p.checked = k.every(function (c) { return c.checked === true; }) ? true : k.every(function (c) { return !c.checked; }) ? false : 'mixed'; } })(n.parent);
    val = val.filter(function (v) { return v !== n; }); draw();
  }, true);
  draw();
}
treeSelect(tsel('zhTsSingle'), {});
treeSelect(tsel('zhTsMulti'), { multiple: true });

/* 7. big data */
var big = [], total = 0;
for (var a = 0; a < 25; a++) {
  var mids = [];
  for (var b = 0; b < 8; b++) { var leaves = []; for (var c = 0; c < 24; c++) leaves.push(N('节点-' + (a + 1) + '-' + (b + 1) + '-' + (c + 1) + '.log')); mids.push(N('分区 ' + (a + 1) + '.' + (b + 1), leaves)); }
  big.push(N('集群 ' + (a + 1), mids));
}
(function cnt(l) { l.forEach(function (n) { total++; if (n.children) cnt(n.children); }); })(big);
var bigTree = createTree(tsel('zhTreeBig'), {
  dir: true, virtual: true, data: big,
  onRender: function (s) { tsel('zhTrBigStat').textContent = '节点总数 ' + total.toLocaleString('zh-CN') + ' · 可见 ' + s.total.toLocaleString('zh-CN') + ' 行 · 已渲染 ' + s.rendered + ' 行'; }
});
tsel('zhTrBigOpen').addEventListener('click', function () { bigTree.expandAll(); });
tsel('zhTrBigClose').addEventListener('click', function () { bigTree.collapseAll(); });
window.ZHTree = { createTree: createTree, N: N, basic: basic, filter: flt, edit: edit, dir: dir, big: bigTree };
