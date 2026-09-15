import * as React from "react";
import { cn } from "../../../lib/cn";

export type FujiGap = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;

export const GAP_CLASSES: Record<FujiGap, string> = {
  1: "fj:gap-[var(--fuji-space-1)]",
  2: "fj:gap-[var(--fuji-space-2)]",
  3: "fj:gap-[var(--fuji-space-3)]",
  4: "fj:gap-[var(--fuji-space-4)]",
  5: "fj:gap-[var(--fuji-space-5)]",
  6: "fj:gap-[var(--fuji-space-6)]",
  8: "fj:gap-[var(--fuji-space-8)]",
  10: "fj:gap-[var(--fuji-space-10)]",
  12: "fj:gap-[var(--fuji-space-12)]",
  16: "fj:gap-[var(--fuji-space-16)]",
};

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Flex axis. Default "vertical". */
  direction?: "vertical" | "horizontal";
  /** Space between children, on the shared spacing scale. */
  gap?: FujiGap;
  /** Cross-axis alignment of the children. */
  align?: "start" | "center" | "end" | "baseline" | "stretch";
  /** Only meaningful with `direction="horizontal"`. */
  justify?: "start" | "center" | "end" | "between";
  /** Only meaningful with `direction="horizontal"`. */
  wrap?: boolean;
  /** The element to render. Use it to keep the layout while fixing the semantics. */
  as?: keyof React.JSX.IntrinsicElements;
}

/** Flex layout primitive with a fixed spacing-scale gap, vertical or horizontal. */
export const Stack = React.forwardRef<HTMLDivElement, StackProps>(function Stack(
  {
    direction = "vertical",
    gap = 4,
    align = "stretch",
    justify = "start",
    wrap = false,
    as: Tag = "div",
    className,
    ...props
  },
  ref,
) {
  const Component = Tag as React.ElementType;
  const horizontal = direction === "horizontal";
  return (
    <Component
      ref={ref}
      className={cn(
        horizontal ? "fj:flex fj:flex-row" : "fj:flex fj:flex-col",
        GAP_CLASSES[gap],
        horizontal && wrap && "fj:flex-wrap",
        align === "start" && "fj:items-start",
        align === "center" && "fj:items-center",
        align === "end" && "fj:items-end",
        align === "baseline" && "fj:items-baseline",
        align === "stretch" && "fj:items-stretch",
        horizontal && justify === "center" && "fj:justify-center",
        horizontal && justify === "end" && "fj:justify-end",
        horizontal && justify === "between" && "fj:justify-between",
        className,
      )}
      {...props}
    />
  );
});
