"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Input as BaseInput } from "@base-ui/react/input";
import { cn } from "../../../lib/cn";
import type { ComponentSize } from "../../../types";
import { fieldSurface } from "../lib/field-surface";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

export interface InputProps extends Omit<React.ComponentPropsWithoutRef<typeof BaseInput>, "size"> {
  /** Control height and padding, matching `Button` at the same value. */
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
        "fj:flex fj:cursor-pointer fj:items-center fj:rounded-fuji-item fj:text-fuji-foreground-subtle fj:hover:text-fuji-foreground",
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
        // Spread instead of `data-invalid={invalid ? "" : undefined}`: Base
        // UI's `Field.Control` (what `BaseInput` renders through) already
        // mirrors an ancestor `<FormField invalid>`'s state onto this same
        // element as `data-invalid` automatically. An explicit prop with an
        // `undefined` value still occupies the key, and `useRenderElement`
        // merges this component's own props over that computed value - so
        // writing `undefined` here erased the FormField-driven attribute
        // whenever this `invalid` prop itself was left unset, and the
        // `data-[invalid]:border-fuji-fire` border never painted (see
        // FormField.tsx). Omitting the key when `invalid` is falsy instead
        // of asserting `undefined` lets that ambient value through.
        {...(invalid ? { "data-invalid": "" } : null)}
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
      // Unlike the branch above, the visible bordered box here is a plain
      // `<div>` (the real `<input>` inside it is deliberately borderless -
      // see its className below) - not a Base UI element, so nothing ever
      // mirrors an ancestor `<FormField invalid>` onto *it* the way
      // `Field.Control` does onto `BaseInput`. Tried reading that ambient
      // state directly: Base UI's only public accessor for it,
      // `Field.Validity`, calls its own field-context hook as *required*
      // (throws "FieldRootContext is missing" with no `<Field.Root>`
      // ancestor - confirmed by rendering it standalone), which would break
      // this component's documented standalone use outside a FormField (see
      // `invalid`'s doc comment above); the only alternative that avoids
      // that crash is Base UI's own internal field-context hook, which this
      // package has deliberately never taken a dependency on. So instead of
      // reading the ambient value into a prop here, react to it the same
      // way this div already reacts to a real `:disabled` on a descendant
      // it isn't itself (`has-disabled` right below): `<BaseInput>` inside
      // *does* correctly mirror the ambient `data-invalid` onto itself
      // (untouched fix below), so `has-[[data-invalid]]:border-fuji-fire`
      // paints this box from that descendant's already-correct state,
      // local `invalid` prop included - without this box ever needing to
      // read Field context itself. Fails before the fix (this box has no
      // `data-[invalid]:` rule that can react to anything outside itself,
      // so `<Input startSlot={...}/>` inside a `<FormField invalid>` never
      // painted the border a plain `<Input/>` there does); passes after.
      className={cn(
        fieldSurface({ size }),
        "fj:flex fj:items-center fj:gap-2 fj:has-disabled:opacity-45 fj:has-[[data-invalid]]:border-fuji-fire",
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
        // Same reasoning as the standalone branch above.
        {...(invalid ? { "data-invalid": "" } : null)}
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
