# SSR and hydration

## What Fuji guarantees out of the box

Every component renders identically on the server and the client on first
paint:

- No component reads `window`, `document`, `localStorage`, or `matchMedia`
  during render. Anything that needs a browser API (media queries, measuring
  a node, IntersectionObserver) is deferred to `useEffect`/`useLayoutEffect`,
  which React never runs during server rendering - so there is nothing to
  mismatch.
- `FujiProvider` renders its default (or your `default*`-prop) values on the
  very first render, server and client alike. If you don't use `persist`,
  that's the whole story: no bootstrap script, no flash, nothing else to do.
- `useLayoutEffect`-based logic (e.g. hydrating a persisted value) is guarded
  to become a no-op `useEffect` on the server, avoiding React's
  "useLayoutEffect does nothing on the server" warning.

## The one thing SSR doesn't solve by itself: a flash of the default theme

If you turn on `FujiProvider`'s `persist` prop, the provider hydrates the
user's saved theme/material/radius/elevation from `localStorage` - but only
_after_ mount (`localStorage` isn't available during SSR). Between the server-rendered
HTML (using your `default*` props) and that post-mount hydration, a returning
visitor whose saved theme differs from the default will see one frame of the
wrong theme before it corrects itself.

This is the same class of problem every "remember the user's theme" feature
has (dark-mode toggles included), and the standard fix is the same: a tiny,
synchronous, pre-paint script that reads storage and stamps the right
attributes onto `<html>` **before** your framework's own hydration runs. Fuji ships
the script as a function so the storage key and validation can never drift
from the provider's:

`@fujiui/react` exports the script, already wired to the same storage key
`FujiProvider persist` reads (`APPEARANCE_STORAGE_KEY`, `"fuji-appearance"`):

```ts
import { buildAppearanceBootstrapScript } from "@fujiui/react";

// Pass the same defaults your root <FujiProvider> uses.
const BOOTSTRAP = buildAppearanceBootstrapScript({
  theme: "light",
  material: "solid",
  radius: "cornered",
  elevation: "regular",
});
```

It reads storage inside `try/catch`, validates every value against the
allowed lists, stamps `data-fuji-theme` / `-material` / `-radius` / `-elevation`
onto `<html>`, and finally removes a `data-fuji-boot` attribute - render
`<html data-fuji-boot>` from the server and Fuji's stylesheet suppresses
colour transitions for that one swap, so the persisted appearance never
animates in from the default. All four axes - `theme`, `material`, `radius`,
and `elevation` - are real user preferences and persist the same way; glass
has no separate tint axis to carve out an exception for (it follows `theme`).

Then run it as early as possible - in Next.js, via `next/script` with
`strategy="beforeInteractive"` in the root layout's `<head>`:

```tsx
import Script from "next/script";
import { buildAppearanceBootstrapScript } from "@fujiui/react";

const BOOTSTRAP = buildAppearanceBootstrapScript({
  theme: "light",
  material: "solid",
  radius: "cornered",
  elevation: "regular",
});

// inside <head>:
<Script
  id="appearance-bootstrap"
  strategy="beforeInteractive"
  dangerouslySetInnerHTML={{ __html: BOOTSTRAP }}
/>;
```

In a plain Vite/CRA app, inline the same script as a `<script>` tag directly
in `index.html`, before your app's own `<script type="module">` bundle.

Two details that make this safe rather than a hydration-mismatch trap:

1. `<html suppressHydrationWarning>` - the bootstrap script mutates attributes
   on `<html>` before React hydrates, so React must not compare/warn about
   them. This is standard practice for any pre-paint theme script (identical
   to next-themes and similar libraries) and is scoped to exactly the `<html>`
   element carrying the bootstrapped attributes.
2. `FujiProvider`'s own render output is identical on server and client: with
   `persist`, the root provider renders **no** `data-fuji-*` attributes on its
   scope wrapper at all (the bootstrapped `<html>` attributes are the source),
   and it doesn't try to read the bootstrap script's result during the
   initial render. It reconciles with the persisted value shortly after mount (see
   `persist` in the main README), which is a state update, not a hydration
   mismatch.

If you don't use `persist`, skip all of this - there's no flash to prevent
because there's nothing being persisted.
