## Basic

```tsx
<DatePicker placeholder="Select date" onChange={setDate} />
```

## Sizes

sm / md / lg, matching the other form controls.

```tsx
<DatePicker size="lg" placeholder="Select date" />
```

## States

invalid and disabled behave like any other field.

```tsx
<DatePicker invalid />
<DatePicker disabled />
```

## Selectable header

interactiveHeader turns the month/year label into a month grid + year list for faster long-range navigation (default is prev/next arrows only).

```tsx
<DatePicker interactiveHeader defaultValue={new Date()} />
```

## Controlled

Own the selected Date with value and onChange (value is Date | null).

```tsx
const [value, setValue] = useState<Date | null>(new Date());
<DatePicker value={value} onChange={setValue} />;
```

## In a FormField

Inside a FormField the label names the trigger, the description is announced, and the field's invalid state paints the trigger - no aria-label or invalid prop needed.

```tsx
<FormField invalid={!dueDate}>
  <FormField.Label>Due date</FormField.Label>
  <DatePicker value={dueDate} onChange={setDueDate} minDate={new Date()} />
  <FormField.Error>Pick a due date.</FormField.Error>
</FormField>
```

## Fixed today

today is passed through to the popover Calendar (highlight, aria-current, initial month).

```tsx
<DatePicker aria-label="Date" today={new Date(2024, 4, 15)} />
```
