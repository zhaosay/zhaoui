// Marquee: put the text inside .zh-marquee; the script wraps it in a track and adds an aria-hidden copy so the loop has no gap. data-speed is pixels per second (default 60).
ZhaoUI.component('marquee', { selector: '[data-zh-marquee]', init: function (m) {
  m.classList.add('zh-marquee');
  var track = document.createElement('div'); track.className = 'zh-marquee-track';
  while (m.firstChild) track.appendChild(m.firstChild);
  m.appendChild(track);
  var copy = track.cloneNode(true); copy.setAttribute('aria-hidden', 'true'); [].forEach.call(copy.querySelectorAll('a,button,input,[tabindex]'), function (x) { x.tabIndex = -1; });
  m.appendChild(copy);
  function fit() { var w = track.getBoundingClientRect().width, speed = +(m.getAttribute('data-speed') || 60); m.style.setProperty('--zh-marquee-dur', Math.max(4, w / speed) + 's'); copy.style.animationDuration = track.style.animationDuration = ''; }
  fit(); if (window.ResizeObserver) new ResizeObserver(fit).observe(track);
} });
