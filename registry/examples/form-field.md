## Field with error

```tsx
<FormField invalid>
  <FormField.Label>Email</FormField.Label>
  <Input invalid />
  <FormField.Error>Enter a valid email.</FormField.Error>
</FormField>
```

## Fieldset

```tsx
<Fieldset>
  <Fieldset.Legend>Account</Fieldset.Legend>
  <FormField name="email">
    <FormField.Label>Email</FormField.Label>
    <Input type="email" placeholder="you@example.com" />
  </FormField>
  <FormField name="password">
    <FormField.Label>Password</FormField.Label>
    <Input type="password" />
  </FormField>
</Fieldset>
```
