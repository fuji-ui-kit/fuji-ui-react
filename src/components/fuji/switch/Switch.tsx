"use client";

import * as React from "react";
import { Switch as Base } from "@base-ui/react/switch";
import { cn } from "../../../lib/cn";
import type { ComponentTone } from "../../../types";

export interface SwitchProps extends React.ComponentPropsWithoutRef<typeof Base.Root> {
  /** Text beside the switch. Clicking it toggles. Also the control's accessible name. */
  label?: React.ReactNode;
  /** Track/thumb color once on. Default "default". */
  tone?: ComponentTone;
}

// Track fill per tone - written out in full for the Tailwind scanner (see
// lib/appearance.ts's own comment for why this can't be templated).
const TONE_CLASSES: Record<ComponentTone, string> = {
  default: "fj:data-[checked]:border-fuji-default fj:data-[checked]:bg-fuji-default",
  forest: "fj:data-[checked]:border-fuji-forest fj:data-[checked]:bg-fuji-forest",
  sun: "fj:data-[checked]:border-fuji-sun fj:data-[checked]:bg-fuji-sun",
  fire: "fj:data-[checked]:border-fuji-fire fj:data-[checked]:bg-fuji-fire",
  water: "fj:data-[checked]:border-fuji-water fj:data-[checked]:bg-fuji-water",
};

const TONE_THUMB_CLASSES: Record<ComponentTone, string> = {
  default: "fj:data-[checked]:bg-fuji-default-foreground",
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
        // `box-border`: with no preflight, border/padding grew the track to 46px and the thumb
        // stopped 8px short when on. 44x24 track, 2px padding = 40x20 well; the 20px thumb travels
        // exactly the 20px spare, so both ends match.
        "fj:box-border fj:flex fj:h-6 fj:w-11 fj:shrink-0 fj:cursor-pointer fj:items-center fj:rounded-full fj:border-0 fj:bg-fuji-surface-strong fj:p-0.5",
        "fj:transition-colors fj:duration-[var(--fuji-duration-base)] fj:ease-[var(--fuji-ease)]",
        TONE_CLASSES[tone],
        "fj:focus-visible:outline fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
        // `Base.Root` is a `<span role="switch">`; `disabled` lives on the hidden `<input>`, so
        // `disabled:` never matches. Base UI mirrors it here as `data-disabled`.
        "fj:data-[disabled]:cursor-not-allowed fj:data-[disabled]:opacity-45",
        className,
      )}
      {...props}
    >
      <Base.Thumb
        className={cn(
          "fj:size-5 fj:rounded-full fj:bg-white",
          // A uniform circle hides `rotate-[220deg]`; this off-center inset bevel rotates with the
          // thumb, so the highlight visibly sweeps as it slides.
          "fj:shadow-[var(--fuji-switch-thumb-shadow)]",
          // "Rolling" thumb: translate + spin share the duration token, which
          // `prefers-reduced-motion: reduce` collapses to 0ms, removing both at once.
          "fj:transition-[translate,rotate,background-color] fj:duration-[var(--fuji-duration-base)] fj:ease-[var(--fuji-ease-spring)]",
          "fj:data-[checked]:translate-x-5 fj:data-[checked]:rotate-[220deg]",
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
