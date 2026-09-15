# Contributing to @fujiui/react

Read `AGENTS.md` for the working rules, `SPEC.md` for the locked public
contracts, and `ARCHITECTURE.md` before touching the build.

## Setup

```bash
npm ci
npm test
```

Node `>= 18.18`. CI runs on 18.18.x and 20.x, so avoid APIs newer than Node 18.

## The check gate

Run these before every handoff, in this order - it is exactly what CI runs:

```bash
npm run format:check && npm run skills:check && npm run lint && npm run typecheck && npm run build && npm test
```

Never make a check pass by weakening it. No blanket `eslint-disable`, no
`@ts-ignore`, no `any` in a public type, no relaxed `tsconfig` flag. A
single-line disable with a comment explaining why the rule is wrong _here_ is
acceptable; anything broader is not.

## Adding or changing a component

1. **Reuse before creating.** Check `src/components/fuji/lib/` for an existing
   recipe (`appearance.ts`, `field-surface.ts`), `src/hooks/useControllableState.ts`
   for state, `src/lib/cn.ts` for class merging, and the nearest existing
   component for the pattern. A second implementation of an existing behavior is
   a defect, not a feature.
2. **Prefer Base UI** for anything with focus management, ARIA semantics, or
   overlay/portal behavior. Do not hand-roll a dialog, menu, select, or tooltip.
3. **Decide the boundary deliberately.** Add `"use client"` as the literal first
   line only if the component needs state, effects, event handlers, browser
   APIs, or a client-only Base UI primitive. Presentational components must stay
   server-renderable - see `SPEC.md` §5.
4. **Follow the API conventions** in `SPEC.md` §4: forward the ref, spread native
   props, merge `className` through `cn`, use `SlotClassNames` for multi-slot
   styling, reuse the shared size/variant/appearance types, explicit `type` on
   every button, required accessible name on icon-only controls,
   controlled/uncontrolled via `useControllableState`.
5. **Write class names out in full.** Tailwind's scanner is static;
   `bg-fuji-${variant}` is never generated.
6. **Wire the barrels**: the component's own `index.ts`,
   `src/components/fuji/index.ts`, and - for anything public -
   `src/index.ts`.
7. **Test it.** Behavior, keyboard interaction, controlled _and_ uncontrolled
   modes, and a `jest-axe` assertion where accessibility is in play. Put the
   test beside the component as `<Component>.test.tsx`.
8. **Document it.** `README.md` and/or `docs/` in the same change, not later.
9. **Add a changeset** (`npm run changeset`) for anything user-facing.

## Writing tests

- Vitest + Testing Library + `user-event` + `jest-axe`, jsdom environment.
- Prefer `user-event` over `fireEvent` for anything a user does. Use
  `fireEvent` only for events jsdom cannot produce naturally (e.g.
  `transitionEnd` - jsdom never fires real CSS transitions).
- Query by role and accessible name. A test that has to reach for a test id on
  an interactive element usually means the component is missing an accessible
  name.
- Fake timers need `toFake` to include `requestAnimationFrame` and `performance`
  for animation code, and React state updates driven by them must be wrapped in
  `act()`.
- SSR tests use the `// @vitest-environment node` pragma and `renderToString`,
  so a stray `window` access fails loudly rather than silently passing under
  jsdom. See `src/ssr.test.tsx`.

## Verifying against the website

For visual, theming, or integration changes, verify against the sibling
consumer rather than trusting a green build:

```bash
# in fuji-ui-react
npm run build && npm pack

# in ../fuji-ui-website
npm install ../fuji-ui-react/fujiui-react-<version>.tgz
npm run build && npm run dev
```

Then check the affected surfaces across `light`/`dark`/`glass` ×
`cornered`/`soft` × `regular`/`floating`, including portaled overlays, at mobile
and desktop widths, with a clean console.

## React 18 / 19

The package supports both. If a change touches refs, DOM attributes, or
rendering internals, verify against both majors by installing each in turn and
re-running the suite. See `ARCHITECTURE.md` for the two known divergences.

## Releasing

Changesets drives versioning and publishing.

```bash
npm run changeset      # describe the change and pick the bump
```

Merging to `main` opens (or updates) a release PR; merging that PR publishes
with provenance via `.github/workflows/release.yml`. Do not hand-edit
`CHANGELOG.md` or the `version` field - Changesets owns both. Do not publish
manually.

## Skills

`.claude/skills/` and `.codex/skills/` hold the review and authoring skills for
this repo and are kept byte-identical. Each is marked `metadata: internal: true`
in its frontmatter, so `npx skills add` - which users run against this
repository to install the consumer skill in `plugins/fuji-ui/` - leaves it out.
If you edit or add one, mirror it, then run:

```bash
npm run skills:check
```
