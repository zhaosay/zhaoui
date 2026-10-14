// Interaction tests for the navigation fragment, all three engines.  node demo/fragments/50-navigation/test.mjs
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium, firefox, webkit } = createRequire('/tmp/pw/')('playwright');
const root = new URL('../../../', import.meta.url).pathname;
const out = '/tmp/zh-navigation-test.html';
execFileSync('node', [root + 'demo/build.mjs', '--out', out, '--only', '00-core,50-navigation'], { stdio: 'pipe' });

let bad = 0;
for (const [name, eng] of Object.entries({ chromium, firefox, webkit })) {
  const b = await eng.launch();
  if (process.env.ONLY && process.env.ONLY !== name) { await b.close(); continue; }
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const t = { name };
  // Safari skips native buttons in the Tab order unless Option is held.
  const tab = (shift) => p.keyboard.press((name === 'webkit' ? 'Alt+' : '') + (shift ? 'Shift+' : '') + 'Tab');
  const wait = (ms) => p.waitForTimeout(ms);
  const attr = (sel, a) => p.locator(sel).first().getAttribute(a);
  const active = () => p.evaluate(() => { const a = document.activeElement; return a ? (a.id || a.getAttribute('data-id') || a.getAttribute('aria-label') || a.textContent.trim().slice(0, 12)) : ''; });
  const activeIn = (sel) => p.evaluate((s) => !!document.activeElement.closest(s), sel);
  const load = async (q) => {
    await p.goto('file://' + out + '?only=navigation' + (q ? '&' + q : ''));
    await p.waitForFunction(() => document.querySelector('#navInk') && /档位/.test(document.getElementById('stageLabel').textContent));
    if (q && /screen=phone/.test(q)) await p.waitForFunction(() => /档位 手机/.test(document.getElementById('stageLabel').textContent));
    await wait(500);
  };
  try {
    await load();

    // ---- 1. navbar: link indicator + disclosure menus ----
    const inkX = () => p.locator('#navInk').evaluate((e) => e.style.getPropertyValue('--ink-x'));
    const before = await inkX();
    await p.locator('#navLinkWrap a:has-text("方案")').click(); await wait(100);
    assert.equal(await attr('#navLinkWrap a:has-text("方案")', 'aria-current'), 'page'); assert.equal(await p.locator('#navLinkWrap [aria-current]').count(), 1);
    const expectX = await p.locator('#navLinkWrap a:has-text("方案")').evaluate((a) => (a.offsetLeft + 12) + 'px');
    assert.equal(await inkX(), expectX); assert.notEqual(await inkX(), before); t.ink = 1;

    await p.locator('#navProd').click(); await wait(250);
    assert.equal(await attr('#navProd', 'aria-expanded'), 'true'); assert.ok(await p.locator('.zh-nav-mega').isVisible());
    assert.equal(await p.locator('.zh-nav-mega a').count(), 7);
    await p.keyboard.press('Escape'); await wait(250);
    assert.equal(await attr('#navProd', 'aria-expanded'), 'false'); assert.equal(await active(), 'navProd'); assert.equal(await p.locator('.zh-nav-mega').count(), 0);
    await p.locator('#navProd').press('ArrowDown'); await wait(300);
    assert.ok(await activeIn('.zh-nav-mega'), 'ArrowDown focuses the panel'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowRight');
    assert.ok(await activeIn('.zh-nav-mega')); await p.keyboard.press('Escape'); await wait(250);
    await p.locator('#navRes').click(); await wait(250); await p.locator('.zh-pop a:has-text("更新日志")').click(); await wait(300);
    assert.equal(await p.locator('.zh-pop').count(), 0); assert.match(await p.locator('#toastHost').innerText(), /前往：更新日志/); t.disclosure = 1;

    // user menu
    await p.locator('#navUser').click(); await wait(250);
    assert.equal(await p.locator('.zh-nav-menu [role=menuitem]').count(), 4); assert.equal(await p.evaluate(() => document.activeElement.textContent.trim()), '个人资料');
    await p.keyboard.press('ArrowDown'); assert.equal(await p.evaluate(() => document.activeElement.textContent.trim()), '账户设置');
    await p.keyboard.press('End'); assert.match(await p.evaluate(() => document.activeElement.textContent.trim()), /退出登录/);
    await p.keyboard.press('Escape'); await wait(250); assert.equal(await active(), 'navUser');
    await p.locator('#navUser').press('ArrowDown'); await wait(250); assert.equal(await p.locator('.zh-nav-menu').count(), 1);
    await p.mouse.click(5, 5); await wait(250); assert.equal(await p.locator('.zh-nav-menu').count(), 0); t.userMenu = 1;

    // ---- 2. side menu keyboard model ----
    const side = (id) => `#sideScroll [data-id="${id}"]`;
    assert.equal(await attr(side('articles'), 'aria-current'), 'page'); assert.equal(await attr(side('content'), 'aria-expanded'), 'true');
    assert.equal(await p.locator('#sideScroll [role=treeitem][tabindex="0"]').count(), 1, 'roving tabindex');
    await p.locator(side('articles')).focus();
    await p.keyboard.press('ArrowDown'); assert.equal(await active(), 'media');
    await p.keyboard.press('ArrowDown'); assert.equal(await active(), 'cats');
    await p.keyboard.press('ArrowRight'); await wait(300); assert.equal(await attr(side('cats'), 'aria-expanded'), 'true');
    await p.keyboard.press('ArrowRight'); assert.equal(await active(), 'cat-a');
    await p.keyboard.press('ArrowLeft'); assert.equal(await active(), 'cats');
    await p.keyboard.press('ArrowLeft'); await wait(300); assert.equal(await attr(side('cats'), 'aria-expanded'), 'false');
    assert.equal(await p.locator('#side-g-cats').evaluate((g) => g.closest('.zh-side-sub').inert), true, 'collapsed group is inert');
    await p.keyboard.press('ArrowLeft'); assert.equal(await active(), 'content');
    await p.keyboard.press('ArrowLeft'); await wait(300); assert.equal(await attr(side('content'), 'aria-expanded'), 'false');
    await p.keyboard.press('End'); assert.equal(await active(), 'settings'); await p.keyboard.press('Home'); assert.equal(await active(), 'overview');
    await p.keyboard.press('s'); assert.equal(await active(), 'settings');
    await p.keyboard.press('Enter'); assert.equal(await attr(side('settings'), 'aria-current'), 'page'); assert.equal(await p.locator('#sideHere').innerText(), '系统设置');
    await p.locator(side('orders')).click({ force: true }); assert.equal(await attr(side('orders'), 'aria-current'), null); assert.equal(await p.locator('#sideHere').innerText(), '系统设置');
    await p.locator(side('devices')).click(); await wait(300); await p.locator(side('d-alert')).click(); assert.equal(await p.locator('#sideHere').innerText(), '设备监控 / 告警中心');
    assert.ok(await p.locator(side('devices')).evaluate((e) => e.classList.contains('has-active'))); t.tree = 1;

    // collapsed rail: tooltip, flyout, keyboard
    await p.locator('#sideToggle').click(); await wait(500);
    assert.ok(await p.locator('#sideNav').evaluate((e) => e.classList.contains('is-collapsed'))); assert.equal(await p.locator('#sideNav').evaluate((e) => Math.round(e.getBoundingClientRect().width)), 64);
    assert.equal(await attr('#sideToggle', 'aria-expanded'), 'false');
    assert.ok((await p.locator(side('overview')).evaluate((e) => e.textContent)).includes('概览'), 'label stays in the accessibility tree');
    await p.locator(side('overview')).hover(); await wait(450);
    assert.match(await p.locator('.zh-pop--tooltip').first().innerText(), /概览/); await p.mouse.move(700, 600); await wait(300);
    assert.equal(await p.locator('.zh-pop--tooltip').count(), 0);
    await p.locator(side('content')).hover(); await wait(500);
    assert.ok(await p.locator('.zh-pop--dropdown .zh-nav-menu').isVisible()); assert.ok((await p.locator('.zh-pop--dropdown').innerText()).includes('媒体库'));
    await p.locator('.zh-pop--dropdown a:has-text("媒体库")').click(); await wait(300);
    assert.equal(await p.locator('#sideHere').innerText(), '内容管理 / 媒体库'); assert.equal(await p.locator('.zh-pop--dropdown').count(), 0);
    await p.locator(side('users')).focus(); await p.keyboard.press('ArrowRight'); await wait(300);
    assert.ok(await activeIn('.zh-pop--dropdown'), 'ArrowRight moves focus into the flyout'); assert.equal(await attr(side('users'), 'aria-expanded'), 'true');
    await p.keyboard.press('ArrowLeft'); await wait(300); assert.equal(await active(), 'users'); assert.equal(await attr(side('users'), 'aria-expanded'), 'false');
    await p.locator(side('users')).press('ArrowRight'); await wait(300); await p.keyboard.press('Escape'); await wait(300);
    assert.equal(await active(), 'users'); assert.equal(await p.locator('.zh-pop--dropdown').count(), 0);
    await p.locator('#sideToggle').click(); await wait(500); assert.equal(await p.locator('#sideNav').evaluate((e) => Math.round(e.getBoundingClientRect().width)), 252); t.rail = 1;

    // ---- 3. tabs ----
    const tabsOf = (k) => `[data-tabs="${k}"]`;
    await p.locator(`${tabsOf('line')} [role=tab]:has-text("成员")`).click(); await wait(120);
    assert.equal(await p.locator(`${tabsOf('line')} [role=tab][aria-selected=true]`).innerText().then((s) => s.replace(/\s+/g, '')), '成员12');
    assert.equal(await p.locator(`${tabsOf('line')} [role=tabpanel]:not([hidden]) h4`).innerText(), '成员');
    assert.equal(await p.locator(`${tabsOf('line')} [role=tabpanel]:not([hidden])`).count(), 1);
    await p.locator(`${tabsOf('line')} [role=tab][aria-selected=true]`).focus(); await p.keyboard.press('ArrowRight');
    assert.equal(await attr(`${tabsOf('line')} [role=tab][aria-selected=true]`, 'id') === await p.evaluate(() => document.activeElement.id), true, 'auto activation: focus and selection move together');
    await p.keyboard.press('End'); assert.match(await p.evaluate(() => document.activeElement.textContent), /日志/); await p.keyboard.press('ArrowRight'); assert.match(await p.evaluate(() => document.activeElement.textContent), /概览/);
    assert.equal(await p.locator(`${tabsOf('line')} [role=tab][tabindex="0"]`).count(), 1);
    assert.equal(await attr(`${tabsOf('line')} [role=tab][aria-selected=true]`, 'aria-controls') !== null, true);
    // manual activation
    await p.locator(`${tabsOf('seg-sm')} [role=tab]`).first().focus(); await p.keyboard.press('ArrowRight');
    assert.equal(await p.evaluate(() => document.activeElement.textContent.trim()), '周'); assert.equal(await p.locator(`${tabsOf('seg-sm')} [role=tab][aria-selected=true]`).innerText(), '日');
    await p.keyboard.press('Enter'); assert.equal(await p.locator(`${tabsOf('seg-sm')} [role=tab][aria-selected=true]`).innerText(), '周'); assert.match(await p.locator(`${tabsOf('seg-sm')} .zh-hint`).innerText(), /当前：周/);
    // vertical
    await p.locator(`${tabsOf('vertical')} [role=tab][aria-selected=true]`).focus(); await p.keyboard.press('ArrowDown');
    assert.equal(await p.locator(`${tabsOf('vertical')} [role=tab][aria-selected=true]`).innerText(), '安全'); assert.equal(await attr(`${tabsOf('vertical')} [role=tablist]`, 'aria-orientation'), 'vertical'); t.tabs = 1;

    // card: overflow arrows, delete, add, max
    const cardCount = () => p.locator(`${tabsOf('card')} [role=tab]`).count();
    assert.equal(await cardCount(), 8); assert.equal(await p.locator(`${tabsOf('card')} .zh-tabs-scroll`).evaluate((e) => e.hasAttribute('data-end')), true);
    assert.equal(await p.locator(`${tabsOf('card')} .zh-tabs-scroll`).evaluate((e) => e.hasAttribute('data-start')), false);
    await p.locator(`${tabsOf('card')} .zh-tabs-arrow--end`).click(); await wait(600);
    assert.ok(await p.locator(`${tabsOf('card')} .zh-tabs`).evaluate((e) => e.scrollLeft) > 50); assert.equal(await p.locator(`${tabsOf('card')} .zh-tabs-scroll`).evaluate((e) => e.hasAttribute('data-start')), true);
    await p.locator(`${tabsOf('card')} [role=tab]`).nth(1).click(); await p.keyboard.press('Delete');
    assert.equal(await cardCount(), 7); assert.equal(await p.locator(`${tabsOf('card')} [role=status]`).innerText(), '已关闭标签「文章管理」');
    assert.equal(await p.evaluate(() => document.activeElement.getAttribute('role')), 'tab', 'focus moves to a neighbouring tab after Delete');
    await p.locator(`${tabsOf('card')} [role=tab]`).first().locator('.zh-tabs-x').click(); assert.equal(await cardCount(), 6);
    await p.locator(`${tabsOf('card')} .zh-tabs-add`).click(); assert.equal(await cardCount(), 7); assert.match(await p.locator(`${tabsOf('card')} [role=tab][aria-selected=true]`).innerText(), /新标签/);
    assert.equal(await p.evaluate(() => document.activeElement.getAttribute('aria-selected')), 'true');
    for (let i = 0; i < 8; i++) await p.locator(`${tabsOf('card')} .zh-tabs-add`).click({ force: true });
    assert.equal(await cardCount(), 12); assert.equal(await attr(`${tabsOf('card')} .zh-tabs-add`, 'aria-disabled'), 'true');
    for (let i = 0; i < 12; i++) { await p.locator(`${tabsOf('card')} [role=tab]`).first().click(); await p.keyboard.press('Delete'); }
    assert.equal(await cardCount(), 0); assert.match(await p.locator(`${tabsOf('card')} .zh-tabs-panels`).innerText(), /所有标签都已关闭/); t.cardTabs = 1;

    // ---- 4. breadcrumb ----
    const bc = '.zh-bc[data-bc="chevron"]';
    assert.equal(await p.locator(`${bc} .zh-bc-more`).count(), 0); assert.equal(await p.locator(`${bc} li`).count(), 7);
    await p.locator('#bcWidth [data-v="260px"]').click(); await wait(900);
    assert.equal(await p.locator(`${bc} .zh-bc-more`).count(), 1); const nLi = await p.locator(`${bc} li`).count(); assert.ok(nLi <= 5, `collapsed to ${nLi}`);
    assert.match(await attr(`${bc} .zh-bc-more`, 'aria-label'), /显示隐藏的 \d 级路径/);
    assert.equal(await p.locator(`${bc} li:last-child .zh-bc-cur`).getAttribute('aria-current'), 'page');
    assert.equal(await p.locator(`${bc} li:first-child`).innerText(), '首页');
    await p.locator(`${bc} .zh-bc-more`).click(); await wait(250);
    const hiddenN = 7 - (nLi - 1) - 1 + 0; assert.ok((await p.locator('.zh-pop a.zh-nav-mi').count()) >= 2); assert.equal(await p.evaluate(() => document.activeElement.classList.contains('zh-nav-mi')), true);
    await p.keyboard.press('Escape'); await wait(250); assert.equal(await p.evaluate(() => document.activeElement.classList.contains('zh-bc-more')), true);
    await p.locator('#bcWidth [data-v="100%"]').click(); await wait(900); assert.equal(await p.locator(`${bc} .zh-bc-more`).count(), 0); t.breadcrumb = 1;

    // ---- 5. anchor / toc / back to top ----
    const sc = '#ancScroll';
    assert.equal(await p.locator('#ancTop').evaluate((e) => e.classList.contains('is-on')), false); assert.equal(await attr('#ancList a[aria-current]', 'data-target'), 'anc-1');
    await p.locator('#ancList a:has-text("主题定制")').click(); await wait(1100);
    const st = await p.locator(sc).evaluate((e) => e.scrollTop), target = await p.locator('#anc-4').evaluate((e) => e.offsetTop);
    assert.ok(Math.abs(st - (target - 12)) < 4, `scrolled to ${st}, expected ${target - 12}`);
    assert.equal(await attr('#ancList a[aria-current]', 'data-target'), 'anc-4'); assert.equal(await attr('#ancList a[aria-current]', 'aria-current'), 'location');
    assert.equal(await p.evaluate(() => document.activeElement.id), 'anc-4');
    assert.equal(await p.locator('#ancTop').evaluate((e) => e.classList.contains('is-on')), true); assert.equal(await attr('#ancTop', 'tabindex'), '0');
    assert.ok(parseFloat(await p.locator('#ancBar').evaluate((e) => e.style.getPropertyValue('--p'))) > 0.1);
    await p.locator(sc).evaluate((e) => { e.scrollTop = e.scrollHeight; }); await wait(300);
    assert.equal(await attr('#ancList a[aria-current]', 'data-target'), 'anc-8', 'last section active at the bottom');
    await p.locator(sc).evaluate((e) => { e.scrollTop = 500; }); await wait(200); const mid = await attr('#ancList a[aria-current]', 'data-target'); assert.ok(['anc-3', 'anc-4'].includes(mid), mid);
    await p.locator('#ancTop').click(); await wait(1100);
    assert.equal(await p.locator(sc).evaluate((e) => e.scrollTop), 0); assert.equal(await p.locator('#ancTop').evaluate((e) => e.classList.contains('is-on')), false);
    assert.equal(await p.evaluate(() => document.activeElement.id), 'ancScroll'); t.anchor = 1;

    // ---- 6. page header menu ----
    await p.locator('#phMore').click(); await wait(250);
    assert.equal(await p.locator('.zh-nav-menu [role=menuitem]').count(), 3); assert.equal(await p.locator('.zh-nav-mi--danger').count(), 1);
    await p.keyboard.press('Escape'); await wait(250); t.header = 1;

    // ---- 7. command palette ----
    const dlg = 'dialog.zh-cmd';
    await p.locator('#cmdOpen').click(); await wait(300);
    assert.equal(await p.locator(dlg).evaluate((d) => d.open), true); assert.equal(await active(), 'zhCmdInput');
    assert.equal(await p.locator('.zh-cmd-list [role=group]').count(), 4); assert.match(await p.locator('.zh-cmd-list [role=group]').first().innerText(), /^最近/);
    assert.equal(await attr('#zhCmdInput', 'aria-activedescendant'), 'zhCmdO0'); assert.equal(await attr('#zhCmdO0', 'aria-selected'), 'true');
    await p.keyboard.type('导出'); await wait(100);
    assert.equal(await p.locator('.zh-cmd-item').count(), 1); assert.equal(await p.locator('.zh-cmd-item mark').count(), 2); assert.equal(await p.locator('.zh-cmd-item').innerText().then((s) => s.split('\n')[0]), '导出数据');
    await p.locator('#zhCmdInput').fill('dev'); await wait(100); assert.match(await p.locator('.zh-cmd-item').first().innerText(), /设备监控/);
    await p.locator('#zhCmdInput').fill('xyzzy'); await wait(100); assert.equal(await p.locator('.zh-cmd-empty').isVisible(), true); assert.equal(await attr('#zhCmdInput', 'aria-activedescendant'), null);
    await p.locator('#zhCmdInput').fill('设'); await wait(100); const n0 = await p.locator('.zh-cmd-item').count(); assert.ok(n0 >= 1);
    await p.locator('#zhCmdInput').fill(''); await wait(100);
    await p.keyboard.press('ArrowDown'); assert.equal(await attr('#zhCmdInput', 'aria-activedescendant'), 'zhCmdO1'); await p.keyboard.press('ArrowUp'); await p.keyboard.press('ArrowUp'); assert.match(await attr('#zhCmdInput', 'aria-activedescendant'), /zhCmdO\d+/);
    await p.locator('#zhCmdInput').fill('导出'); await wait(50); await p.keyboard.press('Enter'); await wait(400);
    assert.equal(await p.locator(dlg).evaluate((d) => d.open), false); assert.match(await p.locator('#cmdLast').innerText(), /已执行：导出数据/); assert.equal(await active(), 'cmdOpen');
    await p.locator('#cmdOpen').click(); await wait(300); assert.match(await p.locator('.zh-cmd-list [role=group]').first().locator('.zh-cmd-item').first().innerText(), /导出数据/, 'recent list is updated');
    await p.keyboard.press('Escape'); await wait(400); assert.equal(await p.locator(dlg).evaluate((d) => d.open), false); assert.equal(await active(), 'cmdOpen');
    await p.locator('#cmdOpen').click(); await wait(300); await p.mouse.click(8, 8); await wait(400); assert.equal(await p.locator(dlg).evaluate((d) => d.open), false);
    await p.locator('body').press('Control+k'); await wait(300); assert.equal(await p.locator(dlg).evaluate((d) => d.open), true);
    await p.keyboard.press('Control+k'); await wait(400); assert.equal(await p.locator(dlg).evaluate((d) => d.open), false);
    await p.locator('#navSearch').click(); await wait(300); assert.equal(await p.locator(dlg).evaluate((d) => d.open), true); await p.keyboard.press('Escape'); await wait(400);
    assert.equal(await active(), 'navSearch'); t.palette = 1;

    // ---- 8. phone: drawer + forced rail + collapsed menu ----
    await load('screen=phone');
    assert.notEqual(await p.locator('#navBurger').evaluate((e) => getComputedStyle(e).display), 'none'); assert.equal(await p.locator('#navLinkWrap').evaluate((e) => getComputedStyle(e).display), 'none');
    assert.equal(await attr('#navBurger', 'aria-expanded'), 'false');
    await p.locator('#navBurger').click(); await wait(500);
    assert.equal(await attr('#navBurger', 'aria-expanded'), 'true'); assert.equal(await p.locator('#navPanel').evaluate((e) => getComputedStyle(e).visibility), 'visible'); assert.equal(await active(), 'navDClose');
    for (let i = 0; i < 12; i++) { await tab(i % 5 === 4); assert.ok(await activeIn('#navPanel'), `focus escaped the drawer on Tab #${i + 1}`); }
    await p.locator('#navPanel button[aria-controls="navDsub"]').click(); await wait(400); assert.equal(await attr('#navPanel button[aria-controls="navDsub"]', 'aria-expanded'), 'true');
    assert.equal(await p.locator('#navDsub > div').evaluate((e) => e.inert), false);
    await p.keyboard.press('Escape'); await wait(500);
    assert.equal(await attr('#navBurger', 'aria-expanded'), 'false'); assert.equal(await active(), 'navBurger'); assert.equal(await p.locator('#navPanel').evaluate((e) => getComputedStyle(e).visibility), 'hidden');
    await p.locator('#navBurger').click(); await wait(500); await p.locator('#navMask').click({ position: { x: 340, y: 100 }, force: true }); await wait(500); assert.equal(await attr('#navBurger', 'aria-expanded'), 'false');
    assert.ok(await p.locator('#sideNav').evaluate((e) => e.classList.contains('is-collapsed'))); assert.equal(await attr('#sideToggle', 'aria-disabled'), 'true'); assert.match(await p.locator('#sideNote').innerText(), /图标栏/);
    await p.locator('#phMore').click(); await wait(250); assert.equal(await p.locator('.zh-nav-menu [role=menuitem]').count(), 5); await p.keyboard.press('Escape'); await wait(250);
    const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); assert.ok(over <= 1, 'no horizontal overflow'); t.phone = 1;

    assert.deepEqual(errs, []);
    console.log('ok  ', JSON.stringify(t));
  } catch (e) { bad++; console.log('FAIL', name, (e.message || '').split('\n')[0], (String(e.stack).match(/test\.mjs:\d+/) || [''])[0], JSON.stringify(t)); }
  await b.close();
}
process.exit(bad ? 1 : 0);
