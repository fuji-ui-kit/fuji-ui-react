## Appearances

contained, bordered, and ghost.

```tsx
<IconButton aria-label="Favorite" appearance="contained">
  <Heart className="size-4" />
</IconButton>
```

## Sizes

```tsx
<IconButton aria-label="Star" size="lg">
  <Star className="size-5" />
</IconButton>
```

## Decorative tones

Shares Button's 6 decorative tones (ComponentTone) - a purely visual choice, not a status signal.

```tsx
<IconButton aria-label="Delete" tone="fire">
  <Trash className="size-4" />
</IconButton>
```

## Disabled and loading

```tsx
<IconButton aria-label="Favorite" disabled><Heart className="size-4" /></IconButton>
<IconButton aria-label="Saving" loading><Star className="size-4" /></IconButton>
```
