---
"@fujiui/react": minor
---

Date and form-field fixes found while building example apps, plus two small
`Calendar` additions.

**`DatePicker` and `TimePicker` ignored their `FormField`.** Their triggers were
bare `Popover.Trigger`s, invisible to Base UI's Field: `FormField.Label`'s
`for` pointed at an id nothing rendered (clicking it did nothing, and the
trigger had no accessible name), `FormField.Description` was never announced,
and `<FormField invalid>` painted neither the red border nor `aria-invalid`.
Both triggers now render through `Field.Control` - the same Field-aware leaf
`Input` uses - so they get the field's `id`, `aria-labelledby`,
`aria-describedby`, `data-invalid`/`aria-invalid` and `disabled` like every
other Fuji field. A FormField `validate` function receives the selected day as
`YYYY-MM-DD` (DatePicker) or the `HH:mm` string (TimePicker). `TimePicker` also
gains the `aria-labelledby` prop its siblings already had.

**`Combobox`, `MultiSelect`, and `NumberInput` erased their FormField label
reference.** Each passed `aria-labelledby={undefined}` explicitly, which wins
Base UI's merge over the label id it sets - the same stomping pattern fixed for
`data-invalid` earlier. The fields stayed named only through `label[for]`; they
now keep `aria-labelledby` pointing at the label too.

**`minDate={new Date()}` disabled today.** `Calendar` (and so `DatePicker`)
compared bounds by timestamp, so today's midnight cell sat "before" a `minDate`
carrying the current time. `minDate`/`maxDate` now compare by calendar day,
including when clamping the keyboard focus position.

**`MultiSelect`'s `size` only changed its font size.** The field hard-coded the
`md` control height, so `sm` and `lg` rendered as tall as `md` beside a
`Select` or `Input` of the same size. Height, input row, and chip padding now
follow `size`.

**`Slider`'s `aria-label` never reached the slider.** It was spread onto the
wrapping group, leaving the focusable `role="slider"` input unnamed. It is now
applied to the thumb input. A range value (`[20, 80]`) also rendered only one
thumb - the second value had no handle at all; `Slider` now renders one thumb
per value, and the new `getAriaLabel(index)` prop names each one
("Minimum price" / "Maximum price").

**New: `Calendar` `markedDates` and `markedDateLabel`.** Pass a list of dates
(matched by day) or a predicate to put a small dot under days with something on
them. The mark is not visual-only: `markedDateLabel` (default `"marked"`) is
appended to each marked day's accessible name, e.g. "Monday, May 20, 2024, has
tasks".

**New: `today` on `Calendar` and `DatePicker`.** "Today" always came from the
real clock (reconciled after mount), so demos and tests could not pin it.
`today` sets the date used for the highlight, `aria-current="date"`, and the
initial month; it renders identically on server and client. Omit it to keep
the existing behavior.
