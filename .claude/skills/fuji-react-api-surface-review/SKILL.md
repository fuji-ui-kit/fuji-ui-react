---
name: fuji-react-api-surface-review
description: Audit the @fuji-ui/react public export surface for completeness, consistency, accidental leakage of internals, type quality, and breaking changes against the previously published version. Use before a release or when exports, props, or types changed.
---

# Fuji React API surface review

## Purpose

The package has exactly one public entry point, so `src/index.ts` _is_ the API.
This audit answers three questions: is everything that should be public actually
exported, is anything internal leaking, and did this change break an existing
consumer?

Default to review-only.

## Procedure

1. Read `SPEC.md` §3 and §4 (the locked API surface and conventions) and
   `AGENTS.md`.
2. Enumerate the actual surface:

   ```bash
   npm run build
   grep -c 'declare\|^export' dist/index.d.ts
   ```

   Read `dist/index.d.ts` directly - it is the authoritative consumer view,
   including inferred types the source does not spell out.

3. Compare against the previously published surface. If a prior tarball or
   published version is available, diff the two `index.d.ts` files; otherwise
   diff `src/index.ts` and the touched components against `git` history.
4. Walk the barrel chain: component file → component `index.ts` →
   `src/components/fuji/index.ts` → `src/index.ts`.

## Checks

### Completeness

- Every component exported also exports its props type
  (`ButtonProps`, `DialogContentProps`, ...).
- Compound components export **named sub-exports** in addition to dot-access.
- Shared types from `src/types/index.ts` are all re-exported.
- Anything a consumer must be able to name in their own typings is exported -
  a prop typed with an unexported interface is unusable in a wrapper component.

### Leakage

- Nothing from `src/components/fuji/lib/` is exported except `DismissButton` /
  `DismissButtonProps`. `appearance.ts`, `field-surface.ts`, and
  `use-portal-theme-attrs.ts` are internal.
- Internal helpers (`cn`, `useControllableState`, appearance-storage functions)
  must not appear in `dist/index.d.ts` unless deliberately promoted - promoting
  one is an API commitment, not a convenience.
- No subpath exports beyond `./styles.css`, `./tokens.css`, `./package.json`.

### Type quality

- No `any` in any public signature. Flag every one.
- Props extend the right native element props so consumers get real
  autocompletion and `ref` typing.
- Icon props are `IconComponent`, not `LucideIcon` - pinning to Lucide's own
  type would force consumers onto Lucide.
- Union types (`ComponentSize`, `ComponentVariant`, `ComponentAppearance`) are
  reused, not redeclared with a narrower or wider set per component.
- Generic components propagate their type parameter through to the consumer
  rather than collapsing to `unknown`.

### Consistency across components

Sample broadly rather than one component at a time. For the same concept, the
prop should have the same name, type, and default everywhere: `size`,
`variant`, `appearance`, `disabled`, `loading`, `invalid`, `readOnly`,
`className`, `classNames`, `value`/`defaultValue`/`onChange`,
`open`/`defaultOpen`/`onOpenChange`. An outlier is a finding even when it works.

### Breaking-change detection

Classify each delta:

| Delta                                           | Classification |
| ----------------------------------------------- | -------------- |
| New export, new optional prop                   | additive       |
| New required prop                               | **breaking**   |
| Removed or renamed export                       | **breaking**   |
| Widened prop type (accepts more)                | additive       |
| Narrowed prop type (accepts less)               | **breaking**   |
| Changed default value                           | **breaking**   |
| Changed the element a ref forwards to           | **breaking**   |
| Presentational component gaining `"use client"` | **breaking**   |

That last row matters as much as any signature change - it removes a consumer's
ability to pass the component as a reference from a Server Component, and no
type-level diff will show it. Check `"use client"` additions explicitly.

## Output

Default to review-only. Report:

1. **Breaking changes**, each with the before/after signature, who it affects,
   and the migration a consumer must perform.
2. **Missing exports** - things a consumer cannot reach.
3. **Leaked internals** - things a consumer can reach but shouldn't.
4. **Type quality issues**, with file and line.
5. **Inconsistencies** across components, grouped by concept.

Finish with the recommended semver bump (and whether a changeset exists for it),
assumptions, and verification performed.
