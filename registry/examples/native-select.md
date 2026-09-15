## Basic

Use it when the platform's own picker is wanted; use Select when the listbox should match the rest of the UI.

```tsx
<FormField name="country">
  <FormField.Label>Country</FormField.Label>
  <NativeSelect defaultValue="uk">
    <option value="uk">United Kingdom</option>
    <option value="ng">Nigeria</option>
    <option value="jp">Japan</option>
  </NativeSelect>
</FormField>
```
