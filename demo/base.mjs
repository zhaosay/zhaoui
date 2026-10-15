// demo/base.html is the shell of the demo page.  Its large parts (the stylesheet, the icon sprite, the page body, the script) live in demo/base/
// and are named by include lines of the form  <!-- @include base/xxx -->  which this resolver replaces with the content of that file.
// Both demo/build.mjs and packages/ui/scripts/build.mjs read the page through here, so they see the same text.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export function readBase() {
  return readFileSync(join(here, 'base.html'), 'utf8').replace(/^<!-- @include (\S+) -->\n/gm, (_, file) => readFileSync(join(here, file), 'utf8'));
}
