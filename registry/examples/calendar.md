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

Days outside the allowed range are disabled.

```tsx
<Calendar minDate={minDate} maxDate={maxDate} />
```
