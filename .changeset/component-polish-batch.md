---
"@fujiui/react": minor
---

**New: `InfiniteScroll`.** Loads the next page when the end of a list comes
into view, for use in place of a pager or a "load more" button. Built on an
IntersectionObserver over a zero-height sentinel rather than a scroll handler,
which is what keeps a long list smooth. Re-entry is guarded: the observer can
fire several times before the parent re-renders with the new page, and without
the guard one scroll to the bottom fires three or four duplicate fetches. Works
with any content, including `DataTable` (set `pageSize` to the number of rows
fetched so far, since infinite loading is what replaces the pager).

**New: `FloatingActionBar`.** A speed dial: a circular trigger that fans a
column of labelled actions out from itself (the reference is motion.dev's
floating action button). Two details carry the effect - the actions stagger in
nearest-the-trigger first and reverse on close, so the column unfurls from the
button rather than a menu appearing; and each step further out is slightly
smaller, which is what gives the column depth instead of reading as a list.
The column is absolutely positioned against the trigger rather than being a
flex sibling, so opening it cannot move the trigger - the one element that must
stay put, since the pointer is already on it - and a dial can be dropped
anywhere without reserving space for its own expansion. `direction` defaults to
`"auto"`, which opens downwards when the dial sits near the top of the viewport
and upwards when it sits near the bottom.

Deliberately not built on `Popover`: the actions belong to the trigger, and a
portaled popup would cross-fade a separate surface in and lose that. Collapsed
actions stay mounted so they can animate, but are `inert` and hidden from
assistive technology. Takes `direction` (`"auto"` default, `"up"`, `"down"`).

**`Alert` redesigned.** It was a uniformly tinted block, which had to stay pale
enough for body text to sit on and so left every variant looking like the same
faint card. The tone is now washed in from the leading edge and fades out
before the text, letting it start saturated enough to identify the variant at a
glance, and the icon rides its own raised tile.

**Fixed: the tab indicator briefly overlapped the neighbouring tab.** It eased
on `--fuji-ease-spring`, which overshoots - measured travelling to 198px on a
194px destination - so on the pill variant the opaque tile crossed the next
label before settling back. It now uses a decelerating curve that never passes
its slot.

**Fixed: `Popover`'s arrow rendered as an outlined diamond.** It was a
`rotate-45` square with a border on all four sides; since only half of it is
ever visible, the far two edges showed above the panel. It is now a clipped
triangle in the panel's own fill, the same approach `ChatBubble` uses for its
tail, and meets the panel edge with no seam.

**Fixed: `AvatarGroup`'s overlap read as damage.** The separating ring was
painted in `--fuji-border-strong`, drawing a grey arc across every neighbour.
It now uses the colour of the surface behind (overridable per group with
`--fuji-avatar-group-ring`), so each avatar reads as cut out of the one below,
and earlier avatars stack above later ones so "+N" tucks under the last face.

**Fixed: `RadioGroup`'s selection dot could not animate.** It was unmounted
while unchecked, and an element that does not exist cannot transition, so
selection popped in instantly. It now stays mounted and scales in on the same
spring as `Switch`'s rolling thumb.

**Fixed: `Image`'s fullscreen close button was anchored to the viewport,** so
on a wide display it sat in the far corner of the screen rather than near the
photo it closes. It is now pinned to the image's own top-right corner, on its
own scrim since the photo beneath can be any colour. The lightbox backdrop is
also darker than the shared overlay scrim: a photo is shown edge-to-edge with
nothing behind it, so the page stayed visible around it and competed with the
image.

**Fixed: `ChatBubble` had no shadow.** A `box-shadow` painted a hard edge
across the join with the tail, which is why it was removed. The cast is now a
chained `filter: drop-shadow()` on the wrapper holding both bubble and tail, so
it follows their combined silhouette - and it scales with the elevation
appearance.

**Fixed: chat bubbles were invisible in light and dark.** The bubble fills were
defined only for the glass theme, so the other two fell back to
`--fuji-surface` - exactly what `Card` paints, making an incoming bubble the
same colour as the card behind it.

