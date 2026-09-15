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
        // Unchecked is a soft grey well (no border); checked becomes a raised
        // tone tile - the reference's checkbox, and the same selected /
        // unselected language as Pagination and SegmentedControl.
        // The well carries a hairline inset (not a border) so it still reads
        // on the page background, where surface-strong alone is near-invisible.
        // `box-border` is load-bearing: no preflight ships with this package,
        // so `size-5` alongside a 1px border rendered a 22px box instead of
        // the declared 20px, throwing off alignment with the adjacent label.
        "fj:box-border fj:flex fj:size-5 fj:shrink-0 fj:cursor-pointer fj:items-center fj:justify-center fj:rounded-fuji-item fj:border fj:border-transparent fj:bg-fuji-surface-strong fj:[box-shadow:inset_0_0_0_1px_var(--fuji-border-strong)]",
        "fj:transition-[background-color,color,box-shadow,transform] fj:duration-[var(--fuji-duration-fast)] fj:ease-[var(--fuji-ease-spring)]",
        "fj:data-[checked]:[box-shadow:var(--fuji-shadow-raised)] fj:data-[indeterminate]:[box-shadow:var(--fuji-shadow-raised)] fj:data-[checked]:scale-105 fj:data-[indeterminate]:scale-105",
        TONE_CLASSES[tone],
        "fj:focus-visible:outline fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
        // `Base.Root` renders a `<span role="checkbox">`, not a native form
        // control - the real `disabled` attribute lives on Base UI's
        // visually-hidden `<input>` beside it, so a `disabled:` pseudo-class
        // here can never match and this box rendered pixel-identical whether
        // enabled or disabled. Base UI does mirror the disabled state onto
        // this element as `data-disabled`, so the attribute variant is the
        // one that actually fires.
        "fj:data-[disabled]:cursor-not-allowed fj:data-[disabled]:opacity-45",
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
