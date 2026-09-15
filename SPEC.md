# @fujiui/react - locked contracts

This file records the decisions that are **settled**. Changing anything here is
a deliberate public-contract change: it needs a changeset, a documented
migration path, and updates to `README.md`/`docs/` in the same change. Treat it
as the reference when reviewing whether a proposed change is a refactor or a
break.

`AGENTS.md` describes how to work in this repo. This file describes what must
stay true.

---

## 1. Scope

`@fujiui/react` ships reusable UI only: components, `FujiProvider`, shared
hooks/types, and the design-system CSS. It never ships application code, routes,
documentation pages, example apps, marketing assets, or framework integration
glue. Those belong in the consuming app (the sibling `fuji-ui-website` repo is
the reference consumer).

## 2. Global appearance

Four independent global axes, owned by `FujiProvider`, with no per-component
override:

| Axis        | Values                  | Default    |
| ----------- | ----------------------- | ---------- |
| `theme`     | `light` \| `dark`       | `light`    |
| `material`  | `solid` \| `glass`      | `solid`    |
| `radius`    | `cornered` \| `soft`    | `cornered` |
| `elevation` | `regular` \| `floating` | `regular`  |

- Values are mirrored as `data-fuji-theme`, `data-fuji-material`,
  `data-fuji-radius`, and `data-fuji-elevation` on the provider's scope
  wrapper (`<div className="fuji-theme-scope">`).
- `FujiProvider` is **optional**. With no provider ancestor, every component and
  `useFujiConfig()` fall back to `light` / `solid` / `cornered` / `regular`.
- Each axis is independently controlled (`theme` + `onThemeChange`) or
  uncontrolled (`defaultTheme`). `theme` and `material` are orthogonal -
  either theme renders in either material, so "dark mode" and "glass" are not
  a single mutually exclusive choice.
- `persist` writes the combined preference to `localStorage` under the key
  `fuji-appearance` and hydrates after mount. Only a root provider should set
  it; nested providers must not, so preview scopes never overwrite the real
  preference.
- Nested providers create isolated scopes and are fully supported.
- Portal-rendered content re-stamps the active `data-fuji-*` attributes onto its
  own portal root (`usePortalThemeAttrs`), so overlays match the provider they
  logically belong to.
- `material: "glass"` layers translucency and blur over whichever `theme` is
  active - it does not replace it. `--fuji-background`, `--fuji-foreground`,
  and the tone colors still come from `theme`; glass itself contributes
  translucent `--fuji-surface*` fills, `--fuji-backdrop-blur*`/
  `--fuji-backdrop-saturate*`, and a small set of tokens that intentionally
  stay fixed literals in both themes because they pair with glass's own
  high-alpha fills rather than with the page (documented inline in
  `tokens.css`). It has opaque fallbacks under
  `prefers-reduced-transparency: reduce` and where `backdrop-filter` is
  unsupported. The decorative gradient canvas some glass screenshots show is
  an opt-in class (`.fuji-glass-atmosphere`), not something the material
  paints automatically, and it is fixed decorative art independent of
  `theme` - two hard-coded variants keyed to the active theme, not a rendering
  of `--fuji-background`/`--fuji-foreground` or any override. Applying it
  replaces the theme's own background rather than deriving from it; a
  consumer's own backdrop (photo, brand gradient, plain color) is an
  equally valid, class-free alternative.
- Glass has no separate tint axis - the active `theme` **is** the glass tint.
  `[data-fuji-material="glass"][data-fuji-theme="light"]` is the light-tinted
  surface; `[data-fuji-material="glass"]` alone (unqualified, paired with
  `[data-fuji-theme="dark"]`) is the dark base. A consumer who wants a glass
  region tinted independently of the surrounding page nests a
  `<FujiProvider theme="dark" material="glass">`-shaped scope (re-declaring
  `material` too - nested providers don't inherit unspecified axes from an
  ancestor) around just that region - see `docs/upgrading.md`.
- `floating` and `regular` differ in shadow depth only - `floating` uses
  deeper, softer shadows. Control heights and panel padding are identical
  between the two modes; elevation never changes component geometry, and
  neither mode adds scale, translation, or hover motion to static surfaces.
- Fuji's own transitions collapse to `0ms` under
  `prefers-reduced-motion: reduce`, and a small set of explicit animations
  (count-up, carousel autoplay, indeterminate progress) stop entirely.

## 3. Public API surface

- **One entry point.** Everything public is exported from `src/index.ts` and
  imported from the package root. There are no subpath imports and none will be
  added. The only additional `exports` entries are `./styles.css`,
  `./tokens.css`, `./props.json`, `./registry.json` and `./package.json` -
  three stylesheets and manifests, and two generated descriptions of this
  package for tooling (see §7). None of them export components.
- Exported: `FujiProvider`, `useFujiConfig`, `FujiProviderProps`, every
  component and its props type, `DismissButton`/`DismissButtonProps`,
  `FujiPortal`, `IconComponent`, the appearance-bootstrap trio
  (`buildAppearanceBootstrapScript`, `APPEARANCE_STORAGE_KEY`,
  `StoredAppearance` - see §6), and the shared types below.
- Shared types: `FujiTheme`, `FujiMaterial` (`solid`/`glass`), `FujiRadius`,
  `FujiElevation`, `ComponentSize`
  (`sm`/`md`/`lg`), `ComponentTone`
  (`default`/`fire`/`water`/`forest`/`sun` - decorative color choices
  on components like `Button`/`Badge`/`Icon`), `StatusTone`
  (`default`/`success`/`warning`/`danger`/`info` - semantic/ARIA-relevant
  meaning on components like `Alert`/`Toast`/`Result`, each internally mapped
  to a `ComponentTone` for styling), `ComponentAppearance`
  (`contained`/`bordered`/`dashed`/`ghost`),
  `OverlayMobileBehavior` (`dialog`/`sheet`/`fullscreen`), and
  `SlotClassNames<Slots>`.
