import * as React from "react";
import { cn } from "../../../lib/cn";

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The element to render. Use it to keep the layout while fixing the semantics. */
  as?: keyof React.JSX.IntrinsicElements;
}

/** Bare polymorphic block-level primitive - the escape hatch under Fuji's layout components. */
export const Box = React.forwardRef<HTMLDivElement, BoxProps>(function Box(
  { as: Tag = "div", className, ...props },
  ref,
) {
  const Component = Tag as React.ElementType;
  return <Component ref={ref} className={cn(className)} {...props} />;
});
