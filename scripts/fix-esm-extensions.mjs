#!/usr/bin/env node
// `bundle: false` leaves relative specifiers extensionless ("./provider"), which bundlers accept
// but Node's ESM resolver rejects (no extension guessing, no directory index). Rewrite each one
// to the real emitted file so the build also works under plain Node.
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

// tsup 8.5.1 duplicates sourceMappingURL in `bundle: false` mode - harmless, but 178 stray lines
// in the tarball. Drop them while rewriting; revisit if tsup stops.
const TRAILING_SOURCEMAP_RE = /(?:\r?\n\/\/# sourceMappingURL=\S+)+\s*$/;

function dedupeSourceMappingComment(text) {
  const match = text.match(TRAILING_SOURCEMAP_RE);
  if (!match) return text;
  const urls = match[0].match(/\/\/# sourceMappingURL=\S+/g) ?? [];
  if (urls.length < 2) return text;
  return `${text.slice(0, match.index)}\n${urls[urls.length - 1]}\n`;
}

let filesChanged = 0;
let sourcemapCommentsDeduped = 0;
for (const file of walkJsFiles(ESM_ROOT)) {
  const text = readFileSync(file, "utf8");
  let next = text.replace(SPECIFIER_RE, (full, prefix, spec, suffix) => {
    const resolved = resolveSpecifier(file, spec);
    if (!resolved || resolved === spec) return full;
    return `${prefix}${resolved}${suffix}`;
  });
  const deduped = dedupeSourceMappingComment(next);
  if (deduped !== next) sourcemapCommentsDeduped++;
  next = deduped;
  if (next !== text) {
    writeFileSync(file, next, "utf8");
    filesChanged++;
  }
}

console.log(
  `Rewrote ${filesChanged} ESM file(s); removed duplicate sourceMappingURL from ${sourcemapCommentsDeduped}.`,
);
