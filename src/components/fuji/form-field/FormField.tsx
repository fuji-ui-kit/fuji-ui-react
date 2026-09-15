import * as React from "react";
import { Field } from "@base-ui/react/field";
import { cn } from "../../../lib/cn";

export type FormFieldRootProps = React.ComponentPropsWithoutRef<typeof Field.Root>;

/**
 * Whether the root was told it is invalid via its own `invalid` prop, rather
 * than by Base UI's validation. Base UI's `Field.Error` only renders for a
 * validation result it produced itself, so without this a field marked
 * `<FormField invalid>` got the red border and `aria-invalid` but never showed
 * its `<FormField.Error>` message - the one thing that tells the user what is
 * actually wrong.
 */
const ForcedInvalidContext = React.createContext(false);

export const FormFieldRoot = React.forwardRef<HTMLDivElement, FormFieldRootProps>(function FormFieldRoot(
  { className, ...props },
  ref,
) {
  return (
    <ForcedInvalidContext.Provider value={props.invalid === true}>
      <Field.Root ref={ref} className={cn("fj:flex fj:flex-col fj:gap-1.5", className)} {...props} />
    </ForcedInvalidContext.Provider>
  );
});

export const FormFieldLabel = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<typeof Field.Label>
>(function FormFieldLabel({ className, ...props }, ref) {
  return (
    <Field.Label
      ref={ref}
      className={cn(
        "fj:text-[length:var(--fuji-text-sm)] fj:font-medium fj:text-fuji-foreground fj:data-[disabled]:opacity-45",
        className,
      )}
      {...props}
    />
  );
});

export const FormFieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof Field.Description>
>(function FormFieldDescription({ className, ...props }, ref) {
  return (
    <Field.Description
      ref={ref}
      // `m-0`: Base UI renders a `<p>`, which keeps the UA stylesheet's 1em
      // margins without preflight - the help text floated away from its field.
      className={cn("fj:m-0 fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground-muted", className)}
      {...props}
    />
  );
});

export const FormFieldError = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof Field.Error>
>(function FormFieldError({ className, match, ...props }, ref) {
  const forcedInvalid = React.useContext(ForcedInvalidContext);
  return (
    <Field.Error
      ref={ref}
      // An explicit `match` from the consumer always wins; otherwise a root
      // marked `invalid` forces the message to show (see ForcedInvalidContext).
      match={match ?? (forcedInvalid || undefined)}
      className={cn(
        "fj:m-0 fj:flex fj:items-center fj:gap-1.5 fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-fire",
        className,
      )}
      {...props}
    />
  );
});

/**
 * Compound field wrapper backed by Base UI's Field: wires label/description/
 * error `aria-describedby` and `data-invalid`/`data-disabled` automatically to
 * any Fuji input rendered inside it.
 *
 * `<FormField invalid><FormField.Label/><Input/><FormField.Error/></FormField>`
 */
export const FormField = Object.assign(FormFieldRoot, {
  Label: FormFieldLabel,
  Description: FormFieldDescription,
  Error: FormFieldError,
});
