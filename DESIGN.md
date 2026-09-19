# Fuji visual system - decisions and rationale

Contributor-facing. `docs/theming.md` is the consumer-facing token reference;
this file records _why_ the values are what they are, so a future change can
tell a deliberate decision from an accident.

Token values live only in `src/styles/tokens.css`. The recipes that consume
them live in `src/styles/base.css`, `src/components/fuji/lib/appearance.ts`,
`src/components/fuji/lib/field-surface.ts` and
`src/components/fuji/lib/status-surface.ts`. Those five files restyle all
86 components at once - which is the point, and also why every change to them
must be checked with `node scripts/render-gallery.mjs` across all sixteen
appearance combinations.

## The core idea: surfaces are defined by shadow, not by border

Fuji previously drew every surface with a visible 10% border and a shadow so
faint (4-6% alpha) it did nothing. The result was a flat, outlined interface
that read as generic - the single biggest reason the library looked like every
other Tailwind component kit.

The system now inverts that:

- **Borders are a hairline** (light: 6% - was 10%), present for definition, not
  as the thing that describes the surface.
- **Shadows are real and layered** - three layers (contact, ambient, cast)
  rather than one or two, so a card reads as sitting above the page.
- **The page is meaningfully darker than a surface.** Light's background moved
  from `#f7f6f2` to `#eceae6` so a white surface actually separates from it.
  Two near-identical off-whites cannot be told apart, no matter the shadow.

### `.fuji-raised`

The top of the depth scale: a solid tone object - the primary action, the
active tab, the checked box - that reads as sitting _on_ the surface rather
than being painted into it. The cast shadow alone does this. An earlier
version also added a 1px inset white "edge light" at the top; at 1px with no
blur that is a hairline, and a hairline reads as a border on every theme, so
it was removed - the reference designs get their lift from the shadow only.

Applied by `appearance.ts` to every `contained` tone, so Button, IconButton,
Badge and everything else on that recipe pick it up together.

## Appearance axes are now visible decisions

Both axes were previously too subtle to notice, which made them dead weight in
a provider API that advertises them as headline features.

| Axis                                 | Before               | Now                  |
| ------------------------------------ | -------------------- | -------------------- |
| `cornered` radius                    | 8 / 12 / 14 px       | 6 / 10 / 14 px       |
| `soft` radius                        | 13 / 18 / 22 px      | 14 / 20 / 26 px      |
| `regular` -> `floating` (light card) | 16 -> 24 px max blur | 24 -> 48 px max blur |
| `regular` -> `floating` (dark card)  | 10 -> 24 px max blur | 12 -> 60 px max blur |

Elevation still changes **shadow depth only** - never geometry, scale, or
motion (SPEC.md §2). On a near-black page a darker shadow is nearly
invisible, so dark's `floating` tier uses a much larger blur radius to carry
the lift.

## Glass: a material, not a translucent rectangle

Modelled on Apple's Human Interface Guidelines "Materials". Three things were
wrong before, and all three had to change together:

**1. Not enough blur or saturation.** 6-16 px blur at 105-120% saturation
produces a flat grey wash. A material needs substantial blur _and_ a real
saturation boost so colour behind it bleeds through. Now 20/28/36/44 px at
160/180/190/200% across the four tiers.

**2. Nothing behind it to refract.** The shipped atmosphere was four
desaturated slate/taupe gradients - effectively flat grey. Blur over flat grey
is still flat grey. It now carries genuine hue range (cool indigo, warm
terracotta, muted teal) at a luminance that keeps white foreground legible.

**3. Materials tinted white.** This is the important one. A white tint pulls
the panel _toward_ whatever is behind it, so white foreground text fails WCAG
AA the moment the backdrop is bright - measured at **3.2:1** over the warm
region of the atmosphere. Apple's dark materials tint _dark_ for exactly this
reason: darkening the backdrop makes the material's contrast independent of
what it sits on. Fuji's materials now tint `rgb(12 14 18)`, with the 18% white
hairline border doing the work of reading as glass rather than as a flat scrim.
The tints were subsequently lowered a step (30/38/50 -> 22/28/42 for
`-subtle`/`-surface`/`-strong`; `-strong` later left that progression entirely
for `rgb(255 255 255 / 35%)` on separate contrast grounds - see its comment)
with the blur
raised to match, because tint and blur work against each other: enough of the
first and the second barely shows, and the panels read as dark cards rather
than as a material with a scene behind them. `tokens.css` carries the current
values and the measurements; treat it as the source of truth over this note.
(An additional 1px inset white "rim highlight" in the
shadow stack was removed along with the one on raised objects - at 1px with
no blur it read as a second border drawn just inside the first.)

