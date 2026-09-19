import * as React from "react";
import { cn } from "../../../lib/cn";
import type { ComponentSize, ComponentTone } from "../../../types";

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Diameter, matching the control scale used elsewhere. */
  size?: ComponentSize;
  /** Accessible label - spinners are otherwise decorative to assistive tech. */
  label?: string;
  /** Color of the spinner. Default "default" (neutral muted foreground). */
  tone?: ComponentTone;
}

const SIZE_CLASSES: Record<ComponentSize, string> = { sm: "fj:size-4", md: "fj:size-5", lg: "fj:size-6" };

const TONE_CLASSES: Record<ComponentTone, string> = {
  default: "fj:text-fuji-foreground-muted",
  forest: "fj:text-fuji-forest",
  sun: "fj:text-fuji-sun",
  fire: "fj:text-fuji-fire",
  water: "fj:text-fuji-water",
};

export const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = "md", label = "Loading", tone = "default", className, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      role="status"
      aria-label={label}
      className={cn("fj:inline-flex", TONE_CLASSES[tone], className)}
      {...props}
    >
      {/* Three fading dots orbiting via one <g> rotation (no per-dot animation). `animate-spin`
          inherits the global `prefers-reduced-motion` override (tokens.css): the dots sit still,
          which still reads as an intentional static orbit. */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className={cn("fj:animate-fuji-spin", SIZE_CLASSES[size])}
      >
        <circle cx="12" cy="4" r="2.75" fill="currentColor" />
        <circle cx="18.93" cy="16" r="2.25" fill="currentColor" className="fj:opacity-60" />
        <circle cx="5.07" cy="16" r="1.75" fill="currentColor" className="fj:opacity-30" />
      </svg>
    </span>
  );
});
