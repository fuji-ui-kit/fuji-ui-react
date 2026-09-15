import * as React from "react";
import { cn } from "../../../lib/cn";
import { TYPOGRAPHY_DEFAULT_TAG, typographyStyles, type TypographyScale } from "./typography.styles";

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  /** Type scale step. Sets the size and weight; pass `as` to change the element. */
  scale?: TypographyScale;
  /**
   * The element to render. Each scale has a semantic default (`heading` is an
   * `<h2>`, `body` a `<p>`); set this when the document outline needs a
   * different tag than the size implies.
   */
  as?: keyof React.JSX.IntrinsicElements;
}

export const Typography = React.forwardRef<HTMLElement, TypographyProps>(function Typography(
  { scale = "body", as, className, children, ...props },
  ref,
) {
  const Tag = (as ?? TYPOGRAPHY_DEFAULT_TAG[scale]) as React.ElementType;
  return (
    <Tag ref={ref} className={cn(typographyStyles({ scale }), className)} {...props}>
      {children}
    </Tag>
  );
});
