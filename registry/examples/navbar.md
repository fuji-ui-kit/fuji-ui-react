## Links with active state

```tsx
<Navbar items={[{ label: "Home", active: true }, { label: "Docs" }]} />
```

## Full app bar

A semantic header composed around Navbar with a logo, primary links, and trailing actions.

```tsx
<header className="flex items-center justify-between gap-6 px-6 py-3">
  <div className="flex items-center gap-4">
    <span>Fuji</span>
    <Navbar items={links} />
  </div>
  <Stack direction="horizontal" gap={1}>
    <IconButton aria-label="Search">
      <Search />
    </IconButton>
    <Avatar fallback="KY" />
  </Stack>
</header>
```

## With a router link

renderLink receives the item, the styled content, and the props Fuji's own anchor would get (href, aria-current, className, children), so the active item stays announced as the current page. Spread them onto your router's link; if you don't, they are applied to the element you return.

```tsx
<Navbar items={links} renderLink={(item, children, linkProps) => <Link {...linkProps} />} />
```
