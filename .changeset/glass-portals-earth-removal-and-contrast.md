---
"@fujiui/react": minor
---

Glass overlay material reaches every floating surface, the `earth` tone is removed, and a full-matrix audit fixes contrast and box-sizing defects.

**Breaking: the `earth` tone is gone.** It is removed from `ComponentTone`, from
every component's tone map, and from the tokens. Use `forest` (or another tone)
instead.

**Glass overlays**

- **Portaled popups never received the overlay material at all.** The `@supports`
  blur rules were descendant selectors
  (`[data-fuji-material="glass"] .fuji-glass-surface-overlay`), but Dialog,
  AlertDialog, Drawer and CommandMenu portal to `document.body` and carry
  `data-fuji-material` on the popup element _itself_, so nothing matched and
  `backdrop-filter` computed to `none` — the material's blur never reached a
  single modal. The selectors now also match an element carrying its own
  material attribute, not just a descendant of one. Popovers, menus and
  selects had been matching only by accident, via Base UI's positioner wrapper.
- **Calendar**'s month/year chooser was see-through, with day numbers legible
  through the month list. It renders inside the calendar card instead of
  portaling, and an ancestor with a `backdrop-filter` becomes a backdrop root, so
  no blur there can ever see the grid it covers. It now uses a near-opaque
  `.fuji-overlay-panel-nested` (light/dark fall back to their already-opaque
  `--fuji-surface-overlay`).
- **Carousel**'s play/pause control sits directly on slide media; it now takes
  the overlay material instead of a thinned tint plus a generic 4px blur.
- **Popover**'s arrow composited on its own and read as a lighter, unblurred chip
  on the panel edge; it now matches the panel.

**ChatBubble** — the tail now sits at the bubble's bottom corner (bottom-right
outgoing, bottom-left incoming) rather than mid-side, and the joined corner is
squared while it is shown so bubble and tail read as one shape. The bubble stays
borderless so nothing draws a line across the seam.

**Contrast (WCAG AA), light theme**

- `--fuji-foreground-muted` measured **4.35:1** on `--fuji-surface-strong` —
  visible as washed-out secondary labels on any card using that surface.
  `#6c6963` → `#67645e`.
- `--fuji-forest` measured **4.30:1** as text on a white surface and ~3.4:1 on its
  own `-soft` tint. `#558467` → `#3f6b4f`.
- The `:root` no-provider fallback for `--fuji-sun*` had drifted from the light
  theme's split sun and is back in lockstep.

**Box-sizing** (no preflight ships with this package, so these sized themselves
wrong)

- **RadioGroup**: selection thickens the border to 2px, so the control grew from
  20px to 22px on check — the dot visibly jumped and nudged its label.
- **Checkbox**: `size-5` plus a 1px border rendered a 22px box, misaligned
  against its label.
- **Slider**: the thumb sat 2px proud of its track.
- **Kbd** and **Navbar** items: sized 2px larger than declared.

**FormField** marked `invalid` via the root prop showed the red border and
`aria-invalid` but never rendered its `<FormField.Error>` message, because Base
UI's `Field.Error` only displays for a validation result it produced itself.

**Ripple is now on by default, on every button.** It was opt-in via
`ripple` on Button and absent from IconButton entirely, so most buttons never
had it. The hook moved to `lib/use-ripple` and both components share it, so a
press feels identical on either; pass `ripple={false}` to suppress it.

**ChatBubble no longer shows a seam between bubble and tail.** The bubble and
its tail are two separate elements, and two _translucent_ fills of the same
declared colour do not meet cleanly at their seam - under glass the tail read as
a visibly darker wedge. Removing the tail's blur was not enough on its own, and
neither was removing the bubble's drop shadow (which had been painting over the
tail, showing through its translucency); both helped, but the seam only
disappeared once both fills were made opaque. ChatBubble now uses opaque
`--fuji-chat-bubble-incoming` / `-outgoing` fills under glass, falling back to
the already-opaque `--fuji-surface` / `--fuji-contained-default` in light and
dark. Opaque is also how chat clients actually draw bubbles, and matches the
HIG's rule that the content layer uses plain surfaces rather than glass.

**Avatar answers to the elevation axis.** It carried no `--fuji-shadow-*` token,
so `regular` and `floating` rendered identically - the setting was a no-op.

**CircularProgress's track is visible across the whole glass atmosphere.** It
used `--fuji-border-strong`, an 18% _dark_ tint under glass, which disappeared
against the atmosphere's dark end - the ring read as a bare coloured arc with no
track. The new `.fuji-progress-track` uses a light tint under glass only.

**BottomNavigation gains an `indicator` prop** (`"none" | "dot" | "pill" |
"circle"`) for marking the active item. Active state had been colour only, which
is not a sufficient visual indicator on its own (WCAG 1.4.1).

**Glass surfaces actually look like glass now.** Two things were missing.

The overlay tier sat at `rgb(12 14 18 / 82%)` with a `blur(44px)` backdrop -
an opaque-looking slab twice over: the tint was nearly opaque, and a 44px
gaussian averages away every recognisable shape behind the panel, so even a
translucent tint had nothing visible through it. (The blur also never applied
to portaled popups at all - every glass blur rule was a descendant selector,
and portaled popups carry `data-fuji-material` on themselves; the selectors
now match elements carrying their own material attribute too, and the
positioner's `transform` is folded into `left`/`top` so no ancestor
interferes with backdrop sampling.)

The final overlay material is `rgb(12 14 18 / 48%)` with
`blur(8px) saturate(140%)` - chosen from a side-by-side recipe comparison over
a striped backdrop: 6-12px of blur reads as glass, 18px+ reads as a slab, and
the references (e.g. Raycast's window materials) sit at blur(2-10px).
Legibility lives in the tint rather than in brightness/contrast clamps inside
the filter, which had been darkening whatever the blur sampled and flattening
the detail that makes glass read. The 48% tint is light enough that the panel
visibly lightens and darkens with its backdrop - over featureless bright
regions that tracking is the only glass cue there is. The contract, stated
plainly: on the theme's own canvas and typical mixed content, white text sits
at 7:1+ and muted (raised 82% -> 90% white) at 5:1+; over the very brightest
content a photo can contain, white text still holds ~4.6:1 but muted text can
dip below AA - the trade every OS glass material makes. For text-heavy UIs
over bright media the intended answer is a light-tinted glass surface (68%
frosted white, dark ink, no brightness lift - what a `theme="light"` glass
region renders), and `prefers-reduced-transparency` flattens everything to
opaque.

Glass surfaces also had no inset highlight at all, in either elevation. A
translucent panel only reads as glass when its rim catches light (Raycast's
window uses `inset 0 0.5px 0 rgb(255 255 255 / 30%)` for this); without it they
were flat dark slabs however much blur sat behind them. The new
`--fuji-glass-edge` is appended to the glass card/panel/overlay shadows in both
`regular` and `floating`.

The `light` glass tint had the same problem and gets the same treatment: its
overlay was `rgb(255 255 255 / 86%)`, another opaque slab. It is now 60% white,
and because this tint's foreground is dark its clamp inverts - `brightness(160%)`
_lifts_ the backdrop instead of darkening it, so dark text still holds ~6.4:1
against the worst case (a pure black backdrop) while the panel reads as frosted
glass. Its lit edge is brighter than the dark tint's, since a low-opacity white
hairline does not register on a light fill.
