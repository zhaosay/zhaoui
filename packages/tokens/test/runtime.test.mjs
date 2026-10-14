import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { brandVars, generateBrand } from '../src/brand.mjs';
import { brands, modes } from '../src/tokens.mjs';

const ctx = {};
vm.runInNewContext(readFileSync(new URL('../dist/zhaoui.runtime.js', import.meta.url), 'utf8'), ctx);
const Z = ctx.ZhaoUI;

test('browser runtime exposes the API', () => {
  for (const k of ['brands', 'modes', 'applyBrand', 'generateBrand', 'brandVars', 'buildScale', 'contrast']) assert.ok(k in Z, k);
});

test('browser runtime produces exactly the same colours as the build', () => {
  assert.deepEqual({ ...Z.brands }, brands);
  assert.deepEqual(JSON.parse(JSON.stringify(Z.modes)), modes);
  for (const hex of [...Object.values(brands), '#f5c400', '#6b7280']) {
    assert.deepEqual({ ...Z.brandVars(hex) }, brandVars(hex));
    assert.deepEqual(JSON.parse(JSON.stringify(Z.generateBrand(hex))), generateBrand(hex));
  }
});
