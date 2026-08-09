# Security policy

## Supported versions

`@fuji-ui/react` is pre-1.0. Security fixes land on the latest published
`0.x` release only. There is no backport window for older `0.x` versions yet;
that changes at 1.0.

## Reporting a vulnerability

Report privately - do not open a public issue for an unfixed vulnerability.

Use GitHub's private vulnerability reporting on the repository
(Security → Report a vulnerability), or contact the maintainers directly if that
is unavailable.

Please include: the affected version, a description of the issue, the impact you
believe it has, and a minimal reproduction if you have one. You will get an
acknowledgement, and a fix or an explanation of why it is not considered a
vulnerability.

## Threat model for a UI package

This package is client-side React and CSS. It has no server, no network calls,
no telemetry, and no authentication or authorization logic. What is realistically
in scope:

- **Injection through component props.** Any path where a prop value reaches
  `dangerouslySetInnerHTML`, `innerHTML`, `document.write`, or an `href`/`src`
  without scheme validation. The one known use is `Carousel`, which renders a
  scoped `<style>` element built from its own numeric layout props
  (`slidesPerView`, `transitionDuration`) and a generated `useId` selector. It
  is type-safe for TypeScript consumers; treat any change that widens those
  props to accept strings, or that interpolates untyped values into that
  template, as a CSS-injection regression.
- **URL handling.** A `javascript:` or `data:` URL reaching an anchor or image
  through a documented prop.
- **Storage.** `FujiProvider`'s `persist` writes to `localStorage` under the key
  `fuji-appearance`. It must store only theme/radius/elevation, must validate
  what it reads back, and must never throw on malformed or blocked storage.
- **Supply chain.** The runtime dependency set (`@base-ui/react`,
  `class-variance-authority`, `clsx`, `lucide-react`, `tailwind-merge`) ships in
  every consumer's bundle. Adding one is a security decision, not just a
  convenience decision.
- **Published artifact contents.** The tarball must contain no source, no tests,
  no environment files, and no credentials. The `files` whitelist in
  `package.json` plus `npm pack --dry-run` are the controls for this.
- **CSS leakage.** `styles.css` deliberately omits Tailwind's preflight so it
  cannot silently alter a consuming app's global styles.

Explicitly out of scope: vulnerabilities that require an application to pass
already-attacker-controlled markup into a prop documented as accepting trusted
content, and issues in a consuming application's own code, framework, or
server configuration.

## What this package will never do

- Make network requests.
- Collect or transmit telemetry or analytics.
- Read or write cookies.
- Execute code from a string (`eval`, `new Function`).
- Read or write storage keys other than `fuji-appearance`, and only when
  `persist` is enabled.

A change that would violate any of these is a rejected change, not a review
comment.
