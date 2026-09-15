---
name: fuji-react-test-review
description: Review the @fujiui/react Vitest suite for coverage of behavior, keyboard and focus paths, controlled/uncontrolled state, accessibility assertions, SSR, and test quality - and identify meaningful gaps. Use when reviewing new tests or assessing whether a change is adequately covered.
# Contributor skill for working on this repository. Hidden from `npx skills add`,
# which would otherwise install it into apps that only use @fujiui/react.
metadata:
  internal: true
---

# Fuji React test review

## Purpose

Assess whether the test suite actually protects consumers, and whether new tests
test behavior rather than implementation. Coverage percentage is not the goal -
a component with 100% line coverage and no keyboard test is undertested.

Default to review-only.

## Procedure

1. Read `CONTRIBUTING.md` (the testing section), `vitest.config.ts`, and
   `vitest.setup.ts`.
2. Run the suite and get real numbers:

   ```bash
   npm test
   npm test -- --coverage
   ```

3. Read the tests for the components the change touches, plus an existing
   well-covered component as the reference bar.

## What must be covered

For any component with behavior, the suite should exercise:

- **Both state modes.** Controlled (`value` + `onChange`) _and_ uncontrolled
  (`defaultValue`). A component tested in only one mode has an untested half -
  this is the most common real gap.
- **Keyboard operation.** Every documented key. For composite widgets (`Tree`,
  `Calendar` grid, `ButtonGroup`, `Rating`): arrow keys move focus _and_ the
  roving `tabindex`, Home/End, Enter/Space, and the container itself is not in
  the tab order.
- **Focus management.** For overlays: focus moves in on open, is restored to the
  trigger on close, Escape closes.
- **Accessibility assertions.** A `jest-axe` check where accessibility is in
  play - but note that axe passing is a floor, not proof. It cannot detect a
  wrong keyboard model or missing focus restoration.
- **Disabled / loading / invalid / readOnly** states: both the visual signal and
  the ARIA attribute, and that interaction is actually blocked.
- **Ref forwarding**, `className` merging, and native prop pass-through - the
  API conventions in `SPEC.md` §4 that consumers depend on.
- **Edge cases** that caused past bugs: `Button`'s `asChild` ref merging,
  `Carousel`'s loop indicator navigation, `Statistic`'s re-animation from the
  current value, file re-selection in `FileUpload`/`Dropzone`.
- **SSR**, via `src/ssr.test.tsx` - `// @vitest-environment node` with
  `renderToString`, so a stray browser-API access fails loudly instead of
  passing silently under jsdom. New components touching browser APIs belong here.

## Test quality

- **Query by role and accessible name.** A test reaching for a test id on an
  interactive element usually means the component lacks an accessible name -
  that is a component finding, not a test finding.
- **`user-event` over `fireEvent`** for anything a user does. `fireEvent` is
  correct only for events jsdom cannot produce naturally, e.g. `transitionEnd` -
  jsdom never fires real CSS transitions, so transition-driven state must be
  simulated.
- **Assert behavior, not implementation.** A test asserting an internal class
  name or state shape breaks on refactors without catching real regressions.
  Asserting a _documented_ class contract is fine.
- **No conditional assertions.** `if (x) expect(...)` passes vacuously.
- **Fake timers** need `toFake` to include `requestAnimationFrame` and
  `performance` for animation code, and React state updates driven by them must
  be wrapped in `act()`. A missing `act()` produces a warning that is easy to
  ignore and a test that proves less than it appears to.
- **No `waitFor` with an empty or always-true callback**, and no bare
  `await new Promise(r => setTimeout(r, n))` standing in for a real condition.
- **Deterministic.** No dependence on wall-clock time, ordering, or leaked state
  between tests. Check that timers, listeners, and mocks are restored.
- Tests must not weaken the component to be testable. If a test needed a new
  prop or an exported internal, that is a design smell worth flagging.

## Known jsdom limits

State these rather than trusting a green suite:

- No layout - `getBoundingClientRect` returns zeros, so anything positional is
  untested.
- No real CSS - computed styles from stylesheets are not applied, so visual
  assertions prove little.
- No transitions or animations firing naturally.
- `IntersectionObserver`/`ResizeObserver` need mocking; a mock that always
  reports "intersecting" tests a path that may never happen in a browser.

Anything in these categories needs browser verification in Storybook (or a
Storybook `play` function), not a jsdom test. Stylesheet-level contracts do
have unit tests here and should be extended, not duplicated:
`src/styles/tokens.test.ts` (var()-dependency restatement per theme),
`recipes.test.ts` (every `fuji-*` class exists), `box-sizing.test.tsx`,
`class-conflicts.test.tsx`, `src/a11y-contracts.test.tsx`, and
`src/components/fuji/lib/reference-pass.test.tsx` (the reference-design
contracts: stack position, stepper fill, timeline groups, progress vars).

## Gap analysis

Compare the diff against the tests in the same change. For each behavior added
or modified, is there a test that would fail if it regressed? Say so explicitly
per behavior - "coverage is 87%" answers a different question.

Then check the inverse: are there tests that would **not** fail if the component
were broken? Those are worse than no test.

## Output

Default to review-only. Report:

1. **Uncovered behavior** in the change under review, listed per behavior, with
   the specific test that should exist.
2. **Weak tests** - vacuous, implementation-coupled, or non-deterministic - with
   file and line and why.
3. **Component findings surfaced by testability** (e.g. missing accessible name).
4. Real suite output: pass/fail counts and coverage numbers as printed.

Do not recommend tests for their own sake; each recommendation should name the
regression it would catch. Finish with what you ran and what you did not.
