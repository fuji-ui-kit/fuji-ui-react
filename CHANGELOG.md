# @fujiui/react

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
