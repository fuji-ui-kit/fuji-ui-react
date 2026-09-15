## Basic

```tsx
<Collapsible.Root>
  <Collapsible.Trigger>Shipping details</Collapsible.Trigger>
  <Collapsible.Panel>
    <p>Ships within two business days. Free returns for 30 days.</p>
  </Collapsible.Panel>
</Collapsible.Root>
```

## Initially open

Pass defaultOpen to render expanded on first paint (uncontrolled).

```tsx
<Collapsible.Root defaultOpen>
  <Collapsible.Trigger>Shipping details</Collapsible.Trigger>
  <Collapsible.Panel>
    <p>Ships within two business days. Free returns for 30 days.</p>
  </Collapsible.Panel>
</Collapsible.Root>
```

## Disabled

disabled locks the trigger so the panel can't be toggled.

```tsx
<Collapsible.Root disabled defaultOpen>
  <Collapsible.Trigger>Shipping details</Collapsible.Trigger>
  <Collapsible.Panel>
    <p>Ships within two business days. Free returns for 30 days.</p>
  </Collapsible.Panel>
</Collapsible.Root>
```
