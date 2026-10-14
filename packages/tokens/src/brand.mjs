import { hexToOklch, oklchToHex, contrast, alpha, blend } from './color.mjs';
import { modes } from './tokens.mjs';

export const DEFAULT_BRAND = 'indigo';
export const ALPHAS = { a08: 0.08, a14: 0.14, a20: 0.2, a22: 0.22, a35: 0.35 };

const INK = '#0b0d10';
const WHITE = '#ffffff';
const STEP_L = [0.975, 0.94, 0.895, 0.835, 0.755, 0.675, 0.6, 0.52, 0.43, 0.33];
const STEP_C = [0.1, 0.2, 0.4, 0.66, 0.88, 1, 1, 0.95, 0.85, 0.7];
const clampC = (c) => Math.min(0.22, Math.max(0.09, c));

/** 10-step ramp with equal perceptual lightness steps, so every hue feels equally light or dark. */
export function buildScale(hex) {
  const [, C, H] = hexToOklch(hex);
  const c = clampC(C);
  return STEP_L.map((L, i) => oklchToHex(L, c * STEP_C[i], H));
}

const pickOn = (bg) => (contrast(bg, WHITE) >= contrast(bg, INK) ? WHITE : INK);

function search(from, to, step, make, ok) {
  const dir = to > from ? 1 : -1;
  let last;
  for (let L = from; dir > 0 ? L <= to : L >= to; L += step * dir) {
    last = make(L);
    if (ok(last)) return last;
  }
  return last;
}

/**
 * Derives a brand theme from one seed colour.
 * Light seeds (yellow, lime, amber) get dark text on the brand fill; all others get white text on the
 * most saturated shade that still reaches 4.5:1 - vivid, but always readable.
 */
export function generateBrand(hex) {
  const lightBg = modes.light.bg, darkBg = modes.dark.bg;
  const [seedL, C, H] = hexToOklch(hex);
  const c = clampC(C);
  const scale = buildScale(hex);
  const inkMode = seedL > 0.72;
  const mk = (L, k = 1) => oklchToHex(L, c * k, H);

  let lp, lpL;
  if (inkMode) { lpL = Math.min(0.85, seedL); lp = mk(lpL); }
  else {
    lp = search(0.68, 0.4, 0.005, (L) => (lpL = L, mk(L)), (h) => contrast(h, WHITE) >= 4.5);
  }
  const lightSubtle = scale[0];
  const lightText = search(0.56, 0.3, 0.005, (L) => mk(L, 0.92), (h) => contrast(h, lightBg) >= 4.5 && contrast(h, lightSubtle) >= 4.5);
  const light = {
    primary: lp, hover: mk(lpL - 0.04), active: mk(lpL - 0.08),
    subtle: lightSubtle, text: lightText, on: pickOn(lp),
  };

  let dpL = lpL;
  if (!inkMode) {
    for (let L = lpL; L <= lpL + 0.06; L += 0.005) if (contrast(mk(L), WHITE) >= 4.55) dpL = L;
  }
  const dp = mk(dpL);
  const darkSubtleHex = blend(dp, 0.16, darkBg);
  const darkText = search(0.76, 0.95, 0.005, (L) => mk(L, 0.7), (h) => contrast(h, darkSubtleHex) >= 4.5);
  const dark = {
    primary: dp, hover: mk(dpL - 0.035), active: mk(dpL - 0.07),
    subtle: alpha(dp, 0.16), text: darkText, on: pickOn(dp),
  };

  return { seed: hex, strategy: inkMode ? 'ink' : 'white', scale, light, dark, darkSubtleHex, glass: glassColours(H, c) };
}

/**
 * Glass backdrop colours. Glass only reads as glass when something colourful sits behind it, so every brand
 * gets three blurred light spots (its own hue plus two neighbours) on a pale (light) or deep (dark) base.
 * Spots stay low-lightness in dark and pastel in light so text on a translucent surface keeps its contrast.
 */
export function glassColours(H, c) {
  const k = Math.min(0.13, Math.max(0.05, c * 0.55));
  // Luminous hues (teal, yellow, lime) carry more light at the same OKLCH lightness, so each dark spot is lowered
  // until the quietest text token still reaches 4.7:1 on the strongest glass fill placed over it.
  const strong = Number(modes.dark['glass-fill-strong'].match(/[\d.]+/g)[3]);
  const fit = (L0, mul) => {
    let hex = oklchToHex(L0, k * mul, H);
    for (let L = L0; L > 0.12; L -= 0.005) {
      hex = oklchToHex(L, k * mul, H);
      if (contrast(modes.dark['text-tertiary'], blend('#ffffff', strong, hex)) >= 4.7) break;
    }
    return hex;
  };
  return {
    light: { base: oklchToHex(0.965, 0.012, H), o1: oklchToHex(0.87, k, H), o2: oklchToHex(0.9, k * 0.9, H + 55), o3: oklchToHex(0.91, k * 0.8, H - 55) },
    dark: { base: oklchToHex(0.16, 0.02, H), o1: fit(0.235, 1.1), o2: fit(0.21, 1), o3: fit(0.195, 0.9) },
  };
}

/** CSS custom properties (name → value) for one brand. Shared by the build and the runtime helper. */
export function brandVars(hex) {
  const b = generateBrand(hex);
  const v = {};
  b.scale.forEach((col, i) => { v[`--zh-brand-${i + 1}`] = col; });
  // Accent colours for gradients: the vivid step of the scale and its two neighbours on the colour wheel (same lightness and chroma, hue +/- 46 degrees).
  // They are decoration for large type, numerals and light spots, never for small text.  A brand that wants fixed accent colours overrides --zh-accent-a/b/c in CSS.
  const [aL, aC, aH] = hexToOklch(b.scale[5]);
  // Large type needs 3:1 on white: lower the lightness of a step until it gets there (a light green or yellow would not on its own).
  const accent = (h) => { for (let L = aL; L > 0.3; L -= 0.01) { const x = oklchToHex(L, aC, h); if (contrast(x, '#ffffff') >= 3.05) return x; } return oklchToHex(0.3, aC, h); };
  v['--zh-accent-a'] = accent(aH); v['--zh-accent-b'] = accent(aH + 46); v['--zh-accent-c'] = accent(aH - 46);
  for (const [k, m] of [['l', b.light], ['d', b.dark]]) {
    for (const key of ['primary', 'hover', 'active', 'subtle', 'text', 'on']) v[`--zh-brand-${k}-${key}`] = m[key];
    for (const [name, a] of Object.entries(ALPHAS)) v[`--zh-brand-${k}-${name}`] = alpha(m.primary, a);
  }
  for (const [k, m] of [['l', b.glass.light], ['d', b.glass.dark]]) {
    for (const key of ['base', 'o1', 'o2', 'o3']) v[`--zh-brand-${k}-glass-${key}`] = m[key];
  }
  return v;
}

export function brandCss(name, hex) {
  const lines = Object.entries(brandVars(hex)).map(([k, val]) => `  ${k}: ${val};`);
  const sel = name === DEFAULT_BRAND ? `:root,\n[data-brand="${name}"]` : `[data-brand="${name}"]`;
  return `${sel} {\n${lines.join('\n')}\n}\n`;
}

/** Runtime: apply an arbitrary brand colour to an element (e.g. a tenant colour picked in an admin UI). */
export function applyBrand(el, hex) {
  for (const [k, val] of Object.entries(brandVars(hex))) el.style.setProperty(k, val);
}
