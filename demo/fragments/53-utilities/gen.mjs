// Generates style.css for the utility system.  node gen.mjs
// Every utility is a single-class selector; responsive ones are gated with :where() so specificity stays (0,1,0)
// and the demo's "屏幕" switch (html[data-screen]) can simulate the tiers.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = [];
const cat = (k) => out.push(`.zh-util-cat--${k} { --zh-util-cat: 1; }`);
const r = (sel, decl) => out.push(`${sel} { ${decl} }`);

const SP = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12];
const sp = (n) => (n === 0 ? '0' : `var(--zh-space-${n})`);

const TIERS = {
  phone: { media: '(max-width: 767px)', sims: ['phone'] },
  tablet: { media: '(min-width: 768px) and (max-width: 1199px)', sims: ['tablet'] },
  desktop: { media: '(min-width: 1200px) and (max-width: 1919px)', sims: ['desktop'] },
  large: { media: '(min-width: 1920px)', sims: ['large', 'wall'] },
  'tablet-down': { media: '(max-width: 1199px)', sims: ['phone', 'tablet'] },
  'desktop-up': { media: '(min-width: 1200px)', sims: ['desktop', 'large', 'wall'] },
};
const REAL = ':where(html:not([data-screen]), html[data-screen="auto"])';
const SIM = (t) => `:where(${TIERS[t].sims.map((s) => `html[data-screen="${s}"]`).join(', ')})`;
const tier = (t, sel, decl) => {
  out.push(`@media ${TIERS[t].media} {\n  ${REAL} ${sel} { ${decl} }\n}`);
  out.push(`${SIM(t)} ${sel} { ${decl} }`);
};
const SUFFIX = { phone: 'phone', tablet: 'tablet-down', desktop: 'desktop-up', large: 'large' };

