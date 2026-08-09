# Accessibility

Fuji's overlay and form primitives build on
[Base UI](https://base-ui.com) (`@base-ui/react`) for focus management, ARIA
roles/attributes, and keyboard behavior - Dialog, Drawer, Popover, Menu,
Select, Combobox, Tooltip, Toast, Tabs, and more all inherit Base UI's
accessibility work rather than reimplementing it.

## Icon-only controls require an accessible name

`IconButton` requires `aria-label` at the type level (a required prop, not
optional) - there is no way to render an icon-only button without naming it
for assistive technology. The shared dismiss control (used by every
dismissible overlay) has the same requirement.

`Icon` itself is either decorative (`aria-hidden`, the default) or labeled
(`role="img"` + `aria-label`) depending on whether you pass a `label` prop -
never ambiguous.

## Roving-tabindex composite widgets

`Tree`, `Calendar`'s date grid, `ButtonGroup`, and `Rating` implement the
WAI-ARIA roving-tabindex pattern: the container is not itself in the tab
order; exactly one item is (`tabindex="0"`), and arrow keys move both focus
and the roving `tabindex` between items. `Tree` specifically:

- Puts `role="treeitem"`, `aria-expanded`, `aria-selected`, `aria-level`,
  `aria-posinset`, `aria-setsize`, and the roving `tabindex` all on the same
  focusable node (not split across a wrapper and a nested interactive child),
  so assistive tech reads full tree-item semantics on focus.
- Supports ArrowUp/ArrowDown (move), ArrowRight/ArrowLeft (expand/collapse or
  move to a child/parent), Home/End (jump to first/last visible node), and
  Enter/Space (activate).

## States are reflected in both style and ARIA

Disabled, loading, invalid, selected, and read-only states drive both the
visual treatment and the corresponding ARIA attribute
(`aria-disabled`/`disabled`, `aria-busy`, `aria-invalid`, `aria-selected`,
`aria-readonly`) - never one without the other.

`Button`'s `asChild` mode (rendering the styling onto a child element such as
a router `<Link>` instead of a native `<button>`) has no native `disabled`
attribute to rely on for a non-button element, so disabled/loading state is
enforced via `aria-disabled` plus a click/keydown guard instead - the element
stays focusable (consistent with one of the two APG-documented patterns for
disabled controls) but its activation is blocked and announced as disabled.

## Reduced motion and reduced transparency

- `prefers-reduced-motion: reduce` collapses Fuji's own transition durations
  to `0ms` and disables a handful of explicit animations (count-up numbers
  jump straight to their target, carousel autoplay pauses, indeterminate
  progress bars stop sliding).
- `prefers-reduced-transparency: reduce` (and environments where
  `backdrop-filter` is unsupported) flattens the `glass` theme to opaque
  cool-neutral surfaces instead of translucent + blurred ones - readability
  wins over the visual effect.

## Testing

The package's own test suite (`npm test` in this repo) includes `jest-axe`
accessibility assertions alongside behavioral tests for keyboard navigation,
focus management/restoration, and controlled/uncontrolled state - see
`src/**/*.test.tsx` for examples if you want to write similar tests against
your own usage.
