import * as React from "react";
import { cn } from "../../../lib/cn";
import type { ComponentTone } from "../../../types";

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  /** Border/text color. Default "default" (neutral). */
  tone?: ComponentTone;
}

// Border-only per tone - the surface stays neutral (`fuji-kbd-surface`), only
// the border/text pick up color, written out in full for the Tailwind scanner.
const TONE_CLASSES: Record<ComponentTone, string> = {
  default: "fj:border-fuji-border-strong fj:text-fuji-foreground-muted",
  earth: "fj:border-fuji-earth fj:text-fuji-earth",
  forest: "fj:border-fuji-forest fj:text-fuji-forest",
  sun: "fj:border-fuji-sun fj:text-fuji-sun",
  fire: "fj:border-fuji-fire fj:text-fuji-fire",
  water: "fj:border-fuji-water fj:text-fuji-water",
};

/** Renders a single keyboard key/shortcut token, e.g. `<Kbd>⌘K</Kbd>`. */
export const Kbd = React.forwardRef<HTMLElement, KbdProps>(function Kbd(
  { tone = "default", className, children, ...props },
  ref,
) {
  return (
    <kbd
      ref={ref}
      className={cn(
        "fj:inline-flex fj:min-w-[1.5em] fj:items-center fj:justify-center fj:rounded-[6px] fj:border",
        "fuji-kbd-surface fj:px-1.5 fj:py-0.5 fj:text-[length:var(--fuji-text-xs)] fj:font-medium",
        "fj:shadow-fuji-control fj:font-[var(--fuji-font-mono)]",
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  );
});
