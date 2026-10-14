// Date / date range / time / date-time pickers. Declarative (the host is an empty <div>; the control is built inside it):
//   <div data-zh-date data-name="birthday" data-value="2026-10-01" data-min="2026-09-01" data-max="2026-12-31" data-msg="#status" aria-label="日期"></div>
//   <div data-zh-daterange data-name-start="from" data-name-end="to" data-start="2026-10-01" data-end="2026-10-07" data-max="2026-12-31"></div>
//   <div data-zh-time data-name="at" data-value="09:30" data-seconds data-step-minutes="15"></div>
//   <div data-zh-datetime data-name="when" data-value="2026-10-01 09:30" data-disable-weekends></div>
// data-*: name (hidden input for forms), value, min, max, placeholder, size (sm|md|lg), label / labelledby / aria-label, msg (selector of a status element, read by screen readers),
//   disable-weekends, disabled-dates ("2026-10-01,2026-10-02"), presets="false" (range), seconds / step-minutes (time).
// Imperative: ZhaoUI.datePicker / dateRangePicker / timePicker / dateTimePicker(host, cfg) — cfg also takes disabledDate(date) -> '' | reason string, onChange.
// Events: zh:date-change { value, date }, zh:daterange-change { start, end, dates }, zh:time-change { value, time }, zh:datetime-change { value, date, time }. Weeks start on Monday.
var ic = ZH.iconHtml;
function keepClasses(el) { return (el.className || '').split(/\s+/).filter(function (x) { return x && x.indexOf('zh-dp') !== 0 && x !== 'has-value' && x !== 'is-open' && x !== 'is-invalid'; }).join(' ') + ' '; }
function $(s, r) { return (r || document).querySelector(s); }
function isPhone() { return window.matchMedia('(max-width: 767px)').matches; }

