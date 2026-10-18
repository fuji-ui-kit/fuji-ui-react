## Basic

Context menus open at the pointer on right-click or long-press. Always provide visible fallback actions so the same commands remain discoverable to touch, keyboard, and screen-reader users.

```tsx
<div className="flex items-center gap-3">
  <ContextMenu>
    <ContextMenu.Trigger
      tabIndex={0}
      className="rounded-fuji-item border border-fuji-border p-4 outline-none focus-visible:ring-2 focus-visible:ring-fuji-focus-ring"
    >
      Right click or long press here
    </ContextMenu.Trigger>
    <ContextMenu.Content>
      <ContextMenu.Item>Open</ContextMenu.Item>
      <ContextMenu.Item>Rename</ContextMenu.Item>
    </ContextMenu.Content>
  </ContextMenu>
  <DropdownMenu>
    <DropdownMenu.Trigger render={<Button appearance="bordered" />}>Actions</DropdownMenu.Trigger>
    <DropdownMenu.Content>
      <DropdownMenu.Item>Open</DropdownMenu.Item>
      <DropdownMenu.Item>Rename</DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu>
</div>
```

## File Actions with Fallback

Pairing a context menu with a visible actions button provides keyboard, touch, and screen-reader accessibility while preserving desktop power-user workflows.

```tsx
<div className="flex items-center justify-between gap-4 rounded-fuji-panel border border-fuji-border p-4">
  <ContextMenu>
    <ContextMenu.Trigger
      tabIndex={0}
      className="flex flex-1 items-center gap-3 rounded-fuji-item select-none outline-none focus-visible:ring-2 focus-visible:ring-fuji-focus-ring"
    >
      <FileText className="size-5 text-fuji-foreground" />
      <div>
        <p className="text-sm font-medium text-fuji-foreground">quarterly-report.pdf</p>
        <p className="text-xs text-fuji-foreground-muted">2.4 MB • PDF</p>
      </div>
    </ContextMenu.Trigger>
    <ContextMenu.Content>
      <ContextMenu.Item>Download</ContextMenu.Item>
      <ContextMenu.Item>Rename</ContextMenu.Item>
      <ContextMenu.Separator />
      <ContextMenu.Item>Delete</ContextMenu.Item>
    </ContextMenu.Content>
  </ContextMenu>
  <DropdownMenu>
    <DropdownMenu.Trigger render={<Button appearance="ghost" size="sm" />}>Actions</DropdownMenu.Trigger>
    <DropdownMenu.Content>
      <DropdownMenu.Item>Download</DropdownMenu.Item>
      <DropdownMenu.Item>Rename</DropdownMenu.Item>
      <DropdownMenu.Separator />
      <DropdownMenu.Item>Delete</DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu>
</div>
```
