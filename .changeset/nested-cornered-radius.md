---
"@fujiui/react": patch
---

Fixed: a nested `FujiProvider radius="cornered"` inside a `soft` app rendered with
soft corners. Cornered values were only declared on `:root`, so a cornered scope
matched no radius rule and inherited `soft` from its ancestor. `cornered` now has
its own `[data-fuji-radius="cornered"]` block, the same values as `:root`, so any
scope (a nested provider, or a portal re-stamping the attribute) can switch back
to it.
