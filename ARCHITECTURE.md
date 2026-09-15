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
this step, `import("@fujiui/react")` in plain Node fails with
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

## Generated metadata (`dist/props.json`, `dist/registry.json`)

Two artifacts describe this package to tooling rather than to a browser. Both
are generated on every `npm run build` and neither is ever hand-edited.

`scripts/gen-props.mjs` produces **`dist/props.json`**: every exported `*Props`
interface, with each prop's type, required flag, JSDoc description, `@deprecated`
tag and default. It reads types from `dist/index.d.ts` through the TypeScript
checker, and defaults from the component _source_ - a declaration file carries
signatures, never bodies, so `size = "md"` exists only in `Button.tsx`.

`scripts/build-registry.mjs` produces **`dist/registry.json`**, the fuller
description: categories, summaries, keywords, compound parts with both their
dot-access and named-export forms, whether each file carries `"use client"`,
the design tokens per appearance scope, the shipped guides, and worked
examples. It **consumes `props.json` rather than re-deriving props** - two
generators over one surface is the drift this exists to prevent - and merges in
the authored `registry/` directory. Its parsing is syntactic
(`ts.createSourceFile`, no checker): a full program pulls in the whole
`@types/react` + `@base-ui/react` graph for seconds per build, and the
checker's type strings read worse than the authored ones.

It hard-fails the build on a metadata entry naming an export that does not
exist, an unknown category, an orphan example file, or a mismatch between the
barrel walk and `dist/index.d.ts`. Adding a component without a registry entry
is a warning that names it.

Both are reachable through the `exports` map (`@fujiui/react/props.json`,
`@fujiui/react/registry.json`), which is why they are named in SPEC §7 - their
presence is intentional, not an accident of shipping `dist`.

### Reading the registry without burning a caller's context

The registry is loaded once by whatever serves it and is never itself sent to a
model - but what a tool _returns_ is, so the shape matters more than the file
size. Measured against the current data:

| what a tool hands back             | tokens                   |
| ---------------------------------- | ------------------------ |
| `index` (all 89 components)        | ~3.8k                    |
| `index`, filtered to one category  | 200-950                  |
| `components` array, whole          | **~47k**                 |
| one `components` entry             | ~440 median, ~1.7k worst |
| `tokens`, whole                    | ~5k                      |
| `tokens`, one group                | 90-2.2k                  |
| `conventions` (the whole rule set) | ~660                     |
| `setup`, one framework             | ~300                     |
| one component's `examples`         | ~170 median              |

Three things follow, and each is built into the artifact rather than left to a
consumer to remember:

- **`index` exists so a listing never returns `components`.** The 13x
  difference between them is the single easiest mistake to make here.
- **`tokens.groups` exists so a token lookup can be sliced** by `color`,
  `spacing`, `radius`, `elevation`, `typography`, `motion` or `glass`.
- **Guides are referenced by `path`, not inlined.** `docs/` ships in the
  tarball; a consumer reads a guide when asked for one. Inlining ~40 KB of
  prose would make every consumer pay to load it, and would invite a tool into
  returning a whole guide where a section was wanted.

Each prop also carries its own `values` where the type is a union of string
literals, so a component response stands alone - `size: ComponentSize` is a
dead end for a caller that has not also fetched `types`.

**Known gap:** `npm run dev` is `tsup --watch` and does not regenerate either
file. Run `npm run build` after changing props, JSDoc or `registry/`.

---

## The MCP server (`mcp/`)

`mcp/` holds `@fujiui/mcp`, a stdio MCP server that reads `registry.json`. It
lives here rather than in its own repository for one reason: the registry schema
is a contract between the generator and the server, and in one repo a change to
it is a single typechecked commit. Across two it is publish-then-consume with
nothing checking that they agree - the same inversion that put the library's own
prop tables in the documentation site.

**It is deliberately not an npm workspace.** This is the part to read before
changing anything here. `@fujiui/react` is the _root_ package, and npm's
workspace mode treats the root as a container rather than a member - so the
moment `"workspaces": ["mcp"]` is added, changesets stops seeing the library at
all:

```
$ npx changeset status
🦋  error Found changeset … for package @fujiui/react which is not in the workspace
```

`changeset version` takes the same path and crashes, so no release PR is ever
opened; `changeset publish` computes an empty publish set and exits 0, which is
a silent no-op release rather than a loud failure. That shipped once and was
caught only by running the command.

So `@fujiui/mcp` is published **outside changesets**. npm needs no workspace to
publish a subdirectory: `npm publish` run inside `mcp/` uploads `mcp/package.json`
and its `files`, exactly as it would from a repository of its own. What
changesets cannot do is version and release both packages from one root, so the
server is versioned by hand and released by its own workflow:

1. Bump `version` in `mcp/package.json` and in both places in
   `mcp/server.json`, and add an entry to `mcp/CHANGELOG.md`.
