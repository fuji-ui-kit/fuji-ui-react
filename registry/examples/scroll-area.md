## Vertical scroll

```tsx
<ScrollArea className="h-32 w-56">
  <Stack gap={2}>
    {rows.map((row) => (
      <p key={row.id}>{row.label}</p>
    ))}
  </Stack>
</ScrollArea>
```
