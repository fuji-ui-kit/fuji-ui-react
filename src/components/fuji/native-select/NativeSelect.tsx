import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Field } from "@base-ui/react/field";
import { cn } from "../../../lib/cn";
import type { ComponentSize } from "../../../types";
import { fieldSurface } from "../lib/field-surface";

export interface NativeSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  /** Control height, matching `Input` at the same value. */
  size?: ComponentSize;
  /** Paints the error state. Pair with `FormField`'s `error` for the message. */
  invalid?: boolean;
}

/**
 * Native `<select>` for progressive enhancement, mobile pickers and simple cases. Renders via
 * `Field.Control` (hence the cast) so `FormField.Label` gets an `htmlFor` target, as with Input.
 */
export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(function NativeSelect(
  { size = "md", invalid, className, children, ...props },
  ref,
) {
  return (
    <div className="fj:relative">
      <Field.Control
        render={<select />}
        ref={ref as React.Ref<HTMLElement>}
        // Spread, not `data-invalid={invalid ? "" : undefined}`: an explicit `undefined` wins the
        // merge and erases the `data-invalid` Field.Control mirrors from `<FormField invalid>`.
        // Omitting the key lets it through (see Input.tsx / FormField.tsx).
        {...(invalid ? { "data-invalid": "" } : null)}
        aria-invalid={invalid}
        className={cn(fieldSurface({ size }), "fj:appearance-none fj:pr-8", className)}
        {...(props as React.ComponentPropsWithRef<"input">)}
      >
        {children}
      </Field.Control>
      <ChevronDown className="fj:pointer-events-none fj:absolute fj:top-1/2 fj:right-2.5 fj:size-4 fj:-translate-y-1/2 fj:text-fuji-foreground-muted" />
    </div>
  );
});
