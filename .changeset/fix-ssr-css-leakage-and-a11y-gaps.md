---
"@fujiui/react": patch
---

Fix several correctness, SSR, CSS-scoping, and accessibility issues found in
review:

- `FujiProvider`'s `persist` no longer reads `localStorage` during the initial
  render (only in the existing post-mount effect), matching the documented
  SSR guarantee that a persisted appearance never reaches the client's first
  render ahead of the server's.
- `Carousel`'s reduced-motion detection no longer reads `matchMedia` during
  render; it now starts `false` on every render and is corrected in an effect.
- `base.css` no longer applies `border-color` and `:focus-visible` globally to
  every element on the page - a required stylesheet import was silently
  restyling a consumer's own non-Fuji markup. The handful of components that
  relied on the global fallback (`Button`, `Drawer`, `Navbar`, `Breadcrumb`,
  `BottomNavigation`, `List`) now declare their own border/focus-visible
  styling directly, so nothing changes visually and no `FujiProvider` ancestor
  is required for it to keep working.
- `Link`, `Breadcrumb`, `Navbar`, and `BottomNavigation` now reject `href`
  values with an unrecognized URL scheme (anything other than a relative URL,
  `http:`, `https:`, `mailto:`, or `tel:`) instead of passing them straight
  through to a rendered anchor.
- `Select`, `Combobox`, `MultiSelect`, `DatePicker`, and `TimePicker` now set
  `aria-invalid` on their interactive control (previously only a `data-invalid`
  styling hook was set, which assistive technology doesn't read).
- `Tree` and `DataTable` now forward a ref and accept native element props on
  their root, matching every other component's convention.
- `Calendar`'s month/year chooser derives its fallback year from the
  already-hydration-safe `today` value instead of a fresh `new Date()` read
  during render.
- Production source maps no longer embed the original TypeScript source
  (`sourcesContent`); line-level maps are still published.
- Corrected the README's build output list and the elevation description
  (`regular`/`floating` also differ slightly in control sizing, not shadow
  depth alone) to match actual behavior, consistently across SPEC.md,
  AGENTS.md, docs/theming.md, and the review skills.
- `isSafeHref` (the new scheme guard behind the `href` fix above) is
  hardened against a bypass where a leading control character (e.g. a NUL
  byte) made a `javascript:` URL register as "no scheme, therefore safe" -
  it now delegates to the platform's own `URL` parser, which strips those
  the same way a browser does before resolving the scheme, instead of a
  hand-rolled regex.
