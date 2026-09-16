## All sides

```tsx
<Drawer swipeDirection="right">
  <Drawer.Trigger render={<Button />}>Open</Drawer.Trigger>
  <Drawer.Content side="right">
    <Drawer.Title>Filters</Drawer.Title>
    <Drawer.Description>Narrow results by category and price.</Drawer.Description>
  </Drawer.Content>
</Drawer>
```

## Bottom drawer

side='bottom' with swipeDirection='down' rises from the bottom edge, spans it, shows a drag handle, and can be flicked away. On a phone this is the shape most actions should take rather than a centred dialog.

```tsx
<Drawer swipeDirection="down">
  <Drawer.Trigger render={<Button />}>Open sheet</Drawer.Trigger>
  <Drawer.Content side="bottom">
    <Drawer.Title>Share this listing</Drawer.Title>
  </Drawer.Content>
</Drawer>
```

## Sheet variant

variant='sheet' detaches the panel from the edge: inset all round, rounded on every corner, width-capped, with the dimmed page still visible around it. Reach for it when the panel is a short, self-contained task - a share menu, a confirmation - rather than navigation or a long form.

```tsx
<Drawer swipeDirection="down">
  <Drawer.Trigger render={<Button />}>Open sheet</Drawer.Trigger>
  <Drawer.Content side="bottom" variant="sheet">
    <Drawer.Title>Share this listing</Drawer.Title>
  </Drawer.Content>
</Drawer>
```

## Detail panel

A right-side drawer used as a full record view alongside the page it was opened from - a long, scrollable panel rather than a short confirmation.

```tsx
<Drawer swipeDirection="right">
  <Drawer.Trigger render={<Button />}>View full details</Drawer.Trigger>
  <Drawer.Content side="right">…</Drawer.Content>
</Drawer>
```

## Panel width

`width` sizes a `left` or `right` panel: `sm` 16rem, `md` 20rem (default), `lg`
28rem, `full` the viewport. Every width stops 3rem short of the viewport so the
dimmed page stays visible. Top and bottom panels span their edge and ignore it.

```tsx
<Drawer swipeDirection="right">
  <Drawer.Trigger render={<Button />}>Open record</Drawer.Trigger>
  <Drawer.Content side="right" width="lg">
    <Drawer.Title>Invoice #1042</Drawer.Title>
  </Drawer.Content>
</Drawer>
```

## Long content

Every panel scrolls its own content once it reaches the viewport cap (full
height for a side panel, 85vh for top and bottom), so a long form needs no
scroll wrapper. The built-in close button scrolls with the content; Escape and
a press on the backdrop still dismiss.
