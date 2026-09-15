## Tones

All 6 decorative tones, contained appearance. Button's tone is purely visual (ComponentTone) - it carries no status meaning, unlike Alert or Toast's semantic variant.

```tsx
<Button tone="default">Default</Button>
<Button tone="forest">Forest</Button>
<Button tone="water">Water</Button>
<Button tone="sun">Sun</Button>
<Button tone="fire">Fire</Button>
```

## Sizes

sm / md / lg, default tone.

```tsx
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
```

## Appearance

contained (the raised accent), bordered, dashed, and ghost - the same four appearance names every control shares.

```tsx
<Button appearance="contained">Contained</Button>
<Button appearance="bordered">Bordered</Button>
<Button appearance="dashed">Dashed</Button>
<Button appearance="ghost">Ghost</Button>
```

## Icon button

Icon-only buttons across colors; aria-label is required at the type level.

```tsx
<IconButton aria-label="Favorite" tone="fire">
  <Heart className="size-4" />
</IconButton>
```

## Loading

```tsx
<Button loading>Saving</Button>
```

## Disabled

```tsx
<Button disabled>Disabled</Button>
```

## Button group

```tsx
<ButtonGroup>
  <Button appearance="bordered">Left</Button>
  <Button appearance="bordered">Mid</Button>
  <Button appearance="bordered">Right</Button>
</ButtonGroup>
```
