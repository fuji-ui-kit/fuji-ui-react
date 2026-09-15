## Basic

A leading search icon, and a clear button once there is a value.

```tsx
<SearchInput placeholder="Search components" aria-label="Search components" />
```

## Controlled

Clearing fires a change like any other edit.

```tsx
const [query, setQuery] = useState("");

<SearchInput value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search" />;
```
