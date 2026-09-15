#!/usr/bin/env node
/*
 * Packs the current working tree into `fixtures/fuji-pack.tgz`, the tarball
 * every fixture app installs from.
 *
 * The fixtures exist to catch things only the PUBLISHED artifact can show -
 * a missing `exports` entry, a `"use client"` that didn't survive the build,
 * Tailwind preflight colliding with Fuji's compiled CSS - so they have to
 * install a real pack, not `file:../..` (which would resolve to the source
 * tree and test nothing about packaging).
 *
 * The filename is deliberately version-less. `npm pack` produces
 * `fujiui-react-<version>.tgz`, and referencing that from a fixture's
 * package.json bakes the version into a committed lockfile - which is exactly
 * how the fixtures came to be pinned to a `0.1.0-alpha.0` tarball that no
 * longer existed. A stable name means the lockfiles stay valid across every
 * release.
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
