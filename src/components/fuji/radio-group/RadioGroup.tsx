"use client";

import * as React from "react";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { cn } from "../../../lib/cn";
import type { ComponentTone } from "../../../types";

export type RadioGroupProps = React.ComponentPropsWithoutRef<typeof BaseRadioGroup>;

export const RadioGroupRoot = React.forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroupRoot(
  { className, ...props },
  ref,
) {
  return <BaseRadioGroup ref={ref} className={cn("fj:flex fj:flex-col fj:gap-2.5", className)} {...props} />;
});

// Checked border + dot color per tone - written out in full for the
// Tailwind scanner (see lib/appearance.ts's own comment for why this can't
// be templated).
const TONE_CLASSES: Record<ComponentTone, string> = {
  default: "fj:text-fuji-default fj:data-[checked]:border-fuji-default",
  forest: "fj:text-fuji-forest fj:data-[checked]:border-fuji-forest",
  sun: "fj:text-fuji-sun fj:data-[checked]:border-fuji-sun",
  fire: "fj:text-fuji-fire fj:data-[checked]:border-fuji-fire",
  water: "fj:text-fuji-water fj:data-[checked]:border-fuji-water",
};

export interface RadioGroupItemProps extends React.ComponentPropsWithoutRef<typeof Radio.Root> {
  /** The option's visible text. Clicking it selects the radio. */
  label: React.ReactNode;
  /** Color used once selected. Default "default". */
  tone?: ComponentTone;
}

export const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  function RadioGroupItem({ label, tone = "default", className, id, ...props }, ref) {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    return (
      <label
        htmlFor={inputId}
        className="fj:flex fj:cursor-pointer fj:items-center fj:gap-2 fj:text-[length:var(--fuji-text-base)] fj:text-fuji-foreground"
      >
        <Radio.Root
          ref={ref}
          id={inputId}
          className={cn(
            // `box-border` is load-bearing beyond the usual no-preflight reason:
            // selection thickens the border to 2px, so under content-box the
            // control grew from 20px to 22px on check - it visibly jumped.
            "fj:box-border fj:flex fj:size-[18px] fj:shrink-0 fj:cursor-pointer fj:items-center fj:justify-center fj:rounded-full fj:border fj:border-fuji-border-strong fj:bg-fuji-surface",
            "fj:transition-[border-color,border-width] fj:duration-[var(--fuji-duration-fast)]",
            TONE_CLASSES[tone],
            // Selection reads primarily from a thicker, tone-colored border, not
            // the inner dot - the dot stays a small, restrained accent.
            "fj:data-[checked]:border-2",
            "fj:focus-visible:outline fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
            // `Radio.Root` is a `<span role="radio">`; `disabled` lives on the hidden `<input>`,
            // so `disabled:` never matches. Base UI mirrors it here as `data-disabled`.
            "fj:data-[disabled]:cursor-not-allowed fj:data-[disabled]:opacity-45",
            className,
          )}
          {...props}
        >
          {/* `keepMounted` so the dot can animate (unmounting made selection pop in); it stays
              hidden from AT either way. The scale-plus-spin mirrors Switch's rolling thumb. */}
          <Radio.Indicator
            keepMounted
            className={cn(
              "fj:flex fj:items-center fj:justify-center",
              "fj:before:size-2.5 fj:before:rounded-full fj:before:bg-current",
              "fj:before:transition-[scale,rotate] fj:before:duration-[var(--fuji-duration-base)] fj:before:ease-[var(--fuji-ease-spring)]",
              "fj:data-[unchecked]:before:scale-0 fj:data-[checked]:before:scale-100",
              "fj:data-[unchecked]:before:rotate-[-140deg] fj:data-[checked]:before:rotate-0",
              // The dot is decoration; a reduced-motion user gets the state
              // change with no travel.
              "fj:motion-reduce:before:transition-none",
            )}
          />
        </Radio.Root>
        {label}
      </label>
    );
  },
);

/** `<RadioGroup defaultValue="a"><RadioGroup.Item value="a" label="A"/></RadioGroup>` */
export const RadioGroup = Object.assign(RadioGroupRoot, { Item: RadioGroupItem });
