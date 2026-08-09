import * as React from "react";
import { cn } from "../../../lib/cn";

export interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  /** width / height, e.g. 16 / 9. Defaults to 1 (square). */
  ratio?: number;
}

export const AspectRatio = React.forwardRef<HTMLDivElement, AspectRatioProps>(function AspectRatio(
  { ratio = 1, className, style, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn("fj:relative fj:w-full fj:overflow-hidden", className)}
      style={{ aspectRatio: ratio, ...style }}
      {...props}
    >
      {children}
    </div>
  );
});
