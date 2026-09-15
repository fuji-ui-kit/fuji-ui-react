---
"@fujiui/react": minor
---

Second pass against the reference designs, component by component, with a
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
