---
"@fujiui/react": minor
---

Rework the visual system: surfaces are now defined by layered shadow rather
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
