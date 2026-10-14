import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeLogo, DEFAULT_SEED } from '../src/logo.mjs';
import { hexToRgb, hexToOklch } from '../src/color.mjs';

const px = (w, h, fn) => { const a = new Uint8ClampedArray(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const [r, g, b, al] = fn(x, y); const o = (y * w + x) * 4; a[o] = r; a[o + 1] = g; a[o + 2] = b; a[o + 3] = al; } return a; };
const rgb = (hex, a = 255) => [...hexToRgb(hex), a];
const hueOf = (hex) => hexToOklch(hex)[2];
const near = (a, b, tol) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d) <= tol; };
const W = 64;

test('a solid coloured logo returns that colour', () => {
  const r = analyzeLogo(px(W, W, () => rgb('#e0407a')), W, W);
  assert.equal(r.fallback, false);
  assert.ok(near(hueOf(r.seed), hueOf('#e0407a'), 6), r.seed);
});

test('a logo on an opaque white background still finds the logo colour', () => {
  const r = analyzeLogo(px(W, W, (x, y) => (Math.hypot(x - 32, y - 32) < 14 ? rgb('#0f9d8a') : rgb('#ffffff'))), W, W);
  assert.equal(r.fallback, false);
  assert.ok(near(hueOf(r.seed), hueOf('#0f9d8a'), 8), r.seed);
  assert.ok(r.neutralShare > 0.5);
});

test('transparent background is ignored', () => {
  const r = analyzeLogo(px(W, W, (x) => (x < 20 ? rgb('#2f6bff') : [0, 0, 0, 0])), W, W);
  assert.ok(near(hueOf(r.seed), hueOf('#2f6bff'), 8), r.seed);
});

test('two-colour logo: larger area is primary, the other is the secondary', () => {
  const r = analyzeLogo(px(W, W, (x) => (x < 44 ? rgb('#0f9d8a') : rgb('#f2711c'))), W, W);
  assert.ok(near(hueOf(r.seed), hueOf('#0f9d8a'), 10), 'primary ' + r.seed);
  assert.ok(r.secondary && near(hueOf(r.secondary), hueOf('#f2711c'), 12), 'secondary ' + r.secondary);
});

test('black-and-white logo falls back to the default colour and says so', () => {
  const r = analyzeLogo(px(W, W, (x) => (x < 32 ? rgb('#000000') : rgb('#ffffff'))), W, W);
  assert.equal(r.fallback, true);
  assert.equal(r.seed, DEFAULT_SEED);
  assert.ok(r.warnings.some((w) => w.includes('默认色')));
});

test('empty / fully transparent logo falls back', () => {
  const r = analyzeLogo(px(W, W, () => [0, 0, 0, 0]), W, W);
  assert.equal(r.fallback, true);
  assert.equal(r.seed, DEFAULT_SEED);
});

test('gradient logo gives a colour between its ends and does not crash', () => {
  const r = analyzeLogo(px(W, W, (x) => rgb(x < 32 ? '#3b6cf6' : '#7c4dff')), W, W);
  assert.equal(r.fallback, false);
  assert.ok(hueOf(r.seed) > 250 && hueOf(r.seed) < 310, String(hueOf(r.seed)));
});

test('every report carries accessible-brand checks; pale yellow switches to dark button text', () => {
  const yellow = analyzeLogo(px(W, W, () => rgb('#f5c400')), W, W);
  assert.equal(yellow.brand.strategy, 'ink');
  assert.ok(yellow.warnings.some((w) => w.includes('深色')));
  for (const hex of ['#e0407a', '#0f9d8a', '#2f6bff', '#f5c400', '#84cc16']) {
    const r = analyzeLogo(px(W, W, () => rgb(hex)), W, W);
    assert.ok(r.checks.every((c) => c.pass), `${hex}: ${JSON.stringify(r.checks)}`);
  }
});
