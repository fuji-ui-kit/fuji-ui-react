# Upgrading

## 0.2.x → 0.3.0

One coordinated breaking release. No import paths move and no component is
removed, but two type errors greet you on upgrade: the `earth` tone below,
and the `glass` theme/material split right after it. Both fail
`tsc --noEmit` immediately rather than changing behavior silently - start
with those two.

### The `earth` tone is gone

`earth` is removed from `ComponentTone`, from every component's tone map, and
from the tokens. `ComponentTone` is now:

```ts
type ComponentTone = "default" | "fire" | "water" | "forest" | "sun";
```

Every `tone="earth"` is a TypeScript error (`TS2322`). It was the muddiest of
the six and overlapped `sun` at most surface weights; `sun` is the closest
replacement, `forest` if you were relying on it reading as cool rather than warm.

```diff
-<Badge tone="earth">Draft</Badge>
+<Badge tone="sun">Draft</Badge>
```

If you referenced the token directly, `--fuji-earth` no longer exists either.

### `glass` is now a `material`, not a `theme` value

`theme` narrows to two values:

```ts
type FujiTheme = "light" | "dark";
```

`"glass"` moves to a new, independent axis, `material` (mirrored as
`data-fuji-material`, default `"solid"`):

```ts
type FujiMaterial = "solid" | "glass";
```

This was a forced choice, not a naming tidy-up. With `glass` as a third
`theme` value, turning glass on **overwrote** whatever light/dark choice a
user had made - there was no way to offer "dark mode + glass" as a single
controllable preference, and glass always fell back to its own dark tint
regardless of the app's theme. `theme` and `material` are now orthogonal:
either theme renders in either material, so `FujiProvider` gains
`material`/`defaultMaterial`/`onMaterialChange`, plus `material` and
`setMaterial` on `useFujiConfig()`. `material` **is** persisted alongside
`theme`/`radius`/`elevation` when `persist` is set - it's a real user
preference.

Update every `theme="glass"` (or `defaultTheme="glass"`) to
`theme="dark" material="glass"`:

```diff
-<FujiProvider theme="glass">
+<FujiProvider theme="dark" material="glass">
   <App />
 </FujiProvider>
```

**The glass material's tint now derives from `theme`, with no separate axis
to set it independently**: a light-themed app's glass tints light (white
surfaces, dark text) and a dark-themed app's glass tints dark. There is no
`glassTint` prop - an earlier prerelease build of this axis split briefly had
one (`glassTint`/`defaultGlassTint`/`onGlassTintChange`, mirrored as
`data-fuji-glass`), but it never shipped in a stable release, and it has been
removed in favor of `theme` alone deciding the tint. If you built against
that prerelease and had `glassTint="light"` (or `"dark"`) to show glass with
a tint independent of the page's own theme, nest a `FujiProvider` with the
tint's `theme` (and `material="glass"` re-declared - nested providers don't
inherit unspecified axes from an ancestor) around just that region instead:

```diff
-<FujiProvider theme="dark" material="glass" glassTint="light">
-  <App />
-</FujiProvider>
+<FujiProvider theme="dark" material="glass">
+  <App>
+    <FujiProvider theme="light" material="glass">
+      <BrightPhotoSection />
+    </FujiProvider>
+  </App>
+</FujiProvider>
```

**A stored `{"theme":"glass"}` preference from before this release keeps
working** - `persist`'s reader and the pre-paint bootstrap script both coerce
it to `{theme: "dark", material: "glass"}` on read, so a returning visitor's
saved preference renders the same dark glass it always did. Nothing in your
app needs to change for this; it's mentioned here so the shape isn't a
surprise if you inspect `localStorage`.

If you use the pre-paint bootstrap script
(`buildAppearanceBootstrapScript`/`StoredAppearance`), pass it a `material`
default alongside `theme`/`radius`/`elevation` - see [ssr.md](./ssr.md).

### Glass no longer paints its own background or atmosphere automatically

