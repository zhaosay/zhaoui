// A small Markdown to HTML converter for the docs in packages/ui/src/docs: headings, paragraphs, lists, tables, fenced code, quotes, rules and inline code, bold, links.
import { esc } from '../../packages/ui/scripts/facts.mjs';

export function slug(text) { return String(text).trim().toLowerCase().replace(/[`*]/g, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'section'; }

function inline(s, link) {
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  s = esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => `<a href="${esc(link(u.replace(/&amp;/g, '&')))}">${t}</a>`);
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code class="zh-code-inline">${esc(codes[+i])}</code>`);
}

/** Returns { html, headings: [{ level, id, text }] }.  `link(url)` lets the caller rewrite relative links (docs/xxx.md -> xxx.html). */
export function md(src, { link = (u) => u, idPrefix = '' } = {}) {
  const lines = String(src).replace(/\r\n/g, '\n').split('\n'), out = [], headings = [], used = {};
  let i = 0;
  const para = [];
  const flush = () => { if (para.length) { out.push(`<p>${inline(para.join(' '), link)}</p>`); para.length = 0; } };
  const uniq = (t) => { let id = idPrefix + slug(t), n = 2; while (used[id]) id = idPrefix + slug(t) + '-' + n++; used[id] = 1; return id; };
  while (i < lines.length) {
    const l = lines[i];
    let m;
    if ((m = l.match(/^```(\w*)\s*$/))) { flush(); const buf = []; i++; while (i < lines.length && !/^```\s*$/.test(lines[i])) buf.push(lines[i++]); i++;
      out.push(`<div class="doc-code"><pre class="zh-code" tabindex="0"><code${m[1] ? ` class="lang-${m[1]}"` : ''}>${esc(buf.join('\n'))}</code></pre></div>`); continue; }
    if ((m = l.match(/^(#{1,4})\s+(.*)$/))) { flush(); const level = m[1].length, text = m[2].replace(/`/g, ''), id = uniq(text); headings.push({ level, id, text }); out.push(`<h${level} id="${id}">${inline(m[2], link)}</h${level}>`); i++; continue; }
    if (/^---+\s*$/.test(l)) { flush(); out.push('<hr class="zh-divider">'); i++; continue; }
    if (/^\|.*\|\s*$/.test(l) && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '')) {
      flush(); const cells = (r) => r.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
      const head = cells(l); i += 2; const rows = []; while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) rows.push(cells(lines[i++]));
      out.push(`<div class="zh-table-wrap"><table class="zh-table"><thead><tr>${head.map((c) => `<th scope="col">${inline(c, link)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, k) => `<td data-label="${esc(head[k] || '')}">${inline(c, link)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`); continue;
    }
    if (/^>\s?/.test(l)) { flush(); const buf = []; while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, '')); out.push(`<blockquote class="doc-quote">${inline(buf.join(' '), link)}</blockquote>`); continue; }
    if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
      flush(); const ordered = /^\s*\d+\./.test(l), items = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) { let t = lines[i++].replace(/^\s*([-*]|\d+\.)\s+/, ''); while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*]|\d+\.)\s+/.test(lines[i])) t += ' ' + lines[i++].trim(); items.push(t); }
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.map((t) => `<li>${inline(t, link)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`); continue;
    }
    if (!l.trim()) { flush(); i++; continue; }
    para.push(l.trim()); i++;
  }
  flush();
  return { html: out.join('\n'), headings };
}
