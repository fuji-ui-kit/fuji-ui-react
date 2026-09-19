---
"@fujiui/react": minor
---

**Dark mode and glass are easier to get right, for people and coding agents.**

- **`registry.json` ships appearance recipes** (`appearance`): filling the page
  in dark mode, a light/dark toggle, following the OS, remembering the choice
  without a flash, glass and its backdrop, and making your own markup - and
  Tailwind's `dark:` variant - follow the provider. `@fujiui/mcp` 0.2.0 serves
  them through its new `get_appearance` tool.
- **Fixed: `registry.json` had no glass token values.** The token scope parser
  still looked for the `data-fuji-glass` attribute removed in the theme/material
  split, so every `[data-fuji-material="glass"]` value was dropped. Glass and
  light-glass values are now recorded as the `glass` and `glass+light` scopes.
- **`<html>` takes the theme background** once it carries `data-fuji-theme` -
  set by the root provider's `persist` or by the bootstrap script - so
  overscroll and a page shorter than the viewport no longer show the browser's
  white under a dark app. It is a zero-specificity rule, so any page background
  of your own still wins.
