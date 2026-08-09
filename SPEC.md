# @fuji-ui/react - locked contracts

This file records the decisions that are **settled**. Changing anything here is
a deliberate public-contract change: it needs a changeset, a documented
migration path, and updates to `README.md`/`docs/` in the same change. Treat it
as the reference when reviewing whether a proposed change is a refactor or a
break.

`AGENTS.md` describes how to work in this repo. This file describes what must
stay true.

---

## 1. Scope

`@fuji-ui/react` ships reusable UI only: components, `FujiProvider`, shared
hooks/types, and the design-system CSS. It never ships application code, routes,
documentation pages, example apps, marketing assets, or framework integration
glue. Those belong in the consuming app (the sibling `fuji-ui-website` repo is
the reference consumer).

## 2. Global appearance

Three independent global axes, owned by `FujiProvider`, with no per-component
override:

| Axis        | Values                       | Default    |
| ----------- | ---------------------------- | ---------- |
| `theme`     | `light` \| `dark` \| `glass` | `light`    |
| `radius`    | `cornered` \| `soft`         | `cornered` |
| `elevation` | `regular` \| `floating`      | `regular`  |

- Values are mirrored as `data-fuji-theme`, `data-fuji-radius`, and
  `data-fuji-elevation` on the provider's scope wrapper
  (`<div className="fuji-theme-scope">`).
- `FujiProvider` is **optional**. With no provider ancestor, every component and
  `useFujiConfig()` fall back to `light` / `cornered` / `regular`.
- Each axis is independently controlled (`theme` + `onThemeChange`) or
  uncontrolled (`defaultTheme`).
- `persist` writes the combined preference to `localStorage` under the key
  `fuji-appearance` and hydrates after mount. Only a root provider should set
  it; nested providers must not, so preview scopes never overwrite the real
  preference.
- Nested providers create isolated scopes and are fully supported.
- Portal-rendered content re-stamps the active `data-fuji-*` attributes onto its
  own portal root (`usePortalThemeAttrs`), so overlays match the provider they
  logically belong to.
- `glass` is a translucent, layered surface system with opaque fallbacks under
  `prefers-reduced-transparency: reduce` and where `backdrop-filter` is
  unsupported. It is not a background-color swap.
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
  added. `./styles.css`, `./tokens.css`, and `./package.json` are the only
  additional `exports` entries.
- Exported: `FujiProvider`, `useFujiConfig`, `FujiProviderProps`, every
  component and its props type, `DismissButton`/`DismissButtonProps`,
  `FujiPortal`, `IconComponent`, and the shared types below.
- Shared types: `FujiTheme`, `FujiRadius`, `FujiElevation`, `ComponentSize`
  (`sm`/`md`/`lg`), `ComponentTone`
  (`default`/`earth`/`fire`/`water`/`forest`/`sun` - decorative color choices
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
paint. `persist` reconciles after mount. The pre-paint bootstrap script that
avoids a theme flash is documented in `docs/ssr.md` as app-shell wiring - the
package does not ship it.

## 7. Packaging

- `type: "module"`, dual ESM + CJS, with TypeScript declarations for both.
- `exports`: `.` (types/import/require), `./styles.css`, `./tokens.css`,
  `./package.json`.
- ESM output is **unbundled per-file** under `dist/esm/` so `"use client"`
  boundaries survive at module granularity. CJS is a single bundled
  `dist/index.cjs`. Declarations are one consolidated `dist/index.d.ts` /
  `dist/index.d.cts`.
- `sideEffects: ["**/*.css"]` so JS tree-shakes and CSS is never dropped.
- Peer dependencies: `react` and `react-dom`, `^18.0.0 || ^19.0.0`.
- Runtime dependencies are limited to `@base-ui/react`,
  `class-variance-authority`, `clsx`, `lucide-react`, `tailwind-merge`.
- `files` whitelist: `dist`, `docs`, `CHANGELOG.md`, `THIRD_PARTY_NOTICES.md`
  (npm always adds `README.md`, `LICENSE`, `package.json`). No source, no tests,
  no config in the tarball.
- `engines.node >= 18.18`.

## 8. CSS delivery

- `@fuji-ui/react/styles.css` is a single pre-compiled stylesheet: design
  tokens, the token → Tailwind theme mapping, the hand-written base/recipe
  rules, and only the utility classes Fuji's own components use.
- `@fuji-ui/react/tokens.css` is the raw `--fuji-*` custom properties, already
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