/* ---------------- date maths (plain Date, week starts Monday) ---------------- */
function pad(n) { return (n < 10 ? '0' : '') + n; }
function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function fromYmd(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function key(d) { return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
function same(a, b) { return !!a && !!b && key(a) === key(b); }
function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
function addMonths(d, n) { var t = new Date(d.getFullYear(), d.getMonth() + n, 1), last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate(); t.setDate(Math.min(d.getDate(), last)); return t; }
function som(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function eom(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
var TODAY = (function () { var t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); })();
var WDN = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'], WDS = ['一', '二', '三', '四', '五', '六', '日'];
function dayLabel(d) { return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + WDN[(d.getDay() + 6) % 7]; }
function parseDate(str) {
  var m = String(str).trim().match(/^(\d{4})\s*[-\/.年]\s*(\d{1,2})\s*[-\/.月]\s*(\d{1,2})\s*日?$/);
  if (!m) return null;
  var y = +m[1], mo = +m[2], d = +m[3], dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d ? dt : null;
}
function parseTime(str) {
  var m = String(str).trim().match(/^(\d{1,2})[:：](\d{1,2})(?:[:：](\d{1,2}))?$/);
  if (!m) return null;
  var h = +m[1], mi = +m[2], s = m[3] == null ? 0 : +m[3];
  return h < 24 && mi < 60 && s < 60 ? { h: h, m: mi, s: s } : null;
}
function fmtTime(t, sec) { return pad(t.h) + ':' + pad(t.m) + (sec ? ':' + pad(t.s) : ''); }

/* ---------------- calendar engine ---------------- */
function Cal(o) {
  var st = Object.assign({ view: som(TODAY), months: 1, mode: 'day', outside: true, isDisabled: null, selected: null, range: null, marks: null, focus: null, onPick: null, onHover: null, fm: 0, fy: 0 }, o);
  var root = document.createElement('div'); root.className = 'zh-dp-cal';

  function visEnd() { return addDays(new Date(st.view.getFullYear(), st.view.getMonth() + st.months, 1), -1); }
  function inView(d) { return key(d) >= key(st.view) && key(d) <= key(visEnd()); }
  function ensureFocus() {
    if (!st.focus || !inView(st.focus)) {
      var c = [st.selected, st.range && st.range.start, TODAY].filter(function (x) { return x && inView(x); })[0];
      st.focus = c || st.view;
    }
  }
  function head(idx, y, m, n) {
    var l = idx === 0, r = idx === n - 1;
    function nav(act, label, icon, show) { return '<button type="button" class="zh-dp-nav' + (show ? '' : ' is-ghost') + '" data-act="' + act + '" aria-label="' + label + '"' + (show ? '' : ' tabindex="-1" aria-hidden="true"') + '>' + ic(icon, 16) + '</button>'; }
    return '<div class="zh-dp-head">' + nav('py', '上一年', 'chevrons-left', l) + nav('pm', '上个月', 'chevron-left', l) +
      '<button type="button" class="zh-dp-title" data-act="months" aria-live="polite">' + y + '年 ' + (m + 1) + '月</button>' +
      nav('nm', '下个月', 'chevron-right', r) + nav('ny', '下一年', 'chevrons-right', r) + '</div>';
  }
  function monthTable(y, m) {
    var first = new Date(y, m, 1), start = addDays(first, -((first.getDay() + 6) % 7)), rows = '';
    for (var w = 0; w < 6; w++) {
      rows += '<tr>';
      for (var k = 0; k < 7; k++) {
        var d = addDays(start, w * 7 + k), inM = d.getMonth() === m;
        if (!inM && !st.outside) { rows += '<td role="gridcell" class="zh-dp-td is-empty"></td>'; continue; }
        rows += '<td role="gridcell" class="zh-dp-td"><button type="button" class="zh-dp-day' + (inM ? '' : ' is-outside') + '" data-d="' + ymd(d) + '" tabindex="-1" aria-label="' + dayLabel(d) + '"><span class="zh-dp-num">' + d.getDate() + '</span><span class="zh-dp-dots"></span></button></td>';
      }
      rows += '</tr>';
    }
    return '<table role="grid" class="zh-dp-grid" aria-label="' + y + '年' + (m + 1) + '月"><thead><tr>' + WDS.map(function (w, i) { return '<th scope="col" abbr="' + WDN[i] + '">' + w + '</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table>';
  }
  function cellsHtml(items, focusIdx) {
    return '<div class="zh-dp-cells" role="grid">' + items.map(function (it, i) {
      return '<button type="button" class="zh-dp-cell' + (it.cls ? ' ' + it.cls : '') + '" data-c="' + it.val + '" data-i="' + i + '" tabindex="' + (i === focusIdx ? 0 : -1) + '" aria-label="' + it.aria + '">' + it.label + '</button>';
    }).join('') + '</div>';
  }
  function yearBase() { return Math.floor(st.view.getFullYear() / 10) * 10 - 1; }
  function render() {
    var ae = document.activeElement, keep = null;
    if (root.contains(ae)) keep = ae.getAttribute('data-d') ? 'd' : ae.getAttribute('data-act') ? 'a' : ae.getAttribute('data-c') ? 'c' : null;
    var keepVal = keep === 'd' ? ae.getAttribute('data-d') : keep === 'a' ? ae.getAttribute('data-act') : keep === 'c' ? ae.getAttribute('data-i') : null;
    var html, y = st.view.getFullYear();
    if (st.mode === 'day') {
      ensureFocus(); html = '';
      for (var i = 0; i < st.months; i++) { var v = new Date(st.view.getFullYear(), st.view.getMonth() + i, 1); html += '<div class="zh-dp-month">' + head(i, v.getFullYear(), v.getMonth(), st.months) + monthTable(v.getFullYear(), v.getMonth()) + '</div>'; }
    } else if (st.mode === 'month') {
      var items = []; for (var m = 0; m < 12; m++) items.push({ val: m, label: (m + 1) + '月', aria: y + '年' + (m + 1) + '月', cls: (st.selected && st.selected.getFullYear() === y && st.selected.getMonth() === m ? 'is-selected' : '') + (TODAY.getFullYear() === y && TODAY.getMonth() === m ? ' is-today' : '') });
      html = '<div class="zh-dp-month"><div class="zh-dp-head"><button type="button" class="zh-dp-nav" data-act="py" aria-label="上一年">' + ic('chevron-left', 16) + '</button><button type="button" class="zh-dp-title" data-act="years">' + y + '年</button><button type="button" class="zh-dp-nav" data-act="ny" aria-label="下一年">' + ic('chevron-right', 16) + '</button></div>' + cellsHtml(items, st.fm) + '</div>';
    } else {
      var b = yearBase(), items2 = []; for (var k = 0; k < 12; k++) { var yy = b + k; items2.push({ val: yy, label: yy, aria: yy + '年', cls: (yy < b + 1 || yy > b + 10 ? 'is-outside ' : '') + (st.selected && st.selected.getFullYear() === yy ? 'is-selected ' : '') + (TODAY.getFullYear() === yy ? 'is-today' : '') }); }
      html = '<div class="zh-dp-month"><div class="zh-dp-head"><button type="button" class="zh-dp-nav" data-act="py" aria-label="上一个十年">' + ic('chevron-left', 16) + '</button><button type="button" class="zh-dp-title" disabled>' + (b + 1) + ' – ' + (b + 10) + '</button><button type="button" class="zh-dp-nav" data-act="ny" aria-label="下一个十年">' + ic('chevron-right', 16) + '</button></div>' + cellsHtml(items2, st.fy) + '</div>';
    }
    root.innerHTML = html; paint();
    if (keep) {
      var sel = keep === 'd' ? '[data-d="' + keepVal + '"]' : keep === 'a' ? '[data-act="' + keepVal + '"]' : '[data-i="' + keepVal + '"]';
      var t = root.querySelector(sel) || root.querySelector('[tabindex="0"]'); if (t) t.focus({ preventScroll: true });
    }
  }
  function paint() {
    if (st.mode !== 'day') return;
    var r = st.range;
    [].forEach.call(root.querySelectorAll('.zh-dp-day'), function (b) {
      var d = fromYmd(b.getAttribute('data-d')), td = b.parentNode;
      var dis = st.isDisabled ? !!st.isDisabled(d) : false, k = key(d);
      var sel = same(d, st.selected), isS = false, isE = false, mid = false, pv = false;
      if (r && r.start) {
        var s = r.start, e = r.end, h = r.hover;
        if (e) { isS = same(d, s); isE = same(d, e); mid = k >= key(s) && k <= key(e); }
        else if (h) { var lo = key(h) < key(s) ? h : s, hi = key(h) < key(s) ? s : h; mid = pv = k >= key(lo) && k <= key(hi); isS = same(d, lo); isE = same(d, hi); }
        else { isS = same(d, s); isE = isS; mid = isS; }
      }
      b.classList.toggle('is-today', same(d, TODAY));
      b.classList.toggle('is-selected', sel || (r && r.start && (r.end ? (isS || isE) : same(d, r.start))));
      b.classList.toggle('is-disabled', dis);
      if (dis) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled');
      if (same(d, TODAY)) b.setAttribute('aria-current', 'date'); else b.removeAttribute('aria-current');
      td.classList.toggle('is-in-range', mid); td.classList.toggle('is-range-start', isS && mid); td.classList.toggle('is-range-end', isE && mid); td.classList.toggle('is-preview', pv);
      td.setAttribute('aria-selected', String(!!(sel || (r && mid && !pv))));
      var mk = st.marks ? st.marks(d) : null, dots = b.querySelector('.zh-dp-dots'), label = dayLabel(d);
      dots.innerHTML = mk && mk.dots ? mk.dots.map(function (c) { return '<i class="c' + c + '"></i>'; }).join('') : '';
      if (mk && mk.heat) b.setAttribute('data-heat', mk.heat); else b.removeAttribute('data-heat');
      if (mk && mk.label) label += '，' + mk.label;
      if (dis && st.reason) { var why = st.reason(d); if (why) label += '，不可选：' + why; b.title = why || ''; } else b.removeAttribute('title');
      b.setAttribute('aria-label', label);
      b.tabIndex = same(d, st.focus) ? 0 : -1;
    });
  }
  function focusDate(d, doFocus) {
    st.focus = d;
    if (st.mode !== 'day') return;
    if (!inView(d)) {
      var v = som(d); if (key(d) > key(visEnd())) v = new Date(d.getFullYear(), d.getMonth() - (st.months - 1), 1);
      st.view = v; render();
    } else paint();
    if (doFocus) { var b = root.querySelector('[data-d="' + ymd(d) + '"]'); if (b) b.focus(); }
  }
  function focusInto() {
    if (st.mode === 'day') { ensureFocus(); paint(); var b = root.querySelector('[data-d="' + ymd(st.focus) + '"]'); if (b) b.focus(); }
    else { var c = root.querySelector('[tabindex="0"]'); if (c) c.focus(); }
  }
  function act(a) {
    var y = st.view.getFullYear(), m = st.view.getMonth();
    if (a === 'months') { st.mode = 'month'; st.fm = st.selected && st.selected.getFullYear() === y ? st.selected.getMonth() : m; }
    else if (a === 'years') { st.mode = 'year'; st.fy = y - yearBase(); }
    else if (st.mode === 'day') st.view = new Date(y + (a === 'py' ? -1 : a === 'ny' ? 1 : 0), m + (a === 'pm' ? -1 : a === 'nm' ? 1 : 0), 1);
    else if (st.mode === 'month') st.view = new Date(y + (a === 'py' ? -1 : 1), m, 1);
    else st.view = new Date(y + (a === 'py' ? -10 : 10), m, 1);
    render();
  }
  root.addEventListener('click', function (e) {
    var a = e.target.closest('[data-act]'); if (a) { act(a.getAttribute('data-act')); return; }
    var b = e.target.closest('.zh-dp-day');
    if (b) {
      if (b.getAttribute('aria-disabled') === 'true') return;
      var d = fromYmd(b.getAttribute('data-d')); st.focus = d;
      if (b.classList.contains('is-outside')) { st.view = som(d); render(); }
      if (st.onPick) st.onPick(d); return;
    }
    var c = e.target.closest('.zh-dp-cell');
    if (c) {
      var v = +c.getAttribute('data-c'), y = st.view.getFullYear();
      if (st.mode === 'month') { st.view = new Date(y, v, 1); st.mode = 'day'; st.focus = new Date(y, v, Math.min((st.focus || TODAY).getDate(), eom(new Date(y, v, 1)).getDate())); render(); focusInto(); }
      else { st.view = new Date(v, st.view.getMonth(), 1); st.mode = 'month'; st.fm = st.view.getMonth(); render(); focusInto(); }
    }
  });
  root.addEventListener('mouseover', function (e) { var b = e.target.closest('.zh-dp-day'); if (b && st.onHover) st.onHover(fromYmd(b.getAttribute('data-d'))); });
  root.addEventListener('mouseleave', function () { if (st.onHover) st.onHover(null); });
  root.addEventListener('keydown', function (e) {
    var k = e.key;
    if (st.mode === 'day') {
      var b = e.target.closest('.zh-dp-day'); if (!b) return;
      var d = fromYmd(b.getAttribute('data-d')), nd = null, dow = (d.getDay() + 6) % 7;
      if (k === 'ArrowLeft') nd = addDays(d, -1); else if (k === 'ArrowRight') nd = addDays(d, 1);
      else if (k === 'ArrowUp') nd = addDays(d, -7); else if (k === 'ArrowDown') nd = addDays(d, 7);
      else if (k === 'Home') nd = addDays(d, -dow); else if (k === 'End') nd = addDays(d, 6 - dow);
      else if (k === 'PageUp') nd = addMonths(d, e.shiftKey ? -12 : -1); else if (k === 'PageDown') nd = addMonths(d, e.shiftKey ? 12 : 1);
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); b.click(); return; }
      if (nd) { e.preventDefault(); focusDate(nd, true); }
      return;
    }
    var c = e.target.closest('.zh-dp-cell'); if (!c) return;
    var i = +c.getAttribute('data-i'), ni = null;
    if (k === 'ArrowLeft') ni = i - 1; else if (k === 'ArrowRight') ni = i + 1; else if (k === 'ArrowUp') ni = i - 3; else if (k === 'ArrowDown') ni = i + 3;
    else if (k === 'Home') ni = 0; else if (k === 'End') ni = 11;
    else if (k === 'Enter' || k === ' ') { e.preventDefault(); c.click(); return; }
    if (ni != null && ni >= 0 && ni < 12) { e.preventDefault(); if (st.mode === 'month') st.fm = ni; else st.fy = ni; render(); var t = root.querySelector('[data-i="' + ni + '"]'); if (t) t.focus(); }
  });
  render();
  return { el: root, st: st, render: render, paint: paint, focusDate: focusDate, focusInto: focusInto };
}

/* ---------------- shared bits ---------------- */
function fieldMarkup(host, size, icon, inner) {
  host.className = keepClasses(host) + 'zh-dp zh-dp--' + size;
  host.innerHTML = '<span class="zh-dp-ico">' + ic(icon, 16) + '</span>' + inner + '<button type="button" class="zh-dp-clear" tabindex="-1" aria-label="清除">' + ic('x', 12) + '</button>';
}
function msgSetter(sel) {
  var el = sel ? (typeof sel === 'string' ? document.querySelector(sel) : sel) : null, base = el ? el.textContent : '';
  return function (text, err) { if (!el) return; el.textContent = text == null ? base : text; el.classList.toggle('zh-dp-msg-err', !!err); if (err) el.setAttribute('role', 'alert'); else el.removeAttribute('role'); };
}
function cleanAria(host) { host.removeAttribute('aria-haspopup'); host.removeAttribute('aria-expanded'); host.removeAttribute('aria-controls'); }
function popFor(host, input, build, hooks) {
  var pid = ZH.uid('dpp');
  var pop = ZH.popover(host, {
    content: build, trigger: 'manual', role: 'presentation', z: 'dropdown', placement: 'bottom-start', offset: 6, restoreFocus: false,
    onOpen: function (el) {
      cleanAria(host); host.classList.add('is-open'); input.setAttribute('aria-expanded', 'true'); input.setAttribute('aria-controls', pid);
      var panel = el.querySelector('[role=dialog]'); if (panel) panel.id = pid;
      el.addEventListener('focusout', function (e) { var n = e.relatedTarget; if (n && pop.el && !pop.el.contains(n) && !host.contains(n)) pop.toggle(); });
      if (hooks.onOpen) hooks.onOpen(el);
    },
    onClose: function () {
      cleanAria(host); host.classList.remove('is-open'); input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-controls');
      var ae = document.activeElement; if (!ae || ae === document.body || (ae.closest && ae.closest('.zh-pop'))) input.focus({ preventScroll: true });
      if (hooks.onClose) hooks.onClose();
    }
  });
  cleanAria(host);
  return pop;
}
function footBtn(text, cls) { var b = document.createElement('button'); b.type = 'button'; b.className = 'zh-btn sm ' + (cls || 'text'); b.textContent = text; return b; }

/* ---------------- single date picker ---------------- */
function DatePicker(host, cfg) {
  var c = Object.assign({ value: null, placeholder: 'YYYY-MM-DD', size: 'md', clearable: true, showToday: true, disabledDate: null, min: null, max: null, label: '选择日期', labelledby: '', onChange: null, msg: null }, cfg);
  var value = c.value ? fromYmd(c.value) : null, cal = null, pop;
  fieldMarkup(host, c.size, 'calendar-days', '<input class="zh-input" type="text" role="combobox" aria-haspopup="dialog" aria-expanded="false" autocomplete="off" inputmode="numeric" placeholder="' + c.placeholder + '"' + (c.labelledby ? ' aria-labelledby="' + c.labelledby + '"' : '') + '>');
  var input = host.querySelector('input'), setMsg = msgSetter(c.msg);

  function reason(d) {
    if (c.min && key(d) < key(c.min)) return '早于最早可选日期 ' + ymd(c.min);
    if (c.max && key(d) > key(c.max)) return '晚于最晚可选日期 ' + ymd(c.max);
    if (c.disabledDate) { var r = c.disabledDate(d); if (r) return typeof r === 'string' ? r : '该日期不可选'; }
    return '';
  }
  function setInvalid(msg) { host.classList.add('is-invalid'); input.setAttribute('aria-invalid', 'true'); setMsg(msg, true); }
  function clearInvalid() { host.classList.remove('is-invalid'); input.removeAttribute('aria-invalid'); setMsg(null, false); }
  function setValue(d, fromUser) {
    value = d; input.value = d ? ymd(d) : ''; host.classList.toggle('has-value', !!d); clearInvalid();
    if (cal) { cal.st.selected = d; cal.paint(); }
    if (fromUser && c.onChange) c.onChange(d);
    if (fromUser) host.dispatchEvent(new CustomEvent('zh:date-change', { bubbles: true, detail: { value: d ? ymd(d) : '', date: d } }));
    if (fromUser) setMsg(d ? '已选择 ' + dayLabel(d) : null, false);
  }
  function commitText() {
    var t = input.value.trim();
    if (!t) { setValue(null, true); return; }
    var d = parseDate(t);
    if (!d) { setInvalid('格式不对，请输入 YYYY-MM-DD，例如 ' + ymd(TODAY)); return; }
    var r = reason(d); if (r) { setInvalid(ymd(d) + ' 不可选：' + r); return; }
    setValue(d, true);
  }
  pop = popFor(host, input, function () {
    var box = document.createElement('div'); box.className = 'zh-dp-panel'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', c.label);
    cal = Cal({ view: som(value || TODAY), selected: value, focus: value || TODAY, isDisabled: function (d) { return !!reason(d); }, reason: reason, marks: c.marks,
      onPick: function (d) { setValue(d, true); pop.toggle(); } });
    box.appendChild(cal.el);
    var foot = document.createElement('div'); foot.className = 'zh-dp-foot';
    var today = footBtn('今天'), clr = footBtn('清除');
    today.addEventListener('click', function () { if (reason(TODAY)) { ZhaoUI.message('今天不可选：' + reason(TODAY), { type: 'warning' }); return; } setValue(TODAY, true); pop.toggle(); });
    clr.addEventListener('click', function () { setValue(null, true); pop.toggle(); });
    foot.appendChild(today); foot.appendChild(clr); box.appendChild(foot);
    return box;
  }, { onOpen: function () { if (cal) cal.focusInto(); }, onClose: function () { cal = null; } });

  function open() { if (!pop.isOpen()) pop.open(); }
  host.addEventListener('click', function (e) {
    if (e.target.closest('.zh-dp-clear')) { setValue(null, true); input.focus(); return; }
    if (pop.isOpen()) { if (e.target !== input) pop.toggle(); } else open();
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (pop.isOpen()) cal && cal.focusInto(); else open(); }
    else if (e.key === 'Enter') { e.preventDefault(); commitText(); if (pop.isOpen() && !host.classList.contains('is-invalid')) pop.toggle(); }
  });
  input.addEventListener('input', function () {
    host.classList.toggle('has-value', !!input.value);
    var d = parseDate(input.value);
    if (d && !reason(d) && cal) { cal.st.view = som(d); cal.st.selected = d; cal.st.focus = d; cal.render(); }
  });
  input.addEventListener('change', commitText);
  setValue(value, false);
  return { el: host, input: input, get: function () { return value; }, set: function (d) { setValue(d, false); }, open: open, close: function () { if (pop.isOpen()) pop.toggle(); } };
}

/* ---------------- range picker ---------------- */
function RangePicker(host, cfg) {
  var c = Object.assign({ start: null, end: null, size: 'md', max: null, min: null, presets: true, label: '选择日期范围', labelledby: '', onChange: null, msg: null }, cfg);
  var start = c.start, end = c.end, step = 0, hover = null, cal = null, pop, panelEl = null;
  fieldMarkup(host, c.size, 'calendar-range', '<div class="zh-dp-field" role="group" aria-label="' + c.label + '"><input class="zh-dp-rin" data-i="0" type="text" role="combobox" aria-haspopup="dialog" aria-expanded="false" autocomplete="off" placeholder="开始日期" aria-label="开始日期"><span class="zh-dp-sep" aria-hidden="true">' + ic('arrow-right', 14) + '</span><input class="zh-dp-rin" data-i="1" type="text" autocomplete="off" placeholder="结束日期" aria-label="结束日期"></div>');
  host.classList.add('zh-dp--range');   // CSS gives it a minimum width so both placeholders fit
  var field = host.firstChild.nextSibling, ins = [].slice.call(field.querySelectorAll('input')), setMsg = msgSetter(c.msg);
  field.style.cssText = ''; host.style.position = 'relative';

  function reason(d) {
    if (c.min && key(d) < key(c.min)) return '早于最早可选日期';
    if (c.max && key(d) > key(c.max)) return '晚于最晚可选日期 ' + ymd(c.max);
    return '';
  }
  function sync() {
    ins[0].value = start ? ymd(start) : ''; ins[1].value = end ? ymd(end) : '';
    host.classList.toggle('has-value', !!(start || end));
    ins[0].classList.toggle('is-active', pop && pop.isOpen() && step === 0); ins[1].classList.toggle('is-active', pop && pop.isOpen() && step === 1);
    if (cal) { cal.st.range = { start: start, end: end, hover: hover }; cal.paint(); }
    var s = panelEl && panelEl.querySelector('.zh-dp-picked'); if (s) s.textContent = start && end ? ymd(start) + ' → ' + ymd(end) + '（共 ' + (Math.round((end - start) / 864e5) + 1) + ' 天）' : start ? '请选择结束日期' : '请选择开始日期';
  }
  function report() {
    if (start && end) setMsg('已选 ' + ymd(start) + ' 至 ' + ymd(end) + '，共 ' + (Math.round((end - start) / 864e5) + 1) + ' 天', false); else setMsg('—', false);
    if (c.onChange) c.onChange(start, end);
    host.dispatchEvent(new CustomEvent('zh:daterange-change', { bubbles: true, detail: { start: start ? ymd(start) : '', end: end ? ymd(end) : '', dates: [start, end] } }));
  }
  function setRange(a, b, user) { start = a; end = b; step = 0; hover = null; host.classList.remove('is-invalid'); sync(); if (user) report(); }
  function pick(d) {
    if (step === 0 || (start && end)) { start = d; end = null; step = 1; hover = null; sync(); return; }
    if (key(d) < key(start)) { end = start; start = d; } else end = d;
    step = 0; hover = null; sync(); report(); if (pop.isOpen()) pop.toggle();
  }
  var PRESETS = [
    ['近 7 天', function () { return [addDays(TODAY, -6), TODAY]; }], ['近 30 天', function () { return [addDays(TODAY, -29), TODAY]; }],
    ['本月', function () { return [som(TODAY), TODAY]; }], ['上月', function () { var p = addMonths(TODAY, -1); return [som(p), eom(p)]; }]
  ];
  pop = popFor(host, ins[0], function () {
    var phone = isPhone();
    var box = document.createElement('div'); box.className = 'zh-dp-panel is-range' + (phone ? ' is-phone' : ''); box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', c.label);
    if (c.presets) {
      var pr = document.createElement('div'); pr.className = 'zh-dp-presets'; pr.setAttribute('role', 'group'); pr.setAttribute('aria-label', '快捷选择');
      PRESETS.forEach(function (p) { var b = document.createElement('button'); b.type = 'button'; b.className = 'zh-dp-preset'; b.textContent = p[0]; b.addEventListener('click', function () { var r = p[1](); setRange(r[0], r[1], true); pop.toggle(); }); pr.appendChild(b); });
      box.appendChild(pr);
    }
    var main = document.createElement('div'); main.className = 'zh-dp-main';
    cal = Cal({ view: som(start || addMonths(TODAY, phone ? 0 : -1)), months: phone ? 1 : 2, outside: false, focus: start || TODAY, range: { start: start, end: end, hover: null },
      isDisabled: function (d) { return !!reason(d); }, reason: reason, onPick: pick,
      onHover: function (d) { if (step === 1 && start && !end) { hover = d; cal.st.range.hover = d; cal.paint(); } } });
    main.appendChild(cal.el);
    var foot = document.createElement('div'); foot.className = 'zh-dp-foot';
    var pk = document.createElement('span'); pk.className = 'zh-dp-picked'; pk.setAttribute('aria-live', 'polite');
    var clr = footBtn('清除'); clr.addEventListener('click', function () { setRange(null, null, true); step = 0; });
    foot.appendChild(pk); foot.appendChild(clr); main.appendChild(foot); box.appendChild(main); panelEl = box;
    return box;
  }, { onOpen: function () { sync(); if (cal) cal.focusInto(); }, onClose: function () { cal = null; panelEl = null; if (step === 1 && !end) { /* abandoned pick */ start = null; step = 0; } sync(); } });
  ins[0].removeAttribute('aria-controls');

  host.addEventListener('click', function (e) {
    if (e.target.closest('.zh-dp-clear')) { setRange(null, null, true); ins[0].focus(); return; }
    var inp = e.target.closest('.zh-dp-rin');
    if (!pop.isOpen()) { if (inp && inp.getAttribute('data-i') === '1' && start) step = 1; pop.open(); sync(); }
    else if (!inp) pop.toggle();
  });
  ins.forEach(function (inp, i) {
    inp.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); if (pop.isOpen()) cal && cal.focusInto(); else { pop.open(); sync(); } } else if (e.key === 'Enter') { e.preventDefault(); inp.dispatchEvent(new Event('change')); } });
    inp.addEventListener('change', function () {
      var t = inp.value.trim(), d = t ? parseDate(t) : null;
      if (t && !d) { host.classList.add('is-invalid'); setMsg('格式不对，请输入 YYYY-MM-DD', true); return; }
      if (d && reason(d)) { host.classList.add('is-invalid'); setMsg(ymd(d) + ' 不可选：' + reason(d), true); return; }
      var a = i === 0 ? d : start, b = i === 1 ? d : end;
      if (a && b && key(b) < key(a)) { host.classList.add('is-invalid'); setMsg('结束日期不能早于开始日期', true); return; }
      start = a; end = b; host.classList.remove('is-invalid'); sync(); report();
      if (cal && d) { cal.st.view = som(d); cal.render(); }
    });
  });
  sync(); if (start && end) report();
  return { el: host, input: ins[0], get: function () { return [start, end]; }, set: setRange, open: function () { pop.open(); sync(); }, close: function () { if (pop.isOpen()) pop.toggle(); } };
}

