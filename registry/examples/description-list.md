## Horizontal (default)

```tsx
<DescriptionList items={[{ term: "Plan", description: "Pro" }]} />
```

## Vertical, stacked

columns={1} stacks term above description, which reads better for longer values.

```tsx
<DescriptionList
  columns={1}
  items={[
    { term: "Billing address", description: "14 Ridgeway, Bristol BS1 4QT" },
    { term: "Payment method", description: "Visa ending 6411" },
  ]}
/>
```

## Bordered card, no dividers

```tsx
<DescriptionList className="divide-y-0 rounded-fuji-panel border p-4" items={items} />
```
