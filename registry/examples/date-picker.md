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
