---
name: fuji-react-theming-review
description: Review @fuji-ui/react theming integrity - token definitions and coverage across light/dark/glass, radius and elevation behavior, portal theme propagation, glass fallbacks, contrast, and visual verification through the sibling website. Use for review-only audits unless fixes are explicitly requested.
---

# Fuji React theming review

## Purpose

Fuji's whole premise is that appearance is global and token-driven, so one
missing token or one hard-coded color quietly breaks a theme for every consumer.
This audit covers the token system itself and its visual result.

The package has no dev server. Visual verification runs through the sibling
`fuji-ui-website` against a packed build. Default to review-only.

## Procedure

1. Read `SPEC.md` §2 and §8, `docs/theming.md`, `src/styles/tokens.css`,
   `fuji-theme.css`, and `base.css`.
2. Audit the token layer statically (below).
3. For anything visual, build and verify in a real browser:

   ```bash
   # in fuji-ui-react
   npm run build && npm pack
   # in ../fuji-ui-website
   npm install ../fuji-ui-react/fuji-ui-react-<version>.tgz
   npm run dev
   ```

   Do not create permanent screenshots or test files in either repo.

## Static checks

### Token coverage

- Every token defined for one theme is defined for **all three**. A token
  present in `light` but missing from `glass` falls back to the `:root` value
  and looks subtly wrong rather than obviously broken.

  ```bash
  grep -o '\--fuji-[a-z0-9-]*:' src/styles/tokens.css | sort | uniq -c | sort -n | head -30
  ```

  Investigate anything with an unexpectedly low count.

- Theme-varying tokens (surfaces, foregrounds, borders) are **re-declared** per
  theme rather than inherited, so a nested `[data-fuji-theme]` scope resolves
  correctly. Inheritance-only tokens break nested theme previews.
- Semantic colors keep their identity across themes; surfaces do not.

### No hard-coded values in components

```bash
grep -rn "#[0-9a-fA-F]\{3,8\}\b\|rgb(\|hsl(\|oklch(" src/components src/provider --include='*.tsx' --include='*.ts' | grep -v test
```

Color literals belong only in `src/styles/tokens.css`. Same for spacing, radius,
shadow, and duration - components use `--fuji-*` (directly or via mapped
utilities), never magic numbers.

### Static class names

Tailwind's scanner is a static text scan. `bg-fuji-${variant}` is never
generated. `src/components/fuji/lib/appearance.ts` spells out every variant ×
appearance combination for exactly this reason.

```bash
grep -rn 'className=.*\${' src/components --include='*.tsx' | grep -v test
```

Inspect each hit: interpolating a whole class name is a bug; interpolating a
non-class value into an unrelated attribute is fine.

### Tailwind mapping and scanning

- Any token intended for utility use has a `--color-fuji-*` (or equivalent)
  mapping in `fuji-theme.css`, or the utility is never generated.
- `@source` in `scripts/css-entry.css` covers every directory containing
  Fuji class names. A new top-level source directory must be added there.

### Radius and elevation

- `[data-fuji-radius="soft"]` overrides only the radius tokens - it must not
  drag other properties with it.
- `[data-fuji-elevation]`'s main effect is shadow depth; `regular` also uses
  slightly more compact control heights and panel padding than `floating` -
  that static sizing difference is intentional (see `SPEC.md` §2), but any
  scale, translate, or hover motion introduced under either mode is a
  contract violation.
- Components use `--fuji-radius-control` / `-panel` / `-overlay` rather than
  fixed radii, so both modes work.

### Glass

- Every `backdrop-filter` surface has an opaque fallback under
  `prefers-reduced-transparency: reduce` and where `backdrop-filter` is
  unsupported (`@supports not (backdrop-filter: blur(1px))`).
- New glass surfaces use the shipped `.fuji-glass-surface*` classes rather than
  hand-rolling blur - hand-rolled ones lack the fallbacks.
- Glass is layered and graduated, not a single translucent background.

### Portal propagation

Base UI's overlay primitives portal to `document.body`, outside the provider's
subtree. `usePortalThemeAttrs` must be spread onto the outermost styled node of
**every** such primitive (Popup / Positioner / Content). A new overlay component
that omits it renders with the wrong theme whenever the page theme is not the
default - a bug that is invisible in the default theme.

### Motion

Fuji durations come from `--fuji-duration-*`, which collapse to `0ms` under
`prefers-reduced-motion: reduce`. Hard-coded durations do not participate.

## Visual checks (in the website)

Exercise the full matrix on the surfaces the change touches:
`light`/`dark`/`glass` × `cornered`/`soft` × `regular`/`floating`.

- Contrast: text and interactive borders against their **actual** surfaces.
  Glass is translucent, so check against a real backdrop, not a flat one. The
  shipped values target WCAG AA (4.5:1); a change must hold that.
- Focus rings visible in all three themes - `glass` is where a low-contrast ring
  disappears.
- Portaled overlays (Dialog, Popover, Menu, Select, Tooltip, Toast) match the
  active theme, including inside a nested provider scope.
- Nested provider scopes stay isolated and do not leak into or out of the page
  theme.
- Theme switching does not flash, jump layout, or leave stale colors mid
  transition.
- Elevation switching changes shadows only - no layout shift, no movement.
- Reduced motion and reduced transparency, toggled at the OS or devtools level,
  produce the documented fallbacks.
- Representative widths (~375, 768, 1024, 1440) and a clean console.

## Output

Default to review-only. Report findings by severity with: component or token,
file and line, the theme/radius/elevation combination and viewport where it
reproduces, expected versus actual, evidence (computed style or DOM inspection
where a class name alone does not prove behavior), and the minimal fix.

Finish with the combinations actually reviewed, what you verified statically
versus visually, assumptions, and verification performed. Keep any temporary
captures outside tracked source in both repos.