/* ---------------- time columns ---------------- */
function TimeCols(o) {
  var c = Object.assign({ seconds: false, stepM: 1, stepS: 1, value: { h: 9, m: 0, s: 0 }, onChange: null, onEnter: null }, o);
  var cur = { h: c.value.h, m: c.value.m, s: c.value.s };
  var defs = [['h', '小时', 24, 1]].concat([['m', '分钟', 60, c.stepM]]).concat(c.seconds ? [['s', '秒', 60, c.stepS]] : []);
  var uid = ZH.uid('tp'), root = document.createElement('div'); root.className = 'zh-tp-cols';
  root.innerHTML = '<div class="zh-tp-band" aria-hidden="true"></div>' + defs.map(function (d) {
    var items = ''; for (var v = 0; v < d[2]; v += d[3]) items += '<li class="zh-tp-item" role="option" id="' + uid + '-' + d[0] + v + '" data-v="' + v + '" aria-selected="false">' + pad(v) + '</li>';
    return '<ul class="zh-tp-col" role="listbox" tabindex="0" aria-label="' + d[1] + '" data-k="' + d[0] + '">' + items + '</ul>';
  }).join('');
  var cols = [].slice.call(root.querySelectorAll('.zh-tp-col')), prog = {};
  function itemH() { var li = root.querySelector('.zh-tp-item'); return (li && li.offsetHeight) || 32; }
  function snap(k, v) { var d = defs.filter(function (x) { return x[0] === k; })[0]; return Math.min(d[2] - 1, Math.round(v / d[3]) * d[3]); }
  function mark(k) {
    var col = root.querySelector('[data-k="' + k + '"]');
    [].forEach.call(col.children, function (li) { var on = +li.getAttribute('data-v') === cur[k]; li.classList.toggle('is-selected', on); li.setAttribute('aria-selected', String(on)); if (on) col.setAttribute('aria-activedescendant', li.id); });
  }
  function scrollTo(k, smooth) {
    var col = root.querySelector('[data-k="' + k + '"]'), d = defs.filter(function (x) { return x[0] === k; })[0], idx = cur[k] / d[3];
    prog[k] = true; clearTimeout(col._pt);
    col.scrollTo({ top: idx * itemH(), behavior: smooth && !ZH.reduced() ? 'smooth' : 'auto' });
    col._pt = setTimeout(function () { prog[k] = false; }, smooth ? 380 : 60);
  }
  function select(k, v, opts) {
    v = snap(k, v); var changed = cur[k] !== v; cur[k] = v; mark(k); scrollTo(k, !(opts && opts.instant));
    if (changed && c.onChange) c.onChange(get());
  }
  function get() { return { h: cur.h, m: cur.m, s: cur.s }; }
  root.addEventListener('click', function (e) { var li = e.target.closest('.zh-tp-item'); if (li) select(li.parentNode.getAttribute('data-k'), +li.getAttribute('data-v')); });
  cols.forEach(function (col) {
    col.addEventListener('scroll', function () {
      var k = col.getAttribute('data-k'); if (prog[k]) return;
      clearTimeout(col._st);
      col._st = setTimeout(function () {
        var d = defs.filter(function (x) { return x[0] === k; })[0], idx = Math.max(0, Math.min(d[2] / d[3] - 1, Math.round(col.scrollTop / itemH())));
        var v = idx * d[3]; if (v !== cur[k]) { cur[k] = v; mark(k); if (c.onChange) c.onChange(get()); }
      }, 110);
    });
    col.addEventListener('keydown', function (e) {
      var k = col.getAttribute('data-k'), d = defs.filter(function (x) { return x[0] === k; })[0], i = cols.indexOf(col), n = null;
      if (e.key === 'ArrowUp') n = cur[k] - d[3]; else if (e.key === 'ArrowDown') n = cur[k] + d[3];
      else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = d[2] - 1;
      else if (e.key === 'PageUp') n = cur[k] - d[3] * 5; else if (e.key === 'PageDown') n = cur[k] + d[3] * 5;
      else if (e.key === 'ArrowRight' && cols[i + 1]) { e.preventDefault(); cols[i + 1].focus(); return; }
      else if (e.key === 'ArrowLeft' && cols[i - 1]) { e.preventDefault(); cols[i - 1].focus(); return; }
      else if (e.key === 'Enter') { e.preventDefault(); if (c.onEnter) c.onEnter(); return; }
      if (n != null) { e.preventDefault(); select(k, Math.max(0, Math.min(d[2] - 1, n))); }
    });
  });
  defs.forEach(function (d) { mark(d[0]); });
  return {
    el: root, get: get, cols: cols,
    set: function (v) { defs.forEach(function (d) { cur[d[0]] = snap(d[0], v[d[0]] || 0); mark(d[0]); }); },
    layout: function () { defs.forEach(function (d) { scrollTo(d[0], false); }); }
  };
}

