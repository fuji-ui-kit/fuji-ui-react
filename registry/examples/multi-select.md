## Basic

Chosen options become removable chips.

```tsx
<MultiSelect
  aria-label="Tags"
  placeholder="Add tags"
  items={[
    { label: "Design", value: "design" },
    { label: "Engineering", value: "engineering" },
    { label: "Research", value: "research" },
  ]}
/>
```

## Controlled

onValueChange reports the whole selection.

```tsx
// MultiSelect reports the item objects, not their values - the chips render
// each item's own label.
const [tags, setTags] = useState<MultiSelectItem[]>([]);

<MultiSelect aria-label="Tags" items={items} value={tags} onValueChange={setTags} />;
```

## Sizes

sm / md / lg match the height of Select, Input, and Button at the same size.

```tsx
<MultiSelect aria-label="Tags" size="sm" items={items} />
<MultiSelect aria-label="Tags" size="md" items={items} />
<MultiSelect aria-label="Tags" size="lg" items={items} />
```

## In a FormField

FormField.Label names the input; no aria-label needed.

```tsx
<FormField>
  <FormField.Label>Tags</FormField.Label>
  <MultiSelect items={items} />
</FormField>
```