/* ---------------- demo styles for the documentation section (kept before the utilities) ---------------- */
out.push(`/* 53-utilities: documentation styles */
#utilities h3 { flex-wrap: wrap; row-gap: 2px; }
.zh-ut-toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 14px; }
.zh-ut-search { position: relative; flex: 1 1 260px; max-width: 420px; }
.zh-ut-search .zh-input { padding-left: 34px; }
.zh-ut-search .ico { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--zh-text-tertiary); pointer-events: none; }
.zh-ut-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.zh-ut-chip { font: inherit; font-size: .86em; padding: 3px 10px; border-radius: 999px; border: 1px solid var(--zh-border); background: var(--zh-bg); color: var(--zh-text-secondary); cursor: pointer; transition: background var(--zh-dur-fast) var(--zh-ease-standard), color var(--zh-dur-fast) var(--zh-ease-standard), border-color var(--zh-dur-fast) var(--zh-ease-standard); }
.zh-ut-chip:hover { border-color: var(--zh-color-primary); color: var(--zh-color-primary-text); }
.zh-ut-chip[aria-pressed="true"] { background: var(--zh-color-primary-subtle); border-color: transparent; color: var(--zh-color-primary-text); font-weight: 600; }
.zh-ut-chip b { font-weight: 500; opacity: .7; margin-left: 4px; font-variant-numeric: tabular-nums; }
.zh-ut-group { margin-top: 18px; }
.zh-ut-group > h4 { margin: 0 0 8px; font-size: .93em; color: var(--zh-text-secondary); display: flex; align-items: baseline; gap: 8px; }
.zh-ut-group > h4 small { font: 500 .82em var(--zh-font-mono); color: var(--zh-text-tertiary); }
.zh-ut-pills { display: flex; flex-wrap: wrap; gap: 6px; }
.zh-ut-pill { font: .82em var(--zh-font-mono); padding: 3px 8px; border-radius: var(--zh-radius-md); border: 1px solid var(--zh-border); background: var(--zh-bg-subtle); color: var(--zh-text); cursor: pointer; transition: border-color var(--zh-dur-fast) var(--zh-ease-standard), background var(--zh-dur-fast) var(--zh-ease-standard); }
.zh-ut-pill:hover, .zh-ut-pill:focus-visible { border-color: var(--zh-color-primary); background: var(--zh-color-primary-subtle); }
.zh-ut-pill[hidden] { display: none; }
.zh-ut-more { font: inherit; font-size: .86em; background: none; border: 0; color: var(--zh-color-primary-text); cursor: pointer; padding: 3px 6px; }
.zh-ut-empty { padding: 28px; text-align: center; color: var(--zh-text-tertiary); border: 1px dashed var(--zh-border-strong); border-radius: var(--zh-radius-lg); }
.zh-ut-play { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
.zh-ut-play textarea { font: .88em/1.6 var(--zh-font-mono); min-height: 74px; }
.zh-ut-stage { border: 1px dashed var(--zh-border-strong); border-radius: var(--zh-radius-lg); padding: 16px; background-image: linear-gradient(var(--zh-bg-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--zh-bg-subtle) 1px, transparent 1px); background-size: 16px 16px; }
.zh-ut-sample > i, .zh-ut-item { display: block; min-width: 40px; min-height: 32px; padding: 6px 10px; border-radius: var(--zh-radius-md); background: var(--zh-color-primary-subtle); color: var(--zh-color-primary-text); border: 1px solid var(--zh-brand-l-primary, currentColor); font-size: .86em; font-style: normal; text-align: center; }
.zh-ut-bad { color: var(--zh-text-danger); font-size: .86em; margin: 0; }
.zh-ut-preset { font: inherit; font-size: .82em; padding: 2px 10px; border-radius: 999px; border: 1px solid var(--zh-border); background: var(--zh-bg-subtle); color: var(--zh-text-secondary); cursor: pointer; }
.zh-ut-preset:hover { border-color: var(--zh-color-primary); color: var(--zh-color-primary-text); }
.zh-ut-scale { display: grid; grid-template-columns: 74px 46px minmax(0, 1fr); gap: 6px 12px; align-items: center; font: .82em var(--zh-font-mono); color: var(--zh-text-secondary); }
.zh-ut-scale i { display: block; height: 10px; border-radius: 2px; background: var(--zh-color-primary); max-width: 100%; }
.zh-ut-matrix { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.zh-ut-matrix > div { border: 1px dashed var(--zh-border-strong); border-radius: var(--zh-radius-md); height: 84px; display: flex; gap: 4px; padding: 4px 4px 20px; position: relative; }
.zh-ut-matrix > div > i { width: 14px; height: 14px; border-radius: 3px; background: var(--zh-color-primary); display: block; }
.zh-ut-matrix > div > i + i { height: 22px; opacity: .6; }
.zh-ut-matrix > div > span { position: absolute; left: 0; right: 0; bottom: 3px; text-align: center; font: 10px var(--zh-font-mono); color: var(--zh-text-tertiary); }
.zh-ut-tier { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 999px; font-size: .86em; font-weight: 600; background: var(--zh-color-primary-subtle); color: var(--zh-color-primary-text); }
.zh-ut-swatches { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
.zh-ut-sw { padding: 10px 12px; border-radius: var(--zh-radius-md); font: .82em var(--zh-font-mono); border: 1px solid var(--zh-border); background: var(--zh-bg); }
.zh-ut-snap { display: flex; gap: 10px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 6px; }
.zh-ut-snap > div { flex: 0 0 72%; height: 90px; border-radius: var(--zh-radius-lg); scroll-snap-align: start; display: grid; place-items: center; color: var(--zh-on-primary); font-weight: 600; }
@container stage (max-width: 767px) { .zh-ut-scale { grid-template-columns: 64px 40px minmax(0, 1fr); } }
`);
out.push('.zh-util-start { --zh-util: 1; }');

/* ---------------- display ---------------- */
cat('display');
for (const [n, v] of Object.entries({ block: 'block', inline: 'inline', 'inline-block': 'inline-block', flex: 'flex', 'inline-flex': 'inline-flex', 'd-grid': 'grid', 'inline-grid': 'inline-grid', contents: 'contents', hidden: 'none' })) r(`.zh-${n}`, `display: ${v};`);

