#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");

mkdirSync(DIST, { recursive: true });

const entryPath = join(__dirname, "css-entry.css");
const source = readFileSync(entryPath, "utf8");

const result = await postcss([tailwindcss()]).process(source, {
  from: entryPath,
  to: join(DIST, "styles.css"),
});

writeFileSync(join(DIST, "styles.css"), result.css, "utf8");
if (result.map) writeFileSync(join(DIST, "styles.css.map"), result.map.toString(), "utf8");

// tokens.css is shipped unprocessed too, for consumers who want the raw
// custom properties without the compiled utility layer (e.g. to build their
// own Tailwind theme mapping instead of using styles.css).
copyFileSync(join(ROOT, "src/styles/tokens.css"), join(DIST, "tokens.css"));

console.log("Built dist/styles.css and dist/tokens.css");