A second, independent change to `material="glass"` in this release:
`--fuji-background` used to be a fixed `#2c323b` under glass - identical in
both themes - and a decorative gradient atmosphere painted onto the page
automatically. Glass now inherits whichever theme is active instead:
`theme="dark" material="glass"` renders on dark's own `#0f0f0e`,
`theme="light" material="glass"` on light's own `#eceae6`. The gradient
canvas is no longer painted for you.

**If your app used `material="glass"` and relied on the gradient appearing
on its own, you will now see the theme's flat background instead.** Fix it
with one line - apply the shipped `.fuji-glass-atmosphere` class yourself, or
supply your own backdrop; glass composites over whatever is behind it either
way:

```diff
 <FujiProvider theme="dark" material="glass">
-  <App />
+  <div className="fuji-glass-atmosphere min-h-screen">
+    <App />
+  </div>
 </FujiProvider>
```

Re-adding the class does not restore "your theme, with glass on top" - the
atmosphere it paints is fixed decorative art (a slate-blue/terracotta/teal
canvas under a dark tint, a white/tan/blue-grey one under light), not a
rendering of `--fuji-background` or anything else you've customized. It's
the same reference scene the pre-upgrade screenshots showed, applied
explicitly instead of automatically. If what you actually want is glass over
something that reflects your own theme or product, skip the class and supply
your own backdrop instead - a photo, a brand gradient, a plain color.

The class is safe to render unconditionally - its selector only matches
under `material="glass"`, so it stays inert under `solid`.

No type or prop changes; this is a rendering-only fix. See
[theming.md](./theming.md#the-atmosphere-is-opt-in) for the full token-level
explanation of what glass keeps versus what it now inherits from `theme`.

### Prop renames

Fuji uses `tone` for decorative color roles and `variant` for semantic status
(`success`/`warning`/`danger`/`info`). Four components predated that rule and
used those words for something else, which made `variant` mean three different
things depending on which component you were looking at.

| Component    | Before            | After                |
| ------------ | ----------------- | -------------------- |
| `Skeleton`   | `variant`         | `shape`              |
| `Typography` | `variant`         | `scale`              |
| `Link`       | `color` / `hover` | `tone` / `hoverTone` |
| `Container`  | `size`            | `width`              |

```diff
-<Skeleton variant="circle" />
+<Skeleton shape="circle" />

-<Typography variant="heading">Title</Typography>
+<Typography scale="heading">Title</Typography>

-<Link color="blue" hover="default" href="/docs">Docs</Link>
+<Link tone="blue" hoverTone="default" href="/docs">Docs</Link>

-<Container size="md">…</Container>
+<Container width="md">…</Container>
```

`Container.size` became `width` for a different reason than the other three:
`size` elsewhere in Fuji means a control's height/padding scale (`sm`/`md`/`lg`
on Button, Input, Badge), and Container's meant its maximum line length. Two
unrelated ideas under one name.

Exported types renamed to match: `LinkColor` → `LinkTone`,
`TypographyVariant` → `TypographyScale`.

`Typography`'s accepted values are unchanged - `display`, `heading`, `title`,
`subtitle`, `body`, `bodySm`, `caption`. Only the prop name moved. The scale is
named for the role rather than for a tag, because the tag is chosen separately
with `as` - `scale="heading" as="h1"` is a legitimate pairing.

### Changed defaults

**`Carousel` no longer autoplays by default.** `autoplay` now defaults to
`false`. Self-starting motion lasting more than five seconds is a WCAG 2.2.2
obligation for the page that ships it, and defaulting it on handed every
consumer that obligation silently. Add `autoplay` where you want it:

```diff
-<Carousel>…</Carousel>
+<Carousel autoplay>…</Carousel>
```

### Changed markup and semantics

These need no code change, but they change the DOM, so snapshot tests and
selectors may need updating.

- **`Sidebar` renders `<nav>` instead of `<aside>`**, with a default
  `aria-label="Sidebar"`. `Sidebar.Item` is a link, so this is a navigation
  landmark, not a complementary one. Tests querying `getByRole("complementary")`
  become `getByRole("navigation", { name: "Sidebar" })`.
