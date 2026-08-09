---
name: fuji-react-docs-consistency-review
description: Check @fuji-ui/react documentation - README, docs/, SPEC, ARCHITECTURE, CONTRIBUTING, CHANGELOG, and JSDoc - against the actual exports, props, defaults, tokens, build, and packaging. Use for review-only consistency audits unless fixes are explicitly requested.
---

# Fuji React documentation consistency review

## Purpose

`docs/` and `README.md` ship **inside the published tarball**, so a stale
example is a published artifact that consumers copy. Prose is not evidence -
every documented claim must be traced to source.

Default to review-only.

## Procedure

1. Build first, so you are checking against the real surface:

   ```bash
   npm run build
   ```

2. Read `README.md`, `docs/*.md`, `SPEC.md`, `ARCHITECTURE.md`,
   `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, and
   `THIRD_PARTY_NOTICES.md`.
3. For each factual claim, find the source that proves or disproves it. Read
   `dist/index.d.ts` for the authoritative consumer-facing API.

## Checks

### Every code sample must actually run

This is the check that matters most. For each snippet:

- Every imported name exists in `dist/index.d.ts`.
- Every prop used exists with that type.
- The import path is the package root - no subpath imports, since none exist.
- The CSS import path matches an `exports` entry (`@fuji-ui/react/styles.css`,
  `@fuji-ui/react/tokens.css`).
- Framework snippets are valid for the framework (`docs/nextjs.md` App Router
  code must be legal App Router code).

Copy a snippet into a scratch file and typecheck it if there is any doubt.

### API claims

- Documented props, accepted values, and **defaults** match the implementation.
  Defaults drift most often - verify each one against the source, not against
  another doc.
- Documented type names match exported type names.
- Compound components: documented sub-exports exist as named exports.
- Anything documented as public is exported from `src/index.ts`; nothing
  internal is documented as if it were public.

### Appearance and token claims

- `README.md` and `docs/theming.md` axes, values, and defaults match
  `src/types/index.ts` and `src/styles/tokens.css`.
- Every `--fuji-*` token named in docs exists in `tokens.css`. Every class name
  named (`.fuji-glass-surface*`, `.fuji-theme-scope`) exists in `base.css`.
- Storage key (`fuji-appearance`), `data-fuji-*` attribute names, and provider
  prop names match `FujiProvider` and `appearance-storage.ts`.

### Build and packaging claims

- `ARCHITECTURE.md`'s description of the passes matches `tsup.config.ts`.
- The documented `dist/` layout matches a real build. Note there is no
  `dist/index.js` - `module` points at `dist/esm/index.js`.
- Commands in `README.md`/`CONTRIBUTING.md` exist as `scripts` in
  `package.json` and do what the docs say.
- The documented `files` whitelist matches `package.json` and the actual
  tarball.
- Documented peer/runtime dependency versions match `package.json`.

### Repo-guide consistency

`AGENTS.md`, `CLAUDE.md`, `SPEC.md`, `ARCHITECTURE.md`, and `CONTRIBUTING.md`
must not contradict each other. When they do, `SPEC.md` holds the locked
contract and `ARCHITECTURE.md` holds the build reality - the others defer.
Cross-references must point at files that exist.

### Leftover website language

This package was extracted from the `fuji-ui-website` repo. Watch for text and
JSDoc that still assumes a Next.js app: references to `layout.tsx`, routes,
`@/` aliases, "the site", or the website's own provider setup. These are
correct-sounding and easy to miss. `src/lib/appearance-storage.ts` is a known
place where the JSDoc still speaks in website terms - check whether that is
still accurate for a package consumer.

### Consumer-facing tone

`docs/` and `README.md` are for consumers: present tense, package-facing, using
`@fuji-ui/react` in every example. No internal source paths, no implementation
history, no "we recently fixed", no placeholder publication language.
Contributor-facing content belongs in `AGENTS.md`/`CONTRIBUTING.md`, which do
**not** ship.

### Changelog and notices

- `CHANGELOG.md` covers every released version and is Changesets-generated
  (flag hand-edits).
- `THIRD_PARTY_NOTICES.md` lists exactly the current runtime dependencies.
- Version and status claims in `README.md` match `package.json`.

### JSDoc

Doc comments on exported symbols are shipped in `.d.ts` and surface in consumer
editors. Check that they describe current behavior, name real props, and do not
reference removed APIs.

## Output

Default to review-only. For each finding: file and line (or doc section), the
**documented claim**, the **verified implementation**, the impact on a consumer
who trusts the doc, and the minimal correction. Sort by impact - a broken code
sample outranks a stale sentence.

Group findings: broken examples, wrong API claims, stale/leftover references,
internal contradictions, missing documentation. Separate facts from assumptions
and finish with verification performed.
