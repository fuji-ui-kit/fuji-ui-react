# @fujiui/react

## 0.3.0

### Minor Changes

- fafeb5f: **New: the appearance bootstrap script ships.** `buildAppearanceBootstrapScript()`
  returns the small pre-paint script that reads a returning visitor's saved
  theme/material/radius/elevation and stamps the `data-fuji-*` attributes before first
  paint, so `persist` no longer flashes the default theme on load. It comes with
  `APPEARANCE_STORAGE_KEY` (the `localStorage` key `persist` writes) and the
  `StoredAppearance` type describing the payload.

  It returns a string; the package never injects it. Where it runs is still the
  app's decision - `docs/ssr.md` shows the Next.js and Vite placements.

  Previously every consumer hand-copied this script out of the documentation,
  which meant the storage key and payload shape were duplicated in every app that
  used `persist` and drifted silently the moment either changed. `SPEC.md` §3 and
  §6 are updated: §6 had stated the package does not ship the script.

- fafeb5f: **`@base-ui/react` floor raised to `^1.7.0`** (from `^1.6.0`). It is a runtime
  dependency, so this changes what resolves in every consumer's tree - an app
  pinned below 1.7 will see a duplicate copy installed, or a resolution error
  under a strict package manager.

  1.7 is what the overlay, menu and field primitives are built against here; the
  positioner work in `use-untransformed-positioner.ts` depends on its
  `Positioner` behaviour, and the parts re-exported from it
  (`DialogRoot`, `TabsRoot`, and the rest) inherit their props from that version.