Because the base is now guaranteed dark, the three text tiers could become a
real scale again - they were 100% / 90% / 89% white, which rendered as one
tier. They are now 100% / 82% / 71%.

Measured against every stop of the shipped atmosphere, the worst case is
**7.66:1** for foreground, **5.79:1** muted, **4.81:1** subtle - all clear of
WCAG AA.

### Two tints, because glass is translucent

Glass needs two tints, not one, because it's translucent: whatever sits
behind it - a photo, a page - shows through, and no single tint stays
legible over both a light and a dark backdrop. Over a genuinely light
backdrop (a white page, a pale photograph) white text drops below AA - at a
38% tint over pure white it is 2.0:1. Apple solves this by having both a
light and a dark material and selecting per appearance, and so does Fuji -
but Fuji has no separate tint axis for it. The active `theme` **is** the
glass tint: `[data-fuji-material="glass"][data-fuji-theme="light"]` is the
white-tinted surface (dark text, dark raised accents); unqualified
`[data-fuji-material="glass"]` (i.e. paired with `[data-fuji-theme="dark"]`)
is the dark-tinted base. There used to be a dedicated `glassTint` prop
(mirrored as `data-fuji-glass`) that defaulted to following `theme` but could
be set independently of it; that axis was removed because a page's theme and
its glass tint never actually needed to diverge in practice, and the
independent axis meant `theme` alone didn't fully describe what a glass panel
would look like. A region that needs glass tinted differently from the page
around it - a dark hero photo shown under an otherwise light-themed page -
now nests a `<FujiProvider theme="dark" material="glass">` scope around just
that region (nested providers don't inherit unspecified axes from their
ancestor, so `material` has to be re-declared alongside `theme`); see
`docs/upgrading.md` for the migration. Storybook has a
`Material` toolbar (`solid` / `glass`, independent of the `Theme` toolbar's
`light` / `dark`) to turn glass on and a `Backdrop` toolbar (light / dark /
mixed / photo) for what sits behind it - there is no separate tint toolbar,
since `Theme` now covers it.

Two glass regressions the by-eye sweep caught that no token test could:
`Toast` carried a glass-only colour swap from when the overlay tint was 58%
(dark text on a then-medium panel); at the 82% dark overlay it painted dark
text on dark. The default tone under glass used to be near-black in both
themes, reasoned as glass's own raised accent - right for a chip with a cast
shadow, wrong for a 2px progress fill or a chart stroke (those use the
foreground "ink" instead; that part still holds). That reasoning held only
while glass painted its own fixed medium-slate `#2c323b` canvas (below).
Once glass started inheriting the real theme background instead and
dark+glass's page became theme's genuinely near-black `#0f0f0e`, the same
near-black fill stopped reading as an accent and started being the page, on
the page - measured **1.03-1.05:1** across Checkbox/Switch/Slider/
RadioGroup's checked/on state, i.e. invisible checkboxes, switches, sliders
and radios. `--fuji-default` now itself inverts with `theme`, the same way
solid light/dark's own `--fuji-default` already does: light cream
(`rgb(245 241 232 / 92%)`) with dark ink under dark+glass, near-black
(`rgb(22 24 27 / 92%)`) with white ink under light+glass - kept translucent
(92% alpha) so it still reads as glass rather than an opaque theme swatch.
Re-measured: **14.41:1** against dark+glass's page. This was forced by the
contrast failure, not chosen for looks - see the "CRITICAL FIX" comment
beside `--fuji-default` in `tokens.css` for the full numbers before
restoring a single literal on aesthetic grounds.

### Glass inherits the theme, not a third palette

A later pass found glass still overriding `--fuji-background` to a fixed
`#2c323b` in both themes (and `--fuji-foreground` to a fixed white), with
`--fuji-page-background: transparent` so a decorative atmosphere gradient
could paint through instead. The result: "dark theme + glass" and "light
theme + glass" rendered the identical canvas - a third color scheme that
happened to be blurry, not dark-with-glass-surfaces. `theme` and `material`
are independent axes (see above); the page canvas is `theme`'s job, not
`material`'s, so glass has no business picking its own.

