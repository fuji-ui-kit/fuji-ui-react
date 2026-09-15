/**
 * Mirrors this package's build output into a consumer's `node_modules` so the
 * website picks up component changes without a repack + reinstall.
 *
 * Why a copy instead of `npm link` / a `file:` directory dependency: both of
 * those install a SYMLINK, and the link target lives outside the website's
 * project root. Turbopack refuses to resolve through a symlink that escapes
 * its root ("Can't resolve '@fujiui/react'"), and the documented fix -
 * widening `turbopack.root` to the parent directory - makes it watch both
 * repos, the git worktree and every node_modules under them. Measured: the
 * dev server sat at 813% CPU and page compiles went from ~1.5s to 100s.
 *
 * Copying keeps `node_modules/@fujiui/react` a plain directory, so resolution
 * and file watching stay exactly as they are for a published package, and the
 * dev server only ever watches its own project.
 *
 * Usage: node scripts/sync-linked.mjs [targetNodeModulesPath]
 */
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, watch } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TARGET = process.argv[2] ?? join(ROOT, "..", "fuji-ui-website", "node_modules", "@fujiui", "react");
const DEBOUNCE_MS = 250;

if (!existsSync(join(ROOT, "dist"))) {
  console.error("dist/ does not exist yet - run `npm run build` first.");
  process.exit(1);
}
if (!existsSync(TARGET)) {
  console.error(`target not found: ${TARGET}\nInstall the package there once, then re-run.`);
  process.exit(1);
}

let timer = null;
let running = false;
let queued = false;

async function sync() {
  if (running) {
    queued = true;
    return;
  }
  running = true;
  const started = Date.now();
  try {
    await mkdir(join(TARGET, "dist"), { recursive: true });
    await cp(join(ROOT, "dist"), join(TARGET, "dist"), { recursive: true, force: true });
    // Keep the manifest in step too - `exports` and `version` changes matter
    // to the consumer's resolver, and a stale copy resolves to missing files.
    const pkg = JSON.parse(await readFile(join(ROOT, "package.json"), "utf8"));
    await writeFile(join(TARGET, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
    console.log(`synced dist -> consumer in ${Date.now() - started}ms`);
  } catch (error) {
    console.error("sync failed:", error.message);
  } finally {
    running = false;
    if (queued) {
      queued = false;
      sync();
    }
  }
}

function schedule() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(sync, DEBOUNCE_MS);
}

watch(join(ROOT, "dist"), { recursive: true }, (_event, file) => {
  // Source maps churn on every rebuild and the consumer never reads them
  // during dev; skipping them halves the copies.
  if (file && file.endsWith(".map")) return;
  schedule();
});

console.log(`watching dist -> ${TARGET}`);
await sync();
