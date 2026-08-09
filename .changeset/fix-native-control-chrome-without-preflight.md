---
"@fuji-ui/react": patch
---

Fix native browser chrome appearing on raw `<button>`, `<input>`, and
`<select>` elements across most of the package (most visibly `DataTable`'s
sortable column headers, `Pagination`'s page-number buttons, and
`Combobox`/`MultiSelect`'s dropdown-toggle and clear buttons) when this
package's `styles.css` is the only stylesheet loaded, with no Tailwind
preflight reset available to zero out the browser's default
border/background/box-sizing/margin/padding on those elements.

- Added `NATIVE_CONTROL_RESET`, a small shared class string applied first (so
  a component's own border/background classes still win via
  `tailwind-merge`) to every raw native control this package renders
  directly, including ones rendered by a Base UI primitive with no styling
  of its own: `Button`, `IconButton`, `Input`, `Textarea`, `NativeSelect`,
  `Navbar`'s item buttons, `Tabs`' tab buttons, `SegmentedControl`'s tabs,
  `DataTable`'s sort toggle, `Pagination`'s page-number buttons,
  `Combobox`/`MultiSelect`'s input, chevron-toggle, and clear/chip-remove
  buttons, `CommandMenu`'s search input and result rows, `NumberInput`'s
  input and increment/decrement buttons, `OTPInput`'s slots,
  `TimePicker`'s AM/PM and hour/minute buttons, `PasswordInput`'s
  visibility toggle, `SearchInput`'s clear button, `Dropzone`/`FileUpload`'s
  remove-file buttons, the shared `DismissButton` (used by `Dialog`,
  `Drawer`, `Toast`, and `Image`'s fullscreen preview), `Tag`'s remove
  button, `Rating`'s stars, `Calendar`'s header/month/year/day buttons,
  `Carousel`'s play-pause, arrow, and indicator buttons, `List.Item`'s
  clickable row, `Stepper`'s clickable step circles, `Collapsible` and
  `CodeBlock`'s triggers, `NavigationMenu`'s trigger, and `Image`'s
  fullscreen-preview trigger.
- Added `box-border` to `Card`, `EmptyState`, `Notification`, `Table`,
  `Select`'s popup, and `Image`'s wrapper, and `m-0`/`p-0`/`list-none` to
  `Card.Title`/`Card.Description`, `EmptyState`'s and `Notification`'s text,
  and `Timeline`'s list, so a consumer-supplied width or the browser's
  default heading/paragraph/list margins can't throw off layout without
  preflight's `box-sizing: border-box` and margin/padding reset.
- `Image` now sets `display: block` on its `<img>` elements, matching
  preflight's `img, svg, video { display: block }`.

No public API, theme, radius, elevation, or accessibility behavior changed -
every component renders identically wherever preflight (or an equivalent
reset) was already present; this only restores the intended appearance where
it wasn't.
