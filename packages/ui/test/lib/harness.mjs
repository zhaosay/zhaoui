// Shared setup of the standalone smoke test: the browser, the standalone page, and the test runners.  smoke.mjs builds one harness and runs the parts in smoke/ with it.
import { loadPlaywright, launch as launchEngine, fileUrl } from '../env.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createHelpers } from './helpers.mjs';

export async function createHarness() {
  const h = { passed: 0, failed: 0, assert, fileUrl, join, dirname, readFileSync, writeFileSync, existsSync, readdirSync, fileURLToPath };
  const pw = loadPlaywright();
  const HERE = join(dirname(fileURLToPath(import.meta.url)), '..'), VARIANT = process.env.VARIANT || (process.argv.includes('--min') ? 'min' : 'full');
  function pagePath(name) {
    if (VARIANT === 'full') return join(HERE, name);
    const out = join(HERE, name.replace('.html', '.min.generated.html'));
    writeFileSync(out, readFileSync(join(HERE, name), 'utf8').replace('../dist/zhaoui.css"', '../dist/zhaoui.min.css"').replace('../dist/zhaoui.js"', '../dist/zhaoui.min.js"'));
    return out;
  }
  const FILE = fileUrl(pagePath('standalone.html'));
  const ENGINE = process.env.ENGINE || (process.argv.find((a) => a.startsWith('--engine=')) || '').slice(9) || 'chromium';
  const launch = () => launchEngine(pw, ENGINE);
  const b = await launch();
  async function fresh(w = 1280) {
    const p = await b.newPage({ viewport: { width: w, height: 800 } });
    p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') p.errs.push('console: ' + m.text()); });
    await p.goto(FILE); await p.waitForTimeout(250); return p;
  }
  const say = (label) => { if (process.env.ZH_VERBOSE) console.log('  . ' + label); };   // ZH_VERBOSE=1 names each test as it starts, so a hang shows where
  const test = async (label, fn, w) => { say(label); const p = await fresh(w); try { await fn(p); assert.deepEqual(p.errs, [], 'page errors'); h.passed++; } catch (e) { h.failed++; console.log(`FAIL ${label}\n   ${e.message.split('\n').slice(0, 14).join(' | ')}`); } await p.close(); };
  const wait = (p, ms = 200) => p.waitForTimeout(ms);
  Object.assign(h, { say, pw, HERE, VARIANT, pagePath, FILE, ENGINE, launch, b, fresh, test, wait });
  Object.assign(h, createHelpers(h));
  return h;
}
