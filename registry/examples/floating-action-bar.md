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

Its natural home: pinned above a scrolling surface, where it stays reachable without occupying layout. The root carries no position of its own, so position it directly with className.

```tsx
<FloatingActionBar className="fixed right-6 bottom-6" actions={actions} />
```

## Actions with the same label

Actions are keyed by id when given, else by label and position - so repeated labels are fine. Pass a stable id when the list changes while open.

```tsx
<FloatingActionBar
  actions={[
    { id: "share-link", icon: <Link />, label: "Share", onSelect: shareLink },
    { id: "share-file", icon: <FileDown />, label: "Share", onSelect: shareFile },
  ]}
/>
```
