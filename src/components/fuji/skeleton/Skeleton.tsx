import * as React from "react";
import { cn } from "../../../lib/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "block" | "circle";
}

/** Loading placeholder - pulses in place of not-yet-loaded content. */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { variant = "block", className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "fj:animate-pulse fj:bg-fuji-surface-strong",
        variant === "text" && "fj:h-3.5 fj:rounded-[4px]",
        variant === "block" && "fj:rounded-fuji-control",
        variant === "circle" && "fj:rounded-full",
        className,
      )}
      {...props}
    />
  );
});
