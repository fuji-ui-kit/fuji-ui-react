---
"@fujiui/react": minor
---

**`Keyboard`: held caps repeat, and ⌘/Ctrl/Alt work as shortcut modifiers.**

- **Hold to repeat.** Holding a cap - Backspace, a letter, an arrow - now repeats
  it like a real key: one press, a 400ms pause, then twenty a second until it is
  released or the pointer slides off. Previously a cap reported once, on
  release, however long it was held. Modifiers and toggles never repeat, and the
  click that ends a hold reports nothing extra.
- **Shortcut modifiers.** ⌘, Ctrl and Alt caps now latch like Shift: click ⌘,
  then A, and the board reports ⌘A. The latched cap lights and announces
  `aria-pressed`; the next ordinary cap spends it. A physically held modifier
  counts too while the board is engaged.
- **`onKeyPress(key, modifiers)`.** The callback gains a second argument,
  `{ shift, meta, ctrl, alt }` (exported as `KeyboardModifiers`). Under ⌘ or
  Ctrl a cap reports no `value`, since a shortcut types nothing - a handler that
  only appends `key.value` no longer types an "a" for ⌘A.

Non-breaking at runtime: existing one-argument handlers keep working. A test
asserting `toHaveBeenCalledWith(objectContaining(...))` on `onKeyPress` needs a
second matcher, e.g. `expect.anything()`.
