---
name: fuji-react-build-verification
description: Verify the built @fujiui/react artifacts - ESM/CJS output, "use client" preservation, ESM import extensions, TypeScript declarations, compiled CSS, the exports map, and the packed tarball contents. Use after changing tsup.config.ts, the CSS pipeline, package.json exports/files, or before a release.
# Contributor skill for working on this repository. Hidden from `npx skills add`,
# which would otherwise install it into apps that only use @fujiui/react.
metadata:
  internal: true
---

# Fuji React build verification

## Purpose

The build is three tsup passes plus a PostCSS pass, and each part of that shape
exists to fix a specific, reproducible consumer failure. Most build regressions
here produce a **successful build with broken output** - which is why this is a
checklist against the artifacts, not a "did it exit 0" check.

Read `ARCHITECTURE.md` before starting. Default to review-only.

## Procedure

```bash
npm run build
```

Then work through every check below against `dist/`. Report what you actually
ran and what it actually printed.

## Checks

### Output shape

Expected in `dist/`:

| Path          | What it is                                |
| ------------- | ----------------------------------------- |
| `esm/**/*.js` | unbundled ESM, one file per source module |
| `index.cjs`   | bundled CommonJS                          |
| `index.d.ts`  | consolidated declarations (ESM)           |
| `index.d.cts` | consolidated declarations (CJS)           |
| `styles.css`  | compiled stylesheet                       |
| `tokens.css`  | raw custom properties                     |

`dist/esm/` must be a **tree** mirroring `src/`, not a single bundled file. If
it collapsed to one file, every export became client-only - see below.

### `"use client"` preservation (highest-risk check)

```bash
head -1 dist/esm/components/fuji/button/Button.js    # expect: "use client";
head -1 dist/esm/components/fuji/icon/Icon.js        # expect: NOT "use client";
head -1 dist/index.cjs                               # expect: "use client";
```

Then verify the counts match the source:

```bash
grep -rl '^"use client"' src --include='*.tsx' --include='*.ts' | grep -v test | wc -l
grep -rl '^"use client"' dist/esm | wc -l
```

A mismatch means directives were dropped. Two causes: esbuild stripping them
(the `onSuccess` restore step failed), or a source file where the directive is
not the literal first line so the restore step never saw it. Both ship silently.

### ESM import extensions

Native Node ESM requires explicit extensions and has no directory-index
resolution. `scripts/fix-esm-extensions.mjs` rewrites them after the build.

```bash
grep -rn "from ['\"]\.\.\?/[^'\"]*['\"]" dist/esm | grep -v "\.js['\"]" | head
```

Any hit is a file that will throw `ERR_UNSUPPORTED_DIR_IMPORT` or
`ERR_MODULE_NOT_FOUND` for a plain-Node consumer, even though every bundler
resolves it fine. Confirm end to end:

```bash
node --input-type=module -e "import('./dist/esm/index.js').then(m => console.log(Object.keys(m).length))"
```

### CJS

```bash
node -e "const m = require('./dist/index.cjs'); console.log(Object.keys(m).length)"
```

The export count should match the ESM entry.

### Declarations

- `dist/index.d.ts` and `dist/index.d.cts` both exist and are non-trivial.
- Every runtime export has a corresponding type export.
- No `any` leaked into a public signature.
- No declaration references a path inside `src/` (a leaked source path breaks
  consumer typechecking).

### CSS

```bash
grep -c '\--fuji-' dist/styles.css
grep -c '\--fuji-' dist/tokens.css
```

- `styles.css` contains the tokens, the base/recipe rules, and the utility
  classes Fuji's components use.
- It must **not** contain Tailwind's preflight reset (a global `*` reset,
  `box-sizing` on every element, margin zeroing, heading font-size collapse).
  Shipping that would reset every consuming app's global styles.
- Spot-check that utilities actually used by components are present. A class
  used in a source file under a directory missing from `@source` in
  `scripts/css-entry.css` silently never gets generated. If a component was
  moved or a new top-level source directory added, verify `@source` covers it.
- Templated class names (`bg-fuji-${variant}`) are never generated - grep the
  diff for any introduced template literal in a `className`.

### `exports` map and `files`

- `exports` resolves `.` (types/import/require), `./styles.css`,
  `./tokens.css`, `./package.json` - and nothing else.
- `main`, `module`, and `types` point at files that exist. Note `module` points
  at `./dist/esm/index.js`; there is no `dist/index.js`.
- `sideEffects: ["**/*.css"]` so JS tree-shakes and CSS is never dropped.

### Packed tarball

```bash
npm pack --dry-run
npm pack && tar -tzf *.tgz | sort
```

Must contain: `dist/**`, `docs/**`, `README.md`, `LICENSE`, `package.json`,
`CHANGELOG.md`, `THIRD_PARTY_NOTICES.md`.

Must **not** contain: any `src/`, any `*.test.*`, `tsconfig.json`,
`eslint.config.mjs`, `vitest.config.ts`, `.env*`, `.github/`, `.claude/`,
`.codex/`, `scripts/`, or another `.tgz`.

Remember npm always adds `README.md`, `LICENSE`, and `package.json` regardless
of `files` - everything else must be whitelisted explicitly. Check the reported
tarball size for an unexplained jump.

### Consumer smoke test

The real proof is a consumer install. The repo's own fixtures do this without
touching the website:

```bash
npm run fixtures:pack          # builds + packs to fixtures/fuji-pack.tgz
(cd fixtures/nextjs && npm install && npm run build)
(cd fixtures/vite && npm install && npm run build)
```

The sibling `fuji-ui-website` is a second consumer when a release is being
cut (`npm install ../fuji-ui-react/fuji-ui-react-<version>.tgz` there).

A Server/Client boundary regression usually surfaces here as a build error
naming the component. A missing CSS utility surfaces as unstyled markup, which
the build will not catch - check visually.

## Output

Default to review-only. Report a table of check → expected → actual → pass/fail,
then findings sorted Critical → High → Medium → Low with evidence (real command
output) and the minimal fix. Distinguish clearly between checks you ran and
checks you skipped; a skipped check is an open question, not a pass. Finish with
the commands run and any assumption you made about the environment.
