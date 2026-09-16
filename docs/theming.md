# Theming and design tokens

Fuji's appearance is driven entirely by CSS custom properties. There are no
per-component theme props - every component reads the same `--fuji-*` variables,
scoped by `data-fuji-*` attributes that `FujiProvider` sets. That is what makes
an interface stay visually coherent by construction.

## The four axes

| Attribute             | Values                  | Default    |
| --------------------- | ----------------------- | ---------- |
| `data-fuji-theme`     | `light` \| `dark`       | `light`    |
| `data-fuji-material`  | `solid` \| `glass`      | `solid`    |
| `data-fuji-radius`    | `cornered` \| `soft`    | `cornered` |
| `data-fuji-elevation` | `regular` \| `floating` | `regular`  |

`FujiProvider` renders a `<div class="fuji-theme-scope">` carrying all four.
Portal-rendered content (Dialog, Popover, Menu, Select, Tooltip, Toast) re-stamps
the same attributes onto its own portal root, so overlays match the provider they
logically belong to even though they render outside its DOM subtree.

`theme` and `material` are independent axes - either theme can render in
either material, so "dark mode" and "glass" are not a single mutually
exclusive choice. See [Glass](#glass) below.

Because it is attribute-scoped rather than global, nesting works: a nested
`FujiProvider` creates an isolated scope, which is how a "compare themes
side by side" preview is built.

## Token families

`@fujiui/react/tokens.css` defines roughly 90 custom properties. They fall into
these groups:

| Group      | Examples                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Surfaces   | `--fuji-background`, `--fuji-surface`, `--fuji-surface-subtle`, `--fuji-surface-strong`, `--fuji-surface-raised`, `--fuji-surface-overlay` |
| Foreground | `--fuji-foreground`, `--fuji-foreground-muted`, `--fuji-foreground-subtle`                                                                 |
| Borders    | `--fuji-border`, `--fuji-border-strong`, `--fuji-focus-ring`                                                                               |
| Tone       | `--fuji-default`, `--fuji-forest`, `--fuji-sun`, `--fuji-fire`, `--fuji-water`, each with `-foreground`, `-border`, and `-soft` companions |

`--fuji-surface-strong` and `--fuji-surface-raised` are a deliberate pair, and
under **dark glass** they tint in opposite directions. `-strong` is a translucent
_white_ fill: a bare, textless fill - a Switch, Slider or Progress track - has
nothing but its own lightness to separate it from a near-black page. `-raised` is
the fill for surfaces that _carry_ something (a badge, a count, an icon tile): it
tints dark, so it darkens whatever shows through and the content on top stays
legible over any backdrop. Reach for `-raised` whenever the fill has text or an
icon on it, and `-strong` only for a fill with nothing on it. In every other
theme and material the two are identical.
| Contained fills | `--fuji-contained-default`, `--fuji-contained-fire`, ... |
| Radius | `--fuji-radius-*` (switches on `data-fuji-radius`) |
| Spacing | `--fuji-space-*`, `--fuji-panel-p`, `--fuji-control-h-sm/md/lg` |
| Typography | `--fuji-font-sans`, `--fuji-font-primary`, `--fuji-font-mono`, `--fuji-font-display` |
| Motion | `--fuji-duration-fast/base/slow`, `--fuji-duration-overlay`, `--fuji-ease`, `--fuji-ease-spring`, `--fuji-press-scale` |
| Shadow | `--fuji-shadow-*` (depth switches on `data-fuji-elevation`) |
| Glass | `--fuji-backdrop-blur*`, `--fuji-backdrop-saturate*`, `--fuji-overlay-backdrop` |

Tone colors keep their identity across every theme and material; surfaces,
foregrounds, and borders are redefined per theme and per material (and
re-declared rather than inherited, so a nested theme scope resolves
correctly).

`--fuji-forest`/`-sun`/`-fire`/`-water` back the `ComponentTone` prop
(`default | fire | water | forest | sun`) used by purely decorative
props like `Button`'s and `Badge`'s `tone`. Components whose value carries
semantic/ARIA meaning (`Alert`, `Toast`, `Result`, `StatusIndicator`,
`Progress`, `CircularProgress`, `Timeline`) instead use `StatusTone`
(`default | success | warning | danger | info`) - a stable, meaning-first
vocabulary that never changes, mapped internally onto the same tone tokens
(`success → forest`, `warning → sun`, `danger → fire`, `info → water`).

## Overriding tokens

Override any token by redeclaring it in a more specific scope. This is the
supported extension point - you do not need to fork a component to restyle it.

```css
/* Change the "default" tone app-wide */
.fuji-theme-scope {
  --fuji-default: #4f46e5;
  --fuji-contained-default: #4f46e5;
  --fuji-default-foreground: #ffffff;
}

/* Or scope it to one region */
.checkout-panel {
  --fuji-radius-control: 999px;
}
```

Two things to check whenever you override a color:

1. **Contrast.** The shipped values were tuned to clear WCAG AA (4.5:1) against
   the surfaces they sit on in every theme × material combination. An override
   is yours to verify.
2. **Every theme × material combination.** A value that reads well in `light`
   may disappear in `dark`, and a value tuned for the opaque `solid` material
   may wash out against `glass`'s translucent surfaces. Scope overrides per
   axis when they need to differ:

```css
[data-fuji-theme="dark"] .fuji-theme-scope {
  --fuji-default: #818cf8;
}

[data-fuji-material="glass"] .fuji-theme-scope {
  --fuji-default: #a5b4fc;
}
```

## Using Fuji tokens in your own markup

`styles.css` ships the utility classes Fuji's own components use. If you want to
use `bg-fuji-surface` or `text-fuji-foreground-muted` directly in **your** markup
and your app runs its own Tailwind pass, map the tokens into your Tailwind theme
so your pass can generate those utilities:

```css
/* your global stylesheet, after importing @fujiui/react/styles.css */
@import "@fujiui/react/styles.css";

@theme inline {
  --color-fuji-background: var(--fuji-background);
  --color-fuji-surface: var(--fuji-surface);
  --color-fuji-foreground: var(--fuji-foreground);
  --color-fuji-foreground-muted: var(--fuji-foreground-muted);
  --color-fuji-border: var(--fuji-border);
  /* ...whichever tokens your own markup uses */
}
```

If you are not using Tailwind, just reference the variables directly:

```css
.my-panel {
  background: var(--fuji-surface);
  color: var(--fuji-foreground);
  border: 1px solid var(--fuji-border);
  border-radius: var(--fuji-radius-panel);
}
```

## CSS isolation

Nothing about installation changes for this: `import "@fujiui/react/styles.css"`
is still the only step. This section explains what that stylesheet guarantees
so you can trust it alongside your own Tailwind setup, a different CSS
framework, or plain CSS - no Tailwind config, PostCSS plugin, or `@theme`
mapping is ever required to use Fuji safely.

Every class Fuji's stylesheet generates - both Tailwind's own utilities
(`flex`, `p-4`, `text-sm`, ...) and Fuji's color/radius/shadow utilities
(`bg-fuji-forest`, `rounded-fuji-control`, ...) - carries an `fj:` prefix
(`fj:flex`, `fj:bg-fuji-forest`) in the compiled output, and every generic
Tailwind theme variable Fuji's build depends on internally (`--spacing`,
`--radius-sm`, `--text-xs`, `--font-weight-*`, ...) is renamed to `--fj-*`
before it ever reaches your page. Two consequences:

