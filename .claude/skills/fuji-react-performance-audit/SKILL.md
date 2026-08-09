---
name: fuji-react-performance-audit
description: Audit @fuji-ui/react for render cost, effect/listener/timer cleanup, unnecessary client boundaries, tree-shaking and bundle size, icon imports, CSS weight, and expensive visual effects. Use for review-only audits unless fixes are explicitly requested.
---

# Fuji React performance audit

## Purpose

Performance in a component library is mostly about what consumers **cannot opt
out of**: bytes that ship whether or not a component is used, client boundaries
that force hydration, and leaks that accumulate in long-lived apps. Optimize
those before micro-optimizing render paths.

Default to review-only. Recommend the smallest useful change; do not add
memoization without a demonstrated reason.

## Procedure

1. Read `AGENTS.md`, `ARCHITECTURE.md`, `package.json`, and the affected source.
   Inspect status and diff; preserve unrelated changes.
2. Build and measure before claiming anything:

   ```bash
   npm run build
   du -sh dist/esm dist/index.cjs dist/styles.css
   ```

3. Use real measurements as evidence. Do not install bundle-analysis tooling.

## Checks

### Tree-shaking and what ships regardless

This is the highest-leverage area. A consumer importing only `Button` should not
pay for `Chart` or `DataTable`.

- `sideEffects: ["**/*.css"]` is present, so JS is shakeable and CSS is never
  dropped. Its removal would be a major regression.
- ESM output stays **unbundled per-file** - a bundled ESM entry defeats
  per-component elimination for many bundlers.
- No module-level side effects in component files: no code that runs on import,
  no top-level `document`/`window` touch, no eager registry construction. These
  defeat tree-shaking silently.
- Barrels re-export, they do not wrap. A barrel that imports and re-wraps
  everything pulls the whole library in.
- Verify empirically where practical: build a trivial consumer app importing one
  component and check the bundle for symbols from unrelated components.

### Icon imports

```bash
grep -rn "from ['\"]lucide-react['\"]" src --include='*.tsx' | head -30
grep -rn "import \* as .* from ['\"]lucide-react" src
```

Individual named imports only. A namespace import pulls in the entire icon set -
a very large, very avoidable regression.

### Client boundaries

Every `"use client"` forces a component and its imports into the client bundle
and makes consumers hydrate it.

- Check that each directive is genuinely needed (state, effects, event handlers,
  browser APIs, or a client-only Base UI primitive).
- A presentational component with a directive is both a performance cost and a
  breaking change - see `fuji-react-ssr-compat-review`.
- Do **not** recommend removing a boundary that Base UI or genuine interactivity
  requires. Correctness first.

### Effects, timers, listeners, observers

```bash
grep -rn "addEventListener\|setInterval\|setTimeout\|IntersectionObserver\|ResizeObserver\|MutationObserver\|requestAnimationFrame" src --include='*.tsx' --include='*.ts' | grep -v test
```

Every one needs a cleanup in the effect's return. Known hot spots: `Carousel`
(autoplay timer, pointer/keyboard listeners), `Statistic` (an
IntersectionObserver plus a rAF count-up loop), `CodeBlock` (copy-feedback
timer), and anything using `useMediaQuery`. A leaked interval in a library is a
leak in every app that renders the component.

Also check: effect dependency arrays that re-subscribe every render, and effects
that write state unconditionally (render loops).

### Provider stability

`FujiProvider`'s context value must be memoized, and its setters stable across
renders. An unstable value re-renders every consumer of `useFujiConfig` on every
provider render - and every component reads it.

### Render cost

- Lists (`DataTable`, `Table`, `Tree`, `MultiSelect`) - is per-row work
  proportionate? Is anything O(n²) over items?
- Expensive work in render that belongs in `useMemo`, judged by real cost, not
  by looking expensive.
- Unstable inline object/array/function props passed into memoized children.
- Unnecessary state where a ref or derived value would do - particularly state
  updated on every pointer move or scroll event.

### CSS weight

```bash
du -h dist/styles.css
```

- Every consumer downloads this stylesheet whole. Growth should be explainable.
- `@source` in `scripts/css-entry.css` must stay scoped to Fuji's own source -
  widening it generates utilities nobody uses.
- No duplicated rule blocks between `base.css` and component classes.

### Expensive visual effects

- `backdrop-filter` (glass) is genuinely expensive, especially nested. Flag
  nested glass surfaces and glass on large scrolling containers.
- `transition: all` forces the browser to watch every property - name properties
  explicitly.
- Animating anything other than `transform`/`opacity` triggers layout or paint.
- Large or unbounded box-shadows on scrolling content.
- `will-change` left permanently on an element holds a compositor layer.
- Continuous animation that does not stop when off-screen or under
  `prefers-reduced-motion: reduce`.

### Layout stability

Components that load or measure content (`Image`, `AspectRatio`, `Skeleton`,
`Carousel`) should reserve space rather than shift it. `Image` deliberately uses
a plain `<img>` for framework independence - audit sizing and loading behavior,
not the choice of element.

## Output

Default to review-only. Separate three groups: **measured** issues (with the
number), **strongly evidenced** issues (clear from source, cost not measured),
and **possible opportunities**. Do not mix them.

For each: severity and impact, file and line, evidence, which consumers it
affects (everyone vs. only users of that component), expected benefit, and how
to verify the improvement. Finish with the commands run and the measurements
taken.
