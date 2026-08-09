"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { NumberField } from "@base-ui/react/number-field";
import { cn } from "../../../lib/cn";
import type { ComponentSize } from "../../../types";
import { fieldSurface } from "../lib/field-surface";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

export interface NumberInputProps extends Omit<
  React.ComponentPropsWithoutRef<typeof NumberField.Root>,
  "render"
> {
  size?: ComponentSize;
  invalid?: boolean;
  placeholder?: string;
  /** Stretches to the width of its container. Default false - a number field's value is usually short, so it's compact by default rather than stretching to match a nearby text field. */
  fullWidth?: boolean;
  /** Accessible name for the number field. Required when there is no visible `<label>` for it. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

/** Number field with increment/decrement steppers (wraps Base UI NumberField). Compact by default - pass `fullWidth` to stretch it. */
export const NumberInput = React.forwardRef<HTMLDivElement, NumberInputProps>(function NumberInput(
  {
    size = "md",
    invalid,
    placeholder,
    fullWidth = false,
    className,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    ...props
  },
  ref,
) {
  return (
    <NumberField.Root ref={ref} className={cn(fullWidth ? "fj:w-full" : "fj:w-32", className)} {...props}>
      <NumberField.Group
        data-invalid={invalid ? "" : undefined}
        className={cn(fieldSurface({ size }), "fj:flex fj:items-stretch fj:gap-0 fj:p-0")}
      >
        <NumberField.Decrement
          className={cn(
            NATIVE_CONTROL_RESET,
            "fj:flex fj:shrink-0 fj:items-center fj:justify-center fj:px-2.5 fj:text-fuji-foreground-muted fj:hover:text-fuji-foreground fj:disabled:pointer-events-none fj:disabled:opacity-30",
          )}
          aria-label="Decrease value"
        >
          <Minus className="fj:size-3.5" />
        </NumberField.Decrement>
        <NumberField.Input
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          className={cn(
            NATIVE_CONTROL_RESET,
            "fj:h-full fj:w-full fj:min-w-0 fj:text-center fj:outline-none fj:placeholder:text-fuji-foreground-subtle",
          )}
        />
        <NumberField.Increment
          className={cn(
            NATIVE_CONTROL_RESET,
            "fj:flex fj:shrink-0 fj:items-center fj:justify-center fj:px-2.5 fj:text-fuji-foreground-muted fj:hover:text-fuji-foreground fj:disabled:pointer-events-none fj:disabled:opacity-30",
          )}
          aria-label="Increase value"
        >
          <Plus className="fj:size-3.5" />
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  );
});
