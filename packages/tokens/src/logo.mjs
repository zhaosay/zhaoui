import { rgbToOklch, oklchToHex, contrast } from './color.mjs';
import { generateBrand, DEFAULT_BRAND } from './brand.mjs';
import { brands } from './tokens.mjs';

export const DEFAULT_SEED = brands[DEFAULT_BRAND];
const BINS = 24;
const hueDist = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

/**
 * Finds a logo's brand colour from raw RGBA pixels.
 * Neutral (white / black / grey), near-transparent and extreme-lightness pixels are ignored, so a logo on a
 * white background still yields its real colour. Vivid, large areas win. Monochrome or empty logos fall back
 * to the default brand and say so.
 */
export function analyzeLogo(rgba, width, height) {
  const total = width * height;
  const stride = Math.max(1, Math.floor(total / 40000));
  const bins = Array.from({ length: BINS }, () => ({ w: 0, n: 0, L: 0, C: 0, x: 0, y: 0 }));
  let opaque = 0, chromatic = 0;

  for (let i = 0; i < total; i += stride) {
    const o = i * 4;
    if (rgba[o + 3] < 128) continue;
    opaque++;
    const [L, C, H] = rgbToOklch(rgba[o], rgba[o + 1], rgba[o + 2]);
    if (C < 0.04 || L > 0.95 || L < 0.12) continue;
    chromatic++;
    const b = bins[Math.floor(H / (360 / BINS)) % BINS];
    const w = Math.pow(C, 1.5);
    b.w += w; b.n++; b.L += L * w; b.C += C * w;
    b.x += Math.cos((H * Math.PI) / 180) * w; b.y += Math.sin((H * Math.PI) / 180) * w;
  }

  const warnings = [];
  const share = opaque ? chromatic / opaque : 0;
  const base = { neutralShare: opaque ? 1 - share : 1, colourShare: share, secondary: null };
  const fall = (why) => finish({ seed: DEFAULT_SEED, fallback: true, kind: why, ...base }, [`${why === 'empty' ? 'Logo 为空或全透明' : 'Logo 是黑白灰单色，无法提取品牌色'}，已使用默认色`]);

  function finish(r, w) {
    const brand = generateBrand(r.seed);
    const checks = [
      { label: '亮色下按钮文字对比度', value: contrast(brand.light.on, brand.light.primary), min: 4.5 },
      { label: '暗色下按钮文字对比度', value: contrast(brand.dark.on, brand.dark.primary), min: 4.5 },
    ];
    if (brand.strategy === 'ink') w.push('主色偏亮，按钮文字改用深色以保证可读');
    return { ...r, brand, checks: checks.map((c) => ({ ...c, pass: c.value >= c.min })), warnings: [...warnings, ...w] };
  }

  if (!opaque) return fall('empty');
  if (share < 0.03) return fall('monochrome');

  const merged = bins.map((_, i) => {
    let w = 0, n = 0, L = 0, C = 0, x = 0, y = 0;
    for (const d of [-1, 0, 1]) { const b = bins[(i + d + BINS) % BINS]; w += b.w; n += b.n; L += b.L; C += b.C; x += b.x; y += b.y; }
    return { i, w, n, L: w ? L / w : 0, C: w ? C / w : 0, H: ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360 };
  });
  const sorted = [...merged].sort((a, b) => b.w - a.w);
  const top = sorted[0];
  const seed = oklchToHex(Math.min(0.85, Math.max(0.35, top.L)), Math.max(0.06, top.C), top.H);
  const second = sorted.find((m) => m.w > top.w * 0.25 && hueDist(m.H, top.H) >= 40);
  const secondary = second ? oklchToHex(Math.min(0.85, Math.max(0.35, second.L)), Math.max(0.06, second.C), second.H) : null;
  const notes = [];
  if (top.C < 0.08) notes.push('Logo 颜色饱和度较低，界面会偏灰');
  return finish({ seed, fallback: false, kind: 'chromatic', ...base, secondary, hue: Math.round(top.H) }, notes);
}

/** Browser: File | Blob | HTMLImageElement | URL → Promise<report>. SVG, PNG, JPG, WebP all work. */
export async function analyzeLogoImage(source, size = 128) {
  let img = source;
  let revoke = null;
  if (typeof Blob !== 'undefined' && source instanceof Blob) { revoke = URL.createObjectURL(source); img = revoke; }
  if (typeof img === 'string') {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    await new Promise((res, rej) => { el.onload = res; el.onerror = () => rej(new Error('无法读取图片')); el.src = img; });
    img = el;
  }
  const nw = img.naturalWidth || img.width || size, nh = img.naturalHeight || img.height || size;
  const k = Math.min(1, size / Math.max(nw, nh));
  const w = Math.max(1, Math.round(nw * k)), h = Math.max(1, Math.round(nh * k));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  if (revoke) URL.revokeObjectURL(revoke);
  return analyzeLogo(ctx.getImageData(0, 0, w, h).data, w, h);
}
