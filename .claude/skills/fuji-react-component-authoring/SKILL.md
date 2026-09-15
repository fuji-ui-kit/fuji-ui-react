---
name: fuji-react-component-authoring
description: Add a new component to @fujiui/react, or change an existing one, following the package's established structure, API conventions, Server/Client boundary rules, styling contracts, accessibility requirements, and test/docs/changeset obligations. Use when implementing component work in this repo.
# Contributor skill for working on this repository. Hidden from `npx skills add`,
# which would otherwise install it into apps that only use @fujiui/react.
metadata:
  internal: true
---

# Fuji React component authoring

Unlike the review skills in this repo, this one **implements**. It is the
checklist for getting a component change right the first time, in the shape the
rest of the library already uses.

Read `AGENTS.md` and `SPEC.md` §4 first. `CONTRIBUTING.md` has the surrounding
workflow.

## Before writing anything

1. **Check it doesn't already exist.** `ls src/components/fuji` - 82 components
   (83 directories, one of them the shared `lib` helpers) are already here. A second implementation of an existing behavior is a defect.
2. **Find the nearest equivalent** and read it end to end. Match its structure,
   naming, and idiom rather than inventing a parallel style.
3. **Reuse the shared pieces** instead of rebuilding them:
   - `src/components/fuji/lib/appearance.ts` - the tone × appearance class
     lookup table (plain objects, no `cva`). Every colored component uses it;
     `contained` carries `.fuji-raised`, `ghost` is `shadow-none bg-transparent`.
   - `src/components/fuji/lib/native-control-reset.ts` - `NATIVE_CONTROL_RESET`
     for every native `<button>`/`<input>` and `NATIVE_LINK_RESET` for every
     styled `<a>`. The package ships **no preflight**, so the UA stylesheet
     (link underline + blue, `<p>` margins, `content-box`) is live in every
     consumer; a component resets what it relies on itself.
   - `src/components/fuji/lib/safe-href.ts` - `safeHref()` for any `href` prop.
   - `src/components/fuji/lib/field-surface.ts` - the text-entry surface recipe.
   - `src/components/fuji/lib/use-portal-theme-attrs.ts` - **required** on any
     Base UI primitive that portals.
   - `src/components/fuji/lib/dismiss-button.tsx` - the shared dismiss control.
   - `src/hooks/useControllableState.ts` - controlled/uncontrolled state.
   - `src/lib/cn.ts` - class merging.
   - `src/types/index.ts` - shared `ComponentSize`, `ComponentTone`
     (decorative), `StatusTone` (semantic), `ComponentAppearance`, and the
     appearance axes `FujiTheme`/`FujiRadius`/`FujiElevation`/`FujiGlassTint`.
4. **Prefer Base UI** (`@base-ui/react`) for anything involving focus
   management, ARIA semantics, or portals. Do not hand-roll a dialog, menu,
   select, popover, or tooltip.

## Structure

```
src/components/fuji/<kebab-name>/
  <PascalName>.tsx      implementation
  index.ts              barrel
  <PascalName>.test.tsx tests
```

Then wire the barrels upward: `src/components/fuji/index.ts`, and
`src/index.ts` for anything public. An export missing from a barrel is invisible
to consumers.

## Decide the Server/Client boundary deliberately

Add `"use client"` **only** if the component needs state, effects, event
handlers, browser APIs, or a client-only Base UI primitive.

- It must be the **literal first line** of the file - not after a comment or a
  blank line, or the build silently drops it and the component runs as a Server
  Component in consumer apps.
- A presentational component must stay free of it. Adding one is a breaking
  change: Server Components can no longer pass the component as a reference
  (`<Icon icon={SearchX} />`). If you are unsure, the test is whether the
  component's render path touches state, effects, or the DOM at all.

## API conventions (non-negotiable)

```tsx
export interface ThingProps extends React.ComponentPropsWithoutRef<"div"> {
  size?: ComponentSize;
  /** Decorative color: `tone`. Semantic meaning (success/danger/...): `variant: StatusTone`. */
  tone?: ComponentTone;
  appearance?: ComponentAppearance;
  classNames?: SlotClassNames<"root" | "label">;
}
```

- **Forward the ref** to the element consumers would expect to reach.
- **Spread remaining native props** onto that element.
- **Merge `className` through `cn`** so consumer classes win.
- **`classNames`** typed with `SlotClassNames` when there is more than one
  styleable region.
- **Reuse the shared union types.** Do not redeclare a narrower `size`. Color
  props are `tone` (decorative `ComponentTone`) or `variant` (semantic
  `StatusTone`) - never `color`, never both on one component.
- **Controlled/uncontrolled via `useControllableState`**: `value` + `onChange`,
  or `defaultValue`. Overlays use `open`/`defaultOpen` via Base UI roots. There
  is no third pattern.
- **Explicit `type` on every `<button>`** - a bare button inside a form submits.
- **Icon props are `IconComponent`**, taking a component reference. Never a
  string name, never a rendered element, never `LucideIcon`.
- **No per-component `theme`/`radius`/`elevation` props.** Appearance is global.
- Compound components expose **named sub-exports** (`ThingContent`) alongside
  dot-access (`Thing.Content`) - Server Components cannot read a static property
  off a client-module binding.

## Styling

- Use `--fuji-*` tokens, via the mapped Tailwind utilities or the `.fuji-*`
  recipe classes. No hard-coded colors, spacing, radii, shadows, or durations.
- **Write class names out in full.** Tailwind's scanner is static;
  `bg-fuji-${variant}` is never generated. This is why `appearance.ts` spells
  out every combination - do the same in any new recipe.
