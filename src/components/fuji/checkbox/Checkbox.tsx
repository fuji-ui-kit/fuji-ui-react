"use client";

import * as React from "react";
import { Check, Minus } from "lucide-react";
import { Checkbox as Base } from "@base-ui/react/checkbox";
import { cn } from "../../../lib/cn";
import type { ComponentTone } from "../../../types";

export interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof Base.Root> {
  /** Renders a leading label next to the box. Omit and wrap in your own <label> for custom layouts. */
  label?: React.ReactNode;
  /** Color used once checked/indeterminate. Default "default". */
  tone?: ComponentTone;
}

// Checked/indeterminate fill per tone - written out in full for the Tailwind
// scanner (see lib/appearance.ts's own comment for why this can't be templated).
const TONE_CLASSES: Record<ComponentTone, string> = {
  default:
    "fj:data-[checked]:border-fuji-default fj:data-[checked]:bg-fuji-default fj:data-[checked]:text-fuji-default-foreground fj:data-[indeterminate]:border-fuji-default fj:data-[indeterminate]:bg-fuji-default fj:data-[indeterminate]:text-fuji-default-foreground",
  earth:
    "fj:data-[checked]:border-fuji-earth fj:data-[checked]:bg-fuji-earth fj:data-[checked]:text-fuji-earth-foreground fj:data-[indeterminate]:border-fuji-earth fj:data-[indeterminate]:bg-fuji-earth fj:data-[indeterminate]:text-fuji-earth-foreground",
  forest:
    "fj:data-[checked]:border-fuji-forest fj:data-[checked]:bg-fuji-forest fj:data-[checked]:text-fuji-forest-foreground fj:data-[indeterminate]:border-fuji-forest fj:data-[indeterminate]:bg-fuji-forest fj:data-[indeterminate]:text-fuji-forest-foreground",
  sun: "fj:data-[checked]:border-fuji-sun fj:data-[checked]:bg-fuji-sun fj:data-[checked]:text-fuji-sun-foreground fj:data-[indeterminate]:border-fuji-sun fj:data-[indeterminate]:bg-fuji-sun fj:data-[indeterminate]:text-fuji-sun-foreground",
  fire: "fj:data-[checked]:border-fuji-fire fj:data-[checked]:bg-fuji-fire fj:data-[checked]:text-fuji-fire-foreground fj:data-[indeterminate]:border-fuji-fire fj:data-[indeterminate]:bg-fuji-fire fj:data-[indeterminate]:text-fuji-fire-foreground",
  water:
    "fj:data-[checked]:border-fuji-water fj:data-[checked]:bg-fuji-water fj:data-[checked]:text-fuji-water-foreground fj:data-[indeterminate]:border-fuji-water fj:data-[indeterminate]:bg-fuji-water fj:data-[indeterminate]:text-fuji-water-foreground",
};

/** Tri-state capable checkbox (wraps Base UI Checkbox). */
export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(
  { label, tone = "default", className, id, ...props },
  ref,
) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;

  const control = (
    <Base.Root
      ref={ref}
      id={inputId}
      className={cn(
        "fj:flex fj:size-[18px] fj:shrink-0 fj:cursor-pointer fj:items-center fj:justify-center fj:rounded-[6px] fj:border fj:border-fuji-border-strong fj:bg-fuji-surface",
        "fj:transition-colors fj:duration-[var(--fuji-duration-fast)]",
        TONE_CLASSES[tone],
        "fj:focus-visible:outline fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
        "fj:disabled:cursor-not-allowed fj:disabled:opacity-45",
        "fj:data-[invalid]:border-fuji-fire",
        className,
      )}
      {...props}
    >
      <Base.Indicator className="fj:flex fj:data-[unchecked]:hidden">
        {props.indeterminate ? <Minus className="fj:size-3" /> : <Check className="fj:size-3" />}
      </Base.Indicator>
    </Base.Root>
  );

  if (!label) return control;

  return (
    <label
      htmlFor={inputId}
      className="fj:flex fj:cursor-pointer fj:items-center fj:gap-2 fj:text-[length:var(--fuji-text-base)] fj:text-fuji-foreground"
    >
      {control}
      {label}
    </label>
  );
});
