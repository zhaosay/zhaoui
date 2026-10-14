var CAT = { display: '显示', flex: '弹性布局', grid: '网格', spacing: '间距', sizing: '尺寸与比例', text: '文字', color: '颜色', border: '边框与圆角', effects: '阴影与效果', position: '定位与层级', overflow: '溢出与滚动', interaction: '交互', transition: '过渡', visibility: '可见性', responsive: '响应式', state: '状态', layout: '布局辅助' };
var LIMIT = 40;
var root = document.getElementById('utilities');
if (!root) return;

/* ---- read the real stylesheet: everything between .zh-util-start and .zh-util-end ---- */
function collect() {
  var known = {}, order = [], started = false, done = false, cat = 'display';
  function visit(rule, inMedia) {
    if (done) return;
    if (rule.cssRules && rule.type === 4) { for (var i = 0; i < rule.cssRules.length; i++) visit(rule.cssRules[i], true); return; }
    if (rule.type !== 1) return;
    var sel = rule.selectorText;
    if (sel === '.zh-util-start') { started = true; return; }
    if (sel === '.zh-util-end') { done = true; return; }
    if (!started) return;
    var m = sel.match(/^\.zh-util-cat--([a-z-]+)$/);
    if (m) { cat = m[1]; return; }
    var re = /\.(zh-[a-z0-9_-]+)/g, mm;
    while ((mm = re.exec(sel))) {
      var name = mm[1];
      if (!known[name]) { known[name] = { name: name, cat: cat, decl: rule.style.cssText.replace(/;\s*/g, '; ').trim(), resp: inMedia || sel.indexOf(':where') === 0 }; order.push(name); }
    }
  }
  for (var s = 0; s < document.styleSheets.length && !done; s++) {
    var rules; try { rules = document.styleSheets[s].cssRules; } catch (e) { continue; }
    for (var r = 0; r < rules.length && !done; r++) visit(rules[r], false);
  }
  return { known: known, order: order };
}
var data = collect();
var groups = [], byCat = {};
data.order.forEach(function (n) { var c = data.known[n].cat; (byCat[c] = byCat[c] || []).push(data.known[n]); });
Object.keys(CAT).forEach(function (k) { if (byCat[k]) groups.push({ key: k, label: CAT[k], items: byCat[k], expanded: false }); });

var groupsEl = document.getElementById('utGroups'), chipsEl = document.getElementById('utChips');
var input = document.getElementById('utFilter'), emptyEl = document.getElementById('utEmpty'), resultEl = document.getElementById('utResult');
var activeCat = '';

document.getElementById('utCount').textContent = '· 共 ' + data.order.length + ' 个类';
groupsEl.innerHTML = groups.map(function (g) {
  return '<div class="zh-ut-group" data-cat="' + g.key + '"><h4>' + ZH.esc(g.label) + '<small>' + g.items.length + '</small></h4><div class="zh-ut-pills">' +
    g.items.map(function (it) { return '<button type="button" class="zh-ut-pill" data-cls="' + ZH.esc(it.name) + '" title="' + ZH.esc(it.decl) + '">' + ZH.esc(it.name) + '</button>'; }).join('') +
    '</div>' + (g.items.length > LIMIT ? '<button type="button" class="zh-ut-more" data-more="' + g.key + '">展开全部 ' + g.items.length + ' 个</button>' : '') + '</div>';
}).join('');
chipsEl.innerHTML = '<button type="button" class="zh-ut-chip" data-cat="" aria-pressed="true">全部<b>' + data.order.length + '</b></button>' +
  groups.map(function (g) { return '<button type="button" class="zh-ut-chip" data-cat="' + g.key + '" aria-pressed="false">' + ZH.esc(g.label) + '<b>' + g.items.length + '</b></button>'; }).join('');
groups.forEach(function (g) {
  g.el = groupsEl.querySelector('[data-cat="' + g.key + '"]');
  g.pills = [].slice.call(g.el.querySelectorAll('.zh-ut-pill'));
  g.more = g.el.querySelector('.zh-ut-more');
});

function refresh() {
  var q = input.value.trim().toLowerCase(), total = 0, visibleGroups = 0;
  groups.forEach(function (g) {
    var matched = 0;
    g.pills.forEach(function (p, i) {
      var it = g.items[i];
      var ok = !q || it.name.indexOf(q) >= 0 || it.decl.toLowerCase().indexOf(q) >= 0;
      if (ok) matched++;
      p.hidden = !(ok && (q || g.expanded || i < LIMIT));
    });
    var hide = (activeCat && activeCat !== g.key) || matched === 0;
    g.el.hidden = hide;
    if (g.more) { g.more.hidden = !!q || g.expanded; }
    if (!hide) { visibleGroups++; total += matched; }
  });
  emptyEl.hidden = visibleGroups > 0;
  resultEl.textContent = (q || activeCat) ? '匹配 ' + total + ' 个类' : '';
}
input.addEventListener('input', refresh);
chipsEl.addEventListener('click', function (e) {
  var b = e.target.closest('.zh-ut-chip'); if (!b) return;
  activeCat = b.getAttribute('data-cat');
  [].forEach.call(chipsEl.children, function (c) { c.setAttribute('aria-pressed', String(c === b)); });
  refresh();
});
groupsEl.addEventListener('click', function (e) {
  var more = e.target.closest('.zh-ut-more');
  if (more) { var g = groups.filter(function (x) { return x.key === more.getAttribute('data-more'); })[0]; g.expanded = true; refresh(); return; }
  var pill = e.target.closest('.zh-ut-pill'); if (!pill) return;
  copy(pill.getAttribute('data-cls'));
});
refresh();

function copy(text) {
  function done() { ZH.toast('已复制 ' + text); }
  function fallback() {
    var t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { ZH.toast(text); } t.remove();
  }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
}

/* ---- playground ---- */
var play = document.getElementById('utPlayInput'), sample = document.getElementById('utSample'), bad = document.getElementById('utBad');
function applyPlay() {
  var toks = play.value.split(/\s+/).filter(Boolean);
  sample.className = 'zh-ut-sample ' + toks.join(' ');
  var unknown = toks.filter(function (t) { return !data.known[t]; });
  bad.hidden = !unknown.length;
  bad.textContent = unknown.length ? '未知类：' + unknown.join('、') : '';
}
play.addEventListener('input', applyPlay);
document.getElementById('utPresets').addEventListener('click', function (e) {
  var p = e.target.closest('.zh-ut-preset'); if (!p) return;
  play.value = p.getAttribute('data-v'); applyPlay();
});
document.getElementById('utCopy').addEventListener('click', function () { copy(play.value.trim()); });
applyPlay();

/* ---- spacing scale, read from the live tokens ---- */
var cs = getComputedStyle(document.documentElement);
document.getElementById('utScale').innerHTML = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12].map(function (n) {
  var px = n === 0 ? '0px' : (cs.getPropertyValue('--zh-space-' + n).trim() || (n * 4) + 'px');
  return '<span>zh-p-' + n + '</span><span>' + px + '</span><i style="width:' + (n === 0 ? '2px' : 'calc(var(--zh-space-' + n + ') * 3)') + '"></i>';
}).join('');