/* ---------------- flex ---------------- */
cat('flex');
for (const [n, v] of Object.entries({ 'flex-row': 'row', 'flex-col': 'column', 'flex-row-reverse': 'row-reverse', 'flex-col-reverse': 'column-reverse' })) r(`.zh-${n}`, `flex-direction: ${v};`);
for (const [n, v] of Object.entries({ 'flex-wrap': 'wrap', 'flex-nowrap': 'nowrap', 'flex-wrap-reverse': 'wrap-reverse' })) r(`.zh-${n}`, `flex-wrap: ${v};`);
const AL = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch', baseline: 'baseline' };
for (const [n, v] of Object.entries(AL)) { r(`.zh-items-${n}`, `align-items: ${v};`); r(`.zh-self-${n}`, `align-self: ${v};`); }
for (const [n, v] of Object.entries({ start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between', around: 'space-around', evenly: 'space-evenly' })) { r(`.zh-justify-${n}`, `justify-content: ${v};`); r(`.zh-content-${n}`, `align-content: ${v};`); }
for (const [n, v] of Object.entries({ '1': '1 1 0%', auto: '1 1 auto', initial: '0 1 auto', none: 'none' })) r(`.zh-flex-${n}`, `flex: ${v};`);
r('.zh-grow', 'flex-grow: 1;'); r('.zh-grow-0', 'flex-grow: 0;'); r('.zh-shrink', 'flex-shrink: 1;'); r('.zh-shrink-0', 'flex-shrink: 0;');
r('.zh-order-first', 'order: -1;'); r('.zh-order-last', 'order: 999;'); r('.zh-order-none', 'order: 0;');
r('.zh-center', 'display: flex; align-items: center; justify-content: center;');
for (const n of SP) { r(`.zh-gap-${n}`, `gap: ${sp(n)};`); r(`.zh-gap-x-${n}`, `column-gap: ${sp(n)};`); r(`.zh-gap-y-${n}`, `row-gap: ${sp(n)};`); }
for (const n of SP.filter((x) => x)) { r(`.zh-space-x-${n} > * + *`, `margin-left: ${sp(n)};`); r(`.zh-space-y-${n} > * + *`, `margin-top: ${sp(n)};`); }

/* ---------------- grid ---------------- */
cat('grid');
for (let n = 1; n <= 12; n++) r(`.zh-cols-${n}`, `grid-template-columns: repeat(${n}, minmax(0, 1fr));`);
for (let n = 1; n <= 12; n++) r(`.zh-col-span-${n}`, `grid-column: span ${n} / span ${n};`);
r('.zh-col-span-full', 'grid-column: 1 / -1;');
for (let n = 1; n <= 6; n++) { r(`.zh-rows-${n}`, `grid-template-rows: repeat(${n}, minmax(0, 1fr));`); r(`.zh-row-span-${n}`, `grid-row: span ${n} / span ${n};`); }
r('.zh-grid-flow-row', 'grid-auto-flow: row;'); r('.zh-grid-flow-col', 'grid-auto-flow: column;'); r('.zh-grid-flow-dense', 'grid-auto-flow: row dense;');
r('.zh-place-items-center', 'place-items: center;'); r('.zh-place-content-center', 'place-content: center;'); r('.zh-place-self-center', 'place-self: center;');

/* ---------------- spacing ---------------- */
cat('spacing');
const M = { m: ['margin'], mx: ['margin-left', 'margin-right'], my: ['margin-top', 'margin-bottom'], mt: ['margin-top'], mr: ['margin-right'], mb: ['margin-bottom'], ml: ['margin-left'] };
const P = { p: ['padding'], px: ['padding-left', 'padding-right'], py: ['padding-top', 'padding-bottom'], pt: ['padding-top'], pr: ['padding-right'], pb: ['padding-bottom'], pl: ['padding-left'] };
for (const [k, props] of Object.entries(M)) { for (const n of SP) r(`.zh-${k}-${n}`, props.map((p) => `${p}: ${sp(n)};`).join(' ')); r(`.zh-${k}-auto`, props.map((p) => `${p}: auto;`).join(' ')); }
for (const [k, props] of Object.entries(P)) for (const n of SP) r(`.zh-${k}-${n}`, props.map((p) => `${p}: ${sp(n)};`).join(' '));

/* ---------------- sizing ---------------- */
cat('sizing');
for (const n of SP) { r(`.zh-w-${n}`, `width: ${sp(n)};`); r(`.zh-h-${n}`, `height: ${sp(n)};`); r(`.zh-size-${n}`, `width: ${sp(n)}; height: ${sp(n)};`); }
for (const [n, v] of Object.entries({ full: '100%', auto: 'auto', screen: '100vw', fit: 'fit-content', min: 'min-content', max: 'max-content', '1-2': '50%', '1-3': '33.3333%', '2-3': '66.6667%', '1-4': '25%', '3-4': '75%' })) r(`.zh-w-${n}`, `width: ${v};`);
r('.zh-h-full', 'height: 100%;'); r('.zh-h-auto', 'height: auto;'); r('.zh-h-fit', 'height: fit-content;'); r('.zh-h-screen', 'height: 100vh; height: 100dvh;');
r('.zh-h-control', 'height: var(--zh-control-h);'); r('.zh-min-h-control', 'min-height: var(--zh-control-h);'); r('.zh-size-control', 'width: var(--zh-control-h); height: var(--zh-control-h);');
for (const s of ['xs', 'sm', 'md', 'lg']) r(`.zh-size-icon-${s}`, `width: var(--zh-icon-${s}); height: var(--zh-icon-${s});`);
r('.zh-min-w-0', 'min-width: 0;'); r('.zh-min-w-full', 'min-width: 100%;'); r('.zh-min-h-0', 'min-height: 0;'); r('.zh-min-h-full', 'min-height: 100%;'); r('.zh-min-h-screen', 'min-height: 100vh; min-height: 100dvh;');
r('.zh-max-w-full', 'max-width: 100%;'); r('.zh-max-w-none', 'max-width: none;'); r('.zh-max-w-prose', 'max-width: 65ch;');
for (const [n, v] of Object.entries({ xs: 320, sm: 480, md: 640, lg: 800, xl: 1024, '2xl': 1200 })) r(`.zh-max-w-${n}`, `max-width: ${v}px;`);
r('.zh-max-h-full', 'max-height: 100%;'); r('.zh-max-h-screen', 'max-height: 100vh; max-height: 100dvh;');
for (const [n, v] of Object.entries({ square: '1 / 1', video: '16 / 9', '4-3': '4 / 3', '3-2': '3 / 2', '21-9': '21 / 9', auto: 'auto' })) r(`.zh-aspect-${n}`, `aspect-ratio: ${v};`);
for (const n of ['cover', 'contain', 'fill', 'none', 'scale-down']) r(`.zh-object-${n}`, `object-fit: ${n};`);

/* ---------------- text ---------------- */
cat('text');
for (const [n, v] of Object.entries({ xs: '.86em', sm: '.93em', base: '1em', lg: '1.14em', xl: '1.43em', '2xl': '1.71em', '3xl': '2.29em' })) r(`.zh-text-${n}`, `font-size: ${v};`);
for (const [n, v] of Object.entries({ normal: 400, medium: 500, semibold: 600, bold: 700 })) r(`.zh-font-${n}`, `font-weight: ${v};`);
r('.zh-font-sans', 'font-family: var(--zh-font-sans);'); r('.zh-font-mono', 'font-family: var(--zh-font-mono);');
for (const n of ['left', 'center', 'right', 'justify']) r(`.zh-text-${n}`, `text-align: ${n};`);
r('.zh-uppercase', 'text-transform: uppercase;'); r('.zh-lowercase', 'text-transform: lowercase;'); r('.zh-capitalize', 'text-transform: capitalize;'); r('.zh-normal-case', 'text-transform: none;');
for (const [n, v] of Object.entries({ tight: '-.02em', normal: '0', wide: '.02em', wider: '.06em', widest: '.12em' })) r(`.zh-tracking-${n}`, `letter-spacing: ${v};`);
for (const [n, v] of Object.entries({ none: '1', tight: '1.25', snug: '1.4', normal: 'var(--zh-line)', relaxed: '1.75', loose: '2' })) r(`.zh-leading-${n}`, `line-height: ${v};`);
r('.zh-truncate', 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap;');
for (let n = 1; n <= 4; n++) r(`.zh-line-clamp-${n}`, `display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: ${n}; line-clamp: ${n}; overflow: hidden;`);
r('.zh-text-wrap', 'white-space: normal; text-wrap: wrap;'); r('.zh-text-nowrap', 'white-space: nowrap;'); r('.zh-text-balance', 'text-wrap: balance;'); r('.zh-text-pretty', 'text-wrap: pretty;');
r('.zh-break-words', 'overflow-wrap: anywhere;'); r('.zh-break-normal', 'overflow-wrap: normal; word-break: normal;'); r('.zh-whitespace-pre-wrap', 'white-space: pre-wrap;'); r('.zh-whitespace-pre', 'white-space: pre;');
r('.zh-tabular-nums', 'font-variant-numeric: tabular-nums;'); r('.zh-proportional-nums', 'font-variant-numeric: proportional-nums;'); r('.zh-slashed-zero', 'font-variant-numeric: slashed-zero;');
r('.zh-underline', 'text-decoration: underline; text-underline-offset: 3px;'); r('.zh-line-through', 'text-decoration: line-through;'); r('.zh-no-underline', 'text-decoration: none;');
r('.zh-italic', 'font-style: italic;'); r('.zh-not-italic', 'font-style: normal;'); r('.zh-antialiased', '-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;');
r('.zh-list-none', 'list-style: none; padding-left: 0;');

/* ---------------- colour ---------------- */
cat('color');
const TEXT = { primary: '--zh-text', secondary: '--zh-text-secondary', tertiary: '--zh-text-tertiary', disabled: '--zh-text-disabled', inverse: '--zh-text-inverse', brand: '--zh-color-primary-text', 'on-brand': '--zh-on-primary', success: '--zh-text-success', warning: '--zh-text-warning', danger: '--zh-text-danger', info: '--zh-text-info', 'trend-up': '--zh-trend-up', 'trend-down': '--zh-trend-down', 'trend-flat': '--zh-trend-flat', good: '--zh-num-good', warn: '--zh-num-warn', bad: '--zh-num-bad' };
for (const [n, v] of Object.entries(TEXT)) r(`.zh-text-${n}`, `color: var(${v});`);
for (let i = 1; i <= 8; i++) r(`.zh-text-chart-${i}`, `color: var(--zh-chart-${i});`);
r('.zh-text-inherit', 'color: inherit;'); r('.zh-text-current', 'color: currentColor;');
const BG = { page: '--zh-bg', subtle: '--zh-bg-subtle', elevated: '--zh-bg-elevated', glass: '--zh-bg-glass', code: '--zh-code-bg', mark: '--zh-mark-bg', overlay: '--zh-overlay', brand: '--zh-color-primary', 'brand-subtle': '--zh-color-primary-subtle', 'success-solid': '--zh-success', 'warning-solid': '--zh-warning', 'danger-solid': '--zh-danger', 'info-solid': '--zh-info', success: '--zh-success-bg', warning: '--zh-warning-bg', danger: '--zh-danger-bg', info: '--zh-info-bg', 'success-subtle': '--zh-success-bg-subtle', 'warning-subtle': '--zh-warning-bg-subtle', 'danger-subtle': '--zh-danger-bg-subtle', 'info-subtle': '--zh-info-bg-subtle' };
for (const [n, v] of Object.entries(BG)) r(`.zh-bg-${n}`, `background-color: var(${v});`);
for (let i = 1; i <= 8; i++) r(`.zh-bg-chart-${i}`, `background-color: var(--zh-chart-${i});`);
r('.zh-bg-transparent', 'background-color: transparent;');
for (let i = 1; i <= 8; i++) r(`.zh-fill-chart-${i}`, `fill: var(--zh-chart-${i});`);
r('.zh-fill-current', 'fill: currentColor;'); r('.zh-stroke-current', 'stroke: currentColor;');

/* ---------------- border ---------------- */
cat('border');
r('.zh-border', 'border: 1px solid var(--zh-border);'); r('.zh-border-0', 'border-width: 0;'); r('.zh-border-2', 'border-width: 2px; border-style: solid; border-color: var(--zh-border);');
for (const [n, s] of Object.entries({ t: 'top', r: 'right', b: 'bottom', l: 'left' })) { r(`.zh-border-${n}`, `border-${s}: 1px solid var(--zh-border);`); r(`.zh-border-${n}-0`, `border-${s}-width: 0;`); }
for (const n of ['solid', 'dashed', 'dotted', 'none']) r(`.zh-border-${n}`, `border-style: ${n};`);
const BC = { default: '--zh-border', strong: '--zh-border-strong', brand: '--zh-color-primary', success: '--zh-success-border', warning: '--zh-warning-border', danger: '--zh-danger-border', info: '--zh-info-border' };
for (const [n, v] of Object.entries(BC)) r(`.zh-border-${n}`, `border-color: var(${v});`);
r('.zh-border-transparent', 'border-color: transparent;');
r('.zh-rounded-none', 'border-radius: 0;'); for (const n of ['sm', 'md', 'lg']) r(`.zh-rounded-${n}`, `border-radius: var(--zh-radius-${n});`); r('.zh-rounded-full', 'border-radius: 999px;');
for (const n of ['sm', 'md', 'lg']) { r(`.zh-rounded-t-${n}`, `border-top-left-radius: var(--zh-radius-${n}); border-top-right-radius: var(--zh-radius-${n});`); r(`.zh-rounded-b-${n}`, `border-bottom-left-radius: var(--zh-radius-${n}); border-bottom-right-radius: var(--zh-radius-${n});`); }
r('.zh-divide-y > * + *', 'border-top: 1px solid var(--zh-border);'); r('.zh-divide-x > * + *', 'border-left: 1px solid var(--zh-border);');
r('.zh-divide-strong > * + *', 'border-color: var(--zh-border-strong);');
r('.zh-outline-none', 'outline: none;'); r('.zh-shadow-ring', 'box-shadow: var(--zh-focus-ring);');

/* ---------------- effects ---------------- */
cat('effects');
r('.zh-shadow-none', 'box-shadow: none;'); for (const n of ['sm', 'md', 'lg']) r(`.zh-shadow-${n}`, `box-shadow: var(--zh-shadow-${n});`);
for (const n of [0, 25, 50, 75, 100]) r(`.zh-opacity-${n}`, `opacity: ${n / 100};`);
r('.zh-opacity-disabled', 'opacity: var(--zh-opacity-disabled);');
r('.zh-backdrop-blur', '-webkit-backdrop-filter: saturate(180%) blur(14px); backdrop-filter: saturate(180%) blur(14px);');
r('.zh-glass', 'background-color: var(--zh-bg-glass); -webkit-backdrop-filter: saturate(180%) blur(14px); backdrop-filter: saturate(180%) blur(14px);');

/* ---------------- position ---------------- */
cat('position');
for (const n of ['static', 'relative', 'absolute', 'fixed', 'sticky']) r(`.zh-${n}`, `position: ${n};`);
r('.zh-inset-0', 'inset: 0;'); r('.zh-inset-x-0', 'left: 0; right: 0;'); r('.zh-inset-y-0', 'top: 0; bottom: 0;');
for (const n of ['top', 'right', 'bottom', 'left']) r(`.zh-${n}-0`, `${n}: 0;`);
r('.zh-center-abs', 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);');
for (const n of ['base', 'sticky', 'dropdown', 'drawer', 'modal', 'popover', 'toast', 'tooltip']) r(`.zh-z-${n}`, `z-index: var(--zh-z-${n});`);
r('.zh-z-auto', 'z-index: auto;');
r('.zh-isolate', 'isolation: isolate;');

/* ---------------- overflow ---------------- */
cat('overflow');
for (const n of ['hidden', 'auto', 'scroll', 'visible']) r(`.zh-overflow-${n}`, `overflow: ${n};`);
for (const n of ['auto', 'hidden', 'scroll']) { r(`.zh-overflow-x-${n}`, `overflow-x: ${n};`); r(`.zh-overflow-y-${n}`, `overflow-y: ${n};`); }
r('.zh-overscroll-contain', 'overscroll-behavior: contain;'); r('.zh-scroll-smooth', 'scroll-behavior: smooth;');
r('.zh-scrollbar-thin', 'scrollbar-width: thin;'); r('.zh-scrollbar-none', 'scrollbar-width: none;'); r('.zh-scrollbar-none::-webkit-scrollbar', 'display: none;');

/* ---------------- interaction ---------------- */
cat('interaction');
for (const n of ['pointer', 'default', 'not-allowed', 'text', 'grab', 'grabbing', 'move', 'wait', 'help']) r(`.zh-cursor-${n}`, `cursor: ${n};`);
r('.zh-pointer-events-none', 'pointer-events: none;'); r('.zh-pointer-events-auto', 'pointer-events: auto;');
for (const n of ['none', 'text', 'all', 'auto']) r(`.zh-select-${n}`, `-webkit-user-select: ${n}; user-select: ${n};`);
r('.zh-touch-manipulation', 'touch-action: manipulation;'); r('.zh-touch-none', 'touch-action: none;'); r('.zh-appearance-none', '-webkit-appearance: none; appearance: none;');
r('.zh-resize-none', 'resize: none;'); r('.zh-resize-y', 'resize: vertical;');

/* ---------------- transition ---------------- */
cat('transition');
r('.zh-transition', 'transition-property: color, background-color, border-color, box-shadow, opacity, transform; transition-duration: var(--zh-dur-fast); transition-timing-function: var(--zh-ease-standard);');
r('.zh-transition-none', 'transition: none;');
r('.zh-transition-colors', 'transition-property: color, background-color, border-color; transition-duration: var(--zh-dur-fast); transition-timing-function: var(--zh-ease-standard);');
r('.zh-transition-opacity', 'transition-property: opacity; transition-duration: var(--zh-dur-fast); transition-timing-function: var(--zh-ease-standard);');
r('.zh-transition-transform', 'transition-property: transform; transition-duration: var(--zh-dur-base); transition-timing-function: var(--zh-ease-standard);');
r('.zh-transition-shadow', 'transition-property: box-shadow; transition-duration: var(--zh-dur-fast); transition-timing-function: var(--zh-ease-standard);');
for (const n of ['instant', 'fast', 'base', 'slow', 'slower']) r(`.zh-duration-${n}`, `transition-duration: var(--zh-dur-${n}); animation-duration: var(--zh-dur-${n});`);
for (const n of ['standard', 'enter', 'exit', 'spring']) r(`.zh-ease-${n}`, `transition-timing-function: var(--zh-ease-${n}); animation-timing-function: var(--zh-ease-${n});`);
r('.zh-ease-linear', 'transition-timing-function: linear; animation-timing-function: linear;');
for (let n = 0; n <= 6; n++) r(`.zh-delay-${n}`, `transition-delay: calc(var(--zh-stagger) * ${n}); animation-delay: calc(var(--zh-stagger) * ${n});`);
r('.zh-will-change-transform', 'will-change: transform;');

/* ---------------- visibility / responsive show-hide ---------------- */
cat('visibility');
r('.zh-sr-only', 'position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;');
r('.zh-not-sr-only', 'position: static; width: auto; height: auto; padding: 0; margin: 0; overflow: visible; clip: auto; white-space: normal;');
r('.zh-invisible', 'visibility: hidden;'); r('.zh-visible', 'visibility: visible;');

cat('responsive');
for (const t of ['phone', 'tablet', 'desktop', 'large', 'tablet-down', 'desktop-up']) tier(t, `.zh-hide-${t}`, 'display: none;');
for (const [t, k] of [['phone', 'phone'], ['tablet', 'tablet'], ['desktop', 'desktop'], ['large', 'large']]) r(`.zh-show-${k}-only`, 'display: none;');
tier('phone', '.zh-show-phone-only', 'display: block;'); tier('tablet', '.zh-show-tablet-only', 'display: block;'); tier('desktop', '.zh-show-desktop-only', 'display: block;'); tier('large', '.zh-show-large-only', 'display: block;');

const RESP_SP = [0, 2, 3, 4, 6];
for (const [name, suf] of Object.entries(SUFFIX)) {
  const s = `-${name}`;
  tier(suf, `.zh-flex-col${s}`, 'flex-direction: column;'); tier(suf, `.zh-flex-row${s}`, 'flex-direction: row;');
  tier(suf, `.zh-flex-wrap${s}`, 'flex-wrap: wrap;'); tier(suf, `.zh-flex-nowrap${s}`, 'flex-wrap: nowrap;');
  tier(suf, `.zh-items-start${s}`, 'align-items: flex-start;'); tier(suf, `.zh-items-stretch${s}`, 'align-items: stretch;'); tier(suf, `.zh-items-center${s}`, 'align-items: center;');
  tier(suf, `.zh-justify-start${s}`, 'justify-content: flex-start;'); tier(suf, `.zh-justify-between${s}`, 'justify-content: space-between;'); tier(suf, `.zh-justify-center${s}`, 'justify-content: center;');
  tier(suf, `.zh-w-full${s}`, 'width: 100%;'); tier(suf, `.zh-w-auto${s}`, 'width: auto;');
  tier(suf, `.zh-text-left${s}`, 'text-align: left;'); tier(suf, `.zh-text-center${s}`, 'text-align: center;'); tier(suf, `.zh-text-right${s}`, 'text-align: right;');
  for (const n of ['xs', 'sm', 'base', 'lg', 'xl', '2xl']) tier(suf, `.zh-text-${n}${s}`, `font-size: ${{ xs: '.86em', sm: '.93em', base: '1em', lg: '1.14em', xl: '1.43em', '2xl': '1.71em' }[n]};`);
  for (const n of RESP_SP) {
    tier(suf, `.zh-p-${n}${s}`, `padding: ${sp(n)};`); tier(suf, `.zh-px-${n}${s}`, `padding-left: ${sp(n)}; padding-right: ${sp(n)};`); tier(suf, `.zh-py-${n}${s}`, `padding-top: ${sp(n)}; padding-bottom: ${sp(n)};`);
    tier(suf, `.zh-gap-${n}${s}`, `gap: ${sp(n)};`); tier(suf, `.zh-mt-${n}${s}`, `margin-top: ${sp(n)};`); tier(suf, `.zh-mb-${n}${s}`, `margin-bottom: ${sp(n)};`);
  }
  for (const n of [1, 2, 3, 4, 6, 12]) tier(suf, `.zh-cols-${n}${s}`, `grid-template-columns: repeat(${n}, minmax(0, 1fr));`);
  for (const n of [1, 2, 3, 4, 6, 12]) tier(suf, `.zh-col-span-${n}${s}`, `grid-column: span ${n} / span ${n};`);
  tier(suf, `.zh-col-span-full${s}`, 'grid-column: 1 / -1;');
}

/* ---------------- states ---------------- */
cat('state');
out.push('@media (hover: hover) {');
for (const [n, d] of Object.entries({
  'hover-bg-subtle': 'background-color: var(--zh-bg-subtle);', 'hover-bg-brand-subtle': 'background-color: var(--zh-color-primary-subtle);', 'hover-bg-elevated': 'background-color: var(--zh-bg-elevated);',
  'hover-text-brand': 'color: var(--zh-color-primary-text);', 'hover-text-primary': 'color: var(--zh-text);',
  'hover-border-brand': 'border-color: var(--zh-color-primary);', 'hover-border-strong': 'border-color: var(--zh-border-strong);',
  'hover-shadow-md': 'box-shadow: var(--zh-shadow-md);', 'hover-shadow-lg': 'box-shadow: var(--zh-shadow-lg);',
  'hover-lift': 'transform: translateY(-2px); box-shadow: var(--zh-shadow-md);', 'hover-opacity-100': 'opacity: 1;', 'hover-underline': 'text-decoration: underline;',
})) out.push(`  .zh-${n}:hover { ${d} }`);
out.push('}');
r('.zh-focus-ring:focus-visible', 'outline: none; box-shadow: var(--zh-focus-ring);');
r('.zh-focus-within-ring:focus-within', 'box-shadow: var(--zh-focus-ring);');
r('.zh-focus-outline-none:focus-visible', 'outline: none;');
r('.zh-active-scale:active', 'transform: scale(.98);');
r('.zh-disabled', 'opacity: var(--zh-opacity-disabled); cursor: not-allowed; pointer-events: none;');

/* ---------------- layout helpers ---------------- */
cat('layout');
r('.zh-container', 'width: 100%; margin-left: auto; margin-right: auto; max-width: var(--zh-container-max, none); padding-left: var(--zh-inner-pad); padding-right: var(--zh-inner-pad);');
r('.zh-divider', 'display: block; border: 0; height: 1px; background: var(--zh-border); margin: var(--zh-space-4) 0;');
r('.zh-divider-strong', 'background: var(--zh-border-strong);');
r('.zh-divider-dashed', 'height: 0; background: none; border-top: 1px dashed var(--zh-border-strong);');
r('.zh-divider-vertical', 'display: inline-block; width: 1px; height: 1em; margin: 0 var(--zh-space-3); vertical-align: middle;');
r('.zh-divider-text', 'display: flex; align-items: center; gap: var(--zh-space-3); height: auto; background: none; color: var(--zh-text-tertiary); font-size: .86em; margin: var(--zh-space-4) 0;');
r('.zh-divider-text::before, .zh-divider-text::after', 'content: ""; flex: 1; height: 1px; background: var(--zh-border);');
r('.zh-snap-x', 'overflow-x: auto; scroll-snap-type: x mandatory; overscroll-behavior-x: contain;');
r('.zh-snap-y', 'overflow-y: auto; scroll-snap-type: y mandatory; overscroll-behavior-y: contain;');
for (const n of ['start', 'center', 'end']) r(`.zh-snap-${n}`, `scroll-snap-align: ${n};`);
r('.zh-snap-stop', 'scroll-snap-stop: always;');
for (const [n, p] of Object.entries({ pt: 'top', pr: 'right', pb: 'bottom', pl: 'left' })) r(`.zh-${n}-safe`, `padding-${p}: env(safe-area-inset-${p}, 0px);`);
for (const n of [2, 3, 4, 6]) { r(`.zh-pb-safe-${n}`, `padding-bottom: max(${sp(n)}, env(safe-area-inset-bottom, 0px));`); r(`.zh-pt-safe-${n}`, `padding-top: max(${sp(n)}, env(safe-area-inset-top, 0px));`); }
r('.zh-mb-safe', 'margin-bottom: env(safe-area-inset-bottom, 0px);');

out.push('.zh-util-end { --zh-util: 0; }');
const css = '/* 53-utilities: generated by gen.mjs — edit gen.mjs, not this file. Utilities are single-class (specificity 0,1,0). */\n' + out.join('\n') + '\n';
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), 'style.css'), css);
console.log(`style.css: ${(css.length / 1024).toFixed(0)} KB, ${(css.match(/\.zh-[a-z0-9-]+/g) || []).length} class tokens`);
