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

badge pins a count pill to an item's icon - hidden at 0, capped at 99+. A numeric badge is announced as part of the item's name ("Chats, 3 unread"); pass badgeLabel to change that wording, or to give a non-numeric badge a meaningful announcement.

```tsx
<BottomNavigation
  items={[
    { label: "Home", icon: <Home />, href: "/", active: true },
    { label: "Chats", icon: <MessageCircle />, href: "/chats", badge: 3 },
    { label: "Requests", icon: <Users />, href: "/requests", badge: 2, badgeLabel: "2 pending requests" },
  ]}
/>
```

## With a router link

renderLink receives the item, the styled content, and the props Fuji's own anchor would get (href, aria-current, className, onClick, children). Spread them onto your router's link; if you don't, they are applied to the element you return.

```tsx
<BottomNavigation items={items} renderLink={(item, children, linkProps) => <Link {...linkProps} />} />
```
