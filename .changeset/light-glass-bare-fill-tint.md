---
"@fujiui/react": minor
---

Fix bare fills being invisible under `theme="light"` + `material="glass"`, and
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