2. Push a tag named `mcp-v<that version>`. `.github/workflows/release-mcp.yml`
   refuses a tag that does not match the file, runs the gate and
   `scripts/smoke-mcp.mjs`, publishes from `mcp/` with provenance, then publishes
   `mcp/server.json` to the MCP Registry as `io.github.fuji-ui-kit/fuji-ui`.

Moving the library to `packages/react/` under a private workspace root is only
needed if both packages should release through changesets.

Consequences of not being a workspace, all deliberate:

- `mcp/`'s dependencies are declared in **root `devDependencies`**
  (`@modelcontextprotocol/sdk`, `zod`), because nothing installs `mcp/package.json`
  during development. Its own dependency block is what users actually install;
  keep the two in step by hand. A dependency present only at the root works in
  every local run; for a user it either fails to import or, when another
  package happens to pull it in, silently resolves to that package's version.
  CI runs the smoke test below on every push to catch both.
- `mcp/package.json` is publishable on its own: `publishConfig.access` is
  `public` (a scoped package otherwise publishes as restricted), `files` ships
  only the compiled server - not the compiled tests or source maps `tsc` also
  emits - and `prepack` rebuilds `dist/`, so a publish never uploads a stale one.
- `scripts/smoke-mcp.mjs` packs the server, installs the tarball where this
  repository's `node_modules` cannot reach it - nested, so a copy hoisted for
  another package cannot stand in for a missing dependency - and drives it over
  stdio from
  each place a client starts it - including Claude Code's user scope, which
  starts servers in `~/.claude` and names the project only in
  `CLAUDE_PROJECT_DIR`.
- `npm run build:mcp` runs `tsc -p mcp/tsconfig.json` directly. Deliberately
  **not** part of `npm run build`: the library must not need the server to build.
- `npm run typecheck` covers it, so it cannot rot unnoticed.

The root package is otherwise untouched. `files` does not include `mcp/`, so the
library tarball is unchanged (`npm pack --dry-run` lists nothing from it), and
the Model Context Protocol SDK never enters the dependency tree of an app that
installs the component library.

Its README documents the per-tool context cost, which is the design constraint
that matters: a tool result is spent from the caller's context window on every
turn.

### The Claude Code plugin and the skill (`plugins/fuji-ui/`)

`.claude-plugin/marketplace.json` makes this repository a Claude Code plugin
marketplace named `fuji-ui`. Its one plugin, `plugins/fuji-ui/`, bundles the MCP
server (`.mcp.json`, running `npx -y @fujiui/mcp`) with the consumer-facing
`fuji-ui` skill. Three constraints decide where things live:

- **The skill has exactly one copy, inside the plugin.** Claude Code copies an
  installed plugin into its cache and does not copy files from outside the
  plugin directory, so the skill cannot live elsewhere and be linked in. The same
  file is what `npx skills add fuji-ui-kit/fuji-ui-react` installs for other
  agents.
- **It is not in `.claude/skills/`.** That directory holds the contributor
  skills for working on this repository, mirrored in `.codex/skills/` and checked
  by `npm run skills:check`. `npx skills add` scans it as well. Before the
  contributor skills were marked `metadata.internal: true`, pointing that CLI at
  the repository offered all twelve, and in testing an agent-run install put all
  thirteen into the user's app even when given `--skill fuji-ui`. With the flag,
  `npx skills add fuji-ui-kit/fuji-ui-react` installs `fuji-ui` alone. Every new
  contributor skill needs the same flag, and `skills:check` fails without it.
- **Neither ships to npm.** Root `files` includes neither `plugins/` nor
  `.claude-plugin/`; Claude Code fetches the plugin from git.

The plugin is versioned in `plugins/fuji-ui/.claude-plugin/plugin.json`, and
Claude Code pins installed plugins to that string - bump it whenever the skill
or `.mcp.json` changes, or existing users keep their cached copy. Do not also set
`version` in the marketplace entry; `plugin.json` wins and the two drift.
`mcp/src/plugin.test.ts` checks the marketplace name, the package the plugin
starts and the skill's frontmatter, and fails when a convention in the registry
has no `<!-- rule: id -->` section in the skill. `claude plugin validate
plugins/fuji-ui --strict` needs the Claude Code CLI, so it is not part of CI.

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
node -e "import('@fujiui/react').then(m => console.log(Object.keys(m).length))"   # from a consumer install
```

Checks worth running when the build config changed at all:

- `dist/esm/components/fuji/button/Button.js` starts with `"use client";`.
- `dist/esm/components/fuji/icon/Icon.js` does **not**.
- No relative import in `dist/esm/**` lacks a file extension.
- `dist/styles.css` contains `--fuji-` tokens and does **not** contain
  Tailwind's preflight reset rules.
- The tarball contains no `src/`, no `*.test.*`, and no config files.
- The sibling `fuji-ui-website` builds against a freshly packed tarball.
