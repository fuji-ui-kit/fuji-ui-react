---
"@fujiui/react": minor
---

Fix an "earth" tone contrast bug and recolor `earth`/`forest` to genuine
beige/sage tones, fix a Toast icon/title misalignment, fix a glass-theme
Toast contrast bug, and polish several components: Rating's tone type,
Spinner, Toast, FileUpload, MultiSelect, Switch, Collapsible, SearchInput,
and DatePicker.

- **`earth` tone was nearly invisible as a solid fill**, in both `light` and
  `dark` (not `glass`) - `--fuji-earth` was chosen too close in lightness to
  the page background in each theme (measured 1.22:1 in light, 1.53:1 in
  dark; every other tone measures 5:1+). It went through two passes: an
  initial fix landed a darker/lighter tan by the numbers alone, then it was
  recolored again against real references - Color Hunt's "beige" collection
  for `earth` and "sage" collection for `forest`, so the two read as a
  coherent, intentional warm-neutral pairing rather than two unrelated
  accent colors. Final values: `earth` is `#8b5e3c` in light (5.16:1 against
  the page, white foreground text), `#c8a96b` in dark (8.41:1, dark
  foreground text), and a warm beige tint (`#f3e4c9` at 84% opacity, was
  plain white) in glass. `forest` moved from a fairly saturated true green
  (`#346742` light / `#83d292` dark / `#9bd8a8` glass) to a muted sage
  (`#40513b` light, 7.9:1; `#a1bc98` dark, 9.14:1; `#b1d3b9` glass) - its
  `-soft`/`-border` washes were re-derived from the new base color in light
  and dark so they stay the same hue as the accent. Also added `--fuji-earth`/
  `-foreground` to `:root` (the no-`FujiProvider` fallback) - every sibling
  tone had one already; `earth` was simply missing it, so a tone="earth"
  component used with no provider anywhere in its ancestry had no color to
  resolve at all. Consequently fixed three other places that had been using
  `earth-foreground` as a **standalone** accent color (a workaround for the
  old, too-pale `earth`) - `Rating`, `RadioGroup`, and `Icon`'s bare
  (`background="none"`) case now use `earth` directly like every other tone
  does; `Icon`'s `background="subtle"` case (which has no separate
  soft/tinted `earth` variant to fall back to) keeps pairing `earth`'s full
  fill with `earth-foreground` text, now handled as its own explicit case so
  it doesn't collide with the bare-case fix.
- **Toast title was visibly misaligned with its icon** - `Base.Title` renders
  a native heading element, and without preflight (see SPEC.md §8) its
  ~0.83em native top margin (measured ~12px) was never reset, pushing the
  title down and out of line with the icon beside it (measured ~11px off
  center). Added `m-0` to `Base.Title`/`Base.Description`, matching every
  other native-element margin reset already applied elsewhere in this
  package; icon and title are now vertically centered together (verified
  ~1px apart).
- **Rating** used its own separate, now-stale `RatingTone` type
  (`warning | danger | success | info | primary`) left over from before the
  tone migration. It now uses the shared `ComponentTone`
  (`default | earth | fire | water | forest | sun`); old values map
  `warning → sun`, `danger → fire`, `success → forest`, `info → water`,
  `primary → default`. The default `tone` value is now `"sun"` (same color as
  the old default, `"warning"`).
- **Spinner** replaced its rotating-arc animation with three orbiting dots
  fading from a bright "lead" dot to a faint trailing one - a more distinct
  loading treatment, still a single lightweight SVG + `animate-spin`, so it
  keeps the existing `prefers-reduced-motion` override for free.
- **Toast**: fixed a real WCAG contrast failure - `Base.Root`'s
  `bg-fuji-surface-overlay` panel composites to a medium-brightness tint only
  under `glass` (not light/dark), and Toast is pinned to the atmosphere's
  brightest corner (`bottom-right`), so the plain `text-fuji-foreground`
  title/description (white, computed ~3.5:1) and the plain `text-fuji-{tone}`
  status icon (bright pastel, computed as low as ~1.5:1) both fell under
  WCAG AA there. Glass-only, both now use the matching `-foreground` token
  (e.g. `--fuji-fire-foreground`), which is dark enough to clear 4.5-5:1
  against that panel; light/dark are unaffected. Also tightened Toast's
  padding/gap for a more compact look, matched real toast auto-dismiss
  behavior in new "Open" stories via `timeout: 0`.
- **FileUpload**: no component change - its root never set a width. The
  "stretches full width" symptom was `flex-col`'s default `align-items:
stretch` stretching its trigger `Button` inside an unconstrained Storybook
  canvas. Fixed at the story level; a new `FullWidth` story shows the
  opposite via ordinary `w-full` wrapper composition.
- **MultiSelect** chips now use `Badge`'s exact shape/padding/text recipe
  (`rounded-full px-2.5 py-1 text-xs font-medium`, opacity-fade remove
  button) instead of a bespoke `rounded-[6px]` shape, so a selected value
  reads as the same "chip" as everywhere else in Fuji.
- **Switch**: a uniformly-colored circle rotating in place is visually
  identical at any angle, so the thumb's "roll" was invisible. Added a
  subtle off-center inset bevel (rotates with the thumb as one painted unit)
  so the spin is now visibly perceptible; keyboard/disabled/focus/
  reduced-motion behavior is unchanged.
- **Collapsible.Root** had no surface at all (bare trigger + panel). It now
  reuses `Card`'s exact border/background/radius/padding recipe, so a
  Collapsible reads as a composed card rather than plain text with a
  chevron.
- **SearchInput**: fixed two related bugs from inheriting `Input`'s props
  unfiltered - passing `endSlot` silently replaced SearchInput's own clear
  button (both were assigned to the same JSX prop, and the spread was
  applied last), and passing `clearable` rendered a second, duplicate clear
  button alongside SearchInput's own. `SearchInputProps` now omits `endSlot`
  and `clearable` from `InputProps` and exposes its own `clearable` boolean
  (default `true`) controlling its single, built-in clear button instead.
- **DatePicker** gained `interactiveHeader` (default `false`, mirroring
  `Calendar`'s own prop of the same name and default) - previously there was
  no way to reach the month/year chooser through `DatePicker` at all, only
  through `Calendar` directly.

Also updated `docs/theming.md`, which still referenced the pre-tone-migration
token names (`--fuji-primary`, `--fuji-success`, etc.) and had no mention of
the `ComponentTone`/`StatusTone` split at all.

**Genuine remaining limitation:** the same glass-contrast risk that affected
Toast (a tone-colored or white-on-white-tinted-surface combination inside
`bg-fuji-surface-overlay`) was checked against every other component
combining a bare `text-fuji-{tone}` accent with that surface class, and only
Toast matched. A broader audit of `text-fuji-foreground` (not just the
tone-colored accents) against `bg-fuji-surface-overlay` across every overlay
(Select, Combobox, DropdownMenu, Popover, Dialog, ...) was out of scope here
and is worth a follow-up, since those overlays are positioned relative to
their trigger rather than pinned to the atmosphere's brightest corner, so
their worst-case contrast wasn't verified.
