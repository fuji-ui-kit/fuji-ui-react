import * as React from "react";
import { cn } from "../../../lib/cn";

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Which way the rule runs. A vertical divider needs a height from its container. */
  orientation?: "horizontal" | "vertical";
  /** Optional label rendered inline on a horizontal divider. */
  label?: React.ReactNode;
}

export const Divider = React.forwardRef<HTMLDivElement, DividerProps>(function Divider(
  { orientation = "horizontal", label, className, ...props },
  ref,
) {
  if (orientation === "vertical") {
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation="vertical"
        className={cn("fj:w-px fj:self-stretch fj:bg-fuji-border", className)}
        {...props}
      />
    );
  }

  if (label) {
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation="horizontal"
        className={cn(
          "fj:flex fj:items-center fj:gap-3 fj:text-fuji-foreground-subtle fj:text-[length:var(--fuji-text-xs)]",
          className,
        )}
        {...props}
      >
        <span className="fj:h-px fj:flex-1 fj:bg-fuji-border" />
        {label}
        <span className="fj:h-px fj:flex-1 fj:bg-fuji-border" />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation="horizontal"
      className={cn("fj:h-px fj:w-full fj:bg-fuji-border", className)}
      {...props}
    />
  );
});
