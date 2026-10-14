var root = document.getElementById('badge');
if (!root) return;

/* ---------- Badge marks: <span class="zh-bdg-mark" data-count|data-dot|data-text data-tone data-label> ---------- */
function paintMark(m) {
  var dot = m.dataset.dot === 'true', text = m.dataset.text, label = m.dataset.label || '';
  var n = +m.dataset.count || 0, max = +(m.dataset.max || 99), showZero = m.dataset.showZero === 'true';
  m.classList.toggle('is-dot', dot);
  m.classList.toggle('is-text', !!text && !dot);
  var hidden = !dot && !text && n <= 0 && !showZero;
  m.classList.toggle('is-hidden', hidden);
  m.setAttribute('aria-hidden', hidden ? 'true' : 'false');
  if (dot) { m.innerHTML = '<span class="zh-bdg-sr">' + ZH.esc(label || '有更新') + '</span>'; return; }
  if (text) { m.innerHTML = '<span aria-hidden="true">' + ZH.esc(text) + '</span><span class="zh-bdg-sr">' + ZH.esc(text) + '</span>'; return; }
  var shown = n > max ? max + '+' : String(Math.max(0, n));
  m.innerHTML = '<span aria-hidden="true">' + shown + '</span><span class="zh-bdg-sr">' + n + ' ' + ZH.esc(label) + '</span>';
}
function popMark(m) {
  if (ZH.reduced()) return;
  m.classList.remove('is-pop'); void m.offsetWidth; m.classList.add('is-pop');
}
root.querySelectorAll('.zh-bdg-mark').forEach(paintMark);

/* ---------- Playground ---------- */
var play = root.querySelector('#bdgPlay'), readout = root.querySelector('#bdgReadout');
function refresh(animate) {
  paintMark(play);
  if (animate) popMark(play);
  var n = +play.dataset.count, max = +play.dataset.max || 99;
  readout.textContent = play.dataset.dot === 'true' ? '红点模式：只表示有更新' : '数量 ' + n + (n > max ? '，显示为 ' + max + '+' : n === 0 ? (play.dataset.showZero === 'true' ? '，已显示 0' : '，徽章已隐藏') : '');
}
play.dataset.max = '99';
function bump(d) { play.dataset.count = Math.max(0, (+play.dataset.count || 0) + d); refresh(true); }
root.querySelector('#bdgMinus').addEventListener('click', function () { bump(-1); });
root.querySelector('#bdgPlus').addEventListener('click', function () { bump(1); });
root.querySelector('#bdgPlus10').addEventListener('click', function () { bump(10); });
root.querySelector('#bdgReset').addEventListener('click', function () { play.dataset.count = '8'; refresh(true); });
root.querySelector('#bdgZero').addEventListener('change', function (e) { play.dataset.showZero = e.target.checked ? 'true' : 'false'; refresh(true); });
root.querySelector('#bdgDot').addEventListener('change', function (e) { play.dataset.dot = e.target.checked ? 'true' : 'false'; refresh(true); });
root.querySelector('#bdgMax').addEventListener('change', function (e) { play.dataset.max = e.target.value; refresh(true); });
refresh(false);

/* ---------- Tabs with a clearable badge ---------- */
var tabs = root.querySelector('#bdgTabs');
tabs.addEventListener('click', function (e) {
  var b = e.target.closest('button'); if (!b) return;
  tabs.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
  if (b.hasAttribute('data-clear')) { var m = b.querySelector('.zh-bdg-mark'); if (m) { m.dataset.count = '0'; paintMark(m); } }
});

