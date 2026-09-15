---
name: fuji-react-ssr-compat-review
description: Audit @fujiui/react for SSR/hydration safety, React 18 vs 19 compatibility, and Server/Client Component boundary correctness. Use when changing refs, effects, DOM attributes, the provider, or any component's "use client" directive.
# Contributor skill for working on this repository. Hidden from `npx skills add`,
# which would otherwise install it into apps that only use @fujiui/react.
metadata:
  internal: true
---

# Fuji React SSR and cross-version compatibility review

## Purpose

This package ships one build that must work under React 18 and 19, server-render
without touching browser APIs, and preserve per-component Server/Client
boundaries for Next.js App Router consumers. All three fail _in consumer apps_
rather than here, which is why they need a deliberate audit rather than a green
local build.

Default to review-only.

## Procedure

1. Read `AGENTS.md`, `SPEC.md` §5 and §6, `ARCHITECTURE.md`, and `docs/ssr.md`.
2. Read `src/ssr.test.tsx` - it runs under `// @vitest-environment node` with
   `renderToString`, so a stray browser-API access fails loudly instead of
   passing silently under jsdom.
3. Inspect the diff for anything touching refs, effects, DOM attributes, the
   provider, or a `"use client"` directive.
4. Verify empirically where the answer is not obvious from source. Reasoning
   about React version differences is unreliable; running both is not.

## Checks

### SSR safety

- No `window`, `document`, `localStorage`, `sessionStorage`, `matchMedia`,
  `navigator`, `IntersectionObserver`, or `ResizeObserver` access during render -
  only inside `useEffect`/`useLayoutEffect`, or behind a
  `typeof window === "undefined"` guard.

  ```bash
  grep -rn "window\.\|document\.\|localStorage\|matchMedia\|navigator\." src --include='*.tsx' --include='*.ts' | grep -v test
  ```

  Inspect each hit: is it inside an effect, a callback, or a guard - or in the
  render path?

- `useLayoutEffect` is guarded to degrade to `useEffect` on the server, or
  React's "useLayoutEffect does nothing on the server" warning appears in every
  consumer's server logs.
- No `Math.random()`, `Date.now()`, or `crypto.randomUUID()` in render - use
  `useId` for generated ids, or the server and client output diverge.
- `FujiProvider` renders its `default*` values identically on server and client
  on first paint. `persist` reconciles **after** mount (a state update, not a
  hydration mismatch). Anything that reads storage during render is a defect.
- Extend `src/ssr.test.tsx` coverage when a component gains browser-API usage.
- A `requestAnimationFrame` or `IntersectionObserver` that gates **first
  paint** (an entrance, a draw-in) is a defect even when SSR-safe: throttled
  or background tabs never run it. Entrances are CSS keyframes with a `from`
  state; `useEntered`-style hooks were removed for this reason.

### React 18 vs 19

Two divergences have already caused real bugs here:

- **Refs.** React 19 delivers a ref through `props.ref`; React 18 does not (it
  lives on the element object). Code inspecting a child's ref must handle both.
  `Button`'s `asChild` is the reference implementation. Reading only
  `child.props.ref` silently gets `undefined` on 18.
- **DOM attributes the majors disagree about.** `inert` is the known case: React
  19 treats it as a strict boolean prop, React 18 does not recognize it and
  warns on a boolean. Neither a boolean nor an empty-string JSX prop works on
  both. Set it imperatively in a ref callback instead - see `Carousel`.

Also check: `MutableRefObject` vs the readonly `RefObject` typing difference,
and any use of a React 19-only API (`use`, the new `ref` cleanup return,
`useFormStatus`) which would break 18 outright.

**Verify rather than assert.** The only real proof is installing each major in
turn and running the full suite:

```bash
# ONE install command - a second `npm install` silently re-resolves React to 19
npm install --no-save --legacy-peer-deps react@^18.3 react-dom@^18.3 @types/react@^18 @types/react-dom@^18 @testing-library/react@^16 @testing-library/dom@^10
node -e "if(!require('react/package.json').version.startsWith('18')) process.exit(1)"
npm run typecheck && npm test
# then restore
npm ci
```

CI runs exactly this as the `react18` job in `.github/workflows/ci.yml`; keep
the two in step. `useRef<T>(null)` types `current` as read-only under 18's
types - write `useRef<T | null>(null)` when the ref is assigned. Report the
actual result. A change touching refs or DOM attributes with no
cross-version evidence is unverified, not passing.

### Server/Client boundary

- `"use client"` must be the **literal first line** of its file. A leading
  comment or blank line means the build's per-file preservation step misses it
  and the directive is dropped from `dist/` - the component then executes as a
  Server Component in consumer apps.
- A presentational component must **not** gain `"use client"`. Doing so is a
  breaking change: Server Components can no longer pass it as a component
  reference (`<Icon icon={SearchX} />` → "Functions cannot be passed directly to
  Client Components"). Check every added directive against whether the component
  genuinely gained state, effects, event handlers, browser APIs, or a
  client-only Base UI primitive.
- Compound components keep named sub-exports alongside dot-access; a Server
  Component cannot read a static property off a client-module binding.
- Verify against the **built output**, not just source:

  ```bash
  npm run build
  head -1 dist/esm/components/fuji/button/Button.js   # expect "use client";
  head -1 dist/esm/components/fuji/icon/Icon.js       # expect NOT "use client";
  ```

### End-to-end verification

The strongest evidence is a real consumer. Build, pack, install into the sibling
`fuji-ui-website`, and run its production build - it exercises App Router
Server/Client boundaries, SSR, and hydration together. A boundary regression
usually surfaces there as a build-time error naming the offending component.

## Output

Default to review-only. Report findings sorted Critical → High → Medium → Low.
For each: file and line, which environment it breaks (React 18, React 19, SSR,
RSC, or several), the symptom a consumer would see, evidence (real command
output, not inference), and the minimal fix.

State explicitly which of these you actually ran: the node-environment SSR
tests, the suite under React 18, the suite under React 19, the built-output
directive check, and the website integration build. Anything you did not run is
an open question, not a pass.
