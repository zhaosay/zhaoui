// Checks every relative href/src in the generated HTML: the file exists, and a #fragment exists as an id in the target page.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';

const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });

export function checkLinks(dir) {
  const htmls = walk(dir).filter((f) => f.endsWith('.html')), ids = new Map(), problems = [];
  const idsOf = (f) => { if (!ids.has(f)) { const s = readFileSync(f, 'utf8'); ids.set(f, new Set([...s.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]))); } return ids.get(f); };
  for (const f of htmls) {
    const src = readFileSync(f, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<pre[\s\S]*?<\/pre>/g, '');
    for (const m of src.matchAll(/(?<![\w-])(?:href|src)="([^"]*)"/g)) {
      const u = m[1]; if (!u || /^(https?:|mailto:|data:|javascript:)/.test(u)) continue;
      const [pathPart, frag] = u.split('#'); const target = pathPart ? resolve(dirname(f), pathPart.split('?')[0]) : f;
      const isDir = existsSync(target) && statSync(target).isDirectory(), file = isDir ? join(target, 'index.html') : target;
      if (!existsSync(file)) { problems.push(`${relative(dir, f)}: ${u} -> missing file`); continue; }
      if (frag && file.endsWith('.html') && frag !== '' && !idsOf(file).has(decodeURIComponent(frag))) problems.push(`${relative(dir, f)}: ${u} -> no #${frag}`);
    }
  }
  return problems;
}
