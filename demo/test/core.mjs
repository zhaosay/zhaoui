// Smoke test for the shared popup core, run in all three engines.  node demo/test/core.mjs
import { createRequire } from 'node:module';
const { chromium, firefox, webkit } = createRequire('/tmp/pw/')('playwright');
import assert from 'node:assert/strict';

const url = 'file://' + new URL('../../../zhaoui-demo.html', import.meta.url).pathname;
let bad = 0;
for (const [name, eng] of Object.entries({ chromium, firefox, webkit })) {
  const b = await eng.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 700 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(url); await p.waitForTimeout(300);
  try {
    const r = await p.evaluate(async () => {
      const ZH = window.ZHDemo, out = {}, wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const mk = (top, left, txt) => { const bt = document.createElement('button'); bt.textContent = txt; bt.style.cssText = `position:fixed;top:${top}px;left:${left}px;z-index:5`; document.body.appendChild(bt); return bt; };

      // 1. opens below, inside the viewport, wires aria
      const a1 = mk(100, 100, 'a1'); const p1 = ZH.popover(a1, { content: '<div style="padding:12px;width:180px">hello</div>', arrow: true, placement: 'bottom-start' });
      a1.click(); await wait(220);
      const e1 = p1.el; const r1 = e1.getBoundingClientRect(), ar = a1.getBoundingClientRect();
      out.below = r1.top >= ar.bottom && Math.abs(r1.left - ar.left) < 1.5; out.aria = a1.getAttribute('aria-expanded') === 'true' && a1.getAttribute('aria-controls') === e1.id;
      out.openClass = e1.classList.contains('is-open'); out.placement = e1.getAttribute('data-placement');

      // 2. Esc closes and returns focus
      a1.focus(); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await wait(220);
      out.escClosed = !p1.isOpen() && !document.getElementById(e1.id) && a1.getAttribute('aria-expanded') === 'false'; out.focusBack = document.activeElement === a1;

      // 3. outside click closes
      a1.click(); await wait(60); document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); await wait(220);
      out.outsideClosed = !p1.isOpen();

      // 4. flips above when there is no room below
      const a2 = mk(650, 300, 'a2'); const p2 = ZH.popover(a2, { content: '<div style="padding:12px;height:140px">tall</div>', placement: 'bottom' });
      a2.click(); await wait(220); const r2 = p2.el.getBoundingClientRect();
      out.flipped = p2.el.getAttribute('data-placement').startsWith('top') && r2.bottom <= a2.getBoundingClientRect().top; p2.close(); await wait(200);

      // 5. shifts to stay on screen at the right edge
      const a3 = mk(200, 1180, 'a3'); const p3 = ZH.popover(a3, { content: '<div style="padding:12px;width:240px">edge</div>', placement: 'bottom-start' });
      a3.click(); await wait(220); const r3 = p3.el.getBoundingClientRect(); out.shifted = r3.right <= innerWidth - 7; p3.close(); await wait(200);

      // 6. hover trigger opens after delay and closes after leaving
      const a4 = mk(300, 100, 'a4'); const p4 = ZH.popover(a4, { content: 'tip', trigger: 'hover', z: 'tooltip', role: 'tooltip', arrow: true, placement: 'top' });
      a4.dispatchEvent(new MouseEvent('mouseenter')); await wait(30); const early = p4.isOpen(); await wait(120); out.hoverOpen = !early && p4.isOpen();
      a4.dispatchEvent(new MouseEvent('mouseleave')); await wait(220); out.hoverClose = !p4.isOpen();

      // 7. inside an open <dialog> the popup is mounted in the dialog (otherwise it would sit behind it)
      const dlg = document.createElement('dialog'); dlg.innerHTML = '<button id="dlgBtn">open</button>'; document.body.appendChild(dlg); dlg.showModal();
      const p5 = ZH.popover(dlg.querySelector('#dlgBtn'), { content: 'in dialog' }); p5.open(); await wait(40);
      out.inDialog = dlg.contains(p5.el); p5.close(); await wait(200); dlg.close(); dlg.remove();

      // 8. roving focus: arrows, Home/End, typeahead
      const menu = document.createElement('div'); menu.innerHTML = '<div role="menuitem" tabindex="0">Alpha</div><div role="menuitem" tabindex="-1">Bravo</div><div role="menuitem" tabindex="-1">Charlie</div>'; document.body.appendChild(menu);
      ZH.rovingFocus(menu, '[role=menuitem]'); const its = menu.querySelectorAll('[role=menuitem]'); its[0].focus();
      const key = (k) => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
      key('ArrowDown'); const s1 = document.activeElement === its[1]; key('End'); const s2 = document.activeElement === its[2]; key('ArrowDown'); const s3 = document.activeElement === its[0]; key('c'); const s4 = document.activeElement === its[2];
      out.roving = s1 && s2 && s3 && s4;

      // 9. toast hosts float into an open modal (top layer) and return afterwards
      const host = document.getElementById('toastHost'); const dlg2 = document.createElement('dialog'); dlg2.innerHTML = '<p>x</p>'; document.body.appendChild(dlg2);
      dlg2.showModal(); const inside = dlg2.contains(host); dlg2.close(); await wait(30); const back = !dlg2.contains(host) && host.isConnected; dlg2.remove();
      out.floatsInModal = inside && back;
      // 10. visibility helper agrees with rendering (used for focus traps inside position:fixed)
      const fx = document.createElement('div'); fx.style.cssText = 'position:fixed;top:0;left:0;width:10px;height:10px'; document.body.appendChild(fx);
      const hid = document.createElement('div'); hid.style.display = 'none'; document.body.appendChild(hid);
      out.visibleHelper = ZH.visible(fx) && !ZH.visible(hid);

      // 11. a toast raised while a modal is open is actually on top (hit-test), not hidden behind the top layer
      const dlg3 = document.createElement('dialog'); dlg3.style.cssText = 'width:80vw;height:60vh'; dlg3.innerHTML = '<p>modal</p>'; document.body.appendChild(dlg3); dlg3.showModal();
      ZH.toast('hello from a modal'); await wait(60);
      const tn = [...document.querySelectorAll('.zh-message')].pop(); const tr = tn.getBoundingClientRect();
      const hit = document.elementFromPoint(tr.left + tr.width / 2, tr.top + tr.height / 2);
      out.toastOnTop = !!hit && tn.contains(hit); dlg3.close(); dlg3.remove();
      out.escapes = ZH.esc('<a href="x">&\'') === '&lt;a href=&quot;x&quot;&gt;&amp;&#39;';
      return out;
    });
    for (const [k, v] of Object.entries(r)) if (k !== 'placement') assert.ok(v, `${name}: ${k} -> ${v}`);
    assert.deepEqual(errs, []);
    console.log('ok  ', name, JSON.stringify(r));
  } catch (e) { bad++; console.log('FAIL', name, e.message); }
  await b.close();
}
process.exit(bad ? 1 : 0);
