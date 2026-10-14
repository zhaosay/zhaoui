// Single source of truth. "@name" is an alias to another token in the same scope.
// Brand-derived colours (primary, brand scale, sequential ramp) are generated in brand.mjs.

import { oklchToHex as o, alpha } from './color.mjs';

const NH = 265; // neutrals carry a whisper of cool blue so they sit well with any brand

export const brands = {
  indigo: o(0.57, 0.2, 273),
  teal: o(0.62, 0.12, 190),
  coral: o(0.66, 0.17, 40),
  violet: o(0.55, 0.22, 300),
  rose: o(0.6, 0.2, 5),
};

export const base = {
  'font-sans': '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Segoe UI", system-ui, sans-serif',
  'font-mono': 'ui-monospace, "SF Mono", Menlo, "Cascadia Mono", Consolas, "Microsoft YaHei", monospace',   // the YaHei entry is for Chinese text in code on Windows: without it the generic monospace falls back to SimSun
  'space-1': '4px', 'space-2': '8px', 'space-3': '12px', 'space-4': '16px', 'space-5': '20px',
  'space-6': '24px', 'space-8': '32px', 'space-10': '40px', 'space-12': '48px',
  ease: 'cubic-bezier(.2, .7, .2, 1)',
  // Motion: exits are faster than enters; only transform and opacity are animated.
  'dur-instant': '80ms', 'dur-fast': '120ms', 'dur-base': '200ms', 'dur-slow': '320ms', 'dur-slower': '480ms', stagger: '30ms',
  'ease-standard': 'cubic-bezier(.2, .7, .2, 1)', 'ease-enter': 'cubic-bezier(0, 0, .2, 1)',
  'ease-exit': 'cubic-bezier(.4, 0, 1, 1)', 'ease-spring': 'cubic-bezier(.34, 1.56, .64, 1)',
  'opacity-disabled': '.45',
  'focus-ring': '0 0 0 2px var(--zh-bg), 0 0 0 4px var(--zh-color-primary)',
  // Landing-page tokens: display type, the generous space between sections, a glow in the brand colour, soft and brand gradients, and the content width of a page.
  'font-display': 'clamp(2.2rem, 5.2vw, 3.6rem)', 'font-title': 'clamp(1.7rem, 3.4vw, 2.4rem)',
  'section-gap': 'clamp(64px, 9vw, 96px)', 'page-max': '112rem',
  'shadow-glow': '0 8px 28px var(--zh-primary-a35)',
  'gradient-soft': 'linear-gradient(135deg, var(--zh-color-primary-subtle) 0%, var(--zh-bg) 55%, var(--zh-bg-subtle) 100%)',   // primary-subtle follows light and dark; the fixed brand-1 step would be a white blob in dark mode
  'gradient-brand': 'linear-gradient(135deg, var(--zh-color-primary) 0%, var(--zh-color-primary-active) 100%)',
  'gradient-accent': 'linear-gradient(120deg, var(--zh-accent-a) 0%, var(--zh-accent-b) 55%, var(--zh-accent-c) 110%)',   // for large type, numerals and decoration; see brand.mjs
  'z-base': '0', 'z-sticky': '100', 'z-dropdown': '1000', 'z-drawer': '1100',
  'z-modal': '1200', 'z-popover': '1300', 'z-toast': '1400', 'z-tooltip': '1500',
  'icon-xs': '16px', 'icon-sm': '20px', 'icon-md': '24px', 'icon-lg': '32px',
  scale: '1',
  'glass-blur': '18px', 'glass-saturate': '165%',
};

