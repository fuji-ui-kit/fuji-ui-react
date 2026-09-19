#!/usr/bin/env node
/*
 * Packs the tree into `fixtures/fuji-pack.tgz`: fixtures test the PUBLISHED artifact, so not
 * `file:../..`. Version-less so committed lockfiles survive releases instead of pinning stale ones.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, renameSync, rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURES = join(ROOT, "fixtures");
const TARGET = join(FIXTURES, "fuji-pack.tgz");

if (!existsSync(join(ROOT, "dist", "index.cjs"))) {
  console.error("dist/ is missing or incomplete - run `npm run build` first.");
  process.exit(1);
}

const before = new Set(readdirSync(FIXTURES).filter((name) => name.endsWith(".tgz")));
execFileSync("npm", ["pack", "--pack-destination", FIXTURES], { cwd: ROOT, stdio: "inherit" });
const packed = readdirSync(FIXTURES).find((name) => name.endsWith(".tgz") && !before.has(name));

if (!packed) {
  console.error("npm pack produced no new tarball in fixtures/.");
  process.exit(1);
}

rmSync(TARGET, { force: true });
renameSync(join(FIXTURES, packed), TARGET);
console.log(`Packed ${packed} -> fixtures/fuji-pack.tgz`);