/* ---------------- time picker ---------------- */
function TimePicker(host, cfg) {
  var c = Object.assign({ value: null, seconds: false, stepM: 1, size: 'md', labelledby: '', label: '选择时间', onChange: null }, cfg);
  var value = c.value ? Object.assign({}, c.value) : null, tc = null, pop;
  fieldMarkup(host, c.size, 'clock', '<input class="zh-input" type="text" role="combobox" aria-haspopup="dialog" aria-expanded="false" autocomplete="off" placeholder="' + (c.seconds ? '时:分:秒' : '时:分') + '"' + (c.labelledby ? ' aria-labelledby="' + c.labelledby + '"' : '') + '>');
  var input = host.querySelector('input');
  function setValue(v, silent) {
    value = v; input.value = v ? fmtTime(v, c.seconds) : ''; host.classList.toggle('has-value', !!v); input.removeAttribute('aria-invalid');
    if (silent) return;
    if (c.onChange) c.onChange(v);
    host.dispatchEvent(new CustomEvent('zh:time-change', { bubbles: true, detail: { value: v ? fmtTime(v, c.seconds) : '', time: v } }));
  }
  pop = popFor(host, input, function () {
    var box = document.createElement('div'); box.className = 'zh-tp-panel'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', c.label);
    tc = TimeCols({ seconds: c.seconds, stepM: c.stepM, stepS: c.stepM, value: value || { h: 9, m: 0, s: 0 }, onChange: function (v) { setValue(v); }, onEnter: function () { pop.toggle(); } });
    box.appendChild(tc.el);
    var foot = document.createElement('div'); foot.className = 'zh-dp-foot';
    var now = footBtn('此刻'), ok = footBtn('确定', 'primary');
    now.addEventListener('click', function () { var d = new Date(), v = { h: d.getHours(), m: d.getMinutes(), s: d.getSeconds() }; tc.set(v); tc.layout(); setValue(tc.get()); });
    ok.addEventListener('click', function () { if (!value) setValue(tc.get()); pop.toggle(); });
    foot.appendChild(now); foot.appendChild(ok); box.appendChild(foot);
    return box;
  }, { onOpen: function () { if (tc) { tc.layout(); if (!value) setValue(tc.get()); tc.cols[0].focus(); } }, onClose: function () { tc = null; } });
  function commit() {
    var t = input.value.trim(); if (!t) { setValue(null); return; }
    var v = parseTime(t); if (!v) { input.setAttribute('aria-invalid', 'true'); return; }
    if (c.stepM > 1) v.m = Math.round(v.m / c.stepM) * c.stepM % 60;
    setValue(v); if (tc) { tc.set(v); tc.layout(); }
  }
  host.addEventListener('click', function (e) {
    if (e.target.closest('.zh-dp-clear')) { setValue(null); input.focus(); return; }
    if (pop.isOpen()) { if (e.target !== input) pop.toggle(); } else pop.open();
  });
  input.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); if (!pop.isOpen()) pop.open(); else if (tc) tc.cols[0].focus(); } else if (e.key === 'Enter') { e.preventDefault(); commit(); } });
  input.addEventListener('change', commit);
  setValue(value, true);
  return { el: host, input: input, get: function () { return value; }, set: function (v) { setValue(v ? Object.assign({}, v) : null, true); if (tc && v) { tc.set(v); tc.layout(); } }, open: function () { if (!pop.isOpen()) pop.open(); }, close: function () { if (pop.isOpen()) pop.toggle(); } };
}