Glass now declares neither `--fuji-background` nor `--fuji-foreground` -
both fall straight through the cascade to whichever `[data-fuji-theme]`
block is active on the same element. `--fuji-background` under `dark` +
`glass` is dark theme's own `#0f0f0e`; under `light` + `glass` it's light
theme's own `#eceae6` - the same two values `solid` uses, verified by reading
the computed value back for all four theme x material combinations. A
handful of tokens stay fixed literals in both themes regardless - the
`--fuji-forest/-sun/-fire/-water` tone fills and their `contained-*`/`-soft`
pairs chief among them - because they are high-alpha (82-92%) overlays where
the fill's own color already dominates the composite; theme-sourcing just
the label ink on top of a fill that stays fixed measured as low as
**1.11:1** under dark theme in an early attempt at this fix (dark theme's
own light-cream `--fuji-default-foreground` ink on glass's then near-black
fill). (`--fuji-contained-default` was reasoned about the same way and
briefly stayed fixed too, but it does not any more - the near-black literal
it shared with `--fuji-default` turned out to disappear against dark+glass's
own, now-genuinely-dark page; see "the default tone under glass" above.)
Each of these is commented in place in `tokens.css` with its own contrast
numbers - read them before assuming a token "should" follow the theme.

The atmosphere gradient behind the screenshots above is no longer painted
automatically either. It moved to the opt-in `.fuji-glass-atmosphere` class,
applied deliberately by whoever wants it (the website's showcase panels, a
demo, Storybook's own decorator) rather than by every glass root.
`[data-fuji-material="glass"]:where(html)` still sets a real
`background-color: var(--fuji-background)`, so contrast tooling and any
context that can't render decorative layers (forced-colors, print) walk a
real DOM background that matches what glass surfaces actually composite
against.

Unlike `--fuji-background`/`--fuji-foreground` above, the atmosphere's own
`--fuji-glass-atmosphere-image` does **not** get its value from a theme
token - it stays two hard-coded gradients (`rgb(72 88 116 …)`
slate-blue/terracotta/teal for the dark-tinted material,
`rgb(255 255 255 …)` white/tan/blue-grey for the light-tinted material - see
the two `--fuji-glass-atmosphere-image` definitions in `tokens.css`),
selected by `data-fuji-theme` (which is now also the tint, since glass has no
separate tint axis of its own), never by `--fuji-background` or any override.
That is deliberate, not a leftover: the class exists to reproduce Fuji's own
reference screenshots on demand, not to render "the active theme, blurred."
A future change that tries to make the atmosphere track a customized theme
would be solving a problem the class was never meant to solve - the
class-free path (a consumer's own photo or gradient behind glass) already
covers "glass over my own backdrop."

## Motion

Timing lives in tokens (`--fuji-duration-*`, `--fuji-ease*`) and collapses
under `prefers-reduced-motion`. `--fuji-ease-spring` is a `linear()` ramp that
overshoots and settles, so a plain CSS transition can feel physical without a
JS animation runtime - motion.dev's examples are the reference for _feel_, not
a dependency.

### The recipes

Motion is expressed as named recipes in `base.css`, not as per-component
utility strings. Eleven overlays each carrying their own
`transition-[transform,opacity] duration-… ease-…` had drifted into four
different durations and two different scales for what a user reads as one
gesture; the timing _is_ part of the identity, so it belongs in one place.

| Recipe                           | Used by                                                       | Behaviour                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `.fuji-motion-backdrop`          | every modal backdrop                                          | opacity only                                                                                                                   |
| `.fuji-motion-modal`             | Dialog, AlertDialog, CommandMenu, Image lightbox              | scale 0.96 + a 12px rise, spring in, plain ease out                                                                            |
| `.fuji-motion-popup`             | Tooltip, Popover, Select, Combobox, MultiSelect, DropdownMenu | origin-aware scale from `--transform-origin`                                                                                   |
| `.fuji-motion-popup-morph`       | NavigationMenu                                                | the above, plus width/height so the box resizes between items                                                                  |
| `.fuji-motion-sheet`             | Drawer                                                        | no spring: an edge-anchored panel that overshoots leaves a gap at the edge it should be flush against                          |
| `.fuji-motion-toast`             | Toast                                                         | the stack: index _i_ sits 10px up, 6% smaller, 20% fainter; enters from 60px/85%, exits 80%/20px                               |
| `.fuji-coverflow-slide`          | Carousel `effect="coverflow"`                                 | continuous offset in slide widths → rotateY ±20°, scale 0.7-1, x tuck past 0.571 widths                                        |
| `.fuji-progress-fill/-ring-fill` | Progress, CircularProgress, Stepper connectors                | `scaleX` / dash offset on the spring; grow in from empty via a keyframe `from`, never a rAF toggle                             |
| `.fuji-motion-indicator`         | Tabs, SegmentedControl                                        | the active-item box slides and resizes between slots                                                                           |
| `.fuji-chart-line/-area/-point`  | LineChart                                                     | stroke draws in, fill wipes in behind it, points land after                                                                    |
| `.fuji-keyboard-dock`            | `Keyboard floating`                                           | the docked board rises 12px and fades in; entrance only - a closed dock unmounts rather than lingering over the page it covers |

Two implementation notes that are easy to undo by accident:

- **`scale` is used as its own CSS property, never through `transform`.**
  Tailwind v4 compiles `-translate-x-1/2` (which centres every modal) to the
  separate `translate` property, and `translate`/`scale`/`transform` compose
  rather than overwrite. That is what lets the modal recipe add a
  `transform: translateY(…)` rise without disturbing the centring.
- **The chart line draws itself with `pathLength="1"`.** Normalising the path's
  geometric length to 1 means `stroke-dasharray: 1` with an offset animating
  1 → 0 sweeps any path, with no `getTotalLength()` measurement - which would
  need a DOM read per series on every data change and is wrong on the server.

### The tilt is a lean, not a swing

`Card effect="tilt"` follows motion.dev's tilt-card for _feel_ - a spring on
`requestAnimationFrame`, no transition chasing the pointer - but not for
_amount_. The reference peaks around 7deg under a 500px perspective; on a
large card that swung the corner under the pointer far out of plane and read
as a toy, which is the opposite of calm. The shipped values are 3deg at the
corners, a 1200px perspective (a short one exaggerates foreshortening, so
even a small angle warps a big card) and a 4px push-back. They live as named
constants at the top of `CardTilt.tsx`; a change there is a visual-identity
change, not a tuning tweak.

### Exit is not entry reversed

Overlays drop the spring on the way out and use the shorter base duration. An
overshoot on close reads as the dialog bouncing back into the room rather than
leaving it; dismissal should feel immediate, not choreographed.

### Nothing is gated on `requestAnimationFrame`

Entrance animations are keyframes with `forwards`, not a class toggled from a
rAF callback. The rAF version means the element is `opacity: 0` until that
frame runs - and in a backgrounded tab, or an automated browser, it never
does. `Chart` shipped that way and rendered permanently blank under
throttling. As a keyframe the worst case is that it appears instantly.

`Button`'s `ripple` is opt-in, not default: press scale plus a brightness
shift is Fuji's baseline feedback, and a ripple on every button in an app is
noise rather than a system.

Animations that would otherwise re-render React on every frame write to the
DOM instead - see `Statistic`'s count-up.

## Accessibility decisions that shaped the visuals

Several visual choices exist because the accessible version came first.

- **`aria-current` everywhere "active" was a colour.** Navbar,
  BottomNavigation, Sidebar and Calendar all signalled state with a hue and
  nothing else. The raised treatment (`.fuji-raised`) is now the shared visual
  for "selected", and `aria-current` is the announced half.
- **A latched modifier is a lamp, not a redrawn legend.** Shift and Caps Lock
  had to show their state somewhere, and re-lettering the board (`a` -> `A`,
  `1` -> `!`) is both a hundred-cap repaint and a lie about what a cap is -
  real keycaps are doubleshot and never change. The lamp is the same signal a
  physical board gives, lit in the board's own `tone`, sitting top-right
  because every latched cap is a wide one whose legend is already against the
  left edge. `aria-pressed` carries the announced half.
- **Today's dot in `Calendar`** is a shape, not just an accent colour - the one
  marker in that grid with no other visual form.
- **Charts are one tab stop, not one per point.** A three-series, twelve-point
  chart put thirty-six stops between the controls either side of it, each
  announcing a value already present in the visually-hidden data table every
  chart renders. Arrow keys move a cursor instead.
- **The `.fuji-motion-*` recipes all collapse under `prefers-reduced-motion`**
  because their durations are tokens, not literals. That is the main reason
  the durations are tokens.

### A token bug worth remembering

`:root { --fuji-page-background: var(--fuji-background) }` looks like a
redirect. It is not: a custom property whose value is a `var()` is substituted
where it is **declared**, so that line resolved once against `:root`'s light
`--fuji-background` and inherited the light colour into the dark theme, which
then painted a light page under dark surfaces. Every theme block has to
restate any derived token whose dependency it overrides;
`src/styles/tokens.test.ts` enforces it now.

## Open, not yet done

- Fonts: the identity still depends on the website's own webfonts. An opt-in
  `@fujiui/react/fonts.css` is planned so consumers can get the real thing.
- The type scale is still patched per call site in
  `typography/typography.styles.ts` with `calc(var(--fuji-text-*) - 1px)`
  instead of the tokens carrying the intended values.
- `tailwind-merge` stays a runtime dependency. Removing it needs
  `NATIVE_CONTROL_RESET` restructured first so no component emits two classes
  from one conflict group - see the comment in `src/lib/cn.ts` and
  `src/styles/class-conflicts.test.tsx`.
- Per-component CSS entry points (so a ten-component consumer does not pay for
  the whole 95 kB stylesheet) are not built yet.
- `@base-ui/react` is a minor behind (1.6 -> 1.7) and `lucide-react` several
  (1.28 -> 1.33); neither bump has been verified. Held deliberately: both would
  invalidate the appearance sweep below, so they belong in their own change.
- `size-limit` is not wired into CI, so nothing fails when the bundle grows.
- `Table.Row interactive` is still only a pointer shortcut. A focusable `<tr>`
  announces as a row, with no role saying it is activatable and no name for
  what activating it does; `aria-label` on a `<tr>` is not reliably read.
  Changing the row's role would break the table's structure, so the guidance
  (put the real action in a cell) is documented on the prop instead.
- `Timeline`'s alternating layout keeps `display: contents` on its `<li>`. It
  is what lets the connecting line stretch against the grid's row height, and
  the historical bug where browsers dropped `display: contents` elements from
  the accessibility tree is fixed in every engine in the supported range - but
  it is a knowing trade, not an oversight.

## How this was checked

`scripts/render-gallery.mjs` renders the sixteen appearance combinations from
the built package. On top of that, every Storybook story (343 of them, across
83 story files) is loaded in a real browser under three appearances -
light/solid/cornered/regular, dark/solid/soft/floating,
dark/glass/cornered/floating - and asserted on:

- no CSS rule from outside Fuji's own layers matches a Fuji element, unless the
  story itself put that class on it via `className`
- the resolved `data-fuji-theme/material/radius/elevation` match what was asked for
- `--fuji-page-background` never disagrees with `--fuji-background` (the dark
  page bug above)
- nothing falls back to a serif font
- no page-level horizontal overflow
- no laid-out element with text and a zero-size box

Three real defects came out of that sweep, all fixed:

1. **The dark theme painted a light page** (the `var()`-in-a-custom-property
   trap described above).
2. **`Timeline`'s alternating layout** - its connecting line was cut 20px short
   of every next dot by padding on the line column, and each side's content was
   aligned _away_ from the centre axis instead of toward it.
3. **Fourteen components overflowed their parent without a global `box-sizing`
   reset.** Setting a width and padding on one element is `content-box` by
   default, and this package ships no preflight, so the padding landed outside
   the declared size. `Container` overhung a 1280px viewport by its own gutter.
   All fourteen now set `fj:box-border`; `src/styles/box-sizing.test.tsx`
   asserts the invariant.

The common thread: all three were invisible to a unit test, because in every
case the class names were exactly right. Only a laid-out page shows them.

### What the automated sweep could not see

The sweep above inspects every CSS rule in every _stylesheet_. The browser's
own UA stylesheet is not in `document.styleSheets`, so an entire class of
no-preflight bug passed straight through it: default link underlines and the
UA blue on `Navbar`, `Breadcrumb`, `Sidebar.Item` and `Button asChild`; default
paragraph margins on `Statistic`'s trend line. A second pass now checks
Fuji-owned anchors, form controls, lists, headings and media against the UA
defaults directly (`ua-underline`, `ua-link-color`, `ua-appearance`,
`ua-margin`, `ua-list-style`, `ua-inline-media`).

And some things only a person sees. A component-by-component visual pass over
all 86 components (every story, as a contact sheet of real story iframes)
found: the 1px inset "edge light" on every raised object reading as a border

- removed; `ghost` buttons casting a shadow and reading as faint boxes;
  `ButtonGroup`'s piled-up segment shadows reading as a heavy outline;
  `DropdownMenu.GroupLabel` being an unstyled passthrough; and `Statistic`
  rendering negative on its first animation frame. Each now has a regression
  guard where one is possible; the `inset-hairline` check is in the sweep.