/* ---------- Avatars ---------- */
function isCJK(ch) { return /[㐀-鿿]/.test(ch); }
function initials(name) {
  name = (name || '').trim(); if (!name) return '';
  if (isCJK(name.charAt(0))) return name.charAt(0);
  var w = name.split(/\s+/); return (w[0].charAt(0) + (w[1] ? w[1].charAt(0) : '')).toUpperCase();
}
function hue(name) { var h = 0; for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0; return h % 8 + 1; }
function art(seed) {
  var a = (hue(String(seed)) % 4) * 20;
  return '<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true"><rect width="100" height="100" style="fill:var(--zh-seq-1)"/><circle cx="' + (30 + a / 2) + '" cy="35" r="34" style="fill:var(--zh-seq-3)"/><circle cx="72" cy="' + (78 - a / 3) + '" r="30" style="fill:var(--zh-seq-5);opacity:.85"/></svg>';
}
function hydrateAvatar(el) {
  if (el.dataset.ready) return; el.dataset.ready = '1';
  var name = el.dataset.name || '', face = document.createElement('span'); face.className = 'zh-avatar-face';
  el.style.setProperty('--av', 'var(--zh-chart-' + hue(name || 'x') + ')');
  el.setAttribute('role', 'img'); el.setAttribute('aria-label', name || '未命名用户');
  function fallback() {
    face.innerHTML = '';
    if (el.dataset.icon || !initials(name)) { face.innerHTML = ZH.iconHtml(el.dataset.icon || 'user'); }
    else { var s = document.createElement('span'); s.textContent = initials(name); face.appendChild(s); }
  }
  var src = el.dataset.src;
  if (src === 'art') { face.innerHTML = art(name); }
  else if (src) {
    var img = new Image(); img.alt = ''; img.onerror = fallback; img.src = src; face.appendChild(img);
  } else fallback();
  el.appendChild(face);
  if (el.dataset.status) { var st = document.createElement('span'); st.className = 'zh-avatar-status'; st.dataset.tone = el.dataset.status; el.appendChild(st); }
}
root.querySelectorAll('.zh-avatar[data-name]').forEach(hydrateAvatar);

var MEMBERS = [['张三', '设计'], ['李四', '研发'], ['Ada Lovelace', 'Engineering'], ['王五', '运营'], ['Grace Hopper', 'Research'], ['赵六', '市场'], ['陈七', '客服'], ['Linus T', 'Kernel'], ['周八', '财务']];
function buildGroup(host, size, max) {
  host.innerHTML = '';
  MEMBERS.slice(0, max).forEach(function (m) { var a = document.createElement('span'); a.className = 'zh-avatar'; a.dataset.name = m[0]; a.dataset.size = size; a.tabIndex = 0; a.title = m[0]; hydrateAvatar(a); host.appendChild(a); });
  var rest = MEMBERS.slice(max);
  if (!rest.length) return;
  var more = document.createElement('button'); more.type = 'button'; more.className = 'zh-avatar is-more'; more.dataset.size = size;
  more.setAttribute('aria-label', '另外 ' + rest.length + ' 位成员');
  more.innerHTML = '<span class="zh-avatar-face"><span>+' + rest.length + '</span></span>';
  host.appendChild(more);
  ZH.popover(more, {
    placement: 'bottom-start', z: 'popover', role: 'dialog', className: 'zh-avatar-pop',
    content: function () {
      var ul = document.createElement('ul'); ul.className = 'zh-avatar-list'; ul.setAttribute('aria-label', '其余成员');
      rest.forEach(function (m) {
        var li = document.createElement('li'), a = document.createElement('span'); a.className = 'zh-avatar'; a.dataset.name = m[0]; a.dataset.size = 'sm'; hydrateAvatar(a);
        var t = document.createElement('span'); t.textContent = m[0]; var sub = document.createElement('span'); sub.className = 'sub'; sub.textContent = m[1]; t.appendChild(sub);
        li.appendChild(a); li.appendChild(t); ul.appendChild(li);
      });
      return ul;
    }
  });
}
buildGroup(root.querySelector('#avGroup'), 'md', 5);
buildGroup(root.querySelector('#avGroupSm'), 'sm', 3);

