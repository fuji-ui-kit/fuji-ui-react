/**
 * Resets UA chrome on native controls in place of preflight, which Fuji never ships (SPEC.md §8).
 * Apply FIRST in `cn(...)`: tailwind-merge keeps the last class, so a component's own `bg-*` wins.
 */
export const NATIVE_CONTROL_RESET =
  "fj:box-border fj:m-0 fj:border-0 fj:bg-transparent fj:p-0 fj:appearance-none fj:[font-family:inherit]";

/**
 * Anchor equivalent: the UA underline and blue show through a colored inner `<span>` (Navbar had grey
 * labels on blue underlines). For every Fuji-styled anchor except `Link`, which owns its underline.
 */
export const NATIVE_LINK_RESET = "fj:text-inherit fj:no-underline";
