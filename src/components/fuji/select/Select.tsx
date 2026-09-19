"use client";

import * as React from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { Select as Base } from "@base-ui/react/select";
import { cn } from "../../../lib/cn";
import type { ComponentSize } from "../../../types";
import { fieldSurface } from "../lib/field-surface";
import { usePortalThemeAttrs } from "../lib/use-portal-theme-attrs";

export interface SelectItem {
  /** What the option reads as, in the list and in the closed trigger. */
  label: React.ReactNode;
  /** The value reported through `onValueChange`. */
  value: string;
  /** Renders the option unselectable while keeping it visible. */
  disabled?: boolean;
}

export interface SelectProps<Value extends string = string> extends Omit<
  React.ComponentPropsWithoutRef<typeof Base.Root<Value>>,
  "items" | "children"
> {
  /** Options to render. */
  items: SelectItem[];
  /** Text shown while nothing is selected. */
  placeholder?: string;
  /** Control height, matching `Input` and `Button` at the same size. */
  size?: ComponentSize;
  /** Paints the error state. Pair with `FormField`'s `error` for the message. */
  invalid?: boolean;
  /** Extra classes merged onto the trigger. */
  className?: string;
  /** Accessible name for the trigger button. Required when there is no visible `<label>` for this select. */
  "aria-label"?: string;
  /** Points at an existing visible label's id, as an alternative to `aria-label`. */
  "aria-labelledby"?: string;
}

/** Single-selection dropdown (wraps Base UI Select). */
export function Select<Value extends string = string>({
  items,
  placeholder = "Select…",
  size = "md",
  invalid,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: SelectProps<Value>) {
  const portalAttrs = usePortalThemeAttrs();

  return (
    <Base.Root items={items} {...props}>
      <Base.Trigger
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        // Spread, not `data-invalid={invalid ? "" : undefined}`: an explicit `undefined` wins the
        // merge and erases the `data-invalid` Base.Trigger mirrors from `<FormField invalid>`.
        // Omitting the key lets it through (see Input.tsx / FormField.tsx).
        {...(invalid ? { "data-invalid": "" } : null)}
        aria-invalid={invalid || undefined}
        className={cn(
          fieldSurface({ size }),
          "fj:flex fj:items-center fj:justify-between fj:gap-2",
          className,
        )}
      >
        <Base.Value
          placeholder={placeholder}
          className="fj:truncate fj:data-[placeholder]:text-fuji-foreground-subtle"
        />
        <Base.Icon>
          <ChevronDown className="fj:size-4 fj:text-fuji-foreground-muted" />
        </Base.Icon>
      </Base.Trigger>
      <Base.Portal>
        <Base.Positioner {...portalAttrs} sideOffset={6} className="fj:z-50 fj:outline-none">
          <Base.Popup
            {...portalAttrs}
            className={cn(
              "fj:box-border fuji-glass-surface-overlay fuji-motion-popup fj:min-w-[var(--anchor-width)] fj:overflow-hidden",
              "fj:rounded-fuji-panel fj:border fj:border-fuji-border fj:bg-fuji-surface-overlay fj:shadow-fuji-overlay fj:outline-none",
            )}
          >
            <Base.ScrollUpArrow className="fj:flex fj:h-4 fj:w-full fj:items-center fj:justify-center fj:text-fuji-foreground-subtle">
              <ChevronUp className="fj:size-3.5" />
            </Base.ScrollUpArrow>
            <Base.List className="fj:max-h-[min(20rem,var(--available-height))] fj:overflow-y-auto fj:p-1">
              {items.map((item) => (
                <Base.Item
                  key={item.value}
                  value={item.value}
                  disabled={item.disabled}
                  className={cn(
                    "fj:flex fj:cursor-default fj:items-center fj:gap-2 fj:rounded-fuji-item fj:px-2.5 fj:py-2 fj:text-[length:var(--fuji-text-base)] fj:text-fuji-foreground fj:outline-none fj:select-none",
                    // `--fuji-surface-strong` is translucent white under glass, so highlighted rows
                    // washed out over bright backdrops (3.35:1). Uses the same fill/text inversion
                    // as other selection indicators (CommandMenu too).
                    "fj:data-[highlighted]:bg-fuji-contained-default fj:data-[highlighted]:text-fuji-default-foreground",
                    "fj:data-[disabled]:pointer-events-none fj:data-[disabled]:opacity-45",
                  )}
                >
                  <span className="fj:flex fj:size-4 fj:shrink-0 fj:items-center fj:justify-center">
                    <Base.ItemIndicator>
                      <Check className="fj:size-3.5" />
                    </Base.ItemIndicator>
                  </span>
                  <Base.ItemText>{item.label}</Base.ItemText>
                </Base.Item>
              ))}
            </Base.List>
            <Base.ScrollDownArrow className="fj:flex fj:h-4 fj:w-full fj:items-center fj:justify-center fj:text-fuji-foreground-subtle">
              <ChevronDown className="fj:size-3.5" />
            </Base.ScrollDownArrow>
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}