/* ---------------- date-time picker ---------------- */
function DateTimePicker(host, cfg) {
  var c = Object.assign({ size: 'md', labelledby: '', label: '选择日期和时间', msg: null, disabledDate: null, min: null, max: null, value: null, onChange: null }, cfg);
  var date = null, time = { h: 9, m: 0, s: 0 }, cal = null, tc = null, pop, hasValue = false;
  fieldMarkup(host, c.size, 'calendar-clock', '<input class="zh-input" type="text" role="combobox" aria-haspopup="dialog" aria-expanded="false" autocomplete="off" placeholder="YYYY-MM-DD HH:mm"' + (c.labelledby ? ' aria-labelledby="' + c.labelledby + '"' : '') + '>');
  var input = host.querySelector('input'), setMsg = msgSetter(c.msg);
  function text() { return date ? ymd(date) + ' ' + fmtTime(time, false) : ''; }
  function reason(d) {
    if (c.min && key(d) < key(c.min)) return '早于最早可选日期 ' + ymd(c.min);
    if (c.max && key(d) > key(c.max)) return '晚于最晚可选日期 ' + ymd(c.max);
    if (c.disabledDate) { var r = c.disabledDate(d); if (r) return typeof r === 'string' ? r : '该日期不可选'; }
    return '';
  }
  var last = '';
  function emit() {
    var v = text();
    if (c.onChange) c.onChange(date ? { date: date, time: time } : null);
    host.dispatchEvent(new CustomEvent('zh:datetime-change', { bubbles: true, detail: { value: v, date: date, time: date ? time : null } }));
  }
  var pickedEl = null;
  function apply(user) { if (pickedEl) pickedEl.textContent = date ? text() : '请先选择日期'; input.value = text(); host.classList.toggle('has-value', !!date); input.removeAttribute('aria-invalid'); host.classList.remove('is-invalid'); if (user) setMsg('已选择 ' + text(), false); if (text() !== last) { last = text(); emit(); } }
  pop = popFor(host, input, function () {
    var phone = isPhone();
    var box = document.createElement('div'); box.className = 'zh-dp-panel is-dt' + (phone ? ' is-phone' : ''); box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', c.label);
    var left = document.createElement('div'); left.className = 'zh-dp-main';
    cal = Cal({ view: som(date || TODAY), selected: date, focus: date || TODAY, isDisabled: function (d) { return !!reason(d); }, reason: reason, onPick: function (d) { date = d; cal.st.selected = d; cal.paint(); apply(false); } });
    left.appendChild(cal.el); box.appendChild(left);
    var side = document.createElement('div'); side.className = 'zh-dp-side';
    tc = TimeCols({ seconds: false, value: time, onChange: function (v) { time = v; if (date) apply(false); } });
    side.appendChild(tc.el);
    var foot = document.createElement('div'); foot.className = 'zh-dp-foot'; foot.style.width = '100%';
    var pk = document.createElement('span'); pk.className = 'zh-dp-picked'; pk.textContent = date ? text() : '请先选择日期'; pickedEl = pk;
    var ok = footBtn('确定', 'primary'); ok.addEventListener('click', function () { if (!date) { date = TODAY; } apply(true); pop.toggle(); });
    foot.appendChild(pk); foot.appendChild(ok); side.appendChild(foot); box.appendChild(side);
    return box;
  }, { onOpen: function () { if (tc) tc.layout(); if (cal) cal.focusInto(); }, onClose: function () { cal = null; tc = null; pickedEl = null; } });
  function commit() {
    var t = input.value.trim(); if (!t) { date = null; apply(false); return; }
    var m = t.match(/^(.+?)[\sT]+(\d{1,2}[:：]\d{1,2})$/), d = m ? parseDate(m[1]) : parseDate(t), tm = m ? parseTime(m[2]) : { h: time.h, m: time.m, s: 0 };
    if (!d || !tm) { host.classList.add('is-invalid'); input.setAttribute('aria-invalid', 'true'); setMsg('格式不对，请输入 YYYY-MM-DD HH:mm', true); return; }
    if (reason(d)) { host.classList.add('is-invalid'); input.setAttribute('aria-invalid', 'true'); setMsg(reason(d), true); return; }
    date = d; time = tm; apply(true);
  }
  host.addEventListener('click', function (e) {
    if (e.target.closest('.zh-dp-clear')) { date = null; apply(false); setMsg(null, false); input.focus(); return; }
    if (pop.isOpen()) { if (e.target !== input) pop.toggle(); } else pop.open();
  });
  input.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); if (!pop.isOpen()) pop.open(); else if (cal) cal.focusInto(); } else if (e.key === 'Enter') { e.preventDefault(); commit(); } });
  input.addEventListener('change', commit);
  if (c.value) { var iv = c.value; date = iv.date || null; if (iv.time) time = iv.time; input.value = text(); host.classList.toggle('has-value', !!date); last = text(); }
  return {
    el: host, input: input, get: function () { return date ? { date: date, time: time } : null; },
    set: function (v) { date = v && v.date || null; if (v && v.time) time = v.time; last = text(); input.value = text(); host.classList.toggle('has-value', !!date); },   // silent
    open: function () { if (!pop.isOpen()) pop.open(); }, close: function () { if (pop.isOpen()) pop.toggle(); }
  };
}



