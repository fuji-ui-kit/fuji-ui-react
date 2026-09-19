---
"@fujiui/react": minor
---

Give `Keyboard` its own sound toggle.

`sound` was a one-way prop: a board either clicked or it did not, and the only
way to let someone silence one was for the app to build a control and wire it
up. Every app that wanted the obvious affordance built the same switch.

`soundToggle` now renders that control on the board itself, in a strip above
the caps: a speaker glyph plus a lamp lit in the board's own `tone` - the same
signal a latched Caps Lock gives, for the same reason (state on this board is a
light, never a redrawn legend). Two channels carry the state, and the icon
changes shape rather than only colour. The strip is row 1 of the cap grid, so
it inherits the deck's width and padding, and everything in it is sized from
`--fuji-key-unit` with pixel floors, so it stays in proportion from a 30px-cap
diagram to a 92px-cap docked board. The control clears the 24px touch-target
floor at every board size.

It defaults to `interactive`, so a board you can press has the control and the
static diagram of a shortcut - which has nothing to sound and no business
growing chrome - does not. Pass `soundToggle={false}` where the app already
offers the preference itself, so it is not presented twice. Because the strip
is drawn above the caps, it is also the board's first tab stop; focus order
follows visual order.

`sound` keeps working unchanged, and now has the usual uncontrolled half -
`defaultSound` plus `onSoundChange` - so an app that already owns a "keyboard
sounds" preference can keep owning it while the board draws the control.

In development the board also calls out the one wiring that produces a dead
control: a visible toggle against a controlled `sound` with no `onSoundChange`
reports every press to nobody, so the button moves nothing and the board keeps
clicking. `useControllableState` cannot catch that on its own - controlled with
no handler is legitimate for a read-only value, and only becomes a defect once
the component draws a control for it. The symptom is a toggle that works on
some boards and not others, which reads as a flaky component rather than as a
miswired prop.
