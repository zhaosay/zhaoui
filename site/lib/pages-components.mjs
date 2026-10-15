// One page per component, plus the component index.  Everything comes from packages/ui/src/components/*/meta.json (via docs/components.json).
import { esc, GROUPS, RUN_BUTTON, MODULE_OF } from '../../packages/ui/scripts/facts.mjs';
import { componentFaq } from '../../packages/ui/scripts/docs.mjs';
import { rel } from './layout.mjs';

const cell = (s) => esc(s).replace(/`([^`]+)`/g, '<code class="zh-code-inline">$1</code>');
const code = (s) => `<code class="zh-code-inline">${esc(s)}</code>`;
function table(head, rows) {
  if (!rows.length) return '';
  return `<div class="zh-table-wrap"><table class="zh-table"><thead><tr>${head.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td data-label="${esc(head[i])}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
const lead = (m) => String(m.summary).replace(/^纯样式组件：不需要 JS，写好标记即可。/, '').trim();
export const order = (metas) => { const by = Object.fromEntries(metas.map((m) => [m.name, m])), seen = new Set(), out = []; GROUPS.forEach(([, ns]) => ns.forEach((n) => { if (by[n]) { out.push(by[n]); seen.add(n); } })); metas.forEach((m) => { if (!seen.has(m.name)) out.push(m); }); return out; };

export function componentSide(metas) {
  const by = Object.fromEntries(metas.map((m) => [m.name, m])), used = new Set(GROUPS.flatMap(([, n]) => n));
  const groups = GROUPS.map(([t, ns]) => ({ title: t, items: ns.filter((n) => by[n]).map((n) => ({ label: by[n].title, href: `components/${n}.html` })) }));
  const rest = metas.filter((m) => !used.has(m.name)); if (rest.length) groups.push({ title: '其他', items: rest.map((m) => ({ label: m.title, href: `components/${m.name}.html` })) });
  return [{ title: '总览', items: [{ label: '全部组件', href: 'components/index.html' }] }, ...groups];
}

export function componentPage(m, ctx) {
  const { metas, path } = ctx, all = order(metas), i = all.indexOf(m), prev = all[i - 1], next = all[i + 1], hasBehavior = !/^纯样式组件/.test(m.summary);
  const scripts = [...m.example.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((x) => x[1]);
  const html = m.example.replace(/<script>[\s\S]*?<\/script>/g, '').replace(/<(\/?)main\b/g, '<$1div').trim();
  const run = RUN_BUTTON.has(m.name) && scripts.length ? `<button class="zh-btn primary" type="button" data-site-run data-code="${esc(scripts.join('\n'))}">运行示例</button>` : '';
  const live = RUN_BUTTON.has(m.name) ? '' : scripts.map((s) => `<script>${s}</script>`).join('\n');
  const mod = MODULE_OF[m.name], faq = componentFaq(m);
  const H = [{ level: 2, id: 'demo', text: '示例' }, { level: 2, id: 'code', text: '代码' }];
  let o = `<h1>${esc(m.title)}</h1>\n<p class="s-lead">${esc(lead(m))}</p>\n<p class="s-badges"><span class="zh-tag ${hasBehavior ? 'primary' : ''}">${hasBehavior ? '带行为' : '纯样式'}</span> <span class="zh-tag">${mod ? `分包 modular/${mod}` : '核心包'}</span>${m.events?.length ? ` <span class="zh-tag">${m.events.length} 个事件</span>` : ''}${m.methods?.length ? ` <span class="zh-tag">${m.methods.length} 个方法</span>` : ''}</p>\n`;
  o += `<h2 id="demo">示例</h2>\n<div class="s-stage" data-example="${m.name}" role="group" tabindex="0" aria-label="${esc(m.title)}示例">${html ? html + '\n' : ''}${run}${live}</div>\n<p class="s-actions"><a class="zh-btn sm" href="${rel(path, 'playground.html')}?c=${m.name}"><i data-i="play"></i>在线试用</a> <a class="zh-btn sm" href="${m.name}.md"><i data-i="file-text"></i>Markdown 版</a></p>\n`;
  o += `<h2 id="code">代码</h2>\n<div class="doc-code"><button class="zh-btn sm s-copy" type="button" data-site-copy aria-label="复制代码">复制</button><pre class="zh-code" tabindex="0"><code class="lang-html">${esc(m.example.trim())}</code></pre></div>\n`;
  if (mod) o += `<p class="s-note">只用核心包（<code class="zh-code-inline">modular/core</code>）时，还要加 <code class="zh-code-inline">modular/${mod}.min.js</code> 和 <code class="zh-code-inline">modular/${mod}.min.css</code>；全量版已包含。见 <a href="${rel(path, 'guide/quickstart.html')}#按需引入">按需引入</a>。</p>\n`;
  if (m.attributes?.length) { H.push({ level: 2, id: 'attrs', text: '属性' }); o += `<h2 id="attrs">属性</h2>\n${table(['属性', '用在', '取值', '说明'], m.attributes.map((a) => [code(a.name), cell(a.on), cell(a.value), cell(a.desc)]))}\n`; }
  if (m.events?.length) { H.push({ level: 2, id: 'events', text: '事件' }); o += `<h2 id="events">事件</h2>\n${table(['事件', '触发于', 'detail', '说明'], m.events.map((e) => [code(e.name), cell(e.on), cell(e.detail), cell(e.desc)]))}\n`; }
  if (m.methods?.length) { H.push({ level: 2, id: 'methods', text: '方法' }); o += `<h2 id="methods">方法</h2>\n<ul>${m.methods.map((x) => `<li>${code(x.name)}${x.desc ? '：' + cell(x.desc) : ''}</li>`).join('')}</ul>\n`; }
  if (m.classes?.length) { H.push({ level: 2, id: 'classes', text: '样式类' }); o += `<h2 id="classes">样式类</h2>\n<p>${m.classes.map(code).join('　')}</p>\n`; }
  if (m.a11y?.length) { H.push({ level: 2, id: 'a11y', text: '无障碍' }); o += `<h2 id="a11y">无障碍</h2>\n<ul>${m.a11y.map((x) => `<li>${cell(x)}</li>`).join('')}</ul>\n`; }
  H.push({ level: 2, id: 'faq', text: '常见问题' }); o += `<h2 id="faq">常见问题</h2>\n${faq.map(([q, a]) => `<h3>${esc(q)}</h3>\n<p>${cell(a)}</p>`).join('\n')}\n`;
  o += `<nav class="s-pn" aria-label="上一个和下一个组件">${prev ? `<a class="zh-card zh-card--hover" href="${prev.name}.html"><small>上一个</small><strong>${esc(prev.title)}</strong></a>` : '<span></span>'}${next ? `<a class="zh-card zh-card--hover s-next" href="${next.name}.html"><small>下一个</small><strong>${esc(next.title)}</strong></a>` : ''}</nav>\n`;
  const ld = [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }];
  return { title: `${m.title}（${m.name}）`, description: `${m.title}：${lead(m).split('。')[0]}。附实时示例、可复制代码、属性、事件、方法与无障碍说明。`.slice(0, 160), body: o, headings: H, ld, crumbs: [{ name: '组件', href: 'components/index.html' }] };
}

export function componentIndex(metas, ctx) {
  const by = Object.fromEntries(metas.map((m) => [m.name, m])), used = new Set(GROUPS.flatMap(([, n]) => n));
  const groups = GROUPS.map(([t, ns]) => [t, ns.filter((n) => by[n]).map((n) => by[n])]); const rest = metas.filter((m) => !used.has(m.name)); if (rest.length) groups.push(['其他', rest]);
  let o = `<h1>组件</h1>\n<p class="s-lead">ZhaoUI 共有 ${metas.length} 个组件。每个组件一页：实时示例、可复制代码、属性、事件、方法、无障碍说明和常见问题，都可以直接在浏览器里试。</p>\n`;
  const H = [];
  groups.forEach(([t, ms]) => { const id = 'g-' + t; H.push({ level: 2, id, text: t }); o += `<h2 id="${id}">${esc(t)}</h2>\n<div class="s-cards">${ms.map((m) => `<a class="zh-card zh-card--hover s-comp" href="${m.name}.html"><strong>${esc(m.title)}</strong><span>${esc(lead(m).split('。')[0])}</span></a>`).join('')}</div>\n`; });
  const ld = [{ '@context': 'https://schema.org', '@type': 'ItemList', name: 'ZhaoUI 组件', numberOfItems: metas.length, itemListElement: order(metas).map((m, i) => ({ '@type': 'ListItem', position: i + 1, name: m.title, url: `${ctx.abs('components/' + m.name + '.html')}` })) }];
  return { title: `ZhaoUI 组件：${metas.length} 个原生 HTML/CSS/JS 组件`, description: `ZhaoUI 的 ${metas.length} 个组件：表单、选择与日期、表格、树、上传、图表、导航、弹层等，每个都有实时示例和 API 说明。`, body: o, headings: H, ld };
}
