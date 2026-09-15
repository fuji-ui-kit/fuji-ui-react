## Basic

```tsx
<Combobox items={fruits} placeholder="Search fruit…" />
```

## No results

Type a query with no matches (e.g. "xyz") to see the built-in empty state.

```tsx
<Combobox items={fruits} placeholder="Search fruit…" />
// Base UI's <Base.Empty> renders "No results found." automatically
```

## Controlled

```tsx
const [value, setValue] = useState(fruits[0]);
<Combobox items={fruits} value={value} onValueChange={setValue} />;
```
