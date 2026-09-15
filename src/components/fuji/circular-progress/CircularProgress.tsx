import * as React from "react";
import { cn } from "../../../lib/cn";
import type { ComponentSize, StatusTone } from "../../../types";

export interface CircularProgressProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** 0–100. Omit for an indeterminate spinner. */
  value?: number;
  /** A named size, or the ring's diameter in px. Default `"md"`. */
  size?: ComponentSize | number;
  /**
   * Stroke width in px. Defaults to a tenth of the diameter - the thick,
   * round-capped arc of the reference - with a 3px floor.
   */
  thickness?: number;
  /** Show the percentage in the centre of the ring. */
  showValue?: boolean;
  /** Accessible name for the ring - what is progressing. */
  label?: string;
  /** Colours the arc to report an outcome rather than plain progress. */
  variant?: StatusTone;
}

const DIAMETERS: Record<ComponentSize, number> = { sm: 40, md: 64, lg: 96 };

const STROKE_CLASSES: Partial<Record<StatusTone, string>> = {
  success: "fj:text-fuji-forest",
  warning: "fj:text-fuji-sun",
  danger: "fj:text-fuji-fire",
  info: "fj:text-fuji-water",
};

/**
 * Circular determinate/indeterminate progress ring - plain SVG, no
 * dependency. The arc is thick with round caps over a faint track, the
 * percentage sits in the centre and scales with the ring, and the arc
 * draws in from empty on mount and eases to every new value on the spring
 * (both pure CSS - this stays a presentational, server-renderable component).
 */
export const CircularProgress = React.forwardRef<HTMLSpanElement, CircularProgressProps>(
  function CircularProgress(
    {
      value,
      size = "md",
      thickness,
      showValue = false,
      label = "Loading",
      variant = "default",
      className,
      style,
      ...props
    },
    ref,
  ) {
    const box = typeof size === "number" ? size : DIAMETERS[size];
    const stroke = thickness ?? Math.max(3, Math.round(box / 10));
    const radius = (box - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const indeterminate = value === undefined;
    const fraction = indeterminate ? 0 : Math.min(Math.max(value / 100, 0), 1);

    return (
      <span
        ref={ref}
        role="progressbar"
        aria-label={label}
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          "fj:relative fj:inline-flex fj:shrink-0 fj:items-center fj:justify-center fj:rounded-full",
          STROKE_CLASSES[variant] ?? "fj:text-fuji-foreground",
          className,
        )}
        style={{ width: box, height: box, ...style }}
        {...props}
      >
        <svg
          width={box}
          height={box}
          viewBox={`0 0 ${box} ${box}`}
          className={cn("fj:block", indeterminate && "fj:animate-fuji-spin")}
        >
          <circle
            cx={box / 2}
            cy={box / 2}
            r={radius}
            strokeWidth={stroke}
            className="fuji-progress-track fj:fill-none"
          />
          <circle
            cx={box / 2}
            cy={box / 2}
            r={radius}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={indeterminate ? circumference : undefined}
            strokeDashoffset={indeterminate ? circumference * 0.75 : undefined}
            transform={`rotate(-90 ${box / 2} ${box / 2})`}
            className={cn("fj:fill-none fj:stroke-current", !indeterminate && "fuji-ring-fill")}
            style={
              indeterminate
                ? undefined
                : ({ "--fuji-ring-c": circumference, "--fuji-progress": fraction } as React.CSSProperties)
            }
          />
        </svg>
        {showValue && !indeterminate && (
          <span
            className="fj:absolute fj:font-semibold fj:tabular-nums fj:text-fuji-foreground"
            style={{ fontSize: Math.max(11, Math.round(box * 0.2)) }}
          >
            {Math.round(value)}%
          </span>
        )}
      </span>
    );
  },
);
