// Helpers the smoke test parts share (selectors, computed-style readers, the examples-page runner, the utilities and side-menu fixtures).
export function createHelpers(h) {
  const { pw, HERE, VARIANT, pagePath, FILE, ENGINE, launch, b, fresh, test, wait, assert, fileUrl, join, dirname, readFileSync, writeFileSync, existsSync, readdirSync, fileURLToPath } = h;
  // ---------- input family ----------
  const val = (p, sel) => p.evaluate((s) => document.querySelector(s).value, sel);
  // ---------- display + data entry batch ----------
  const txt = (p, sel) => p.evaluate((s) => document.querySelector(s).textContent.trim().replace(/\s+/g, ' '), sel);
  // ---------- select ----------
  const hostOf = (id) => `#${id} + .zh-sel`;
  // ---------- cascader ----------
  const cItems = (p, l) => p.evaluate((l) => [...document.querySelectorAll(`.zh-cas-col[data-l="${l}"] .zh-cas-item`)].map((x) => x.textContent.trim()), l);
  // ---------- date / time pickers ----------
  const day = (d) => `.zh-dp-day[data-d="${d}"]`;
  const dis = (p, d) => p.evaluate((d) => document.querySelector(`.zh-dp-day[data-d="${d}"]`).getAttribute('aria-disabled') === 'true', d);
  // ---------- pure-style components (card, table, form controls, layout, feedback, breadcrumb): the documented examples, measured as rendered ----------
  async function testEx(label, fn, w = 1280) {
    h.say(label);
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') p.errs.push('console: ' + m.text()); });
    try {
      await p.goto(fileUrl(pagePath('examples.generated.html'))); await p.waitForTimeout(300);
      await p.keyboard.press('Escape'); await p.evaluate(() => { const h = document.getElementById('zhToastHost'); if (h) h.style.display = 'none'; }); await p.waitForTimeout(150);
      await fn(p); assert.deepEqual(p.errs, [], 'page errors'); h.passed++;
    } catch (e) { h.failed++; console.log(`FAIL ${label}\n   ${e.message.split('\n').slice(0, 14).join(' | ')}`); }
    await p.close();
  }
  const E = (n, s = '') => `[data-example="${n}"] ${s}`.trim();
  const tracks = (p, sel) => p.evaluate((s) => getComputedStyle(document.querySelector(s)).gridTemplateColumns.split(' ').length, sel);
  const wd = (p, sel, i = 0) => p.evaluate(([s, i]) => document.querySelectorAll(s)[i].getBoundingClientRect().width, [sel, i]);
  // The computed `content` of a pseudo-element, with attr(name) resolved: Firefox 153 reports the attr() call itself, the other engines the text.
  const pseudoContent = (p, sel, pseudo) => p.evaluate(([s, ps]) => { const el = document.querySelector(s), c = getComputedStyle(el, ps).content, m = c.match(/^attr\((.+)\)$/); return m ? JSON.stringify(el.getAttribute(m[1])) : c; }, [sel, pseudo]);
  const css = (p, sel, prop, pseudo = null) => p.evaluate(([s, prop, pseudo]) => getComputedStyle(document.querySelector(s), pseudo)[prop], [sel, prop, pseudo]);

  // ---------- optional utilities file ----------
  const UTIL = `../dist/zhaoui-utilities${VARIANT === 'min' ? '.min' : ''}.css`;
  async function utilPage(w) {
    const p = await fresh(w);
    await p.evaluate((href) => new Promise((ok) => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.onload = ok; l.onerror = ok; document.head.appendChild(l); }), UTIL);
    await p.evaluate(() => { const h = document.createElement('div'); h.id = 'ut'; h.innerHTML = '<div id="u-hide" class="zh-hide-phone">a</div><div id="u-show" class="zh-show-phone-only">b</div><div id="u-grid" class="zh-d-grid zh-cols-3 zh-cols-1-phone zh-gap-4"><i>1</i><i>2</i><i>3</i></div><div id="u-m" class="zh-mt-4 zh-px-3 zh-text-center zh-flex zh-items-center">x</div><p id="u-tr" class="zh-truncate" style="width:40px">一段很长很长的文字一段很长很长的文字</p><span id="u-spin" class="zh-anim-spin">o</span><div id="u-t" class="zh-text-danger zh-rounded-lg zh-shadow-md zh-bg-subtle">t</div>'; document.body.appendChild(h); });
    return p;
  }
  // ---------- side menu, back to top, kbd, page header ----------
  const SIDE = `<div id="sd-host" style="display:flex;height:420px"><nav class="zh-side" id="sd" data-zh-side aria-label="站点导航"><div class="zh-side-head"><i aria-hidden="true"></i><span>ZhaoUI</span></div><ul><li class="zh-side-group">工作台</li><li><a href="#" data-icon="layout-dashboard">概览</a></li><li><a href="#" data-icon="file-text">内容管理</a><ul><li><a href="#/articles" id="sd-art" aria-current="page" data-badge="12">文章</a></li><li><a href="#/media">媒体库</a></li></ul></li><li><a href="#/users" id="sd-off" aria-disabled="true">用户</a></li><li><a href="#/set" id="sd-set" data-icon="settings">设置</a></li></ul></nav></div><div style="height:2600px"></div><button id="bt" data-zh-backtop data-threshold="300"></button>`;
  // Polls `read` until `ok(value)` holds (or the time runs out) and returns the last value: a transition or a scroll handler ends when it ends,
  // which on a slow machine is later than any fixed pause one picks.
  const until = async (p, read, ok, ms = 2500) => { let v = await read(); for (let t = 0; t < ms && !ok(v); t += 100) { await wait(p, 100); v = await read(); } return v; };
  return { until, val, txt, hostOf, cItems, day, dis, testEx, E, tracks, wd, pseudoContent, css, UTIL, utilPage, SIDE };
}
