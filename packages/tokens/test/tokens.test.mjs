import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { modes, audiences, densities, trends, layout, brands } from '../src/tokens.mjs';
import { statusTints } from '../src/css.mjs';
import { contrast, blend, hexToOklch, oklchToHex } from '../src/color.mjs';
import { brandVars } from '../src/brand.mjs';

const css = readFileSync(new URL('../dist/zhaoui.css', import.meta.url), 'utf8');
const fails = [];
const check = (label, value, min) => { if (!(value >= min)) fails.push(`${label}: ${value.toFixed(2)} < ${min}`); };
const surfaces = (m) => [modes[m].bg, modes[m]['bg-subtle'], modes[m]['bg-elevated']];

test('every alias points at a token in the same scope', () => {
  const scopes = { ...modes, ...Object.fromEntries(Object.entries(trends).map(([k, v]) => [`trend:${k}`, v])) };
  for (const [name, scope] of Object.entries(scopes)) {
    for (const [k, v] of Object.entries(scope)) {
      if (typeof v === 'string' && v.startsWith('@')) {
        const ref = v.slice(1);
        assert.ok(ref in scope || ref in modes.light, `${name}.${k} -> ${ref} is not defined`);
      }
    }
  }
});

test('text tokens reach 4.5:1 on every surface, in both modes', () => {
  for (const m of ['light', 'dark']) {
    for (const t of ['text', 'text-secondary', 'text-tertiary', 'green-text', 'amber-text', 'red-text', 'cyan-text']) {
      for (const s of surfaces(m)) check(`${m} ${t} on ${s}`, contrast(modes[m][t], s), 4.5);
    }
    check(`${m} text-inverse on text`, contrast(modes[m]['text-inverse'], modes[m].text), 4.5);
  }
  assert.deepEqual(fails, []);
});

test('status text stays readable on its own tinted background (tags, alerts)', () => {
  const textFor = { success: 'green-text', warning: 'amber-text', danger: 'red-text', info: 'cyan-text' };
  for (const m of ['light', 'dark']) {
    for (const [s, t] of Object.entries(textFor)) {
      const tint = blend(modes[m][s], 0.14, modes[m].bg);
      check(`${m} ${t} on ${s} tint`, contrast(modes[m][t], tint), 4.5);
    }
  }
  assert.deepEqual(fails, []);
});

test('hierarchy: each text level is visibly quieter than the previous one', () => {
  for (const m of ['light', 'dark']) {
    const c = ['text', 'text-secondary', 'text-tertiary'].map((t) => contrast(modes[m][t], modes[m].bg));
    assert.ok(c[0] > c[1] + 1.5 && c[1] > c[2] + 0.8, `${m}: ${c.map((x) => x.toFixed(1))}`);
  }
});

test('borders and surfaces are separable', () => {
  for (const m of ['light', 'dark']) {
    check(`${m} border vs bg`, contrast(modes[m].border, modes[m].bg), 1.1);
    check(`${m} border-strong vs bg`, contrast(modes[m]['border-strong'], modes[m].bg), 1.35);
    check(`${m} subtle vs bg`, contrast(modes[m]['bg-subtle'], modes[m].bg), 1.02);
    check(`${m} elevated vs bg`, contrast(modes[m]['bg-elevated'], modes[m].bg), m === 'dark' ? 1.04 : 1);
  }
  assert.deepEqual(fails, []);
});

test('chart palette: adjacent categorical colours are clearly different (OKLab dE x100 >= 15)', () => {
  for (const m of ['light', 'dark']) {
    const lab = (h) => { const [L, C, H] = hexToOklch(h); return [L, C * Math.cos((H * Math.PI) / 180), C * Math.sin((H * Math.PI) / 180)]; };
    for (let i = 1; i < 8; i++) {
      const a = lab(modes[m][`chart-${i}`]), b = lab(modes[m][`chart-${i + 1}`]);
      check(`${m} chart-${i}/${i + 1}`, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) * 100, 15);
    }
  }
  assert.deepEqual(fails, []);
});

test('layout tiers are contiguous and use 4 / 8 / 12 columns', () => {
  const t = layout.tiers;
  assert.deepEqual(t.map((x) => x.cols), [4, 8, 12, 12]);
  for (let i = 1; i < t.length; i++) assert.equal(t[i].min, t[i - 1].max + 1, `gap before ${t[i].name}`);
});

test('presets exist for every audience, density and trend referenced by the CSS', () => {
  for (const a of Object.keys(audiences)) assert.match(css, new RegExp(`data-audience="${a}"`));
  for (const d of Object.keys(densities)) assert.match(css, new RegExp(`data-density="${d}"`));
  for (const t of Object.keys(trends)) assert.match(css, new RegExp(`data-trend="${t}"`));
  for (const b of Object.keys(brands)) assert.match(css, new RegExp(`data-brand="${b}"`));
});

