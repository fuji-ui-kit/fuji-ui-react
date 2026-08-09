"use client";

import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Combobox as Base } from "@base-ui/react/combobox";
import { cn } from "../../../lib/cn";
import type { ComponentSize } from "../../../types";
import { fieldSurface } from "../lib/field-surface";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";
import { usePortalThemeAttrs } from "../lib/use-portal-theme-attrs";

export interface ComboboxItem {
  label: string;
  value: string;
}

export interface ComboboxProps extends Omit<
  React.ComponentPropsWithoutRef<typeof Base.Root<ComboboxItem, false>>,
  "items" | "multiple"
> {
  items: ComboboxItem[];
  placeholder?: string;
  size?: ComponentSize;
  invalid?: boolean;
  className?: string;
  /** Accessible name for the search input. Required when there is no visible `<label>` for this combobox. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

/** Searchable single-selection combobox (wraps Base UI Combobox). */
export function Combobox({
  items,
  placeholder = "Search…",
  size = "md",
  invalid,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: ComboboxProps) {
  const portalAttrs = usePortalThemeAttrs();

  return (
    <Base.Root items={items} {...props}>
      <Base.InputGroup
        data-invalid={invalid ? "" : undefined}
        className={cn(
          fieldSurface({ size }),
          "fj:flex fj:items-center fj:gap-1 fj:p-0 fj:pr-2 fj:pl-3",
          className,
        )}
      >
        <Base.Input
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-invalid={invalid || undefined}
          className={cn(
            NATIVE_CONTROL_RESET,
            "fj:h-full fj:w-full fj:min-w-0 fj:outline-none fj:placeholder:text-fuji-foreground-subtle",
          )}
        />
        <Base.Clear
          aria-label="Clear selection"
          className={cn(
            NATIVE_CONTROL_RESET,
            "fj:combobox-clear fj:flex fj:size-5 fj:items-center fj:justify-center fj:text-fuji-foreground-subtle fj:hover:text-fuji-foreground",
          )}
        >
          <X className="fj:size-3.5" />
        </Base.Clear>
        <Base.Trigger
          aria-label="Toggle options"
          className={cn(
            NATIVE_CONTROL_RESET,
            "fj:flex fj:size-5 fj:items-center fj:justify-center fj:text-fuji-foreground-muted",
          )}
        >
          <ChevronDown className="fj:size-4" />
        </Base.Trigger>
      </Base.InputGroup>
      <Base.Portal>
        <Base.Positioner {...portalAttrs} sideOffset={6} className="fj:z-50 fj:outline-none">
          <Base.Popup
            {...portalAttrs}
            className={cn(
              "fuji-glass-surface-overlay fj:w-[var(--anchor-width)] fj:max-w-[var(--available-width)] fj:origin-[var(--transform-origin)]",
              "fj:overflow-hidden fj:rounded-fuji-panel fj:border fj:border-fuji-border fj:bg-fuji-surface-overlay fj:shadow-fuji-overlay fj:outline-none",
              "fj:transition-[transform,opacity] fj:duration-[var(--fuji-duration-fast)]",
              "fj:data-[starting-style]:scale-95 fj:data-[starting-style]:opacity-0",
              "fj:data-[ending-style]:scale-95 fj:data-[ending-style]:opacity-0",
            )}
          >
            <Base.Empty className="fj:py-4 fj:px-3 fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground-subtle fj:empty:hidden">
              No results found.
            </Base.Empty>
            <Base.List className="fj:max-h-[min(20rem,var(--available-height))] fj:overflow-y-auto fj:p-1">
              {(item: ComboboxItem) => (
                <Base.Item
                  key={item.value}
                  value={item}
                  className={cn(
                    "fj:flex fj:cursor-default fj:items-center fj:gap-2 fj:rounded-[6px] fj:px-2.5 fj:py-2 fj:text-[length:var(--fuji-text-base)] fj:text-fuji-foreground fj:outline-none fj:select-none",
                    "fj:data-[highlighted]:bg-fuji-surface-strong",
                  )}
                >
                  <span className="fj:flex fj:size-4 fj:shrink-0 fj:items-center fj:justify-center">
                    <Base.ItemIndicator>
                      <Check className="fj:size-3.5" />
                    </Base.ItemIndicator>
                  </span>
                  {item.label}
                </Base.Item>
              )}
            </Base.List>
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}
