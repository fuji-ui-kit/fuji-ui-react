#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, ".storybook/generated");

mkdirSync(OUT_DIR, { recursive: true });

const entryPath = join(ROOT, ".storybook/storybook-entry.css");
const source = readFileSync(entryPath, "utf8");

const result = await postcss([tailwindcss()]).process(source, {
  from: entryPath,
  to: join(OUT_DIR, "storybook.css"),
});

writeFileSync(join(OUT_DIR, "storybook.css"), result.css, "utf8");

console.log("Built .storybook/generated/storybook.css");
