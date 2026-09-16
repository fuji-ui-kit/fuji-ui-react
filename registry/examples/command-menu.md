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

## Binding ⌘K

`hotkey` toggles the palette when the key is pressed with ⌘ or Ctrl, so there
is no document listener to write. Off by default. The palette works
uncontrolled, so a palette opened only by its shortcut needs no state.

```tsx
<CommandMenu hotkey="k" items={items} />
```

## A second step

An item with `closeOnSelect: false` keeps the palette open after `onSelect`.
Swap `items` from it to show the next step; the query is cleared and focus goes
back to the search field.

```tsx
const [step, setStep] = React.useState<"root" | "theme">("root");

const items: CommandMenuItem[] =
  step === "root"
    ? [{ id: "theme", label: "Change theme…", closeOnSelect: false, onSelect: () => setStep("theme") }]
    : [
        { id: "light", label: "Light", onSelect: () => setTheme("light") },
        { id: "dark", label: "Dark", onSelect: () => setTheme("dark") },
      ];

<CommandMenu hotkey="k" items={items} onOpenChange={(open) => !open && setStep("root")} />;
```
