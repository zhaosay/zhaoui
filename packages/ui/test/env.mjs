// Shared by the browser tests: finds Playwright, launches an engine, and builds file:// URLs.  Works on macOS, Linux and Windows.
// Playwright is looked up by normal module resolution from this repository first (npm install at the root installs it),
// then in $PW_DIR, then <tmpdir>/pw (the old default).
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, readdirSync } from 'node:fs';

export function loadPlaywright() {
  const dirs = [import.meta.url, ...[process.env.PW_DIR, join(tmpdir(), 'pw'), '/tmp/pw'].filter(Boolean).map((d) => join(d, 'x.js'))];
  for (const d of dirs) {
    const req = createRequire(d);
    for (const name of ['playwright', 'playwright-core']) { try { return req(name); } catch {} }
  }
  throw new Error('Playwright not found. Run npm install at the repository root, then npm run test:setup to download the browsers.');
}

export const fileUrl = (path) => pathToFileURL(path).href;

function browserCache() {
  if (process.env.PLAYWRIGHT_BROWSERS_PATH && process.env.PLAYWRIGHT_BROWSERS_PATH !== '0') return process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (process.platform === 'win32') return join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'ms-playwright');
  if (process.platform === 'darwin') return join(homedir(), 'Library', 'Caches', 'ms-playwright');
  return join(homedir(), '.cache', 'ms-playwright');
}

// Newest installed Chromium build whose binary can be found, for when the default launch fails (e.g. the installed
// Playwright expects a newer revision than the one on disk).
function findChromium() {
  const root = browserCache(); if (!existsSync(root)) return null;
  const rel = {
    darwin: [['chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'], ['chrome-mac-arm64', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'], ['chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'], ['chrome-mac', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing']],
    win32: [['chrome-win64', 'chrome.exe'], ['chrome-win', 'chrome.exe']],
    linux: [['chrome-linux64', 'chrome'], ['chrome-linux', 'chrome']],
  }[process.platform] || [];
  const dirs = readdirSync(root).filter((x) => /^chromium-\d+$/.test(x)).sort((a, b) => parseInt(b.slice(9)) - parseInt(a.slice(9)));
  for (const d of dirs) for (const r of rel) { const f = join(root, d, ...r); if (existsSync(f)) return f; }
  return null;
}

export async function launch(pw, engine = process.env.ENGINE || 'chromium') {
  if (engine !== 'chromium') return pw[engine].launch();
  try { return await pw.chromium.launch(); } catch (e) {
    const exe = findChromium(); if (!exe) throw e;
    return pw.chromium.launch({ executablePath: exe });
  }
}

/** Resolve an extra package (e.g. axe-core) next to Playwright. */
export function resolveNearPlaywright(name) {
  const dirs = [import.meta.url, ...[process.env.PW_DIR, join(tmpdir(), 'pw'), '/tmp/pw'].filter(Boolean).map((d) => join(d, 'x.js'))];
  for (const d of dirs) { try { return createRequire(d).resolve(name); } catch {} }
  return null;
}
