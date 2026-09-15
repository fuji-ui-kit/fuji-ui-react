## Tooltip

Hover/focus-triggered label for short hints.

```tsx
<Tooltip>
  <Tooltip.Trigger render={<Button />}>Hover me</Tooltip.Trigger>
  <Tooltip.Content>Saved</Tooltip.Content>
</Tooltip>
```

## Popover

Click-triggered floating content with a title and description.

```tsx
<Popover>
  <Popover.Trigger render={<Button />}>Notifications</Popover.Trigger>
  <Popover.Content>
    <Popover.Title>Notifications</Popover.Title>
  </Popover.Content>
</Popover>
```
