---
"@fujiui/react": minor
---

The motion and composition work from the design brief, built against the
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
