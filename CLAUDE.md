# Claude Code guidance for fuji-ui-react

Read `AGENTS.md` first - it is the operational guide and the rules there apply
in full. This file only adds Claude-specific notes. Read `SPEC.md` for locked
public contracts and `ARCHITECTURE.md` before touching the build.

## Project

This repository is the source of truth for the `@fujiui/react` npm package: a
themeable, accessible React component system (light/dark theme, solid/glass
material, cornered/soft radius, regular/floating elevation) built on Base UI,
supporting React 18 and 19, Next.js, Vite, and SSR.

The sibling `../fuji-ui-website` repository is the documentation site and a
**consumer** of this package. Never fix a Fuji component by editing the
website - fix it here, rebuild, repack, and update the website's dependency.

## Commands

```bash
npm ci
npm run build
npm test
npm run lint
npm run typecheck
npm run format:check
npm run changeset
npm run skills:check
```

## Before you hand off

Run the same gate CI runs, in this order, and report real output rather than
assuming: `format:check`, `skills:check`, `lint`, `typecheck`, `build`, `test`.
Build before test: the suites asserting on the generated artifacts skip
themselves when `dist/` is absent. For anything
touching packaging, add `npm pack --dry-run` and check the file list.

## Things that are easy to get wrong here

- **`"use client"` placement.** Adding it to a presentational component
  (`Icon`, `Typography`, `Card`, `Timeline`, ...) breaks Server Component
  consumers who pass component references as props. It must also be the literal
  first line of the file for the build to preserve it. See `ARCHITECTURE.md`.
- **The build is three tsup passes, not one.** Unbundled ESM (per-file
  directives), bundled CJS, and a separate declarations-only pass. Do not
  "simplify" it into a single pass - each shape exists to fix a specific,
  documented failure.
- **React 18 vs 19 differences** around refs-on-props and `inert`. See the
  cross-version section in `AGENTS.md`.
- **Templated class names never work.** Tailwind's scanner is static; write out
  full class strings.
- **`theme` and `material` tie on specificity.** `[data-fuji-theme="dark"]`
  and `[data-fuji-material="glass"]` are both `(0,1,0)` and both match a
  dark+glass element (the same tie exists between their `floating`-elevation
  compound blocks), so which one wins is decided purely by source order in
  `tokens.css` - the glass block must stay physically after the theme blocks,
  or a dark+glass element silently resolves dark's colors instead of glass's.
  See the GLASS comment in `tokens.css` and `src/styles/tokens.test.ts`.
- **`docs/` ships inside the published tarball**; `AGENTS.md`, `CLAUDE.md`,
  `SPEC.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`, and `DESIGN.md` do not. Keep
  consumer-facing content in `README.md`/`docs/` and contributor-facing content
  in the root guides.
- **Read `DESIGN.md` before changing anything under `src/styles/` or
  `components/fuji/lib/`.** Those five files (tokens.css, base.css, appearance.ts,
  field-surface.ts, status-surface.ts) restyle all 89 components at once,
  and DESIGN.md records which values are deliberate. Token changes must be
  checked with `node scripts/render-gallery.mjs` across all sixteen appearance
  combinations - a rendered page catches what a unit test cannot (the dark
  theme once painted a light page for a whole release with every test green).

## Boundaries

- Do not commit, push, tag, or publish unless explicitly asked.
- Do not add runtime dependencies, weaken lint/TypeScript rules, or introduce
  blanket suppressions to make a check pass.
- Do not redesign the visual identity or add per-component appearance props.
- Default to review-only when running an audit skill; report findings and let
  the user decide what to fix.

## Skills

`.claude/skills/` holds the review/audit and authoring skills for this repo
(code review, API surface, accessibility, SSR/cross-version, build
verification, release readiness, security, performance, docs consistency,
theming, testing, component authoring). `.codex/skills/` mirrors them
byte-for-byte; `npm run skills:check` fails if the two drift.
