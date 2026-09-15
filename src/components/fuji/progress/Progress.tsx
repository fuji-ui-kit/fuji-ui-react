"use client";

import * as React from "react";
import { Progress as Base } from "@base-ui/react/progress";
import { cn } from "../../../lib/cn";
import type { StatusTone } from "../../../types";

export interface ProgressProps extends React.ComponentPropsWithoutRef<typeof Base.Root> {
  /** Text above the bar naming what is progressing. Also its accessible name. */
  label?: React.ReactNode;
  /** Prints the percentage on the trailing edge of the label row. */
  showValue?: boolean;
  /** Colours the fill to report an outcome rather than plain progress. */
  variant?: StatusTone;
}

const INDICATOR_CLASSES: Partial<Record<StatusTone, string>> = {
  success: "fj:bg-fuji-forest",
  warning: "fj:bg-fuji-sun",
  danger: "fj:bg-fuji-fire",
  info: "fj:bg-fuji-water",
};

/**
 * Linear determinate progress bar (wraps Base UI Progress).
 *
 * The fill is a full-width bar scaled with `transform: scaleX()` on the
 * spring curve (the reference is motion.dev's loading progress bar), so a
 * value that jumps in discrete steps - a chunked upload, a poll - still
 * reads as one smooth, slightly elastic motion. The fill is rendered here
 * rather than through `Base.Indicator`, which hard-codes `width: N%` and
 * cannot be animated on the compositor; the `progressbar` semantics live on
 * the root, so nothing accessible is lost.
 */
export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { label, showValue = false, variant = "default", className, value, min = 0, max = 100, ...props },
  ref,
) {
  const indeterminate = value === null || value === undefined;
  const fraction = indeterminate ? 0 : Math.min(Math.max((value - min) / (max - min || 1), 0), 1);
  return (
    <Base.Root ref={ref} className={cn("fj:w-full", className)} value={value} min={min} max={max} {...props}>
      {(label || showValue) && (
        <div className="fj:mb-1.5 fj:flex fj:items-center fj:justify-between fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground">
          {label && <Base.Label>{label}</Base.Label>}
          {showValue && <Base.Value className="fj:text-fuji-foreground-muted" />}
        </div>
      )}
      <Base.Track className="fj:relative fj:h-2 fj:w-full fj:overflow-hidden fj:rounded-full fj:bg-fuji-surface-strong">
        <div
          aria-hidden="true"
          data-indeterminate={indeterminate ? "" : undefined}
          className={cn(
            "fuji-progress-fill fuji-progress-indeterminate fj:h-full fj:w-full fj:rounded-full",
            "fj:data-[indeterminate]:absolute fj:data-[indeterminate]:inset-y-0 fj:data-[indeterminate]:left-0 fj:data-[indeterminate]:w-1/3",
            INDICATOR_CLASSES[variant] ?? "fj:bg-fuji-foreground",
          )}
          style={indeterminate ? undefined : ({ "--fuji-progress": fraction } as React.CSSProperties)}
        />
      </Base.Track>
    </Base.Root>
  );
});