/* ---------- Tags ---------- */
var DEFAULT_TAGS = [['设计', 'primary'], ['研发', ''], ['运营', 'success'], ['待评审', 'warning']];
var closable = root.querySelector('#tagClosable'), tagMsg = root.querySelector('#tagMsg');
function makeClosable(label, tone) {
  var t = document.createElement('span'); t.className = 'zh-tag zh-tag--x' + (tone ? ' ' + tone : '');
  var s = document.createElement('span'); s.textContent = label; t.appendChild(s);
  var b = document.createElement('button'); b.type = 'button'; b.className = 'zh-tag-close'; b.setAttribute('aria-label', '移除 ' + label); b.innerHTML = ZH.iconHtml('x');
  t.appendChild(b); return t;
}
function addButton() {
  var b = document.createElement('button'); b.type = 'button'; b.className = 'zh-tag-add'; b.innerHTML = ZH.iconHtml('plus') + '新标签'; return b;
}
function renderTags() {
  closable.innerHTML = '';
  DEFAULT_TAGS.forEach(function (t) { closable.appendChild(makeClosable(t[0], t[1])); });
  closable.appendChild(addButton()); tagMsg.textContent = '';
}
function labels() { return [].slice.call(closable.querySelectorAll('.zh-tag > span:first-child')).map(function (s) { return s.textContent; }); }
function flip(container, mutate) {
  var kids = [].slice.call(container.children), first = kids.map(function (k) { return k.getBoundingClientRect(); });
  mutate();
  if (ZH.reduced()) return;
  kids.forEach(function (k, i) {
    if (!k.isConnected) return;
    var last = k.getBoundingClientRect(), dx = first[i].left - last.left, dy = first[i].top - last.top;
    if (!dx && !dy) return;
    k.style.transition = 'none'; k.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    requestAnimationFrame(function () { k.style.transition = 'transform var(--zh-dur-base) var(--zh-ease-standard)'; k.style.transform = ''; setTimeout(function () { k.style.transition = ''; }, 260); });
  });
}
closable.addEventListener('click', function (e) {
  var c = e.target.closest('.zh-tag-close');
  if (c) {
    var tag = c.closest('.zh-tag'), name = tag.firstChild.textContent;
    tag.classList.add('is-leaving');
    setTimeout(function () { flip(closable, function () { tag.remove(); }); tagMsg.textContent = '已移除「' + name + '」'; var nb = closable.querySelector('.zh-tag-add,.zh-tag-input'); if (nb && nb.focus) nb.focus(); }, ZH.reduced() ? 0 : 130);
    return;
  }
  var add = e.target.closest('.zh-tag-add');
  if (add) startAdd(add);
});
function startAdd(btn) {
  var inp = document.createElement('input'); inp.className = 'zh-tag-input'; inp.maxLength = 12; inp.setAttribute('aria-label', '新标签名称'); inp.placeholder = '输入后回车';
  btn.replaceWith(inp); inp.focus(); var done = false;
  function finish(commit) {
    if (done) return; done = true;
    var v = inp.value.trim(), nb = addButton();
    if (commit && v) {
      if (labels().indexOf(v) >= 0) tagMsg.textContent = '「' + v + '」已存在';
      else { inp.replaceWith(nb); closable.insertBefore(makeClosable(v, ''), nb); tagMsg.textContent = '已添加「' + v + '」'; nb.focus(); return; }
    }
    inp.replaceWith(nb); nb.focus();
  }
  inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); finish(true); } else if (e.key === 'Escape') { e.stopPropagation(); finish(false); } });
  inp.addEventListener('blur', function () { finish(true); });
}
root.querySelector('#tagReset').addEventListener('click', renderTags);
renderTags();

/* Checkable tags */
function bindRadio(group, out) {
  var items = function () { return [].slice.call(group.querySelectorAll('[role=radio]')); };
  function select(el) {
    items().forEach(function (x) { var on = x === el; x.setAttribute('aria-checked', String(on)); x.tabIndex = on ? 0 : -1; });
    out.textContent = '已选：' + el.textContent.trim();
  }
  group.addEventListener('click', function (e) { var r = e.target.closest('[role=radio]'); if (r) { select(r); } });
  ZH.rovingFocus(group, '[role=radio]', { orientation: 'horizontal', typeahead: false, onFocus: select });
  out.textContent = '已选：' + group.querySelector('[aria-checked=true]').textContent.trim();
}
bindRadio(root.querySelector('#tagRadio'), root.querySelector('#tagRadioOut'));
var multi = root.querySelector('#tagMulti'), multiOut = root.querySelector('#tagMultiOut');
function multiReport() {
  var on = [].slice.call(multi.querySelectorAll('[aria-checked=true]')).map(function (x) { return x.textContent.trim(); });
  multiOut.textContent = on.length ? '已选 ' + on.length + ' 项：' + on.join('、') : '未选择';
}
multi.addEventListener('click', function (e) { var b = e.target.closest('[role=checkbox]'); if (!b) return; b.setAttribute('aria-checked', String(b.getAttribute('aria-checked') !== 'true')); multiReport(); });
multiReport();

/* Categorical marker tags */
var CATS = ['设计', '研发', '运营', '市场', '客服', '财务', '法务', '人事'];
root.querySelector('#tagCats').innerHTML = CATS.map(function (c, i) {
  return '<span class="zh-tag zh-tag--x"><i class="zh-tag-dot" style="--dot:var(--zh-chart-' + (i + 1) + ')"></i>' + ZH.esc(c) + '</span>';
}).join('');

ZH.hydrateIcons(root);
