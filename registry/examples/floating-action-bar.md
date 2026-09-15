## Basic

Press the trigger to expand. Escape or a click outside collapses it again.

```tsx
<FloatingActionBar
  actions={[
    { icon: <Share2 />, label: "Share", onSelect: share },
    { icon: <Copy />, label: "Duplicate", onSelect: duplicate },
    { icon: <Trash2 />, label: "Delete", destructive: true, onSelect: remove },
  ]}
/>
```

## Expanded by default

defaultOpen renders it already expanded - useful for a toolbar that is the primary control on a screen.

```tsx
<FloatingActionBar defaultOpen actions={actions} />
```

## Over content

Its natural home: pinned above a scrolling surface, where it stays reachable without occupying layout.

```tsx
<div className="absolute bottom-4 left-1/2 -translate-x-1/2">
  <FloatingActionBar actions={actions} />
</div>
```