/* ---------------- public API ---------------- */
function toDate(x) { if (!x) return null; if (x instanceof Date) return x; return parseDate(x); }
function toYmd(x) { return x instanceof Date ? ymd(x) : x || null; }
function weekendRule(d) { return (d.getDay() + 6) % 7 > 4 ? '周末不可选' : ''; }
function ruleFromData(d) {
  var rules = [];
  if (d.disableWeekends != null) rules.push(weekendRule);
  if (d.disabledDates) { var set = {}; d.disabledDates.split(',').forEach(function (k) { set[k.trim()] = 1; }); rules.push(function (x) { return set[ymd(x)] ? '该日期不可选' : ''; }); }
  if (!rules.length) return null;
  return function (x) { for (var i = 0; i < rules.length; i++) { var m = rules[i](x); if (m) return m; } return ''; };
}
// <label for="hostId"> works on the empty <div> host too: it names the input for screen readers and a click on it focuses the input.
function labelFor(host, api) {
  var lab = host.id ? document.querySelector('label[for="' + host.id + '"]') : null; if (!lab) return;
  if (!lab.id) lab.id = ZH.uid('zh-lb');
  api.input.setAttribute('aria-labelledby', lab.id);
  lab.addEventListener('click', function () { api.input.focus(); });
}
function hiddenFor(host, name) { if (!name) return null; var h = document.createElement('input'); h.type = 'hidden'; h.name = name; host.appendChild(h); return h; }
function ariaLabelTo(host, api) { var a = host.getAttribute('aria-label'); if (a) { api.input.setAttribute('aria-label', a); host.removeAttribute('aria-label'); } }
function parseDateTime(str) {
  if (!str) return null;
  var m = String(str).trim().match(/^(.+?)[\sT]+(\d{1,2}[:：]\d{1,2})$/), d = m ? parseDate(m[1]) : parseDate(str), t = m ? parseTime(m[2]) : { h: 9, m: 0, s: 0 };
  return d && t ? { date: d, time: t } : null;
}
function dtText(v) { return v && v.date ? ymd(v.date) + ' ' + fmtTime(v.time, false) : ''; }

