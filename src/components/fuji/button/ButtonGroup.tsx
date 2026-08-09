"use client";

import * as React from "react";
import { cn } from "../../../lib/cn";
import { useControllableState } from "../../../hooks/useControllableState";
import { appearanceClasses } from "../lib/appearance";
import { buttonBase } from "./button.styles";
import type { ComponentSize, ComponentTone } from "../../../types";

export interface ButtonGroupItem {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
  "aria-label"?: string;
}

export interface ButtonGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  orientation?: "horizontal" | "vertical";
  /**
   * Enables single-selection mode. Omit to use ButtonGroup purely as a visual
   * grouping wrapper around `Button` children.
   */
  items?: ButtonGroupItem[];
  /** Controlled selected value (single-selection mode). */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Contained color used by the selected item. Default "default". */
  tone?: ComponentTone;
  size?: ComponentSize;
}

const ORIENTATION_CLASSES = {
  horizontal:
    "fj:flex-row fj:[&>button]:rounded-none fj:[&>button:first-child]:rounded-l-fuji-control fj:[&>button:last-child]:rounded-r-fuji-control fj:[&>button:not(:first-child)]:-ml-px",
  vertical:
    "fj:flex-col fj:[&>button]:rounded-none fj:[&>button:first-child]:rounded-t-fuji-control fj:[&>button:last-child]:rounded-b-fuji-control fj:[&>button:not(:first-child)]:-mt-px",
} as const;

// Managed (`items`) mode: unlike the bare-children mode above, a selected
// segment here renders a fully opaque "contained" fill (see `appearanceClasses`
// below) - overlapping borders via negative margin + z-index (the bare-children
// technique) made that opaque fill visibly bleed a 1px sliver over its
// neighbor's edge, worst on dark/glass where the contained fill is a light
// off-white against a dark border. Each non-last button instead carries its
// own trailing border (see the `!isLast` class below) with no overlapping
// geometry, so an opaque selected segment can never paint over its neighbor.
// (A shared `divide-x`/`divide-y` on the container looks equivalent but
// doesn't work here: Tailwind compiles divide utilities as `:where(...)`,
// zero specificity, so `buttonBase`'s own `border-0` reset always wins
// regardless of source order - the divider silently never rendered.)
const MANAGED_ORIENTATION_CLASSES = {
  horizontal: "fj:flex-row",
  vertical: "fj:flex-col",
} as const;

/**
 * Groups related buttons with shared, touching edges (segmented look). Pass
 * `items` with `value`/`defaultValue`/`onValueChange` to turn it into a real
 * single-selection control (radiogroup semantics with arrow-key navigation);
 * otherwise it wraps `Button` children as a visual group.
 */
export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
  {
    orientation = "horizontal",
    items,
    value,
    defaultValue,
    onValueChange,
    tone = "default",
    size = "md",
    className,
    children,
    ...props
  },
  ref,
) {
  const [selected, setSelected] = useControllableState<string | undefined>({
    value,
    defaultValue: defaultValue,
    onChange: (next) => next !== undefined && onValueChange?.(next),
  });

  const buttonsRef = React.useRef<(HTMLButtonElement | null)[]>([]);

  if (!items) {
    return (
      <div
        ref={ref}
        role="group"
        className={cn("fj:inline-flex", ORIENTATION_CLASSES[orientation], className)}
        {...props}
      >
        {children}
      </div>
    );
  }

  const enabledIndexes = items.map((item, i) => (item.disabled ? -1 : i)).filter((i) => i >= 0);
  const selectedIndex = items.findIndex((item) => item.value === selected);
  const focusableIndex =
    selectedIndex >= 0 && !items[selectedIndex].disabled ? selectedIndex : (enabledIndexes[0] ?? 0);

  const moveTo = (index: number) => {
    const item = items[index];
    if (!item || item.disabled) return;
    setSelected(item.value);
    buttonsRef.current[index]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const forward = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
    const backward = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
    if (event.key !== forward && event.key !== backward) return;
    event.preventDefault();
    const pos = enabledIndexes.indexOf(focusableIndex);
    const delta = event.key === forward ? 1 : -1;
    const nextPos = (pos + delta + enabledIndexes.length) % enabledIndexes.length;
    moveTo(enabledIndexes[nextPos]);
  };

  return (
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus -- roving tabindex: each button carries tabIndex 0/-1, not the container (WAI-ARIA composite widget pattern).
    <div
      ref={ref}
      role="radiogroup"
      onKeyDown={onKeyDown}
      className={cn(
        "fj:inline-flex fj:overflow-hidden fj:rounded-fuji-control fj:border fj:border-fuji-border-strong",
        MANAGED_ORIENTATION_CLASSES[orientation],
        className,
      )}
      {...props}
    >
      {items.map((item, index) => {
        const isSelected = item.value === selected;
        const isLast = index === items.length - 1;
        return (
          <button
            key={item.value}
            ref={(node) => {
              buttonsRef.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={item["aria-label"]}
            disabled={item.disabled}
            tabIndex={index === focusableIndex ? 0 : -1}
            onClick={() => setSelected(item.value)}
            className={cn(
              buttonBase({ size }),
              "fj:rounded-none fj:focus-visible:z-10",
              isSelected
                ? appearanceClasses(tone, "contained")
                : "fj:bg-fuji-surface fj:text-fuji-foreground-muted fj:hover:bg-fuji-surface-strong fj:hover:text-fuji-foreground",
              // Applied last so it always wins the border-color merge, even
              // for a selected button (whose "contained" appearance above
              // sets its own `border-transparent`) - otherwise the divider
              // between a selected segment and its next neighbor would
              // vanish specifically when the selected segment isn't last.
              !isLast &&
                (orientation === "horizontal"
                  ? "fj:border-r fj:border-fuji-border-strong"
                  : "fj:border-b fj:border-fuji-border-strong"),
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
});
