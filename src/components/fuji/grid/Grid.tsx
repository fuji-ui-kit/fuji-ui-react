import * as React from "react";
import { cn } from "../../../lib/cn";
import { GAP_CLASSES } from "../stack/Stack";
import type { FujiGap } from "../stack/Stack";

export type FujiColumns = 1 | 2 | 3 | 4 | 6 | 12;

const COLUMN_CLASSES: Record<FujiColumns, string> = {
  1: "fj:grid-cols-1",
  2: "fj:grid-cols-1 fj:sm:grid-cols-2",
  3: "fj:grid-cols-1 fj:sm:grid-cols-2 fj:lg:grid-cols-3",
  4: "fj:grid-cols-1 fj:sm:grid-cols-2 fj:lg:grid-cols-4",
  6: "fj:grid-cols-2 fj:sm:grid-cols-3 fj:lg:grid-cols-6",
  12: "fj:grid-cols-4 fj:sm:grid-cols-6 fj:lg:grid-cols-12",
};

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Column count, or a breakpoint map for a responsive track count. */
  columns?: FujiColumns;
  /** Space between cells, on the shared spacing scale. */
  gap?: FujiGap;
}

/** Responsive CSS grid - columns collapse mobile-first at sm/lg. */
export const Grid = React.forwardRef<HTMLDivElement, GridProps>(function Grid(
  { columns = 3, gap = 4, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn("fj:grid", COLUMN_CLASSES[columns], GAP_CLASSES[gap], className)}
      {...props}
    />
  );
});
