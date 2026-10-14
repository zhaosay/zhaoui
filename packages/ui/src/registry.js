// Component registry and auto-init. Components register a selector + init(el); ZhaoUI.init(root) wires everything not wired yet.
var components = {};
function wire(name, def, root) {
  if (!def.selector || !def.init) return;
  var list = [].slice.call(root.querySelectorAll(def.selector));
  if (root.matches && root.matches(def.selector)) list.unshift(root);
  list.forEach(function (el) {
    if (el.__zhWired && el.__zhWired[name]) return;
    (el.__zhWired = el.__zhWired || {})[name] = true;
    try { def.init(el); } catch (e) { if (window.console) console.error('[ZhaoUI] ' + name + ' init failed', e); }
  });
}
// A component file loaded after the page is already up (modular builds) wires itself straight away.
ZhaoUI.component = function (name, def) { components[name] = def; if (ZhaoUI._ready) wire(name, def, document); return ZhaoUI; };
ZhaoUI.init = function (root) {
  root = root || document;
  ZH.hydrateIcons(root);
  Object.keys(components).forEach(function (name) { wire(name, components[name], root); });
  return ZhaoUI;
};
// Methods that act on one element (ZhaoUI.progress.set, ZhaoUI.otp.error, ...) may be called from an inline script that runs before the page has
// finished loading, i.e. before auto-init. ensure() wires that one element first, so the call never meets a half-built component.
ZhaoUI.ensure = function (el) {
  el = typeof el === 'string' ? document.querySelector(el) : el;
  if (el) ZhaoUI.init(el);
  return el;
};
// Theme: the five switches live on <html data-*>. Brand colour is generated from one hex.
ZhaoUI.setTheme = function (t, el) {
  el = el || document.documentElement;
  ['audience', 'mode', 'density', 'style', 'trend'].forEach(function (k) { if (t && t[k] != null) el.setAttribute('data-' + k, t[k]); });
  return ZhaoUI;
};
ZhaoUI.setBrand = function (hex, el) {
  if (!ZhaoUI.applyBrand) throw new Error('ZhaoUI.setBrand needs the brand runtime: load zhaoui-brand.js (the full zhaoui.js already includes it)');
  ZhaoUI.applyBrand(el || document.documentElement, hex); return ZhaoUI;
};
ZhaoUI.ZH = ZH;
// Number formatting for counters and totals; follows <html lang>, falls back to zh-CN.
ZH.fmtN = function (n) { try { return Number(n).toLocaleString(document.documentElement.lang || 'zh-CN'); } catch (e) { return String(n); } };
