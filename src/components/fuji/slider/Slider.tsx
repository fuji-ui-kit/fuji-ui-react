"use client";

import * as React from "react";
import { Slider as Base } from "@base-ui/react/slider";
import { cn } from "../../../lib/cn";
import type { ComponentSize, ComponentTone } from "../../../types";

export interface SliderProps extends React.ComponentPropsWithoutRef<typeof Base.Root> {
  /** Text above the track. Also the control's accessible name. */
  label?: React.ReactNode;
  /** Shows the current numeric value next to the label. */
  showValue?: boolean;
  className?: string;
  /** Color of the filled track. Default "default". */
  tone?: ComponentTone;
  /** Track thickness and thumb size. Default "md". */
  size?: ComponentSize;
  /**
   * Accessible name for the slider when there is no visible `label`. Applied
   * to the focusable thumb input(s) - the `role="slider"` element a screen
   * reader actually lands on - not to the wrapping group. For a range slider
   * every thumb gets the same name; use `getAriaLabel` to tell them apart.
   */
  "aria-label"?: string;
  /**
   * Points at an existing visible label's id, as an alternative to
   * `aria-label`. Names every thumb.
   */
  "aria-labelledby"?: string;
  /**
   * Per-thumb accessible name, called with each thumb's index - for a range
   * slider, e.g. `(index) => (index === 0 ? "Minimum price" : "Maximum price")`.
   * Takes precedence over `aria-label`.
   */
  getAriaLabel?: (index: number) => string;
}

// Filled-track color per tone - written out in full for the Tailwind scanner.
const TONE_CLASSES: Record<ComponentTone, string> = {
  default: "fj:bg-fuji-default",
  forest: "fj:bg-fuji-forest",
  sun: "fj:bg-fuji-sun",
  fire: "fj:bg-fuji-fire",
  water: "fj:bg-fuji-water",
};

// Track height + thumb diameter per size - written out in full for the
// Tailwind scanner (see lib/appearance.ts's own comment for why this can't
// be templated).
const TRACK_SIZE_CLASSES: Record<ComponentSize, string> = {
  sm: "fj:h-1",
  md: "fj:h-1.5",
  lg: "fj:h-2.5",
};

const THUMB_SIZE_CLASSES: Record<ComponentSize, string> = {
  sm: "fj:size-3.5",
  md: "fj:size-4",
  lg: "fj:size-5",
};

/** Single or range slider (wraps Base UI Slider). */
export const Slider = React.forwardRef<HTMLDivElement, SliderProps>(function Slider(
  {
    label,
    showValue = false,
    tone = "default",
    size = "md",
    className,
    "aria-label": ariaLabel,
    getAriaLabel,
    ...props
  },
  ref,
) {
  // One thumb per value. A range (`[20, 80]`) used to render a single thumb,
  // so the second value had no handle at all. The count follows the shape of
  // `value` (or `defaultValue`); `index` is what Base UI needs to position
  // multiple thumbs during SSR.
  const valueShape = props.value ?? props.defaultValue;
  const thumbCount = Array.isArray(valueShape) ? Math.max(valueShape.length, 1) : 1;

  return (
    // `aria-labelledby` stays in `props`: Base UI's Root already hands it to
    // every thumb. `aria-label` is not forwarded that way - on the Root it only
    // named the wrapping group, leaving the focusable slider itself unnamed.
    <Base.Root ref={ref} className={cn("fj:w-full", className)} {...props}>
      {(label || showValue) && (
        <div className="fj:mb-1.5 fj:flex fj:items-center fj:justify-between fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground">
          {label && <Base.Label>{label}</Base.Label>}
          {showValue && <Base.Value className="fj:text-fuji-foreground-muted" />}
        </div>
      )}
      <Base.Control className="fj:box-border fj:flex fj:w-full fj:touch-none fj:cursor-pointer fj:items-center fj:py-2 fj:select-none">
        <Base.Track
          className={cn(
            "fj:relative fj:w-full fj:rounded-full fj:bg-fuji-surface-strong fj:shadow-fuji-control fj:select-none",
            TRACK_SIZE_CLASSES[size],
          )}
        >
          <Base.Indicator className={cn("fj:rounded-full fj:select-none", TONE_CLASSES[tone])} />
          {Array.from({ length: thumbCount }, (_, index) => (
            <Base.Thumb
              key={index}
              index={thumbCount > 1 ? index : undefined}
              aria-label={ariaLabel}
              getAriaLabel={getAriaLabel}
              className={cn(
                // `box-border`: same no-preflight reason as Checkbox - `size-*`
                // plus a 1px border rendered the thumb 2px wider than declared,
                // so it sat slightly proud of the track it rides in.
                "fj:box-border fj:block fj:rounded-full fj:border fj:border-fuji-border-strong fj:bg-fuji-surface fj:shadow-fuji-control fj:select-none fj:focus-visible:outline fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
                THUMB_SIZE_CLASSES[size],
              )}
            />
          ))}
        </Base.Track>
      </Base.Control>
    </Base.Root>
  );
});