**Glass tuning.** Surface blur radii drop from 20/28/36px to 6/10/14px. The
larger radii obliterated everything behind the surface, which reads as a tinted
slab rather than glass; overlays were already corrected to 8px and surfaces
were missed. The white inset "edge" highlight is also removed from every glass
shadow - at 20% it read as a hard line along the top of every panel rather than
a specular edge.

**`BottomNavigation` takes `onItemSelect`.** An item without an `href` was
inert markup - the bar could only be driven by navigation, so a tab bar
switching a local view had no way to report the choice, which `Navbar` has been
able to do since 0.2. Such an item now renders as a real `<button>` when a
handler is given, so it is focusable and operable from the keyboard rather than
being a mouse-only `<span>`. Its labels also move to the new `--fuji-text-2xs`
with a smaller icon.

**Fixed: a nested overlay panel was translucent in glass.** `Calendar`'s
month/year chooser opens inside another glass surface, so it has no
backdrop-filter of its own - an ancestor with one is already a backdrop root -
and the tint was all it had. At 48% the date grid read straight through it.

**Fixed: a bottom `Drawer` had no bottom padding.** Its safe-area inset was
applied as a bare `padding-bottom`, which replaced the panel's own padding
rather than adding to it - and since that env var is `0px` on any desktop
browser, the sheet's last control sat flush against the screen edge. The inset
is now added to the panel padding, and `side="top"` gets the mirror treatment.

**Charts animate between data sets.** Re-rolling a chart's data snapped: the
mount-time entrance keyframes never re-run on an element that stays mounted,
and neither a path's `d` nor a bar's `y`/`height` is animatable as the
attribute React writes. Every coordinate the plots draw is derived from
`series`, so they are now handed an interpolated copy each frame instead - the
line bends to its new shape, the bars grow and shrink, the donut's ring and its
legend figures travel, and the axis rescales with them. A change of shape
(different series or labels) still snaps, since there are no pairs of points to
interpolate between. `prefers-reduced-motion` skips straight to the new data,
and the `sr-only` data table always holds the real values, never a frame in
between. The crosshair and tooltip are now derived from which point they are
pinned to rather than from a snapshot of where it was, so they travel with it.

**`Toast` now carries `Alert`'s treatment.** The two expose the same four
status variants, so a success toast and a success alert have to be recognisable
as the same thing; the toast had a bare tinted glyph against a plain overlay.
It now gets the tone wash from the leading edge and the icon on its own raised
tile, shared from one module rather than described twice.

**`Drawer` spans its edge again on `side="top"` and `side="bottom"`.** They had
been changed to a detached, width-capped card, which made them the only two
sides that did not behave like a drawer. That presentation is now
`variant="sheet"`, available on all four sides: inset all round, rounded on
every corner, with the dimmed page still visible around it - for a short,
self-contained task rather than navigation or a long form.

**Glass is more transparent.** Surface tints drop from 30/38/50% to 22/28/42%
and the blurs rise from 6/10/14/8px to 10/14/16/12px. Tint and blur work
against each other - tint is what the surface adds, blur is what it lets
through - and the previous pairing had enough of the first that the second
barely showed, so panels read as dark cards rather than as a material with a
scene behind it. Measured on the shipped atmosphere gradient at its brightest
sampled pixel, white foreground holds 7.7:1 on `-subtle`, 8.1:1 on `-surface`
and 10.2:1 on `-strong`. `--fuji-surface-overlay` deliberately does not follow
them down: it is the tier that covers content the theme does not control, where
the tint alone has to carry legibility.

(That gradient stopped being glass's automatic background later in this
release - it is now the opt-in `.fuji-glass-atmosphere` class, and
`--fuji-background` comes from the active `theme` by default. These alphas
are unaffected: they composite over whichever background is behind them
either way. Re-measured against the real theme backgrounds: light + glass
card text 7.87:1, dark + glass 17.05:1 - both clear of the numbers above, not
below them. See `docs/theming.md`.)
