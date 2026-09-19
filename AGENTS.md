# fuji-ui-react agent guide

Read this file before changing the repository. Read `SPEC.md` for locked public
contracts, `ARCHITECTURE.md` for the build pipeline and why it is shaped the way
it is, and `CONTRIBUTING.md` for the change workflow. Preserve existing user
changes. Do not commit, push, reset, or discard work unless explicitly asked.

## Project status

This repository is the **source of truth** for `@fujiui/react`: a themeable,
accessible React component system published to npm. The sibling
`fuji-ui-website` repository is its documentation site and a **consumer** of the
published package - it has no copy of the component source. Behavior,
appearance, and public API changes are made here, then packed/published, then
consumed there.

Current release line: pre-1.0 (`0.x`; `0.3.0` is the next release). The public API is intended to
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

- `src/components/fuji/<component>/` - one directory per component (82 of them -
  fewer than the 86 components, because a few directories export more than one),
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
- `registry/` - the **authored** half of `dist/registry.json`: per-component
  category/summary/keywords (`metadata.json`), the contract rules an agent must
  follow (`conventions.json`), and one markdown file of worked examples per
  component (`examples/`). Everything else in the registry is generated from
  source. Deliberately not under `src/` - tsup's pass-1 entry glob is
  `src/**/*.{ts,tsx}`, so data files there would compile into `dist/esm/` and
  ship as dead JS. Excluded from the tarball by the `files` whitelist.
- `scripts/` - the build steps (`build-css.mjs` + `css-entry.css`,
  `fix-esm-extensions.mjs`, `gen-props.mjs`, `build-registry.mjs`), the
  registry seeder (`seed-registry-metadata.mjs`), the CI guard
  (`check-skill-sync.mjs`), and dev helpers (`watch-css.mjs`,
  `sync-linked.mjs`, `build-storybook-css.mjs`, `render-gallery.mjs`,
  `pack-fixtures.mjs`, `codemod-imports.mjs`).
- `tsup.config.ts` - the three-pass JS build. Read `ARCHITECTURE.md` before
  touching it.
- `.claude/skills/` and `.codex/skills/` - review/audit skills, kept byte-identical.
- `plugins/fuji-ui/` and `.claude-plugin/` - the Claude Code plugin and the
  consumer `fuji-ui` skill. Not published to npm.

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
npm run storybook      # rebuilds both stylesheets, then serves on :6006
npm run fixtures:pack  # build + pack into fixtures/fuji-pack.tgz (see fixtures/README.md)
```

Full pre-handoff gate (mirrors CI): `format:check`, `skills:check`, `lint`,
`typecheck`, `build`, `test`, then `npm pack --dry-run` and inspect the file
list.

**Anything visual needs a rendered page as well as the gate.** Unit tests
assert classes and attributes, which is exactly the wrong altitude for token
work: the dark theme once painted a light page under dark surfaces with every
test passing, because the class names were all correct. Use
`node scripts/render-gallery.mjs` (sixteen appearance combinations, SSR-rendered
against the built CSS, output in the gitignored `.gallery/`) or Storybook. See
`DESIGN.md` for what the sweep covers.

## Non-negotiable rules

### Framework independence

- **Never import a framework-specific module.** No `next/*`, no router, no
  meta-framework API, no website code. This package must run unchanged in
  Next.js, Vite, CRA, and a bare bundler setup.
- **Never import `@/*` path aliases.** They do not exist here; all internal
  imports are relative.
- Keep `react` and `react-dom` as peer dependencies. Runtime dependencies stay
  limited to `@base-ui/react`, `clsx`,
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
  `ComponentAppearance`, `FujiTheme`, `FujiMaterial`, `FujiRadius`,
  `FujiElevation`, `OverlayMobileBehavior`, `SlotClassNames`) are reused, not
  redeclared per component. `ComponentTone` (`default`/`fire`/`water`/`forest`/`sun`)
  is for purely decorative color choices; `StatusTone`
  (`default`/`success`/`warning`/`danger`/`info`) is for props whose value
  carries semantic/ARIA-relevant meaning - its prop name and values never
  change, only its internal mapping to a `ComponentTone` for styling.
- Icon props take a **component reference** typed as `IconComponent`, never a
  string name or a pre-rendered element, and never a Lucide-pinned type.
- Every `<button>` carries an explicit `type`. Every icon-only control requires
  an accessible name at the **type level** (a required `aria-label`, as on
  `IconButton` and `DismissButton`).
- Do not add per-component `theme`/`material`/`radius`/`elevation` props. Appearance is
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
version and re-running the suite is the only real proof. CI's `react18` job
does exactly that (`npm install --no-save --legacy-peer-deps react@^18.3 …`
then `typecheck` + `test`); run the same two commands locally when you touch
anything in the two traps above.

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
- Glass (`material="glass"`, mirrored as `data-fuji-material="glass"`) is a
  material that layers translucency and blur over the active theme, not a
  replacement palette - it must never declare its own `--fuji-background`/
  `--fuji-foreground`. Those, and the tone colors, fall through the cascade
  from whichever `[data-fuji-theme="light"]`/`[data-fuji-theme="dark"]` block
  is active on the same element; glass only contributes translucent
  `--fuji-surface*` fills, `--fuji-backdrop-blur*`/`--fuji-backdrop-saturate*`,
  and the handful of tokens documented inline in `tokens.css` as deliberately
  fixed because they pair with glass's own high-alpha fills. It has opaque
  fallbacks under `prefers-reduced-transparency: reduce` and where
  `backdrop-filter` is unsupported. The decorative `.fuji-glass-atmosphere`
  gradient canvas is opt-in (a consumer applies the class themselves) - do not
  reintroduce it as something glass paints automatically. Its
  `--fuji-glass-atmosphere-image` value is intentionally hard-coded per glass
  tint (dark/light), not built from `--fuji-background`/`--fuji-foreground`
  or any other theme token - it is fixed reference art, not a themed
  rendering, so do not wire it to theme tokens on the assumption that it
  should track them; see `docs/theming.md#the-atmosphere-is-opt-in` for the
  consumer-facing framing. It is a
  `FujiProvider` axis independent of `theme`: key the BASE glass block on
  `data-fuji-material` alone, never compounded with `data-fuji-theme` - it and
  `[data-fuji-theme="dark"]` are both (0,1,0), so their source order is
  load-bearing and compounding the base block would break it. The deliberate
  exception is the light tint: `[data-fuji-material="glass"][data-fuji-theme="light"]`
  is the documented light-tinted surface (`SPEC.md` §2), and at (0,2,0) it
  overrides the base block by specificity rather than order. Do not "simplify"
  those blocks away. Anything a tint must NOT change stays in the base block.
  `floating` elevation's only effect is deeper shadows; neither mode adds
  scale, motion, or geometry changes to static surfaces (control heights and
  panel padding are identical between the two - see `SPEC.md` §2).
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
5. Run `format:check`, `skills:check`, `lint`, `typecheck`, `build`, `test`.
6. Add a changeset for any user-facing change (`npm run changeset`).
7. For visual or integration changes, verify against the sibling
   `fuji-ui-website` using a packed tarball - see `CONTRIBUTING.md`.
8. Inspect the diff before handoff.

## Skills

Review and audit skills live in `.claude/skills/` and `.codex/skills/` and are
kept byte-identical. `npm run skills:check` enforces that, and the
`metadata: internal: true` flag each one needs so `npx skills add` does not
install it into apps (see "The Claude Code plugin and the skill" in
ARCHITECTURE.md). They default to
review-only: they report findings, they do not edit, unless the user explicitly
asks for fixes.
