## Basic

The default header is a plain, non-clickable month label.

```tsx
<Calendar value={date} onChange={setDate} />
```

## Interactive month/year header

Set interactiveHeader to open a compact month and year chooser anchored inside the calendar. Years run from the current year back 100 years, respecting min/maxDate.

```tsx
<Calendar interactiveHeader value={date} onChange={setDate} />
```

## Min and max range

Days outside the allowed range are disabled. Bounds compare by calendar day, so minDate={new Date()} disables the past but keeps today selectable.

```tsx
<Calendar minDate={new Date()} maxDate={maxDate} />
```

## Marked dates

markedDates puts a small dot under days that have something on them - a list of dates (matched by calendar day) or a predicate. markedDateLabel is appended to each marked day's accessible name, so say what the dot means.

```tsx
<Calendar
  value={date}
  onChange={setDate}
  markedDates={tasks.map((task) => task.dueDate)}
  markedDateLabel="has tasks"
/>
```

## Fixed today

today overrides the date treated as today (highlight, aria-current, initial month). Without it, today is the visitor's local date resolved after mount; pass one for deterministic server rendering, demos, and tests.

```tsx
<Calendar today={new Date(2024, 4, 15)} />
```
