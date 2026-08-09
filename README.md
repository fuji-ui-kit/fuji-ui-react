# @fujiui/react

Fuji is a themeable, accessible React component system: light, dark, and glass
themes; cornered or soft radius; regular or floating elevation - all driven by
a single provider. It ships ~90 components (Button through DataTable, Dialog,
Carousel, Chart...), a compiled stylesheet, and full TypeScript types.

- Works with **React 18 and React 19**
- Works in **Next.js** (App Router, Server/Client Components), **Vite**, and
  plain **Create React App**-style setups
- **SSR and hydration** safe
- No Tailwind configuration required by consumers - one compiled stylesheet

> Status: pre-1.0 (`0.1.x`). The public API is actively stabilizing, and
> breaking changes may still land under a minor version bump until 1.0.

## Installation

```bash
npm install @fujiui/react
```

`react` and `react-dom` (^18.0.0 or ^19.0.0) are peer dependencies - install
them yourself if your project doesn't already have them.

## CSS setup

Import the compiled stylesheet **once**, at your app's root:

```ts
import "@fujiui/react/styles.css";
```

That's it - no Tailwind config, no PostCSS setup, no build-step integration.
`styles.css` contains the design tokens, every utility class Fuji's own
components use, and the shared base rules (focus styles, glass surfaces,
portal theming). See [docs/nextjs.md](docs/nextjs.md) and
[docs/vite.md](docs/vite.md) for exactly where to put this per framework.

If you only want the raw `--fuji-*` custom properties (e.g. to build your own
utility layer against them), import `@fujiui/react/tokens.css` instead - it's
already included inside `styles.css`, so only reach for it standalone if you
specifically don't want the compiled utilities too.

## Quick start

```tsx
import "@fujiui/react/styles.css";
import { FujiProvider, Button } from "@fujiui/react";

export default function App() {
  return (
    <FujiProvider defaultTheme="light" defaultRadius="cornered">
      <Button tone="forest">Save changes</Button>
    </FujiProvider>
  );
}
```

## FujiProvider

`FujiProvider` is **optional**. Every component falls back to `light` theme,
`cornered` radius, and `regular` elevation when rendered with no provider
ancestor - so you can adopt Fuji incrementally, or use components inside
isolated contexts (a design-system storybook entry, a portal) that don't want
the global provider.

```tsx
<FujiProvider
  theme="glass" // controlled - omit for uncontrolled
  defaultTheme="light" // uncontrolled initial value
  onThemeChange={(theme) => {}}
  radius="soft"
  defaultRadius="cornered"
  onRadiusChange={(radius) => {}}
  elevation="floating"
  defaultElevation="regular"
  onElevationChange={(elevation) => {}}
  persist // only the root app provider should set this
  className="optional-class-on-the-scope-wrapper"
>
  <App />
</FujiProvider>
```

- **Controlled or uncontrolled**, independently, per axis (`theme`/`radius`/`elevation`).
  Pass the value prop to control it; omit it (optionally with the matching
  `default*` prop) to let the provider manage its own state.
- **`persist`**: when `true`, the provider reads/writes the combined
  theme+radius+elevation preference to `localStorage` (key: `fuji-appearance`)
  and hydrates from it on mount. Only the **root** app provider should set
  this - nested/preview providers (e.g. a "compare themes side by side" demo
  block) must leave it `false` so they stay isolated and never overwrite the
  real app preference.
- **Nested providers**: fully supported. A nested `FujiProvider` creates its
  own isolated scope (`data-fuji-theme`/`data-fuji-radius`/`data-fuji-elevation`
  on a wrapper `<div className="fuji-theme-scope">`), useful for
  side-by-side theme previews without affecting the rest of the page.
- **Portal-rendered content** (Dialog, Popover, Menu, Select, Tooltip, Toast,
  etc.) automatically re-stamps the active theme/radius/elevation onto its own
  portalled root, so it always matches the provider it logically belongs to,
  even though it renders outside that DOM subtree.
- **Reduced motion**: Fuji's own transitions respect
  `prefers-reduced-motion: reduce` automatically (durations collapse to `0ms`,
  a few explicit animations are disabled) - no provider configuration needed.

`useFujiConfig()` reads the active values (and their setters) from anywhere
inside a provider; it returns the same `light`/`cornered`/`regular` fallback
defaults when called with no provider ancestor:

```tsx
import { useFujiConfig } from "@fujiui/react";

function AppearanceLabel() {
  const { theme, radius, elevation, setTheme, setRadius, setElevation } = useFujiConfig();
  return (
    <span>
      {theme} · {radius} · {elevation}
    </span>
  );
}
```

## Themes, radius, elevation

Three independent global axes, set once on `FujiProvider`:

| Axis        | Values                       | Default    |
| ----------- | ---------------------------- | ---------- |
| `theme`     | `light` \| `dark` \| `glass` | `light`    |
| `radius`    | `cornered` \| `soft`         | `cornered` |
| `elevation` | `regular` \| `floating`      | `regular`  |

