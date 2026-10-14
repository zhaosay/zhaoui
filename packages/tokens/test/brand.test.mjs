import test from 'node:test';
import assert from 'node:assert/strict';
import { modes, brands } from '../src/tokens.mjs';
import { generateBrand, buildScale } from '../src/brand.mjs';
import { contrast, hexToOklch } from '../src/color.mjs';

const seeds = {
  ...brands,
  yellow: '#f5c400', lime: '#84cc16', amber: '#f59e0b', gray: '#6b7280', navy: '#0b2a6f', neon: '#22ff88', black: '#111111', red: '#e11d48',
};

test('brand scale gets steadily darker and keeps the seed hue', () => {
  for (const [name, hex] of Object.entries(seeds)) {
    const L = buildScale(hex).map((h) => hexToOklch(h)[0]);
    for (let i = 1; i < L.length; i++) assert.ok(L[i] < L[i - 1], `${name} step ${i}`);
  }
});

test('every brand yields readable primary, text and states in both modes', () => {
  const bad = [];
  const need = (label, v, min) => { if (!(v >= min)) bad.push(`${label} ${v.toFixed(2)} < ${min}`); };
  for (const [name, hex] of Object.entries(seeds)) {
    const b = generateBrand(hex);
    need(`${name} light on-primary`, contrast(b.light.on, b.light.primary), 4.5);
    need(`${name} dark on-primary`, contrast(b.dark.on, b.dark.primary), 4.5);
    need(`${name} light text on white`, contrast(b.light.text, modes.light.bg), 4.5);
    need(`${name} light text on subtle`, contrast(b.light.text, b.light.subtle), 4.5);
    need(`${name} dark text on tint`, contrast(b.dark.text, b.darkSubtleHex), 4.5);
    need(`${name} dark text on bg`, contrast(b.dark.text, modes.dark.bg), 4.5);
    if (b.strategy === 'white') {
      need(`${name} light primary vs bg`, contrast(b.light.primary, modes.light.bg), 3);
      need(`${name} dark primary vs bg`, contrast(b.dark.primary, modes.dark.bg), 3);
    }
    assert.notEqual(b.light.hover, b.light.primary, `${name} hover`);
    assert.notEqual(b.light.active, b.light.hover, `${name} active`);
  }
  assert.deepEqual(bad, []);
});

test('bright seeds switch to dark text instead of a muddy fill', () => {
  for (const name of ['yellow', 'lime', 'amber', 'neon']) {
    const b = generateBrand(seeds[name]);
    assert.equal(b.strategy, 'ink', name);
    assert.ok(hexToOklch(b.light.primary)[0] > 0.7, `${name} keeps a bright primary`);
  }
});

test('default brands stay vivid (chroma) while accessible', () => {
  for (const name of Object.keys(brands)) {
    const c = hexToOklch(generateBrand(brands[name]).light.primary)[1];
    assert.ok(c > 0.09, `${name} chroma ${c.toFixed(3)}`);
  }
});
