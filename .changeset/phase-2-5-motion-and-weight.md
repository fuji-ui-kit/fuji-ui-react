---
"@fujiui/react": minor
---

Motion system groundwork, and cut real runtime and CSS weight.

**Motion.** Added `--fuji-ease-spring` (a `linear()` ramp that overshoots and
settles like a physical control, with no JS animation runtime) and
`--fuji-duration-overlay`; both collapse under `prefers-reduced-motion`.

New `ripple` prop on `Button`, for a pointer-origin press ripple. See the
material-ripple entry below for the behaviour that ships: it is on by default
on both `Button` and `IconButton`, and `ripple={false}` opts a control out.
Fully disabled under reduced motion.

**`Statistic` no longer re-renders 60 times a second, and no longer renders
`0` on the server.** The count-up wrote through `useState` on every animation
frame - roughly 42 renders per visible tile, several per dashboard KPI row,
all to change one text node. It now writes `textContent` directly. That also
fixed a real bug: because state started at `0`, server-rendered and no-JS
output showed `$0` instead of the actual figure. The markup now contains the
final value and the effect rewinds only when it is about to animate.

**Removed `class-variance-authority`** as a runtime dependency. It was used in
three files for what is a static lookup; those are now plain functions. The
rendered class attributes are byte-identical across all twelve appearance
combinations.

**Glass materials no longer apply to form controls.** `field-surface.ts`,
`Textarea` and `OTPInput` each carried `fuji-glass-surface-strong`, which put
a 36px `backdrop-filter` on every input on the page under the glass theme - a
twenty-field form meant twenty extra compositing layers for a blur nobody can
see behind a control that small. A representative page went from 4
backdrop-filtered elements to 3, with none on form controls.

**CSS isolation.** Tailwind's `spin`/`ping`/`pulse` keyframes are emitted
under those bare global names and silently collide with a consumer's own
`@keyframes spin`; the `fj:` class prefix does not rename keyframes. Fuji now
declares its own `fuji-spin`/`fuji-ping`/`fuji-pulse`, so every keyframe the
package ships is namespaced. The boot-time transition suppressor was also
scoped - `html[data-fuji-boot] *` killed every transition on the page,
including the consumer's own unrelated markup.

**New regression test** (`src/styles/class-conflicts.test.tsx`) asserting no
rendered element carries two classes from the same Tailwind conflict group.
This exists because removing `tailwind-merge` (an attractive ~10 kB saving)
was tried and reverted: `NATIVE_CONTROL_RESET` is applied first by 31
components and carries `border-0`/`bg-transparent`, which each component then
overrides later in the same `cn()` call. Without the merge pass both survive
and stylesheet order decides - which rendered every `contained` Button
transparent, with no existing test failing. `cn` documents this so the saving
is not attempted again without first restructuring the reset.