There is no per-component theme/radius prop - every component reads the same
provider-scoped `--fuji-*` tokens, so an interface stays visually coherent by
construction. `glass` is a translucent, layered surface system (with opaque
fallbacks under `prefers-reduced-transparency: reduce` or when
`backdrop-filter` is unsupported), not a simple color swap. `floating` and
`regular` elevation differ in shadow depth only - control sizing is identical
between the two - and neither adds scale or hover motion to static surfaces.
See [docs/theming.md](docs/theming.md) for the token families,
how to override them safely, and how the glass and reduced-motion fallbacks
work.

## Component imports

Import everything from the package root - there are no per-component subpath
imports (no `@fujiui/react/button`):

```tsx
import { FujiProvider, Button, Card, Dialog, Input, Carousel, Chart, ChatBubble } from "@fujiui/react";

import type {
  ComponentSize,
  ComponentTone,
  StatusTone,
  ComponentAppearance,
  FujiTheme,
  FujiRadius,
  FujiElevation,
} from "@fujiui/react";
```

## TypeScript

Full `.d.ts` declarations ship with the package - no separate `@types`
package needed. Every component's prop type is exported (e.g. `ButtonProps`,
`DialogContentProps`), alongside the shared types above. Compound components
(`Dialog`, `Popover`, `Tabs`, `Select`, `DropdownMenu`, ...) expose named
sub-exports (`DialogContent`, `DialogTrigger`, ...) in addition to the
dot-access form (`Dialog.Content`) - see [docs/nextjs.md](docs/nextjs.md) for
why the named form matters in a Server Component.

## Controlled vs. uncontrolled

Interactive components follow one consistent convention throughout: a
`value`/`onChange` pair for controlled usage, or `defaultValue` (plus
`onChange` if you just want to observe changes) for uncontrolled usage -
exactly like a native `<input>`. This applies to form controls (`Input`,
`Select`, `Checkbox`, `Slider`, ...), navigational state (`Tabs`, `Carousel`'s
`index`/`defaultIndex`), and overlays (`Dialog`/`Drawer`'s `open`/`defaultOpen`
via Base UI's own root components).

```tsx
// Uncontrolled
<Input defaultValue="Ada" onChange={(e) => console.log(e.target.value)} />;

// Controlled
const [value, setValue] = useState("Ada");
<Input value={value} onChange={(e) => setValue(e.target.value)} />;
```

## Icon usage

Fuji's `Icon` component (and any Fuji prop documented as accepting an icon,
e.g. `Rating`'s `icon`) takes an **icon component reference**, not a string
name or a pre-rendered element - pass individually imported icons so unused
icons stay tree-shakeable:

```tsx
import { Icon } from "@fujiui/react";
import { Check } from "lucide-react";

<Icon icon={Check} label="Completed" />; // labeled: exposed to assistive tech
<Icon icon={Check} />; // decorative: aria-hidden
```

Lucide is the default/recommended icon set and the one every built-in Fuji
component uses internally, but the icon prop type (`IconComponent`) isn't
pinned to Lucide specifically - any component accepting standard SVG props
(`className`, etc.) works, so you can swap in another icon set or a
hand-written SVG component where practical.

## SSR and hydration

Every component is safe to render on the server: nothing touches `window`,
`document`, or browser-only APIs during the initial render (guarded checks
defer that work to `useEffect`/`useLayoutEffect`, which never run during SSR).
`FujiProvider` itself never mismatches between server and client output - see
[docs/ssr.md](docs/ssr.md) for the full explanation and the optional
pre-paint bootstrap script pattern (recommended when using `persist`, so a
returning visitor's saved theme never flashes the default on load).

## Accessibility

See [docs/accessibility.md](docs/accessibility.md) for the full notes.
Highlights: every icon-only control requires an accessible name (enforced at
the type level, e.g. `IconButton`'s `aria-label` is a required prop), roving
tabindex composite widgets (`Tree`, `ButtonGroup`, `Rating`, `Calendar`'s date
grid) implement full keyboard navigation, and interactive states (disabled,
loading, invalid, selected) are reflected in both the visual style and ARIA
attributes.

## Framework guides

- [docs/theming.md](docs/theming.md) - the `--fuji-*` token system, overriding tokens, glass, elevation, and reduced motion.
- [docs/nextjs.md](docs/nextjs.md) - App Router, Server/Client Components, the compound-component boundary rule.
- [docs/vite.md](docs/vite.md) - Vite and other bundler-based standard React apps.
- [docs/ssr.md](docs/ssr.md) - SSR/hydration details and the appearance bootstrap script.
- [docs/migration.md](docs/migration.md) - migrating from local/vendored Fuji component source to this package.

## Development

This repo builds the package itself. Common commands:

```bash
npm ci
npm run build       # dist/esm/**, dist/index.cjs, dist/index.d.ts, dist/index.d.cts, dist/styles.css, dist/tokens.css
npm test            # vitest
npm run lint
npm run typecheck
npm run format:check
npm run changeset    # record a change for the next release
```

Contributor guides live in the repository (they are not part of the published
package): [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow,
[AGENTS.md](AGENTS.md) for the working rules, [SPEC.md](SPEC.md) for the locked
public contracts, and [ARCHITECTURE.md](ARCHITECTURE.md) for how the build is
put together and why.

## License

MIT. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for bundled
dependencies' licenses (Lucide, Base UI, class-variance-authority, clsx,
tailwind-merge).
