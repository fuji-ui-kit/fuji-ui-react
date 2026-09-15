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

`Tree`, `Calendar`'s date grid, `ButtonGroup`, `Rating`, and `Keyboard`
implement the WAI-ARIA roving-tabindex pattern: the container is not itself in
the tab order; exactly one item is (`tabindex="0"`), and arrow keys move both
focus and the roving `tabindex` between items. `Keyboard` is the reason the
pattern matters most here - a 100% board is ninety-nine caps, and one tab stop
per cap would bury every control after it. Its arrow moves are geometric
rather than index-based, so a move past the numpad's two-unit `+` and `Enter`
lands on the cap that is actually above or below. `Tree` specifically:

- Puts `role="treeitem"`, `aria-expanded`, `aria-selected`, `aria-level`,
  `aria-posinset`, `aria-setsize`, and the roving `tabindex` all on the same
  focusable node (not split across a wrapper and a nested interactive child),
  so assistive tech reads full tree-item semantics on focus.
- Supports ArrowUp/ArrowDown (move), ArrowRight/ArrowLeft (expand/collapse or
  move to a child/parent), Home/End (jump to first/last visible node), and
  Enter/Space (activate).

`Keyboard`'s caps are interactive controls whose size is derived from the
container, so a layout's column count sets a floor under how small they can
get - see Touch targets below for which layouts stay above the WCAG 2.5.8 AA
24x24 floor at phone width.

## Touch targets

`Keyboard` is drawn as a CSS grid whose cap size is derived from its
container, so a layout's column count directly sets a floor under how small a
cap can get. Measured in a real browser, in flow, `size="md"`, at a 375px-wide
container:

| layout           | cap size | WCAG 2.5.8 AA 24x24 |
| ---------------- | -------- | ------------------- |
| `full` (default) | 14.7px   | fails               |
| `tkl`            | 18.2px   | fails               |
| `compact`        | 18.2px   | fails               |
| `numpad`         | 27px     | passes              |
| `phone`          | 31.5px   | passes              |

Docked (`floating`, `size="md"`) at a 375px viewport, the numbers shift but the
ranking doesn't: `compact` measures 16.7px and `phone` 29.1px.

`full` (the default) and `tkl` are actually worse than `compact`, the layout
most often blamed for this - all three fail the floor at phone width. Only
`numpad` and `phone` are phone-width safe; `full`, `tkl` and `compact` are
desktop-width layouts and need a wider container (or a larger `size`) to keep
their caps above 24x24. There is no code-level guard for this - a layout never
refuses to render at a narrow width - so pick `numpad` or `phone` for anything
docked at phone width, and verify the cap size yourself if you give one of the
other three layouts an unusually narrow container.

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

## Nothing is signalled by color alone

Every "this one is selected/current/failed" state has a non-color form as well
as its visual one (WCAG 1.4.1).

- **Active navigation item** - `Navbar`, `BottomNavigation` and `Sidebar` set
  `aria-current="page"` on the active item, alongside the raised treatment.
- **Today, in `Calendar`** - `aria-current="date"` plus a dot under the number,
  not only the accent color.
- **Sort direction, in `DataTable`** - `aria-sort` on the header cell, and the
  direction spelled out in the toggle's accessible name ("Revenue, sorted
  ascending"). The arrow glyphs are `aria-hidden`.
- **`Timeline` status** - the `variant` is announced as a visually-hidden
  prefix ("Error: Deploy failed"). Set `statusLabel` per item to translate it,
  or `""` to suppress it where the title already says what happened.
- **`ChatBubble` sender, when `grouped`** - hidden visually (the run's shape
  carries it) but still announced, so a run of grouped messages stays
  attributable in a linear read.

## Landmarks are named

`Navbar` and `BottomNavigation` default to `aria-label="Main"` and `Sidebar` to
`aria-label="Sidebar"`, because a page with several navigation landmarks
otherwise offers a screen reader a list of identical entries. Override with
your own `aria-label`. `Sidebar` renders a `<nav>`, not an `<aside>` - its
items are links.

## Charts

A chart plot is **one** tab stop, not one per data point. Arrow keys move a
cursor - left/right along a series, up/down between series - and Escape
releases it. The data itself is exposed as a visually-hidden table rendered
inside every chart, which is what a screen reader reads; the SVG is one
labelled image.

This is deliberate: making each point focusable put dozens of tab stops
between the controls either side of the chart, each announcing a value the
table already carried.

## Links

Every component that renders an `<a href>` from data (`Link`, `Navbar`,
`BottomNavigation`, `Breadcrumb`, `Sidebar.Item`) resolves the URL through a
scheme allowlist - `http`, `https`, `mailto`, `tel`, and relative URLs.
Anything else renders without an `href`, and warns in development builds
naming the value that was dropped. See SECURITY.md.

## Reduced motion and reduced transparency

- `prefers-reduced-motion: reduce` collapses Fuji's own transition durations
  to `0ms` and disables a handful of explicit animations (count-up numbers
  jump straight to their target, carousel autoplay pauses, indeterminate
  progress bars stop sliding, the `Button` `ripple` does not run). Overlay
  entrances, the Tabs/SegmentedControl indicator slide, and the chart draw-in
  all read their timing from those same tokens, so they collapse with them
  rather than each needing their own opt-out.
- `Carousel` does not autoplay unless you ask for it (`autoplay`), and pauses
  on hover, focus, touch, and a hidden tab. It also renders a persistent
  play/pause control when autoplaying (WCAG 2.2.2), and only announces slide
  changes once autoplay is off - otherwise it would interrupt whatever the
  user is reading every few seconds.
- `prefers-reduced-transparency: reduce` (and environments where
  `backdrop-filter` is unsupported) flattens the `glass` material to opaque
  cool-neutral surfaces instead of translucent + blurred ones - readability
  wins over the visual effect.

## Testing

The package's own test suite (`npm test` in this repo) includes `jest-axe`
accessibility assertions alongside behavioral tests for keyboard navigation,
focus management/restoration, and controlled/uncontrolled state - see
`src/**/*.test.tsx` for examples if you want to write similar tests against
your own usage.
