---
"@fuji-ui/react": minor
---

Replace `ComponentVariant` with a warmer, more distinctive "tone" vocabulary,
and consolidate `Tag` into `Badge` and `Inline` into `Stack`. Also fixes a
dark-theme "floating" elevation halo, adds focus rings and clear buttons to
text fields, and rounds out several components with tone support, custom
layouts, and missing stories.

**Migration notes:**

- `ComponentVariant` is removed and replaced by two separate types:
  - `ComponentTone` (`default | earth | fire | water | forest | sun`) - the
    decorative color prop on `Button`, `IconButton`, `ButtonGroup`, `Badge`,
    `Icon`, and the new tone support on `Checkbox`, `RadioGroup`, `Switch`,
    `Slider`, `Spinner`, `Stepper`, and `Avatar`. Old values map to new ones:
    `default`/`primary` → `default`, `secondary` → `earth`, `success` →
    `forest`, `warning` → `sun`, `danger` → `fire`, `info` → `water`.
  - `StatusTone` (`default | success | warning | danger | info`) - unchanged
    prop name and values on semantic components (`Alert`, `Toast`, `Result`,
    `StatusIndicator`, `Timeline`, `Progress`, `CircularProgress`); no call-site
    changes needed.
  - Every `variant` prop on a decorative component (`Button`, `IconButton`,
    `ButtonGroup`, `Badge`, `Icon`) is renamed to `tone`, with the value
    mapping above.
- `Tag` is removed. Use `Badge` instead - it now accepts `onRemove` and
  `removeLabel` (previously Tag-only) and uses the same pill shape as before.
- `Inline` is removed. Use `Stack` with `direction="horizontal"` instead -
  `Stack` gained `direction`, `wrap`, and `justify="between"`, and widened
  `align` with `"baseline"`.
- The `--fuji-success`/`-warning`/`-danger`/`-info` CSS custom property
  families (and every `-foreground`/`-soft`/`-border`/`-contained-*` sibling)
  are renamed to `--fuji-forest`/`-sun`/`-fire`/`-water`. Update any consumer
  CSS that references these tokens directly.

**Also in this release:**

- Fixed a dark-theme "floating" elevation halo (shadows were tinted with the
  dark theme's cream foreground color instead of black).
- Added a 2px focus ring to text fields (`Input`, `Textarea`, `Select`,
  `Combobox`, ...) with no layout shift.
- Added `clearable` to `Input` and `Textarea`.
- `NumberInput` is compact by default; pass `fullWidth` for the previous
  full-width behavior.
- `RadioGroup`'s selection emphasis moved to the border, with a smaller inner
  dot.
- `Switch`'s thumb now animates with a rolling transform (respecting
  `prefers-reduced-motion`).
- `Spinner` has a new, lighter-weight arc animation.
- `Stepper` steps accept a custom `icon`.
- `Statistic` accepts `card` to render inside a `Card` surface.
- `Timeline` accepts `layout` (`left | right | alternating`), with a
  responsive mobile fallback for `alternating`.
- `CommandMenu` now exposes proper ARIA combobox/listbox semantics for its
  keyboard-navigable results.
- Fixed a handful of missing overflow/underline affordances (`Tabs` list
  overflow, `Tooltip` max-width, `Breadcrumb` link underlines) and missing
  `focus-visible` styling on `Tabs` and `Collapsible`.
