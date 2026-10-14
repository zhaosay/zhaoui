import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../dist/zhaoui-style-glass.css', import.meta.url), 'utf8');
const tokens = readFileSync(new URL('../dist/zhaoui.css', import.meta.url), 'utf8');
const rules = [...css.matchAll(/^(\[data-style="glass"\][^{}]*?)\s*\{/gm)].map((m) => m[1]);

test('every glass rule is guarded against flat regions nested inside it', () => {
  assert.ok(rules.length > 40, `found ${rules.length} rules`);
  for (const r of rules) for (const sel of r.split(',')) assert.match(sel, /:not\(\[data-style="flat"\] \*\)/, sel.trim());
});

test('pseudo-elements keep the guard before the ::pseudo (otherwise the selector is invalid)', () => {
  for (const r of rules) for (const sel of r.split(',')) if (sel.includes('::')) assert.match(sel, /:not\(\[data-style="flat"\] \*\)::/, sel.trim());
});

test('the style pack only uses tokens the package defines', () => {
  const defined = new Set([...tokens.matchAll(/^\s*(--zh-[\w-]+)\s*:/gm)].map((m) => m[1]));
  const used = [...css.matchAll(/var\((--zh-[\w-]+)/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(used)].filter((v) => !defined.has(v)), []);
});

test('accessibility fallbacks exist for high contrast, reduced motion, reduced transparency and missing blur', () => {
  assert.match(css, /prefers-reduced-transparency: reduce/);
  assert.match(css, /@supports not \(\(backdrop-filter/);
  assert.match(css, /prefers-contrast: more/);
  assert.match(css, /forced-colors: active/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('no syntax older browsers cannot parse', () => {
  assert.doesNotMatch(css, /color-mix\(|light-dark\(|oklch\(|@container/);
});

test('every backdrop-filter is written with its -webkit- twin (Safari < 18)', () => {
  const decls = css.replace(/@supports[^{]*\{/g, '');
  const plain = (decls.match(/(^|[\s;{])backdrop-filter:/gm) || []).length, webkit = (decls.match(/-webkit-backdrop-filter:/g) || []).length;
  assert.ok(plain > 0 && plain === webkit, `plain ${plain} vs webkit ${webkit}`);
});

test('blur is only applied to top-level and floating surfaces, never to in-page cards', () => {
  const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*backdrop-filter[^{}]*)\}/g)].map((m) => m[1]);
  const joined = blocks.join(' ');
  for (const sel of ['.zh-card', '.zh-btn', '.zh-input', '.zh-tag']) assert.ok(!joined.includes(sel + ',') && !joined.includes(sel + ' '), `${sel} must not blur`);
});
