"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";
import { Field } from "@base-ui/react/field";
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
  /**
   * Earliest selectable date; days before it render disabled. Compared by
   * calendar day, so `minDate={new Date()}` keeps today selectable.
   */
  minDate?: Date;
  /** Latest selectable date; days after it render disabled. Compared by calendar day. */
  maxDate?: Date;
  /**
   * The date the popover Calendar treats as "today" (see `Calendar`'s
   * `today`). Defaults to the visitor's local date, resolved after mount.
   */
  today?: Date;
  /** Text on the trigger while nothing is selected. */
  placeholder?: string;
  /** Trigger height, matching `Input` and `Button` at the same size. */
  size?: ComponentSize;
  /**
   * Manually flags the invalid visual/aria state for standalone use. Inside a
   * `FormField`, the field's own invalid state is picked up automatically.
   */
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
    today,
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
      {/*
        The trigger renders through `Field.Control` - the same Field-aware
        leaf `Input` renders through - so inside a `<FormField>` it gets the
        field's generated `id` (the label's `htmlFor` target),
        `aria-labelledby`, `aria-describedby`, `data-invalid`/`aria-invalid`
        and `disabled`, exactly like every other Fuji field. As a bare
        `Popover.Trigger` it was invisible to Field: the label pointed at an
        id nothing rendered, and `<FormField invalid>` never reached it.
        `value` is the selected day as `YYYY-MM-DD`, which is what a
        FormField `validate` function receives. Standalone (no FormField),
        `Field.Control` falls back to its default context and adds nothing.
      */}
      <Field.Control
        ref={ref}
        render={<Popover.Trigger />}
        value={selected ? toIsoDay(selected) : ""}
        disabled={disabled}
        {...(ariaLabel ? { "aria-label": ariaLabel } : null)}
        // Only when given: an explicit `undefined` would still occupy the
        // key and win the merge over the FormField label's id.
        {...(ariaLabelledBy ? { "aria-labelledby": ariaLabelledBy } : null)}
        // Same spread-when-set reasoning as Input.tsx: an `undefined`-valued
        // `data-invalid` erases the one Field computes from `<FormField invalid>`.
        {...(invalid ? { "data-invalid": "" } : null)}
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
      </Field.Control>
      <Popover.Content showArrow={false} sideOffset={6} className="fj:p-0">
        <Calendar
          value={selected}
          onChange={(date) => {
            setSelected(date);
            setOpen(false);
          }}
          minDate={minDate}
          maxDate={maxDate}
          today={today}
          locale={locale}
          interactiveHeader={interactiveHeader}
          className="fj:w-[280px] fj:border-none fj:shadow-none"
        />
      </Popover.Content>
    </Popover>
  );
});

function toIsoDay(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
