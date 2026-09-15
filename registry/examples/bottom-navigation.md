## Bar

The default: full-width, flush with the bottom edge.

```tsx
<BottomNavigation items={items} onItemSelect={(item, index) => setActive(index)} />
```

## Floating

variant='floating' detaches the bar from the edge as a pill with the panel shadow, for a bar that sits over scrolling content.

```tsx
<BottomNavigation variant="floating" items={items} />
```

## Floating, notched, with a centre action

action places a raised primary button in a notch cut from the bar, and the items split evenly either side of it. Give it an aria-label - it is icon-only.

```tsx
<BottomNavigation variant="floating" items={items} action={{ icon: <Plus />, "aria-label": "Create" }} />
```

## Active indicators

indicator picks how the active tab is marked, beyond the label and icon colour. Colour alone is not sufficient (WCAG 1.4.1); aria-current='page' is always set regardless.

```tsx
<BottomNavigation indicator="pill" items={items} />
```

## With a badge

Pass a composed icon element to show unread counts or alerts.

```tsx
{ label: "Alerts", icon: (
  <span className="relative">
    <Bell />
    <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-fuji-fire" />
  </span>
) }
```
