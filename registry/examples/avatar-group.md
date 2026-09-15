## Basic

max caps the visible faces; the rest collapse into a "+N" tile.

```tsx
<AvatarGroup
  max={3}
  avatars={[
    { fallback: "PN", src: "/avatars/priya.jpg" },
    { fallback: "KS", src: "/avatars/kenji.jpg" },
    { fallback: "MR" },
    { fallback: "AI" },
  ]}
/>
```

## On a coloured surface

The separating ring takes the surface behind it; override it per group.

```tsx
<AvatarGroup
  avatars={avatars}
  style={{ "--fuji-avatar-group-ring": "var(--fuji-surface-strong)" } as React.CSSProperties}
/>
```
