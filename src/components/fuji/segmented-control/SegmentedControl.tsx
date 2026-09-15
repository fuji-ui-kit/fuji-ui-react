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
  /** The segments, in display order. */
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
                "fj:relative fj:z-10 fj:flex fj:h-7 fj:cursor-pointer fj:items-center fj:justify-center fj:whitespace-nowrap fj:rounded-fuji-item fj:px-3 fj:text-[length:var(--fuji-text-sm)] fj:font-medium fj:text-fuji-foreground-muted fj:outline-none fj:select-none",
                "fj:transition-colors fj:duration-[var(--fuji-duration-fast)]",
                "fj:data-[active]:text-fuji-default-foreground",
                "fj:data-[disabled]:pointer-events-none fj:data-[disabled]:cursor-not-allowed fj:data-[disabled]:opacity-45",
              )}
            >
              {option.label}
            </Base.Tab>
          ))}
          {/*
            The selection used to be painted onto whichever tab was active, so
            it teleported. Base UI publishes the active tab's box as
            `--active-tab-*`, which lets a single raised object slide between
            slots instead - the same `.fuji-raised` treatment Button's
            contained appearance uses, so "the selected thing" looks identical
            wherever it appears in the system.

            `z-0` rather than `-z-10`: the list paints its own background, and
            a negative z-index would drop the indicator behind it. The tabs sit
            at `z-10` so their labels stay above the indicator that slides
            under them.
          */}
          <Base.Indicator className="fuji-raised fuji-motion-indicator fj:absolute fj:top-0 fj:left-0 fj:z-0 fj:h-(--active-tab-height) fj:w-(--active-tab-width) fj:translate-x-(--active-tab-left) fj:translate-y-(--active-tab-top) fj:rounded-fuji-item fj:bg-fuji-contained-default" />
        </Base.List>
      </Base.Root>
    );
  },
);
