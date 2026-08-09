---
name: fuji-react-component-authoring
description: Add a new component to @fuji-ui/react, or change an existing one, following the package's established structure, API conventions, Server/Client boundary rules, styling contracts, accessibility requirements, and test/docs/changeset obligations. Use when implementing component work in this repo.
---

# Fuji React component authoring

Unlike the review skills in this repo, this one **implements**. It is the
checklist for getting a component change right the first time, in the shape the
rest of the library already uses.

Read `AGENTS.md` and `SPEC.md` §4 first. `CONTRIBUTING.md` has the surrounding
workflow.

## Before writing anything

1. **Check it doesn't already exist.** `ls src/components/fuji` - 83 components
   are already here. A second implementation of an existing behavior is a defect.
2. **Find the nearest equivalent** and read it end to end. Match its structure,
   naming, and idiom rather than inventing a parallel style.
3. **Reuse the shared pieces** instead of rebuilding them:
   - `src/components/fuji/lib/appearance.ts` - the variant × appearance class
     recipe. Every semantically colored component uses it.
   - `src/components/fuji/lib/field-surface.ts` - the text-entry surface recipe.
   - `src/components/fuji/lib/use-portal-theme-attrs.ts` - **required** on any
     Base UI primitive that portals.
   - `src/components/fuji/lib/dismiss-button.tsx` - the shared dismiss control.
   - `src/hooks/useControllableState.ts` - controlled/uncontrolled state.
   - `src/lib/cn.ts` - class merging.
   - `src/types/index.ts` - shared size/variant/appearance types.
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
  variant?: ComponentVariant;
  appearance?: ComponentAppearance;
  classNames?: SlotClassNames<"root" | "label">;
}
```

- **Forward the ref** to the element consumers would expect to reach.
- **Spread remaining native props** onto that element.
- **Merge `className` through `cn`** so consumer classes win.
- **`classNames`** typed with `SlotClassNames` when there is more than one
  styleable region.
- **Reuse the shared union types.** Do not redeclare a narrower `size`.
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
- Use `cva` for variant recipes, consistent with the rest of the library.
- Radius comes from `--fuji-radius-control` / `-panel` / `-overlay` so both
  radius modes work. Shadows come from `--fuji-shadow-*` so both elevation modes
  work.
- New glass surfaces use the shipped `.fuji-glass-surface*` classes - they carry
  the opaque fallbacks.
- New motion uses `--fuji-duration-*` so it respects
  `prefers-reduced-motion: reduce` for free.
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

6. **Verify visually** for anything with an appearance, via a packed tarball in
   the sibling `fuji-ui-website`, across all three themes and both radius and
   elevation modes.

## Never

- Weaken lint or TypeScript config, add a blanket `eslint-disable`, a
  `@ts-ignore`, or an `any` in a public type to make a check pass. A narrow,
  single-line, commented disable with a real justification is acceptable.
- Add a runtime dependency without explicit approval - it ships to every
  consumer.
- Import `next/*`, a router, or any framework-specific module.
- Use a `@/*` path alias; internal imports are relative here.
- Commit, push, or publish unless explicitly asked.
