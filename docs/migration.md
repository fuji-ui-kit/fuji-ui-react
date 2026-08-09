# Migrating from a local/vendored copy of Fuji

If your app currently has its own local copy of the Fuji component source
(e.g. a `src/components/fuji` folder copied or symlinked from an earlier
stage of this project), here's the path to replacing it with `@fuji-ui/react`.

## 1. Install the package

```bash
npm install @fuji-ui/react
```

While validating a migration before publishing, install a local tarball
instead:

```bash
npm run build   # in the fuji-ui-react repo
npm pack        # produces fuji-ui-react-<version>.tgz
npm install /path/to/fuji-ui-react/fuji-ui-react-<version>.tgz   # in your app
```

## 2. Consolidate imports

Local copies typically have one import per component
(`@/components/fuji/button`, `@/components/fuji/card`, ...). The package has a
single entry point - consolidate each file's Fuji imports into one:

```diff
-import { Button } from "@/components/fuji/button";
-import { Card } from "@/components/fuji/card";
-import { FujiProvider } from "@/providers/FujiProvider";
+import { Button, Card, FujiProvider } from "@fuji-ui/react";
```

**If you script this as a codemod**, scope the matcher tightly to real import
statements only (e.g. anchored at the start of a line). A naive
whole-file-text regex will also match import-shaped _strings_ - documentation
pages that render `code={`...`)` samples showing users how to import the
package are exactly the kind of file this catches by mistake, silently
corrupting the sample text and leaking phantom names into the real import.
Diff every changed file (or at minimum grep the diff for suspicious removed
lines inside string/template-literal content) before trusting the result -
`no-unused-vars` lint warnings on an import that used to have none are a
strong signal something went wrong.

## 3. Point your global CSS at the package stylesheet

Replace a local `tokens.css`/hand-written base-rules import with:

```ts
import "@fuji-ui/react/styles.css";
```

If your app also uses `bg-fuji-*`/`text-fuji-*`/etc. Tailwind utility classes
directly in app-only markup (not just via Fuji component props), keep a local
`@theme inline` block mapping `--color-fuji-*` (etc.) to the `--fuji-*`
variables in your own global CSS, so your app's own Tailwind pass can generate
any such utility your own markup uses that the package's own components never
needed to compile for themselves. Import `@fuji-ui/react/tokens.css` (or rely
on `styles.css`, which already includes them) to supply those `--fuji-*`
source variables.

## 4. Remove the local component source

Once your app builds, lints, and typechecks cleanly against the package
imports, delete the local component folder, provider, and any
now-unused local hooks/types/lib files it depended on (double-check nothing
else in your app still imports them directly - app-shell-specific code like a
pre-paint appearance bootstrap script, or a generic `cn()` helper also used by
your own non-Fuji components, are the kind of thing that's worth keeping
rather than deleting).

## 5. Verify

- `tsc --noEmit` and your linter both clean.
- Production build succeeds.
- Every theme (`light`/`dark`/`glass`) × radius (`cornered`/`soft`) × elevation
  (`regular`/`floating`) combination still renders correctly, including
  portaled overlays.
- No new console warnings, especially around Server/Client Component
  boundaries if you're on Next.js App Router (see [nextjs.md](nextjs.md) -
  in particular, a component reference passed as a prop into a client
  boundary from a Server Component is a real, easy-to-hit break if any of your
  own presentational wrapper components didn't preserve the same
  server/client split the package does internally).