- fafeb5f: **`Card` gains an `effect` prop, and its hover treatment now actually
  animates.**

  `interactive` is replaced by `effect`, which names what the card does instead
  of asserting that it is interactive:

  - `effect="lift"` - the previous treatment: scales up slightly, tips a degree
    and deepens its shadow. Pure CSS, so it still works in a Server Component.
  - `effect="tilt"` - new. Tracks the pointer and tilts the card in 3D towards
    it, springing back on leave (the reference is motion.dev's tilt-card).
    Skipped for touch pointers and under `prefers-reduced-motion: reduce`.

  `interactive` keeps working and maps to `"lift"`. `effect` wins when both are
  given, so `effect="none"` opts a card back out.

  **Fixed: the lift's scale and tilt snapped instead of easing.** The transition
  listed `transform`, but Tailwind v4 emits `scale-105` and `-rotate-1` as the
  individual `scale` and `rotate` properties, neither of which was in the list.
  Measured 60ms into a hover, the shadow was mid-interpolation while the scale
  and rotation had already jumped to their final values. Both properties are now
  named in the transition.

  **Fixed: `prefers-reduced-motion: reduce` did not suppress the lift.** For the
  same reason, the `motion-reduce:transform-none` guard could not undo a `scale`
  or a `rotate` - a reduced-motion visitor still got the full scale and tip. Nor
  could a `motion-reduce:scale-100` override fix it: `.hover\:scale-105:hover`
  carries a pseudo-class and a media query contributes no specificity, so the
  hover rule wins regardless of order. The moving half of the lift is now gated
  behind `motion-safe` instead, so for a reduced-motion visitor those rules are
  never emitted at all. The colour and shadow changes still apply.

  The tilt variant lives in its own client module (`CardTilt`) so that `Card`
  itself stays free of a `"use client"` directive, which Server Component
  consumers passing `Card` as a prop depend on.

- fafeb5f: **New: `InfiniteScroll`.** Loads the next page when the end of a list comes
  into view, for use in place of a pager or a "load more" button. Built on an
  IntersectionObserver over a zero-height sentinel rather than a scroll handler,
  which is what keeps a long list smooth. Re-entry is guarded: the observer can
  fire several times before the parent re-renders with the new page, and without
  the guard one scroll to the bottom fires three or four duplicate fetches. Works
  with any content, including `DataTable` (set `pageSize` to the number of rows
  fetched so far, since infinite loading is what replaces the pager).

  **New: `FloatingActionBar`.** A speed dial: a circular trigger that fans a
  column of labelled actions out from itself (the reference is motion.dev's
  floating action button). Two details carry the effect - the actions stagger in
  nearest-the-trigger first and reverse on close, so the column unfurls from the
  button rather than a menu appearing; and each step further out is slightly
  smaller, which is what gives the column depth instead of reading as a list.
  The column is absolutely positioned against the trigger rather than being a
  flex sibling, so opening it cannot move the trigger - the one element that must
  stay put, since the pointer is already on it - and a dial can be dropped
  anywhere without reserving space for its own expansion. `direction` defaults to
  `"auto"`, which opens downwards when the dial sits near the top of the viewport
  and upwards when it sits near the bottom.

  Deliberately not built on `Popover`: the actions belong to the trigger, and a
  portaled popup would cross-fade a separate surface in and lose that. Collapsed
  actions stay mounted so they can animate, but are `inert` and hidden from
  assistive technology. Takes `direction` (`"auto"` default, `"up"`, `"down"`).

  **`Alert` redesigned.** It was a uniformly tinted block, which had to stay pale
  enough for body text to sit on and so left every variant looking like the same
  faint card. The tone is now washed in from the leading edge and fades out
  before the text, letting it start saturated enough to identify the variant at a
  glance, and the icon rides its own raised tile.

  **Fixed: the tab indicator briefly overlapped the neighbouring tab.** It eased
  on `--fuji-ease-spring`, which overshoots - measured travelling to 198px on a
  194px destination - so on the pill variant the opaque tile crossed the next
  label before settling back. It now uses a decelerating curve that never passes
  its slot.

  **Fixed: `Popover`'s arrow rendered as an outlined diamond.** It was a
  `rotate-45` square with a border on all four sides; since only half of it is
  ever visible, the far two edges showed above the panel. It is now a clipped
  triangle in the panel's own fill, the same approach `ChatBubble` uses for its
  tail, and meets the panel edge with no seam.

  **Fixed: `AvatarGroup`'s overlap read as damage.** The separating ring was
  painted in `--fuji-border-strong`, drawing a grey arc across every neighbour.
  It now uses the colour of the surface behind (overridable per group with
  `--fuji-avatar-group-ring`), so each avatar reads as cut out of the one below,
  and earlier avatars stack above later ones so "+N" tucks under the last face.

  **Fixed: `RadioGroup`'s selection dot could not animate.** It was unmounted
  while unchecked, and an element that does not exist cannot transition, so
  selection popped in instantly. It now stays mounted and scales in on the same
  spring as `Switch`'s rolling thumb.

  **Fixed: `Image`'s fullscreen close button was anchored to the viewport,** so
  on a wide display it sat in the far corner of the screen rather than near the
  photo it closes. It is now pinned to the image's own top-right corner, on its
  own scrim since the photo beneath can be any colour. The lightbox backdrop is
  also darker than the shared overlay scrim: a photo is shown edge-to-edge with
  nothing behind it, so the page stayed visible around it and competed with the
  image.

  **Fixed: `ChatBubble` had no shadow.** A `box-shadow` painted a hard edge
  across the join with the tail, which is why it was removed. The cast is now a
  chained `filter: drop-shadow()` on the wrapper holding both bubble and tail, so
  it follows their combined silhouette - and it scales with the elevation
  appearance.

  **Fixed: chat bubbles were invisible in light and dark.** The bubble fills were
  defined only for the glass theme, so the other two fell back to
  `--fuji-surface` - exactly what `Card` paints, making an incoming bubble the
  same colour as the card behind it.

  **Glass tuning.** Surface blur radii drop from 20/28/36px to 6/10/14px. The
  larger radii obliterated everything behind the surface, which reads as a tinted
  slab rather than glass; overlays were already corrected to 8px and surfaces
  were missed. The white inset "edge" highlight is also removed from every glass
  shadow - at 20% it read as a hard line along the top of every panel rather than
  a specular edge.

  **`BottomNavigation` takes `onItemSelect`.** An item without an `href` was
  inert markup - the bar could only be driven by navigation, so a tab bar
  switching a local view had no way to report the choice, which `Navbar` has been
  able to do since 0.2. Such an item now renders as a real `<button>` when a
  handler is given, so it is focusable and operable from the keyboard rather than
  being a mouse-only `<span>`. Its labels also move to the new `--fuji-text-2xs`
  with a smaller icon.

  **Fixed: a nested overlay panel was translucent in glass.** `Calendar`'s
  month/year chooser opens inside another glass surface, so it has no
  backdrop-filter of its own - an ancestor with one is already a backdrop root -
  and the tint was all it had. At 48% the date grid read straight through it.

  **Fixed: a bottom `Drawer` had no bottom padding.** Its safe-area inset was
  applied as a bare `padding-bottom`, which replaced the panel's own padding
  rather than adding to it - and since that env var is `0px` on any desktop
  browser, the sheet's last control sat flush against the screen edge. The inset
  is now added to the panel padding, and `side="top"` gets the mirror treatment.

  **Charts animate between data sets.** Re-rolling a chart's data snapped: the
  mount-time entrance keyframes never re-run on an element that stays mounted,
  and neither a path's `d` nor a bar's `y`/`height` is animatable as the
  attribute React writes. Every coordinate the plots draw is derived from
  `series`, so they are now handed an interpolated copy each frame instead - the
  line bends to its new shape, the bars grow and shrink, the donut's ring and its
  legend figures travel, and the axis rescales with them. A change of shape
  (different series or labels) still snaps, since there are no pairs of points to
  interpolate between. `prefers-reduced-motion` skips straight to the new data,
  and the `sr-only` data table always holds the real values, never a frame in
  between. The crosshair and tooltip are now derived from which point they are
  pinned to rather than from a snapshot of where it was, so they travel with it.

  **`Toast` now carries `Alert`'s treatment.** The two expose the same four
  status variants, so a success toast and a success alert have to be recognisable
  as the same thing; the toast had a bare tinted glyph against a plain overlay.
  It now gets the tone wash from the leading edge and the icon on its own raised
  tile, shared from one module rather than described twice.

  **`Drawer` spans its edge again on `side="top"` and `side="bottom"`.** They had
  been changed to a detached, width-capped card, which made them the only two
  sides that did not behave like a drawer. That presentation is now
  `variant="sheet"`, available on all four sides: inset all round, rounded on
  every corner, with the dimmed page still visible around it - for a short,
  self-contained task rather than navigation or a long form.

  **Glass is more transparent.** Surface tints drop from 30/38/50% to 22/28/42%
  and the blurs rise from 6/10/14/8px to 10/14/16/12px. Tint and blur work
  against each other - tint is what the surface adds, blur is what it lets
  through - and the previous pairing had enough of the first that the second
  barely showed, so panels read as dark cards rather than as a material with a
  scene behind it. Measured on the shipped atmosphere gradient at its brightest
  sampled pixel, white foreground holds 7.7:1 on `-subtle`, 8.1:1 on `-surface`
  and 10.2:1 on `-strong`. `--fuji-surface-overlay` deliberately does not follow
  them down: it is the tier that covers content the theme does not control, where
  the tint alone has to carry legibility.

  (That gradient stopped being glass's automatic background later in this
  release - it is now the opt-in `.fuji-glass-atmosphere` class, and
  `--fuji-background` comes from the active `theme` by default. These alphas
  are unaffected: they composite over whichever background is behind them
  either way. Re-measured against the real theme backgrounds: light + glass
  card text 7.87:1, dark + glass 17.05:1 - both clear of the numbers above, not
  below them. See `docs/theming.md`.)

- fafeb5f: Fix text that sat on `--fuji-surface-strong` washing out under dark glass.

  Under dark glass that token is a translucent **white** fill. It is white on
  purpose - bare, textless fills (Switch, Slider and Progress tracks) have nothing
  else to separate them from a near-black page, and at a dark tint they measured
  1.01:1 against it, the literal same pixel. But a white tint lightens toward
  whatever is behind it, so anything painting TEXT on it lost contrast as soon as
  glass sat over a bright backdrop.

  Two different fixes, because the two cases want different things:

  **Chips keep their translucency.** `softClasses("default")` - shared by `Badge`,
  `Avatar`'s fallback and `MultiSelect`'s value chips - now paints
  `--fuji-surface-subtle`, which tints _dark_ under dark glass and so darkens the
  chip whatever is behind it. Every other tone in that recipe already pairs a
  low-alpha tint of its own hue with ink of that hue; `default` was the only one
  borrowing a surface token.

  | chip (dark glass, over the atmosphere) | before | after  |
  | -------------------------------------- | ------ | ------ |
  | `Badge` default pill                   | 2.26:1 | 6.00:1 |
  | `Avatar` fallback initials             | 2.36:1 | 6.00:1 |
  | `MultiSelect` value chips              | 2.92:1 | 8.44:1 |

  **Menu highlights invert instead.** `DropdownMenu`, `Select`, `Combobox` and
  `MultiSelect` highlighted rows now use the fill/text inversion
  (`bg-fuji-contained-default` / `text-fuji-default-foreground`) that every other
  selection indicator in the library already uses, and that `CommandMenu` moved to
  for this exact reason. A highlight has to read as _selected_, which a subtler
  tint cannot do. `DropdownMenu`: 3.35:1 -> 13.48:1.

  `--fuji-surface-strong` itself is unchanged, so the bare fills it was tuned for
  keep both their translucency and their 3:1 separation from the page.

- fafeb5f: **Breaking: glass no longer paints its own background, and the gradient
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

- fafeb5f: **Breaking: `glass` is no longer a `theme` value.** `FujiTheme` narrows to
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

- fafeb5f: Glass overlay material reaches every floating surface, the `earth` tone is removed, and a full-matrix audit fixes contrast and box-sizing defects.

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

- fafeb5f: **New: `Keyboard`.** A full on-screen keyboard in the same key vocabulary as
  `Kbd` - `full` (100%, numpad included), `tkl` (75%), `compact` (65%), `phone`
  and `numpad`.

  Every cap is a button. Pressing one plays a real stroke: the cap travels down
  on `pointerdown` (not on release, which lagged behind the finger), lights up in
  `tone` at the bottom of its travel the way a backlit mechanical key does, and
  springs back on `--fuji-ease-spring`. The light fades out with the rebound
  rather than latching, and the whole stroke runs on `--fuji-duration-base`, so
  `prefers-reduced-motion: reduce` removes it for free. `onKeyPress` reports the
  struck cap; `interactive={false}` drops the board to plain `<kbd>` caps for
  documenting a shortcut, and `captureKeys` holds caps down from the real
  keyboard instead. No cap carries colour until `accentKeys` names one.

  Caps sit on a quarter-unit CSS grid whose unit is the smaller of the chosen
  `size` and whatever divides the container evenly, so a nineteen-unit board
  keeps its proportions from a wide page down to a narrow column with no resize
  listener. The board is a single tab stop with a roving tabindex - the arrow
  keys, Home and End move between caps, chosen geometrically so a move past the
  numpad's two-unit `+` and `Enter` lands where the cap actually is.

  `floating` docks the board over the page instead of laying it out in flow:
  `anchor` picks the box it fills (`viewport`, fixed and spanning the screen, or
  `parent`, absolute inside the nearest positioned ancestor), `placement` picks
  the edge, and `open`/`defaultOpen`/`onOpenChange` drive it from an input or a
  button. It unmounts while closed, closes on Escape and on an outside press
  (`dismissible={false}` to opt out; `triggerRef` excludes the control that opens
  it, so its own click toggles rather than closing and reopening), and swallows
  the mousedown that would otherwise blur the field it is typing into. The
  margins either side of the board stay click-through, so a dock never
  intercepts presses on the page it is covering. No backdrop, by design - a
  keyboard types into content you still need to see and scroll.

  **New `phone` layout.** `floating` is meant to dock a board over a phone-width
  page, but `compact` - the narrowest layout until now - is sixteen columns
  wide and renders a 16.7x16.7px cap at a 375px viewport, well under the WCAG
  2.5.8 AA 24x24 target floor. `phone` is ten columns (the sizing already takes
  `min()` against the container, so column count was the only lever): a digit
  row, `qwertyuiop`, `asdfghjkl` plus `;`, a Shift/Backspace row, and a bottom
  row of `,`, Space, `.` and Enter - forty-three caps, no `?123` symbol switch
  (no such `KeyboardEvent.code` exists), and no shifted digit-row symbols, since
  a phone board has no symbol mode to switch into.

  **Shift and Caps Lock work.** Both latch and light a lamp on the cap - sized
  from the cap unit, lit in the board's `tone`, in the top-right corner, the
  only one clear of a wide cap's left-set legend. Shift takes the cap's second
  legend where it has one (`1` types `!`) and otherwise flips case; Caps Lock
  only flips case, because it is not Shift; the two cancel, so Shift on a locked
  board types lowercase. A Shift armed by clicking is sticky - it applies to the
  next cap and lets go, there being nothing to hold down on a drawn keyboard.
  Both caps carry `aria-pressed`, so the state is announced as well as lit.

  **One modifier state, shared with the real keyboard.** Under `captureKeys`,
  holding the physical Shift engages the on-screen cap - so a cap clicked while
  it is down reports its shifted value - and the real Caps Lock moves the lamp.
  A physical release only lets go of a modifier the physical key engaged, so it
  cannot cancel one armed by clicking.

  **A board can no longer outgrow its container.** A docked board is sized
  against the screen rather than by the px cap scale that suits a diagram inside
  a card: `size` picks roughly 45vw / 60vw / 75vw, and a new `width` prop
  overrides that with any CSS length or a number of pixels, in flow as well as
  docked. Every one of those is an upper bound - the cap unit is still the
  smallest of the target, the size's ceiling and what the container can give, so
  the board resizes with its parent and can never overflow it. `anchor="parent"`
  drops the screen-relative target altogether and is measured by the parent
  alone.

  `Keyboard` joins the roving-tabindex composite widgets documented in
  `README.md` and `docs/accessibility.md`, and a board whose `layout` changes
  under it keeps its tab stop - a remembered cap the new layout does not contain
  used to leave every cap at `tabIndex={-1}`, dropping the board out of the tab
  order until it unmounted. The forwarded ref is composed rather than an
  imperative handle, so a consumer's callback ref is no longer torn down and
  re-attached on every render, and it reports `null` honestly while a floating
  board is closed. A cap drawn blank by `hideLabel` - the space bar - now carries
  its accessible name on the static `<kbd>` board as well as the interactive one.

  **New `sound` prop.** A short click on every press, synthesised with an
  oscillator and a gain ramp through the Web Audio API - no asset, no
  dependency, nothing to fail to load. Off by default, and the audio context is
  created on the first press rather than on mount, so a board nobody touches
  never opens one.

  **`Kbd` gains `size`** (`sm` | `md` | `lg`, default `sm`), for legends set
  beside larger type or beside a `Keyboard`. Its corners now follow
  `--fuji-radius-item` instead of a hardcoded 6px, so a consumer on
  `radius="soft"` sees them grow from 6px to 10px on upgrade; it also gained
  `fj:box-border`, so the chip's border now sits inside its declared `min-w`
  instead of rendering 2px wider than it.

- fafeb5f: Make `--fuji-glass-atmosphere-image` hold the light scene under light theme, and
  lighten `--fuji-fire` on dark glass.

  The atmosphere token had a single unqualified declaration holding the dark
  scene. The light scene existed only as a literal inside
  `[data-fuji-material="glass"][data-fuji-theme="light"] .fuji-glass-atmosphere`,
  a rule specific enough (0,3,0) to outrank the `var(--fuji-glass-atmosphere-image)`
  rule (0,2,0) that is supposed to drive that class. So the class painted
  correctly in both themes and nothing looked wrong - but the token itself was the
  dark scene under light theme, and its own documentation invites consumers to
  reference it when building their own backdrop. Anyone who did got a dark scene
  under a light app.

  The light scene now lives in the token, byte-for-byte the gradient that rule
  painted, and the rule is gone. One source of truth; the rendered output is
  unchanged in both themes. A regression guard now rejects any theme-specific rule
  that hardcodes this background-image behind the token's back - the same drift
  the neighbouring parity test already guarded against one specificity level down.

  `--fuji-fire` on dark glass goes `#ffa8a8` -> `#ffb4b4`. Used as text on a glass
  surface over the atmosphere's brightest pixels it measured 4.32:1, the only one
  of the four accents to miss AA there (forest 4.87, water 5.04, sun 5.09). It is
  now 4.70:1, and unchanged at the scene's dark end, which stays above 9:1.

- fafeb5f: Fix bare fills being invisible under `theme="light"` + `material="glass"`, and
  document which components the glass material applies to.

  `--fuji-surface-strong` is the bare-fill tier: Switch, Slider and Progress
  tracks, `Skeleton`, `Image`'s placeholder, `Chart`'s gridlines and loading
  bars, and Alert/Toast's default-tone wash. Those paint no text, border, shadow
  or blur, so the fill colour is the only reason they are visible - which means
  it has to tint away from the surface behind it. Under light glass it tinted
  white on a white-ish surface instead: a `DataTable` in its `loading` state
  composited to 1.03:1 against its own card, so a loading table was
  indistinguishable from an empty one. The same story measures 3.19:1 under dark
  glass and 1.26:1 under light solid, so this failed in exactly one of the four
  theme x material combinations. Light glass now tints dark at 15%, which
  reproduces light solid's own `#e7e5e0` over a glass card plus headroom for the
  backdrop showing through (1.38:1), so toggling `material` no longer decides
  whether these controls are visible.

  `.fuji-glass-surface-strong` now resolves to `--fuji-surface-raised` rather
  than `--fuji-surface-strong`. The class is advertised for "inputs, text-heavy
  areas", but it was inheriting the bare-fill tint, which tints away from the
  page in both glass materials and therefore away from any ink sitting on it.
  `-raised` is byte-identical to `-strong` in both solid themes and under light
  glass, so only dark glass changes - from the white bare-fill tint to the dark
  content tint, which is the direction a text-bearing panel needs there.

  `docs/theming.md` gains a "What gets the material" section. Glass is a material
  for cards, chrome and overlays, not for the control layer - a `contained`
  Button under dark glass is a 92%-opaque cream fill with a cast shadow, not a
  blurred panel. That was deliberate and consistently applied, but it was only
  ever written down in a source comment that pointed at a contributor-facing file
  which did not contain the rule, so consumers had no way to tell the behaviour
  from a bug.

  Not addressed, and still open by design: neither light material reaches the
  3:1 non-text contrast floor for these bare tracks - light solid's `#e7e5e0`
  measures 1.05:1 against the page. Clearing 3:1 against a page that bright needs
  a medium-dark grey in both materials, which is a visual-identity decision
  rather than a token fix.

- fafeb5f: A shared motion system, and three bugs that only a rendered page could catch.

  **Overlay, indicator and chart motion are now named recipes** in the shipped
  stylesheet rather than per-component utility strings. Eleven overlays each
  carrying their own `transition-[transform,opacity] duration-… ease-…` had
  drifted into four durations and two scales for what a user reads as a single
  gesture. `Dialog`/`AlertDialog`/`CommandMenu`/`Image` scale and rise on a
  spring; menus and popovers scale from their own `--transform-origin`; `Drawer`
  deliberately does not spring (an edge-anchored panel that overshoots opens a
  gap at the edge it should be flush against); `Toast` does. Every recipe
  collapses under `prefers-reduced-motion` because its durations are tokens.

  **`SegmentedControl`'s selection slides.** It used to be painted onto whichever
  tab was active, so it teleported. It is now a single raised object that moves
  and resizes between slots - the same `.fuji-raised` treatment Button's
  contained appearance uses, so "the selected thing" looks the same wherever it
  appears. `Tabs` shares the timing.

  **`LineChart` gains `area`** - a soft gradient fill under each line - and both
  the stroke and the fill draw themselves in. The stroke uses `pathLength="1"`
  so no `getTotalLength()` measurement is needed.

  **Fixed: `Chart` could render permanently blank.** Its entrance was a
  transition switched on from a `requestAnimationFrame` callback, leaving the
  chart at `opacity: 0` until that frame ran - which in a backgrounded tab or an
  automated browser never happens. It is a keyframe now, so the worst case is
  that it appears instantly. This also removes a `useState`/`useEffect` pair per
  chart.

  **Fixed: the dark theme painted a light page.**
  `:root { --fuji-page-background: var(--fuji-background) }` looks like a
  redirect but is not - a custom property whose value is a `var()` is
  substituted where it is declared, so it resolved once against `:root`'s light
  value and inherited that concrete color into the dark theme. Dark surfaces sat
  on a light page. `src/styles/tokens.test.ts` now fails if any theme overrides
  a token that another `:root` token is defined in terms of without restating it.

  **Fixed: `Carousel` injected a stylesheet per instance.** Each one rendered its
  own `<style dangerouslySetInnerHTML>` keyed by a generated id, purely to get
  three media queries; six carousels on a page meant six stylesheets, six
  `useId` calls and six `suppressHydrationWarning`s. The breakpoints ship in the
  stylesheet now and only the numbers ride in as inline custom properties. No
  `dangerouslySetInnerHTML` remains anywhere in the package.

  **Smaller things.** `useControllableState` updates its `onChange` ref in an
  insertion effect rather than a passive one (a deferred passive effect could
  leave it holding the previous render's handler) and warns in development when
  a component switches between controlled and uncontrolled. `IconButton` no
  longer carries `"use client"` - it has no hooks, and the directive kept it out
  of Server Components for no reason.

- fafeb5f: The motion and composition work from the design brief, built against the
  reference pieces one by one and checked in Storybook.

  **Motion (motion.dev references, no animation runtime):**

  - **Material ripple** - `Button ripple` now grows a circle from the press
    point that STAYS while the pointer is held and fades on release, one node
    per press (a double-tap shows two). Driven with the Web Animations API
    because the two halves have independent timing; skipped under
    `prefers-reduced-motion`.
  - **Number trend** - `Statistic` rolls each digit on its own vertical strip
    (staggered per column, on the spring) and flashes forest/fire in the
    direction of a change. Markup still carries the final value for SSR and
    the figure is exposed as one accessible name.
  - **Line graph** - `LineChart` defaults to a monotone cubic `curve="smooth"`
    (never overshoots the data), takes `strokeWidth`, draws its stroke in, and
    has a crosshair that snaps to the nearest x as the pointer moves. Y ticks
    are rounded to the data's magnitude instead of leaking `4.050000001`.
  - **Coverflow** - `Carousel effect="coverflow"` centres the active slide with
    neighbours rotated away in 3D and scaled by distance; loop, swipe and
    controls unchanged.
  - **Sheet modal** - `Drawer` follows Base UI's drag gesture (the sheet moves
    with the finger, springs back on a short drag, dismisses on a long or fast
    one) and a bottom sheet shows a grab handle.
  - **Donut** - the ring draws in clockwise on mount, the hovered segment
    thickens, and the redundant frame legend is gone. Centre label no longer
    overflows the hole.

  **Reference look:**

  - **Floating elevation** deepened: raised objects cast a long, soft shadow
    and containers get a wide halo, as in the reference.
  - **Pagination** is a white pill with grey tiles and a raised black current
    page; **Checkbox** is a grey well that becomes a raised tone tile when
    checked; **`Tabs.List variant="pill"`** gives tabs the same sliding raised
    indicator as SegmentedControl.
  - **`BottomNavigation`** gains `variant="floating"` (detached pill) and
    `action` (a raised centre button in a notch cut from the bar).
  - **Carousel** arrows sit on a translucent disc so they read over any photo,
    and the indicator dots are 24px hit targets rather than 6px.
  - Glass modals are near-opaque (82% tint) instead of a grey wash.

  New stories: dashboard area chart, floating donut, vehicle-details card,
  floating notched bottom navigation, coverflow carousel, pill tabs.

- fafeb5f: Fix the documented-but-missing named sub-exports, the unstyled provider-less
  render, and CommonJS type resolution.

  **Named compound sub-exports now exist.** `README.md`, `docs/nextjs.md` and
  `SPEC.md` §4 all instruct Server Component consumers to import the named form
  (`import { DialogContent } from "@fujiui/react"`) because a static property
  read (`Dialog.Content`) fails across a `"use client"` boundary. Those exports
  were documented but never actually exported, so following the documentation
  was a compile error. Every compound now exports its parts by name alongside
  the dot-access form, and the two are asserted to be the same reference:

  `AlertDialog`, `Card`, `ChatBubble`, `Collapsible`, `Dialog`, `Drawer`,
  `DropdownMenu`, `Fieldset`, `FormField`, `List`, `NavigationMenu`, `Popover`,
  `RadioGroup`, `Sidebar`, `Table`, `Tabs`, `Tooltip` — e.g. `DialogContent`,
  `DialogTrigger`, `CardHeader`, `TableRow`, `TabsList`, `FormFieldLabel`.

  Also newly exported: `CarouselHandle` (needed to type a `useRef` for
  `Carousel`'s imperative handle), `TableProps`, `TableRowProps`, `LinkColor`,
  `ButtonGroupItem`, `CollapsibleTriggerProps`, `NavigationMenuPortalProps`.

  **Provider-less and pre-hydration renders are styled.** 17 core tokens
  (`--fuji-surface`, `--fuji-foreground`, `--fuji-default`, `--fuji-focus-ring`,
  `--fuji-background`, …) existed only under `[data-fuji-theme="…"]`. Because
  `FujiProvider` is optional (SPEC §2) and, with `persist`, the scope wrapper
  intentionally carries no `data-fuji-*` until the bootstrap script or the mount
  effect runs, those tokens resolved to nothing — a provider-less `<Button>`
  painted transparent with inherited text color. `:root` now mirrors the
  complete light set. The `:root` tone colors, which had drifted from the light
  theme's (`--fuji-earth` was `#8b5e3c` vs light's `#b87c4c`), are aligned too,
  so a provider-less render is pixel-identical to `theme="light"`.

  **CommonJS consumers get CommonJS types.** The `exports` map had no `types`
  condition under `require`, so `dist/index.d.cts` was built and published but
  unreachable; a `require`-mode TypeScript consumer resolved the ESM-flavoured
  `dist/index.d.ts` instead and could hit TS1479 under `moduleResolution:
node16`. Both conditions now declare their own `types`.

  **Packaging and docs.** Removed the duplicate `sourceMappingURL` comment tsup
  8.5.1 emits for every file in `bundle: false` mode (178 stray lines in the
  tarball). Corrected the package name from `@fuji-ui/react` to `@fujiui/react`
  in `THIRD_PARTY_NOTICES.md` (which ships) and across the contributor guides,
  the packed-tarball filename in `docs/migration.md` and `CONTRIBUTING.md`
  (`fujiui-react-<version>.tgz`), and the component count in `README.md`
  (79, not ~90).

- fafeb5f: Rework the visual system: surfaces are now defined by layered shadow rather
  than by a visible border, the radius and elevation axes are visible decisions,
  and `glass` is an Apple-Materials-style material instead of a translucent grey
  rectangle. No component API changes - this is entirely token and recipe work,
  so every component moves together. See `DESIGN.md` for the rationale.

  **Surfaces.** Light's page background moved from `#f7f6f2` to `#eceae6` so a
  white surface actually separates from it (two near-identical off-whites cannot
  be told apart no matter the shadow). Borders dropped to a hairline (light: 10%
  → 6%) and shadows became three real layers instead of one or two faint ones.
  Dark's surfaces were lifted (`#191918` → `#1e1e1c`) and lean on an inset edge
  highlight, because on a near-black page a darker shadow communicates nothing.

  **New `.fuji-raised` recipe**, applied by `lib/appearance.ts` to every
  `contained` tone: a drop shadow plus an inner top highlight so the primary
  action, active tab and checked box read as solid objects sitting on the
  surface. New tokens `--fuji-shadow-raised` and `--fuji-raised-highlight`, set
  per theme and per elevation.

  **Radius and elevation are now perceptible.** `cornered` is 6/10/14px and
  `soft` is 14/20/26px (was 8/12/14 and 13/18/22). A light card's `floating`
  shadow goes to 48px max blur against `regular`'s 24px; dark goes to 60px
  against 12px. Elevation still changes shadow depth only, never geometry.

  **Glass.** Blur and saturation went from 6-16px at 105-120% to 20/28/36/44px
  at 160/200% across the four tiers, and the shipped atmosphere gained real hue
  range, because blur over a flat grey gradient stays flat grey. Most
  importantly the materials now tint **dark** (`rgb(12 14 18)` at 30/38/50/58%)
  rather than white: a white tint pulls the panel toward a bright backdrop, and
  white foreground text measured **3.2:1** over the warm region of the
  atmosphere. Darkening makes the material's contrast independent of what it
  sits on, which is what Apple's dark materials do. With a guaranteed-dark base
  the text tiers could become a real scale again - they were 100%/90%/89% white,
  which rendered as a single tier, and are now 100%/82%/71%. Worst measured
  contrast across the whole shipped atmosphere is 7.66:1 foreground, 5.79:1
  muted, 4.81:1 subtle.

  This step shipped glass as dark-tinted only, so over a light backdrop a
  consumer supplied themselves, light-on-glass text would not meet AA.
  `DESIGN.md` documents this and the light-tinted material that would fix it -
  a light tint followed immediately after in the same release (briefly as its
  own `glassTint` override prop, later folded into `theme` itself deciding the
  tint with no separate axis at all - the override never reached a release).
  The atmosphere itself also stopped being painted automatically later in this
  release: `--fuji-background` now comes from `theme` instead of glass's own
  fixed canvas, and the gradient described above is an opt-in
  `.fuji-glass-atmosphere` class rather than something every glass root gets
  for free. See the other changesets in this release and `docs/theming.md`.

- fafeb5f: Motion system groundwork, and cut real runtime and CSS weight.

  **Motion.** Added `--fuji-ease-spring` (a `linear()` ramp that overshoots and
  settles like a physical control, with no JS animation runtime) and
  `--fuji-duration-overlay`; both collapse under `prefers-reduced-motion`.

  New `ripple` prop on `Button`, for a pointer-origin press ripple. See the
  material-ripple entry below for the behaviour that ships: it is on by default
  on both `Button` and `IconButton`, and `ripple={false}` opts a control out.
  Fully disabled under reduced motion.

  **`Statistic` no longer re-renders 60 times a second, and no longer renders
  `0` on the server.** The count-up wrote through `useState` on every animation
  frame - roughly 42 renders per visible tile, several per dashboard KPI row,
  all to change one text node. It now writes `textContent` directly. That also
  fixed a real bug: because state started at `0`, server-rendered and no-JS
  output showed `$0` instead of the actual figure. The markup now contains the
  final value and the effect rewinds only when it is about to animate.

  **Removed `class-variance-authority`** as a runtime dependency. It was used in
  three files for what is a static lookup; those are now plain functions. The
  rendered class attributes are byte-identical across all twelve appearance
  combinations.

  **Glass materials no longer apply to form controls.** `field-surface.ts`,
  `Textarea` and `OTPInput` each carried `fuji-glass-surface-strong`, which put
  a 36px `backdrop-filter` on every input on the page under the glass theme - a
  twenty-field form meant twenty extra compositing layers for a blur nobody can
  see behind a control that small. A representative page went from 4
  backdrop-filtered elements to 3, with none on form controls.

  **CSS isolation.** Tailwind's `spin`/`ping`/`pulse` keyframes are emitted
  under those bare global names and silently collide with a consumer's own
  `@keyframes spin`; the `fj:` class prefix does not rename keyframes. Fuji now
  declares its own `fuji-spin`/`fuji-ping`/`fuji-pulse`, so every keyframe the
  package ships is namespaced. The boot-time transition suppressor was also
  scoped - `html[data-fuji-boot] *` killed every transition on the page,
  including the consumer's own unrelated markup.

  **New regression test** (`src/styles/class-conflicts.test.tsx`) asserting no
  rendered element carries two classes from the same Tailwind conflict group.
  This exists because removing `tailwind-merge` (an attractive ~10 kB saving)
  was tried and reverted: `NATIVE_CONTROL_RESET` is applied first by 31
  components and carries `border-0`/`bg-transparent`, which each component then
  overrides later in the same `cn()` call. Without the merge pass both survive
  and stylesheet order decides - which rendered every `contained` Button
  transparent, with no existing test failing. `cn` documents this so the saving
  is not attempted again without first restructuring the reset.

- fafeb5f: One vocabulary for prop names, and two APIs that had no uncontrolled mode.

  **Breaking, under a minor bump (pre-1.0).** Four props are renamed and one
  default changes. SPEC.md §10 counts a rename and a changed default as breaking
  and requires the callout even when the bump is minor, so: every `Skeleton
variant`, `Typography variant`, `Link color`/`hover` and `Container size` in a
  consuming app has to be updated, and a `Carousel` that relied on autoplay must
  now ask for it. `docs/upgrading.md` has the before/after for each.

  **Renames.** Fuji uses `tone` for decorative color roles and `variant` for
  semantic status. Four components predated that rule, which left `variant`
  meaning three different things depending on which component you were reading:

  - `Skeleton.variant` → `shape`
  - `Typography.variant` → `scale` (type `TypographyVariant` → `TypographyScale`)
  - `Link.color` → `tone`, `Link.hover` → `hoverTone` (type `LinkColor` → `LinkTone`)
  - `Container.size` → `width` - `size` everywhere else in the package means a
    control's height/padding scale, and Container's meant maximum line length

  **`Carousel` no longer autoplays by default.** `autoplay` defaults to `false`.
  Self-starting motion lasting more than five seconds is a WCAG 2.2.2 obligation
  for whoever ships the page, and defaulting it on handed every consumer that
  obligation without telling them.

  **`CommandMenu` works uncontrolled.** `open`/`onOpenChange` are now optional
  and `defaultOpen` is available. It was the one component in the package that
  forced a `useState` on every caller, including its own stories.

  See `docs/upgrading.md` for the full 0.2 → 0.3 diff.

- fafeb5f: Accessibility: state that was only a color is now also announced.

  **Navigation.** `Navbar`, `BottomNavigation` and `Sidebar` mark their active
  item with `aria-current="page"` (it was a background color and nothing else),
  and all three name their landmark by default so a page with more than one
  doesn't present a screen reader with identical "navigation" entries. `Sidebar`
  now renders `<nav>` rather than `<aside>` - its items are links, so it is a
  navigation landmark, not a complementary one - and its sections tie their
  label to their items with `role="group"` + `aria-labelledby`. A `Navbar` item
  with neither `href` nor `onItemSelect` no longer renders as a hand cursor over
  a hover highlight that does nothing when clicked.

  **`DataTable` sorting.** The header cell carries `aria-sort`, the toggle's
  accessible name states the direction ("Revenue, sorted ascending"), the arrow
  glyphs are `aria-hidden`, and the body is `aria-busy` while loading. Sort state
  previously existed only as an arrow icon.

  **Charts are one tab stop, not one per data point.** A three-series,
  twelve-point chart put thirty-six tab stops between the controls either side
  of it, each announcing a value already present in the visually-hidden data
  table every chart renders. A plot is now a single stop with arrow-key
  navigation - left/right along a series, up/down between series, Escape to
  release.

  **`Calendar`** day cells are named with the full date ("Saturday, March 14,
  2026") instead of a bare day number, carry `aria-current="date"` on today, and
  mark today with a dot as well as an accent color.

  **`Timeline`** items announce their `variant` as a visually-hidden prefix
  ("Error: Deploy failed"); a new `statusLabel` translates or suppresses it.

  **`ChatBubble`** keeps the sender announced when `grouped` - a sighted reader
  infers it from the run's shape, a linear screen-reader pass had five
  unattributed messages in a row.

  **`Dropzone`** is named by purpose ("Upload files", overridable with the new
  `label` prop) rather than by whatever prose `description` held, and its file
  list is a named live region so a completed drop is announced.

  **`Dialog`** renders its close button after `children`, so initial focus lands
  on the content rather than on the way out. Its position on screen is unchanged.

  **`Sidebar.Item` validates `href`** through the same allowlist as every other
  link in the package - it was the one component that passed a `javascript:` URL
  straight through. Rejected hrefs now warn in development builds instead of
  silently rendering an inert anchor.

- fafeb5f: Second pass against the reference designs, component by component, with a
  by-eye sweep of every story in light, dark, glass and glass-over-light.

  **Toast stacks.** A port of motion.dev's stacked notifications: toasts sit on
  top of each other, newest in front, each one behind pushed up 10px, scaled
  down 6% and faded 20%; a new toast springs in from below, a dismissed one
  shrinks away; hovering the stack fans it out. `Toaster` takes `position`.

  **Coverflow is the reference's coverflow.** The fan now follows the pointer
  continuously while dragging (the track follows in every mode) and snaps on
  release; neighbours rotate 20°, shrink to 70% and tuck under each other by
  distance, and the edges fade out rather than clip.

  **Progress springs.** The linear fill is `transform: scaleX()` on the spring
  (motion.dev's loading bar), so chunked updates move as one elastic bar, and
  it grows in from empty. `CircularProgress` is the thick, round-capped ring of
  the reference: `size` accepts a px diameter, `thickness` overrides the
  tenth-of-diameter stroke, the percentage scales with the ring, and the arc
  draws in.

  **Bar chart as a dashboard card.** `highlight` mutes every other bar and tags
  the emphasised one with its value and a pilled axis label; `average` draws a
  dotted reference line; `headline`/`stats`/`icon`/`actions` give every chart
  the card header of the reference. Bars are pill-shaped and grow from the
  baseline; negatives hang below it.

  **Donut** gets a real tooltip (HTML, anchored to the hovered segment - the
  SVG one was clipped to a sliver by the ring's 160-unit viewBox), a drop
  shadow on the ring itself that deepens under `floating`, and share
  percentages in the legend. The two donut stories are one.

  **Stepper** follows the reference: filled circles with a popping check,
  thick rounded connectors that fill right up to the current step, clickable
  steps with a `disabled` option, and a back/next playground.

  **Timeline `groups`** is the history layout: a year on a centred axis with a
  dot, media on the left, dated entries on the right.

  **Notification** composes an activity inbox (`avatar`, `badge`, `media`,
  `layout="inline"`) or alert cards.

  **ChatBubble** tails sit on the side facing the speaker, level with the
  avatar; bubbles are white-on-shadow / raised black.

  **Switch** thumb is now inset equally at both ends (the track was
  content-box, so its padding and border grew it past the thumb's travel).

  **Glass over light scenes.** `theme="light" material="glass"` is the light
  material: white-tinted surfaces, dark text. Two glass defects fixed on the
  way: Toast painted dark text on the dark overlay (a stale colour swap from an
  earlier, lighter tint), and default-tone progress fills and the first chart
  series were near-black on the dark card (they use the foreground "ink" now).

  **Radius `item` tier.** Menu items, the checkbox box, kbd, tooltip and the
  segmented-control indicator were pinned at 6px and ignored `soft`; they now
  use `--fuji-radius-item` (6px / 10px).

  Also: unchecked Checkbox well gets a hairline inset so it reads on the page
  background; ring track uses the stronger border; Notification titles wrap
  instead of truncating; an `Avatar` photo story.

- fafeb5f: **New: `@fujiui/react/registry.json`.** A machine-readable description of this
  package for tools that write code against it - editor agents, and the
  documentation site. It carries what a prop table cannot: which category a
  component belongs to and what it is for, its compound parts with both the
  dot-access (`Dialog.Content`) and named-export (`DialogContent`) forms, whether
  the file ships `"use client"`, the design tokens per appearance scope, the
  guides, and worked examples. Generated by `scripts/build-registry.mjs` on every
  build; the authored half lives in `registry/` and does not ship. It consumes
  `props.json` rather than re-deriving props, because two generators over one
  surface is the drift it exists to prevent.

  **`props.json` now reports real defaults.** It could only recover a default from
  a `Default \`x\`` phrase in a JSDoc comment, which most props never wrote - 62 of
416 had one, and two of those were the word "to", scavenged out of "Defaults to
false, which...". Defaults are now read from the component's own destructuring
(`size = "md"`), so a documented default is what the code does: 177 of 416, and
none of them wrong. It also carries `extends`(where a component's inherited
props come from) and`deprecated`.

  **Every prop is documented.** JSDoc coverage went from 181 of 416 props to all 416. `Chart` had 11 props and no descriptions; `DatePicker` 2 of 14; `Calendar`
  1 of 8; `FileUpload`, `Pagination`, `EmptyState` and `Result` none at all. This
  reaches consumers three ways at once - the IDE tooltip via `dist/index.d.ts`,
  the documentation site's prop tables, and the registry.

  **Added `./props.json` and `./registry.json` to SPEC's packaging section.**
  `./props.json` had been in the `exports` map for some time while SPEC §3 and §7
  still described three additional entries, so the artifact read as accidental.
  Both are now named, with what they are and why they are not documentation.

  **Registry components carry `title`.** The export name and the page name are not
  always the same thing - `IconButton` is documented as "Icon Button", and the
  "Layout" page documents five separate exports - so consumers rendering a
  component index need both.

  **The registry describes its own vocabulary.** Every prop whose type is a union
  of string literals now carries `values` (`size` -> `["sm","md","lg"]`), and a
  `types` block defines all 26 exported aliases once. Before this a consumer read
  `size: ComponentSize` and had nowhere to go - three of the most-used props in
  the package are aliases, covering 74 props in all.

  **Added `index`, `setup` and `tokens.groups`.** `index` is the listing shape
  precomputed: returning the `components` array to answer "what components are
  there" costs ~47k tokens against ~3.8k for the four fields the question
  actually wants. `tokens.groups` lets a token lookup be sliced rather than
  returning all ninety-nine. `setup` carries per-framework install steps for
  Next.js and Vite. Guides gained `path` and `bytes` instead of inlined content -
  `docs/` ships in the tarball, so a consumer reads a guide when it is asked for.

  **Registry gains `exports`.** The full public export list, values and types
  apart - 172 and 136 against the 88 catalogued components. A consumer checking
  whether an import is real cannot answer that from the component catalogue: the
  package also exports every `*Root` value, every `*Props` interface, and item
  types like `SelectItem` and `TreeNode`. Answering from the short list reports
  correct code as broken, which is worse than not checking at all.

  **Compound parts now state where their props come from.** 49 of 64 wrap a Base
  UI primitive directly and declare no named `*Props` type, so they were emitted
  with an empty prop list - and "takes no props" is the one thing that is
  certainly untrue of them. Each now carries `extends`, and the generator warns
  on a part that describes neither.

  **Fixed: two shipped defaults were English scavenged out of prose.**
  `Typography.as` was `"follow"` (from "defaults follow the variant's role") and
  `InfiniteScroll.loader` was `"spinner"`. The bare-word branch of the JSDoc
  default regex is gone; a fallback default now has to be quoted, backticked, or
  a literal. It is only a fallback in any case - 175 of 176 defaults are read
  from the source destructuring.

  **Fixed: `guides[].bytes` counted UTF-16 code units,** so three of the seven
  guides under-reported their size.

- fafeb5f: Add `--fuji-surface-raised` and move every content-bearing fill onto it.

  Under dark glass `--fuji-surface-strong` is a translucent **white** fill. That is
  deliberate: bare, textless fills - Switch, Slider and Progress tracks - have
  nothing but their own lightness to separate them from a near-black page, and at
  a dark tint they measured 1.01:1 against it, the literal same pixel. But a white
  tint lightens toward whatever is behind it, so every fill that carried text or an
  icon lost contrast the moment glass sat over a bright backdrop.

  The two needs want opposite tint directions, so no single value serves both.
  `--fuji-surface-raised` is the content-bearing twin: dark-tinted under dark
  glass, and identical to `--fuji-surface-strong` in every other block, so only
  dark glass changes at all.

  | dark glass, over the atmosphere          | before      | after  |
  | ---------------------------------------- | ----------- | ------ |
  | `AvatarGroup` "+N"                       | 2.10:1      | 7.01:1 |
  | `Pagination` inactive tiles              | 2.59:1      | 7.01:1 |
  | `Dropzone` / `FileUpload` rows           | 2.26:1      | 8.20:1 |
  | `Notification` / `EmptyState` icon tiles | 2.10:1      | 7.01:1 |
  | `Icon` `default` / `muted` / `subtle`    | 1.82-2.26:1 | 8.20:1 |

  Icons are judged against WCAG 1.4.11's 3:1 floor, text against 4.5:1; every case
  above now clears its own floor at both ends of the shipped scene.
  `--fuji-surface-strong` is unchanged, so the bare fills it was tuned for keep
  both their translucency and their 3:1 separation from the page.

  Also fixes `Dropzone`'s drag-over fill, which never painted in any theme.
  `scripts/css-entry.css` orders `fuji.components` after `fuji.utilities`, so the
  element's own `.fuji-glass-surface-subtle` beat every `fj:bg-*` utility
  regardless of specificity. The state now drives a component-layer rule
  (`.fuji-dropzone[data-drag-active]`), matching the pattern already used by
  `.fuji-chart-segment[data-active]` - and the backdrop blur that class also
  carries is preserved.

  Also fixes `ghost` Button/IconButton at tone `default`, whose hover state used
  the same bare-fill surface and so failed the same way: 2.26:1 over the
  atmosphere's bright pixels, under even the 3:1 non-text floor. It now hovers on
  `--fuji-surface-raised`, matching what the other four tones already did (each
  hovers on its own `-soft` tint). Ghost rests transparent, so any fill still reads clearly as hover feedback.

  Interactive rows that raise on hover (Sidebar, Calendar, NavigationMenu,
  TimePicker, Stepper, ButtonGroup and Chart's legend) now pair that fill with a
  hairline, via the shared `fuji-hover-raised` class. Under dark glass the fill
  alone could not do the job: on the darkest part of the atmosphere the panel
  behind these rows is already near-black, so no darker fill separates from it
  (measured 1.11:1, and no value improves it - there is no luminance left to
  spend), while a lighter fill needs dark ink, which is what the SELECTED state
  uses. An edge is luminance-independent, so it reads at any backdrop brightness,
  and it is the device the glass surfaces already use. Hovered rows measure
  1.93:1 against a resting row beside them, up from 1.11:1, with their text at
  8.45:1 (previously ~2.7:1).

  Two dark-glass tokens moved again after measuring text inside a **card** rather
  than on a bare panel. A card is itself a glass surface, so text in one
  composites through two translucent layers and lands lighter than the same ink on
  a single panel - `Statistic`'s trend caption sat at 4.24:1 over the shipped
  atmosphere, and `--fuji-fire` at 4.39:1, both under AA on the library's own
  backdrop. `--fuji-foreground-subtle` goes 71% -> 76% (4.60:1) and `--fuji-fire`
  `#ffb4b4` -> `#ffbbbb` (4.61:1). The stacked case, not the single-layer one, is
  what these values have to satisfy.

### Patch Changes

- fafeb5f: Fixed: components overflowed their parent in any app without a global
  `box-sizing` reset.

  This package deliberately ships no preflight, so a consumer with no reset of
  their own gets the CSS default, `box-sizing: content-box`. Thirteen components
  set an explicit size (width, height, or `min-width`) and padding or a border on
  the same element, which under `content-box` puts that padding or border
  outside the declared size - `w-full` plus `px-8` renders 64px wider than its
  parent's content box.

  `Container` was the visible case: at a 1280px viewport its `xl` width overhung
  the page by its own gutter, producing a horizontal scrollbar. Measured in a
  real browser, its computed `box-sizing` was `content-box` and its border box
  was 1233px inside a 1169px parent. The other twelve (`Sidebar`, `Toast`,
  `Tabs`, `Tree`, `List`, `Slider`, `Calendar`, `ChatBubble`, `Carousel`,
  `CommandMenu`, `MultiSelect`, `Kbd`) are narrower and so were latent rather
  than visible - `Kbd`'s case is a border outside a declared `min-width` rather
  than padding outside a width, the same shape of bug on a smaller element.

  All of them now set `fj:box-border` explicitly. A blanket
  `.fuji-theme-scope * { box-sizing: border-box }` would have been shorter and
  wrong: this stylesheet is imported globally, and that rule would restyle every
  piece of a consumer's own markup nested inside the provider.

  `src/styles/box-sizing.test.tsx` asserts the invariant against rendered markup
  and fails if any component sets a size and non-zero padding without it; `Kbd`'s
  border variant isn't shaped like that pattern and was checked by hand.

- fafeb5f: **Fixed: `Carousel` could not be swiped when its slides were images or links.**

  Those elements are natively draggable, so pressing one started the browser's
  own drag-and-drop. That takes the pointer stream away from the page - Chrome
  fires `dragstart` and then `pointercancel` about four pixels in - so the swipe
  died almost as soon as it began and the carousel could only be driven by its
  controls. `Carousel` now cancels that native drag on the viewport; a child can
  still opt back in with its own `draggable`.

  The same `pointercancel` was also being treated as a completed swipe. It
  carries no meaningful coordinate (Chrome reports `clientX: 0`), which read as a
  drag all the way to the viewport's left edge and threw the carousel several
  slides forward instead of snapping back. A cancelled gesture now returns to the
  current slide, and the distance is taken from the last offset actually applied
  rather than from the event.

  Most visible with `effect="coverflow"`, where the fan is meant to track the
  pointer continuously: because the gesture was cancelled before
  `data-swiping` had any effect, every slide kept its transition and the fan
  lagged behind the pointer rather than following it.

- fafeb5f: Size the keycap shadow to the gap between caps.

  `.fuji-keycap` drew `--fuji-shadow-control`, the token for free-standing
  controls. At `floating` elevation that shadow reaches roughly 28px below the
  cap, but caps sit 3-5px apart (`--fuji-key-gap` is fixed at every `size`), so
  almost all of it was painted underneath the neighbouring cap - invisible, and
  rasterised once per cap on a board with up to 104 of them. The cost was
  highest on `material="glass"` with `elevation="floating"`, the two largest
  shadow tokens in the system.

  Caps now take a new `--fuji-shadow-keycap`, a contact shadow that stays inside
  the gap. It is keyed on theme only: a cap is recessed into its board rather
  than floating above the page, so elevation belongs to the board, not the cap.
  The rendered result is unchanged at `regular` elevation in the solid themes,
  where the control shadow already fit; elsewhere only the occluded part is
  gone.

- fafeb5f: The README has a new "AI coding agents" section introducing
  [`@fujiui/mcp`](https://github.com/fuji-ui-kit/fuji-ui-react/tree/main/mcp#readme),
  an MCP server that gives Claude Code, Codex and other agents the API of the
  exact `@fujiui/react` version a project has installed - including the steps for
  setting Fuji up in an existing app - and checks the code they write against
  this package's conventions. A companion `fuji-ui` Agent Skill tells agents when
  to use it, and a Claude Code plugin installs both at once
  (`/plugin marketplace add fuji-ui-kit/fuji-ui-react`). The server reads the
  `dist/registry.json` this release adds, so it needs `@fujiui/react` 0.3.0 or
  later.
- fafeb5f: Fixed: a nested `FujiProvider radius="cornered"` inside a `soft` app rendered with
  soft corners. Cornered values were only declared on `:root`, so a cornered scope
  matched no radius rule and inherited `soft` from its ancestor. `cornered` now has
  its own `[data-fuji-radius="cornered"]` block, the same values as `:root`, so any
  scope (a nested provider, or a portal re-stamping the attribute) can switch back
  to it.
- fafeb5f: Fixed: the package did not compile against React 18, despite advertising it.

  `peerDependencies` has always said `^18.0.0 || ^19.0.0`, and the source has
  real branches for the differences between the two - but every CI run and every
  local install resolved React 19, so the 18 half of that claim had never once
  been executed. It was broken:

  - `React.useRef<HTMLImageElement>(null)` types `current` as **read-only** under
    React 18 (React 19 made it writable), so `Image`'s ref callback failed to
    compile. Declaring the ref as `<HTMLImageElement | null>` selects the mutable
    overload, which exists in both versions.
  - Assigning through a forwarded `ref.current` had the same problem, and is now
    cast to a bare structural type that depends on neither version's ref
    typings.

  CI gains a `react18` job that installs React 18 with `--no-save` and reruns
  typecheck and the full suite, so this cannot regress silently again. It
  verifies the downgrade actually took effect before running anything - the
  obvious version of that job passes against React 19 twice and reports green.

- fafeb5f: Three controls that silently ignored state they were supposed to render.

  **`disabled` had no visual effect on `Checkbox`, `Switch`, `RadioGroup`,
  `NumberInput`, `Combobox`, and `MultiSelect`.** Base UI renders these as
  `<span role="checkbox">` / `<span role="switch">` / `<span role="radio">` /
  `<div role="group">`, with the real `disabled` attribute sitting on a
  visually-hidden `<input>` beside them, not on the element carrying Tailwind's
  `disabled:` variant - a pseudo-class that can only match a genuine disabled
  form control, so it never matched. Measured on a disabled `Checkbox`:
  `opacity: 1`, `cursor: pointer` - pixel-identical to an active one. Base UI
  does mirror the disabled state onto these elements as `data-disabled`, so
  `Checkbox`, `Switch`, `RadioGroup`, and the shared `lib/field-surface.ts`
  recipe (which is what `NumberInput`'s spin-button group and
  `Combobox`/`MultiSelect`'s input group render through) now use the
  `data-[disabled]:` attribute variant instead - `opacity: 0.45`,
  `cursor: not-allowed`. `Input`, `Textarea`, and `NativeSelect` share the same
  recipe but were never actually affected: they render through a real
  `<input>`/`<textarea>`/`<select>`, where `disabled:` already matched.

  **A field's red invalid border stopped painting when `invalid` came from an
  ancestor `<FormField invalid>` instead of the field's own `invalid` prop.**
  `Input`, `NativeSelect`, `Textarea`, `NumberInput`, `Combobox`, `MultiSelect`,
  and `Select` all wrote `data-invalid={invalid ? "" : undefined}` - and a prop
  explicitly set to `undefined` still occupies that key, which wins Base UI's
  merge over the `data-invalid` it had already computed from the ancestor
  `FormField`. So `data-[invalid]:border-fuji-fire` never painted, and the
  field's only error cue was `FormField`'s helper text. (`aria-invalid` was
  unaffected - it's recomputed in a later merge - which is why this went
  unnoticed.) Fixed by omitting the attribute entirely when the local `invalid`
  prop is falsy, instead of asserting it to `undefined`, so `FormField`'s value
  passes through.

  **`IconButton` had no focus-visible ring**, falling back to the browser's
  native outline (measured ~2:1 contrast against a light page). The
  focus-visible classes lived in `Button`'s own JSX rather than in the
  `button.styles.ts` recipe both components are built from, so the line was
  never mirrored onto `IconButton`. It now lives in the shared recipe, so
  neither component can drift out of sync with it again.

- fafeb5f: Fixes from a one-by-one visual pass over every component in Storybook.

  **Removed the 1px inset "edge light" from raised objects.** Every `contained`
  button, active nav item, checked control and selected tab carried
  `inset 0 1px 0 rgb(255 255 255 / 14%)` on top of its drop shadow. At 1px with
  no blur that is a hairline, and a hairline reads as a border on every theme -
  not as light. Depth now comes from the cast shadow alone, which is what the
  reference designs do. The same 1px inset line was also baked into every dark
  and glass surface shadow (`--fuji-shadow-inset-highlight`, on cards, tables,
  charts, calendars) and is removed there too - glass surfaces already carry a
  real hairline border, so the inset line was a second border drawn just inside
  the first.

  **Links no longer inherit the browser's underline and blue.** This package
  ships no preflight, so a bare `<a href>` keeps the UA stylesheet's underline
  and `-webkit-link` colour - and because the underline is painted by the anchor
  itself, a coloured `<span>` inside it does not hide it. `Navbar` rendered grey
  labels on bright blue underlines; `Breadcrumb` and every `Sidebar.Item` were
  underlined; `Button asChild` onto a link was underlined. A shared
  `NATIVE_LINK_RESET` now sits next to `NATIVE_CONTROL_RESET` and is applied to
  every Fuji-styled anchor (`Link` manages its own underline by design).

  **`ghost` buttons no longer cast a shadow.** Button and IconButton's shared
  base applied `shadow-fuji-control` to every appearance, so a transparent ghost
  control rendered as a faint box. Ghost is now `shadow-none`.

  **`ButtonGroup`'s outline was far heavier than the bordered Button beside
  it.** Each segment kept its own shadow (the selected one its raised shadow)
  inside an `overflow-hidden` group, piling shadow against every divider. The
  group carries one shadow; segments carry none.

  **`Statistic` could display a negative number.** A rAF timestamp is stamped at
  the start of its frame, which can precede the `performance.now()` read the
  count-up took as its start time - so the first tick computed negative
  progress, the cubic ease went negative with it, and the tile showed "-1,292".
  Normally one frame; under rAF throttling, the frame that stays on screen.
  Progress is clamped at both ends and the start time comes from the first
  frame itself.

  **`Statistic`'s trend line** had the browser's default paragraph margins.

  **`DropdownMenu.GroupLabel`** was a bare re-export of the Base UI primitive -
  body-sized, foreground-coloured, flush to the popup edge. It is styled like
  every other group heading in the package now.

  **`BottomNavigation` gains a `position` prop and defaults to `sticky`.** It
  was hard-coded to `position: fixed`, which pins to the viewport regardless of
  where it is rendered - it escaped every container it was placed in, and could
  not be overridden via `className`, because Fuji's positioning class lives in
  its own cascade layer and wins over a consumer's utility. `sticky` pins to the
  bottom of its own scroll container (the page when rendered at the end of
  `<body>`, a panel when rendered inside one); `position="fixed"` restores the
  old behaviour, `"absolute"` suits a `position: relative` parent.

  **`FormField.Description`, `FormField.Error` and `CodeBlock`'s `<pre>`** kept
  the browser's default paragraph margins.

## 0.2.1

### Patch Changes

- 0158dd9: Updated package documentation and metadata: the README now links to the live
  documentation site at https://fuji-ui.vercel.app/ (docs, components,
  installation, and examples pages) as the primary place to browse Fuji, and
  `package.json`'s `homepage` field now points there instead of the GitHub
  README. No API, component, styling, or build changes.

## 0.2.0

### Minor Changes

- ce78068: Add `ChatBubble`, a Fuji-native chat message bubble for messaging/inbox-style
  UI, alongside `Notification` and `List`.

  - `align` (`"incoming" | "outgoing"`, default `"incoming"`) picks left-aligned
    neutral styling vs. right-aligned contained/accent styling, reusing the same
    tokens as `Button`/`Badge` - no new colors.
  - `avatar` accepts any `React.ReactNode` (typically an `<Avatar />`); `sender`,
    `timestamp`, and `status` (`"sent" | "delivered" | "read"`, rendered as an
    icon **and** a text label, never color alone) round out the message metadata.
  - `grouped` suppresses the avatar/sender/timestamp/status and tightens spacing
    for consecutive messages from the same sender, while still reserving the
    avatar's footprint so the run stays aligned. `ChatBubble` itself does not own
    any list/collection state - the consumer decides which bubbles are grouped.
  - `children` is a free-form content area (text, an attachment chip, a
    typing-dots indicator, an audio-row composition, ...); `ChatBubble.Attachment`
    (also exported as `ChatBubbleAttachment`) is a small file/media chip
    sub-component for the common case, renderable as a static chip or - with
    `onClick` - a real, keyboard-accessible button.
  - Server-renderable (no `"use client"`), theme/radius/elevation-aware, and
    capped at `max-w-[75%]` with `break-words` so it stays usable at 375px
    widths.

- ce78068: Add `Card.Media`/`Card.Overlay` composition primitives, a `size` prop to
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

- ce78068: `regular` and `floating` elevation now use **identical** control heights and
  panel padding - elevation changes shadow depth only, matching what
  SPEC.md/README.md/docs/theming.md already claimed but the tokens didn't
  actually deliver.

  **The bug:** `[data-fuji-elevation="regular"]` in `tokens.css` overrode
  `--fuji-control-h-sm` (29px -> 30px), `--fuji-control-h-md` (38px -> 36px),
  and `--fuji-panel-p` (16px -> 14px), while `floating` kept the `:root`
  defaults. So switching elevation at runtime silently resized every control
  and panel by a couple of pixels - a real, visible layout shift for something
  docs describe as "shadow depth only."

  **The fix:** removed the `[data-fuji-elevation="regular"]` override block
  entirely. Both modes now read the same `:root` control-height/panel-padding
  values; only the `[data-fuji-theme="*"][data-fuji-elevation="floating"]`
  shadow-token blocks still differ between the two modes, exactly as intended.

  This is a visible sizing change for anyone using `floating` (or switching
  between the two at runtime): controls and panels in `regular` are now
  1-2px taller/more-padded than they were (matching what `floating` already
  looked like), since `regular`'s values were the ones removed, not
  `floating`'s. Docs (`SPEC.md`, `README.md`, `docs/theming.md`) updated to
  match - all three previously described a "regular reads more compact"
  distinction that no longer exists.

- ce78068: Fix an "earth" tone contrast bug and recolor `earth`/`forest` to genuine
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

- ce78068: Made the compiled `styles.css` fully isolated from a consumer's own Tailwind
  build - no installation change (`import "@fujiui/react/styles.css"` is still
  the only step), but the compiled output itself is now defensive against
  collisions that were previously possible.

  **The problem.** `dist/styles.css` shipped Tailwind's own generic theme
  variables (`--spacing`, `--radius-sm`, `--text-xs`, `--font-weight-*`, ...) at
  `:root`, and every utility class Fuji's components use (`flex`, `p-4`,
  `text-sm`, `rounded-lg`, and Fuji's own `bg-fuji-*`/`rounded-fuji-*` color and
  radius utilities) under Tailwind's bare `theme`/`utilities` cascade layers. A
  consumer that also uses Tailwind would generate the exact same class names
  and the exact same variable names in their own build. Two concrete failure
  modes followed: (1) cascade layers with the **same name** merge across
  stylesheets, so Fuji's `utilities` layer and the consumer's own `utilities`
  layer became one layer resolved by plain source order - not real isolation;
  (2) a consumer who customized their own Tailwind spacing/color scale would
  have that scale's `--spacing`/`--color-*` values silently apply to Fuji's own
  internal utilities too (or vice versa), since both stylesheets read/wrote the
  same bare variable names.

  **The fix**, in `scripts/css-entry.css`:

  - `prefix(fj)` on both Tailwind imports (`tailwindcss/theme.css`,
    `tailwindcss/utilities.css`). Every Tailwind-generated class in Fuji's
    output is now `fj:`-prefixed (`fj:flex`, `fj:bg-fuji-earth`,
    `fj:hover:bg-fuji-surface-strong`), and Tailwind's own generic theme
    variables are renamed `--fj-*` (`--spacing` -> `--fj-spacing`, etc.) -
    fully independent of a consumer's identically-named `--spacing`/`--color-*`
    variables in either direction. `fj` was chosen specifically because it does
    **not** collide with Fuji's own pre-existing `--fuji-*` token vocabulary;
    `tokens.css`/`fuji-theme.css` are untouched by the prefix; only Tailwind's
    own generated names are renamed. Every component's className strings were
    updated to the `fj:`-prefixed form (a mechanical rename across ~90
    components, verified with an AST-based extraction script rather than a
    blind find/replace, to avoid touching non-class strings like comparison
    operands or import specifiers). Fuji's own hand-written classes
    (`fuji-glass-surface`, `fuji-theme-scope`, `fuji-scrollbar`, and the rest of
    the `.fuji-*` recipe classes in `base.css`) are untouched - they were never
    Tailwind-generated and were already uniquely namespaced.
  - An explicit, uniquely-named cascade layer order declared up front:
    `@layer fuji.theme, fuji.base, fuji.utilities, fuji.components;`, with
    `base.css`'s own `@layer base {}`/`@layer components {}` blocks renamed to
    match. Namespacing the layer names (not just adding layer ordering) is what
    actually prevents the same-name-merges-across-stylesheets problem above.
  - Two hand-written selectors in `tokens.css` that targeted Tailwind-generated
    class names directly (`.animate-spin`/`.animate-pulse`/`.animate-bounce`
    for the reduced-motion override, and `.bg-fuji-background` for the glass
    atmosphere passthrough rule) were updated to their `fj:`-prefixed selector
    form so they still match what's actually in the DOM.

  **Verified, not assumed:** `tailwind-merge` (used by every component's `cn()`)
  needed **no configuration change** - it parses a leading `prefix:` generically
  as a variant and only inspects the final utility token for conflict-group
  matching, so `fj:p-2 fj:p-4` still collapses to `fj:p-4` exactly as `p-2 p-4`
  did before. Verified directly against the installed `tailwind-merge` version
  rather than assumed. Three consumer fixtures under `fixtures/` (plain
  Vite/no Tailwind, Tailwind with preflight, Tailwind with a 3x-customized
  `--spacing` and a custom brand color) were built against a packed tarball and
  checked in a real browser across light/dark/glass: Button, Input, Card, a
  portaled Dialog, and a deliberately-conflicting host stylesheet all render
  correctly with zero interference in both directions - including the
  custom-spacing fixture, where Fuji's own Button/Input padding stayed at its
  normal tuned size while the host's own identically-named `p-4` utility
  correctly rendered 3x larger, proving the two scales are fully independent.
  These fixtures aren't published (not in the `files` allowlist) but are kept
  in the repo for future regression checks.

  **Genuine remaining limitation:** Tailwind's own internal composable-
  transform custom properties (`--tw-translate-x`/`-y`/`-z`, used by the
  `translate`/`scale`/`rotate` utilities) are not renamed by `prefix()` - they
  remain Tailwind's fixed internal names regardless of prefix, and Tailwind
  itself sets their initial value via a universal `*, ::before, ::after,
::backdrop { --tw-translate-x: 0; ... }` rule. This is vendored Tailwind
  output (not something this package authors), is scoped to three
  narrowly-named custom properties with no visible effect on any real CSS
  property by itself, and is inherent to using any transform utility with
  Tailwind v4 at all - not a gap specific to this change.

- ce78068: Remove `ContextMenu` and `HoverCard` from the public API.

  **Migration notes:**

  - `ContextMenu` (and `ContextMenuRoot`/`ContextMenuTrigger`/`ContextMenuContent`/`ContextMenuItem`/`ContextMenuSeparator`)
    is removed. It was a thin wrapper around Base UI's `@base-ui/react/context-menu`
    primitive. Consumers who need custom right-click behavior can depend on
    `@base-ui/react/context-menu` directly - it is unaffected, it's just no
    longer wrapped/exported by Fuji.
  - `HoverCard` (and `HoverCardRoot`/`HoverCardTrigger`/`HoverCardContent`/`HoverCardContentProps`)
    is removed. It was a thin wrapper around Base UI's `@base-ui/react/preview-card`
    primitive. Consumers who need hover/focus preview behavior can depend on
    `@base-ui/react/preview-card` directly - it is unaffected, it's just no
    longer wrapped/exported by Fuji.

- ce78068: Replace `ComponentVariant` with a warmer, more distinctive "tone" vocabulary,
  and consolidate `Tag` into `Badge` and `Inline` into `Stack`. Also fixes a
  dark-theme "floating" elevation halo, adds focus rings and clear buttons to
  text fields, and rounds out several components with tone support, custom
  layouts, and missing stories.

  **Migration notes:**

  - `ComponentVariant` is removed and replaced by two separate types:
    - `ComponentTone` (`default | earth | fire | water | forest | sun`) - the
      decorative color prop on `Button`, `IconButton`, `ButtonGroup`, `Badge`,
      `Icon`, and the new tone support on `Checkbox`, `RadioGroup`, `Switch`,
      `Slider`, `Spinner`, `Stepper`, and `Avatar`. Old values map to new ones:
      `default`/`primary` → `default`, `secondary` → `earth`, `success` →
      `forest`, `warning` → `sun`, `danger` → `fire`, `info` → `water`.
    - `StatusTone` (`default | success | warning | danger | info`) - unchanged
      prop name and values on semantic components (`Alert`, `Toast`, `Result`,
      `StatusIndicator`, `Timeline`, `Progress`, `CircularProgress`); no call-site
      changes needed.
    - Every `variant` prop on a decorative component (`Button`, `IconButton`,
      `ButtonGroup`, `Badge`, `Icon`) is renamed to `tone`, with the value
      mapping above.
  - `Tag` is removed. Use `Badge` instead - it now accepts `onRemove` and
    `removeLabel` (previously Tag-only) and uses the same pill shape as before.
  - `Inline` is removed. Use `Stack` with `direction="horizontal"` instead -
    `Stack` gained `direction`, `wrap`, and `justify="between"`, and widened
    `align` with `"baseline"`.
  - The `--fuji-success`/`-warning`/`-danger`/`-info` CSS custom property
    families (and every `-foreground`/`-soft`/`-border`/`-contained-*` sibling)
    are renamed to `--fuji-forest`/`-sun`/`-fire`/`-water`. Update any consumer
    CSS that references these tokens directly.

  **Also in this release:**

  - Fixed a dark-theme "floating" elevation halo (shadows were tinted with the
    dark theme's cream foreground color instead of black).
  - Added a 2px focus ring to text fields (`Input`, `Textarea`, `Select`,
    `Combobox`, ...) with no layout shift.
  - Added `clearable` to `Input` and `Textarea`.
  - `NumberInput` is compact by default; pass `fullWidth` for the previous
    full-width behavior.
  - `RadioGroup`'s selection emphasis moved to the border, with a smaller inner
    dot.
  - `Switch`'s thumb now animates with a rolling transform (respecting
    `prefers-reduced-motion`).
  - `Spinner` has a new, lighter-weight arc animation.
  - `Stepper` steps accept a custom `icon`.
  - `Statistic` accepts `card` to render inside a `Card` surface.
  - `Timeline` accepts `layout` (`left | right | alternating`), with a
    responsive mobile fallback for `alternating`.
  - `CommandMenu` now exposes proper ARIA combobox/listbox semantics for its
    keyboard-navigable results.
  - Fixed a handful of missing overflow/underline affordances (`Tabs` list
    overflow, `Tooltip` max-width, `Breadcrumb` link underlines) and missing
    `focus-visible` styling on `Tabs` and `Collapsible`.

### Patch Changes

- ce78068: Fix native browser chrome appearing on raw `<button>`, `<input>`, and
  `<select>` elements across most of the package (most visibly `DataTable`'s
  sortable column headers, `Pagination`'s page-number buttons, and
  `Combobox`/`MultiSelect`'s dropdown-toggle and clear buttons) when this
  package's `styles.css` is the only stylesheet loaded, with no Tailwind
  preflight reset available to zero out the browser's default
  border/background/box-sizing/margin/padding on those elements.

  - Added `NATIVE_CONTROL_RESET`, a small shared class string applied first (so
    a component's own border/background classes still win via
    `tailwind-merge`) to every raw native control this package renders
    directly, including ones rendered by a Base UI primitive with no styling
    of its own: `Button`, `IconButton`, `Input`, `Textarea`, `NativeSelect`,
    `Navbar`'s item buttons, `Tabs`' tab buttons, `SegmentedControl`'s tabs,
    `DataTable`'s sort toggle, `Pagination`'s page-number buttons,
    `Combobox`/`MultiSelect`'s input, chevron-toggle, and clear/chip-remove
    buttons, `CommandMenu`'s search input and result rows, `NumberInput`'s
    input and increment/decrement buttons, `OTPInput`'s slots,
    `TimePicker`'s AM/PM and hour/minute buttons, `PasswordInput`'s
    visibility toggle, `SearchInput`'s clear button, `Dropzone`/`FileUpload`'s
    remove-file buttons, the shared `DismissButton` (used by `Dialog`,
    `Drawer`, `Toast`, and `Image`'s fullscreen preview), `Tag`'s remove
    button, `Rating`'s stars, `Calendar`'s header/month/year/day buttons,
    `Carousel`'s play-pause, arrow, and indicator buttons, `List.Item`'s
    clickable row, `Stepper`'s clickable step circles, `Collapsible` and
    `CodeBlock`'s triggers, `NavigationMenu`'s trigger, and `Image`'s
    fullscreen-preview trigger.
  - Added `box-border` to `Card`, `EmptyState`, `Notification`, `Table`,
    `Select`'s popup, and `Image`'s wrapper, and `m-0`/`p-0`/`list-none` to
    `Card.Title`/`Card.Description`, `EmptyState`'s and `Notification`'s text,
    and `Timeline`'s list, so a consumer-supplied width or the browser's
    default heading/paragraph/list margins can't throw off layout without
    preflight's `box-sizing: border-box` and margin/padding reset.
  - `Image` now sets `display: block` on its `<img>` elements, matching
    preflight's `img, svg, video { display: block }`.

  No public API, theme, radius, elevation, or accessibility behavior changed -
  every component renders identically wherever preflight (or an equivalent
  reset) was already present; this only restores the intended appearance where
  it wasn't.

- ce78068: Fix several portaled and navigation-menu components rendering with the
  browser's native default styling instead of Fuji's design tokens.

  - **Portaled content never inherited Fuji's font.** `--fuji-font-sans` was
    only applied via a `.fuji-theme-scope` class on `FujiProvider`'s own
    wrapper element; every Base UI portal (`Dialog`, `Drawer`, `AlertDialog`,
    `Popover`, `DropdownMenu`, `ContextMenu`, `HoverCard`, `NavigationMenu`,
    `Select`, `Combobox`, `MultiSelect`, `DatePicker`, `TimePicker`,
    `CommandMenu`, `Toast`) attaches directly to `document.body`, outside that
    wrapper, and only carried `data-fuji-theme`/`data-fuji-radius`/
    `data-fuji-elevation` for color-token resolution - never the font. Every
    dialog title, dropdown item, and select option was silently rendering in
    the browser's unset default font (serif in most browsers) instead of
    Fuji's. `font-family` is now also applied via the `[data-fuji-theme]`
    attribute selector these portals already carry (color/background stay
    `.fuji-theme-scope`-only, since painting a background there would affect
    invisible floating-ui positioner wrappers).
  - `Dialog.Title`/`Description`, `Drawer.Title`/`Description`,
    `AlertDialog.Title`/`Description`, and `Popover.Title`/`Description` were
    bare, unstyled re-exports of Base UI's own `<h2>`/`<p>` parts - combined
    with the font-inheritance gap above, a dialog's title rendered as a large
    bold serif heading with default browser margins instead of Fuji
    typography. All eight now carry Fuji's heading/body text styles.
  - `NavigationMenu.List`/`Item` (real `<ul>`/`<li>` elements) had no
    `list-none`/margin/padding reset, so menu items showed bullet points.
    `NavigationMenu.Link` (a real `<a>`) was a bare re-export with zero
    styling, rendering as a default blue underlined link instead of matching
    the menu's other items.

  No public API, theme, radius, elevation, or accessibility behavior changed -
  components render identically wherever they happened to already sit inside
  a `.fuji-theme-scope` element (e.g. non-portaled content); this only fixes
  the ones that didn't.

- ce78068: Fix several correctness, SSR, CSS-scoping, and accessibility issues found in
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

## 0.1.1

- Updated package metadata and documentation for the public `@fujiui/react` package.

## 0.1.0-alpha.0

Initial extraction of the Fuji component system from the `fuji-ui-website`
repository into a standalone package. See the README for installation and
usage.

Going forward, releases are managed via
[Changesets](https://github.com/changesets/changesets) - run `npm run changeset`
when making a user-facing change, and this file is updated automatically by
`npm run version`.
