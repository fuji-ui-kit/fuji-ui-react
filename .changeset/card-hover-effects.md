---
"@fujiui/react": minor
---

**`Card` gains an `effect` prop, and its hover treatment now actually
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
