## Basic

```tsx
<Card>
  <Card.Header>
    <Card.Title>Plan</Card.Title>
  </Card.Header>
  <Card.Content>$29/month</Card.Content>
</Card>
```

## Hover effect: lift

Scales up slightly, tips a degree and deepens its shadow. Pure CSS, so it works inside a Server Component.

```tsx
<Card effect="lift">
  <Card.Header>
    <Card.Title>Weekly digest</Card.Title>
    <Card.Description>Everything that changed in your projects.</Card.Description>
  </Card.Header>
</Card>
```

## Hover effect: tilt

Tracks the pointer and tilts the card in 3D towards it, springing back when the pointer leaves.

```tsx
<Card effect="tilt">
  <Card.Header>
    <Card.Title>Weekly digest</Card.Title>
    <Card.Description>Everything that changed in your projects.</Card.Description>
  </Card.Header>
</Card>
```

## Media + badges + price row

```tsx
<Card>
  <Card.Media>
    <Image src="/photos/banff.jpg" alt="A turquoise lake below snow-capped peaks" ratio={4 / 3} />
    <Badge tone="sun" appearance="solid" className="absolute top-3 right-3">
      Top rated
    </Badge>
  </Card.Media>
  <Card.Header>
    <Card.Title>Banff, Canada</Card.Title>
    <Card.Description>Lakeside cabin, sleeps four.</Card.Description>
  </Card.Header>
  <Card.Footer className="items-center justify-between">
    <span>$172 / night</span>
    <Button size="sm">Book now</Button>
  </Card.Footer>
</Card>
```

## Full-bleed image + gradient overlay

```tsx
<Card>
  <Card.Media position="full">
    <Image src="/covers/dune-messiah.jpg" alt="" ratio={3 / 4} />
    <Card.Overlay>
      <h3>Dune Messiah</h3>
      <p>by Frank Herbert</p>
      <Stack direction="horizontal" gap={3}>
        <span>331 pages</span>
        <span>4.1 / 5</span>
      </Stack>
    </Card.Overlay>
  </Card.Media>
</Card>
```

## Overlapping avatar + bottom overlay

```tsx
<Card>
  <Card.Media position="full">
    <Image src="/photos/studio.jpg" alt="" ratio={3 / 4} />
    <Card.Overlay className="items-start">
      <Avatar src="/avatars/faith.jpg" size="lg" className="-mt-14 border-2 border-white" />
      <h3>Aiwanfo Faith</h3>
      <p>Product designer, Lagos</p>
      <Button size="sm">View profile</Button>
    </Card.Overlay>
  </Card.Media>
</Card>
```

## Freeform composition (payment card)

```tsx
<Card
  className="bg-gradient-to-br from-zinc-800 to-zinc-950 p-6 text-white"
  style={{ borderColor: "transparent" }}
>
  {/* freeform content - Card is just a styled, themeable container */}
</Card>
```

## Padding

padding sets the card's inner padding: "none", "sm", "md" (default, 20px) or "lg". Use "none" for flush content - an edge-to-edge image, or a list/table with its own row padding. Card.Media follows the value, so it bleeds to the edge at any padding.

```tsx
<Card padding="none" className="overflow-hidden">
  <Image src="/photos/banff.jpg" alt="A turquoise lake below snow-capped peaks" ratio={16 / 9} />
</Card>
<Card padding="sm">
  <Card.Header>
    <Card.Title>Compact</Card.Title>
  </Card.Header>
</Card>
```
