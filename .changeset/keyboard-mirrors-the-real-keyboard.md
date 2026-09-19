---
"@fujiui/react": minor
---

`Keyboard` mirrors the physical keyboard by default, and a mirrored key now
presses its cap rather than only lighting it.

`captureKeys` was off by default and, when switched on, lit a cap for as long
as its real key was held. Two keyboards on one screen behaving as one is what
people expect of a soft keyboard, so it is now the default, and a mirrored
press does what a press on that cap does: the cap travels, and it clicks if the
board has a voice. Auto-repeat is excluded - a held key fires keydown over and
over, and replaying the strike and the click on each of them turns one held key
into a stutter no physical board makes.

The listener is also scoped, which it was not before. A board captures only
while it is **engaged**: a floating board while it is open, an in-flow board
while focus is inside it. Defaulting a global `window` listener to on would
have meant every board on a page reacting at once - the documentation page
carries eight, so one keystroke aimed at the search field would have lit all
eight boards and clicked eight times. Click or tab into an in-flow board to
engage it; `captureKeys={false}` opts out entirely.

A mirrored press deliberately does **not** call `onKeyPress`. The real key has
already been delivered to whatever had focus, so reporting it again would type
every character twice.
