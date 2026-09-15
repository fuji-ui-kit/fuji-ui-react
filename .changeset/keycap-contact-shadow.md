---
"@fujiui/react": patch
---

Size the keycap shadow to the gap between caps.

`.fuji-keycap` drew `--fuji-shadow-control`, the token for free-standing
controls. At `floating` elevation that shadow reaches roughly 28px below the
cap, but caps sit 3-5px apart (`--fuji-key-gap` is fixed at every `size`), so
almost all of it was painted underneath the neighbouring cap - invisible, and
rasterised once per cap on a board with up to 104 of them. The cost was
highest on `material="glass"` with `elevation="floating"`, the two largest
shadow tokens in the system.

Caps now take a new `--fuji-shadow-keycap`, a contact shadow that stays inside
the gap. It is keyed on theme only: a cap is recessed into its board rather
than floating above the page, so elevation belongs to the board, not the cap.
The rendered result is unchanged at `regular` elevation in the solid themes,
where the control shadow already fit; elsewhere only the occluded part is
gone.
