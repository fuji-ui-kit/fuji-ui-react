---
name: fuji-react-accessibility-review
description: Audit @fujiui/react components for semantic HTML, accessible names, ARIA state, keyboard operation, focus management, composite-widget patterns, contrast across themes, motion and transparency preferences, and touch targets. Use for review-only audits unless fixes are explicitly requested.
# Contributor skill for working on this repository. Hidden from `npx skills add`,
# which would otherwise install it into apps that only use @fujiui/react.
metadata:
  internal: true
---

# Fuji React accessibility review

## Purpose

Audit components **as a library**, not as pages. A consumer inherits whatever
accessibility this package ships, so a missing accessible name or a broken
keyboard path here becomes a defect in every app that uses it. Default to
review-only.

## Procedure

1. Read `AGENTS.md`, `SPEC.md`, `docs/accessibility.md`, and the component
   source.
2. Read the component's own test file. Existing `jest-axe` assertions and
   keyboard tests tell you what is already covered - and what is not.
3. Review the **rendered DOM and real interaction**, not the JSX alone. Base UI
   is a strong foundation, not proof the composed component is accessible.
4. Where behavior is unclear from source, write a scratch test (outside the repo
   or clearly marked as temporary) using Testing Library + `user-event` rather
   than reasoning about it. Do not add permanent test files unless asked.
5. For visual checks (contrast, focus visibility, touch targets), verify in
   the package's Storybook (`npm run storybook`) across the toolbar's theme /
   radius / elevation matrix, and for glass the `Backdrop` and `Glass tint`
   toolbars. The cross-component contracts that came out of the last audit
   (landmark names, `aria-current`, `aria-sort`, Calendar full-date names,
   Timeline status text, one tab stop per chart plot, Dropzone naming) are
   pinned in `src/a11y-contracts.test.tsx` - extend it rather than re-deriving
   them.

## Checks

### Accessible names

- Every icon-only control requires a name at the **type level** - `aria-label` as
  a required prop, not an optional one. `IconButton` and `DismissButton` are the
  reference. A new icon-only control with an optional label is a finding.
- `Icon` is either decorative (`aria-hidden`, no `label`) or labeled
  (`role="img"` + `aria-label`). Never ambiguous, never both.
- Form controls associate their label, description, and error message via
  `id`/`aria-describedby`/`aria-errormessage`, not by proximity.

### ARIA state matches visual state

Disabled, loading, invalid, selected, expanded, and read-only must drive both
the styling and the corresponding attribute (`disabled`/`aria-disabled`,
`aria-busy`, `aria-invalid`, `aria-selected`, `aria-expanded`,
`aria-readonly`). One without the other is a finding.

Note the deliberate exception: `Button`'s `asChild` mode renders onto a
non-button element with no native `disabled`, so it uses `aria-disabled` plus a
click/keydown guard and stays focusable. That is intentional (an APG-documented
pattern), not a defect.

### Composite widgets (roving tabindex)

`Tree`, `Calendar`'s date grid, `ButtonGroup`, and `Rating` follow the WAI-ARIA
roving-tabindex pattern. Verify:

- The container is **not** in the tab order; exactly one item has `tabindex="0"`.
- Arrow keys move both DOM focus and the roving `tabindex`.
- Role, ARIA state, and the roving `tabindex` all sit on the **same focusable
  node** - splitting them across a wrapper and a nested interactive child means
  assistive tech reads incomplete semantics on focus. `Tree` was fixed for
  exactly this; check any new composite widget for the same mistake.
- `Tree` specifically: ArrowUp/Down move, ArrowRight/Left expand/collapse or
  move to child/parent, Home/End jump to first/last visible node, Enter/Space
  activate, and `aria-level`/`aria-posinset`/`aria-setsize`/`aria-expanded`/
  `aria-selected` are all present.

### Overlays

Dialog, AlertDialog, Drawer, Popover, Tooltip, Menu, Select, Combobox:

- Escape closes; focus moves into the overlay on open and is **restored** to the
  trigger on close.
- Focus is trapped for modal surfaces and not trapped for non-modal ones.
- The portal root carries the `data-fuji-*` attributes, so focus rings and
  contrast resolve against the right theme.
- Content outside a modal overlay is inert to assistive tech.

### Keyboard operation generally

Everything reachable by mouse is reachable and operable by keyboard. Tab order
follows visual order. `:focus-visible` is always visible - check it in all three
themes, particularly `glass`, where a low-contrast ring can vanish.

### Contrast and visual

- Text and interactive borders against their actual surfaces in `light`, `dark`,
  and `glass`. Glass is translucent, so contrast depends on what is behind it -
  check against a real backdrop, not a flat one.
- Touch targets at least 44×44 CSS px for anything primarily used on mobile.
- Nothing communicated by color alone.
- Content survives 200% zoom and large text without clipping or overlap.

### Preferences

- `prefers-reduced-motion: reduce`: Fuji durations collapse to `0ms`; count-up,
  carousel autoplay, and indeterminate progress stop. Any new animation must
  participate.
- `prefers-reduced-transparency: reduce` and missing `backdrop-filter` support:
  glass falls back to opaque surfaces. Readability wins over the effect.
- `forced-colors` mode: borders and focus indicators must survive.

## Output

Default to review-only. Report findings sorted Critical → High → Medium → Low.
Each finding: component, file and line, reproduction steps (keys pressed, screen
reader or automated tool used), the user impact and who it affects, evidence,
and the minimal remediation. Do not report automated-tool output alone as a
finding - confirm each one manually. Do not treat a Base UI default as
automatically correct, or an axe pass as proof of accessibility.

Finish with: components and interactions exercised, themes and viewports
checked, assumptions, and verification performed.