- Write variant recipes as plain lookup tables (`Record<Tone, string>`), as
  `appearance.ts` does. There is no `cva` in this package.
- Radius comes from `--fuji-radius-item` (rows/chips inside a control) /
  `-control` / `-panel` / `-overlay` so both radius modes work. A
  `rounded-[6px]` literal is a defect: it ignores `soft`. Shadows come from
  `--fuji-shadow-*` (`.fuji-raised` for the black accent object, `shadow-drop`
  for SVG `filter: drop-shadow`) so both elevation modes work.
- **`box-border` on any element that sets a size AND padding/border.** No
  preflight means `content-box`; `src/styles/box-sizing.test.tsx` fails the
  build otherwise (the Switch thumb travel and fourteen containers overflowed
  before this rule).
- Every hand-written `fuji-*` class must exist as a selector or keyframe in
  `src/styles/*.css` - `src/styles/recipes.test.ts` enforces it.
- New glass surfaces use the shipped `.fuji-glass-surface*` classes - they carry
  the opaque fallbacks.
- New motion uses the shared recipes in `base.css` (`.fuji-motion-backdrop/
-modal/-popup/-popup-morph/-sheet/-toast/-indicator`, `.fuji-chart-*`,
  `.fuji-progress-fill`, `.fuji-ring-fill`, `.fuji-pop-in`, `.fuji-ripple`,
  `.fuji-digit`, `.fuji-coverflow-slide`) or, when none fits, a new recipe
  there on `--fuji-duration-*` / `--fuji-ease-spring` so it respects
  `prefers-reduced-motion: reduce` for free. Per-component
  `transition-[...] duration-[...]` strings drift; the recipe is the identity.
- **Entrance animations are CSS keyframes with a `from` state, never a
  `requestAnimationFrame`-toggled class.** A tab whose rAF is throttled never
  runs the toggle and the component stays at its empty state (this happened
  to the chart entrance and again to the progress draw-in).
- Anything that must be continuous while a pointer is down (coverflow drag,
  sheet swipe) writes to the DOM directly from the pointer handler and resets
  on release; a React state update per `pointermove` is the wrong tool.
- A new overlay surface is one of the four `--fuji-surface*` tiers. Under
  glass each tier has a dark-tint and a light-tint value
  (`[data-fuji-glass="light"]`); restate both when adding a glass-only token.
- If you add a **new top-level source directory**, add it to `@source` in
  `scripts/css-entry.css` or its utilities never get generated.

## Accessibility

- Semantic HTML first. Reach for ARIA only when no element expresses it.
- Icon-only controls require `aria-label` **as a required prop at the type
  level**, following `IconButton`.
- Disabled, loading, invalid, selected, expanded, and readOnly drive both the
  styling and the ARIA attribute.
- Composite widgets use roving tabindex: container out of the tab order, exactly
  one item at `tabindex="0"`, arrows moving focus and the roving index, with
  role and ARIA state on the **same focusable node**.
- `:focus-visible` must be visible in `light`, `dark`, and `glass`.

## SSR safety

No `window`, `document`, `localStorage`, or `matchMedia` in the render path -
only inside `useEffect`/`useLayoutEffect`. Use `useId` for generated ids, never
`Math.random()` or `Date.now()`. Guard `useLayoutEffect` so it degrades on the
server.

## Cross-version React (18 and 19)

- Reading a child's ref must handle both `props.ref` (19) and the element's own
  `ref` field (18) - copy `Button`'s `asChild` approach.
- For DOM attributes the majors disagree about (`inert`), set them imperatively
  in a ref callback rather than as a JSX prop.

## Cleanup

Every `addEventListener`, `setTimeout`, `setInterval`, observer, and
`requestAnimationFrame` needs a cleanup in the effect's return. A leak here
leaks in every consuming app.

## Finish the change

1. **Tests** beside the component: behavior, keyboard, controlled _and_
   uncontrolled, disabled/loading/invalid states, ref forwarding, and a
   `jest-axe` assertion where accessibility is in play.
2. **Docs**: `README.md` and/or `docs/` in the same change.
3. **Changeset**: `npm run changeset` for anything user-facing, with the correct
   bump type.
4. **Run the gate**:

   ```bash
   npm run format:check && npm run lint && npm run typecheck && npm test && npm run build
   ```

5. **Verify the boundary survived the build** if you added or moved a directive:

   ```bash
   head -1 dist/esm/components/fuji/<kebab-name>/<PascalName>.js
   ```

6. **Verify visually in Storybook** (`npm run storybook`, port 6006) for
   anything with an appearance: add or update the story, then check it in the
   toolbar's Theme × Radius × Elevation matrix, and for glass also the
   `Backdrop` (light/dark/mixed/photo) and `Glass tint` toolbars. A story is
   part of the change, not an afterthought - every component has one under
   `stories/<category>/`. For token changes also run
   `node scripts/render-gallery.mjs` (all twelve appearance combinations as
   rendered pages). The sibling website is a consumer, not the verification
   surface.

## Never

- Weaken lint or TypeScript config, add a blanket `eslint-disable`, a
  `@ts-ignore`, or an `any` in a public type to make a check pass. A narrow,
  single-line, commented disable with a real justification is acceptable.
- Add a runtime dependency without explicit approval - it ships to every
  consumer.
- Import `next/*`, a router, or any framework-specific module.
- Use a `@/*` path alias; internal imports are relative here.
- Commit, push, or publish unless explicitly asked.