- **No class collisions.** If your own app also generates a `.flex` or `.p-4`
  utility (via its own Tailwind build, or by hand), Fuji's internal DOM never
  uses those exact class names, so there's nothing for the two rules to fight
  over - regardless of which stylesheet loads first or which CSS cascade
  layer either ends up in.
- **No shared-variable drift.** If you customize your own Tailwind theme -
  a different spacing scale, different default colors - Fuji's own components
  keep their tuned sizing and colors, because they never read your app's
  `--spacing`/`--color-*` variables. The reverse holds too: nothing in Fuji's
  stylesheet touches the bare `--spacing`/`--radius-sm`/etc. names your own
  utilities depend on.

Fuji's own hand-authored classes (`fuji-glass-surface`, `fuji-theme-scope`,
`fuji-scrollbar`, and the rest of the `.fuji-*` recipe classes in the
package) and its `--fuji-*` design tokens are unaffected by any of this -
they were already uniquely namespaced and never collided with anything to
begin with.

### Overriding a component's styles with `className`

Every Fuji component merges the `className` you pass. A plain utility on the
instance - `<Card className="p-0">`, `<Sidebar className="w-full">`,
`<Drawer className="w-[28rem]">`, `<Typography className="mt-8">` - wins over
the component's own `fj:`-prefixed styling for the same property, **provided
your page ranks Fuji's cascade layers between your `base` and `components`
layers.** Declare that order once, as the very first line of your global
stylesheet:

```css
@layer properties, theme, base, fuji, components, utilities;
```

That one line is the whole setup. `fuji` stands for all of Fuji's own layers
(`fuji.theme`, `fuji.base`, `fuji.utilities`, `fuji.components`) as one
group, so the result is:

