"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Field } from "@base-ui/react/field";
import { cn } from "../../../lib/cn";
import type { ComponentSize } from "../../../types";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Padding and text scale, matching `Input` at the same value. */
  size?: ComponentSize;
  /** Paints the error state. Pair with `FormField`'s `error` for the message. */
  invalid?: boolean;
  /**
   * Shows an "X" button once there is a value that clears it. Works controlled or uncontrolled:
   * it sets the DOM value and fires a native `input` event, so `onChange` sees the change.
   */
  clearable?: boolean;
  /**
   * Visible text lines. Without it, `size` sets a min height (5rem / 6rem / 8rem for `sm` / `md` /
   * `lg`); with it the box is exactly `rows` tall, so `rows={1}` gives a growable one-line composer.
   */
  rows?: number;
}

const SIZE_CLASSES: Record<ComponentSize, string> = {
  sm: "fj:px-2.5 fj:py-2 fj:text-[length:var(--fuji-text-sm)]",
  md: "fj:px-3 fj:py-2.5 fj:text-[length:var(--fuji-text-base)]",
  lg: "fj:px-3.5 fj:py-3 fj:text-[length:var(--fuji-text-md)]",
};

// Only applied when `rows` is absent. `min-height` beats `height`, so with it
// always on, `rows={1}` still rendered a 96px box and a one-line auto-growing
// composer was impossible without a `min-h-0` override.
const MIN_HEIGHT_CLASSES: Record<ComponentSize, string> = {
  sm: "fj:min-h-20",
  md: "fj:min-h-24",
  lg: "fj:min-h-32",
};

/**
 * Renders via `Field.Control` (typed for `<input>`, hence the cast) so it registers with an
 * ancestor `FormField` like Input; a bare `<textarea>` leaves `FormField.Label` no `htmlFor` target.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { size = "md", invalid, clearable = false, rows, value, defaultValue, onChange, className, ...props },
  ref,
) {
  const [hasValue, setHasValue] = React.useState(Boolean(value ?? defaultValue));
  const innerRef = React.useRef<HTMLTextAreaElement>(null);
  React.useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement);

  return (
    <div className={cn("fj:relative", clearable && "fj:w-full")}>
      <Field.Control
        render={<textarea />}
        ref={innerRef as unknown as React.Ref<HTMLElement>}
        // Spread, not `data-invalid={invalid ? "" : undefined}`: an explicit `undefined` wins the
        // merge and erases the `data-invalid` Field.Control mirrors from `<FormField invalid>`.
        // Omitting the key lets it through (see Input.tsx / FormField.tsx).
        {...(invalid ? { "data-invalid": "" } : null)}
        aria-invalid={invalid}
        value={value}
        defaultValue={defaultValue}
        onChange={(event) => {
          if (clearable) setHasValue(event.target.value.length > 0);
          onChange?.(event as unknown as React.ChangeEvent<HTMLTextAreaElement>);
        }}
        className={cn(
          NATIVE_CONTROL_RESET,
          "fj:w-full fj:min-w-0 fj:resize-y fj:rounded-fuji-control fj:border fj:border-fuji-border-strong fj:bg-fuji-surface fj:text-fuji-foreground",
          "fj:placeholder:text-fuji-foreground-subtle fj:outline-none",
          "fj:transition-[border-color,box-shadow] fj:duration-[var(--fuji-duration-fast)] fj:ease-[var(--fuji-ease)]",
          "fj:focus-visible:border-fuji-foreground fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
          "fj:disabled:cursor-not-allowed fj:disabled:opacity-45",
          "fj:data-[invalid]:border-fuji-fire fj:data-[invalid]:focus-visible:border-fuji-fire",
          "fj:read-only:bg-fuji-surface-subtle",
          SIZE_CLASSES[size],
          rows === undefined && MIN_HEIGHT_CLASSES[size],
          clearable && "fj:pr-8",
          className,
        )}
        {...({ ...props, rows } as React.ComponentPropsWithRef<"input">)}
      />
      {clearable && hasValue && (
        <button
          type="button"
          aria-label="Clear"
          onClick={() => {
            const textarea = innerRef.current;
            if (!textarea) return;
            const setter = Object.getOwnPropertyDescriptor(
              window.HTMLTextAreaElement.prototype,
              "value",
            )?.set;
            setter?.call(textarea, "");
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
            textarea.focus();
          }}
          className={cn(
            NATIVE_CONTROL_RESET,
            "fj:absolute fj:top-2 fj:right-2 fj:flex fj:cursor-pointer fj:items-center fj:rounded-fuji-item fj:text-fuji-foreground-subtle fj:hover:text-fuji-foreground",
          )}
        >
          <X className="fj:size-4" />
        </button>
      )}
    </div>
  );
});
