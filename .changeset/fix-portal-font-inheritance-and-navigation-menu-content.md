---
"@fuji-ui/react": patch
---

Fix several portaled and navigation-menu components rendering with the
browser's native default styling instead of Fuji's design tokens.

- **Portaled content never inherited Fuji's font.** `--fuji-font-sans` was
  only applied via a `.fuji-theme-scope` class on `FujiProvider`'s own
  wrapper element; every Base UI portal (`Dialog`, `Drawer`, `AlertDialog`,
  `Popover`, `DropdownMenu`, `ContextMenu`, `HoverCard`, `NavigationMenu`,
  `Select`, `Combobox`, `MultiSelect`, `DatePicker`, `TimePicker`,
  `CommandMenu`, `Toast`) attaches directly to `document.body`, outside that
  wrapper, and only carried `data-fuji-theme`/`data-fuji-radius`/
  `data-fuji-elevation` for color-token resolution - never the font. Every
  dialog title, dropdown item, and select option was silently rendering in
  the browser's unset default font (serif in most browsers) instead of
  Fuji's. `font-family` is now also applied via the `[data-fuji-theme]`
  attribute selector these portals already carry (color/background stay
  `.fuji-theme-scope`-only, since painting a background there would affect
  invisible floating-ui positioner wrappers).
- `Dialog.Title`/`Description`, `Drawer.Title`/`Description`,
  `AlertDialog.Title`/`Description`, and `Popover.Title`/`Description` were
  bare, unstyled re-exports of Base UI's own `<h2>`/`<p>` parts - combined
  with the font-inheritance gap above, a dialog's title rendered as a large
  bold serif heading with default browser margins instead of Fuji
  typography. All eight now carry Fuji's heading/body text styles.
- `NavigationMenu.List`/`Item` (real `<ul>`/`<li>` elements) had no
  `list-none`/margin/padding reset, so menu items showed bullet points.
  `NavigationMenu.Link` (a real `<a>`) was a bare re-export with zero
  styling, rendering as a default blue underlined link instead of matching
  the menu's other items.

No public API, theme, radius, elevation, or accessibility behavior changed -
components render identically wherever they happened to already sit inside
a `.fuji-theme-scope` element (e.g. non-portaled content); this only fixes
the ones that didn't.
