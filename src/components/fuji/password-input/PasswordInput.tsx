"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../../lib/cn";
import { Input, type InputProps } from "../input/Input";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

export type PasswordInputProps = Omit<InputProps, "type" | "endSlot">;

/** Input with a visibility toggle. Defaults to obscured; toggling never clears the value. */
export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(props, ref) {
    const [visible, setVisible] = React.useState(false);
    return (
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        autoComplete="current-password"
        endSlot={
          <button
            type="button"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
            className={cn(
              NATIVE_CONTROL_RESET,
              "fj:flex fj:cursor-pointer fj:items-center fj:rounded-sm fj:text-fuji-foreground-subtle fj:hover:text-fuji-foreground",
            )}
          >
            {visible ? <EyeOff className="fj:size-4" /> : <Eye className="fj:size-4" />}
          </button>
        }
        {...props}
      />
    );
  },
);
