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
  /** What the option reads as, in the list and on its selected chip. */
  label: string;
  /** The value reported through `onValueChange`. */
  value: string;
}

export interface MultiSelectProps extends Omit<
  React.ComponentPropsWithoutRef<typeof Base.Root<MultiSelectItem, true>>,
  "items" | "multiple"
> {
  /** Options to render. */
  items: MultiSelectItem[];
  /** Text shown while nothing is selected. */
  placeholder?: string;
  /**
   * Minimum control height, matching `Input`, `Select` and `Button` at the
   * same size. Default "md".
   */
  size?: ComponentSize;
  /** Paints the error state. Pair with `FormField`'s `error` for the message. */
  invalid?: boolean;
  /** Extra classes merged onto the input. */
  className?: string;
  /** Accessible name for the search input. Required when there is no visible `<label>` for this field. */
  "aria-label"?: string;
  /** Points at an existing visible label's id, as an alternative to `aria-label`. */
  "aria-labelledby"?: string;
}

/**
 * Per-size geometry for the chip row. The group grows with its chips
 * (`h-auto`), so the field recipe's fixed `h-[--fuji-control-h-*]` can't set
 * the height here - this used to hard-code `min-h-[--fuji-control-h-md]` and
 * a 24px input/chip row, so `size="sm"` and `size="lg"` rendered exactly as
 * tall as `md` next to a `Select`/`Input` of the same size. Written out in
 * full for the Tailwind scanner.
 */
const GROUP_SIZE_CLASSES: Record<ComponentSize, string> = {
  sm: "fj:min-h-[var(--fuji-control-h-sm)] fj:py-0.5",
  md: "fj:min-h-[var(--fuji-control-h-md)] fj:py-1.5",
  lg: "fj:min-h-[var(--fuji-control-h-lg)] fj:py-1.5",
};

const INPUT_SIZE_CLASSES: Record<ComponentSize, string> = {
  sm: "fj:h-5",
  md: "fj:h-6",
  lg: "fj:h-7",
};

const CHIP_SIZE_CLASSES: Record<ComponentSize, string> = {
  sm: "fj:py-0.5",
  md: "fj:py-1",
  lg: "fj:py-1",
};

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
        // Spread instead of `data-invalid={invalid ? "" : undefined}`:
        // `Base.InputGroup` already mirrors an ancestor `<FormField invalid>`
        // onto this same element as `data-invalid` automatically, and an
        // explicit `undefined`-valued prop still occupies the key and wins
        // the merge in `useRenderElement`, erasing that computed value
        // whenever this `invalid` prop itself was left unset (see Input.tsx
        // for the full mechanism, and FormField.tsx for the symptom).
        // Omitting the key when falsy instead lets the ambient value through.
        {...(invalid ? { "data-invalid": "" } : null)}
        className={cn(
          fieldSurface({ size }),
          // Reserve fixed space on the right (pr-9) so chips/input never push the
          // chevron down or out of view; the chevron is pinned and centered.
          "fj:relative fj:flex fj:h-auto fj:items-center fj:pr-9 fj:pl-2",
          GROUP_SIZE_CLASSES[size],
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
                      "fj:box-border fj:flex fj:max-w-[10rem] fj:shrink-0 fj:items-center fj:gap-1.5 fj:rounded-full fj:px-2.5 fj:text-[length:var(--fuji-text-xs)] fj:font-medium fj:outline-none",
                      CHIP_SIZE_CLASSES[size],
                      softClasses("default"),
                      "fj:data-[highlighted]:bg-fuji-default fj:data-[highlighted]:text-fuji-default-foreground",
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
                  // Spread only when set: Base UI already points this input's
                  // `aria-labelledby` at an enclosing FormField's label, and an explicit
                  // `undefined` occupies the key and erases it (see Input.tsx).
                  {...(ariaLabelledBy ? { "aria-labelledby": ariaLabelledBy } : null)}
                  aria-invalid={invalid || undefined}
                  className={cn(
                    NATIVE_CONTROL_RESET,
                    "fj:min-w-16 fj:flex-1 fj:outline-none fj:placeholder:text-fuji-foreground-subtle",
                    INPUT_SIZE_CLASSES[size],
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
              "fuji-glass-surface-overlay fuji-motion-popup fj:w-[var(--anchor-width)] fj:max-w-[var(--available-width)]",
              "fj:overflow-hidden fj:rounded-fuji-panel fj:border fj:border-fuji-border fj:bg-fuji-surface-overlay fj:shadow-fuji-overlay fj:outline-none",
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
                    "fj:flex fj:cursor-default fj:items-center fj:gap-2 fj:rounded-fuji-item fj:px-2.5 fj:py-2 fj:text-[length:var(--fuji-text-base)] fj:text-fuji-foreground fj:outline-none fj:select-none",
                    // `--fuji-surface-strong` is a translucent WHITE fill under glass, so a
                    // highlighted row tracked the backdrop and washed out over the
                    // atmosphere's bright pixels (measured 3.35:1 here). Same fill/text
                    // inversion every other selection indicator uses - and the one
                    // CommandMenu already moved to for this exact reason.
                    "fj:data-[highlighted]:bg-fuji-contained-default fj:data-[highlighted]:text-fuji-default-foreground",
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
