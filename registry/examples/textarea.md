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

## One-line composer

Without `rows`, `size` sets a minimum height. Pass `rows` and that minimum is
dropped, so `rows={1}` is exactly one line - grow it with the content using
`field-sizing: content` or your own auto-grow.

```tsx
<Textarea rows={1} placeholder="Message…" style={{ fieldSizing: "content", maxHeight: "10rem" }} />
```