- Anything under `src/components/fuji/lib/` other than `dismiss-button` is
  **internal** and must not be exported.

## 4. Component conventions

Every component:

1. Forwards its ref to the element consumers would expect to reach.
2. Spreads remaining native props onto that element.
3. Accepts `className`, merged through `cn` (clsx + tailwind-merge) so consumer
   classes win.
4. Uses `classNames` (typed with `SlotClassNames`) for named internal slots when
   it has more than one styleable region.
5. Reuses the shared size/variant/appearance types rather than redeclaring them.
6. Gives every `<button>` an explicit `type`.
7. Requires an accessible name at the type level for any icon-only control.

Stateful components use the native-input convention exactly:
`value` + `onChange` for controlled, `defaultValue` for uncontrolled, both
routed through `useControllableState`. Overlays use `open`/`defaultOpen` via
Base UI's root components. There is no third pattern.

Icon props accept a **component reference** typed as
`IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>`. Not a
string name, not a rendered element, and deliberately not pinned to Lucide's own
type so consumers can substitute another icon set.

Compound components expose named sub-exports (`DialogContent`) alongside
dot-access (`Dialog.Content`). The named form is required for Server Component
consumers.

## 5. Server/Client split

- `"use client"` is applied **per component**, only where genuinely required
  (state, effects, event handlers, browser APIs, or a client-only Base UI
  primitive).
- Presentational components stay server-renderable. This is a public contract:
  consumers rely on being able to render them from a Server Component and pass
  them as component references.
- The directive must be the first line of its source file.

## 6. SSR and hydration

No component reads `window`, `document`, `localStorage`, or `matchMedia` during
render. `FujiProvider` produces identical server and client output on first
paint. `persist` reconciles after mount.

The pre-paint bootstrap script that avoids a theme flash **is** shipped, as
`buildAppearanceBootstrapScript()` plus the `APPEARANCE_STORAGE_KEY` it reads
and the `StoredAppearance` shape it parses. It returns a string for the app to
place in its own `<script>`; the package never injects it, so where and whether
it runs stays app-shell wiring, documented in `docs/ssr.md`.

This is a deliberate narrowing of §1's "no framework integration glue": the
script has to agree exactly with the storage key and payload shape `persist`
writes, and every consumer hand-copying it was one refactor away from a silent
mismatch that shows up only as a theme flash.

## 7. Packaging

- `type: "module"`, dual ESM + CJS, with TypeScript declarations for both.
- `exports`: `.` (types/import/require), `./styles.css`, `./tokens.css`,
  `./props.json`, `./registry.json`, `./package.json`.
- `dist/props.json` and `dist/registry.json` are **generated metadata about
  this package**, in the same category as `dist/index.d.ts` - not documentation
  pages, and not a second API surface. `props.json` is the prop tables the
  documentation site renders; `registry.json` is the fuller description that
  tooling reads (components, categories, summaries, compound parts, the
  `"use client"` boundary, design tokens, examples). Both are built from source
  on every `npm run build` and are never hand-edited; the authored half of the
  registry lives in `registry/`, which does not ship.
- ESM output is **unbundled per-file** under `dist/esm/` so `"use client"`
  boundaries survive at module granularity. CJS is a single bundled
  `dist/index.cjs`. Declarations are one consolidated `dist/index.d.ts` /
  `dist/index.d.cts`.
- `sideEffects: ["**/*.css"]` so JS tree-shakes and CSS is never dropped.
- Peer dependencies: `react` and `react-dom`, `^18.0.0 || ^19.0.0`.
- Runtime dependencies are limited to `@base-ui/react`,
  `clsx`, `lucide-react`, `tailwind-merge`.
- `files` whitelist: `dist`, `docs`, `CHANGELOG.md`, `THIRD_PARTY_NOTICES.md`
  (npm always adds `README.md`, `LICENSE`, `package.json`). No source, no tests,
  no config in the tarball.
- `engines.node >= 18.18`.

## 8. CSS delivery

- `@fujiui/react/styles.css` is a single pre-compiled stylesheet: design
  tokens, the token → Tailwind theme mapping, the hand-written base/recipe
  rules, and only the utility classes Fuji's own components use.
- `@fujiui/react/tokens.css` is the raw `--fuji-*` custom properties, already
  included inside `styles.css`.
- **Tailwind's preflight is deliberately excluded** - the package must never
  reset a consumer's global styles.
- Consumers need no Tailwind config, PostCSS setup, or bundler plugin. Tailwind
  is a build-time dependency of this repo only.
- Token values live only in `src/styles/tokens.css`.
- Utility class names must be written out statically; Tailwind's scanner cannot
  see templated strings.

## 9. Icons and licensing

Lucide is the default icon set and the only one used internally, imported as
individual named imports so unused icons stay tree-shakeable. Bundled
dependency licenses are recorded in `THIRD_PARTY_NOTICES.md` and must be updated
alongside any dependency change. The package is MIT.

## 10. Versioning

Semver, managed with Changesets. Every user-facing change carries a changeset.
While pre-1.0, breaking changes may land under a minor bump, but they are still
called out explicitly in the changeset and `CHANGELOG.md`. Renaming or removing
an export, changing a prop type, or changing a default value is breaking.
