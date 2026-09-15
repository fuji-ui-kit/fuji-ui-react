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
  /** What the option reads as, and the text the typed query filters against. */
  label: string;
  /** The value reported through `onValueChange`. */
  value: string;
}

export interface ComboboxProps extends Omit<
  React.ComponentPropsWithoutRef<typeof Base.Root<ComboboxItem, false>>,
  "items" | "multiple"
> {
  /** Options to render. */
  items: ComboboxItem[];
  /** Text shown while nothing is selected. */
  placeholder?: string;
  /** Control height, matching `Input` and `Button` at the same size. */
  size?: ComponentSize;
  /** Paints the error state. Pair with `FormField`'s `error` for the message. */
  invalid?: boolean;
  /** Extra classes merged onto the input. */
  className?: string;
  /** Accessible name for the search input. Required when there is no visible `<label>` for this combobox. */
  "aria-label"?: string;
  /** Points at an existing visible label's id, as an alternative to `aria-label`. */
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
              "fuji-glass-surface-overlay fuji-motion-popup fj:w-[var(--anchor-width)] fj:max-w-[var(--available-width)]",
              "fj:overflow-hidden fj:rounded-fuji-panel fj:border fj:border-fuji-border fj:bg-fuji-surface-overlay fj:shadow-fuji-overlay fj:outline-none",
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
