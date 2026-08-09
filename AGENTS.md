# fuji-ui-react agent guide

Read this file before changing the repository. Read `SPEC.md` for locked public
contracts, `ARCHITECTURE.md` for the build pipeline and why it is shaped the way
it is, and `CONTRIBUTING.md` for the change workflow. Preserve existing user
changes. Do not commit, push, reset, or discard work unless explicitly asked.

## Project status

This repository is the **source of truth** for `@fuji-ui/react`: a themeable,
accessible React component system published to npm. The sibling
`fuji-ui-website` repository is its documentation site and a **consumer** of the
published package - it has no copy of the component source. Behavior,
appearance, and public API changes are made here, then packed/published, then
consumed there.

Current release line: pre-1.0 (`0.1.0-alpha.x`). The public API is intended to
be stable, but breaking changes may still land under a minor bump until 1.0.

Stack: TypeScript (strict), React 18 **and** 19 as peer dependencies, Base UI
(`@base-ui/react`), Tailwind CSS v4 used as a **build-time** tool only, tsup /
esbuild for the JS build, PostCSS for the CSS build, Vitest + Testing Library +
jest-axe for tests, Changesets for releases, npm with `package-lock.json`.

## Sources of truth

- `src/` - the component implementation, provider, hooks, types, and styles.
- `src/index.ts` - the entire public surface. If it is not exported here, it is
  not public.
- `src/styles/tokens.css` - every `--fuji-*` design token value.
- `SPEC.md` - locked public contracts (appearance axes, API conventions,
  packaging shape). Do not change these casually.
- `ARCHITECTURE.md` - the three-pass build, `"use client"` preservation, ESM
  extension rewriting, and the CSS pipeline.
- `package.json` - `exports`, `files`, peer/runtime deps, and all commands.
- `README.md` + `docs/` - consumer-facing documentation. `docs/` ships inside
  the published tarball.

When documentation and source disagree, the source wins - then fix the
documentation. Do not copy claims between docs without verifying them against
`src/`.

## Repository map

- `src/components/fuji/<component>/` - one directory per component (83 of them),
  each with its implementation plus an `index.ts` barrel.
- `src/components/fuji/lib/` - **internal** shared helpers:
  `appearance.ts` (the variant × appearance class recipe),
  `field-surface.ts` (shared text-entry surface recipe),
  `use-portal-theme-attrs.ts` (re-stamps `data-fuji-*` onto Base UI portals),
  `dismiss-button.tsx` (the shared dismiss control - this one **is** public).
- `src/provider/` - `FujiProvider` and `useFujiConfig`.
- `src/hooks/useControllableState.ts` - the controlled/uncontrolled helper every
  stateful component uses.
- `src/lib/` - `cn.ts` (clsx + tailwind-merge) and `appearance-storage.ts`
  (the `persist` storage read/write).
- `src/types/index.ts` - shared public types.
- `src/styles/` - `tokens.css` (token values), `fuji-theme.css` (token →
  Tailwind `@theme` mapping), `base.css` (hand-written reusable base rules).
- `scripts/` - `build-css.mjs`, `css-entry.css`, `fix-esm-extensions.mjs`,
  `check-skill-sync.mjs`.
- `tsup.config.ts` - the three-pass JS build. Read `ARCHITECTURE.md` before
  touching it.
- `.claude/skills/` and `.codex/skills/` - review/audit skills, kept byte-identical.

## Commands

```bash
npm ci
npm run build          # build:js (tsup) + build:css (postcss/tailwind)
npm test               # vitest run
npm run test:watch
npm run lint           # eslint
npm run typecheck      # tsc --noEmit
npm run format:check   # prettier --check
npm run changeset      # record a user-facing change for the next release
```

Full pre-handoff gate (mirrors CI): `format:check`, `lint`, `typecheck`, `test`,
`build`, then `npm pack --dry-run` and inspect the file list.

## Non-negotiable rules

### Framework independence

- **Never import a framework-specific module.** No `next/*`, no router, no
  meta-framework API, no website code. This package must run unchanged in
  Next.js, Vite, CRA, and a bare bundler setup.
- **Never import `@/*` path aliases.** They do not exist here; all internal
  imports are relative.
- Keep `react` and `react-dom` as peer dependencies. Runtime dependencies stay
  limited to `@base-ui/react`, `class-variance-authority`, `clsx`,
  `lucide-react`, and `tailwind-merge`. Adding a runtime dependency is a
  deliberate, discussed decision - it lands in every consumer's bundle.
- Tailwind is a **build-time** dependency only. Consumers must never need a
  Tailwind config, PostCSS setup, or bundler plugin.

### Server/Client boundary

This is the single easiest thing to break, and it breaks silently for
consumers rather than here.

- A component gets `"use client"` **only if it needs it** - state, effects,
  refs to browser APIs, event handlers, or a Base UI primitive that is itself
  client-only.
- Presentational components (`Icon`, `Typography`, `Box`, `Container`,
  `Divider`, `Kbd`, `Card`, `Timeline`, `Alert`, `Table`, ...) must stay free of
  `"use client"` so a Next.js Server Component can render them **and pass a
  component reference as a prop** (`<Icon icon={SearchX} />`). Adding a
  needless `"use client"` to one of these is a real, user-visible regression:
  it turns "Functions cannot be passed directly to Client Components" into a
  build failure in consumer apps.
