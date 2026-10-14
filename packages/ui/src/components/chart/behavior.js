// Charts (SVG): line, area, bar, donut and spark.  ZhaoUI.chart(host, { type, labels, series: [{ name, data }], ... }) or <div data-zh-chart data-type="line"><script type="application/json">{...}</script></div>.
// Colours are the theme's fixed categorical palette (--zh-chart-1..8), one axis only, a legend that toggles series, a tooltip on hover/focus, arrow keys to walk the points, and a hidden data table for screen readers.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  function nice(max, n) { if (max <= 0) return { max: 1, step: 0.25 }; var raw = max / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p, s = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; return { max: Math.ceil(max / s) * s, step: s }; }
  function fmt(v, o) { if (o.format) return o.format(v); var a = Math.abs(v); return a >= 1e8 ? +(v / 1e8).toFixed(1) + '亿' : a >= 1e4 ? +(v / 1e4).toFixed(1) + '万' : String(+v.toFixed(2)); }
  function el(tag, attrs, parent) { var n = document.createElementNS(NS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; }
  function color(i) { return 'var(--zh-chart-' + (i % 8 + 1) + ')'; }

  function Chart(host, o) {
    o = Object.assign({ type: 'line', labels: [], series: [], height: 240, legend: true, smooth: false, points: true, title: '' }, o);
    var off = {}, idx = -1, tip, svg, legend, W = 0;
    host.classList.add('zh-chart'); host.innerHTML = '';
    var spark = o.type === 'spark', donut = o.type === 'donut';
    if (o.legend && !spark && (o.series.length > 1 || donut)) { legend = document.createElement('div'); legend.className = 'zh-chart-legend'; host.appendChild(legend); }
    var stage = document.createElement('div'); stage.className = 'zh-chart-stage'; host.appendChild(stage);
    tip = document.createElement('div'); tip.className = 'zh-chart-tip'; tip.hidden = true; tip.setAttribute('aria-hidden', 'true'); stage.appendChild(tip);
    var live = document.createElement('span'); live.setAttribute('aria-live', 'polite'); live.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)'; host.appendChild(live);
    var table = document.createElement('table'); table.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)'; host.appendChild(table);

    function visible() { return o.series.map(function (s, i) { return { s: s, i: i }; }).filter(function (x) { return !off[x.i]; }); }
    function summary() { var v = visible(); return (o.title || '图表') + '：' + (donut ? o.series.map(function (s) { return s.name + ' ' + fmt(s.data[0], o); }).join('，') : v.map(function (x) { return x.s.name + ' ' + x.s.data.length + ' 个数据点'; }).join('，')); }
    function buildTable() { table.innerHTML = donut ? '<caption>' + ZH.esc(o.title || '数据') + '</caption><tbody>' + o.series.map(function (s) { return '<tr><th scope="row">' + ZH.esc(s.name) + '</th><td>' + s.data[0] + '</td></tr>'; }).join('') + '</tbody>' :
      '<caption>' + ZH.esc(o.title || '数据') + '</caption><thead><tr><th scope="col">类别</th>' + o.series.map(function (s) { return '<th scope="col">' + ZH.esc(s.name) + '</th>'; }).join('') + '</tr></thead><tbody>' + o.labels.map(function (l, i) { return '<tr><th scope="row">' + ZH.esc(l) + '</th>' + o.series.map(function (s) { return '<td>' + (s.data[i] == null ? '' : s.data[i]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody>'; }
    function drawLegend() { if (!legend) return; legend.innerHTML = o.series.map(function (s, i) { return '<button type="button" class="zh-chart-key" data-i="' + i + '" aria-pressed="' + !off[i] + '"><i style="background:' + color(i) + '"></i>' + ZH.esc(s.name) + '</button>'; }).join(''); }

    function draw() {
      W = Math.max(120, Math.round(stage.clientWidth || host.clientWidth || 320)); var H = spark ? (o.height === 240 ? 40 : o.height) : o.height;
      if (svg) svg.remove(); svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'aria-label': summary(), focusable: 'false' }); stage.insertBefore(svg, tip); svg.style.display = 'block';
      if (donut) return drawDonut(H); if (!o.labels.length) return;
      var vs = visible(), n = o.labels.length, pad = spark ? { l: 2, r: 2, t: 4, b: 4 } : { l: 44, r: 12, t: 12, b: 28 };
      var all = []; vs.forEach(function (x) { x.s.data.forEach(function (v) { if (v != null) all.push(v); }); });
      var lo = o.type === 'bar' || o.type === 'area' ? Math.min(0, Math.min.apply(null, all.concat([0]))) : Math.min.apply(null, all.concat([0])), hi = Math.max.apply(null, all.concat([0]));
      var nt = nice(hi - lo || 1, 4), top = lo + Math.ceil((hi - lo) / nt.step) * nt.step || nt.max, iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
      var X = function (i) { return o.type === 'bar' ? pad.l + iw * (i + .5) / n : pad.l + (n === 1 ? iw / 2 : iw * i / (n - 1)); }, Y = function (v) { return pad.t + ih * (1 - (v - lo) / (top - lo || 1)); };
      if (!spark) {
        var g = el('g', { 'aria-hidden': 'true' }, svg);
        for (var v = lo; v <= top + 1e-9; v += nt.step) { var y = Y(v); el('line', { x1: pad.l, x2: W - pad.r, y1: y, y2: y, class: 'zh-chart-grid' + (Math.abs(v) < 1e-9 ? ' is-zero' : '') }, g); var t = el('text', { x: pad.l - 8, y: y + 4, 'text-anchor': 'end', class: 'zh-chart-tick' }, g); t.textContent = fmt(v, o); }
        var step = Math.ceil(n / Math.max(2, Math.floor(iw / 56)));
        o.labels.forEach(function (l, i) { if (i % step) return; var t = el('text', { x: X(i), y: H - 8, 'text-anchor': 'middle', class: 'zh-chart-tick' }, g); t.textContent = l; });
      }
      if (o.type === 'bar') {
        var bw = Math.min(40, iw / n * .7 / Math.max(1, vs.length)), gw = bw * vs.length;
        vs.forEach(function (x, k) { x.s.data.forEach(function (val, i) { if (val == null) return; var y0 = Y(Math.max(0, lo)), y1 = Y(val), r = el('rect', { x: X(i) - gw / 2 + k * bw + 1, y: Math.min(y0, y1), width: Math.max(1, bw - 2), height: Math.max(1, Math.abs(y0 - y1)), rx: 3, fill: color(x.i), class: 'zh-chart-bar' }, svg); r.setAttribute('data-i', i); }); });
      } else {
        vs.forEach(function (x) {
          var pts = x.s.data.map(function (val, i) { return val == null ? null : [X(i), Y(val)]; }), d = '', started = false;
          pts.forEach(function (p) { if (!p) { started = false; return; } d += (started ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); started = true; });
          if (o.type === 'area' && pts.every(Boolean) && pts.length > 1) el('path', { d: d + 'L' + pts[pts.length - 1][0] + ' ' + Y(Math.max(0, lo)) + 'L' + pts[0][0] + ' ' + Y(Math.max(0, lo)) + 'Z', fill: color(x.i), opacity: .16 }, svg);
          el('path', { d: d, fill: 'none', stroke: color(x.i), 'stroke-width': spark ? 1.6 : 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
          if (o.points && !spark) pts.forEach(function (p) { if (p) el('circle', { cx: p[0], cy: p[1], r: n > 30 ? 0 : 3, fill: 'var(--zh-bg-elevated)', stroke: color(x.i), 'stroke-width': 2 }, svg); });
        });
      }
      if (spark) return;
      var cursor = el('line', { class: 'zh-chart-cursor', y1: pad.t, y2: pad.t + ih, 'aria-hidden': 'true', visibility: 'hidden' }, svg), focusRing = svg;
      svg.tabIndex = 0; svg.setAttribute('focusable', 'true');
      function show(i, px) {
        i = Math.max(0, Math.min(n - 1, i)); idx = i; cursor.setAttribute('x1', X(i)); cursor.setAttribute('x2', X(i)); cursor.setAttribute('visibility', 'visible');
        tip.innerHTML = '<b>' + ZH.esc(o.labels[i]) + '</b>' + visible().map(function (x) { return '<div><i style="background:' + color(x.i) + '"></i>' + ZH.esc(x.s.name) + '<span>' + (x.s.data[i] == null ? '—' : fmt(x.s.data[i], o)) + '</span></div>'; }).join('');
        tip.hidden = false; var w = tip.offsetWidth, left = X(i) + 14; if (left + w > W) left = X(i) - w - 14; tip.style.left = Math.max(0, left) + 'px'; tip.style.top = '8px';
        live.textContent = o.labels[i] + '：' + visible().map(function (x) { return x.s.name + ' ' + (x.s.data[i] == null ? '无数据' : fmt(x.s.data[i], o)); }).join('，');
        host.dispatchEvent(new CustomEvent('zh:chart-hover', { bubbles: true, detail: { index: i, label: o.labels[i] } }));
      }
      function hide() { tip.hidden = true; cursor.setAttribute('visibility', 'hidden'); idx = -1; }
      function at(e) { var r = svg.getBoundingClientRect(), x = (e.clientX - r.left) * (W / r.width); return o.type === 'bar' ? Math.floor((x - pad.l) / (iw / n)) : Math.round((x - pad.l) / (iw / Math.max(1, n - 1))); }
      svg.addEventListener('mousemove', function (e) { show(at(e)); }); svg.addEventListener('mouseleave', hide); svg.addEventListener('blur', hide);
      svg.addEventListener('focus', function () { if (idx < 0) show(0); });
      svg.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx < 0 ? 0 : idx - 1); } else if (e.key === 'Home') { e.preventDefault(); show(0); } else if (e.key === 'End') { e.preventDefault(); show(n - 1); } else if (e.key === 'Escape') hide(); });
    }
    function drawDonut(H) {
      var vs = visible(), total = vs.reduce(function (a, x) { return a + x.s.data[0]; }, 0), R = Math.min(H, W) / 2 - 8, r = R * (o.inner || .62), cx = W / 2, cy = H / 2, a0 = -Math.PI / 2;
      var g = el('g', {}, svg);
      vs.forEach(function (x) { var v = x.s.data[0], frac = total ? v / total : 0, a1 = a0 + frac * Math.PI * 2 - (vs.length > 1 ? .02 : 0); if (frac <= 0) return; var big = a1 - a0 > Math.PI ? 1 : 0;
        var p = el('path', { d: 'M' + (cx + R * Math.cos(a0)) + ' ' + (cy + R * Math.sin(a0)) + 'A' + R + ' ' + R + ' 0 ' + big + ' 1 ' + (cx + R * Math.cos(a1)) + ' ' + (cy + R * Math.sin(a1)) + 'L' + (cx + r * Math.cos(a1)) + ' ' + (cy + r * Math.sin(a1)) + 'A' + r + ' ' + r + ' 0 ' + big + ' 0 ' + (cx + r * Math.cos(a0)) + ' ' + (cy + r * Math.sin(a0)) + 'Z', fill: color(x.i), class: 'zh-chart-slice' }, g);
        var tt = document.createElementNS(NS, 'title'); tt.textContent = x.s.name + '：' + fmt(v, o) + '（' + (frac * 100).toFixed(1) + '%）'; p.appendChild(tt); a0 += frac * Math.PI * 2; });
      var c = el('text', { x: cx, y: cy - 2, 'text-anchor': 'middle', class: 'zh-chart-total' }, svg); c.textContent = fmt(total, o); var s = el('text', { x: cx, y: cy + 18, 'text-anchor': 'middle', class: 'zh-chart-tick' }, svg); s.textContent = o.centerLabel || '合计';
    }
    if (legend) legend.addEventListener('click', function (e) { var b = e.target.closest('.zh-chart-key'); if (!b) return; var i = +b.getAttribute('data-i'); if (!off[i] && visible().length === 1) return; off[i] = !off[i]; drawLegend(); draw(); host.dispatchEvent(new CustomEvent('zh:chart-toggle', { bubbles: true, detail: { index: i, visible: !off[i] } })); });
    var q = 0; if (window.ResizeObserver) new ResizeObserver(function () { var w = Math.round(stage.clientWidth); if (w && w !== W && !q) q = requestAnimationFrame(function () { q = 0; draw(); }); }).observe(stage);
    buildTable(); drawLegend(); draw();
    var api = { update: function (n) { o = Object.assign(o, n); buildTable(); drawLegend(); draw(); }, toggle: function (i, v) { off[i] = v === false; drawLegend(); draw(); } }; host._zhChart = api; return api;
  }
  ZhaoUI.chart = function (host, cfg) { host = typeof host === 'string' ? document.querySelector(host) : host; return host ? Chart(host, cfg || {}) : null; };
  ZhaoUI.component('chart', { selector: '[data-zh-chart]', init: function (h) {
    var js = h.querySelector('script[type="application/json"]'), cfg = {}; try { cfg = js ? JSON.parse(js.textContent) : {}; } catch (e) { cfg = {}; }
    cfg.type = h.getAttribute('data-type') || cfg.type || 'line'; if (h.hasAttribute('data-height')) cfg.height = +h.getAttribute('data-height'); if (h.hasAttribute('data-title')) cfg.title = h.getAttribute('data-title'); if (h.hasAttribute('data-no-legend')) cfg.legend = false;
    Chart(h, cfg);
  } });
})();
