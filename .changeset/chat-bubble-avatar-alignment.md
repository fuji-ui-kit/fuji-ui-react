---
"@fujiui/react": patch
---

Align `ChatBubble`'s avatar with the bubble instead of with the metadata under
it.

The row was `flex items-end`, so the avatar bottom-aligned with the whole
message column - sender, bubble, and the timestamp/status line together. Any
bubble carrying metadata therefore pushed its avatar down past the bubble and
level with the timestamp, which reads as a layout bug at every avatar size and
gets worse as the avatar gets smaller: a 32px `size="sm"` avatar beside a
timestamp row ended up almost entirely below the bubble it belonged to.

The row is now a grid with the avatar in its own column on the bubble's row, so
it is pinned to the bubble's bottom edge whatever else the column holds. The
vertical rhythm moved from a `gap-y` to margins on the sender and metadata rows,
because a grid gap is paid between tracks even when one of them renders nothing.

Grouped bubbles also keep the avatar in the DOM and hide it, rather than
swapping in a fixed 32px placeholder. The slot takes an arbitrary node, so the
avatar's own box is the only footprint certain to match the rest of the run -
the old placeholder silently misaligned every run built with the default 40px
`Avatar`.

The tail no longer seams against the bubble either. The two are separate boxes
carrying the same opaque fill, and they used to meet exactly on the bubble's
edge - so wherever that edge landed on a fractional pixel, both were
antialiased against it and composited in turn, bleeding roughly a quarter of
the page colour through the join. Against light's near-identical page and
bubble that is invisible; in dark it drew a visible hairline between the tail
and the bubble, which is why the same build could look clean in one layout and
seamed in another. The tail now runs 1px under the bubble, so the two never
share an antialiased edge. Its visible silhouette is unchanged.
