import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../../../lib/cn";
import type { ComponentTone } from "../../../types";
import { appearanceClasses, softClasses } from "../lib/appearance";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

/** "soft" (default): tone-tinted background, no border - never the loud
 *  contained fill. "solid": the full tone fill, for higher emphasis.
 *  "bordered": transparent background with a tone-colored outline. */
export type BadgeAppearance = "soft" | "solid" | "bordered";

/** "rounded" (default): full pill. "square": the same control-radius corners as Button/Input. */
export type BadgeShape = "rounded" | "square";

const SHAPE_CLASSES: Record<BadgeShape, string> = {
  rounded: "fj:rounded-full",
  square: "fj:rounded-fuji-control",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: ComponentTone;
  /** Fill style. Default "soft". */
  appearance?: BadgeAppearance;
  /** Corner shape. Default "rounded". */
  shape?: BadgeShape;
  /** Shows a small dismiss control and calls back when it's clicked. */
  onRemove?: () => void;
  /** Accessible name for the dismiss control. Default "Remove". */
  removeLabel?: string;
}

/** Small status/count/filter pill - soft-tinted by default, never the loud contained tone. */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    tone = "default",
    appearance = "soft",
    shape = "rounded",
    onRemove,
    removeLabel = "Remove",
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        "fj:inline-flex fj:items-center fj:gap-1.5 fj:px-2.5 fj:py-1 fj:text-[length:var(--fuji-text-xs)] fj:font-medium",
        SHAPE_CLASSES[shape],
        appearance === "soft"
          ? softClasses(tone)
          : appearanceClasses(tone, appearance === "solid" ? "contained" : "bordered"),
        className,
      )}
      {...props}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          aria-label={removeLabel}
          onClick={onRemove}
          className={cn(
            NATIVE_CONTROL_RESET,
            "fj:flex fj:size-3.5 fj:cursor-pointer fj:items-center fj:justify-center fj:opacity-70 fj:hover:opacity-100",
            SHAPE_CLASSES[shape],
          )}
        >
          <X className="fj:size-3" />
        </button>
      )}
    </span>
  );
});
