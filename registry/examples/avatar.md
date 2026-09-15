## Sizes

```tsx
<Avatar fallback="KY" size="lg" />
```

## Image, initials, and icon fallback

```tsx
<Avatar src="/photo.jpg" alt="User avatar" fallback="KY" />
<Avatar fallback="AC" />
<Avatar fallback={<Icon />} />
```

## With status

Composed with a small positioned dot, the same pattern as Status Indicator.

```tsx
<span className="relative inline-flex">
  <Avatar fallback="KY" size="lg" />
  <span className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-fuji-surface bg-fuji-forest" />
</span>
```

## Avatar Group

```tsx
<AvatarGroup avatars={people} max={3} />
```

## Avatar Group: sizes

```tsx
<AvatarGroup size="lg" avatars={people} max={2} />
```

## Avatar Group: photos

With real faces the ring reads as each avatar being cut out of the one beneath it, rather than a line drawn across a neighbour.

```tsx
<AvatarGroup
  avatars={[{ src: "/priya.jpg", alt: "Priya Nair" }, …]}
  max={4}
/>
```

## Avatar Group: on a tinted surface

Set --fuji-avatar-group-ring when the group is not on the default surface, so the cut-out still matches what is behind it.

```tsx
<div style={{ "--fuji-avatar-group-ring": "var(--fuji-surface-subtle)" }}>
  <AvatarGroup avatars={people} />
</div>
```
