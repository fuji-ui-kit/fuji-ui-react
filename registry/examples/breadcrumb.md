## Basic

```tsx
<Breadcrumb items={[{ label: "Docs", href: "/docs" }, { label: "Themes" }]} />
```

## With icons

label accepts any ReactNode, so an icon and text can share one item.

```tsx
<Breadcrumb
  items={[
    {
      label: (
        <>
          <Home className="size-3.5" /> Home
        </>
      ),
      href: "/",
    },
  ]}
/>
```

## Collapsed long path

Middle segments collapse to an ellipsis item on deep hierarchies.

```tsx
<Breadcrumb
  items={[
    { label: "Docs", href: "/docs" },
    { label: "…" },
    { label: "Installation", href: "/installation" },
    { label: "Tailwind" },
  ]}
/>
```

## With a router link

renderLink is called for each linked ancestor with the item, the styled content, and the props Fuji's own anchor would get (href, className, children). The last item is the current page and is never a link.

```tsx
<Breadcrumb items={trail} renderLink={(item, children, linkProps) => <Link {...linkProps} />} />
```
