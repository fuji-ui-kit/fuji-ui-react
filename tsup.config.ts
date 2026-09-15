import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { execFileSync } from "node:child_process";
import { defineConfig } from "tsup";

// esbuild refuses to keep a banner-injected "use client" directive once it's
// bundling files that already open with their own "use client" (it treats
// the banner as a second, conflicting directive prologue and silently drops
// it - see https://github.com/evanw/esbuild/issues/2853). Prepending it to
// the finished file after the fact sidesteps that entirely. Only used for
// the CJS build (see its own comment for why).
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

// `bundle: false` per-file transforms drop directive prologues entirely
// (esbuild's directive-preservation logic only kicks in for its bundling
// mode, not per-file transforms) - so this restores "use client" onto
// exactly the compiled outputs whose SOURCE file declared it, one-for-one.
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
  // Keep the maps (useful for consumers debugging through to a real stack
  // line) but drop the embedded original TypeScript source they'd otherwise
  // carry - the published tarball has no `src/` at all, so shipping full
  // source text inside every .map defeats that and bloats the package for no
  // benefit `sourcemap: true` doesn't already provide on its own.
  esbuildOptions(options: { sourcesContent?: boolean }) {
    options.sourcesContent = false;
  },
};

export default defineConfig([
  {
    ...shared,
    // Roughly half of Fuji's components (Icon, Typography, Timeline, Box,
    // Container...) are plain presentational components with no "use
    // client" of their own, specifically so Server Components can render
    // them directly - e.g. `<Icon icon={SearchX} />` from a Server
    // Component page. A single flat bundle can only ever carry ONE
    // top-of-file directive for its whole module scope, which would force
    // every one of those into a client boundary too and break exactly that
    // pattern (Next.js rejects a raw component reference passed as a prop
    // into a client boundary). `bundle: false` keeps each source file as its
    // own output module instead, so only the files that already declare
    // "use client" carry it through - required for a downstream RSC-aware
    // bundler (Next.js) to see per-module boundaries at all.
    //
    // `bundle: false` only transpiles files it's explicitly given - it does
    // not follow imports - so every source file must be listed, not just
    // the root entry, or referenced modules (provider/, components/fuji/...)
    // never get emitted at all.
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
    // esbuild cannot code-split CJS output, so this build stays one flat
    // file. CJS consumers (plain Node `require`, Jest, older bundlers) never
    // go through an RSC-aware bundler anyway, so a single blanket directive
    // here has no downside - "use client" is simply meaningless outside
    // that context, unlike for the ESM build above.
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
    // Declarations are generated as one consolidated, bundled entry
    // regardless of how the JS is split at runtime: consumers only ever
    // `import ... from "@fujiui/react"` (no subpath component imports), so
    // one rolled-up .d.ts is both sufficient and far lighter than emitting
    // (and rolling up types across) ~175 individual per-file declarations.
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
