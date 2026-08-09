import * as React from "react";
import { cn } from "../../../lib/cn";
import { TYPOGRAPHY_DEFAULT_TAG, typographyStyles, type TypographyVariant } from "./typography.styles";

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant;
  /** Override the rendered element (defaults follow the variant's semantic role). */
  as?: keyof React.JSX.IntrinsicElements;
}

export const Typography = React.forwardRef<HTMLElement, TypographyProps>(function Typography(
  { variant = "body", as, className, children, ...props },
  ref,
) {
  const Tag = (as ?? TYPOGRAPHY_DEFAULT_TAG[variant]) as React.ElementType;
  return (
    <Tag ref={ref} className={cn(typographyStyles({ variant }), className)} {...props}>
      {children}
    </Tag>
  );
});
