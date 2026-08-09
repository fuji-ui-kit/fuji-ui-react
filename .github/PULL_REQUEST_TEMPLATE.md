## What changed

<!-- One or two sentences. What behavior/API/appearance is different after this? -->

## Why

<!-- The problem this solves. Link the issue if there is one. -->

## Public API impact

- [ ] No public API change
- [ ] Additive (new export, new optional prop)
- [ ] **Breaking** (removed/renamed export, changed prop type, changed default) - migration note below

<!-- If breaking, describe the migration in one paragraph. -->

## Checklist

- [ ] `npm run format:check && npm run lint && npm run typecheck && npm test && npm run build` all pass
- [ ] Changeset added (`npm run changeset`) for any user-facing change
- [ ] Barrels updated (`src/index.ts` and the component's `index.ts`) if exports changed
- [ ] `README.md` / `docs/` updated in this PR, not a follow-up
- [ ] `SPEC.md` updated if a locked contract genuinely changed

### Component changes

- [ ] `"use client"` boundary is unchanged, or was added only because the component genuinely needs it (presentational components must stay server-renderable)
- [ ] Ref forwarded, native props spread, `className` merged through `cn`
- [ ] Controlled **and** uncontrolled paths work, via `useControllableState`
- [ ] Class names written out statically (no templated Tailwind strings)
- [ ] Keyboard operation, focus visibility, and ARIA state verified
- [ ] Tests added/updated, including a `jest-axe` assertion where accessibility is in play

### Wider verification (check what applies)

- [ ] Verified in `light` / `dark` / `glass` × `cornered` / `soft` × `regular` / `floating`
- [ ] Verified against React 18 **and** 19
- [ ] Verified in the sibling `fuji-ui-website` using a packed tarball
- [ ] `npm pack --dry-run` file list inspected (packaging or build config changed)

## Notes for reviewers

<!-- Anything non-obvious: a tradeoff, a deliberate omission, something you want a second opinion on. -->