test('status tints are static (no runtime colour-mix needed)', () => {
  for (const m of ['light', 'dark']) {
    const t = statusTints(m);
    assert.equal(Object.keys(t).length, 12);
    for (const v of Object.values(t)) assert.match(v, /^rgba\(\d+, \d+, \d+, 0\.\d+\)$/);
  }
});

test('motion tokens: exits are faster than enters, durations ascend', async () => {
  const { base } = await import('../src/tokens.mjs');
  const ms = (k) => parseInt(base[k], 10);
  const ladder = ['dur-instant', 'dur-fast', 'dur-base', 'dur-slow', 'dur-slower'].map(ms);
  assert.deepEqual([...ladder].sort((a, b) => a - b), ladder);
  for (const k of ['ease-standard', 'ease-enter', 'ease-exit', 'ease-spring']) assert.match(base[k], /^cubic-bezier\(/);
});

test('glassmorphism: text stays readable on every glass surface, over the darkest backdrop spot, for many brand hues', async () => {
  const { generateBrand } = await import('../src/brand.mjs');
  const { styleTint } = await import('./helpers.mjs');
  const seeds = { ...brands, yellow: '#f5c400', red: '#e11d48', navy: '#0b2a6f', lime: '#84cc16', gray: '#6b7280' };
  const bad = [];
  for (const [name, hex] of Object.entries(seeds)) {
    const g = generateBrand(hex).glass;
    for (const m of ['light', 'dark']) {
      const spots = [g[m].o1, g[m].o2, g[m].o3, g[m].base];
      for (const spot of spots) for (const fillKey of ['glass-fill', 'glass-fill-strong']) {
        const surf = styleTint(modes[m][fillKey], spot);
        for (const t of ['text', 'text-secondary', 'text-tertiary', 'green-text', 'amber-text', 'red-text', 'cyan-text']) {
          const v = contrast(modes[m][t], surf);
          if (v < 4.5) bad.push(`${name} ${m} ${t} on ${fillKey} over ${spot}: ${v.toFixed(2)}`);
        }
      }
    }
  }
  assert.deepEqual(bad, []);
});

test('glassmorphism: the backdrop is colourful enough to read as glass, and stays in its lightness band', async () => {
  const { generateBrand } = await import('../src/brand.mjs');
  const bad = [];
  for (const hex of [...Object.values(brands), '#f5c400', '#6b7280']) {
    const g = generateBrand(hex).glass;
    for (const m of ['light', 'dark']) {
      const L = (h) => hexToOklch(h)[0], C = (h) => hexToOklch(h)[1];
      for (const k of ['o1', 'o2', 'o3']) {
        if (m === 'light' && !(L(g[m][k]) > 0.84 && L(g[m][k]) < 0.94)) bad.push(`${hex} ${m} ${k} lightness ${L(g[m][k]).toFixed(2)}`);
        if (m === 'dark' && !(L(g[m][k]) > 0.17 && L(g[m][k]) < 0.27)) bad.push(`${hex} ${m} ${k} lightness ${L(g[m][k]).toFixed(2)}`);
      }
      if (contrast(g[m].o1, g[m].base) < 1.06) bad.push(`${hex} ${m} spot vs base ${contrast(g[m].o1, g[m].base).toFixed(2)} - glass would have nothing to show`);
      if (hex !== '#6b7280' && C(g[m].o1) < 0.03) bad.push(`${hex} ${m} spot chroma ${C(g[m].o1).toFixed(3)}`);
    }
  }
  assert.deepEqual(bad, []);
});

test('audience motion speed equals a rung of the duration ladder (B = fast, C = base)', async () => {
  const { base, audiences } = await import('../src/tokens.mjs');
  assert.equal(audiences.b.motion, base['dur-fast']);
  assert.equal(audiences.c.motion, base['dur-base']);
});

test('accent colours for gradients: three distinct colours, large-type contrast (3:1) on white and on a near-black field, for any brand hue', () => {
  for (let h = 0; h < 360; h += 20) for (const c of [0.12, 0.2]) {
    const hex = oklchToHex(0.62, c, h), v = brandVars(hex), cols = ['a', 'b', 'c'].map((k) => v['--zh-accent-' + k]);
    assert.equal(new Set(cols).size, 3, `${hex}: three distinct accents ${cols}`);
    for (const col of cols) { assert.ok(contrast(col, '#ffffff') >= 3, `${hex} ${col} on white ${contrast(col, '#ffffff').toFixed(2)}`); assert.ok(contrast(col, '#0b0b12') >= 3, `${hex} ${col} on dark ${contrast(col, '#0b0b12').toFixed(2)}`); }
  }
});
