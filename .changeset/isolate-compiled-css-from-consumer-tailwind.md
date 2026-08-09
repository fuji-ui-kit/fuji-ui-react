---
"@fuji-ui/react": minor
---

Made the compiled `styles.css` fully isolated from a consumer's own Tailwind
build - no installation change (`import "@fuji-ui/react/styles.css"` is still
the only step), but the compiled output itself is now defensive against
collisions that were previously possible.

**The problem.** `dist/styles.css` shipped Tailwind's own generic theme
variables (`--spacing`, `--radius-sm`, `--text-xs`, `--font-weight-*`, ...) at
`:root`, and every utility class Fuji's components use (`flex`, `p-4`,
`text-sm`, `rounded-lg`, and Fuji's own `bg-fuji-*`/`rounded-fuji-*` color and
radius utilities) under Tailwind's bare `theme`/`utilities` cascade layers. A
consumer that also uses Tailwind would generate the exact same class names
and the exact same variable names in their own build. Two concrete failure
modes followed: (1) cascade layers with the **same name** merge across
stylesheets, so Fuji's `utilities` layer and the consumer's own `utilities`
layer became one layer resolved by plain source order - not real isolation;
(2) a consumer who customized their own Tailwind spacing/color scale would
have that scale's `--spacing`/`--color-*` values silently apply to Fuji's own
internal utilities too (or vice versa), since both stylesheets read/wrote the
same bare variable names.

**The fix**, in `scripts/css-entry.css`:

- `prefix(fj)` on both Tailwind imports (`tailwindcss/theme.css`,
  `tailwindcss/utilities.css`). Every Tailwind-generated class in Fuji's
  output is now `fj:`-prefixed (`fj:flex`, `fj:bg-fuji-earth`,
  `fj:hover:bg-fuji-surface-strong`), and Tailwind's own generic theme
  variables are renamed `--fj-*` (`--spacing` -> `--fj-spacing`, etc.) -
  fully independent of a consumer's identically-named `--spacing`/`--color-*`
  variables in either direction. `fj` was chosen specifically because it does
  **not** collide with Fuji's own pre-existing `--fuji-*` token vocabulary;
  `tokens.css`/`fuji-theme.css` are untouched by the prefix; only Tailwind's
  own generated names are renamed. Every component's className strings were
  updated to the `fj:`-prefixed form (a mechanical rename across ~90
  components, verified with an AST-based extraction script rather than a
  blind find/replace, to avoid touching non-class strings like comparison
  operands or import specifiers). Fuji's own hand-written classes
  (`fuji-glass-surface`, `fuji-theme-scope`, `fuji-scrollbar`, and the rest of
  the `.fuji-*` recipe classes in `base.css`) are untouched - they were never
  Tailwind-generated and were already uniquely namespaced.
- An explicit, uniquely-named cascade layer order declared up front:
  `@layer fuji.theme, fuji.base, fuji.utilities, fuji.components;`, with
  `base.css`'s own `@layer base {}`/`@layer components {}` blocks renamed to
  match. Namespacing the layer names (not just adding layer ordering) is what
  actually prevents the same-name-merges-across-stylesheets problem above.
- Two hand-written selectors in `tokens.css` that targeted Tailwind-generated
  class names directly (`.animate-spin`/`.animate-pulse`/`.animate-bounce`
  for the reduced-motion override, and `.bg-fuji-background` for the glass
  atmosphere passthrough rule) were updated to their `fj:`-prefixed selector
  form so they still match what's actually in the DOM.

**Verified, not assumed:** `tailwind-merge` (used by every component's `cn()`)
needed **no configuration change** - it parses a leading `prefix:` generically
as a variant and only inspects the final utility token for conflict-group
matching, so `fj:p-2 fj:p-4` still collapses to `fj:p-4` exactly as `p-2 p-4`
did before. Verified directly against the installed `tailwind-merge` version
rather than assumed. Three consumer fixtures under `fixtures/` (plain
Vite/no Tailwind, Tailwind with preflight, Tailwind with a 3x-customized
`--spacing` and a custom brand color) were built against a packed tarball and
checked in a real browser across light/dark/glass: Button, Input, Card, a
portaled Dialog, and a deliberately-conflicting host stylesheet all render
correctly with zero interference in both directions - including the
custom-spacing fixture, where Fuji's own Button/Input padding stayed at its
normal tuned size while the host's own identically-named `p-4` utility
correctly rendered 3x larger, proving the two scales are fully independent.
These fixtures aren't published (not in the `files` allowlist) but are kept
in the repo for future regression checks.

**Genuine remaining limitation:** Tailwind's own internal composable-
transform custom properties (`--tw-translate-x`/`-y`/`-z`, used by the
`translate`/`scale`/`rotate` utilities) are not renamed by `prefix()` - they
remain Tailwind's fixed internal names regardless of prefix, and Tailwind
itself sets their initial value via a universal `*, ::before, ::after,
::backdrop { --tw-translate-x: 0; ... }` rule. This is vendored Tailwind
output (not something this package authors), is scoped to three
narrowly-named custom properties with no visible effect on any real CSS
property by itself, and is inherent to using any transform utility with
Tailwind v4 at all - not a gap specific to this change.
