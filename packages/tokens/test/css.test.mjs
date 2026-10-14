import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../dist/zhaoui.css', import.meta.url), 'utf8');
const defined = new Set([...css.matchAll(/^\s*(--zh-[\w-]+)\s*:/gm)].map((m) => m[1]));
const used = [...css.matchAll(/var\((--zh-[\w-]+)/g)].map((m) => m[1]);

test('every var(--zh-*) used in the output is defined somewhere', () => {
  const missing = [...new Set(used)].filter((v) => !defined.has(v));
  assert.deepEqual(missing, []);
});

test('no syntax that older browsers cannot parse', () => {
  assert.doesNotMatch(css, /color-mix\(/, 'color-mix() needs Chrome 111 / Safari 16.2');
  assert.doesNotMatch(css, /light-dark\(/, 'light-dark() needs Chrome 123 / Safari 17.5');
  assert.doesNotMatch(css, /@container/, 'container queries are demo-only');
  assert.doesNotMatch(css, /oklch\(|oklab\(/, 'colours must be compiled to hex/rgba');
});

test('braces are balanced and there are no NaN or undefined values', () => {
  assert.equal((css.match(/{/g) || []).length, (css.match(/}/g) || []).length);
  assert.doesNotMatch(css, /NaN|undefined|\[object/);
});

test('default (attribute-less) theme is complete: light, audience b, standard, cn, default brand', () => {
  for (const sel of ['data-mode="light"', 'data-audience="b"', 'data-density="standard"', 'data-trend="cn"', 'data-brand="indigo"']) {
    assert.match(css, new RegExp(`:root,\\n\\[${sel}\\]`), sel);
  }
});

test('a flat region can be nested inside a glass page: [data-style="flat"] restores every remapped token', () => {
  const block = css.match(/\[data-style="flat"\] \{[\s\S]*?\n\}/)[0];
  const neu = css.match(/\[data-style="glass"\] \{[\s\S]*?\n\}/)[0];
  const remapped = [...neu.matchAll(/^\s*--zh-([\w-]+)\s*:/gm)].map((m) => m[1]).filter((k) => !k.startsWith('shadow-inset'));
  for (const k of remapped) assert.match(block, new RegExp(`--zh-${k}: var\\(--zh-flat-${k}\\)`), k);
});
