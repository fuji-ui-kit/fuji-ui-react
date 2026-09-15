---
"@fujiui/react": minor
---

One vocabulary for prop names, and two APIs that had no uncontrolled mode.

**Breaking, under a minor bump (pre-1.0).** Four props are renamed and one
default changes. SPEC.md §10 counts a rename and a changed default as breaking
and requires the callout even when the bump is minor, so: every `Skeleton
variant`, `Typography variant`, `Link color`/`hover` and `Container size` in a
consuming app has to be updated, and a `Carousel` that relied on autoplay must
now ask for it. `docs/upgrading.md` has the before/after for each.

**Renames.** Fuji uses `tone` for decorative color roles and `variant` for
semantic status. Four components predated that rule, which left `variant`
meaning three different things depending on which component you were reading:

- `Skeleton.variant` → `shape`
- `Typography.variant` → `scale` (type `TypographyVariant` → `TypographyScale`)
- `Link.color` → `tone`, `Link.hover` → `hoverTone` (type `LinkColor` → `LinkTone`)
- `Container.size` → `width` - `size` everywhere else in the package means a
  control's height/padding scale, and Container's meant maximum line length

**`Carousel` no longer autoplays by default.** `autoplay` defaults to `false`.
Self-starting motion lasting more than five seconds is a WCAG 2.2.2 obligation
for whoever ships the page, and defaulting it on handed every consumer that
obligation without telling them.

**`CommandMenu` works uncontrolled.** `open`/`onOpenChange` are now optional
and `defaultOpen` is available. It was the one component in the package that
forced a `useState` on every caller, including its own stories.

See `docs/upgrading.md` for the full 0.2 → 0.3 diff.
