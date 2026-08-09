"use client";

import * as React from "react";
import { Tabs as Base } from "@base-ui/react/tabs";
import { cn } from "../../../lib/cn";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

export interface SegmentedControlOption {
  label: React.ReactNode;
  value: string;
  disabled?: boolean;
  /** Accessible name for the tab. Required when `label` is icon-only. */
  ariaLabel?: string;
}

export interface SegmentedControlProps extends Omit<
  React.ComponentPropsWithoutRef<typeof Base.Root>,
  "orientation"
> {
  options: SegmentedControlOption[];
}

/**
 * Inline single-choice control (view toggles, density switches). Built on
 * Base UI's Tabs primitive (no panels rendered) to reuse its verified sliding
 * indicator and keyboard behavior.
 */
export const SegmentedControl = React.forwardRef<HTMLDivElement, SegmentedControlProps>(
  function SegmentedControl({ options, className, ...props }, ref) {
    return (
      <Base.Root {...props}>
        <Base.List
          ref={ref}
          className={cn(
            "fj:relative fj:inline-flex fj:items-center fj:gap-0.5 fj:rounded-fuji-control fj:border fj:border-fuji-border fj:bg-fuji-surface fj:p-1 fj:shadow-fuji-control",
            className,
          )}
        >
          {options.map((option) => (
            <Base.Tab
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              aria-label={option.ariaLabel}
              className={cn(
                NATIVE_CONTROL_RESET,
                "fj:relative fj:z-10 fj:flex fj:h-7 fj:cursor-pointer fj:items-center fj:justify-center fj:whitespace-nowrap fj:rounded-[6px] fj:px-3 fj:text-[length:var(--fuji-text-sm)] fj:font-medium fj:text-fuji-foreground-muted fj:outline-none fj:select-none",
                "fj:transition-colors fj:duration-[var(--fuji-duration-fast)]",
                "fj:data-[active]:bg-fuji-default fj:data-[active]:text-fuji-default-foreground fj:data-[active]:shadow-fuji-control",
                "fj:data-[disabled]:pointer-events-none fj:data-[disabled]:cursor-not-allowed fj:data-[disabled]:opacity-45",
              )}
            >
              {option.label}
            </Base.Tab>
          ))}
        </Base.List>
      </Base.Root>
    );
  },
);
