#!/usr/bin/env node
// One-time codemod: rewrite website `@/*` alias imports to relative imports under src/.
// `@/providers/FujiProvider` -> `provider/FujiProvider`; `@/hooks/*`, `@/lib/*`, `@/types` keep
// their paths.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { relative, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, "..", "src");

const ALIAS_TARGETS = {
  "@/providers/FujiProvider": path.join(SRC, "provider", "FujiProvider"),
  "@/hooks/useControllableState": path.join(SRC, "hooks", "useControllableState"),
  "@/lib/appearance-storage": path.join(SRC, "lib", "appearance-storage"),
  "@/lib/cn": path.join(SRC, "lib", "cn"),
  "@/types": path.join(SRC, "types", "index"),
};

function toRelativeImport(fromFile, toFileNoExt) {
  let rel = relative(dirname(fromFile), toFileNoExt);
  if (!rel.startsWith(".")) rel = "./" + rel;
  return rel.split(path.sep).join("/");
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = walk(SRC);
let changedCount = 0;

for (const file of files) {
  let text = readFileSync(file, "utf8");
  let changed = false;

  for (const [alias, targetNoExt] of Object.entries(ALIAS_TARGETS)) {
    // Match `from "@/alias"` (exact) with either quote style.
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(["'])${escaped}\\1`, "g");
    if (re.test(text)) {
      const relImport = toRelativeImport(file, targetNoExt);
      text = text.replace(re, `$1${relImport}$1`);
      changed = true;
    }
  }

  if (changed) {
    writeFileSync(file, text, "utf8");
    changedCount++;
  }
}

console.log(`Rewrote aliased imports in ${changedCount} file(s).`);

// Fail loudly if any @/ import survives.
const survivors = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  if (/from\s+["']@\//.test(text) || /import\(["']@\//.test(text)) {
    survivors.push(file);
  }
}
if (survivors.length) {
  console.error("Unresolved @/ aliases remain in:\n" + survivors.join("\n"));
  process.exit(1);
}
