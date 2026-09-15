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
