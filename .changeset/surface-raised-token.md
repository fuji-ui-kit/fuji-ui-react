---
"@fujiui/react": minor
---

Add `--fuji-surface-raised` and move every content-bearing fill onto it.

Under dark glass `--fuji-surface-strong` is a translucent **white** fill. That is
deliberate: bare, textless fills - Switch, Slider and Progress tracks - have
nothing but their own lightness to separate them from a near-black page, and at
a dark tint they measured 1.01:1 against it, the literal same pixel. But a white
tint lightens toward whatever is behind it, so every fill that carried text or an
icon lost contrast the moment glass sat over a bright backdrop.

The two needs want opposite tint directions, so no single value serves both.
`--fuji-surface-raised` is the content-bearing twin: dark-tinted under dark
glass, and identical to `--fuji-surface-strong` in every other block, so only
dark glass changes at all.

| dark glass, over the atmosphere          | before      | after  |
| ---------------------------------------- | ----------- | ------ |
| `AvatarGroup` "+N"                       | 2.10:1      | 7.01:1 |
| `Pagination` inactive tiles              | 2.59:1      | 7.01:1 |
| `Dropzone` / `FileUpload` rows           | 2.26:1      | 8.20:1 |
| `Notification` / `EmptyState` icon tiles | 2.10:1      | 7.01:1 |
| `Icon` `default` / `muted` / `subtle`    | 1.82-2.26:1 | 8.20:1 |

Icons are judged against WCAG 1.4.11's 3:1 floor, text against 4.5:1; every case
above now clears its own floor at both ends of the shipped scene.
`--fuji-surface-strong` is unchanged, so the bare fills it was tuned for keep
both their translucency and their 3:1 separation from the page.

Also fixes `Dropzone`'s drag-over fill, which never painted in any theme.
`scripts/css-entry.css` orders `fuji.components` after `fuji.utilities`, so the
element's own `.fuji-glass-surface-subtle` beat every `fj:bg-*` utility
regardless of specificity. The state now drives a component-layer rule
(`.fuji-dropzone[data-drag-active]`), matching the pattern already used by
`.fuji-chart-segment[data-active]` - and the backdrop blur that class also
carries is preserved.

Also fixes `ghost` Button/IconButton at tone `default`, whose hover state used
the same bare-fill surface and so failed the same way: 2.26:1 over the
atmosphere's bright pixels, under even the 3:1 non-text floor. It now hovers on
`--fuji-surface-raised`, matching what the other four tones already did (each
hovers on its own `-soft` tint). Ghost rests transparent, so any fill still reads clearly as hover feedback.

Interactive rows that raise on hover (Sidebar, Calendar, NavigationMenu,
TimePicker, Stepper, ButtonGroup and Chart's legend) now pair that fill with a
hairline, via the shared `fuji-hover-raised` class. Under dark glass the fill
alone could not do the job: on the darkest part of the atmosphere the panel
behind these rows is already near-black, so no darker fill separates from it
(measured 1.11:1, and no value improves it - there is no luminance left to
spend), while a lighter fill needs dark ink, which is what the SELECTED state
uses. An edge is luminance-independent, so it reads at any backdrop brightness,
and it is the device the glass surfaces already use. Hovered rows measure
1.93:1 against a resting row beside them, up from 1.11:1, with their text at
8.45:1 (previously ~2.7:1).

Two dark-glass tokens moved again after measuring text inside a **card** rather
than on a bare panel. A card is itself a glass surface, so text in one
composites through two translucent layers and lands lighter than the same ink on
a single panel - `Statistic`'s trend caption sat at 4.24:1 over the shipped
atmosphere, and `--fuji-fire` at 4.39:1, both under AA on the library's own
backdrop. `--fuji-foreground-subtle` goes 71% -> 76% (4.60:1) and `--fuji-fire`
`#ffb4b4` -> `#ffbbbb` (4.61:1). The stacked case, not the single-layer one, is
what these values have to satisfy.