function makeDate(host, cfg) {
  cfg = Object.assign({}, cfg); cfg.value = toYmd(cfg.value); cfg.min = toDate(cfg.min); cfg.max = toDate(cfg.max);
  var api = DatePicker(host, cfg), set = api.set; api.set = function (v) { set(toDate(v)); }; host.zhDate = api; return api;
}
function makeRange(host, cfg) {
  cfg = Object.assign({}, cfg); cfg.start = toDate(cfg.start); cfg.end = toDate(cfg.end); cfg.min = toDate(cfg.min); cfg.max = toDate(cfg.max);
  var api = RangePicker(host, cfg), set = api.set; api.set = function (a, b, user) { set(toDate(a), toDate(b), user); }; host.zhDateRange = api; return api;
}
function makeTime(host, cfg) { var api = TimePicker(host, cfg || {}), set = api.set; api.set = function (v) { set(typeof v === 'string' ? parseTime(v) : v); }; host.zhTime = api; return api; }
function makeDateTime(host, cfg) {
  cfg = Object.assign({}, cfg); cfg.min = toDate(cfg.min); cfg.max = toDate(cfg.max);
  if (typeof cfg.value === 'string') cfg.value = parseDateTime(cfg.value);
  var api = DateTimePicker(host, cfg), set = api.set; api.set = function (v) { set(typeof v === 'string' ? parseDateTime(v) : v); }; host.zhDateTime = api; return api;
}
var find = function (h) { return typeof h === 'string' ? document.querySelector(h) : h; };
ZhaoUI.datePicker = function (h, cfg) { h = find(h); return h ? makeDate(h, cfg) : null; };
ZhaoUI.dateRangePicker = function (h, cfg) { h = find(h); return h ? makeRange(h, cfg) : null; };
ZhaoUI.timePicker = function (h, cfg) { h = find(h); return h ? makeTime(h, cfg) : null; };
ZhaoUI.dateTimePicker = function (h, cfg) { h = find(h); return h ? makeDateTime(h, cfg) : null; };

