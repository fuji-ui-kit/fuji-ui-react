---
"@fujiui/react": minor
---

**Breaking: glass no longer paints its own background, and the gradient
atmosphere is no longer automatic.**

`material="glass"` used to override `--fuji-background` to a fixed `#2c323b`,
identical in both themes, and `--fuji-foreground` to a fixed white, with
`--fuji-page-background: transparent` so a decorative atmosphere gradient
could paint through instead. That meant `theme="dark" material="glass"`
wasn't actually dark: it rendered the exact same canvas as
`theme="light" material="glass"`, a third color scheme that happened to be
blurry, not "dark theme with glass surfaces."

Glass now inherits the active theme's palette. `--fuji-background` and
`--fuji-foreground` fall through the cascade to whichever theme is active on
the same element - `theme="dark" material="glass"` renders on dark's own
`#0f0f0e`, `theme="light" material="glass"` on light's own `#eceae6`, the
same two values `solid` uses. Glass itself now contributes only what makes it
a material: translucent `--fuji-surface*` fills, `--fuji-backdrop-blur*`/
`--fuji-backdrop-saturate*`, and a small set of tokens (the "contained" tone
fill among them) that intentionally stay fixed literals in both themes
because they pair with glass's own high-alpha fills rather than with the
page - theme-sourcing those alone measured as low as 1.11:1 (invisible text
on a primary button under dark + glass). Each is commented in place in
`tokens.css` with its own contrast numbers.

**If your app used `material="glass"` and relied on the gradient canvas
appearing automatically, you will now see the theme's flat background
instead.** Fix it with one line - apply the shipped `.fuji-glass-atmosphere`
class yourself, or supply your own backdrop:

```diff
 <FujiProvider theme="dark" material="glass">
-  <App />
+  <div className="fuji-glass-atmosphere min-h-screen">
+    <App />
+  </div>
 </FujiProvider>
```

That class paints fixed decorative art - a slate-blue/terracotta/teal canvas
under a dark tint, white/tan/blue-grey under light - not a rendering of
`--fuji-background` or anything else you've customized, so it looks the same
regardless of how your theme is set up. It restores the pre-upgrade
screenshots, not "your theme with glass on top"; supply your own backdrop
instead (a photo, a brand gradient, a plain color) if you want glass over
something that reflects your own theme or product.

The class is safe to render unconditionally: its selector is scoped to
`[data-fuji-material="glass"] .fuji-glass-atmosphere`, so it stays inert
under `solid`.

No type or prop changes - this is a rendering-only fix. See
`docs/upgrading.md` for the migration and `docs/theming.md`'s Glass section
for the full picture.
