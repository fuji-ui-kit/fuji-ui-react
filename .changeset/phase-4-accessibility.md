---
"@fujiui/react": minor
---

Accessibility: state that was only a color is now also announced.

**Navigation.** `Navbar`, `BottomNavigation` and `Sidebar` mark their active
item with `aria-current="page"` (it was a background color and nothing else),
and all three name their landmark by default so a page with more than one
doesn't present a screen reader with identical "navigation" entries. `Sidebar`
now renders `<nav>` rather than `<aside>` - its items are links, so it is a
navigation landmark, not a complementary one - and its sections tie their
label to their items with `role="group"` + `aria-labelledby`. A `Navbar` item
with neither `href` nor `onItemSelect` no longer renders as a hand cursor over
a hover highlight that does nothing when clicked.

**`DataTable` sorting.** The header cell carries `aria-sort`, the toggle's
accessible name states the direction ("Revenue, sorted ascending"), the arrow
glyphs are `aria-hidden`, and the body is `aria-busy` while loading. Sort state
previously existed only as an arrow icon.

**Charts are one tab stop, not one per data point.** A three-series,
twelve-point chart put thirty-six tab stops between the controls either side
of it, each announcing a value already present in the visually-hidden data
table every chart renders. A plot is now a single stop with arrow-key
navigation - left/right along a series, up/down between series, Escape to
release.

**`Calendar`** day cells are named with the full date ("Saturday, March 14,
2026") instead of a bare day number, carry `aria-current="date"` on today, and
mark today with a dot as well as an accent color.

**`Timeline`** items announce their `variant` as a visually-hidden prefix
("Error: Deploy failed"); a new `statusLabel` translates or suppresses it.

**`ChatBubble`** keeps the sender announced when `grouped` - a sighted reader
infers it from the run's shape, a linear screen-reader pass had five
unattributed messages in a row.

**`Dropzone`** is named by purpose ("Upload files", overridable with the new
`label` prop) rather than by whatever prose `description` held, and its file
list is a named live region so a completed drop is announced.

**`Dialog`** renders its close button after `children`, so initial focus lands
on the content rather than on the way out. Its position on screen is unchanged.

**`Sidebar.Item` validates `href`** through the same allowlist as every other
link in the package - it was the one component that passed a `javascript:` URL
straight through. Rejected hrefs now warn in development builds instead of
silently rendering an inert anchor.
