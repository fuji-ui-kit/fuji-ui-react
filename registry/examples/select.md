## Native Select

Platform-native select, best for progressive enhancement and mobile pickers.

```tsx
<NativeSelect defaultValue="apple">
  <option value="apple">Apple</option>
</NativeSelect>
```

## Select

Custom-styled dropdown (wraps Base UI Select), keyboard-first and scrollable.

```tsx
<Select items={fruits} placeholder="Select a fruit" />
```

## Disabled option

Individual items take disabled - the item is skipped by keyboard navigation and shown at reduced opacity.

```tsx
<Select
  items={[
    { label: "Apple", value: "apple" },
    { label: "Banana", value: "banana", disabled: true },
  ]}
/>
```

## Controlled

```tsx
const [value, setValue] = useState("apple");
<Select items={fruits} value={value} onValueChange={setValue} />;
```

## Multi Select

Multi-selection combobox with removable chips. The chevron stays pinned on the right; chips stay on one line and truncate when they overflow.

```tsx
<MultiSelect items={fruits} placeholder="Select fruits…" />
```

## Many selections overflow

With several values selected the chips truncate and the chevron never shifts.

```tsx
<MultiSelect items={fruits} defaultValue={fruits} />
```
