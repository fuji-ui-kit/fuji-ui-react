export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Local midnight of `date` - drops the time of day so comparisons are by calendar day. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Whether `date`'s calendar day falls before `minDate`'s or after `maxDate`'s. Compared by day,
 * not timestamp: `minDate={new Date()}` carries the time of day and would disable today itself.
 */
export function isDayOutOfRange(date: Date, minDate?: Date, maxDate?: Date): boolean {
  const day = startOfDay(date).getTime();
  if (minDate && day < startOfDay(minDate).getTime()) return true;
  if (maxDate && day > startOfDay(maxDate).getTime()) return true;
  return false;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function addDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

/** Adds whole months while preserving the day-of-month, clamped to the target month's length (Jan 31 + 1 month -> Feb 28). */
export function addMonthsPreserveDay(date: Date, amount: number): Date {
  const day = date.getDate();
  const targetFirst = new Date(date.getFullYear(), date.getMonth() + amount, 1);
  const lastDayOfTarget = new Date(targetFirst.getFullYear(), targetFirst.getMonth() + 1, 0).getDate();
  return new Date(targetFirst.getFullYear(), targetFirst.getMonth(), Math.min(day, lastDayOfTarget));
}

/**
 * "Today," normalized so its local Y/M/D equal UTC's: server and client read `new Date()` in
 * different timezones, so this matches across both passes as long as they share a UTC day.
 */
export function getHydrationSafeToday(): Date {
  const now = new Date();
  return new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/** Clamps `date` into the `minDate`/`maxDate` calendar days (compared by day - see `isDayOutOfRange`). */
export function clampDate(date: Date, minDate?: Date, maxDate?: Date): Date {
  const day = startOfDay(date).getTime();
  if (minDate && day < startOfDay(minDate).getTime()) return startOfDay(minDate);
  if (maxDate && day > startOfDay(maxDate).getTime()) return startOfDay(maxDate);
  return date;
}

function monthStamp(date: Date): number {
  return date.getFullYear() * 12 + date.getMonth();
}

/** True when `year`/`monthIndex` falls entirely outside the `minDate`/`maxDate` months. */
export function isMonthOutOfRange(monthIndex: number, year: number, minDate?: Date, maxDate?: Date): boolean {
  const stamp = year * 12 + monthIndex;
  if (minDate && stamp < monthStamp(minDate)) return true;
  if (maxDate && stamp > monthStamp(maxDate)) return true;
  return false;
}

/** Clamps a month (day is ignored) to the first day of the nearest in-range month. */
export function clampMonth(date: Date, minDate?: Date, maxDate?: Date): Date {
  const stamp = monthStamp(date);
  if (minDate && stamp < monthStamp(minDate)) return startOfMonth(minDate);
  if (maxDate && stamp > monthStamp(maxDate)) return startOfMonth(maxDate);
  return startOfMonth(date);
}

/** Weeks of `Date`s covering the full 6-row grid for `month`, Sunday-first. */
export function getMonthGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
}

export function formatMonthLabel(date: Date, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(date);
}

/**
 * The full date, for a day cell's accessible name - the visible "14" is useless without the
 * header's month. `weekday` tells arrow-key users when the cursor wrapped to a new row.
 */
export function formatFullDate(date: Date, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function getWeekdayLabels(locale = "en-US"): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
  // 2023-01-01 is a Sunday - a stable reference week.
  return Array.from({ length: 7 }, (_, index) => formatter.format(new Date(2023, 0, 1 + index)));
}

/** Localized short names for all 12 months, January-first. */
export function getMonthNames(locale = "en-US"): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { month: "short" });
  return Array.from({ length: 12 }, (_, index) => formatter.format(new Date(2023, index, 1)));
}
