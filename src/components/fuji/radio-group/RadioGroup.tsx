"use client";

import * as React from "react";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { cn } from "../../../lib/cn";
import type { ComponentTone } from "../../../types";

export type RadioGroupProps = React.ComponentPropsWithoutRef<typeof BaseRadioGroup>;

const RadioGroupRoot = React.forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroupRoot(
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
  earth: "fj:text-fuji-earth fj:data-[checked]:border-fuji-earth",
  forest: "fj:text-fuji-forest fj:data-[checked]:border-fuji-forest",
  sun: "fj:text-fuji-sun fj:data-[checked]:border-fuji-sun",
  fire: "fj:text-fuji-fire fj:data-[checked]:border-fuji-fire",
  water: "fj:text-fuji-water fj:data-[checked]:border-fuji-water",
};

export interface RadioGroupItemProps extends React.ComponentPropsWithoutRef<typeof Radio.Root> {
  label: React.ReactNode;
  /** Color used once selected. Default "default". */
  tone?: ComponentTone;
}

const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(function RadioGroupItem(
  { label, tone = "default", className, id, ...props },
  ref,
) {
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
          "fj:flex fj:size-[18px] fj:shrink-0 fj:cursor-pointer fj:items-center fj:justify-center fj:rounded-full fj:border fj:border-fuji-border-strong fj:bg-fuji-surface",
          "fj:transition-[border-color,border-width] fj:duration-[var(--fuji-duration-fast)]",
          TONE_CLASSES[tone],
          // Selection reads primarily from a thicker, tone-colored border, not
          // the inner dot - the dot stays a small, restrained accent.
          "fj:data-[checked]:border-2",
          "fj:focus-visible:outline fj:focus-visible:outline-2 fj:focus-visible:outline-offset-2 fj:focus-visible:outline-fuji-focus-ring",
          "fj:disabled:cursor-not-allowed fj:disabled:opacity-45",
          className,
        )}
        {...props}
      >
        <Radio.Indicator className="fj:flex fj:items-center fj:justify-center fj:data-[unchecked]:hidden fj:before:size-2.5 fj:before:rounded-full fj:before:bg-current" />
      </Radio.Root>
      {label}
    </label>
  );
});

/** `<RadioGroup defaultValue="a"><RadioGroup.Item value="a" label="A"/></RadioGroup>` */
export const RadioGroup = Object.assign(RadioGroupRoot, { Item: RadioGroupItem });
