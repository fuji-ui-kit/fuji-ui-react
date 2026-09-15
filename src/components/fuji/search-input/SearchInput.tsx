"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "../../../lib/cn";
import { Input, type InputProps } from "../input/Input";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

export interface SearchInputProps extends Omit<InputProps, "type" | "startSlot" | "endSlot" | "clearable"> {
  /**
   * Shows the "X" clear button once there is a value. Default true.
   *
   * `SearchInput` owns its clear UI end-to-end - `Input`'s own `endSlot` and
   * `clearable` props are deliberately omitted above (not just unused) so a
   * consumer can never pass an `endSlot` that silently replaces this button,
   * or a `clearable` that renders a second, duplicate one alongside it.
   */
  clearable?: boolean;
}

/**
 * Input with a search icon and a clear button once there is a value. The
 * clear button updates the DOM value directly and fires a native `input`
 * event, so both controlled and uncontrolled usage see the change.
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, defaultValue, onChange, clearable = true, ...props },
  ref,
) {
  const [hasValue, setHasValue] = React.useState(Boolean(value ?? defaultValue));
  const innerRef = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

  return (
    <Input
      ref={innerRef}
      type="search"
      value={value}
      defaultValue={defaultValue}
      onChange={(event) => {
        setHasValue(event.target.value.length > 0);
        onChange?.(event);
      }}
      startSlot={<Search className="fj:size-4" aria-hidden="true" />}
      endSlot={
        clearable &&
        hasValue && (
          <button
            type="button"
            aria-label="Clear search"
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
        )
      }
      {...props}
    />
  );
});
