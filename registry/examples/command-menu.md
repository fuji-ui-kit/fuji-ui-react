## Basic

```tsx
<CommandMenu open={open} onOpenChange={setOpen} items={items} />
```

## Trigger with a shortcut hint

Kbd renders a single keyboard key/shortcut token - pair it with a visible trigger so the ⌘K chord is discoverable, not the only way in.

```tsx
<Button onClick={() => setOpen(true)}>Search</Button>
<Kbd>⌘</Kbd>
<Kbd>K</Kbd>
```
