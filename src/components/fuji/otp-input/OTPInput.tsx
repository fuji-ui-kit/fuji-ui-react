"use client";

import * as React from "react";
import { OTPField } from "@base-ui/react/otp-field";
import { cn } from "../../../lib/cn";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";
import type { ComponentSize } from "../../../types";

export interface OTPInputProps extends Omit<React.ComponentPropsWithoutRef<typeof OTPField.Root>, "render"> {
  /** Height of each cell. */
  size?: ComponentSize;
  /** Paints the error state across every cell - a wrong code, not a wrong digit. */
  invalid?: boolean;
}

const SLOT_SIZE: Record<ComponentSize, string> = {
  sm: "fj:size-8 fj:text-[length:var(--fuji-text-sm)]",
  md: "fj:size-10 fj:text-[length:var(--fuji-text-base)]",
  lg: "fj:size-12 fj:text-[length:var(--fuji-text-md)]",
};

/** One-time-code entry - a row of individually-focusable character slots. */
export const OTPInput = React.forwardRef<HTMLDivElement, OTPInputProps>(function OTPInput(
  {
    size = "md",
    invalid,
    length,
    className,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    ...props
  },
  ref,
) {
  // Base UI labels each slot from the field-level name via aria-labelledby (it
  // rejects a per-input aria-label on the first slot). When the caller gives no
  // labelledby, render a visually hidden label and point the field at it.
  const generatedLabelId = React.useId();
  const labelId = ariaLabelledBy ?? generatedLabelId;
  // Base UI's <OTPField.Input> always honors an explicit per-slot
  // `aria-labelledby` (unlike `aria-label`, which it silently drops on the
  // first slot), so chaining the field label with a hidden "Digit N of M"
  // span here works uniformly across every slot.
  const slotLabelIdBase = React.useId();
  return (
    <>
      {!ariaLabelledBy && (
        <span id={generatedLabelId} className="fj:sr-only">
          {ariaLabel ?? "One-time code"}
        </span>
      )}
      <OTPField.Root
        ref={ref}
        length={length}
        aria-labelledby={labelId}
        // Spread instead of `data-invalid={invalid ? "" : undefined}`:
        // `OTPField.Root` calls Base UI's Field context hook itself and
        // registers as the field control (confirmed by reading Base UI's
        // source - `OTPFieldRoot` calls `useFieldRootContext()` and maps its
        // `state.valid` to `data-invalid`/`data-valid` via
        // `stateAttributesMapping`), so it already mirrors an ancestor
        // `<FormField invalid>` onto this same `role="group"` element as
        // `data-invalid` automatically - same mechanism as `Field.Control`
        // (see Input.tsx). An explicit `undefined`-valued prop still
        // occupies the key, and `useRenderElement` merges this component's
        // own props over that computed value, so writing `undefined` here
        // erased the FormField-driven attribute on the group whenever this
        // `invalid` prop itself was left unset. This one has no visible
        // consequence today - the group carries no `data-[invalid]:` style
        // of its own, and each `<OTPField.Input>` slot below independently
        // and correctly mirrors the same ambient state onto itself (that's
        // what actually paints the red border per slot) - but it is the
        // identical clobbering bug on the group's own DOM attribute, which
        // a consumer styling or querying `[data-invalid]` on the group
        // itself would still see erased. Omitting the key when `invalid` is
        // falsy instead of asserting `undefined` lets that ambient value
        // through, for consistency with every other Field-participating
        // element Fuji wraps.
        {...(invalid ? { "data-invalid": "" } : null)}
        className={cn("fj:flex fj:gap-2", className)}
        {...props}
      >
        {Array.from({ length }, (_, index) => {
          const slotLabelId = `${slotLabelIdBase}-${index}`;
          return (
            <React.Fragment key={index}>
              <span id={slotLabelId} className="fj:sr-only">
                {`Digit ${index + 1} of ${length}`}
              </span>
              <OTPField.Input
                aria-labelledby={`${labelId} ${slotLabelId}`}
                {...(invalid ? { "aria-invalid": true, "data-invalid": "" } : null)}
                className={cn(
                  NATIVE_CONTROL_RESET,
                  "fj:rounded-fuji-control fj:border fj:border-fuji-border-strong fj:bg-fuji-surface fj:text-center fj:font-medium fj:text-fuji-foreground fj:outline-none",
                  "fj:transition-[border-color] fj:duration-[var(--fuji-duration-fast)]",
                  "fj:focus-visible:border-fuji-foreground",
                  "fj:data-[invalid]:border-fuji-fire fj:disabled:opacity-45",
                  SLOT_SIZE[size],
                )}
              />
            </React.Fragment>
          );
        })}
      </OTPField.Root>
    </>
  );
});