| Layer (lowest to highest) | Contains                            | Consequence                                                                            |
| ------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------- |
| your `theme`, `base`      | Tailwind theme variables, preflight | A reset like `button { background-color: transparent }` can't flatten a Fuji component |
| `fuji`                    | every Fuji component style          |                                                                                        |
| your `components`         | your own component classes          | Beat Fuji                                                                              |
| your `utilities`          | `p-0`, `w-full`, `mt-8`, ...        | Beat Fuji - this is what makes `className` overrides work                              |

#### Tailwind v4 with Next.js

```css
/* app/globals.css */
@layer properties, theme, base, fuji, components, utilities;

@import "tailwindcss";
@import "@fujiui/react/styles.css";
```

```tsx
// app/layout.tsx
import "./globals.css";
```

Import the stylesheet from `globals.css` as above, _or_ keep
`import "@fujiui/react/styles.css"` in `layout.tsx` - once the `@layer` line
is in place, which file loads first no longer matters. Keep `properties` in
the list: Tailwind v4 already declares that layer ahead of everything else,
and listing it first matches what it does.

#### Tailwind v4 with Vite

The same line, at the top of the CSS file your entry point imports:

```css
/* src/index.css */
@layer properties, theme, base, fuji, components, utilities;

@import "tailwindcss";
@import "@fujiui/react/styles.css";
```

```tsx
// src/main.tsx
import "./index.css";
```

#### Why the line is needed

A cascade layer's priority is fixed by the first time its name appears on the
page, and between layers that order is compared _before_ specificity. Without
the declaration, the ranking depends on which stylesheet the bundler happens
to emit first:

- **Your Tailwind CSS first** - your `utilities` layer is named before
  `fuji`, so Fuji ranks above it and `<Card className="p-0">` silently keeps
  its padding.
- **Fuji's stylesheet first** - Fuji's stylesheet itself declares
  `properties, theme, base, fuji, components, utilities`, so this order
  already works. You still want the explicit line: it stops a later import
  reorder from flipping you into the case above.

The line has to be the first rule that names any of these layers - above
every `@import` (CSS allows `@layer` statements there). Declaring `fuji`
_first_ instead (`@layer fuji, theme, base, ...`) is a trap: it puts your
preflight above Fuji, so `* { padding: 0; margin: 0; border: 0 solid }` and
`button { background-color: transparent }` strip every component.

If you already declare your own layers, insert `fuji` right after the layer
holding your reset and before the ones holding classes you want to win.

#### Tailwind v3, plain CSS, and other frameworks

CSS that isn't in any cascade layer outranks every layer. Tailwind v3 emits
its utilities unlayered, as does ordinary hand-written CSS, so a class of
yours already beats Fuji's styling with no setup. The flip side: an
**unlayered reset** (Tailwind v3's preflight, a normalize/reset stylesheet)
also outranks Fuji and will strip component backgrounds, borders, and
padding. Either put the reset in a layer below Fuji
(`@import "./reset.css" layer(base);` with the `@layer` line above), or turn
it off (`corePlugins: { preflight: false }` in Tailwind v3).

#### What still doesn't override

- **A few glass-material rules are unlayered.** Under `material="glass"`,
  Fuji clears the background of surfaces that use the page background and
  sets the keyboard-shortcut surface fill outside any layer, so a background
  utility on those elements loses under glass. Use an inline `style` there.
- **`!important` inside Fuji's print and boot-transition rules** beats any
  className. Both are narrow by design: print output and the single
  appearance swap during page load.
- **Parts you can't reach with `className`.** A utility only overrides the
  element it is placed on. For an inner part, use that part's own
  sub-component, a wrapper element, or an inline `style`.

### Layer names

Fuji's rules live only in its own `fuji.*` layers (`fuji.theme`,
`fuji.base`, `fuji.utilities`, `fuji.components`), never in Tailwind's bare
`theme`/`base`/`utilities`. CSS merges same-named layers across different
stylesheets on a page, so a bare name would put Fuji's rules into your own
`utilities` layer and decide conflicts by file order. The package stylesheet
does _name_ the bare `theme`/`base`/`components`/`utilities` layers once, in
the position statement above, but puts no rules in them. (The one bare layer
it does write to is `properties`, where Tailwind v4 puts `@property` fallback
initial values - the same thing your own Tailwind v4 build puts there.)

## Glass

