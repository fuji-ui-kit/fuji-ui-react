---
"@fujiui/react": patch
---

**Fixed: `Carousel` could not be swiped when its slides were images or links.**

Those elements are natively draggable, so pressing one started the browser's
own drag-and-drop. That takes the pointer stream away from the page - Chrome
fires `dragstart` and then `pointercancel` about four pixels in - so the swipe
died almost as soon as it began and the carousel could only be driven by its
controls. `Carousel` now cancels that native drag on the viewport; a child can
still opt back in with its own `draggable`.

The same `pointercancel` was also being treated as a completed swipe. It
carries no meaningful coordinate (Chrome reports `clientX: 0`), which read as a
drag all the way to the viewport's left edge and threw the carousel several
slides forward instead of snapping back. A cancelled gesture now returns to the
current slide, and the distance is taken from the last offset actually applied
rather than from the event.

Most visible with `effect="coverflow"`, where the fan is meant to track the
pointer continuously: because the gesture was cancelled before
`data-swiping` had any effect, every slide kept its transition and the fan
lagged behind the pointer rather than following it.
