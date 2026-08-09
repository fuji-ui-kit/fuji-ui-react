"use client";

import * as React from "react";
import { Progress as Base } from "@base-ui/react/progress";
import { cn } from "../../../lib/cn";
import type { StatusTone } from "../../../types";

export interface ProgressProps extends React.ComponentPropsWithoutRef<typeof Base.Root> {
  label?: React.ReactNode;
  showValue?: boolean;
  variant?: StatusTone;
}

const INDICATOR_CLASSES: Partial<Record<StatusTone, string>> = {
  success: "fj:bg-fuji-forest",
  warning: "fj:bg-fuji-sun",
  danger: "fj:bg-fuji-fire",
  info: "fj:bg-fuji-water",
};

/** Linear determinate progress bar (wraps Base UI Progress). */
export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { label, showValue = false, variant = "default", className, ...props },
  ref,
) {
  return (
    <Base.Root ref={ref} className={cn("fj:w-full", className)} {...props}>
      {(label || showValue) && (
        <div className="fj:mb-1.5 fj:flex fj:items-center fj:justify-between fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground">
          {label && <Base.Label>{label}</Base.Label>}
          {showValue && <Base.Value className="fj:text-fuji-foreground-muted" />}
        </div>
      )}
      <Base.Track className="fj:relative fj:h-1.5 fj:w-full fj:overflow-hidden fj:rounded-full fj:bg-fuji-surface-strong fj:shadow-fuji-control">
        <Base.Indicator
          className={cn(
            "fuji-progress-indeterminate fj:h-full fj:rounded-full fj:transition-[width] fj:duration-[var(--fuji-duration-slow)] fj:ease-[var(--fuji-ease)]",
            "fj:data-[indeterminate]:absolute fj:data-[indeterminate]:inset-y-0 fj:data-[indeterminate]:left-0 fj:data-[indeterminate]:w-1/3",
            INDICATOR_CLASSES[variant] ?? "fj:bg-fuji-default",
          )}
        />
      </Base.Track>
    </Base.Root>
  );
});
