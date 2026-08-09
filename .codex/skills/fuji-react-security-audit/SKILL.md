---
name: fuji-react-security-audit
description: Audit @fuji-ui/react for evidenced security issues - prop-driven injection, unsafe URL/DOM handling, storage misuse, supply-chain and dependency risk, published artifact contents, and license compliance. Use for review-only audits unless fixes are explicitly requested.
---

# Fuji React security audit

## Purpose

Find realistic security issues in a **published client-side UI package** without
inventing threats. The relevant threat model is narrow and specific: this code
has no server, no network calls, no auth, and no data handling. What it does
have is code running inside every consuming app's page, and a tarball published
to a public registry.

Read `SECURITY.md` for the stated threat model and the guarantees this package
makes. Default to review-only.

## Procedure

1. Read `SECURITY.md`, `AGENTS.md`, `SPEC.md` §7 and §9, and `package.json`.
2. Check `git status --short --branch` and the diff first; preserve user changes.
3. Run the targeted searches below and **inspect every hit** rather than
   reporting the grep.
4. Do not claim a vulnerability without source evidence and a concrete attack
   scenario naming who controls the input.

## Checks

### Injection through props

```bash
grep -rn "dangerouslySetInnerHTML\|innerHTML\|outerHTML\|insertAdjacentHTML\|document\.write" src --include='*.ts' --include='*.tsx'
```

The one known use is `Carousel`, which renders a scoped `<style>` built from its
own numeric layout props and a `useId`-generated selector. Audit it for:

- Any interpolated value that is not numeric or generated internally.
- Any widening of those prop types to accept strings - that turns a type-safe
  template into a CSS-injection vector for JavaScript consumers.

Any **new** `dangerouslySetInnerHTML` is a finding by default; it needs an
explicit justification and input that provably cannot come from a consumer prop.

### URL and resource handling

```bash
grep -rn "href=\|src=\|window\.open\|location\." src --include='*.tsx' | grep -v test
```

- A prop-supplied URL reaching an anchor or image without scheme validation
  allows `javascript:` and `data:` URLs. Check `Link` and `Image` in particular.
- External links opened in a new tab need `rel="noopener noreferrer"`.
- `Image`'s use of a plain `<img>` is intentional (framework independence) - do
  not report `<img>` itself as a vulnerability. Audit its `src`, error, and
  fullscreen handling instead.

### Code execution

```bash
grep -rn "eval(\|new Function\|setTimeout(['\"]\|setInterval(['\"]" src --include='*.ts' --include='*.tsx'
```

Any hit is a finding. `SECURITY.md` states the package never executes code from
a string.

### Storage

- `FujiProvider`'s `persist` is the only storage user, keyed `fuji-appearance`.
- It must store only theme/radius/elevation, **validate what it reads back**
  against the allowed value lists, and never throw on malformed, blocked, or
  full storage (private mode, disabled cookies, quota).
- Any new storage key, or any code path that writes unvalidated data, is a
  finding.
- If the pre-paint bootstrap script builder is touched: it emits an **inline
  script string**. Every value interpolated into it must be `JSON.stringify`-ed,
  and it must be defensive enough that a storage error cannot throw during
  hydration setup.

### Network and telemetry

```bash
grep -rn "fetch(\|XMLHttpRequest\|sendBeacon\|WebSocket\|EventSource\|document\.cookie" src --include='*.ts' --include='*.tsx'
```

Expected: none. Any hit contradicts a stated guarantee in `SECURITY.md` and is a
High finding regardless of intent.

### Supply chain

- Runtime dependencies ship in every consumer bundle. The allowed set is
  `@base-ui/react`, `class-variance-authority`, `clsx`, `lucide-react`,
  `tailwind-merge`. A new one is a security decision - flag it for explicit
  approval.
- `npm audit --omit=dev` for production findings. Report dev-only findings
  separately and clearly labelled as non-blocking for consumers - a
  dev-toolchain advisory does not reach anyone installing this package.
- Check `package-lock.json` diffs for unexpected transitive additions,
  registry changes, or version ranges that widened.
- No `postinstall`, `preinstall`, or other install-time script in
  `package.json` - install scripts in a UI package are a supply-chain red flag.

### Published artifact

The tarball is public and permanent.

```bash
npm pack --dry-run
npm pack && tar -tzf *.tgz | sort
```

- No `.env*`, no credentials, no tokens, no internal URLs, no `.npmrc`.
- No source or test files.
- Grep the built output for anything that looks like a secret or an absolute
  local path:

  ```bash
  grep -rn "/Users/\|/home/\|api[_-]key\|secret\|token" dist | head
  ```

  Sourcemaps are a common leak path - check whether they embed absolute paths or
  full source content, and whether that is intended.

### Licensing

`THIRD_PARTY_NOTICES.md` must list every runtime dependency with its license and
stay current with `package.json`. A dependency added without a notices update is
a compliance gap, not a nitpick.

### CSS safety

`styles.css` must not include Tailwind's preflight. Silently resetting a
consuming app's global styles is a correctness and trust issue, not just a
styling one.

## Output

Default to review-only. Sort findings Critical → High → Medium → Low. Each
finding: file and line, evidence, a concrete attack scenario stating **who
controls the input**, impact, and the smallest practical remediation.

Separate four groups explicitly: confirmed vulnerabilities, likely risks needing
confirmation, defense-in-depth suggestions, and things checked that were fine
(so the reader knows the coverage). State assumptions and verification
performed. Do not edit by default.
