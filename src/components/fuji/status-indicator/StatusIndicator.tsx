import * as React from "react";
import { cn } from "../../../lib/cn";
import type { StatusTone } from "../../../types";

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The state being reported; sets the dot's colour. */
  variant?: StatusTone;
  /** Text beside the dot. Without it the dot needs its own accessible name. */
  label?: React.ReactNode;
  /** Adds a soft pulse ring - use sparingly, e.g. for "live" states. */
  pulse?: boolean;
}

const DOT_CLASSES: Record<StatusTone, string> = {
  default: "fj:bg-fuji-foreground-subtle",
  success: "fj:bg-fuji-forest",
  warning: "fj:bg-fuji-sun",
  danger: "fj:bg-fuji-fire",
  info: "fj:bg-fuji-water",
};

/** Dot + label status - never the only signal (label carries the meaning too). */
export const StatusIndicator = React.forwardRef<HTMLSpanElement, StatusIndicatorProps>(
  function StatusIndicator({ variant = "default", label, pulse = false, className, ...props }, ref) {
    return (
      <span
        ref={ref}
        className={cn(
          "fj:inline-flex fj:items-center fj:gap-1.5 fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground",
          className,
        )}
        {...props}
      >
        <span className="fj:relative fj:flex fj:size-2">
          {pulse && (
            <span
              className={cn(
                "fj:absolute fj:inline-flex fj:h-full fj:w-full fj:animate-fuji-ping fj:rounded-full fj:opacity-60",
                DOT_CLASSES[variant],
              )}
            />
          )}
          <span
            className={cn("fj:relative fj:inline-flex fj:size-2 fj:rounded-full", DOT_CLASSES[variant])}
          />
        </span>
        {label}
      </span>
    );
  },
);