const chartLight = {
  'chart-1': '#2a78d6', 'chart-2': '#eb6834', 'chart-3': '#1baf7a', 'chart-4': '#eda100',
  'chart-5': '#e87ba4', 'chart-6': '#008300', 'chart-7': '#4a3aa7', 'chart-8': '#e34948',
  'chart-grid': '#e1e0d9', 'chart-axis': '#c3c2b7', 'chart-muted': '#898781', 'chart-muted-fill': '#cdd2db',
};
const chartDark = {
  'chart-1': '#3987e5', 'chart-2': '#d95926', 'chart-3': '#199e70', 'chart-4': '#c98500',
  'chart-5': '#d55181', 'chart-6': '#008300', 'chart-7': '#9085e9', 'chart-8': '#e66767',
  'chart-grid': '#2c2c2a', 'chart-axis': '#383835', 'chart-muted': '#898781', 'chart-muted-fill': '#3a414d',
};

const textAliases = {
  'text-success': '@green-text', 'text-warning': '@amber-text', 'text-danger': '@red-text', 'text-info': '@cyan-text',
  'num-good': '@text-success', 'num-warn': '@text-warning', 'num-bad': '@text-danger',
  'trend-flat': '@text-tertiary',
};

const darkBg = o(0.155, 0.012, NH);

export const modes = {
  light: {
    bg: '#ffffff', 'bg-subtle': o(0.978, 0.004, NH), 'bg-elevated': '#ffffff', 'bg-glass': 'rgba(255, 255, 255, 0.78)',
    border: o(0.925, 0.006, NH), 'border-strong': o(0.855, 0.009, NH),
    text: o(0.205, 0.02, NH), 'text-secondary': o(0.47, 0.02, NH), 'text-tertiary': o(0.515, 0.018, NH),   // 6.7:1 and 5.3:1 on white: quiet enough to read as a second and third level, still above AA
    'text-disabled': o(0.75, 0.01, NH), 'text-inverse': '#ffffff',
    success: o(0.66, 0.17, 152), warning: o(0.79, 0.16, 80), danger: o(0.62, 0.21, 25), info: o(0.68, 0.14, 235),
    'green-text': o(0.5, 0.13, 162), 'amber-text': o(0.53, 0.12, 68), 'red-text': o(0.52, 0.19, 24), 'cyan-text': o(0.51, 0.1, 235),
    overlay: 'rgba(16, 20, 32, 0.5)',
    'mark-bg': '#fff0a3', 'code-bg': o(0.965, 0.005, NH),
    'glass-fill': 'rgba(255, 255, 255, 0.62)', 'glass-fill-strong': 'rgba(255, 255, 255, 0.82)', 'glass-well': 'rgba(255, 255, 255, 0.42)',
    'glass-border': 'rgba(255, 255, 255, 0.78)', 'glass-edge': 'rgba(24, 32, 64, 0.16)', 'glass-hi': 'rgba(255, 255, 255, 0.92)', 'glass-solid': '#f6f8fc',
    ...textAliases, ...chartLight,
  },
  dark: {
    bg: darkBg, 'bg-subtle': o(0.185, 0.013, NH), 'bg-elevated': o(0.215, 0.014, NH), 'bg-glass': alpha(darkBg, 0.72),
    border: o(0.29, 0.014, NH), 'border-strong': o(0.37, 0.015, NH),
    text: o(0.965, 0.006, NH), 'text-secondary': o(0.78, 0.012, NH), 'text-tertiary': o(0.66, 0.014, NH),
    'text-disabled': o(0.45, 0.012, NH), 'text-inverse': darkBg,
    success: o(0.78, 0.17, 152), warning: o(0.83, 0.15, 82), danger: o(0.72, 0.18, 22), info: o(0.78, 0.12, 235),
    'green-text': o(0.82, 0.16, 152), 'amber-text': o(0.85, 0.14, 82), 'red-text': o(0.78, 0.16, 22), 'cyan-text': o(0.82, 0.11, 235),
    overlay: 'rgba(0, 0, 0, 0.62)',
    'mark-bg': 'rgba(250, 204, 21, 0.3)', 'code-bg': o(0.235, 0.014, NH),
    'glass-fill': 'rgba(255, 255, 255, 0.04)', 'glass-fill-strong': 'rgba(255, 255, 255, 0.062)', 'glass-well': 'rgba(0, 0, 0, 0.26)',
    'glass-border': 'rgba(255, 255, 255, 0.16)', 'glass-edge': 'rgba(255, 255, 255, 0.24)', 'glass-hi': 'rgba(255, 255, 255, 0.2)', 'glass-solid': '#1b1f29',
    ...textAliases, ...chartDark,
  },
};