- The directive must be the **first line** of the file, so the build's
  per-file preservation step finds it. See `ARCHITECTURE.md`.
- Compound components expose **named sub-exports** (`DialogContent`) in
  addition to dot-access (`Dialog.Content`), because a Server Component cannot
  read a static property off a client-module binding.

### Public API conventions

- Everything public is exported from `src/index.ts`. There are no subpath
  imports - do not add any, and do not document any.
- Every component: forwards its ref, spreads remaining native props, accepts
  `className` merged through `cn`, and uses `classNames` for named internal
  slots where it has them.
- Stateful components follow the native-input convention: `value`/`onChange`
  controlled, `defaultValue` uncontrolled, via `useControllableState`. Never
  invent a third pattern.
- Shared types (`ComponentSize`, `ComponentTone`, `StatusTone`,
  `ComponentAppearance`, `FujiTheme`, `FujiRadius`, `FujiElevation`,
  `OverlayMobileBehavior`, `SlotClassNames`) are reused, not redeclared per
  component. `ComponentTone` (`default`/`earth`/`fire`/`water`/`forest`/`sun`)
  is for purely decorative color choices; `StatusTone`
  (`default`/`success`/`warning`/`danger`/`info`) is for props whose value
  carries semantic/ARIA-relevant meaning - its prop name and values never
  change, only its internal mapping to a `ComponentTone` for styling.
- Icon props take a **component reference** typed as `IconComponent`, never a
  string name or a pre-rendered element, and never a Lucide-pinned type.
- Every `<button>` carries an explicit `type`. Every icon-only control requires
  an accessible name at the **type level** (a required `aria-label`, as on
  `IconButton` and `DismissButton`).
- Do not add per-component `theme`/`radius`/`elevation` props. Appearance is
  global and provider-owned, by design.
- Renaming or removing an export, changing a prop's type, or changing a default
  is a **breaking change**. It needs a major changeset (or a minor one while
  pre-1.0) and a documented migration note.

### Cross-version React support

The package supports React 18 and 19 in one build. Two known traps:

- **Refs**: in React 19 a ref arrives via `props.ref`; in React 18 it does not.
  Code that reads a child's ref must check both (see `Button`'s `asChild`).
- **DOM attributes React versions disagree about** (`inert` is the known one):
  set them imperatively in a ref callback rather than as a JSX prop, so neither
  version's attribute handling is involved.

Test against both before claiming compatibility - swapping the installed React
version and re-running the suite is the only real proof.

### SSR safety

No component may read `window`, `document`, `localStorage`, or `matchMedia`
during render. Defer all of it to `useEffect`/`useLayoutEffect`. `FujiProvider`
must render identical output on server and client on first paint;
`persist` reconciles _after_ mount, which is a state update, not a hydration
mismatch.

### Styling

- Token values live only in `src/styles/tokens.css`. Components consume them
  through Tailwind utility classes mapped in `fuji-theme.css`, or through the
  `.fuji-*` recipe classes in `base.css`.
- Class names must be **statically written out**, never templated
  (`bg-fuji-${variant}` is never generated by Tailwind's scanner). This is why
  `lib/appearance.ts` spells out every combination.
- Tailwind only scans the paths listed as `@source` in `scripts/css-entry.css`.
  A new top-level source directory must be added there or its utilities will be
  missing from `dist/styles.css`.
- `styles.css` deliberately excludes Tailwind's preflight so the package never
  resets a consumer's global styles.
- Glass is a translucent layered surface system with opaque fallbacks under
  `prefers-reduced-transparency: reduce` and where `backdrop-filter` is
  unsupported - not a color swap. `floating` elevation's main effect is deeper
  shadows (`regular` also uses slightly more compact control sizing); neither
  mode adds scale or motion to static surfaces.
- Respect `prefers-reduced-motion: reduce` for any animation you add.

### Quality gates

- Do not weaken lint or TypeScript configuration to make something pass. No
  blanket `eslint-disable`, no `@ts-ignore`, no `any` in public types. A narrow,
  single-line, commented disable with a real justification is acceptable; a
  file-level or rule-level one is not.
- Behavior changes need tests. Accessibility-relevant components need a
  `jest-axe` assertion alongside behavioral tests.
- Keep `src/index.ts` and every component `index.ts` barrel synchronized with
  the files they export.

## Change workflow

1. `git status --short --branch`; preserve unrelated user changes.
2. Read the component, its barrel, `SPEC.md`, and the nearest existing
   equivalent before writing anything. Reuse the established pattern.
3. Make the change. Keep the `"use client"` boundary as narrow as it already is.
4. Update `src/index.ts`, the component barrel, tests, and `README.md`/`docs/`
   together in the same change.
5. Run `format:check`, `lint`, `typecheck`, `test`, `build`.
6. Add a changeset for any user-facing change (`npm run changeset`).
7. For visual or integration changes, verify against the sibling
   `fuji-ui-website` using a packed tarball - see `CONTRIBUTING.md`.
8. Inspect the diff before handoff.

## Skills

Review and audit skills live in `.claude/skills/` and `.codex/skills/` and are
kept byte-identical (`npm run skills:check` enforces this). They default to
review-only: they report findings, they do not edit, unless the user explicitly
asks for fixes.
