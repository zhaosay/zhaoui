// Assembles zhaoui-demo.html from demo/base.html + demo/fragments/*.
//   node demo/build.mjs                       -> ../zhaoui-demo.html (all fragments)
//   node demo/build.mjs --out /tmp/x.html --only 00-core,10-badge
// A fragment is a folder with any of: fragment.json {id,title,order?}, section.html, style.css, script.js
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readBase } from './base.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..'), root = resolve(repo, '..');   // the page is written next to the repository folder by default
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const out = resolve(opt('--out') || join(root, 'zhaoui-demo.html'));
const only = opt('--only') ? opt('--only').split(',') : null;

const dirs = readdirSync(join(here, 'fragments')).filter((d) => statSync(join(here, 'fragments', d)).isDirectory()).sort();
const read = (d, f) => (existsSync(join(here, 'fragments', d, f)) ? readFileSync(join(here, 'fragments', d, f), 'utf8') : '');
let html = readBase();   // base.html with the pieces in demo/base/ put back
const css = [], cssLast = [], js = [], sections = [], toc = [], topSections = [], topToc = [];
const problems = [];

for (const d of dirs) {
  if (only && !only.includes(d)) continue;
  const meta = existsSync(join(here, 'fragments', d, 'fragment.json')) ? JSON.parse(read(d, 'fragment.json')) : {};
  const sec = read(d, 'section.html'), style = read(d, 'style.css'), script = read(d, 'script.js');
  if (script) { try { new Function(script); } catch (e) { problems.push(`${d}/script.js: ${e.message}`); } }
  if (style) (meta.layer === 'last' ? cssLast : css).push(`/* ---- fragment: ${d} ---- */\n${style}`);
  if (sec) {
    (meta.position === 'top' ? topSections : sections).push(`      <!-- fragment: ${d} -->\n${sec}`);
    const list = meta.sections || (meta.id ? [{ id: meta.id, title: meta.title }] : []);
    for (const x of list) {
      if (!sec.includes(`id="${x.id}"`)) problems.push(`${d}: section.html has no id="${x.id}"`);
      (meta.position === 'top' ? topToc : toc).push(`    <a href="#${x.id}">${x.title || x.id}</a>`);
    }
  }
  if (script) js.push(`  /* fragment: ${d} */\n  (function () {\n'use strict';\n${script}\n  })();`);
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }

const put = (marker, text) => { if (!html.includes(marker)) throw new Error(`marker missing: ${marker}`); html = html.replace(marker, () => text + (text ? '\n' : '') + marker); };
put('<!-- @fragments:top -->', topSections.join('\n\n'));
put('<!-- @fragments:toc-top -->', topToc.length ? `    <div class="grp">开始</div>\n${topToc.join('\n')}` : '');
put('/* @fragments:css */', css.join('\n\n'));
put('/* @fragments:css-last */', cssLast.join('\n\n'));
put('<!-- @fragments:sections -->', sections.join('\n\n'));
put('<!-- @fragments:toc -->', toc.length ? `    <div class="grp">更多组件</div>\n${toc.join('\n')}` : '');
put('/* @fragments:js */', js.join('\n\n'));

// base.html links to the token files as "zhaoui/packages/...".  Beside the repository folder the link only needs the folder's real name; anywhere else it has
// to be absolute, written as a file URL so that a Windows path (D:\\a\\...) works too.
html = html.split('zhaoui/packages/').join(dirname(out) === root ? `${basename(repo)}/packages/` : pathToFileURL(join(repo, 'packages')).href + '/');
writeFileSync(out, html);
console.log(`built ${out} (${(html.length / 1024).toFixed(0)} KB, ${sections.length} sections, ${js.length} scripts)`);
