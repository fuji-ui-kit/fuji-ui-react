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
 * Native `<select>` - use for progressive enhancement, iOS/Android native pickers, and simple cases.
 * Renders through Base UI's `Field.Control` (typed for `<input>`, hence the cast below) so it
 * auto-registers with an ancestor `FormField`/`Field.Root` the same way Input does - a bare
 * `<select>` here would leave `FormField.Label` with no control to point `htmlFor` at.
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
        // Spread instead of `data-invalid={invalid ? "" : undefined}`:
        // `Field.Control` already mirrors an ancestor `<FormField invalid>`
        // onto this same element as `data-invalid` automatically, and an
        // explicit `undefined`-valued prop still occupies the key and wins
        // the merge in `useRenderElement`, erasing that computed value
        // whenever this `invalid` prop itself was left unset (see Input.tsx
        // for the full mechanism, and FormField.tsx for the symptom).
        // Omitting the key when falsy instead lets the ambient value through.
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
