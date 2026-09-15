---
"@fujiui/react": patch
---

Fixes from a one-by-one visual pass over every component in Storybook.

**Removed the 1px inset "edge light" from raised objects.** Every `contained`
button, active nav item, checked control and selected tab carried
`inset 0 1px 0 rgb(255 255 255 / 14%)` on top of its drop shadow. At 1px with
no blur that is a hairline, and a hairline reads as a border on every theme -
not as light. Depth now comes from the cast shadow alone, which is what the
reference designs do. The same 1px inset line was also baked into every dark
and glass surface shadow (`--fuji-shadow-inset-highlight`, on cards, tables,
charts, calendars) and is removed there too - glass surfaces already carry a
real hairline border, so the inset line was a second border drawn just inside
the first.

**Links no longer inherit the browser's underline and blue.** This package
ships no preflight, so a bare `<a href>` keeps the UA stylesheet's underline
and `-webkit-link` colour - and because the underline is painted by the anchor
itself, a coloured `<span>` inside it does not hide it. `Navbar` rendered grey
labels on bright blue underlines; `Breadcrumb` and every `Sidebar.Item` were
underlined; `Button asChild` onto a link was underlined. A shared
`NATIVE_LINK_RESET` now sits next to `NATIVE_CONTROL_RESET` and is applied to
every Fuji-styled anchor (`Link` manages its own underline by design).

**`ghost` buttons no longer cast a shadow.** Button and IconButton's shared
base applied `shadow-fuji-control` to every appearance, so a transparent ghost
control rendered as a faint box. Ghost is now `shadow-none`.

**`ButtonGroup`'s outline was far heavier than the bordered Button beside
it.** Each segment kept its own shadow (the selected one its raised shadow)
inside an `overflow-hidden` group, piling shadow against every divider. The
group carries one shadow; segments carry none.

**`Statistic` could display a negative number.** A rAF timestamp is stamped at
the start of its frame, which can precede the `performance.now()` read the
count-up took as its start time - so the first tick computed negative
progress, the cubic ease went negative with it, and the tile showed "-1,292".
Normally one frame; under rAF throttling, the frame that stays on screen.
Progress is clamped at both ends and the start time comes from the first
frame itself.

**`Statistic`'s trend line** had the browser's default paragraph margins.

**`DropdownMenu.GroupLabel`** was a bare re-export of the Base UI primitive -
body-sized, foreground-coloured, flush to the popup edge. It is styled like
every other group heading in the package now.

**`BottomNavigation` gains a `position` prop and defaults to `sticky`.** It
was hard-coded to `position: fixed`, which pins to the viewport regardless of
where it is rendered - it escaped every container it was placed in, and could
not be overridden via `className`, because Fuji's positioning class lives in
its own cascade layer and wins over a consumer's utility. `sticky` pins to the
bottom of its own scroll container (the page when rendered at the end of
`<body>`, a panel when rendered inside one); `position="fixed"` restores the
old behaviour, `"absolute"` suits a `position: relative` parent.

**`FormField.Description`, `FormField.Error` and `CodeBlock`'s `<pre>`** kept
the browser's default paragraph margins.
