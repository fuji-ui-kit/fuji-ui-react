# Consumer fixtures

Three throwaway apps that install `@fujiui/react` **from a real packed
tarball**, not from `src/`. They exist to catch the class of bug the unit
tests and Storybook structurally cannot see, because both of those consume the
source tree:

| Fixture                 | What it proves                                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `plain-vite`            | The package works with no Tailwind in the host app at all, and Fuji's compiled CSS survives a host stylesheet that deliberately defines conflicting `.flex`/`.p-4`-style classes (`src/host-conflicts.css`). |
| `tailwind-preflight`    | A host running Tailwind **with** preflight doesn't reset Fuji's controls out from under it, and Fuji doesn't reset the host's.                                                                               |
| `tailwind-custom-theme` | A host with its own `@theme` block and its own `--radius-*`/`--color-*` variables doesn't collide with Fuji's `--fuji-*` tokens or its `fj:`-prefixed utilities.                                             |

Anything that only shows up once the code is built, bundled, and resolved
through `exports` - a missing subpath, a `"use client"` that didn't survive
tsup, a type condition that fails under `moduleResolution: node16` - shows up
here and nowhere else.

## Running one

```bash
npm run build && npm run fixtures:pack
```

That writes `fixtures/fuji-pack.tgz` (gitignored). Then, in the fixture:

```bash
npm install && npm run dev
```

`plain-vite` serves on 5301, `tailwind-preflight` on 5302,
`tailwind-custom-theme` on 5303.

## Why the tarball has no version in its name

`npm pack` produces `fujiui-react-<version>.tgz`. Naming that directly in each
fixture's `package.json` bakes the version into three committed lockfiles, and
they then rot the moment the version moves - which is exactly what happened:
the fixtures spent several releases pinned to a `0.1.0-alpha.0` tarball that no
longer existed anywhere, so none of them could install. `scripts/pack-fixtures.mjs`
renames every pack to the same stable `fuji-pack.tgz`, so the lockfiles stay
valid across releases and re-packing is the only step needed to test a change.

`file:../..` would have avoided the tarball entirely, but it resolves to the
source tree and would test nothing about packaging - which is the entire point
of these three apps.
