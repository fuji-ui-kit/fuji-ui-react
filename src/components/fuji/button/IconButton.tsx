"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../../lib/cn";
import type { ComponentAppearance, ComponentSize, ComponentTone } from "../../../types";
import { appearanceClasses } from "../lib/appearance";
import { useRipple } from "../lib/use-ripple";
import { iconButtonBase } from "./button.styles";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Control size - the square is sized to match `Button` at the same value. */
  size?: ComponentSize;
  /** Decorative color. */
  tone?: ComponentTone;
  /** Visual treatment. Defaults to `"ghost"`, unlike `Button` - an icon-only
   *  control is usually secondary to the thing it sits beside. */
  appearance?: ComponentAppearance;
  /** Swaps the icon for a spinner and disables interaction. */
  loading?: boolean;
  /** Required - icon-only controls must still have an accessible name. */
  "aria-label": string;
  /**
   * Plays a pointer-origin ripple on press. On by default, matching Button -
   * a press should feel the same on both. Pass `false` to suppress it. Does
   * nothing under `prefers-reduced-motion: reduce`.
   */
  ripple?: boolean;
  /** The icon. Required - there is nothing else to render. */
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
    ripple = true,
    onPointerDown,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;
  const playRipple = useRipple(ripple && !isDisabled);
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      onPointerDown={(event) => {
        playRipple(event);
        onPointerDown?.(event);
      }}
      className={cn(
        iconButtonBase({ size }),
        ripple && "fuji-ripple",
        appearanceClasses(tone, appearance),
        "fj:hover:brightness-[1.04] fj:active:brightness-[0.97]",
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="fj:size-4 fj:animate-fuji-spin" aria-hidden="true" /> : children}
    </button>
  );
});
