---
"@fujiui/react": minor
---

**Breaking: `glass` is no longer a `theme` value.** `FujiTheme` narrows to
`"light" | "dark"`; `glass` moves to a new, independent `material` axis
(`FujiMaterial = "solid" | "glass"`, default `"solid"`, mirrored as
`data-fuji-material`). `FujiProvider` gains `material`/`defaultMaterial`/
`onMaterialChange`, and `material`/`setMaterial` on `useFujiConfig()`.
`material` is a real persisted preference, alongside `theme`/`radius`/
`elevation`, when `persist` is set.

This was forced by a real limitation, not a naming cleanup: with `glass` as a
third `theme` value, turning glass on **overwrote** whatever light/dark
choice a user had made, so "dark mode + glass" was never reachable as a
combination, and glass always fell back to its own dark tint regardless of
the app's theme. `theme` and `material` are now orthogonal - either theme
renders in either material.

Migrate:

```diff
-<FujiProvider theme="glass">
+<FujiProvider theme="dark" material="glass">
   <App />
 </FujiProvider>
```

**The glass material's tint derives from `theme`, with no separate axis to
set it independently** (dark theme -> dark tint, light theme -> light tint) -
so a light-themed app now gets light-tinted glass (white surfaces, dark
text) automatically, which `theme="glass"` alone could never produce before.
An early draft of this same change carried a dedicated `glassTint` prop
(mirrored as `data-fuji-glass`) for overriding the tint independently of
`theme`, but it was removed before this reached a release: a page's theme
and its glass tint never actually needed to diverge in practice, so the
extra axis just meant `theme` alone didn't fully describe a glass panel's
appearance. To show glass tinted differently from the surrounding page (e.g.
a dark hero photo shown under an otherwise light-themed page), nest a
`FujiProvider` with the tint's `theme` (and `material="glass"` re-declared -
nested providers don't inherit unspecified axes from an ancestor) around
just that region:

```tsx
<FujiProvider theme="light" material="glass">
  <App>
    <FujiProvider theme="dark" material="glass">
      <DarkPhotoSection />
    </FujiProvider>
  </App>
</FujiProvider>
```

A stored `{"theme":"glass"}` preference from before this release keeps
rendering the same dark glass it always did - `persist`'s reader and the
pre-paint bootstrap script both coerce it to
`{theme: "dark", material: "glass"}` on read. If you call
`buildAppearanceBootstrapScript` directly, pass it a `material` default
alongside `theme`/`radius`/`elevation`.

CSS selectors for glass are now keyed on `data-fuji-material` rather than
`data-fuji-theme`, so any app CSS overriding a `[data-fuji-theme="glass"]`
selector needs the equivalent rename to `[data-fuji-material="glass"]`. The
light-tinted material selector is `[data-fuji-material="glass"]
[data-fuji-theme="light"]`.

See `docs/upgrading.md` for the full migration guide.