ZhaoUI.component('date', { selector: '[data-zh-date]', init: function (host) {
  var d = host.dataset, hidden, label = host.getAttribute('aria-label');
  var api = makeDate(host, { value: d.value || null, placeholder: d.placeholder || 'YYYY-MM-DD', size: d.size || 'md', min: d.min, max: d.max, disabledDate: ruleFromData(d), label: d.label || label || '选择日期', labelledby: d.labelledby || '', msg: d.msg || null });
  ariaLabelTo(host, api); labelFor(host, api); hidden = hiddenFor(host, d.name);
  var set = api.set; api.set = function (v) { set(v); if (hidden) hidden.value = api.get() ? ymd(api.get()) : ''; };
  if (hidden) { hidden.value = api.get() ? ymd(api.get()) : ''; host.addEventListener('zh:date-change', function (e) { hidden.value = e.detail.value; }); }
} });
ZhaoUI.component('daterange', { selector: '[data-zh-daterange]', init: function (host) {
  var d = host.dataset, hs, he, label = host.getAttribute('aria-label');
  var api = makeRange(host, { start: d.start, end: d.end, min: d.min, max: d.max, presets: d.presets !== 'false', size: d.size || 'md', label: d.label || label || '选择日期范围', labelledby: d.labelledby || '', msg: d.msg || null });
  if (label) host.removeAttribute('aria-label');
  labelFor(host, api);
  hs = hiddenFor(host, d.nameStart); he = hiddenFor(host, d.nameEnd);
  function sync() { var v = api.get(); if (hs) hs.value = v[0] ? ymd(v[0]) : ''; if (he) he.value = v[1] ? ymd(v[1]) : ''; }
  var set = api.set; api.set = function (a, b, user) { set(a, b, user); sync(); };
  sync(); host.addEventListener('zh:daterange-change', sync);
} });
ZhaoUI.component('time', { selector: '[data-zh-time]', init: function (host) {
  var d = host.dataset, label = host.getAttribute('aria-label');
  var api = makeTime(host, { value: d.value ? parseTime(d.value) : null, seconds: d.seconds != null, stepM: d.stepMinutes ? +d.stepMinutes : 1, size: d.size || 'md', label: d.label || label || '选择时间', labelledby: d.labelledby || '' });
  ariaLabelTo(host, api); labelFor(host, api); var hidden = hiddenFor(host, d.name);
  function sync() { var v = api.get(); if (hidden) hidden.value = v ? fmtTime(v, d.seconds != null) : ''; }
  var set = api.set; api.set = function (v) { set(v); sync(); };
  sync(); host.addEventListener('zh:time-change', sync);
} });
ZhaoUI.component('datetime', { selector: '[data-zh-datetime]', init: function (host) {
  var d = host.dataset, label = host.getAttribute('aria-label');
  var api = makeDateTime(host, { value: d.value || null, size: d.size || 'md', min: d.min, max: d.max, disabledDate: ruleFromData(d), label: d.label || label || '选择日期和时间', labelledby: d.labelledby || '', msg: d.msg || null });
  ariaLabelTo(host, api); labelFor(host, api); var hidden = hiddenFor(host, d.name);
  function sync() { if (hidden) hidden.value = dtText(api.get()); }
  var set = api.set; api.set = function (v) { set(v); sync(); };
  sync(); host.addEventListener('zh:datetime-change', sync);
} });

// Inline calendar: a month view that is always visible.  <div data-zh-calendar data-value="2026-10-15" data-disable-weekends data-min data-max>, or ZhaoUI.calendar(host, { value, min, max, disabledDate(d), marks(d) }).
// marks(d) returns null or { dots: [1..8] (chart colours, at most 3), label } or { heat: 1..3, label } to decorate a day.  Event zh:calendar-change { value, date }.
function makeCalendar(host, cfg) {
  cfg = Object.assign({}, cfg); var min = toDate(cfg.min), max = toDate(cfg.max), val = toDate(cfg.value), cal;
  function reason(d) { if (min && key(d) < key(min)) return '早于可选范围'; if (max && key(d) > key(max)) return '晚于可选范围'; return cfg.disabledDate ? (cfg.disabledDate(d) || '') : ''; }
  host.classList.add('zh-dp-inline'); host.innerHTML = '';
  cal = Cal({ view: som(val || TODAY), selected: val, focus: val || TODAY, isDisabled: function (d) { return !!reason(d); }, reason: reason, marks: cfg.marks || null,
    onPick: function (d) { cal.st.selected = d; cal.paint(); host.dispatchEvent(new CustomEvent('zh:calendar-change', { bubbles: true, detail: { value: ymd(d), date: d } })); } });
  host.appendChild(cal.el);
  var api = { get: function () { return cal.st.selected; }, set: function (v) { var d = toDate(v); cal.st.selected = d; if (d) { cal.st.view = som(d); cal.st.focus = d; } cal.render ? cal.render() : cal.paint(); },
    refresh: function () { cal.render(); } };
  host.zhCalendar = api; return api;
}
ZhaoUI.calendar = function (h, cfg) { h = find(h); return h ? makeCalendar(h, cfg) : null; };
ZhaoUI.component('calendar', { selector: '[data-zh-calendar]', init: function (host) {
  var d = host.dataset; makeCalendar(host, { value: d.value || null, min: d.min, max: d.max, disabledDate: ruleFromData(d) });
} });
