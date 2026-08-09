# Build architecture

The build in this repo is more elaborate than a typical library build. Every
piece of that complexity exists because a simpler shape produced a concrete,
reproducible failure in a consumer app. Read this before changing
`tsup.config.ts`, `scripts/build-css.mjs`, or `scripts/fix-esm-extensions.mjs`.

```
npm run build
├── build:js   → tsup (three passes)
└── build:css  → postcss + tailwind (scripts/build-css.mjs)
```

Output:

```
dist/
  esm/**/*.js        unbundled ESM, one file per source module
  index.cjs          bundled CommonJS
  index.d.ts         consolidated TypeScript declarations (ESM)
  index.d.cts        consolidated TypeScript declarations (CJS)
  styles.css         compiled stylesheet (tokens + base rules + used utilities)
  tokens.css         raw --fuji-* custom properties
```

---

## Pass 1 - unbundled ESM (`dist/esm/`)

`bundle: false`, one output file per source file.

**Why unbundled.** `"use client"` is a _module-level_ boundary. If the ESM build
were bundled into one file, that file would need a single directive for the
whole library - and adding one would mark every export as client-only. That is
not a cosmetic difference: a Next.js Server Component may render a client
component as JSX, but it may not pass a **component reference** as a prop across
the boundary. So `<Icon icon={SearchX} />` in a Server Component fails with
"Functions cannot be passed directly to Client Components" the moment `Icon`
becomes client-only. Keeping one output file per source module keeps each
component's boundary exactly where its source put it.

### Directive preservation

esbuild strips `"use client"` from transpiled output, and tsup's `banner`
option cannot help - it applies one banner to everything, which is precisely
what we are avoiding. So the config's `onSuccess` hook walks `src/`, finds every
file whose source starts with `"use client";`, and re-prepends the directive to
the matching file in `dist/esm/`.

**Consequence:** the directive must be the _literal first line_ of the source
file. A leading comment or blank line before it means the source check misses
it, the directive is silently dropped from the build, and the component becomes
server-rendered in consumer apps - failing at runtime rather than at build time
here.

### ESM extension rewriting

`scripts/fix-esm-extensions.mjs` runs after the same pass. TypeScript source
uses extensionless relative imports (`./Button`, `../lib/cn`) and directory
imports (`./button`). Bundlers resolve those; **native Node ESM does not** - it
requires explicit file extensions and has no directory-index resolution. Without
this step, `import("@fuji-ui/react")` in plain Node fails with
`ERR_UNSUPPORTED_DIR_IMPORT` / `ERR_MODULE_NOT_FOUND`, even though every bundler
is happy. The script rewrites each relative specifier to `./x.js` or
`./x/index.js` based on what actually exists on disk.

## Pass 2 - bundled CJS (`dist/index.cjs`)

`bundle: true`, `splitting: false`, single output. CommonJS has no equivalent of
the RSC directive contract to preserve, so one bundled file is the simpler and
smaller choice. `onSuccess` prepends a single `"use client"` here - CJS consumers
are bundler/Node consumers, not RSC graph participants.

## Pass 3 - declarations only

`dts: { only: true }`, `bundle: true`, emitting `dist/index.d.ts` and
`dist/index.d.cts`.

**Why a separate pass.** Generating per-file declarations alongside the
unbundled pass 1 exhausted the DTS worker (`ERR_WORKER_OUT_OF_MEMORY`) across
~180 source files. Consolidating declarations is safe here precisely because the
public API is a single root entry point - consumers never import a subpath, so
they never need a declaration file that mirrors the internal file layout.

## Why not just use one pass?

Each shape was tried and each failed in a specific way:

| Shape                         | Failure                                                          |
| ----------------------------- | ---------------------------------------------------------------- |
| Single bundled ESM + banner   | Whole library becomes client-only; breaks Server Component props |
| `bundle: false` alone         | esbuild strips directives entirely                               |
| `bundle: false` + `dts`       | DTS worker runs out of memory                                    |
| Unbundled without the rewrite | Native Node ESM cannot resolve the relative imports              |

---

## CSS pipeline

`scripts/build-css.mjs` runs PostCSS with `@tailwindcss/postcss` over
`scripts/css-entry.css`, a build-only entry that:

- Imports `tailwindcss/theme.css` and `tailwindcss/utilities.css` **but not
  `preflight.css`**. Shipping preflight would reset the global styles of every
  app that imports `styles.css` - a library must not do that.
- Declares `@source` for `src/components/fuji`, `src/provider`, and `src/lib`,
  so Tailwind generates only the utilities Fuji itself uses. **A new top-level
  source directory must be added here** or its utilities silently go missing
  from `dist/styles.css`.
- Imports `src/styles/tokens.css` (values), `fuji-theme.css` (the token →
  `@theme` mapping that makes `bg-fuji-*` etc. resolvable), and `base.css`
  (hand-written reusable rules: focus styles, glass surfaces, theme-scope
  transitions).

`tokens.css` is also copied to `dist/` unprocessed, for consumers who want the
raw custom properties without the compiled utility layer.

### Static class names

Tailwind v4's scanner is a static text scan. `bg-fuji-${variant}` is never
generated. This is why `src/components/fuji/lib/appearance.ts` writes out every
variant × appearance combination in full instead of templating them. Any new
recipe must do the same.

---

## Cross-version React support

One build serves React 18 and 19. Two differences have already bitten this
codebase:

- **Refs.** React 19 delivers a ref through `props.ref`; React 18 does not
  (it lives on the element object). Code inspecting a child's ref must handle
  both - see the `asChild` branch in `Button.tsx`.
- **`inert`.** React 19 treats it as a strict boolean prop; React 18 does not
  recognize it specially and warns on a boolean value. Neither a boolean nor an
  empty-string JSX prop works on both. The fix used in `Carousel.tsx` is to skip
  JSX entirely and set `node.inert = value` in a ref callback.

The only real verification is installing each major version in turn and running
the full suite against both.

---

## Verifying a build

```bash
npm run build
npm pack --dry-run          # inspect the file list: dist, docs, README, LICENSE, CHANGELOG, notices
node -e "import('@fuji-ui/react').then(m => console.log(Object.keys(m).length))"   # from a consumer install
```

Checks worth running when the build config changed at all:

- `dist/esm/components/fuji/button/Button.js` starts with `"use client";`.
- `dist/esm/components/fuji/icon/Icon.js` does **not**.
- No relative import in `dist/esm/**` lacks a file extension.
- `dist/styles.css` contains `--fuji-` tokens and does **not** contain
  Tailwind's preflight reset rules.
- The tarball contains no `src/`, no `*.test.*`, and no config files.
- The sibling `fuji-ui-website` builds against a freshly packed tarball.
