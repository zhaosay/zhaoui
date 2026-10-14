// Top navigation bar.  Desktop: links with a sliding underline for the current page; a link with a nested <ul> becomes a dropdown.  Phone (<768px): the links move into a slide-in drawer opened by a menu button.
ZhaoUI.component('navbar', { selector: '[data-zh-nav]', init: function (nav) {
  nav.classList.add('zh-nav'); var ul = nav.querySelector(':scope > .zh-nav-links'); if (!ul) return;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var wrap = document.createElement('div'); wrap.className = 'zh-nav-linkwrap'; ul.parentNode.insertBefore(wrap, ul); wrap.appendChild(ul);
  var ink = document.createElement('span'); ink.className = 'zh-nav-ink'; ink.setAttribute('aria-hidden', 'true'); wrap.appendChild(ink);
  var logo = nav.querySelector('.zh-nav-logo'), label = nav.getAttribute('aria-label') || '主导航';

  // desktop dropdowns from nested lists
  var drawerItems = [];
  [].slice.call(ul.children).forEach(function (li) {
    var sub = li.querySelector(':scope > ul'), top = li.querySelector(':scope > .zh-nav-link');
    if (sub && top) {
      var links = [].slice.call(sub.querySelectorAll('a')); sub.hidden = true; sub.setAttribute('aria-hidden', 'true');
      top.setAttribute('aria-haspopup', 'true'); top.setAttribute('aria-expanded', 'false');
      ZH.popover(top, { role: 'group', z: 'dropdown', placement: 'bottom-start', offset: 8, content: function () { var d = document.createElement('div'); d.className = 'zh-nav-menu'; d.style.minWidth = '200px'; d.innerHTML = links.map(function (a) { return '<a class="zh-nav-mi" href="' + esc(a.getAttribute('href') || '#') + '">' + (a.getAttribute('data-icon') ? '<i data-i="' + esc(a.getAttribute('data-icon')) + '" data-s="18"></i>' : '') + '<span>' + esc(a.textContent.trim()) + '</span></a>'; }).join(''); return d; },
        onOpen: function (el, api) { var body = el.querySelector('.zh-pop-body'); ZH.rovingFocus(body, 'a', { typeahead: false }); body.addEventListener('keydown', function (e) { if (e.key === 'Tab') { /* leave */ } }); } });
      top.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); top.click(); requestAnimationFrame(function () { var f = document.querySelector('.zh-pop .zh-nav-mi'); if (f) f.focus(); }); } });
      drawerItems.push({ title: top.textContent.trim(), icon: top.getAttribute('data-icon'), kids: links });
    } else if (top) drawerItems.push({ title: top.textContent.trim(), icon: top.getAttribute('data-icon'), href: top.getAttribute('href') || '#', current: top.getAttribute('aria-current') === 'page', el: top });
  });
  function moveInk() { var cur = ul.querySelector('a.zh-nav-link[aria-current="page"]'); if (!cur || !wrap.offsetWidth) { ink.classList.remove('is-on'); return; } ink.style.setProperty('--ink-x', (cur.offsetLeft + 12) + 'px'); ink.style.setProperty('--ink-w', Math.max(0, cur.offsetWidth - 24) + 'px'); ink.classList.add('is-on'); }
  ul.addEventListener('click', function (e) { var a = e.target.closest('a.zh-nav-link'); if (!a) return; var href = a.getAttribute('href'); if (!href || href === '#') e.preventDefault(); [].forEach.call(ul.querySelectorAll('a.zh-nav-link'), function (x) { x.removeAttribute('aria-current'); }); a.setAttribute('aria-current', 'page'); moveInk(); nav.dispatchEvent(new CustomEvent('zh:nav-select', { bubbles: true, detail: { href: href, label: a.textContent.trim() } })); });
  if (window.ResizeObserver) new ResizeObserver(moveInk).observe(wrap); moveInk(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInk);

  // phone drawer
  var burger = document.createElement('button'); burger.type = 'button'; burger.className = 'zh-nav-iconbtn zh-nav-burger'; burger.setAttribute('aria-label', '打开导航菜单'); burger.setAttribute('aria-expanded', 'false'); burger.innerHTML = '<i data-i="menu" data-s="20"></i>';
  nav.insertBefore(burger, nav.firstChild);
  var drawer = document.createElement('div'); drawer.className = 'zh-nav-drawer zh-nav-drawer--fixed'; drawer.setAttribute('aria-hidden', 'true'); var did = ZH.uid('zh-nd'); drawer.id = did; burger.setAttribute('aria-controls', did);
  drawer.innerHTML = '<div class="zh-nav-mask"></div><div class="zh-nav-panel" role="dialog" aria-modal="true" aria-label="' + esc(label) + '" tabindex="-1"><header>' + (logo ? '<a class="zh-nav-logo" href="' + esc(logo.getAttribute('href') || '#') + '" style="margin:0">' + logo.innerHTML + '</a>' : '<span></span>') + '<button class="zh-nav-iconbtn zh-nav-dclose" type="button" aria-label="关闭导航菜单"><i data-i="x" data-s="20"></i></button></header><nav aria-label="' + esc(label) + '（手机）">' +
    drawerItems.map(function (it, i) { var ic = it.icon ? '<i data-i="' + esc(it.icon) + '"></i>' : '';
      if (it.kids) return '<button class="zh-nav-dl" type="button" aria-expanded="false" aria-controls="' + did + '-s' + i + '">' + ic + esc(it.title) + '<i class="zh-nav-caret" data-i="chevron-down"></i></button><div class="zh-nav-dsub" id="' + did + '-s' + i + '"><div inert>' + it.kids.map(function (a) { return '<a class="zh-nav-dl" href="' + esc(a.getAttribute('href') || '#') + '">' + esc(a.textContent.trim()) + '</a>'; }).join('') + '</div></div>';
      return '<a class="zh-nav-dl" href="' + esc(it.href) + '"' + (it.current ? ' aria-current="page"' : '') + ' data-i-idx="' + i + '">' + ic + esc(it.title) + '</a>'; }).join('') + '</nav></div>';
  nav.appendChild(drawer); ZH.hydrateIcons(nav);
  var panel = drawer.querySelector('.zh-nav-panel'), release = null;
  function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } }
  function open() { if (drawer.classList.contains('is-open')) return; document.addEventListener('keydown', onKey, true); drawer.classList.add('is-open'); drawer.setAttribute('aria-hidden', 'false'); burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', '关闭导航菜单'); release = ZH.trapFocus(panel); drawer.querySelector('.zh-nav-dclose').focus(); }
  function close() { if (!drawer.classList.contains('is-open')) return; document.removeEventListener('keydown', onKey, true); drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden', 'true'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', '打开导航菜单'); if (release) { release(); release = null; } burger.focus(); }
  burger.addEventListener('click', function () { drawer.classList.contains('is-open') ? close() : open(); });
  drawer.querySelector('.zh-nav-dclose').addEventListener('click', close); drawer.querySelector('.zh-nav-mask').addEventListener('click', close);
  panel.addEventListener('mousedown', function (e) { if (!e.target.closest('a,button,input')) panel.focus(); });    // Safari does not focus buttons on click
  panel.addEventListener('click', function (e) {
    var b = e.target.closest('button.zh-nav-dl[aria-controls]'); if (b) { b.focus(); var sub = document.getElementById(b.getAttribute('aria-controls')), o = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', String(o)); sub.classList.toggle('is-open', o); sub.firstElementChild.inert = !o; return; }
    var a = e.target.closest('a.zh-nav-dl'); if (!a) return; var href = a.getAttribute('href'); if (!href || href === '#') e.preventDefault();
    [].forEach.call(panel.querySelectorAll('a.zh-nav-dl'), function (x) { x.removeAttribute('aria-current'); }); a.setAttribute('aria-current', 'page'); nav.dispatchEvent(new CustomEvent('zh:nav-select', { bubbles: true, detail: { href: href, label: a.textContent.trim() } })); close();
  });
  if (window.ResizeObserver) new ResizeObserver(function () { if (getComputedStyle(burger).display === 'none') close(); }).observe(nav);
} });
