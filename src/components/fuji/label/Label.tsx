import * as React from "react";
import { cn } from "../../../lib/cn";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Shows a required-field marker after the label text. */
  required?: boolean;
}

/** Plain, standalone label - use `FormField.Label` when composing inside a FormField. */
export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { required = false, className, children, ...props },
  ref,
) {
  return (
    <label
      ref={ref}
      className={cn(
        "fj:text-[length:var(--fuji-text-sm)] fj:font-medium fj:text-fuji-foreground",
        "fj:data-[disabled]:opacity-45",
        className,
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="fj:ml-0.5 fj:text-fuji-fire" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
});
