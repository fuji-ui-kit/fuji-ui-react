---
name: fuji-react-release-readiness
description: Pre-publish gate for @fujiui/react - changesets, semver correctness, changelog, version metadata, CI/release workflow, provenance, tarball contents, docs accuracy, and license notices. Use before cutting a release or when asked whether the package is ready to publish.
# Contributor skill for working on this repository. Hidden from `npx skills add`,
# which would otherwise install it into apps that only use @fujiui/react.
metadata:
  internal: true
---

# Fuji React release readiness

## Purpose

A published npm version is permanent - it can be deprecated but not corrected in
place, and consumers pin it. This is the gate that runs before that becomes
irreversible.

**Never publish as part of running this skill.** Report readiness; the human
decides. Do not run `npm publish`, `changeset publish`, `git tag`, or push
unless the user explicitly instructs it in that turn.

## Procedure

1. Read `AGENTS.md`, `SPEC.md` §10, `CONTRIBUTING.md`, `CHANGELOG.md`, and
   `.github/workflows/release.yml`.
2. `git status --short --branch` - the working tree should be clean, or every
   uncommitted change accounted for.
3. Run the full CI gate locally and report real output:

   ```bash
   npm run format:check && npm run lint && npm run typecheck && npm test && npm run build
   ```

4. Work through the checks below.

## Checks

### Changesets

- `ls .changeset/*.md` (excluding `README.md`) - is there a changeset for every
  user-facing change since the last release?
- Compare against the actual diff since the last version tag. A user-facing
  change with no changeset means it ships with no changelog entry and possibly
  no version bump.
- Each changeset's bump type matches reality. Use the API surface rules:
  removed/renamed export, new required prop, narrowed prop type, changed default,
  changed ref target, or a presentational component gaining `"use client"` are
  all **breaking**. While pre-1.0 these may land as a minor bump, but the
  changeset must say so explicitly.
- Each changeset body is written for a consumer, not a contributor: what changed
  in the API, and what a consumer must do about it.

### Version and metadata

- `package.json` version, `name`, `license`, `repository`, `homepage`, `bugs`,
  and `keywords` are all correct and non-placeholder. Check `author` - an empty
  string is a gap worth flagging.
- `engines.node` is honest about what CI actually checks: 18.18.x installs,
  lints, typechecks, builds, packs and smoke-tests the MCP server; the test
  suite runs on 20.x only, because Vitest 4 needs Node 20.
- Peer dependency ranges cover the React versions actually supported and tested.
- The pre-1.0 status note in `README.md` still matches the version being cut.

### Changelog

- `CHANGELOG.md` is Changesets-owned. Flag hand-edits.
- The entry for the version being released describes the change accurately.
- Breaking changes are called out with a migration path, not buried in a list.

### Build artifacts and tarball

Run the `fuji-react-build-verification` checks, or at minimum:

```bash
npm run build
npm pack --dry-run
npm pack && tar -tzf *.tgz | sort
```

- Tarball contains `dist/`, `docs/`, `README.md`, `LICENSE`, `package.json`,
  `CHANGELOG.md`, `THIRD_PARTY_NOTICES.md` and nothing else.
- No source, tests, config, `.env*`, `.github/`, `.claude/`, `.codex/`, or a
  nested `.tgz`.
- Tarball size has no unexplained jump from the previous release.
- `"use client"` directives survived into `dist/esm/`, and presentational
  components did **not** gain one.

### Documentation accuracy

- `README.md` install/usage examples run as written against this version.
- `docs/*.md` match the current API - `docs/` ships inside the tarball, so a
  stale doc is a published artifact.
- No internal source paths, no implementation history, no "coming soon" or
  placeholder publication language in consumer-facing docs.

### Licensing and supply chain

- `THIRD_PARTY_NOTICES.md` lists every runtime dependency and is current with
  `package.json`. A dependency added without a notice update is a compliance gap.
- `npm audit --omit=dev` - report production-dependency findings; note
  dev-only findings separately as non-blocking.
- No new runtime dependency slipped in without justification.

### CI and release workflow

- `.github/workflows/ci.yml` passes on the release commit.
- `.github/workflows/release.yml` still has `id-token: write` and
  `NPM_CONFIG_PROVENANCE: "true"` - provenance silently stops being attached if
  either is removed.
- `NPM_TOKEN` and `GITHUB_TOKEN` are wired as secrets, and the workflow runs the
  full gate before `changeset publish`.
- `access: "public"` in `.changeset/config.json` - a scoped package defaults to
  restricted without it.
- `prepublishOnly` runs the build, so a publish can never ship a stale `dist/`.

### Consumer verification

Run `npm run fixtures:pack` and build `fixtures/nextjs` and `fixtures/vite`
against the tarball; then install it into the sibling `fuji-ui-website`, run
its production build, and check the app renders. This is the last chance to catch a
Server/Client boundary or missing-CSS regression before it is permanent.

## Output

Lead with a single verdict: **ready to publish**, **ready with caveats**, or
**not ready**, and the recommended version and bump type.

Then: blocking issues (each with what breaks and what to do), non-blocking
issues, the full check table with real command output, what you did **not**
verify, and an explicit statement that nothing was published, tagged, or pushed.
