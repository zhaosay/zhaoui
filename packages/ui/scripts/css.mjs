// CSS extraction for the drop-in build. The component styles live in the demo (base.html and demo/base/, plus the fragments); this module
// pulls out the rules that belong to the library and leaves page-shell rules behind. Nothing is copied by hand.

/** Split CSS into top-level rules / at-rules (brace aware; ignores braces in strings and comments). */
export function splitRules(css) {
  const out = []; let i = 0, depth = 0, start = 0, str = null;
  while (i < css.length) {
    const c = css[i], n = css[i + 1];
    if (str) { if (c === '\\') i++; else if (c === str) str = null; }
    else if (c === '/' && n === '*') { const e = css.indexOf('*/', i + 2); if (depth === 0 && css.slice(start, i).trim() === '') start = e + 2; i = e + 1; }
    else if (c === '"' || c === "'") str = c;
    else if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { out.push(css.slice(start, i + 1).trim()); start = i + 1; } }
    else if (c === ';' && depth === 0) { out.push(css.slice(start, i + 1).trim()); start = i + 1; }
    i++;
  }
  return out.filter(Boolean);
}

// Classes allowed next to a zh- class: state and variant modifiers used by components.
const MODIFIERS = /^(zh-.*|is-.*|primary|danger|text|info|warning|success|error|err|open|active|disabled|ico|spin|lg|sm|md|ghost|selected|checked|current|body|icon|lead|cap|sub|no-chev|has-value|can-clear|pg-sum|pg-num|num|has-[a-z]+|hi|pct|on|c[1-9])$/;
// NOTE: body/icon/lead/cap/sub are un-prefixed inner classes of components (e.g. .zh-modal .body). They only pass when a zh- class is
// in the same selector. Renaming them to zh-* is a follow-up (they are a collision risk on host pages).

/** true when every class in the selector is a library class or a modifier, and at least one is a zh- class. */
export function keepSelector(sel) {
  sel = sel.replace(/^html:not\(\[data-screen="phone"\]\)\s+/, '');   // "not phone" is simply the default on a real page
  if (/#[\w-]/.test(sel.replace(/\[[^\]]*\]/g, ''))) return false;      // id selectors are demo wiring
  if (/\[data-screen/.test(sel)) return false;                            // screen simulator
  const classes = [...sel.replace(/\[[^\]]*\]/g, '').matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]);
  if (!classes.length) return false;
  if (!classes.every((c) => MODIFIERS.test(c))) return false;
  return classes.some((c) => c.startsWith('zh-') || c === 'ico' || c === 'spin');
}

function selectorList(head) {
  // split on top-level commas (not inside parens/brackets)
  const parts = []; let d = 0, s = 0;
  for (let i = 0; i < head.length; i++) { const c = head[i]; if ('([' .includes(c)) d++; else if (')]'.includes(c)) d--; else if (c === ',' && d === 0) { parts.push(head.slice(s, i).trim()); s = i + 1; } }
  parts.push(head.slice(s).trim()); return parts;
}

/** Keep the library part of a stylesheet. `dropped` collects selectors that had a zh- class but were rejected (for review). */
export function extractComponents(css, dropped = [], exclude = null, only = null) {
  const keep = [];
  for (const rule of splitRules(css)) {
    const open = rule.indexOf('{'); if (open < 0) continue;
    const head = rule.slice(0, open).trim(), body = rule.slice(open + 1, rule.lastIndexOf('}'));
    if (head.startsWith('@keyframes')) { keep.push({ kf: head.split(/\s+/)[1], text: rule }); continue; }
    if (head.startsWith('@container')) {
      // the demo's "stage" container simulates screen sizes; on a real page the same breakpoints are viewport queries
      const inner = extractComponents(body, dropped, exclude, only).map((r) => r.text).join('\n');
      if (inner.trim()) keep.push({ text: `@media ${head.replace(/^@container\s+\w+\s*/, '')} {\n${inner}\n}` });
      continue;
    }
    if (head.startsWith('@media') || head.startsWith('@supports')) {
      if (/prefers-reduced-motion/.test(head)) continue;                   // the library ships its own scoped version
      const inner = extractComponents(body, dropped, exclude, only).map((r) => r.text).join('\n');
      if (inner.trim()) keep.push({ text: `${head} {\n${inner}\n}` });
      continue;
    }
    if (head.startsWith('@')) continue;
    const list = selectorList(head), ok = list.filter((x) => keepSelector(x) && !(exclude && exclude.test(x)) && !(only && !only.test(x)));
    if (ok.length) keep.push({ text: `${ok.map((x) => x.replace(/^html:not\(\[data-screen="phone"\]\)\s+/, '')).join(',\n')} {${body}}` });
    else if (/\.zh-/.test(head)) dropped.push(head.slice(0, 90));
  }
  return keep;
}

/** Drop @keyframes nobody references, keep the rest. */
export function withUsedKeyframes(rules) {
  const body = rules.filter((r) => !r.kf).map((r) => r.text).join('\n');
  return rules.filter((r) => !r.kf || new RegExp(`\\b${r.kf}\\b`).test(body)).map((r) => r.text).join('\n\n');
}

/** Conservative minifier: comments and whitespace only; never touches ':' or '+' (selectors and calc()). */
export function minifyCss(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{};,>])\s*/g, '$1').replace(/;}/g, '}').trim();
}
