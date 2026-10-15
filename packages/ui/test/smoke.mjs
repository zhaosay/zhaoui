// Standalone smoke test: loads test/standalone.html (which references only dist/zhaoui.css and dist/zhaoui.js)
// and drives every component the way a user would.  Needs playwright (see env.mjs for where it is looked up).  Options: --min (minified files), --engine=firefox|webkit (or the VARIANT / ENGINE environment variables).
// The shared setup is in lib/harness.mjs, helpers in lib/helpers.mjs, the tests in smoke/*.mjs (run in this order).
import { createHarness } from './lib/harness.mjs';

const h = await createHarness();
for (const part of ["01-components","02-forms-and-pickers","03-styles-and-layout"]) await (await import(`./smoke/${part}.mjs`)).default(h);

await h.b.close();
console.log(`${h.failed ? 'FAILED' : 'ok'} [${h.ENGINE}${h.VARIANT === 'full' ? '' : '/' + h.VARIANT}]: ${h.passed} passed, ${h.failed} failed`);
process.exit(h.failed ? 1 : 0);
