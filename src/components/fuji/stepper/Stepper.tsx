import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "../../../lib/cn";
import type { ComponentTone } from "../../../types";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

export interface StepperStep {
  label: React.ReactNode;
  description?: React.ReactNode;
  /** Replaces the number/check with custom content (an icon, an avatar, ...). Shown for every state. */
  icon?: React.ReactNode;
  /** A step that cannot be jumped to. Only meaningful with `onStepClick`. */
  disabled?: boolean;
}

export interface StepperProps extends React.HTMLAttributes<HTMLOListElement> {
  /** The steps, in order. Progress is derived from the active index, not stored per step. */
  steps: StepperStep[];
  /** Index (0-based) of the current step. Steps before it are complete. */
  activeStep: number;
  /** When provided, steps render as buttons and call back with the clicked index. */
  onStepClick?: (index: number) => void;
  /** Color used for complete/current steps and the connecting line. Default "default". */
  tone?: ComponentTone;
}

// Complete-circle fill, current-circle border/text, and connector-line fill
// per tone - written out in full for the Tailwind scanner.
const TONE_CLASSES: Record<ComponentTone, { complete: string; current: string; line: string }> = {
  default: {
    complete: "fj:bg-fuji-default fj:text-fuji-default-foreground",
    current: "fj:border-fuji-foreground fj:text-fuji-foreground",
    line: "fj:bg-fuji-default",
  },
  forest: {
    complete: "fj:bg-fuji-forest fj:text-fuji-forest-foreground",
    current: "fj:border-fuji-forest fj:text-fuji-forest",
    line: "fj:bg-fuji-forest",
  },
  sun: {
    complete: "fj:bg-fuji-sun fj:text-fuji-sun-foreground",
    current: "fj:border-fuji-sun fj:text-fuji-sun",
    line: "fj:bg-fuji-sun",
  },
  fire: {
    complete: "fj:bg-fuji-fire fj:text-fuji-fire-foreground",
    current: "fj:border-fuji-fire fj:text-fuji-fire",
    line: "fj:bg-fuji-fire",
  },
  water: {
    complete: "fj:bg-fuji-water fj:text-fuji-water-foreground",
    current: "fj:border-fuji-water fj:text-fuji-water",
    line: "fj:bg-fuji-water",
  },
};

/**
 * Horizontal stepper: checked circles for complete steps, ringed numbers for current/pending,
 * connectors filled up to the current step. State changes animate (fill, colour, check pop).
 */
export const Stepper = React.forwardRef<HTMLOListElement, StepperProps>(function Stepper(
  { steps, activeStep, onStepClick, tone = "default", className, ...props },
  ref,
) {
  const clickable = Boolean(onStepClick);
  const CircleTag = clickable ? "button" : "div";
  const baseId = React.useId();
  const toneClasses = TONE_CLASSES[tone];

  return (
    <ol
      ref={ref}
      className={cn("fj:m-0 fj:flex fj:w-full fj:list-none fj:items-start fj:p-0", className)}
      {...props}
    >
      {steps.map((step, index) => {
        const isComplete = index < activeStep;
        const isCurrent = index === activeStep;
        const isLast = index === steps.length - 1;
        const labelId = `${baseId}-label-${index}`;
        // The connector AFTER this step fills completely once the step
        // after it has been reached - the line leads right up to the current
        // step's circle.
        const fill = index < activeStep ? 1 : 0;
        return (
          <li
            key={index}
            className="fj:flex fj:flex-1 fj:flex-col fj:items-center fj:gap-2.5 fj:last:flex-none"
          >
            <div className="fj:flex fj:w-full fj:items-center">
              <CircleTag
                type={clickable ? "button" : undefined}
                disabled={clickable && step.disabled ? true : undefined}
                aria-current={isCurrent ? "step" : undefined}
                aria-labelledby={clickable ? labelId : undefined}
                onClick={clickable ? () => onStepClick?.(index) : undefined}
                className={cn(
                  NATIVE_CONTROL_RESET,
                  "fj:box-border fj:flex fj:size-10 fj:shrink-0 fj:items-center fj:justify-center fj:rounded-full fj:border-2 fj:text-[length:var(--fuji-text-base)] fj:font-medium",
                  "fj:transition-[background-color,color,border-color,transform,box-shadow] fj:duration-[var(--fuji-duration-base)] fj:ease-[var(--fuji-ease)]",
                  clickable && "fj:cursor-pointer fj:active:scale-[var(--fuji-press-scale)]",
                  clickable && "fj:disabled:cursor-not-allowed fj:disabled:opacity-45",
                  clickable &&
                    "fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
                  isComplete && cn("fuji-raised fj:border-transparent", toneClasses.complete),
                  isComplete && clickable && "fj:hover:brightness-110",
                  isCurrent && cn("fj:bg-fuji-surface", toneClasses.current),
                  isCurrent && clickable && "fuji-hover-raised",
                  !isComplete &&
                    !isCurrent &&
                    "fj:border-fuji-border-strong fj:bg-fuji-surface fj:text-fuji-foreground-subtle",
                  !isComplete &&
                    !isCurrent &&
                    clickable &&
                    "fj:hover:border-fuji-foreground-muted fj:hover:text-fuji-foreground-muted",
                )}
              >
                {step.icon ??
                  (isComplete ? (
                    <Check
                      key="check"
                      aria-hidden="true"
                      className="fuji-pop-in fj:size-5"
                      strokeWidth={2.5}
                    />
                  ) : (
                    index + 1
                  ))}
              </CircleTag>
              {!isLast && (
                <div
                  aria-hidden="true"
                  className="fj:relative fj:mx-3 fj:h-1 fj:flex-1 fj:overflow-hidden fj:rounded-full fj:bg-fuji-border"
                >
                  <div
                    className={cn(
                      "fuji-stepper-fill fj:absolute fj:inset-0 fj:rounded-full",
                      toneClasses.line,
                    )}
                    style={{ "--fuji-progress": fill } as React.CSSProperties}
                  />
                </div>
              )}
            </div>
            <div className="fj:text-center">
              <p
                id={labelId}
                className={cn(
                  "fj:m-0 fj:text-[length:var(--fuji-text-sm)] fj:font-medium fj:transition-colors fj:duration-[var(--fuji-duration-base)]",
                  isCurrent || isComplete ? "fj:text-fuji-foreground" : "fj:text-fuji-foreground-subtle",
                )}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="fj:m-0 fj:text-[length:var(--fuji-text-xs)] fj:text-fuji-foreground-subtle">
                  {step.description}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
});
