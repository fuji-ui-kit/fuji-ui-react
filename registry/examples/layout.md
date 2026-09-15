## Grid

```tsx
<Grid columns={3} gap={4}>
  <Box />
  <Box />
</Grid>
```

## Stack direction

direction="vertical" (the default) stacks children top-to-bottom; direction="horizontal" lays them out in a row.

```tsx
<Stack gap={4}>
  <Input placeholder="Full name" />
  <Input placeholder="Email" />
</Stack>

<Stack direction="horizontal" gap={2}>
  <Button appearance="bordered">Cancel</Button>
  <Button>Save</Button>
</Stack>
```

## AspectRatio

```tsx
<AspectRatio ratio={16 / 9}>
  <img src="/photos/ridge.jpg" alt="A ridge at sunrise" className="size-full object-cover" />
</AspectRatio>
```
