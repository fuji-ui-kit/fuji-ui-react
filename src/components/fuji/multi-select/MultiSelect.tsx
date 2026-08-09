"use client";

import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Combobox as Base } from "@base-ui/react/combobox";
import { cn } from "../../../lib/cn";
import type { ComponentSize } from "../../../types";
import { softClasses } from "../lib/appearance";
import { fieldSurface } from "../lib/field-surface";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";
import { usePortalThemeAttrs } from "../lib/use-portal-theme-attrs";

export interface MultiSelectItem {
  label: string;
  value: string;
}

export interface MultiSelectProps extends Omit<
  React.ComponentPropsWithoutRef<typeof Base.Root<MultiSelectItem, true>>,
  "items" | "multiple"
> {
  items: MultiSelectItem[];
  placeholder?: string;
  size?: ComponentSize;
  invalid?: boolean;
  className?: string;
  /** Accessible name for the search input. Required when there is no visible `<label>` for this field. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

/** Multi-selection combobox with removable chips (wraps Base UI Combobox `multiple`). */
export function MultiSelect({
  items,
  placeholder = "Select…",
  size = "md",
  invalid,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: MultiSelectProps) {
  const portalAttrs = usePortalThemeAttrs();

  return (
    <Base.Root items={items} multiple {...props}>
      <Base.InputGroup
        data-invalid={invalid ? "" : undefined}
        className={cn(
          fieldSurface({ size }),
          // Reserve fixed space on the right (pr-9) so chips/input never push the
          // chevron down or out of view; the chevron is pinned and centered.
          "fj:relative fj:flex fj:h-auto fj:min-h-[var(--fuji-control-h-md)] fj:items-center fj:py-1.5 fj:pr-9 fj:pl-2",
          className,
        )}
      >
        {/* Chips stay on a single line by default; overflow is clipped rather than wrapping. */}
        <Base.Chips className="fj:flex fj:min-w-0 fj:flex-1 fj:flex-nowrap fj:items-center fj:gap-1 fj:overflow-hidden">
          <Base.Value>
            {(value: MultiSelectItem[]) => (
              <>
                {value.map((item) => (
                  // Same shape/padding/text recipe as `Badge` (rounded-full pill,
                  // px-2.5 py-1, text-xs font-medium, opacity-fade remove button)
                  // so a selected value reads as the same "chip" everywhere in
                  // Fuji, not a bespoke shape unique to this field. `max-w`/
                  // `shrink-0`/`outline-none`/`data-[highlighted]` are the only
                  // additions, for combobox-specific truncation and keyboard nav.
                  <Base.Chip
                    key={item.value}
                    aria-label={item.label}
                    className={cn(
                      "fj:flex fj:max-w-[10rem] fj:shrink-0 fj:items-center fj:gap-1.5 fj:rounded-full fj:px-2.5 fj:py-1 fj:text-[length:var(--fuji-text-xs)] fj:font-medium fj:outline-none",
                      softClasses("default"),
                      "fj:data-[highlighted]:bg-fuji-earth fj:data-[highlighted]:text-fuji-earth-foreground",
                    )}
                  >
                    <span className="fj:truncate">{item.label}</span>
                    <Base.ChipRemove
                      aria-label={`Remove ${item.label}`}
                      className={cn(
                        NATIVE_CONTROL_RESET,
                        "fj:flex fj:size-3.5 fj:shrink-0 fj:cursor-pointer fj:items-center fj:justify-center fj:rounded-full fj:opacity-70 fj:hover:opacity-100",
                      )}
                    >
                      <X className="fj:size-3" />
                    </Base.ChipRemove>
                  </Base.Chip>
                ))}
                <Base.Input
                  placeholder={value.length > 0 ? "" : placeholder}
                  aria-label={ariaLabel}
                  aria-labelledby={ariaLabelledBy}
                  aria-invalid={invalid || undefined}
                  className={cn(
                    NATIVE_CONTROL_RESET,
                    "fj:h-6 fj:min-w-16 fj:flex-1 fj:outline-none fj:placeholder:text-fuji-foreground-subtle",
                  )}
                />
              </>
            )}
          </Base.Value>
        </Base.Chips>
        <Base.Trigger
          aria-label="Toggle options"
          className={cn(
            NATIVE_CONTROL_RESET,
            "fj:absolute fj:top-1/2 fj:right-2 fj:flex fj:size-5 fj:shrink-0 fj:-translate-y-1/2 fj:items-center fj:justify-center fj:text-fuji-foreground-muted",
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
              {(item: MultiSelectItem) => (
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
