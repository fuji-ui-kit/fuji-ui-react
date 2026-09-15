---
"@fujiui/react": minor
---

A shared motion system, and three bugs that only a rendered page could catch.

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
