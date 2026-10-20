// Exports the tokens in the W3C design-token format that Tokens Studio (Figma plugin) imports directly, and that
// Figma's own variable import tools accept. One set per concern: core (mode-free), light, dark, plus B / C presets.
import { base, modes, audiences, densities, layout } from '../src/tokens.mjs';
import { statusTints, brandMapping } from '../src/css.mjs';
import { generateBrand } from '../src/brand.mjs';
import { brands } from '../src/tokens.mjs';

const px = (v) => ({ $type: 'dimension', $value: v });
const col = (v) => ({ $type: 'color', $value: v });
const num = (v) => ({ $type: 'number', $value: Number(v) });
const ms = (v) => ({ $type: 'duration', $value: v });
const bez = (v) => ({ $type: 'cubicBezier', $value: v.match(/-?\d*\.?\d+/g).map(Number) });

function resolve(o) {
  const out = {};
  const get = (k, seen = []) => { const v = o[k]; return typeof v === 'string' && v.startsWith('@') && !seen.includes(k) ? get(v.slice(1), [...seen, k]) : v; };
  for (const k of Object.keys(o)) out[k] = get(k);
  return out;
}

export function figmaTokens() {
  const brand = generateBrand(brands.indigo);
  const core = { space: {}, size: { icon: {} }, motion: { duration: {}, easing: {} }, zIndex: {}, brand: {}, layout: { tier: {} } };
  for (const [k, v] of Object.entries(base)) {
    if (k.startsWith('space-')) core.space[k.slice(6)] = px(v);
    else if (k.startsWith('icon-')) core.size.icon[k.slice(5)] = px(v);
    else if (k.startsWith('dur-')) core.motion.duration[k.slice(4)] = ms(v);
    else if (k.startsWith('ease-') && /cubic-bezier/.test(v)) core.motion.easing[k.slice(5)] = bez(v);
    else if (k.startsWith('z-')) core.zIndex[k.slice(2)] = num(v);
  }
  brand.scale.forEach((c, i) => { core.brand[String(i + 1)] = col(c); });
  for (const t of layout.tiers) core.layout.tier[t.name] = { columns: num(t.cols), gutter: px(t.gutter), margin: px(t.pad) };

  const modeSet = (m) => {
    const o = { ...resolve(modes[m]), ...statusTints(m) };
    const b = brand[m];
    const set = { color: { text: {}, surface: {}, border: {}, status: {}, brand: {}, chart: {}, glass: {}, accent: {} } };
    for (const [k, v] of Object.entries(o)) {
      if (k.startsWith('accent-')) set.color.accent[k] = col(v);
      else if (k.startsWith('chart-')) set.color.chart[k.slice(6)] = col(v);
      else if (k.startsWith('glass-')) set.color.glass[k.slice(6)] = col(v);
      else if (/^(text|num-|trend-)/.test(k)) set.color.text[k] = col(v);
      else if (/^bg|^code-bg|^overlay|^mark-bg/.test(k)) set.color.surface[k] = col(v);
      else if (/^border/.test(k)) set.color.border[k] = col(v);
      else set.color.status[k] = col(v);
    }
    for (const [k, v] of Object.entries(b)) set.color.brand[k] = col(v);
    return set;
  };
  const audience = (a) => {
    const o = audiences[a], set = { radius: {}, typography: {}, control: {}, motion: {} };
    for (const k of ['radius-sm', 'radius-md', 'radius-lg']) set.radius[k.slice(7)] = px(o[k]);
    set.typography.fontSize = px(o['font-base']); set.typography.lineHeight = num(o.line); set.typography.headingWeight = num(o['heading-weight']);
    set.control.height = px(o['control-h-base']); set.motion.default = ms(o.motion);
    return set;
  };
  const density = Object.fromEntries(Object.entries(densities).map(([k, v]) => [k, { adjust: px(v.density), padding: num(v.pad) }]));
  return { core, light: modeSet('light'), dark: modeSet('dark'), 'audience-b': audience('b'), 'audience-c': audience('c'), density, $metadata: { tokenSetOrder: ['core', 'light', 'dark', 'audience-b', 'audience-c', 'density'] } };
}
