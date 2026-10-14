// Icons: <i data-i="name"> becomes an inline <svg><use href="#zi-name"></svg>. The core set (ICONS) ships inside zhaoui.js;
// the full Lucide set is the optional zhaoui-icons.js. Add your own with ZhaoUI.icons.add('name', '<path d="…"/>').
var ICONS = /*@ICONS*/{}/*@END*/;
var icons = ZhaoUI.icons = {
  add: function (name, inner) { ICONS[name] = inner; injectSprite(); },
  has: function (name) { return !!document.getElementById('zi-' + name); }
};
function injectSprite() {
  var host = document.getElementById('zhIconSprite');
  if (!host) {
    host = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    host.id = 'zhIconSprite'; host.setAttribute('aria-hidden', 'true'); host.setAttribute('width', '0'); host.setAttribute('height', '0'); host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    (document.body || document.documentElement).appendChild(host);
  }
  var missing = Object.keys(ICONS).filter(function (n) { return !document.getElementById('zi-' + n); });
  if (missing.length) host.insertAdjacentHTML('beforeend', missing.map(function (n) { return '<symbol id="zi-' + n + '" viewBox="0 0 24 24">' + ICONS[n] + '</symbol>'; }).join(''));
}
ZH.iconHtml = function (name, size, cls) {
  var st = size ? ' style="width:' + size + 'px;height:' + size + 'px"' : '';
  return '<svg class="ico' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"' + st + '><use href="#zi-' + name + '"></use></svg>';
};
ZH.hydrateIcons = function (scope) {
  scope = scope || document; injectSprite();
  [].forEach.call(scope.querySelectorAll('i[data-i]'), function (el) {
    var tmp = document.createElement('span');
    tmp.innerHTML = ZH.iconHtml(el.getAttribute('data-i'), el.getAttribute('data-s'), el.className);
    var svg = tmp.firstChild, extra = el.getAttribute('style');
    if (extra) svg.setAttribute('style', (svg.getAttribute('style') || '') + ';' + extra);
    el.replaceWith(svg);
  });
};
