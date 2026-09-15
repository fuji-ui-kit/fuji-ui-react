import * as React from "react";
import { cn } from "../../../lib/cn";
import type { ComponentSize, ComponentTone } from "../../../types";

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  /** Border/text color. Default "default" (neutral). */
  tone?: ComponentTone;
  /** Chip scale, for legends set beside larger type or beside a `Keyboard`. Default "sm". */
  size?: ComponentSize;
}

// Border-only per tone - the surface stays neutral (`fuji-kbd-surface`), only
// the border/text pick up color, written out in full for the Tailwind scanner.
const TONE_CLASSES: Record<ComponentTone, string> = {
  default: "fj:border-fuji-border-strong fj:text-fuji-foreground-muted",
  forest: "fj:border-fuji-forest fj:text-fuji-forest",
  sun: "fj:border-fuji-sun fj:text-fuji-sun",
  fire: "fj:border-fuji-fire fj:text-fuji-fire",
  water: "fj:border-fuji-water fj:text-fuji-water",
};

// Chip scale. `sm` is the inline-with-body-text default the component shipped
// with; the larger two are for legends set beside a `Keyboard` or a heading.
const SIZE_CLASSES: Record<ComponentSize, string> = {
  sm: "fj:px-1.5 fj:py-0.5 fj:text-[length:var(--fuji-text-xs)]",
  md: "fj:px-2 fj:py-1 fj:text-[length:var(--fuji-text-sm)]",
  lg: "fj:px-2.5 fj:py-1.5 fj:text-[length:var(--fuji-text-base)]",
};

/**
 * Renders a single keyboard key/shortcut token, e.g. `<Kbd>⌘K</Kbd>`. For a
 * whole board rather than one chip, see `Keyboard`.
 */
export const Kbd = React.forwardRef<HTMLElement, KbdProps>(function Kbd(
  { tone = "default", size = "sm", className, children, ...props },
  ref,
) {
  return (
    <kbd
      ref={ref}
      className={cn(
        // `box-border`: no preflight ships with this package, so `min-w` plus the
        // border below sized the chip 2px wider than declared.
        "fj:box-border fj:inline-flex fj:min-w-[1.5em] fj:items-center fj:justify-center fj:rounded-fuji-item fj:border",
        "fuji-kbd-surface fj:font-medium",
        "fj:shadow-fuji-control fj:font-[var(--fuji-font-mono)]",
        SIZE_CLASSES[size],
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  );
});
