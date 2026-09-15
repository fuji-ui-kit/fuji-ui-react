/**
 * Rebuilds `dist/styles.css` + `dist/tokens.css` whenever a source stylesheet
 * or a component file changes.
 *
 * `tsup --watch` covers the JS half of the package, but the CSS is produced by
 * a separate Tailwind pass (scripts/build-css.mjs) that nothing was watching.
 * With the website consuming this package through a directory symlink, a
 * class added to a component would compile into the JS but its utility would
 * be missing from the stylesheet until someone remembered to run
 * `npm run build:css` - which looks exactly like "the fix didn't work".
 *
 * Component files are watched too, not just `src/styles`: Tailwind generates
 * utilities by scanning them, so a new `fj:` class in a .tsx changes the CSS
 * output even though no stylesheet was touched.
 *
 * No dependencies - `fs.watch` with a debounce, since editors fire several
 * events per save.
 */
import { watch } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WATCHED = ["src"];
const DEBOUNCE_MS = 150;

let timer = null;
let running = false;
let queued = false;

function build() {
  if (running) {
    queued = true;
    return;
  }
  running = true;
  const started = Date.now();
  const child = spawn("node", [join(ROOT, "scripts/build-css.mjs")], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "inherit"],
  });
  child.stdout.on("data", () => {});
  child.on("close", (code) => {
    running = false;
    const ms = Date.now() - started;
    console.log(code === 0 ? `css rebuilt in ${ms}ms` : `css build FAILED (exit ${code})`);
    if (queued) {
      queued = false;
      build();
    }
  });
}

function schedule() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(build, DEBOUNCE_MS);
}

for (const dir of WATCHED) {
  watch(join(ROOT, dir), { recursive: true }, (_event, file) => {
    if (!file) return;
    // Only the inputs the CSS build actually reads.
    if (!/\.(css|tsx?|js)$/.test(file)) return;
    schedule();
  });
}

console.log("watching src for CSS changes (ctrl-c to stop)");
build();
