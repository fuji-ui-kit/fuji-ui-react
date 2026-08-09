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
}

export interface StepperProps extends React.HTMLAttributes<HTMLOListElement> {
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
    line: "fj:bg-fuji-foreground",
  },
  earth: {
    complete: "fj:bg-fuji-earth fj:text-fuji-earth-foreground",
    current: "fj:border-fuji-earth fj:text-fuji-earth",
    line: "fj:bg-fuji-earth",
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

/** Horizontal progress stepper - numbered circles connected by a fill line. */
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
        return (
          <li
            key={index}
            className="fj:flex fj:flex-1 fj:flex-col fj:items-center fj:gap-2 fj:last:flex-none"
          >
            <div className="fj:flex fj:w-full fj:items-center">
              <CircleTag
                type={clickable ? "button" : undefined}
                aria-current={isCurrent ? "step" : undefined}
                aria-labelledby={clickable ? labelId : undefined}
                onClick={clickable ? () => onStepClick?.(index) : undefined}
                className={cn(
                  NATIVE_CONTROL_RESET,
                  "fj:flex fj:size-8 fj:shrink-0 fj:items-center fj:justify-center fj:rounded-full fj:border fj:text-[length:var(--fuji-text-sm)] fj:font-medium",
                  "fj:transition-[background-color,color,border-color,transform] fj:duration-[var(--fuji-duration-fast)] fj:ease-[var(--fuji-ease)]",
                  clickable && "fj:cursor-pointer fj:active:scale-[var(--fuji-press-scale)]",
                  isComplete && cn("fj:border-transparent", toneClasses.complete),
                  isComplete && clickable && "fj:hover:brightness-110",
                  isCurrent && toneClasses.current,
                  isCurrent && clickable && "fj:hover:bg-fuji-surface-strong",
                  !isComplete && !isCurrent && "fj:border-fuji-border-strong fj:text-fuji-foreground-subtle",
                  !isComplete &&
                    !isCurrent &&
                    clickable &&
                    "fj:hover:border-fuji-foreground-muted fj:hover:text-fuji-foreground-muted",
                )}
              >
                {step.icon ?? (isComplete ? <Check aria-hidden="true" className="fj:size-4" /> : index + 1)}
              </CircleTag>
              {!isLast && (
                <div
                  className={cn(
                    "fj:mx-2 fj:h-px fj:flex-1",
                    isComplete ? toneClasses.line : "fj:bg-fuji-border",
                  )}
                />
              )}
            </div>
            <div className="fj:text-center">
              <p
                id={labelId}
                className={cn(
                  "fj:m-0 fj:text-[length:var(--fuji-text-sm)] fj:font-medium",
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
