"use client";

import * as React from "react";
import { Switch as Base } from "@base-ui/react/switch";
import { cn } from "../../../lib/cn";
import type { ComponentTone } from "../../../types";

export interface SwitchProps extends React.ComponentPropsWithoutRef<typeof Base.Root> {
  label?: React.ReactNode;
  /** Track/thumb color once on. Default "default". */
  tone?: ComponentTone;
}

// Track fill per tone - written out in full for the Tailwind scanner (see
// lib/appearance.ts's own comment for why this can't be templated).
const TONE_CLASSES: Record<ComponentTone, string> = {
  default: "fj:data-[checked]:border-fuji-default fj:data-[checked]:bg-fuji-default",
  earth: "fj:data-[checked]:border-fuji-earth fj:data-[checked]:bg-fuji-earth",
  forest: "fj:data-[checked]:border-fuji-forest fj:data-[checked]:bg-fuji-forest",
  sun: "fj:data-[checked]:border-fuji-sun fj:data-[checked]:bg-fuji-sun",
  fire: "fj:data-[checked]:border-fuji-fire fj:data-[checked]:bg-fuji-fire",
  water: "fj:data-[checked]:border-fuji-water fj:data-[checked]:bg-fuji-water",
};

const TONE_THUMB_CLASSES: Record<ComponentTone, string> = {
  default: "fj:data-[checked]:bg-fuji-default-foreground",
  earth: "fj:data-[checked]:bg-fuji-earth-foreground",
  forest: "fj:data-[checked]:bg-fuji-forest-foreground",
  sun: "fj:data-[checked]:bg-fuji-sun-foreground",
  fire: "fj:data-[checked]:bg-fuji-fire-foreground",
  water: "fj:data-[checked]:bg-fuji-water-foreground",
};

/** On/off toggle (wraps Base UI Switch) with a rolling sliding thumb. */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
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
        "fj:flex fj:h-6 fj:w-10 fj:shrink-0 fj:cursor-pointer fj:items-center fj:rounded-full fj:border fj:border-fuji-border-strong fj:bg-fuji-surface fj:p-0.5",
        "fj:transition-colors fj:duration-[var(--fuji-duration-base)] fj:ease-[var(--fuji-ease)]",
        TONE_CLASSES[tone],
        "fj:focus-visible:outline fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
        "fj:disabled:cursor-not-allowed fj:disabled:opacity-45",
        className,
      )}
      {...props}
    >
      <Base.Thumb
        className={cn(
          "fj:size-4 fj:rounded-full fj:bg-fuji-foreground-subtle",
          // A plain, uniformly-colored circle looks identical at any
          // rotation, so `rotate-[220deg]` alone was an invisible effect - a
          // real "roll" needs some asymmetric detail on the thumb's face to
          // reveal the spin. This inset bevel (an off-center highlight/
          // shadow, like a glossy bead) rotates together with the thumb as
          // one painted unit, so the highlight visibly sweeps around the
          // thumb as it slides - not just a solid dot shifting sideways.
          "fj:shadow-[var(--fuji-switch-thumb-shadow)]",
          // "Rolling" thumb: the translate and a partial spin play together
          // (both driven by the same token-based duration/easing, so
          // `prefers-reduced-motion: reduce` - which collapses that token to
          // 0ms globally - removes both at once with no separate override
          // needed here).
          "fj:transition-[translate,rotate,background-color] fj:duration-[var(--fuji-duration-base)] fj:ease-[var(--fuji-ease)]",
          "fj:data-[checked]:translate-x-4 fj:data-[checked]:rotate-[220deg]",
          TONE_THUMB_CLASSES[tone],
        )}
      />
    </Base.Root>
  );

  if (!label) return control;

  return (
    <label
      htmlFor={inputId}
      className="fj:flex fj:cursor-pointer fj:items-center fj:justify-between fj:gap-3 fj:text-[length:var(--fuji-text-base)] fj:text-fuji-foreground"
    >
      {label}
      {control}
    </label>
  );
});
