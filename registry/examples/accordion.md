## Basic

A vertically stacked set of collapsible panels. In default single mode, expanding one item collapses any currently open item.

```tsx
<Accordion defaultValue={["shipping"]}>
  <Accordion.Item value="shipping">
    <Accordion.Header>
      <Accordion.Trigger>Shipping details</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Panel>
      Orders are dispatched within 2 business days. Standard shipping takes 3-5 business days.
    </Accordion.Panel>
  </Accordion.Item>

  <Accordion.Item value="returns">
    <Accordion.Header>
      <Accordion.Trigger>Returns & exchanges</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Panel>
      We accept returns within 30 days of receipt for unused items in original packaging.
    </Accordion.Panel>
  </Accordion.Item>

  <Accordion.Item value="warranty">
    <Accordion.Header>
      <Accordion.Trigger>Warranty coverage</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Panel>
      All hardware comes with a 2-year limited manufacturer warranty against defects.
    </Accordion.Panel>
  </Accordion.Item>
</Accordion>
```

## Multiple

Allow multiple panels to remain open at the same time using the multiple prop.

```tsx
<Accordion multiple defaultValue={["billing", "notifications"]}>
  <Accordion.Item value="billing">
    <Accordion.Header>
      <Accordion.Trigger>Billing settings</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Panel>Manage your subscription, payment methods, and invoice history.</Accordion.Panel>
  </Accordion.Item>

  <Accordion.Item value="notifications">
    <Accordion.Header>
      <Accordion.Trigger>Notification preferences</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Panel>Configure email, SMS, and in-app alerts for your account activity.</Accordion.Panel>
  </Accordion.Item>

  <Accordion.Item value="security">
    <Accordion.Header>
      <Accordion.Trigger>Security & privacy</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Panel>
      Two-factor authentication, active sessions, and data retention policies.
    </Accordion.Panel>
  </Accordion.Item>
</Accordion>
```

## Controlled

Control the expanded panels programmatically with value and onValueChange.

```tsx
const [expanded, setExpanded] = useState(["step-1"]);

<Accordion value={expanded} onValueChange={setExpanded}>
  <Accordion.Item value="step-1">
    <Accordion.Header>
      <Accordion.Trigger>Step 1: Account info</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Panel>Enter your email address and choose a password.</Accordion.Panel>
  </Accordion.Item>

  <Accordion.Item value="step-2">
    <Accordion.Header>
      <Accordion.Trigger>Step 2: Profile setup</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Panel>Set your display name, avatar, and time zone.</Accordion.Panel>
  </Accordion.Item>
</Accordion>;
```

## Disabled

Disable the entire accordion or individual items to prevent user interaction.

```tsx
<Accordion defaultValue={["active"]}>
  <Accordion.Item value="active">
    <Accordion.Header>
      <Accordion.Trigger>Available section</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Panel>This item can be toggled freely.</Accordion.Panel>
  </Accordion.Item>

  <Accordion.Item value="locked" disabled>
    <Accordion.Header>
      <Accordion.Trigger>Locked section</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Panel>This item is disabled and cannot be toggled.</Accordion.Panel>
  </Accordion.Item>
</Accordion>
```
