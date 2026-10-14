import { hexToRgb, rgbToHex } from '../src/color.mjs';

/** Composite an rgba() fill over an opaque hex backdrop and return the resulting opaque hex. */
export function styleTint(rgba, backdropHex) {
  const m = rgba.match(/[\d.]+/g).map(Number), bg = hexToRgb(backdropHex), a = m[3];
  return rgbToHex(m[0] * a + bg[0] * (1 - a), m[1] * a + bg[1] * (1 - a), m[2] * a + bg[2] * (1 - a));
}
