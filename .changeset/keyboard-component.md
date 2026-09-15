---
"@fujiui/react": minor
---

**New: `Keyboard`.** A full on-screen keyboard in the same key vocabulary as
`Kbd` - `full` (100%, numpad included), `tkl` (75%), `compact` (65%), `phone`
and `numpad`.

Every cap is a button. Pressing one plays a real stroke: the cap travels down
on `pointerdown` (not on release, which lagged behind the finger), lights up in
`tone` at the bottom of its travel the way a backlit mechanical key does, and
springs back on `--fuji-ease-spring`. The light fades out with the rebound
rather than latching, and the whole stroke runs on `--fuji-duration-base`, so
`prefers-reduced-motion: reduce` removes it for free. `onKeyPress` reports the
struck cap; `interactive={false}` drops the board to plain `<kbd>` caps for
documenting a shortcut, and `captureKeys` holds caps down from the real
keyboard instead. No cap carries colour until `accentKeys` names one.

Caps sit on a quarter-unit CSS grid whose unit is the smaller of the chosen
`size` and whatever divides the container evenly, so a nineteen-unit board
keeps its proportions from a wide page down to a narrow column with no resize
listener. The board is a single tab stop with a roving tabindex - the arrow
keys, Home and End move between caps, chosen geometrically so a move past the
numpad's two-unit `+` and `Enter` lands where the cap actually is.

`floating` docks the board over the page instead of laying it out in flow:
`anchor` picks the box it fills (`viewport`, fixed and spanning the screen, or
`parent`, absolute inside the nearest positioned ancestor), `placement` picks
the edge, and `open`/`defaultOpen`/`onOpenChange` drive it from an input or a
button. It unmounts while closed, closes on Escape and on an outside press
(`dismissible={false}` to opt out; `triggerRef` excludes the control that opens
it, so its own click toggles rather than closing and reopening), and swallows
the mousedown that would otherwise blur the field it is typing into. The
margins either side of the board stay click-through, so a dock never
intercepts presses on the page it is covering. No backdrop, by design - a
keyboard types into content you still need to see and scroll.

**New `phone` layout.** `floating` is meant to dock a board over a phone-width
page, but `compact` - the narrowest layout until now - is sixteen columns
wide and renders a 16.7x16.7px cap at a 375px viewport, well under the WCAG
2.5.8 AA 24x24 target floor. `phone` is ten columns (the sizing already takes
`min()` against the container, so column count was the only lever): a digit
row, `qwertyuiop`, `asdfghjkl` plus `;`, a Shift/Backspace row, and a bottom
row of `,`, Space, `.` and Enter - forty-three caps, no `?123` symbol switch
(no such `KeyboardEvent.code` exists), and no shifted digit-row symbols, since
a phone board has no symbol mode to switch into.

**Shift and Caps Lock work.** Both latch and light a lamp on the cap - sized
from the cap unit, lit in the board's `tone`, in the top-right corner, the
only one clear of a wide cap's left-set legend. Shift takes the cap's second
legend where it has one (`1` types `!`) and otherwise flips case; Caps Lock
only flips case, because it is not Shift; the two cancel, so Shift on a locked
board types lowercase. A Shift armed by clicking is sticky - it applies to the
next cap and lets go, there being nothing to hold down on a drawn keyboard.
Both caps carry `aria-pressed`, so the state is announced as well as lit.

**One modifier state, shared with the real keyboard.** Under `captureKeys`,
holding the physical Shift engages the on-screen cap - so a cap clicked while
it is down reports its shifted value - and the real Caps Lock moves the lamp.
A physical release only lets go of a modifier the physical key engaged, so it
cannot cancel one armed by clicking.

**A board can no longer outgrow its container.** A docked board is sized
against the screen rather than by the px cap scale that suits a diagram inside
a card: `size` picks roughly 45vw / 60vw / 75vw, and a new `width` prop
overrides that with any CSS length or a number of pixels, in flow as well as
docked. Every one of those is an upper bound - the cap unit is still the
smallest of the target, the size's ceiling and what the container can give, so
the board resizes with its parent and can never overflow it. `anchor="parent"`
drops the screen-relative target altogether and is measured by the parent
alone.

`Keyboard` joins the roving-tabindex composite widgets documented in
`README.md` and `docs/accessibility.md`, and a board whose `layout` changes
under it keeps its tab stop - a remembered cap the new layout does not contain
used to leave every cap at `tabIndex={-1}`, dropping the board out of the tab
order until it unmounted. The forwarded ref is composed rather than an
imperative handle, so a consumer's callback ref is no longer torn down and
re-attached on every render, and it reports `null` honestly while a floating
board is closed. A cap drawn blank by `hideLabel` - the space bar - now carries
its accessible name on the static `<kbd>` board as well as the interactive one.

**New `sound` prop.** A short click on every press, synthesised with an
oscillator and a gain ramp through the Web Audio API - no asset, no
dependency, nothing to fail to load. Off by default, and the audio context is
created on the first press rather than on mount, so a board nobody touches
never opens one.

**`Kbd` gains `size`** (`sm` | `md` | `lg`, default `sm`), for legends set
beside larger type or beside a `Keyboard`. Its corners now follow
`--fuji-radius-item` instead of a hardcoded 6px, so a consumer on
`radius="soft"` sees them grow from 6px to 10px on upgrade; it also gained
`fj:box-border`, so the chip's border now sits inside its declared `min-w`
instead of rendering 2px wider than it.
