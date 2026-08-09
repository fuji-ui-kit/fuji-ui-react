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
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
