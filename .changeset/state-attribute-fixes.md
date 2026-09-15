---
"@fujiui/react": patch
---

Three controls that silently ignored state they were supposed to render.

**`disabled` had no visual effect on `Checkbox`, `Switch`, `RadioGroup`,
`NumberInput`, `Combobox`, and `MultiSelect`.** Base UI renders these as
`<span role="checkbox">` / `<span role="switch">` / `<span role="radio">` /
`<div role="group">`, with the real `disabled` attribute sitting on a
visually-hidden `<input>` beside them, not on the element carrying Tailwind's
`disabled:` variant - a pseudo-class that can only match a genuine disabled
form control, so it never matched. Measured on a disabled `Checkbox`:
`opacity: 1`, `cursor: pointer` - pixel-identical to an active one. Base UI
does mirror the disabled state onto these elements as `data-disabled`, so
`Checkbox`, `Switch`, `RadioGroup`, and the shared `lib/field-surface.ts`
recipe (which is what `NumberInput`'s spin-button group and
`Combobox`/`MultiSelect`'s input group render through) now use the
`data-[disabled]:` attribute variant instead - `opacity: 0.45`,
`cursor: not-allowed`. `Input`, `Textarea`, and `NativeSelect` share the same
recipe but were never actually affected: they render through a real
`<input>`/`<textarea>`/`<select>`, where `disabled:` already matched.

**A field's red invalid border stopped painting when `invalid` came from an
ancestor `<FormField invalid>` instead of the field's own `invalid` prop.**
`Input`, `NativeSelect`, `Textarea`, `NumberInput`, `Combobox`, `MultiSelect`,
and `Select` all wrote `data-invalid={invalid ? "" : undefined}` - and a prop
explicitly set to `undefined` still occupies that key, which wins Base UI's
merge over the `data-invalid` it had already computed from the ancestor
`FormField`. So `data-[invalid]:border-fuji-fire` never painted, and the
field's only error cue was `FormField`'s helper text. (`aria-invalid` was
unaffected - it's recomputed in a later merge - which is why this went
unnoticed.) Fixed by omitting the attribute entirely when the local `invalid`
prop is falsy, instead of asserting it to `undefined`, so `FormField`'s value
passes through.

**`IconButton` had no focus-visible ring**, falling back to the browser's
native outline (measured ~2:1 contrast against a light page). The
focus-visible classes lived in `Button`'s own JSX rather than in the
`button.styles.ts` recipe both components are built from, so the line was
never mirrored onto `IconButton`. It now lives in the shared recipe, so
neither component can drift out of sync with it again.
