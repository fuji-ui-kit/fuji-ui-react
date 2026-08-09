import * as React from "react";
import { cn } from "../../../lib/cn";
import type { ComponentSize, StatusTone } from "../../../types";

export interface CircularProgressProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** 0–100. Omit for an indeterminate spinner. */
  value?: number;
  size?: ComponentSize;
  showValue?: boolean;
  label?: string;
  variant?: StatusTone;
}

const DIMENSIONS: Record<ComponentSize, { box: number; stroke: number }> = {
  sm: { box: 32, stroke: 3 },
  md: { box: 44, stroke: 4 },
  lg: { box: 56, stroke: 5 },
};

const STROKE_CLASSES: Partial<Record<StatusTone, string>> = {
  success: "fj:text-fuji-forest",
  warning: "fj:text-fuji-sun",
  danger: "fj:text-fuji-fire",
  info: "fj:text-fuji-water",
};

/** Circular determinate/indeterminate progress ring - plain SVG, no dependency. */
export const CircularProgress = React.forwardRef<HTMLSpanElement, CircularProgressProps>(
  function CircularProgress(
    { value, size = "md", showValue = false, label = "Loading", variant = "default", className, ...props },
    ref,
  ) {
    const { box, stroke } = DIMENSIONS[size];
    const radius = (box - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = value !== undefined ? circumference * (1 - value / 100) : circumference * 0.75;

    return (
      <span
        ref={ref}
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          "fj:relative fj:inline-flex fj:items-center fj:justify-center fj:rounded-full fj:shadow-fuji-control",
          STROKE_CLASSES[variant] ?? "fj:text-fuji-default",
          className,
        )}
        style={{ width: box, height: box }}
        {...props}
      >
        <svg width={box} height={box} className={cn(value === undefined && "fj:animate-spin")}>
          <circle
            cx={box / 2}
            cy={box / 2}
            r={radius}
            strokeWidth={stroke}
            className="fj:fill-none fj:stroke-fuji-surface-strong"
          />
          <circle
            cx={box / 2}
            cy={box / 2}
            r={radius}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${box / 2} ${box / 2})`}
            className="fj:fill-none fj:stroke-current fj:transition-[stroke-dashoffset] fj:duration-[var(--fuji-duration-slow)] fj:ease-[var(--fuji-ease)]"
          />
        </svg>
        {showValue && value !== undefined && (
          <span className="fj:absolute fj:text-[length:var(--fuji-text-xs)] fj:font-medium fj:text-fuji-foreground">
            {Math.round(value)}%
          </span>
        )}
      </span>
    );
  },
);