`material="glass"` layers translucency and blur over whichever theme is
already active - it is not a separate color scheme. `--fuji-background`,
`--fuji-foreground`, and the tone colors still come from `theme`:
`<FujiProvider theme="dark" material="glass">` renders on dark's own
`#0f0f0e` page, `<FujiProvider theme="light" material="glass">` on light's
own `#eceae6` - the same two backgrounds `solid` uses, not a third palette.
`material` is a `FujiProvider` axis independent of `theme` -
`<FujiProvider theme="dark" material="glass">` and
`<FujiProvider theme="light" material="glass">` are both first-class
combinations, not two names for the same thing.

What glass itself contributes on top of the active theme: graduated
translucent surface tints, `backdrop-filter` blur and saturation, and border/
shadow treatments that imply depth. A small set of tokens - the
`forest`/`sun`/`fire`/`water` "contained" tone fills among them - stay fixed
literals in both themes rather than following `theme`, because they pair
with glass's own high-alpha fills instead of with the page. (The `default`
tone fill is the exception: it inverts with `theme` under glass, the same
way it already does under `solid` - a light cream chip on dark+glass, a
near-black one on light+glass.) See the comments beside each token in
`tokens.css` for the contrast reasoning. Glass degrades to opaque
cool-neutral surfaces automatically when:

- the user has `prefers-reduced-transparency: reduce` set, or
- `backdrop-filter` is unsupported.

If you build your own glass surface, use the shipped `.fuji-glass-surface`,
`.fuji-glass-surface-subtle`, `.fuji-glass-surface-strong`, or
`.fuji-glass-surface-overlay` classes rather than hand-rolling a `backdrop-filter`

- they carry the fallbacks.

### What gets the material

Glass is a material for surfaces that sit _over_ other content, not for the
controls painted on top of them. Panels, chrome and overlays take the
translucent tint and the `backdrop-filter`; buttons, fields and the rest of the
control layer stay solid tone objects, so they read _against_ the glass surface
instead of competing with it. Cost is part of the reason: `backdrop-filter`
creates a compositing layer per element, so a form with twenty glass inputs pays
for twenty of them, for a blur nobody can see behind a control that small.

- **Cards and panels** - `Card`, `Collapsible`, `Fieldset`, `List`, `Table`,
  `CodeBlock`, `Chart`, `Calendar`, `Dropzone`.
- **Chrome** - `Sidebar`, `BottomNavigation`, `Pagination`, and `Tabs` in its
  `pill` variant.
- **Overlays** - `Dialog`, `AlertDialog`, `Drawer`, `Popover`, `Select`,
  `Combobox`, `MultiSelect`, `DropdownMenu`, `NavigationMenu`, `CommandMenu`,
  `Toast`, and `Keyboard` when `floating`.
- **Controls stay solid.** A `contained` Button under `dark` + `glass` is a
  92%-opaque cream fill with a cast shadow, not a blurred panel - the top of the
  depth scale, an object reading as sitting _on_ the surface rather than painted
  into it. `IconButton`, `Badge`, `Switch`, `Slider`, `Checkbox`, `RadioGroup`,
  `Input` and the other fields all behave the same way.
- **The exception** is a control sitting directly on media with no surface under
  it - `Carousel`'s playback button - which takes the overlay material, because
  a bare glyph over a photograph has nothing else to read against.

### Choosing your own backdrop

Glass composites over whatever is behind it, so how much of that backdrop a
surface lets through decides whether text on it stays legible. Fuji's tokens are
measured against **Fuji's own atmosphere**, and they clear WCAG AA against it
with margin - the `-subtle` tier, the most transparent one, holds muted text at
6.17:1 and full-strength text at 12.24:1 there.

A photograph is a different problem. An arbitrary image can present any pixel
from black to white under the same panel, and no genuinely translucent material
survives that: over a worst-case photo the same `-subtle` panel drops to 2.03:1.
That is physics, not a bug - the only fix is opacity, which stops it being
glass.

So, if you supply your own backdrop:

- **A controlled backdrop** - your own gradient, a brand colour, a photo you
  have chosen and can see - works with any surface tier. Look at it.
- **User-supplied or arbitrary imagery** (an avatar, a hero photo, a CMS image)
  behind text: use `--fuji-surface` or `--fuji-surface-raised`, not
  `--fuji-surface-subtle`, and prefer full-strength `--fuji-foreground` over
  `--fuji-foreground-muted`.
- **Either way**, keep the busiest part of the image away from the text, or put
  a scrim between them. `.fuji-glass-atmosphere` exists precisely so you get a
  backdrop that is already known to work.

### The atmosphere is opt-in

By default, that's the whole picture: translucent, blurred surfaces sitting
directly on the active theme's own flat background - graduated surface tints
and `backdrop-filter` blur over light's `#eceae6` or dark's `#0f0f0e`,
nothing else underneath. That's the appearance most consumers ship. If you
want the gradient atmosphere shown in the reference screenshots on top of
that, apply the shipped `.fuji-glass-atmosphere` class yourself, typically on
the app root or a preview panel:

