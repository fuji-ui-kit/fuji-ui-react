import * as React from "react";
import { cn } from "../../../lib/cn";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum line length the content is capped at. Not a control size - see the 0.3 upgrade note. */
  width?: "sm" | "md" | "lg" | "xl";
}

const WIDTH_CLASSES: Record<NonNullable<ContainerProps["width"]>, string> = {
  sm: "fj:max-w-2xl",
  md: "fj:max-w-4xl",
  lg: "fj:max-w-6xl",
  xl: "fj:max-w-7xl",
};

/** Centered, max-width page content wrapper with responsive gutters. */
export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(function Container(
  { width = "lg", className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "fj:box-border fj:mx-auto fj:w-full fj:px-4 fj:sm:px-6 fj:lg:px-8",
        WIDTH_CLASSES[width],
        className,
      )}
      {...props}
    />
  );
});
