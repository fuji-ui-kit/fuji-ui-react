import * as React from "react";
import { cn } from "../../../lib/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** What the placeholder stands in for: a line of text, a panel, or an avatar. */
  shape?: "text" | "block" | "circle";
}

/** Loading placeholder - pulses in place of not-yet-loaded content. */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { shape = "block", className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "fj:animate-fuji-pulse fj:bg-fuji-surface-strong",
        shape === "text" && "fj:h-3.5 fj:rounded-fuji-item",
        shape === "block" && "fj:rounded-fuji-control",
        shape === "circle" && "fj:rounded-full",
        className,
      )}
      {...props}
    />
  );
});