```tsx
<FujiProvider theme="dark" material="glass">
  <div className="fuji-glass-atmosphere min-h-screen">
    <App />
  </div>
</FujiProvider>
```

**The atmosphere is fixed decorative art, not a rendering of your theme.** It
ships as two hard-coded gradients - one for each glass tint (dark and light;
see [Tint](#tint) below) - and neither one reads `--fuji-background`,
`--fuji-foreground`, or any token you've overridden: dark tint gets a
slate-blue, warm-terracotta and muted-teal canvas, light tint a white,
warm-tan and cool-blue-grey one. Applying the class does not get you "your
theme, with glass on top" - it replaces the theme's flat background with
Fuji's own reference scene, which is why opting in can be surprising if you
expected your theme's colors to show through, softened. A consumer's own
photo, brand gradient, or plain color is an equally valid backdrop -
arguably the more common real case - and needs no class at all: glass
composites over whatever is behind it either way.

The class is safe to render unconditionally, including under `solid`: its
selector is scoped to `[data-fuji-material="glass"] .fuji-glass-atmosphere`,
so it is visually inert whenever glass isn't active. See
[docs/upgrading.md](./upgrading.md) if you relied on the automatic gradient
before this change.

### The overlay material

Floating surfaces (dialogs, drawers, menus, popovers) use the `-overlay` tier:
a translucent tint over a deliberately small blur (`8px`) - small because glass
only reads as glass while recognisable shapes survive the blur; large radii
average the backdrop into a flat color that looks opaque no matter how
translucent the tint is. Legibility lives in the tint, not in filter tricks:
on the tint's own canvas, text clears WCAG AA with a wide margin. Over
arbitrary bright content (a photo's sky, a white card) primary text still
holds, but muted text can dip below AA - the same trade OS glass materials
make. When an overlay will sit on bright media in a text-heavy flow, use a
light-tinted glass surface (see Tint below); users who need full opacity get
it automatically via `prefers-reduced-transparency`.

A popup that renders _inside_ another glass surface (rather than portaling to
the body) cannot use backdrop blur at all - an ancestor with a
`backdrop-filter` becomes a backdrop root, so the nested panel's own filter
never sees the content it covers. Those use the near-opaque
`.fuji-overlay-panel-nested` class instead (Calendar's month/year chooser is
the in-tree example).

### Tint

Glass surfaces tint either **dark** (light text) or **light** (dark text,
frosted white). There is no separate tint prop or attribute for this - the
active `theme` **is** the tint:

```
theme="light" + material="glass"  ->  light-tinted glass (dark text)
theme="dark"  + material="glass"  ->  dark-tinted glass (light text)
```

`[data-fuji-material="glass"][data-fuji-theme="light"]` selects the
light-tinted surface; the dark-tinted surface is the unqualified
`[data-fuji-material="glass"]` rule paired with `[data-fuji-theme="dark"]`.

To show glass tinted independently of the page's own theme - typically when
the backdrop behind the glass, not the app's theme, decides legibility (a
bright hero photo shown under an otherwise dark-themed page) - nest a
`FujiProvider` with the theme you want the glass to read as, and `material`
re-declared (nested providers don't inherit unspecified axes from their
ancestor - each falls back to its own default), around just that region:

```tsx
<FujiProvider theme="dark" material="glass">
  <App>
    <FujiProvider theme="light" material="glass">
      <BrightPhotoSection />
    </FujiProvider>
  </App>
</FujiProvider>
```

An earlier version of this axis was a dedicated `glassTint` prop (mirrored as
`data-fuji-glass`) that defaulted to following `theme` but could be set
independently of it; it has been removed in favor of nesting `theme` scopes,
since a page's theme and its glass tint never actually needed to diverge in
practice. See [docs/upgrading.md](./upgrading.md) for migrating off it and
`DESIGN.md` for the material's contrast rationale.

## Elevation

`floating` and `regular` differ in shadow depth only - `floating` uses
deeper, softer shadows via the same `--fuji-shadow-*` tokens. Control heights
and panel padding are identical between the two modes, so switching elevation
at runtime never shifts layout. What elevation deliberately never does is add
scale, translation, or hover motion to static surfaces.

## Reduced motion

Fuji's own transition durations collapse to `0ms` under
`prefers-reduced-motion: reduce`, and count-up numbers, carousel autoplay, and
indeterminate progress animation stop. If you add motion using
`--fuji-duration-*`, you inherit this for free; hard-coded durations do not.
