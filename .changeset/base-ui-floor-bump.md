---
"@fujiui/react": minor
---

**`@base-ui/react` floor raised to `^1.7.0`** (from `^1.6.0`). It is a runtime
dependency, so this changes what resolves in every consumer's tree - an app
pinned below 1.7 will see a duplicate copy installed, or a resolution error
under a strict package manager.

1.7 is what the overlay, menu and field primitives are built against here; the
positioner work in `use-untransformed-positioner.ts` depends on its
`Positioner` behaviour, and the parts re-exported from it
(`DialogRoot`, `TabsRoot`, and the rest) inherit their props from that version.