- **`Navbar` and `BottomNavigation` default to `aria-label="Main"`**, so a page
  with several navigation landmarks doesn't present a list of identical
  entries. Pass your own `aria-label` to override.
- **`Dialog`'s close button now renders after `children`** in the DOM (its
  position on screen is unchanged - it is absolutely positioned). Initial focus
  therefore lands on the first tabbable element of your content rather than on
  "Close dialog".
- **Sortable `DataTable` headers announce their state.** The header cell gets
  `aria-sort`, and the toggle's accessible name gains a suffix: `"Name"`
  becomes `"Name, not sorted"` / `"Name, sorted ascending"`. Queries by exact
  name need to become prefix matches:
  ```diff
  -screen.getByRole("button", { name: "Name" })
  +screen.getByRole("button", { name: /^Name/ })
  ```
- **`Dropzone`'s accessible name is now `"Upload files"`**, not its
  `description` prose, and it takes a new `label` prop to override that. Its
  file list is a named `aria-live` region.
  ```diff
  -screen.getByRole("button", { name: /drag and drop/i })
  +screen.getByRole("button", { name: /upload files/i })
  ```
- **Chart data points are no longer individual tab stops.** A plot is one tab
  stop; arrow keys move a cursor (left/right along a series, up/down between
  series) and Escape releases it. The data itself was, and still is, exposed as
  a visually-hidden table inside every chart.
- **`ChatBubble` keeps the sender announced when `grouped`.** It is now
  rendered visually hidden rather than omitted, so a run of grouped messages
  is still attributable in a linear read. `queryByText(sender)` finds it where
  it previously did not.
- **`Calendar` day cells** have a full-date accessible name
  ("Saturday, 14 March 2026") instead of the bare day number, carry
  `aria-current="date"` on today, and mark today with a dot as well as a color.
- **`Timeline` items announce their `variant`** as a visually-hidden prefix
  ("Error: Deployment failed"). Override or suppress it per item with
  `statusLabel`.

- **`BottomNavigation` is `position: sticky` by default, not `fixed`.** It
  now pins to the bottom of its own scroll container instead of the viewport.
  Rendered at the end of `<body>` nothing changes; rendered inside a panel it
  now stays in that panel. Pass `position="fixed"` for the old behaviour.

### New, non-breaking

- **The pre-paint appearance script now ships.**
  `buildAppearanceBootstrapScript(defaults)` returns the small script that reads
  a returning visitor's saved theme before first paint, so `persist` no longer
  flashes the default. It comes with `APPEARANCE_STORAGE_KEY` and the
  `StoredAppearance` type. If you copied this script out of `docs/ssr.md`,
  replace your copy - yours duplicates a storage key and payload shape that are
  now owned by the package. See [ssr.md](./ssr.md) for placement.
- `LineChart` takes `curve` (`"smooth"` default, `"linear"`) and
  `strokeWidth`; `Carousel` takes `effect="coverflow"`; `Tabs.List` takes
  `variant="pill"`; `BottomNavigation` takes `variant="floating"` and
  `action`.
- `Statistic` now rolls digits instead of counting up. If you matched its
  text in tests, match the `aria-label` on `.fuji-number` instead - the
  visible digits are individual cells.

- `BottomNavigation` takes `position` (`"sticky"` | `"fixed"` | `"absolute"` |
  `"static"`).

- `Toaster` takes `position` (`"bottom-right"` default, `"bottom-center"`,
  `"bottom-left"`). Toasts now stack - newest in front, the rest pushed back
  and scaled - and fan out on hover; the provider's `limit` caps the stack.
- `BarChart` takes `highlight` (the period(s) to emphasise - the rest go
  muted, the highlighted bar carries a value tag), `average` /
  `averageLabel` (a dotted reference line); every chart takes `headline`
  (big figure + change pill), `stats` (label/value strip), `icon` and
  `actions`. The first series colour is now the theme's foreground ("ink")
  rather than the raised-accent fill, so it stays visible under glass.
- `Timeline` takes `groups` for a history layout (heading on a centred
  axis, media left, dated entries right). `items` is optional when `groups`
  is given.
