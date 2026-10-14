import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { modes } from '../src/tokens.mjs';

const f = JSON.parse(readFileSync(new URL('../dist/tokens.figma.json', import.meta.url), 'utf8'));
const leaves = (o, path = []) => (o && typeof o === 'object' && '$value' in o ? [[path.join('.'), o]] : Object.entries(o || {}).flatMap(([k, v]) => (k.startsWith('$') ? [] : leaves(v, [...path, k]))));

test('figma export: every leaf has a valid $type and $value', () => {
  const bad = [];
  for (const set of ['core', 'light', 'dark', 'audience-b', 'audience-c', 'density']) {
    for (const [path, t] of leaves(f[set], [set])) {
      const v = t.$value;
      const ok = t.$type === 'color' ? /^(#[0-9a-f]{6}|rgba?\([\d\s.,]+\))$/i.test(v)
        : t.$type === 'dimension' ? /^-?\d+(\.\d+)?px$/.test(v)
        : t.$type === 'duration' ? /^\d+ms$/.test(v)
        : t.$type === 'cubicBezier' ? Array.isArray(v) && v.length === 4 && v.every(Number.isFinite)
        : t.$type === 'number' ? Number.isFinite(v) : false;
      if (!ok) bad.push(`${path}: ${t.$type} ${JSON.stringify(v)}`);
    }
  }
  assert.deepEqual(bad, []);
});

test('figma export: light and dark carry the same colour names, and every mode colour is present', () => {
  const names = (set) => leaves(f[set]).map(([p]) => p.replace(/^color\.[a-z]+\./, '')).sort();
  assert.deepEqual(names('light'), names('dark'));
  const all = new Set(names('light'));
  for (const k of Object.keys(modes.light)) assert.ok(all.has(k.startsWith('chart-') ? k.slice(6) : k.startsWith('glass-') ? k.slice(6) : k), k);
});

test('figma export: nothing is left as an unresolved alias', () => {
  assert.doesNotMatch(JSON.stringify(f), /"@|var\(--/);
});
