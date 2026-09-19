import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { execFileSync } from "node:child_process";
import { defineConfig } from "tsup";

// Prepends "use client" to a finished file. A banner doesn't work: esbuild drops it as a
// conflicting directive when bundled files carry their own (evanw/esbuild#2853).
function prependUseClient(file: string) {
  const contents = readFileSync(file, "utf8");
  if (contents.startsWith('"use client";')) return;
  writeFileSync(file, `"use client";\n${contents}`, "utf8");
}

function walk(dir: string, out: string[] = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".test.tsx")) out.push(full);
  }
  return out;
}

// esbuild drops directives in `bundle: false` transforms, so re-prepend "use client" to exactly
// the outputs whose SOURCE file declared it.
function restoreUseClientDirectives() {
  const srcRoot = "src";
  for (const file of walk(srcRoot)) {
    const source = readFileSync(file, "utf8");
    if (!source.startsWith('"use client";')) continue;
    const rel = relative(srcRoot, file).replace(/\.tsx?$/, ".js");
    const outFile = join("dist/esm", rel);
    if (!existsSync(outFile)) continue;
    prependUseClient(outFile);
  }
}

const shared = {
  sourcemap: true,
  treeshake: true,
  minify: false,
  target: "es2020" as const,
  external: ["react", "react-dom", "react/jsx-runtime"],
  // Keep maps but not embedded source: the tarball deliberately ships no `src/`.
  esbuildOptions(options: { sourcesContent?: boolean }) {
    options.sourcesContent = false;
  },
};

export default defineConfig([
  {
    ...shared,
    // Unbundled ESM keeps "use client" per file: one bundle has ONE directive, which would make
    // presentational components (Icon, Typography...) client boundaries and break RSC usage like
    // `<Icon icon={SearchX} />`. `bundle: false` doesn't follow imports, so list every file.
    entry: ["src/**/*.{ts,tsx}", "!src/**/*.test.{ts,tsx}"],
    format: ["esm"],
    bundle: false,
    dts: false,
    clean: true,
    outDir: "dist/esm",
    async onSuccess() {
      restoreUseClientDirectives();
      execFileSync("node", ["scripts/fix-esm-extensions.mjs"], { stdio: "inherit" });
    },
  },
  {
    ...shared,
    entry: { index: "src/index.ts" },
    format: ["cjs"],
    bundle: true,
    dts: false,
    clean: false,
    // esbuild can't code-split CJS, so it's one flat file with a blanket "use client" - harmless,
    // since CJS consumers (Node, Jest) never go through an RSC-aware bundler.
    splitting: false,
    outExtension() {
      return { js: ".cjs" };
    },
    async onSuccess() {
      prependUseClient("dist/index.cjs");
    },
  },
  {
    ...shared,
    // Separate declarations-only pass: one rolled-up .d.ts suffices (no subpath imports) and is
    // far lighter on memory than ~175 per-file declarations.
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    bundle: true,
    dts: { only: true },
    clean: false,
    outExtension({ format }) {
      return { js: format === "cjs" ? ".cjs" : ".js" };
    },
  },
]);
