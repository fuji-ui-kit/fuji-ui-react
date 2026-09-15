import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Every Tailwind-generated class Fuji emits carries the `fj:` prefix (see
 * scripts/css-entry.css's "CSS isolation strategy" comment) - no config
 * needed here. `twMerge` parses a leading `prefix:` exactly like any other
 * variant (`hover:`, `data-[state=open]:`, ...) and only inspects the final
 * utility token for conflict-group matching, so `fj:p-2 fj:p-4` still
 * correctly collapses to `fj:p-4` with zero setup - verified directly
 * against the installed tailwind-merge version before relying on it.
 * Fuji's own hand-written classes (`fuji-glass-surface`, `fuji-theme-scope`,
 * ...) aren't Tailwind utilities and pass through unmerged, as before. A
 * consumer's own unprefixed override className is likewise never treated as
 * conflicting with Fuji's `fj:`-prefixed internals, so intentional
 * consumer overrides are preserved exactly as they were pre-prefix.
 *
 * DO NOT replace this with plain `clsx` to save the ~10 kB. It was tried and
 * reverted: `NATIVE_CONTROL_RESET` is applied first by 31 components and
 * carries `border-0`/`bg-transparent`, which each component then overrides
 * with its own `border`/`bg-*` later in the same `cn()` call. Those pairs
 * conflict, and `twMerge` is what resolves them to the later class. Without
 * it both survive and the stylesheet's source order decides instead - which
 * silently rendered every `contained` Button transparent. Removing this
 * dependency means first restructuring the reset so no component ever emits
 * two classes from the same conflict group; the merge pass is not the bug.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
