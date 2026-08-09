"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Field } from "@base-ui/react/field";
import { cn } from "../../../lib/cn";
import type { ComponentSize } from "../../../types";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: ComponentSize;
  invalid?: boolean;
  /**
   * Shows an unboxed "X" button once there is a value, clearing it on click.
   * Works uncontrolled and controlled: it updates the DOM value directly and
   * fires a native `input` event, so an `onChange` handler sees the change
   * either way.
   */
  clearable?: boolean;
}

const SIZE_CLASSES: Record<ComponentSize, string> = {
  sm: "fj:min-h-20 fj:px-2.5 fj:py-2 fj:text-[length:var(--fuji-text-sm)]",
  md: "fj:min-h-24 fj:px-3 fj:py-2.5 fj:text-[length:var(--fuji-text-base)]",
  lg: "fj:min-h-32 fj:px-3.5 fj:py-3 fj:text-[length:var(--fuji-text-md)]",
};

/**
 * Renders through Base UI's `Field.Control` (typed for `<input>`, hence the cast below) so it
 * auto-registers with an ancestor `FormField`/`Field.Root` the same way Input does - a bare
 * `<textarea>` here would leave `FormField.Label` with no control to point `htmlFor` at.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { size = "md", invalid, clearable = false, value, defaultValue, onChange, className, ...props },
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
        data-invalid={invalid ? "" : undefined}
        aria-invalid={invalid}
        value={value}
        defaultValue={defaultValue}
        onChange={(event) => {
          if (clearable) setHasValue(event.target.value.length > 0);
          onChange?.(event as unknown as React.ChangeEvent<HTMLTextAreaElement>);
        }}
        className={cn(
          NATIVE_CONTROL_RESET,
          "fuji-glass-surface-strong fj:w-full fj:min-w-0 fj:resize-y fj:rounded-fuji-control fj:border fj:border-fuji-border-strong fj:bg-fuji-surface fj:text-fuji-foreground",
          "fj:placeholder:text-fuji-foreground-subtle fj:outline-none",
          "fj:transition-[border-color,box-shadow] fj:duration-[var(--fuji-duration-fast)] fj:ease-[var(--fuji-ease)]",
          "fj:focus-visible:border-fuji-foreground fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
          "fj:disabled:cursor-not-allowed fj:disabled:opacity-45",
          "fj:data-[invalid]:border-fuji-fire fj:data-[invalid]:focus-visible:border-fuji-fire",
          "fj:read-only:bg-fuji-surface-subtle",
          SIZE_CLASSES[size],
          clearable && "fj:pr-8",
          className,
        )}
        {...(props as React.ComponentPropsWithRef<"input">)}
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
            "fj:absolute fj:top-2 fj:right-2 fj:flex fj:cursor-pointer fj:items-center fj:rounded-sm fj:text-fuji-foreground-subtle fj:hover:text-fuji-foreground",
          )}
        >
          <X className="fj:size-4" />
        </button>
      )}
    </div>
  );
});