export const audiences = {
  b: {
    'radius-sm': '4px', 'radius-md': '6px', 'radius-lg': '10px',
    'font-base': '14px', line: '1.57', 'control-h-base': '32px',
    motion: '120ms', 'section-gap': '32px', 'heading-weight': '600', 'icon-stroke': '1.75',
    'shadow-sm': '0 1px 2px rgba(16, 24, 40, 0.05)',
    'shadow-md': '0 4px 12px -2px rgba(16, 24, 40, 0.08), 0 2px 4px -2px rgba(16, 24, 40, 0.04)',
    'shadow-lg': '0 16px 40px -8px rgba(16, 24, 40, 0.16), 0 4px 8px -4px rgba(16, 24, 40, 0.06)',
  },
  c: {
    'radius-sm': '10px', 'radius-md': '14px', 'radius-lg': '24px',
    'font-base': '16px', line: '1.7', 'control-h-base': '44px',
    motion: '200ms', 'section-gap': '56px', 'heading-weight': '700', 'icon-stroke': '2',
    'shadow-sm': '0 1px 2px var(--zh-primary-a08), 0 2px 8px -2px var(--zh-primary-a08)',
    'shadow-md': '0 8px 24px -6px var(--zh-primary-a14), 0 2px 6px -2px var(--zh-primary-a08)',
    'shadow-lg': '0 24px 56px -12px var(--zh-primary-a20), 0 6px 14px -6px var(--zh-primary-a14)',
  },
};

export const densities = {
  compact: { density: '-4px', pad: '0.8' },
  standard: { density: '0px', pad: '1' },
  comfortable: { density: '4px', pad: '1.2' },
};

// Direction colours follow regional convention; good/bad colours are fixed semantics (num-*).
export const trends = {
  cn: { 'trend-up': '@red-text', 'trend-down': '@green-text' },
  intl: { 'trend-up': '@green-text', 'trend-down': '@red-text' },
};

export const layout = {
  tiers: [
    { name: 'phone', max: 767, cols: 4, gutter: '12px', pad: '16px' },
    { name: 'tablet', min: 768, max: 1199, cols: 8, gutter: '16px', pad: '24px' },
    { name: 'desktop', min: 1200, max: 1919, cols: 12, gutter: '24px', pad: '32px' },
    { name: 'large', min: 1920, cols: 12, gutter: '24px', pad: '40px', containerMax: '1600px' },
  ],
  wall: { scale: 1.4, gutter: '32px', pad: '48px', touchMin: '56px' },
  touchMin: '44px',
  electronMinWindow: { width: 1024, height: 640 },
};

// Style packs re-map the semantic tokens, so every component (including new ones) follows without edits.
// Glassmorphism: translucent surfaces + background blur over a colourful backdrop, a bright 1px edge and a soft
// brand-tinted shadow. Depth comes from blur and layering, never from paired light/dark shadows.
export const styles = {
  flat: {},
  glass: {
    bg: '@glass-base', 'bg-subtle': '@glass-well', 'bg-elevated': '@glass-fill', 'bg-glass': '@glass-fill',
    border: '@glass-border', 'border-strong': '@glass-edge',
    'shadow-sm': '0 2px 8px -2px var(--zh-glass-shadow), inset 0 1px 0 var(--zh-glass-hi)',
    'shadow-md': '0 8px 24px -6px var(--zh-glass-shadow), inset 0 1px 0 var(--zh-glass-hi)',
    'shadow-lg': '0 20px 48px -12px var(--zh-glass-shadow), inset 0 1px 0 var(--zh-glass-hi)',
    'radius-sm': '10px', 'radius-md': '14px', 'radius-lg': '22px',
  },
};
