---
"@fujiui/react": minor
---

Overlay, palette, keyboard and field fixes found while building example apps
against the package, plus the small APIs those apps had to work around.

**Behaviour changes, under a minor bump (pre-1.0).** SPEC.md §10 asks for the
callout, so: the standalone `Keyboard layout="numpad"` no longer has a
`NumLock` cap (it is now `Backspace`); an in-flow `Keyboard` no longer takes
focus when a cap is clicked; an explicit `Keyboard width` is no longer capped
by the size's cap ceiling; a `Textarea` given `rows` no longer has the size's
minimum height; and `CommandMenu` lists ungrouped items first even when a
grouped item comes earlier in `items`. Each is below, with why.

**`Keyboard` never steals focus.** Only a `floating` board swallowed the
mousedown that moves focus onto a clicked cap, so an inline keypad beside an
input blurred that input on every press and consumers wrapped it in a div
cancelling mousedown themselves. Every interactive board does it now. Caps are
still buttons reached with Tab and the arrow keys.

**`Keyboard` fills its container when asked.** An explicit `width` was still
capped by the size's cap ceiling (38px caps at `md`), so in flow
`width="900px"` drew a 630px board and a numpad could never fill its card; an
explicit width now lifts that ceiling. A percentage was read against the grid
itself rather than the space it was given - `width="100%"` collapsed a numpad
to an 88px sliver - and is now a share of the box the board sits in, so
`width="100%"` spans its parent. The board still never outgrows that box. The
container-bound cap unit also forgot the deck's 1px border, leaving the
right-hand inset 2px thinner than the left; measured symmetric at 320px and
375px, with no horizontal overflow at either.

**`Keyboard`'s numpad can delete.** A PIN or OTP keypad built on
`layout="numpad"` had no way to remove a digit. Its top-left cap is now a `⌫`
Backspace (code `Backspace`, the same glyph and name as the `phone` board's) in
place of Num Lock, which on a drawn board typed nothing and toggled nothing.
`full` keeps its Num Lock.

**`Popover.Content` takes `side`, `align` and `alignOffset`.** Everything but
`sideOffset` was spread onto the popup rather than Base UI's Positioner, where
it was silently dropped. `Tooltip.Content` had the same gap and gains the same
three props; `DropdownMenu.Content`, which already had `align`, gains `side`
and `alignOffset`. Defaults are Base UI's own.

**`CommandMenu` can open a second step and bind ⌘K.** An item with
`closeOnSelect: false` keeps the palette open after its `onSelect`, clears the
query and returns focus to the search field, so swapping `items` shows the next
step. New `hotkey` prop: `hotkey="k"` toggles the palette on ⌘K or Ctrl+K
through the same controlled/uncontrolled state as everything else, with the
listener removed on unmount. Off by default. The arrow keys also walked
`items` in array order while rows are drawn bucketed by group, so with groups
interleaved the highlight jumped around the list; navigation, Enter and
`aria-activedescendant` now follow the drawn order.

**`Dialog` and `Drawer` scroll.** Both capped the popup at the viewport and
then let taller content spill past it, with the page scroll-locked behind so
the end was unreachable. The popup now scrolls its own content without
chaining into the page.

**`Drawer.Content` gains `width`** (`sm` 16rem | `md` 20rem | `lg` 28rem |
`full`, default `md` - the old fixed width) for `left`/`right` panels, still
capped at `calc(100vw - 3rem)`. Named `width` rather than `size` for the reason
`Container`'s is: `size` is a control's height/padding scale everywhere else.
New type `DrawerWidth`.

**`Input` and `SearchInput` keep their height in a flex column.** In an
overflowing flex column - a Sidebar - the field root's automatic minimum
height is one line of text, and it collapsed from 38px to a 19px sliver. The
root now carries a `min-height` equal to its control height. Not `shrink-0`:
every field is `w-full`, and in a flex row (a search box beside a button)
`shrink-0` measured the button pushed 83px out of its container. `Textarea`
was measured unaffected.

**`Textarea rows` sets the height.** The size's minimum height (5rem / 6rem /
8rem) beat the height `rows` asked for, so `rows={1}` still drew a 96px box.
With `rows` given, that minimum is dropped - a one-line composer that grows
with its content is now possible.
