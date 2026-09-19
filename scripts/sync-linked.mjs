/**
 * Copies build output into a consumer's node_modules (`node scripts/sync-linked.mjs [target]`).
 * Not a symlink: Turbopack won't resolve outside its root; widening it hit 813% CPU, 100s compiles.
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
    // The manifest too: a stale `exports` resolves to missing files.
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
  // Skip source maps: unused in dev, and skipping them halves the copies.
  if (file && file.endsWith(".map")) return;
  schedule();
});

console.log(`watching dist -> ${TARGET}`);
await sync();
