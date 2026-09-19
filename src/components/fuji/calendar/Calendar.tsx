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
  isDayOutOfRange,
  isMonthOutOfRange,
  isSameDay,
  isSameMonth,
  startOfDay,
} from "./date-utils";

export interface CalendarProps {
  /** Controlled selection. Pair with `onChange`; omit for uncontrolled. */
  value?: Date | null;
  /** Starting selection when uncontrolled. */
  defaultValue?: Date | null;
  /** Called with the picked date. */
  onChange?: (date: Date) => void;
  /**
   * Earliest selectable date; days before it render disabled. Compared by calendar day, so
   * `minDate={new Date()}` keeps today selectable.
   */
  minDate?: Date;
  /** Latest selectable date; days after it render disabled. Compared by calendar day, like `minDate`. */
  maxDate?: Date;
  /**
   * The date treated as "today" (highlight, `aria-current="date"`). Defaults to the visitor's local
   * date after mount (SSR uses a UTC placeholder); pass it for deterministic output or tests.
   */
  today?: Date;
  /**
   * Days to mark with a small dot (e.g. days with tasks): a list of dates matched by calendar day,
   * or a predicate per visible day. Marked days get `markedDateLabel` in their accessible name.
   */
  markedDates?: Date[] | ((date: Date) => boolean);
  /**
   * Text appended to a marked day's accessible name ("Monday, May 20, 2024, has tasks").
   * Default "marked". Describe what the mark means.
   */
  markedDateLabel?: string;
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
    today: todayProp,
    markedDates,
    markedDateLabel = "marked",
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
  // SSR-safe "today" (see getHydrationSafeToday), corrected to local date after mount below.
  // An explicit `today` prop replaces both, being identical on server and client.
  const [clockToday, setClockToday] = React.useState(getHydrationSafeToday);
  const todayTime = todayProp ? startOfDay(todayProp).getTime() : undefined;
  const today = React.useMemo(
    () => (todayTime === undefined ? clockToday : new Date(todayTime)),
    [todayTime, clockToday],
  );
  // Both start from the same clamped date so the grid never mounts on a month lacking its own
  // roving tab stop (e.g. today outside `minDate`/`maxDate`).
  const initialActiveDate = clampDate(selected ?? today, minDate, maxDate);
  const [visibleMonth, setVisibleMonth] = React.useState(() => initialActiveDate);
  // The grid's single roving tab stop (APG date grid); every other cell is tabIndex=-1.
  const [activeDate, setActiveDate] = React.useState(() => initialActiveDate);
  // True once the user drove the grid position, so the post-mount timezone correction never
  // yanks focus/view away from where the user navigated.
  const userMovedRef = React.useRef(false);
  const [chooserOpen, setChooserOpen] = React.useState(false);
  const headerButtonRef = React.useRef<HTMLButtonElement>(null);
  const chooserRef = React.useRef<HTMLDivElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const activeCellRef = React.useRef<HTMLButtonElement>(null);
  // Set just before a keyboard move so focus follows the active date only for keyboard nav.
  const shouldFocusActiveRef = React.useRef(false);
  // Compared by day, not reference, so a fresh-but-equal controlled `value` doesn't reset
  // in-progress keyboard navigation.
  const lastSyncedValueRef = React.useRef(value);

  // Keep selection, roving tab stop and visible month aligned when a controlled `value` changes
  // from outside (a "Today" button, a reset). Uncontrolled usage never runs this.
  React.useEffect(() => {
    if (value === undefined) return;
    const previous = lastSyncedValueRef.current;
    lastSyncedValueRef.current = value;
    const unchanged =
      previous === value || (!previous && !value) || (!!previous && !!value && isSameDay(previous, value));
    if (unchanged) return;

    const next = clampDate(value ?? today, minDate, maxDate);
    // Only follow focus into the grid if it was already there; never steal focus.
    const hadFocusInGrid = !!gridRef.current?.contains(document.activeElement);
    setActiveDate(next);
    setVisibleMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    if (hadFocusInGrid) shouldFocusActiveRef.current = true;
    // `today` is only the cleared-value fallback; a new "today" alone must not move the grid.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, minDate, maxDate]);

  // The SSR-safe "today" is UTC-normalized, not the visitor's local date. Correct it once after
  // mount, moving the uncontrolled grid too if it is still at that default position.
  React.useEffect(() => {
    // An explicit `today` prop is already correct on both passes.
    if (todayProp) return;
    const localToday = startOfDay(new Date());
    if (isSameDay(localToday, clockToday)) return;
    setClockToday(localToday);
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

  const isDisabled = (day: Date) => isDayOutOfRange(day, minDate, maxDate);

  const isMarked = React.useMemo(() => {
    if (!markedDates) return () => false;
    if (typeof markedDates === "function") return markedDates;
    const stamps = new Set(markedDates.map((date) => startOfDay(date).getTime()));
    return (day: Date) => stamps.has(startOfDay(day).getTime());
  }, [markedDates]);

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

  // `today`, not `new Date()`: the SSR-safe stand-in keeps server and client renders identical.
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

  // Disabled at the boundary month, so navigation never reaches a month with no in-range days.
  const atMinMonth =
    !!minDate && isMonthOutOfRange(visibleMonth.getMonth() - 1, visibleMonth.getFullYear(), minDate, maxDate);
  const atMaxMonth =
    !!maxDate && isMonthOutOfRange(visibleMonth.getMonth() + 1, visibleMonth.getFullYear(), minDate, maxDate);

  // Month navigation keeps the active day-of-month (clamped to minDate/maxDate) so the roving tab
  // stop stays valid, but never steals focus the way keyboard grid navigation does.
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
          // `fuji-overlay-panel-nested`, not blur: this renders inside the glass card rather than
          // portaling, and a backdrop-filter ancestor is a backdrop root, so a blur here would
          // never see the grid it covers. See base.css.
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
              const marked = isMarked(day);
              return (
                <button
                  key={day.toISOString()}
                  ref={isActive ? activeCellRef : undefined}
                  type="button"
                  role="gridcell"
                  aria-selected={isSelected}
                  // The visible label is a bare "14"; the full date is the accessible name.
                  aria-label={
                    marked
                      ? `${formatFullDate(day, locale)}, ${markedDateLabel}`
                      : formatFullDate(day, locale)
                  }
                  // Announces today, which is otherwise conveyed only by colour and weight.
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
                  {/* A shape, not just a hue (WCAG 1.4.1): today's accent has no other visual
                      form. Marked days get a second dot, announced via the cell's accessible
                      name, so both stay aria-hidden; `currentColor` keeps them legible on the
                      selected fill. */}
                  {(isToday || marked) && (
                    <span aria-hidden="true" className="fj:absolute fj:bottom-1 fj:flex fj:gap-0.5">
                      {isToday && <span className="fj:size-1 fj:rounded-full fj:bg-current" />}
                      {marked && (
                        <span
                          data-marked=""
                          className={cn(
                            "fj:size-1 fj:rounded-full",
                            isSelected || isToday ? "fj:bg-current" : "fj:bg-fuji-water",
                          )}
                        />
                      )}
                    </span>
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
