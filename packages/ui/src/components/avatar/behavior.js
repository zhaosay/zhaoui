// Avatar: <span class="zh-avatar" data-name="张三" data-size="md" data-shape="square" data-src="photo.jpg" data-status="success"></span>
// Shows the photo if data-src loads, otherwise initials (Chinese: first character) on a colour derived from the name, or data-icon / a user icon.
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
  el.style.setProperty('--av', el.dataset.tone === 'brand' ? 'var(--zh-color-primary)' : 'var(--zh-chart-' + hue(name || 'x') + ')');   // data-tone="brand": the brand colour instead of one of the 8 chart colours
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

ZhaoUI.component('avatar', { selector: '.zh-avatar[data-name]', init: hydrateAvatar });
