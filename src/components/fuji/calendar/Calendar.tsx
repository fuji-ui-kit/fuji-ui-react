"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../../lib/cn";
import { useControllableState } from "../../../hooks/useControllableState";
import { IconButton } from "../button/IconButton";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";
import {
  addDays,
  addMonths,
  addMonthsPreserveDay,
  clampDate,
  clampMonth,
  formatFullDate,
  formatMonthLabel,
  getHydrationSafeToday,
  getMonthGrid,
  getMonthNames,
  getWeekdayLabels,
  isMonthOutOfRange,
  isSameDay,
  isSameMonth,
} from "./date-utils";

export interface CalendarProps {
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
  /** BCP 47 tag driving the weekday and month names, via `Intl`. */
  locale?: string;
  /**
   * Makes the header month/year label an interactive chooser. Defaults to false,
   * which keeps the simple non-clickable header.
   */
  interactiveHeader?: boolean;
  /** Extra classes merged onto the calendar surface. */
  className?: string;
}

const YEARS_BACK = 100;

/** Single-month date grid picker - no external date library. */
export const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(function Calendar(
  {
    value,
    defaultValue = null,
    onChange,
    minDate,
    maxDate,
    locale = "en-US",
    interactiveHeader = false,
    className,
  },
  ref,
) {
  const [selected, setSelected] = useControllableState<Date | null>({
    value,
    defaultValue,
    onChange: onChange as (v: Date | null) => void,
  });
  // SSR-safe stand-in for "today" - see getHydrationSafeToday. Corrected to
  // the visitor's real local date after mount, below.
  const [today, setToday] = React.useState(getHydrationSafeToday);
  // Both start from the same clamped date so the grid never mounts showing a
  // month that doesn't contain its own roving tab stop (e.g. today falling
  // outside `minDate`/`maxDate`).
  const initialActiveDate = clampDate(selected ?? today, minDate, maxDate);
  const [visibleMonth, setVisibleMonth] = React.useState(() => initialActiveDate);
  // The single date in the grid's roving tab stop (ARIA APG date-grid pattern):
  // every other day cell is tabIndex=-1, so Tab only ever lands on one date.
  const [activeDate, setActiveDate] = React.useState(() => initialActiveDate);
  // True once the grid position has been driven by the user (click, arrow
  // keys, month/year chooser) rather than by the uncontrolled "today" default,
  // so the post-mount timezone correction below never yanks focus/view away
  // from somewhere the user already navigated to.
  const userMovedRef = React.useRef(false);
  const [chooserOpen, setChooserOpen] = React.useState(false);
  const headerButtonRef = React.useRef<HTMLButtonElement>(null);
  const chooserRef = React.useRef<HTMLDivElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const activeCellRef = React.useRef<HTMLButtonElement>(null);
  // Set right before a keyboard move so the focus-follows-active-date effect
  // only fires for keyboard navigation, never for clicks (already focused
  // natively) or unrelated re-renders.
  const shouldFocusActiveRef = React.useRef(false);
  // Compared by day (not reference) so a controlled parent re-rendering with
  // a fresh-but-equal `value` Date doesn't reset in-progress keyboard
  // navigation on every unrelated render.
  const lastSyncedValueRef = React.useRef(value);

  // Keep selection, the roving tab stop, and the visible month aligned when a
  // controlled `value` changes from outside (a "Today" button, another field
  // bound to the same date, a reset). Uncontrolled usage never runs this:
  // `value` stays `undefined` and `selected`/`activeDate` already track each
  // other locally.
  React.useEffect(() => {
    if (value === undefined) return;
    const previous = lastSyncedValueRef.current;
    lastSyncedValueRef.current = value;
    const unchanged =
      previous === value || (!previous && !value) || (!!previous && !!value && isSameDay(previous, value));
    if (unchanged) return;

    const next = clampDate(value ?? new Date(), minDate, maxDate);
    // Only follow focus into the grid if it was already there - an external
    // value change must not steal focus from wherever the user actually is.
    const hadFocusInGrid = !!gridRef.current?.contains(document.activeElement);
    setActiveDate(next);
    setVisibleMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    if (hadFocusInGrid) shouldFocusActiveRef.current = true;
  }, [value, minDate, maxDate]);

  // The SSR-safe "today" above matches the server's render exactly, but it's
  // UTC-normalized, not the visitor's actual local date. Correct it once after
  // mount - if the uncontrolled grid was still showing that default position
  // (no value/defaultValue, never navigated), bring it along too.
  React.useEffect(() => {
    const now = new Date();
    const localToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (isSameDay(localToday, today)) return;
    setToday(localToday);
    if (!userMovedRef.current && selected == null) {
      const next = clampDate(localToday, minDate, maxDate);
      setActiveDate(next);
      setVisibleMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    }
    // Runs once on mount to reconcile the SSR placeholder with real local time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weekdays = React.useMemo(() => getWeekdayLabels(locale), [locale]);
  const days = React.useMemo(() => getMonthGrid(visibleMonth), [visibleMonth]);
  const weeks = React.useMemo(
    () => Array.from({ length: days.length / 7 }, (_, index) => days.slice(index * 7, index * 7 + 7)),
    [days],
  );
  const monthNames = React.useMemo(() => getMonthNames(locale), [locale]);

  const isDisabled = (day: Date) => (minDate && day < minDate) || (maxDate && day > maxDate);

  React.useEffect(() => {
    if (shouldFocusActiveRef.current) {
      activeCellRef.current?.focus();
      shouldFocusActiveRef.current = false;
    }
  }, [activeDate, visibleMonth]);

  /** Moves the active date, bringing the grid to whatever month it lands in. */
  const moveActiveDate = (next: Date) => {
    userMovedRef.current = true;
    const clamped = clampDate(next, minDate, maxDate);
    setActiveDate(clamped);
    if (!days.some((day) => isSameDay(day, clamped))) {
      setVisibleMonth(new Date(clamped.getFullYear(), clamped.getMonth(), 1));
    }
    shouldFocusActiveRef.current = true;
  };

  const onGridKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowLeft":
        moveActiveDate(addDays(activeDate, -1));
        break;
      case "ArrowRight":
        moveActiveDate(addDays(activeDate, 1));
        break;
      case "ArrowUp":
        moveActiveDate(addDays(activeDate, -7));
        break;
      case "ArrowDown":
        moveActiveDate(addDays(activeDate, 7));
        break;
      case "Home":
        moveActiveDate(addDays(activeDate, -activeDate.getDay()));
        break;
      case "End":
        moveActiveDate(addDays(activeDate, 6 - activeDate.getDay()));
        break;
      case "PageUp":
        moveActiveDate(addMonthsPreserveDay(activeDate, -1));
        break;
      case "PageDown":
        moveActiveDate(addMonthsPreserveDay(activeDate, 1));
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  // `today` (not `new Date()`) - it's the SSR-safe stand-in defined above, so
  // this stays identical between server and client on the initial render
  // instead of depending on each runtime's own wall-clock timezone.
  const currentYear = today.getFullYear();
  const maxYear = maxDate ? maxDate.getFullYear() : currentYear;
  const minYear = minDate ? minDate.getFullYear() : currentYear - YEARS_BACK;
  const years = React.useMemo(() => {
    const list: number[] = [];
    for (let year = maxYear; year >= minYear; year -= 1) list.push(year);
    return list;
  }, [maxYear, minYear]);

  // Close the chooser on Escape or an outside click, returning focus to the trigger.
  React.useEffect(() => {
    if (!chooserOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setChooserOpen(false);
        headerButtonRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (
        chooserRef.current &&
        !chooserRef.current.contains(event.target as Node) &&
        !headerButtonRef.current?.contains(event.target as Node)
      ) {
        setChooserOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [chooserOpen]);

  // Previous/next are disabled once the visible month itself is the boundary
  // month, so navigation (and the arrow buttons below) can never reach a
  // month with no in-range days at all.
  const atMinMonth =
    !!minDate && isMonthOutOfRange(visibleMonth.getMonth() - 1, visibleMonth.getFullYear(), minDate, maxDate);
  const atMaxMonth =
    !!maxDate && isMonthOutOfRange(visibleMonth.getMonth() + 1, visibleMonth.getFullYear(), minDate, maxDate);

  // Month navigation (header arrows, month/year chooser) keeps the active
  // date's day-of-month so the roving tab stop stays meaningful, but never
  // steals focus the way keyboard grid navigation does. Clamped to
  // minDate/maxDate so it can't land the grid on a month with no valid
  // roving tab stop.
  const navigateMonth = (amount: number) => {
    userMovedRef.current = true;
    const targetMonth = clampMonth(addMonths(visibleMonth, amount), minDate, maxDate);
    setVisibleMonth(targetMonth);
    setActiveDate((current) => {
      const preserved = addMonthsPreserveDay(current, amount);
      const bounded = isSameMonth(preserved, targetMonth) ? preserved : targetMonth;
      return clampDate(bounded, minDate, maxDate);
    });
  };

  const setMonthYear = (monthIndex: number, year: number) => {
    userMovedRef.current = true;
    const target = clampMonth(new Date(year, monthIndex, 1), minDate, maxDate);
    const lastDayOfTarget = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    const next = new Date(
      target.getFullYear(),
      target.getMonth(),
      Math.min(activeDate.getDate(), lastDayOfTarget),
    );
    setVisibleMonth(target);
    setActiveDate(clampDate(next, minDate, maxDate));
  };

  return (
    <div
      ref={ref}
      className={cn(
        "fuji-glass-surface fj:box-border fj:relative fj:w-[280px] fj:rounded-fuji-panel fj:border fj:border-fuji-border fj:bg-fuji-surface fj:p-3 fj:shadow-fuji-card",
        className,
      )}
    >
      <div className="fj:mb-2 fj:flex fj:items-center fj:justify-between">
        <IconButton
          aria-label="Previous month"
          size="sm"
          appearance="ghost"
          disabled={atMinMonth}
          onClick={() => navigateMonth(-1)}
        >
          <ChevronLeft className="fj:size-4" />
        </IconButton>
        {interactiveHeader ? (
          <button
            ref={headerButtonRef}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={chooserOpen}
            onClick={() => setChooserOpen((open) => !open)}
            className={cn(
              NATIVE_CONTROL_RESET,
              "fj:cursor-pointer fj:rounded-fuji-control fj:px-2 fj:py-1 fj:text-[length:var(--fuji-text-sm)] fj:font-medium fj:text-fuji-foreground fuji-hover-raised",
            )}
          >
            {formatMonthLabel(visibleMonth, locale)}
          </button>
        ) : (
          <span className="fj:text-[length:var(--fuji-text-sm)] fj:font-medium fj:text-fuji-foreground">
            {formatMonthLabel(visibleMonth, locale)}
          </span>
        )}
        <IconButton
          aria-label="Next month"
          size="sm"
          appearance="ghost"
          disabled={atMaxMonth}
          onClick={() => navigateMonth(1)}
        >
          <ChevronRight className="fj:size-4" />
        </IconButton>
      </div>

      {interactiveHeader && chooserOpen && (
        <div
          ref={chooserRef}
          role="dialog"
          aria-label="Choose month and year"
          // `fuji-overlay-panel-nested`, not the blur-based overlay material:
          // this chooser renders inside the calendar card (which is itself a
          // glass surface) instead of portaling, and an ancestor with a
          // backdrop-filter becomes a backdrop root - so a blur here would
          // never see the date grid it covers. See base.css.
          className="fuji-overlay-panel-nested fj:absolute fj:inset-x-3 fj:top-12 fj:z-10 fj:flex fj:gap-2 fj:rounded-fuji-panel fj:border fj:border-fuji-border fj:p-2 fj:shadow-fuji-overlay"
        >
          <div className="fuji-scrollbar fj:grid fj:max-h-52 fj:flex-1 fj:grid-cols-3 fj:gap-1 fj:overflow-y-auto">
            {monthNames.map((name, index) => {
              const monthDisabled = isMonthOutOfRange(index, visibleMonth.getFullYear(), minDate, maxDate);
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={index === visibleMonth.getMonth()}
                  disabled={monthDisabled}
                  onClick={() => setMonthYear(index, visibleMonth.getFullYear())}
                  className={cn(
                    NATIVE_CONTROL_RESET,
                    "fj:cursor-pointer fj:rounded-fuji-control fj:px-1.5 fj:py-1.5 fj:text-[length:var(--fuji-text-xs)] fj:transition-colors fj:duration-[var(--fuji-duration-fast)]",
                    index === visibleMonth.getMonth()
                      ? "fj:bg-fuji-default fj:text-fuji-default-foreground"
                      : "fj:text-fuji-foreground fuji-hover-raised",
                    monthDisabled && "fj:pointer-events-none fj:cursor-not-allowed fj:opacity-30",
                  )}
                >
                  {name}
                </button>
              );
            })}
          </div>
          <div className="fuji-scrollbar fj:flex fj:max-h-52 fj:w-16 fj:flex-col fj:gap-1 fj:overflow-y-auto">
            {years.map((year) => (
              <button
                key={year}
                type="button"
                aria-pressed={year === visibleMonth.getFullYear()}
                onClick={() => setMonthYear(visibleMonth.getMonth(), year)}
                className={cn(
                  NATIVE_CONTROL_RESET,
                  "fj:shrink-0 fj:cursor-pointer fj:rounded-fuji-control fj:px-1.5 fj:py-1.5 fj:text-[length:var(--fuji-text-xs)] fj:transition-colors fj:duration-[var(--fuji-duration-fast)]",
                  year === visibleMonth.getFullYear()
                    ? "fj:bg-fuji-default fj:text-fuji-default-foreground"
                    : "fj:text-fuji-foreground fuji-hover-raised",
                )}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- roving tabindex: each date cell carries tabIndex 0/-1, not the container (WAI-ARIA composite widget pattern). */}
      <div
        ref={gridRef}
        role="grid"
        aria-label={formatMonthLabel(visibleMonth, locale)}
        onKeyDown={onGridKeyDown}
      >
        <div role="row" className="fj:mb-1 fj:grid fj:grid-cols-7">
          {weekdays.map((day, index) => (
            <span
              key={index}
              role="columnheader"
              className="fj:flex fj:h-7 fj:items-center fj:justify-center fj:text-[length:var(--fuji-text-xs)] fj:text-fuji-foreground-subtle"
            >
              {day}
            </span>
          ))}
        </div>
        {weeks.map((week) => (
          <div key={week[0].toISOString()} role="row" className="fj:grid fj:grid-cols-7 fj:gap-y-0.5">
            {week.map((day) => {
              const outsideMonth = !isSameMonth(day, visibleMonth);
              const isSelected = selected ? isSameDay(day, selected) : false;
              const isToday = isSameDay(day, today);
              const disabled = isDisabled(day);
              const isActive = isSameDay(day, activeDate);
              return (
                <button
                  key={day.toISOString()}
                  ref={isActive ? activeCellRef : undefined}
                  type="button"
                  role="gridcell"
                  aria-selected={isSelected}
                  // The visible label is the day number alone, which announces
                  // as a bare "14" - no month, no year, no weekday. The full
                  // date is the accessible name; the number stays the visual.
                  aria-label={formatFullDate(day, locale)}
                  // The standard way to say "this one is today". Previously
                  // today was conveyed by an accent color and a bolder weight
                  // and nothing else.
                  aria-current={isToday ? "date" : undefined}
                  tabIndex={isActive ? 0 : -1}
                  disabled={disabled}
                  onClick={() => {
                    userMovedRef.current = true;
                    setSelected(day);
                    setActiveDate(day);
                  }}
                  className={cn(
                    NATIVE_CONTROL_RESET,
                    "fj:relative fj:flex fj:size-9 fj:cursor-pointer fj:items-center fj:justify-center fj:rounded-full fj:text-[length:var(--fuji-text-sm)] fj:transition-colors fj:duration-[var(--fuji-duration-fast)]",
                    outsideMonth && "fj:text-fuji-foreground-subtle",
                    !outsideMonth && "fj:text-fuji-foreground",
                    !disabled && !isSelected && "fuji-hover-raised",
                    isToday && !isSelected && "fj:font-semibold fj:text-fuji-water",
                    isSelected && "fuji-raised fj:bg-fuji-contained-default fj:text-fuji-default-foreground",
                    disabled && "fj:pointer-events-none fj:cursor-not-allowed fj:opacity-30",
                  )}
                >
                  {day.getDate()}
                  {/*
                    A shape, not just a hue. Colour alone fails WCAG 1.4.1, and
                    the accent used for "today" is the one marker in this grid
                    that has no other visual form - selected has a filled
                    background, disabled has reduced opacity, outside-month has
                    a lighter weight. The dot inherits `currentColor` so it
                    stays legible on the selected fill too.
                  */}
                  {isToday && (
                    <span
                      aria-hidden="true"
                      className="fj:absolute fj:bottom-1 fj:size-1 fj:rounded-full fj:bg-current"
                    />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});
