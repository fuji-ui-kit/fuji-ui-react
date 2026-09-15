"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "../../../lib/cn";
import { useControllableState } from "../../../hooks/useControllableState";
import type { ComponentSize } from "../../../types";
import { fieldSurface } from "../lib/field-surface";
import { Popover } from "../popover/Popover";
import { Calendar } from "../calendar/Calendar";

export interface DatePickerProps {
  /** Controlled selection. Pair with `onChange`; omit for uncontrolled. */
  value?: Date | null;
  /** Starting selection when uncontrolled. */
  defaultValue?: Date | null;
  /** Called with the picked date. */
  onChange?: (date: Date) => void;
  /** Earliest selectable date; anything before it renders disabled. */
  minDate?: Date;
  /** Latest selectable date; anything after it renders disabled. */
  maxDate?: Date;
  /** Text on the trigger while nothing is selected. */
  placeholder?: string;
  /** Trigger height, matching `Input` and `Button` at the same size. */
  size?: ComponentSize;
  /** Paints the error state. Pair with `FormField`'s `error` for the message. */
  invalid?: boolean;
  /** Disables the trigger, so the calendar cannot be opened. */
  disabled?: boolean;
  /** BCP 47 tag driving the formatted date and the calendar's names, via `Intl`. */
  locale?: string;
  /**
   * Makes the popover Calendar's month/year label an interactive chooser
   * (see `Calendar`'s own `interactiveHeader`). Defaults to false, which
   * keeps the simple non-clickable header with prev/next arrows only.
   */
  interactiveHeader?: boolean;
  /** Extra classes merged onto the trigger. */
  className?: string;
  /** Accessible name for the trigger button. Required when there is no visible `<label>` for this field. */
  "aria-label"?: string;
  /** Points at an existing visible label's id, as an alternative to `aria-label`. */
  "aria-labelledby"?: string;
}

/** Text field + popover Calendar (composition, not a Base UI primitive). */
export const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(function DatePicker(
  {
    value,
    defaultValue = null,
    onChange,
    minDate,
    maxDate,
    placeholder = "Select date",
    size = "md",
    invalid,
    disabled,
    locale = "en-US",
    interactiveHeader = false,
    className,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
  },
  ref,
) {
  const [selected, setSelected] = useControllableState<Date | null>({
    value,
    defaultValue,
    onChange: onChange as (v: Date | null) => void,
  });
  const [open, setOpen] = React.useState(false);
  const formatted = selected
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(selected)
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        ref={ref}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        data-invalid={invalid ? "" : undefined}
        aria-invalid={invalid || undefined}
        className={cn(
          fieldSurface({ size }),
          "fj:flex fj:items-center fj:justify-between fj:gap-2 fj:text-left",
          !formatted && "fj:text-fuji-foreground-subtle",
          className,
        )}
      >
        {formatted ?? placeholder}
        <CalendarDays className="fj:size-4 fj:shrink-0 fj:text-fuji-foreground-muted" />
      </Popover.Trigger>
      <Popover.Content showArrow={false} sideOffset={6} className="fj:p-0">
        <Calendar
          value={selected}
          onChange={(date) => {
            setSelected(date);
            setOpen(false);
          }}
          minDate={minDate}
          maxDate={maxDate}
          locale={locale}
          interactiveHeader={interactiveHeader}
          className="fj:w-[280px] fj:border-none fj:shadow-none"
        />
      </Popover.Content>
    </Popover>
  );
});
