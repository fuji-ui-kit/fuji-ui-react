"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { Field } from "@base-ui/react/field";
import { cn } from "../../../lib/cn";
import { useControllableState } from "../../../hooks/useControllableState";
import { Popover } from "../popover";
import { DismissButton } from "../lib/dismiss-button";
import { fieldSurface } from "../lib/field-surface";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";
import type { ComponentSize } from "../../../types";

export interface TimePickerProps {
  /** Value as a 24-hour "HH:mm" string. This is the stable form/value contract regardless of display format. */
  value?: string;
  /** Starting value when uncontrolled, in the same 24-hour "HH:mm" form. */
  defaultValue?: string;
  /** Called with the 24-hour "HH:mm" string, whatever `hourCycle` displays. */
  onChange?: (value: string) => void;
  /** Display format. The stored value is always 24-hour "HH:mm". Default 24. */
  hourCycle?: 12 | 24;
  /** Minute increment for the list. Default 5. */
  minuteStep?: number;
  /** Disables the trigger, so the list cannot be opened. */
  disabled?: boolean;
  /**
   * Manually flags the invalid visual/aria state for standalone use. Inside a
   * `FormField`, the field's own invalid state is picked up automatically.
   */
  invalid?: boolean;
  /** Show a clear control when a value is set. Default true. */
  clearable?: boolean;
  /** Text on the trigger while nothing is selected. */
  placeholder?: string;
  /** Trigger height, matching `Input` and `Button` at the same size. */
  size?: ComponentSize;
  /** Renders a hidden input so the value posts with a form. */
  name?: string;
  /** Extra classes merged onto the trigger. */
  className?: string;
  /**
   * Accessible name for the trigger. Default `"Select time"`. Inside a
   * `FormField`, the field's label names the trigger instead (its
   * `aria-labelledby` takes precedence over this).
   */
  "aria-label"?: string;
  /** Points at an existing visible label's id, as an alternative to `aria-label`. */
  "aria-labelledby"?: string;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function parse(value: string | undefined): { hour: number; minute: number } | null {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return { hour: h, minute: m };
}

function formatDisplay(value: string | undefined, hourCycle: 12 | 24): string | null {
  const parsed = parse(value);
  if (!parsed) return null;
  if (hourCycle === 24) return `${pad(parsed.hour)}:${pad(parsed.minute)}`;
  const meridiem = parsed.hour < 12 ? "AM" : "PM";
  const hour12 = parsed.hour % 12 || 12;
  return `${hour12}:${pad(parsed.minute)} ${meridiem}`;
}

/**
 * Fuji-styled time picker built on Popover with hour and minute lists. Keeps a
 * stable 24-hour "HH:mm" value contract (and an optional hidden input) so it
 * drops into forms, while the display can use 12- or 24-hour format.
 */
export const TimePicker = React.forwardRef<HTMLButtonElement, TimePickerProps>(function TimePicker(
  {
    value,
    defaultValue,
    onChange,
    hourCycle = 24,
    minuteStep = 5,
    disabled,
    invalid,
    clearable = true,
    placeholder = "Select time",
    size = "md",
    name,
    className,
    "aria-label": ariaLabel = "Select time",
    "aria-labelledby": ariaLabelledBy,
  },
  ref,
) {
  const [current, setCurrent] = useControllableState<string | undefined>({
    value,
    defaultValue,
    onChange: (next) => next !== undefined && onChange?.(next),
  });
  const [open, setOpen] = React.useState(false);

  const parsed = parse(current);
  const display = formatDisplay(current, hourCycle);

  const commit = (hour: number, minute: number) => setCurrent(`${pad(hour)}:${pad(minute)}`);

  const hours = hourCycle === 24 ? range(0, 23) : range(1, 12);
  const minutes = range(0, 59).filter((m) => m % minuteStep === 0);
  const meridiem = parsed ? (parsed.hour < 12 ? "AM" : "PM") : "AM";

  const selectHour = (displayHour: number) => {
    const minute = parsed?.minute ?? 0;
    if (hourCycle === 24) {
      commit(displayHour, minute);
    } else {
      const base = displayHour % 12;
      commit(meridiem === "PM" ? base + 12 : base, minute);
    }
  };
  const selectMinute = (minute: number) => commit(parsed?.hour ?? (hourCycle === 24 ? 0 : 0), minute);
  const selectMeridiem = (next: "AM" | "PM") => {
    const hour = parsed?.hour ?? 0;
    const base = hour % 12;
    commit(next === "PM" ? base + 12 : base, parsed?.minute ?? 0);
  };

  const displayHour = parsed ? (hourCycle === 24 ? parsed.hour : parsed.hour % 12 || 12) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("fj:relative fj:inline-flex fj:w-full fj:max-w-[12rem] fj:items-center", className)}>
        {/*
          Rendered through `Field.Control` so a surrounding `<FormField>`
          labels, describes, disables and invalidates it like any other Fuji
          field - see the same wiring (and why) in DatePicker.tsx. `value` is
          the "HH:mm" string a FormField `validate` function receives.
        */}
        <Field.Control
          ref={ref}
          render={<Popover.Trigger />}
          value={current ?? ""}
          disabled={disabled}
          // Spread-when-set: an `undefined`-valued key would erase the value
          // Field computes from an ancestor FormField (see Input.tsx).
          {...(invalid ? { "data-invalid": "" } : null)}
          {...(ariaLabelledBy ? { "aria-labelledby": ariaLabelledBy } : null)}
          aria-invalid={invalid || undefined}
          aria-label={ariaLabel}
          className={cn(
            fieldSurface({ size }),
            "fj:flex fj:cursor-pointer fj:items-center fj:gap-2 fj:text-left",
            clearable && current ? "fj:pr-9" : "fj:pr-3",
          )}
        >
          <Clock className="fj:size-4 fj:shrink-0 fj:text-fuji-foreground-muted" aria-hidden="true" />
          <span className={cn("fj:flex-1 fj:truncate", !display && "fj:text-fuji-foreground-subtle")}>
            {display ?? placeholder}
          </span>
        </Field.Control>
        {clearable && current && !disabled && (
          <DismissButton
            aria-label="Clear time"
            onClick={() => setCurrent("")}
            className="fj:absolute fj:top-1/2 fj:right-2 fj:-translate-y-1/2"
          />
        )}
      </div>
      {name && <input type="hidden" name={name} value={current ?? ""} />}
      <Popover.Content showArrow={false} sideOffset={6} className="fj:max-w-none fj:p-0">
        <div className="fj:flex fj:h-56" role="group" aria-label="Time">
          <TimeColumn
            label="Hour"
            items={hours}
            isActive={(h) => h === displayHour}
            onSelect={selectHour}
            format={hourCycle === 24 ? pad : String}
          />
          <div className="fj:w-px fj:bg-fuji-border" />
          <TimeColumn
            label="Minute"
            items={minutes}
            isActive={(m) => m === parsed?.minute}
            onSelect={selectMinute}
            format={pad}
          />
          {hourCycle === 12 && (
            <>
              <div className="fj:w-px fj:bg-fuji-border" />
              <div className="fj:flex fj:w-14 fj:flex-col fj:gap-1 fj:p-1">
                {(["AM", "PM"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={meridiem === m && !!parsed}
                    onClick={() => selectMeridiem(m)}
                    className={cn(
                      NATIVE_CONTROL_RESET,
                      "fj:cursor-pointer fj:rounded-fuji-control fj:px-2 fj:py-1.5 fj:text-[length:var(--fuji-text-sm)] fj:transition-colors fj:duration-[var(--fuji-duration-fast)]",
                      meridiem === m && parsed
                        ? "fj:bg-fuji-default fj:text-fuji-default-foreground"
                        : "fj:text-fuji-foreground fuji-hover-raised",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </Popover.Content>
    </Popover>
  );
});

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

interface TimeColumnProps {
  label: string;
  items: number[];
  isActive: (value: number) => boolean;
  onSelect: (value: number) => void;
  format: (value: number) => string;
}

function TimeColumn({ label, items, isActive, onSelect, format }: TimeColumnProps) {
  return (
    <div
      className="fuji-scrollbar fj:flex fj:w-16 fj:flex-col fj:gap-1 fj:overflow-y-auto fj:p-1"
      aria-label={label}
    >
      {items.map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={isActive(item)}
          onClick={() => onSelect(item)}
          className={cn(
            NATIVE_CONTROL_RESET,
            "fj:shrink-0 fj:cursor-pointer fj:rounded-fuji-control fj:px-2 fj:py-1.5 fj:text-center fj:text-[length:var(--fuji-text-sm)] fj:transition-colors fj:duration-[var(--fuji-duration-fast)]",
            isActive(item)
              ? "fj:bg-fuji-default fj:text-fuji-default-foreground"
              : "fj:text-fuji-foreground fuji-hover-raised",
          )}
        >
          {format(item)}
        </button>
      ))}
    </div>
  );
}
