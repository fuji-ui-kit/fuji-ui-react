import * as React from "react";
import { Field } from "@base-ui/react/field";
import { cn } from "../../../lib/cn";

export type FormFieldRootProps = React.ComponentPropsWithoutRef<typeof Field.Root>;

const FormFieldRoot = React.forwardRef<HTMLDivElement, FormFieldRootProps>(function FormFieldRoot(
  { className, ...props },
  ref,
) {
  return <Field.Root ref={ref} className={cn("fj:flex fj:flex-col fj:gap-1.5", className)} {...props} />;
});

const FormFieldLabel = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<typeof Field.Label>>(
  function FormFieldLabel({ className, ...props }, ref) {
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
  },
);

const FormFieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof Field.Description>
>(function FormFieldDescription({ className, ...props }, ref) {
  return (
    <Field.Description
      ref={ref}
      className={cn("fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground-muted", className)}
      {...props}
    />
  );
});

const FormFieldError = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof Field.Error>
>(function FormFieldError({ className, ...props }, ref) {
  return (
    <Field.Error
      ref={ref}
      className={cn(
        "fj:flex fj:items-center fj:gap-1.5 fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-fire",
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
