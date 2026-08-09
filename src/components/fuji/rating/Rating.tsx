"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "../../../lib/cn";
import { useControllableState } from "../../../hooks/useControllableState";
import type { ComponentSize, ComponentTone } from "../../../types";
import type { IconComponent } from "../icon/Icon";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

export interface RatingProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: ComponentSize;
  disabled?: boolean;
  readOnly?: boolean;
  /** Icon used for each item - any Lucide (or compatible SVG) component. Pass an individually imported component (default Star). */
  icon?: IconComponent;
  /** Color of the filled icons, resolved through Fuji tokens. Default "sun". */
  tone?: ComponentTone;
  /** Accessible name for the group, e.g. "Rate this product". */
  label: string;
  className?: string;
}

const SIZE_CLASSES: Record<ComponentSize, string> = {
  sm: "fj:size-4",
  md: "fj:size-5",
  lg: "fj:size-6",
};

// Filled color per tone - mirrors Icon.tsx's `TONE_TEXT` map so a rating's
// filled color always matches what the same tone renders as everywhere else.
// Kept as full class strings for the Tailwind scanner.
const TONE_CLASSES: Record<ComponentTone, { filled: string }> = {
  default: { filled: "fj:text-fuji-foreground" },
  earth: { filled: "fj:text-fuji-earth" },
  forest: { filled: "fj:text-fuji-forest" },
  sun: { filled: "fj:text-fuji-sun" },
  fire: { filled: "fj:text-fuji-fire" },
  water: { filled: "fj:text-fuji-water" },
};

/** Formats a rating value for accessible/visible text - whole numbers stay whole, others keep one decimal. */
function formatRatingValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/** Fraction (0-1) of `starValue` that `filledTo` fills, for fractional-star rendering. */
function starFillFraction(starValue: number, filledTo: number): number {
  return Math.max(0, Math.min(1, filledTo - (starValue - 1)));
}

/** Empty-icon base with a clipped, colored overlay covering `fraction` of its width - renders partial stars for values like 4.8. */
function StarFill({
  glyph: Glyph,
  fraction,
  sizeClass,
  filledClass,
}: {
  glyph: IconComponent;
  fraction: number;
  sizeClass: string;
  filledClass: string;
}) {
  return (
    <>
      <Glyph className={cn(sizeClass, "fj:text-fuji-foreground-subtle")} />
      {fraction > 0 && (
        <span
          className="fj:absolute fj:inset-y-0 fj:left-0 fj:overflow-hidden"
          style={{ width: `${fraction * 100}%` }}
        >
          <Glyph className={cn(sizeClass, "fj:fill-current", filledClass)} />
        </span>
      )}
    </>
  );
}

/**
 * Icon rating input - a row of toggleable icons with radiogroup semantics and
 * arrow-key navigation. The shape (`icon`) and color (`tone`) are configurable
 * through props; supports controlled/uncontrolled value, custom `max`,
 * `readOnly`, and `disabled`. Fractional values (e.g. 4.8) render a partially
 * filled star.
 *
 * `readOnly` renders a static, non-focusable `role="img"` rather than a
 * radiogroup - a read-only rating is a value display, not an input, so it
 * must not expose interactive/radio semantics or take a tab stop.
 */
export const Rating = React.forwardRef<HTMLDivElement, RatingProps>(function Rating(
  {
    value,
    defaultValue = 0,
    onChange,
    max = 5,
    size = "md",
    disabled,
    readOnly,
    icon: Glyph = Star,
    tone = "sun",
    label,
    className,
  },
  ref,
) {
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange });
  const [hovered, setHovered] = React.useState<number | null>(null);
  const displayValue = hovered ?? current;
  const interactive = !disabled && !readOnly;
  const toneClasses = TONE_CLASSES[tone];

  if (readOnly) {
    const valueText = formatRatingValue(current);
    return (
      <div
        ref={ref}
        role="img"
        aria-label={`${label}. Rated ${valueText} out of ${max}.`}
        className={cn("fj:inline-flex fj:items-center fj:gap-1", disabled && "fj:opacity-45", className)}
      >
        {Array.from({ length: max }, (_, index) => {
          const starValue = index + 1;
          return (
            <span key={starValue} aria-hidden="true" className="fj:relative fj:inline-flex">
              <StarFill
                glyph={Glyph}
                fraction={starFillFraction(starValue, current)}
                sizeClass={SIZE_CLASSES[size]}
                filledClass={toneClasses.filled}
              />
            </span>
          );
        })}
      </div>
    );
  }

  return (
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus -- roving tabindex: each star carries tabIndex 0/-1, not the container (WAI-ARIA composite widget pattern).
    <div
      ref={ref}
      role="radiogroup"
      aria-label={label}
      className={cn("fj:inline-flex fj:items-center fj:gap-1", disabled && "fj:opacity-45", className)}
      onMouseLeave={() => setHovered(null)}
    >
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={starValue === current}
            aria-label={`${starValue} of ${max}`}
            disabled={disabled}
            tabIndex={starValue === Math.max(current, 1) ? 0 : -1}
            onMouseEnter={() => interactive && setHovered(starValue)}
            onFocus={() => interactive && setHovered(starValue)}
            onBlur={() => setHovered(null)}
            onClick={() => interactive && setCurrent(starValue)}
            onKeyDown={(event) => {
              if (!interactive) return;
              if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                event.preventDefault();
                setCurrent(Math.min(max, current + 1));
              } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                event.preventDefault();
                setCurrent(Math.max(1, current - 1));
              }
            }}
            className={cn(
              NATIVE_CONTROL_RESET,
              "fj:relative fj:flex fj:items-center fj:justify-center fj:transition-colors fj:duration-[var(--fuji-duration-fast)]",
              interactive && "fj:cursor-pointer",
              disabled && "fj:cursor-not-allowed",
            )}
          >
            <StarFill
              glyph={Glyph}
              fraction={starFillFraction(starValue, displayValue)}
              sizeClass={SIZE_CLASSES[size]}
              filledClass={toneClasses.filled}
            />
          </button>
        );
      })}
    </div>
  );
});
