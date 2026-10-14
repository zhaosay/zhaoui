// Chapter map: mirrors the sidebar groups so new fragments show up here without editing this file.
var host = document.getElementById('chapterMap'), toc = document.querySelector('.toc');
if (host && toc) {
  var groups = [], cur = null;
  Array.prototype.forEach.call(toc.children, function (el) {
    if (el.classList.contains('grp')) { cur = { t: el.textContent.trim(), links: [] }; groups.push(cur); }
    else if (el.tagName === 'A' && cur) cur.links.push(el);
  });
  groups.filter(function (g) { return g.t !== '开始' && g.links.length; }).forEach(function (g) {
    var card = document.createElement('section'), h = document.createElement('h4'), n = document.createElement('small'), ul = document.createElement('ul');
    h.appendChild(document.createTextNode(g.t)); n.textContent = g.links.length + ' 节'; h.appendChild(n);
    g.links.forEach(function (a) {
      var li = document.createElement('li'), l = document.createElement('a');
      l.href = a.getAttribute('href'); l.textContent = a.textContent.trim(); li.appendChild(l); ul.appendChild(li);
    });
    card.appendChild(h); card.appendChild(ul); host.appendChild(card);
  });
}
