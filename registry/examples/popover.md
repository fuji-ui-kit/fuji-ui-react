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

## Placement

`side`, `align`, `sideOffset` and `alignOffset` on `Popover.Content` go to Base
UI's Positioner (defaults `bottom`, `center`, `8`, `0`). The same four props
work on `Tooltip.Content` and `DropdownMenu.Content`.

```tsx
<Popover>
  <Popover.Trigger render={<Button />}>Filters</Popover.Trigger>
  <Popover.Content side="right" align="start" alignOffset={-4}>
    <Popover.Title>Filters</Popover.Title>
  </Popover.Content>
</Popover>
```
