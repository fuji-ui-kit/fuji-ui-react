"use client";

import * as React from "react";
import { cn } from "../../../lib/cn";
import { useControllableState } from "../../../hooks/useControllableState";
import { appearanceClasses } from "../lib/appearance";
import { buttonBase } from "./button.styles";
import type { ComponentSize, ComponentTone } from "../../../types";

export interface ButtonGroupItem {
  /** The value reported through `onValueChange`. */
  value: string;
  /** What the button reads as. */
  label: React.ReactNode;
  /** Renders the button unselectable while keeping it visible. */
  disabled?: boolean;
  /** Accessible name, for a button whose `label` is an icon or a glyph. */
  "aria-label"?: string;
}

export interface ButtonGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Lays the buttons out in a row or a column, joining the adjacent corners. */
  orientation?: "horizontal" | "vertical";
  /**
   * Enables single-selection mode. Omit to use ButtonGroup purely as a visual
   * grouping wrapper around `Button` children.
   */
  items?: ButtonGroupItem[];
  /** Controlled selected value (single-selection mode). */
  value?: string;
  /** Initially selected value (single-selection mode, uncontrolled). */
  defaultValue?: string;
  /** Called with the newly selected value (single-selection mode). */
  onValueChange?: (value: string) => void;
  /** Contained color used by the selected item. Default "default". */
  tone?: ComponentTone;
  /** Height of every button in the group. */
  size?: ComponentSize;
}

const ORIENTATION_CLASSES = {
  horizontal:
    "fj:flex-row fj:[&>button]:rounded-none fj:[&>button:first-child]:rounded-l-fuji-control fj:[&>button:last-child]:rounded-r-fuji-control fj:[&>button:not(:first-child)]:-ml-px",
  vertical:
    "fj:flex-col fj:[&>button]:rounded-none fj:[&>button:first-child]:rounded-t-fuji-control fj:[&>button:last-child]:rounded-b-fuji-control fj:[&>button:not(:first-child)]:-mt-px",
} as const;

// Managed (`items`) mode: a selected segment has an opaque "contained" fill, which bled a 1px sliver
// over neighbours with the negative-margin overlap, so each non-last button carries its own trailing
// border instead. (`divide-x` compiles to zero-specificity `:where(...)` and loses to `buttonBase`'s
// `border-0`, so it never rendered.)
const MANAGED_ORIENTATION_CLASSES = {
  horizontal: "fj:flex-row",
  vertical: "fj:flex-col",
} as const;

/**
 * Groups related buttons with touching edges. Pass `items` with `value`/`defaultValue`/
 * `onValueChange` for a single-select radiogroup with arrow keys; otherwise a visual group.
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
        "fj:inline-flex fj:overflow-hidden fj:rounded-fuji-control fj:border fj:border-fuji-border-strong fj:shadow-fuji-control",
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
              // The group carries the one shadow; per-segment shadows piled against every
              // divider inside `overflow-hidden` and read as a much heavier outline.
              "fj:rounded-none fj:shadow-none fj:focus-visible:z-10",
              isSelected
                ? appearanceClasses(tone, "contained")
                : "fj:bg-fuji-surface fj:text-fuji-foreground-muted fuji-hover-raised fj:hover:text-fuji-foreground",
              // Last so it wins the border-color merge over a selected segment's
              // `border-transparent`, which would otherwise erase the divider after it.
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
