---
"@fujiui/react": minor
---

Fix text that sat on `--fuji-surface-strong` washing out under dark glass.

Under dark glass that token is a translucent **white** fill. It is white on
purpose - bare, textless fills (Switch, Slider and Progress tracks) have nothing
else to separate them from a near-black page, and at a dark tint they measured
1.01:1 against it, the literal same pixel. But a white tint lightens toward
whatever is behind it, so anything painting TEXT on it lost contrast as soon as
glass sat over a bright backdrop.

Two different fixes, because the two cases want different things:

**Chips keep their translucency.** `softClasses("default")` - shared by `Badge`,
`Avatar`'s fallback and `MultiSelect`'s value chips - now paints
`--fuji-surface-subtle`, which tints _dark_ under dark glass and so darkens the
chip whatever is behind it. Every other tone in that recipe already pairs a
low-alpha tint of its own hue with ink of that hue; `default` was the only one
borrowing a surface token.

| chip (dark glass, over the atmosphere) | before | after  |
| -------------------------------------- | ------ | ------ |
| `Badge` default pill                   | 2.26:1 | 6.00:1 |
| `Avatar` fallback initials             | 2.36:1 | 6.00:1 |
| `MultiSelect` value chips              | 2.92:1 | 8.44:1 |

**Menu highlights invert instead.** `DropdownMenu`, `Select`, `Combobox` and
`MultiSelect` highlighted rows now use the fill/text inversion
(`bg-fuji-contained-default` / `text-fuji-default-foreground`) that every other
selection indicator in the library already uses, and that `CommandMenu` moved to
for this exact reason. A highlight has to read as _selected_, which a subtler
tint cannot do. `DropdownMenu`: 3.35:1 -> 13.48:1.

`--fuji-surface-strong` itself is unchanged, so the bare fills it was tuned for
keep both their translucency and their 3:1 separation from the page.
