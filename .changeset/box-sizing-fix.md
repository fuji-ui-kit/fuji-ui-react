---
"@fujiui/react": patch
---

Fixed: components overflowed their parent in any app without a global
`box-sizing` reset.

This package deliberately ships no preflight, so a consumer with no reset of
their own gets the CSS default, `box-sizing: content-box`. Thirteen components
set an explicit size (width, height, or `min-width`) and padding or a border on
the same element, which under `content-box` puts that padding or border
outside the declared size - `w-full` plus `px-8` renders 64px wider than its
parent's content box.

`Container` was the visible case: at a 1280px viewport its `xl` width overhung
the page by its own gutter, producing a horizontal scrollbar. Measured in a
real browser, its computed `box-sizing` was `content-box` and its border box
was 1233px inside a 1169px parent. The other twelve (`Sidebar`, `Toast`,
`Tabs`, `Tree`, `List`, `Slider`, `Calendar`, `ChatBubble`, `Carousel`,
`CommandMenu`, `MultiSelect`, `Kbd`) are narrower and so were latent rather
than visible - `Kbd`'s case is a border outside a declared `min-width` rather
than padding outside a width, the same shape of bug on a smaller element.

All of them now set `fj:box-border` explicitly. A blanket
`.fuji-theme-scope * { box-sizing: border-box }` would have been shorter and
wrong: this stylesheet is imported globally, and that rule would restyle every
piece of a consumer's own markup nested inside the provider.

`src/styles/box-sizing.test.tsx` asserts the invariant against rendered markup
and fails if any component sets a size and non-zero padding without it; `Kbd`'s
border variant isn't shaped like that pattern and was checked by hand.
