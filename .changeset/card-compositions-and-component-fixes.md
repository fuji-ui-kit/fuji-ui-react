---
"@fujiui/react": minor
---

Add `Card.Media`/`Card.Overlay` composition primitives, a `size` prop to
`Slider`, and `appearance`/`shape` props to `Badge`; fix a `BottomNavigation`
underline bug, a `ButtonGroup` dark-mode selection bleed, and a `ChatBubble`
tail that never actually painted.

- **`Card`** gained two new sub-components for image-heavy layouts (listing
  cards, profile cards, full-bleed photo cards): `Card.Media` (`position:
"top" | "bottom" | "full"`, default `"top"`) cancels `Card`'s own padding
  on the relevant edge(s) so an `<Image>` reaches the card's outer border and
  matches its corner radius, and `Card.Overlay` is a bottom-pinned gradient
  scrim + content slot for captions baked into a photo. Both compose with
  `Card`'s existing `Header`/`Content`/`Footer` slots. `Card.Overlay`'s
  gradient (`from-black/85 via-black/45 to-transparent`, was `/75`/`/25`)
  was strengthened after review found the original too light to keep body
  text at an accessible contrast once an overlapping element (e.g. an
  avatar pulled up with a negative margin) pushes text higher into the
  scrim's lower-opacity zone.
- **`Slider`** gained `size?: "sm" | "md" | "lg"` (default `"md"`), scaling
  both the track height (`h-1`/`h-1.5`/`h-2.5`) and thumb size
  (`size-3.5`/`size-4`/`size-5"`).
- **`Badge`** gained `appearance?: "soft" | "solid" | "bordered"` (default
  `"soft"`, unchanged) and `shape?: "rounded" | "square"` (default
  `"rounded"`, unchanged) - existing usage is unaffected.
- **`BottomNavigation`**: its native `<a>` had no underline reset. This
  package ships no CSS preflight, so the browser's default anchor underline
  was rendering through the label text in both themes.
  Added the same `no-underline` reset already applied to other native
  elements elsewhere in the package.
- **`ButtonGroup`**: the managed (`items`-prop) radiogroup mode built its
  shared border with `-ml-px` negative-margin overlap plus a z-index bump on
  the opaque "contained" selected segment - in dark mode this let the
  selected segment's own background bleed a visible sliver onto its
  neighbor. Replaced with an explicit trailing border on each non-last
  segment (applied after its own appearance classes, so it isn't cleared by
  a selected segment's `border-transparent`) plus an outer `border` and
  `overflow-hidden` on the container, which structurally cannot bleed since
  segments no longer overlap. (An earlier pass used `divide-x`/`divide-y`
  on the container instead - that compiles to a zero-specificity `:where()`
  selector in Tailwind v4, so it silently lost to the button's own
  `border-0` reset and never actually drew a line; the per-button border
  fixed that too.) The bare-children orientation classes (unmanaged mode)
  are unchanged.
- **`ChatBubble`**: redesigned the bubble to a tooltip-style shape with a
  small pointed tail (shown once per consecutive run, on the last message,
  matching the existing sender/timestamp/status grouping rule). Went through
  two implementations: the first used a rotated square tucked behind the
  bubble with a negative `z-index`, which had two problems - the negative
  `z-index` resolved against whatever ancestor stacking context happened to
  exist outside the component (fixable with `isolate`, but even once
  visible, a rotated square only exposes a diamond-shaped sliver past the
  bubble's rounded corner, reading as a separate floating chip rather than
  part of the bubble). Replaced entirely with a `clip-path` triangle sitting
  flush against the bubble's one squared-off corner (the tail-side corner's
  radius is removed only on the last message of a run via `rounded-b*-none`),
  so the tail is contiguous with the bubble instead of visually detached.
