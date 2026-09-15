## 24-hour

```tsx
<TimePicker value={time} onChange={setTime} />
```

## 12-hour with minute step

```tsx
<TimePicker hourCycle={12} minuteStep={15} />
```

## States

Disabled and invalid. The clear control appears once a value is set.

```tsx
<TimePicker invalid />
<TimePicker disabled />
```
