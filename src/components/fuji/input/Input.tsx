"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Input as BaseInput } from "@base-ui/react/input";
import { cn } from "../../../lib/cn";
import type { ComponentSize } from "../../../types";
import { fieldSurface } from "../lib/field-surface";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

export interface InputProps extends Omit<React.ComponentPropsWithoutRef<typeof BaseInput>, "size"> {
  size?: ComponentSize;
  /** Manually flags the invalid visual/aria state for standalone use outside a FormField. */
  invalid?: boolean;
  /** Content rendered inside the field, before the text (icon, currency symbol). */
  startSlot?: React.ReactNode;
  /** Content rendered inside the field, after the text. */
  endSlot?: React.ReactNode;
  /**
   * Shows an unboxed "X" button once there is a value, clearing it on click.
   * Works uncontrolled and controlled: it updates the DOM value directly and
   * fires a native `input` event, so an `onChange` handler sees the change
   * either way. Renders alongside `endSlot` if both are given.
   */
  clearable?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    size = "md",
    invalid,
    startSlot,
    endSlot,
    clearable = false,
    value,
    defaultValue,
    onChange,
    className,
    ...props
  },
  ref,
) {
  const [hasValue, setHasValue] = React.useState(Boolean(value ?? defaultValue));
  const innerRef = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

  const clearButton = clearable && hasValue && (
    <button
      type="button"
      aria-label="Clear"
      onClick={() => {
        const input = innerRef.current;
        if (!input) return;
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
        setter?.call(input, "");
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.focus();
      }}
      className={cn(
        NATIVE_CONTROL_RESET,
        "fj:flex fj:cursor-pointer fj:items-center fj:rounded-sm fj:text-fuji-foreground-subtle fj:hover:text-fuji-foreground",
      )}
    >
      <X className="fj:size-4" />
    </button>
  );

  const handleChange: typeof onChange = clearable
    ? (event) => {
        setHasValue(event.target.value.length > 0);
        onChange?.(event);
      }
    : onChange;

  if (!startSlot && !endSlot && !clearable) {
    return (
      <BaseInput
        ref={innerRef}
        data-invalid={invalid ? "" : undefined}
        aria-invalid={invalid}
        className={cn(fieldSurface({ size }), className)}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        {...props}
      />
    );
  }

  return (
    <div
      data-invalid={invalid ? "" : undefined}
      className={cn(
        fieldSurface({ size }),
        "fj:flex fj:items-center fj:gap-2 fj:has-disabled:opacity-45",
        className,
      )}
    >
      {startSlot && (
        <span className="fj:flex fj:shrink-0 fj:items-center fj:text-fuji-foreground-subtle">
          {startSlot}
        </span>
      )}
      <BaseInput
        ref={innerRef}
        data-invalid={invalid ? "" : undefined}
        aria-invalid={invalid}
        className={cn(
          NATIVE_CONTROL_RESET,
          "fj:h-full fj:w-full fj:min-w-0 fj:border-none fj:bg-transparent fj:p-0 fj:shadow-none fj:outline-none fj:placeholder:text-fuji-foreground-subtle",
        )}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        {...props}
      />
      {(endSlot || clearButton) && (
        <span className="fj:flex fj:shrink-0 fj:items-center fj:gap-1 fj:text-fuji-foreground-subtle">
          {endSlot}
          {clearButton}
        </span>
      )}
    </div>
  );
});
