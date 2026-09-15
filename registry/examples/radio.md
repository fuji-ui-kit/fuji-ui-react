## Basic

```tsx
<RadioGroup defaultValue="a">
  <RadioGroup.Item value="a" label="Option A" />
</RadioGroup>
```

## Controlled

Own the selected value with value and onValueChange.

```tsx
const [value, setValue] = useState("email");
<RadioGroup value={value} onValueChange={setValue}>
  <RadioGroup.Item value="email" label="Email" />
</RadioGroup>;
```

## Disabled group

Disable the whole group by setting disabled on RadioGroup.

```tsx
<RadioGroup defaultValue="a" disabled>
  <RadioGroup.Item value="a" label="Standard delivery" />
  <RadioGroup.Item value="b" label="Express delivery" />
</RadioGroup>
```