- `Notification` takes `avatar`, `badge`, `media`, `layout="inline"`.
- `CircularProgress` `size` accepts a px diameter as well as `sm|md|lg`
  (which are now 40/64/96 - thicker, round-capped arcs), plus `thickness`.
- `StepperStep` takes `disabled`.
- Radius has a fourth tier, `--fuji-radius-item` (`rounded-fuji-item`), for
  rows and chips inside a control; it is 6px cornered / 10px soft. Menu
  items, the checkbox box, kbd, tooltip and the segmented-control indicator
  were pinned at 6px and now follow `soft`.
- `CommandMenu` is now uncontrolled by default: `open`/`onOpenChange` are
  optional and `defaultOpen` is available.
- `Button` and `IconButton` play a pointer-origin press ripple by default. Pass
  `ripple={false}` to suppress it on a control.
- `BottomNavigation` takes `onItemSelect`, matching `Navbar`. An item with no
  `href` now renders as a `<button>` when a handler is given, so it is
  keyboard-operable.
- New `InfiniteScroll` loads the next page when the end of a list scrolls into
  view - use it in place of a pager, including around `DataTable` (set
  `pageSize` to the rows fetched so far).
- New `FloatingActionBar` is a speed dial: a circular trigger that fans a
  column of labelled actions out from itself, staggered and tapering with
  distance. The column is positioned against the trigger, so opening never
  moves it. Takes `direction` (`"auto"` default, `"up"`, `"down"`).
- `Alert` is restyled: the tone is washed in from the leading edge instead of
  tinting the whole block, and the icon sits on its own tile. No API change.
  `Toast` now carries the same treatment, so the two read as one family.
- `Drawer.Content` takes `variant` (`"full"` default | `"sheet"`). `"full"`
  spans the edge it slides from, on all four sides; `"sheet"` is the detached
  card - inset all round, rounded on every corner, width- or height-capped.
- Charts animate between data sets: change `series` and the line, bars, donut
  and axis travel to the new shape rather than snapping. A change of shape
  (different series names or point labels) still snaps, and
  `prefers-reduced-motion` skips the movement.
- `AvatarGroup`'s separating ring now uses the surface colour behind it;
  override per group with `--fuji-avatar-group-ring`.
- `ChatBubble` casts an elevation-aware shadow again (a `drop-shadow` filter,
  so it follows the tail too).
- Glass is more transparent: surface tints are 22/28/42% (were 30/38/50%) and
  the blurs 10/14/16/12px (were 20/28/36/44px originally, then 6/10/14/8px).
  The inset white edge highlight is gone from glass shadows.
  `--fuji-surface-overlay` stays at 48% - it is the tier that covers content
  the theme does not control.
- New `--fuji-text-2xs` (11px) sits below `xs`, for dense labels such as a tab
  bar.
- `Card` takes `effect` (`"none" | "lift" | "tilt"`) for its hover treatment.
  `"lift"` is the CSS scale-and-tip that `interactive` used to enable; `"tilt"`
  tracks the pointer and tilts the card in 3D towards it. The `interactive`
  boolean still works and maps to `"lift"`, but is deprecated - `effect` takes
  precedence when both are set, so `effect="none"` opts a card back out.
- `LineChart` takes `area` for a soft gradient fill under each line.
- `Dropzone` takes `label`.
- `TimelineItem` takes `statusLabel`.

### Visual changes

The token layer was rebuilt, so components look different without any API
change - larger, more visible radius/elevation differences, shadow-defined
surfaces, a glass material that layers translucency and blur over whichever
theme is active instead of painting its own, and a shared motion system.
See [DESIGN.md](https://github.com/fuji-ui-kit/fuji-ui-react/blob/main/DESIGN.md)
in the repository for what changed and why. If you have pinned Fuji's colors,
shadows, or radii by copying token values into your own CSS, re-check them
against `@fujiui/react/tokens.css`.

---

# Migrating from a local/vendored copy of Fuji

See [migration.md](./migration.md).
