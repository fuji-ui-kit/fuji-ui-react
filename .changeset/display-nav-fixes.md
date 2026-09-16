---
"@fujiui/react": minor
---

**New: `ChatBubble.Typing`** (also exported as `ChatBubbleTyping`). The "someone
is typing" indicator: three pulsing dots behind a `role="status"` with a visually
hidden `label` (default `"Typing"`), so consumers no longer hand-build it. The
pulse is the shared `animate-fuji-pulse` and stops under
`prefers-reduced-motion: reduce`. Pure CSS, so `ChatBubble` stays
server-renderable.

**New: `ChatBubble.Attachment` takes a `preview`.** Artwork - an image thumbnail,
a video poster - rendered in place of the icon, cropped into a small rounded
square (resizable through the new `classNames.preview`). Image attachments had no
way to show what they were. Without `onClick` the chip is still a plain `<div>`,
so it can sit inside a consumer's own link.

**New: `BottomNavigation` item `badge` and `badgeLabel`.** A count pill pinned to
the item's icon, hidden at `0` and capped at `99+`. A numeric badge is announced
as part of the item's name ("Chats, 3 unread") through visually hidden text;
`badgeLabel` changes that wording, or names a non-numeric badge. Previously an
unread count had to be drawn into the icon by hand, and was never announced.

**Fixed: `renderLink` dropped `aria-current`.** `Navbar`, `BottomNavigation` and
`Breadcrumb` handed a custom `renderLink` only the item's content, so a router
link lost what the default anchor carried: `aria-current="page"` on the active
item - the only non-colour signal of it - plus the link reset and focus ring.
`renderLink` now receives a third argument with exactly those props (`href`,
`aria-current`, `className`, `children`, and on `BottomNavigation` the `onClick`
that reports `onItemSelect`), exported as `NavbarLinkProps`,
`BottomNavigationLinkProps` and `BreadcrumbLinkProps`. They are also applied to
the element `renderLink` returns, filling in only what it does not set itself,
so existing `(item, children) => <Link href={item.href}>{children}</Link>`
callbacks are fixed without changes. One visible effect: a `BottomNavigation`
router link now fires `onItemSelect`, as its default anchor always did.

**Fixed: `Statistic` and the charts could fail hydration.** Numbers were
formatted with the runtime's default locale, so a server and a browser in
different locales rendered different digits ("1,234" vs "1.234"). They now
format with a fixed `"en-US"` locale by default, and take a `locale` prop to
localize explicitly. `Statistic` also takes `formatValue` for currency, compact
notation or units. This changes the default output for anyone whose runtime
locale was not English: pass `locale` to keep localized figures.

**Fixed: line and bar charts had a 380px minimum width.** The plot carried
`min-w-[380px]`, so in a card on a 320-375px screen it overran the card and
could only be scrolled sideways. It now shrinks with its container like any
scaled image. At very narrow widths the axis text scales down with it; the
`sr-only` data table still carries the exact values.

**Fixed: `Carousel` coverflow ignored `slidesPerView`.** It now sets the centre
slide's width (`100% / slidesPerView`, clamped to at least 1), including the
responsive map form; without it coverflow keeps its 1.6 default. A non-looping
coverflow also now lets every slide become active - it computed its last index
as if it were the flat preset, which stopped short of the final slide.

**New: `Tree` `expandOnSelect`** (default `true`, unchanged behaviour). Selecting
a parent both selected and toggled it, so a folder could not be selected without
opening or closing it. `expandOnSelect={false}` decouples them per the WAI-ARIA
tree pattern: a row click and Enter/Space only select, the chevron toggles on
click, and ArrowRight/ArrowLeft expand and collapse.

**Fixed: grouped `Timeline` timestamps were cut to 32px.** The timestamp column
was a fixed `w-8`, which fit a two-digit year and nothing else - "Sep 14" or
"9:41 AM" overflowed into the title. Timestamps now share one column sized to
the widest in the group (`min-w-8` as the floor, so short stamps align as
before), and titles stay aligned across rows, including rows with no timestamp.

**Fixed: `FloatingActionBar` fought consumer positioning.** Its root carried
`relative`, so whether `className="fixed bottom-6 right-6"` won depended on
the page's cascade-layer order. The root is now unpositioned and the column anchors to an
inner wrapper. Actions are no longer keyed by `label` alone - two actions with
the same label caused React key warnings - and take an optional `id` to key by.

**New: `Card` `padding`** (`"none" | "sm" | "md" | "lg"`, default `"md"` - the
existing 20px). A consumer `p-0` for flush content only wins with the right
cascade-layer order, and left `Card.Media` cancelling 20px of padding that was
no longer there. The prop works regardless of stylesheet order, and
`Card.Media` follows it, so media still bleeds to the edge at any value. New type: `CardPadding`.
