#!/usr/bin/env node
// tsup's `bundle: false` mode leaves relative import/export specifiers
// exactly as authored (extensionless, e.g. "./provider" or "../../lib/cn"),
// which bundlers (Next.js, Vite, webpack) resolve fine but Node's native ESM
// resolver rejects outright (it requires explicit file extensions and never
// resolves a bare directory to its index file). This rewrites every relative
// specifier in the compiled output to point at the real emitted file, so the
// build works under strict Node ESM too, not only inside a bundler.
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

const ESM_ROOT = "dist/esm";

function walkJsFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkJsFiles(full, out);
    else if (entry.name.endsWith(".js")) out.push(full);
  }
  return out;
}

function resolveSpecifier(fromFile, spec) {
  const base = join(dirname(fromFile), spec);
  if (existsSync(`${base}.js`)) return `${spec}.js`;
  if (existsSync(join(base, "index.js"))) return `${spec}/index.js`;
  return null;
}

const SPECIFIER_RE = /((?:from|import)\s*["'])(\.\.?\/[^"']+)(["'])/g;

let filesChanged = 0;
for (const file of walkJsFiles(ESM_ROOT)) {
  const text = readFileSync(file, "utf8");
  let changed = false;
  const next = text.replace(SPECIFIER_RE, (full, prefix, spec, suffix) => {
    const resolved = resolveSpecifier(file, spec);
    if (!resolved || resolved === spec) return full;
    changed = true;
    return `${prefix}${resolved}${suffix}`;
  });
  if (changed) {
    writeFileSync(file, next, "utf8");
    filesChanged++;
  }
}

console.log(`Rewrote relative import specifiers in ${filesChanged} file(s).`);
