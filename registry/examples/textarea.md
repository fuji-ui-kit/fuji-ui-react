## Basic

Registers with an ancestor FormField automatically.

```tsx
<FormField name="notes">
  <FormField.Label>Notes</FormField.Label>
  <Textarea rows={4} placeholder="Anything we should know?" />
</FormField>
```

## Invalid

invalid paints the error state; the message comes from FormField.Error.

```tsx
<FormField name="notes" invalid>
  <FormField.Label>Notes</FormField.Label>
  <Textarea invalid />
  <FormField.Error>Notes cannot be empty.</FormField.Error>
</FormField>
```
