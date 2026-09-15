---
"@fujiui/react": patch
---

Fixed: the package did not compile against React 18, despite advertising it.

`peerDependencies` has always said `^18.0.0 || ^19.0.0`, and the source has
real branches for the differences between the two - but every CI run and every
local install resolved React 19, so the 18 half of that claim had never once
been executed. It was broken:

- `React.useRef<HTMLImageElement>(null)` types `current` as **read-only** under
  React 18 (React 19 made it writable), so `Image`'s ref callback failed to
  compile. Declaring the ref as `<HTMLImageElement | null>` selects the mutable
  overload, which exists in both versions.
- Assigning through a forwarded `ref.current` had the same problem, and is now
  cast to a bare structural type that depends on neither version's ref
  typings.

CI gains a `react18` job that installs React 18 with `--no-save` and reruns
typecheck and the full suite, so this cannot regress silently again. It
verifies the downgrade actually took effect before running anything - the
obvious version of that job passes against React 19 twice and reports green.
