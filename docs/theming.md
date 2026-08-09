# Theming and design tokens

Fuji's appearance is driven entirely by CSS custom properties. There are no
per-component theme props - every component reads the same `--fuji-*` variables,
scoped by `data-fuji-*` attributes that `FujiProvider` sets. That is what makes
an interface stay visually coherent by construction.

## The three axes

| Attribute             | Values                       | Default    |
| --------------------- | ---------------------------- | ---------- |
| `data-fuji-theme`     | `light` \| `dark` \| `glass` | `light`    |
| `data-fuji-radius`    | `cornered` \| `soft`         | `cornered` |
| `data-fuji-elevation` | `regular` \| `floating`      | `regular`  |

`FujiProvider` renders a `<div class="fuji-theme-scope">` carrying all three.
Portal-rendered content (Dialog, Popover, Menu, Select, Tooltip, Toast) re-stamps
the same attributes onto its own portal root, so overlays match the provider they
logically belong to even though they render outside its DOM subtree.

Because it is attribute-scoped rather than global, nesting works: a nested
`FujiProvider` creates an isolated scope, which is how a "compare themes
side by side" preview is built.

## Token families

`@fujiui/react/tokens.css` defines roughly 90 custom properties. They fall into
these groups:

| Group           | Examples                                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surfaces        | `--fuji-background`, `--fuji-surface`, `--fuji-surface-strong`, `--fuji-surface-overlay`                                                                   |
| Foreground      | `--fuji-foreground`, `--fuji-foreground-muted`, `--fuji-foreground-subtle`                                                                                 |
| Borders         | `--fuji-border`, `--fuji-border-strong`, `--fuji-focus-ring`                                                                                               |
| Tone            | `--fuji-default`, `--fuji-earth`, `--fuji-forest`, `--fuji-sun`, `--fuji-fire`, `--fuji-water`, each with `-foreground`, `-border`, and `-soft` companions |
| Contained fills | `--fuji-contained-default`, `--fuji-contained-fire`, ...                                                                                                   |
| Radius          | `--fuji-radius-*` (switches on `data-fuji-radius`)                                                                                                         |
| Spacing         | `--fuji-space-*`, `--fuji-panel-p`, `--fuji-control-h-sm/md/lg`                                                                                            |
| Typography      | `--fuji-font-sans`, `--fuji-font-primary`, `--fuji-font-mono`, `--fuji-font-display`                                                                       |
| Motion          | `--fuji-duration-fast/base/slow`, `--fuji-ease`, `--fuji-press-scale`                                                                                      |
| Shadow          | `--fuji-shadow-*` (depth switches on `data-fuji-elevation`)                                                                                                |
| Glass           | `--fuji-backdrop-blur*`, `--fuji-backdrop-saturate*`, `--fuji-overlay-backdrop`                                                                            |

Tone colors keep their identity across all three themes; surfaces,
foregrounds, and borders are redefined per theme (and re-declared rather than
inherited, so a nested theme scope resolves correctly).

`--fuji-earth`/`-forest`/`-sun`/`-fire`/`-water` back the `ComponentTone` prop
(`default | earth | fire | water | forest | sun`) used by purely decorative
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
   the surfaces they sit on in every theme. An override is yours to verify.
2. **All three themes.** A value that reads well in `light` may disappear in
   `dark` or wash out against `glass`. Scope overrides per theme when they need
   to differ:

```css
[data-fuji-theme="dark"] .fuji-theme-scope {
  --fuji-default: #818cf8;
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
(`bg-fuji-earth`, `rounded-fuji-control`, ...) - carries an `fj:` prefix
(`fj:flex`, `fj:bg-fuji-earth`) in the compiled output, and every generic
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

### Overriding a property a Fuji component also sets

The "no collisions" guarantee above is about identical class _names_ - it
does not mean a plain utility of yours can always override a Fuji component's
own styling for the same CSS _property_. If you put, say, a plain `hidden`
or `border-transparent` class on a Fuji component instance, and that
component's own `fj:`-prefixed classes already set `display` or
`border-color`, the two rules are still in separate, independently-ordered
stylesheets - whichever one happens to register later in your page's
cascade wins, regardless of source order in your JSX or which class looks
more specific. In practice this usually means the Fuji-authored rule wins,
so your override can silently no-op.

Two options both reliably win regardless of cascade-layer order:

- **An inline `style` prop** for a one-off property override (e.g.
  `style={{ borderColor: "transparent" }}` instead of a `border-transparent`
  className).
- **A wrapper element** with no `fj:`-prefixed classes of its own, for
  layout-affecting properties like `display`/`position` (e.g. wrap an
  `<IconButton>` in `<div className="lg:hidden">` rather than putting
  `lg:hidden` on the `IconButton` itself, which also carries its own
  `fj:inline-flex`).

On top of the prefix, the compiled stylesheet declares its own explicit,
uniquely-named cascade layers (`fuji.theme`, `fuji.base`, `fuji.utilities`,
`fuji.components`) rather than Tailwind's bare `theme`/`base`/`utilities`
names. CSS merges same-named layers across different stylesheets on a page,
so a bare name would let your own Tailwind build's `utilities` layer merge
with Fuji's - namespacing the layer, like the class prefix, keeps Fuji's
rules in a layer of their own with a stable, predictable priority.

## Glass

`glass` is a layered translucent surface system, not a color swap: graduated
surface tints, `backdrop-filter` blur and saturation, and border treatments that
imply depth. It degrades to opaque cool-neutral surfaces automatically when:

- the user has `prefers-reduced-transparency: reduce` set, or
- `backdrop-filter` is unsupported.

If you build your own glass surface, use the shipped `.fuji-glass-surface`,
`.fuji-glass-surface-subtle`, `.fuji-glass-surface-strong`, or
`.fuji-glass-surface-overlay` classes rather than hand-rolling a `backdrop-filter`

- they carry the fallbacks.

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
