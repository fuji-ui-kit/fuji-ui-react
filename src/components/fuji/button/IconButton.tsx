"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../../lib/cn";
import type { ComponentAppearance, ComponentSize, ComponentTone } from "../../../types";
import { appearanceClasses } from "../lib/appearance";
import { iconButtonBase } from "./button.styles";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ComponentSize;
  tone?: ComponentTone;
  appearance?: ComponentAppearance;
  loading?: boolean;
  /** Required - icon-only controls must still have an accessible name. */
  "aria-label": string;
  children: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    size = "md",
    tone = "default",
    appearance = "ghost",
    loading = false,
    disabled,
    className,
    children,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        iconButtonBase({ size }),
        appearanceClasses(tone, appearance),
        "fj:hover:brightness-[1.04] fj:active:brightness-[0.97]",
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="fj:size-4 fj:animate-spin" aria-hidden="true" /> : children}
    </button>
  );
});
