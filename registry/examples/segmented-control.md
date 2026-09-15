## Basic

A single choice, with a sliding indicator.

```tsx
<SegmentedControl
  defaultValue="grid"
  options={[
    { label: "Grid", value: "grid" },
    { label: "List", value: "list" },
  ]}
/>
```

## Controlled

Drives a view toggle from state.

```tsx
const [view, setView] = useState("grid");

<SegmentedControl value={view} onValueChange={setView} options={options} />;
```
