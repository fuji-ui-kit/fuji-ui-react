# Next.js usage

Fuji works with the App Router (Next.js 13+) and React 18/19.

## Setup

```tsx
// app/layout.tsx
import "@fujiui/react/styles.css";
import { FujiProvider } from "@fujiui/react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FujiProvider defaultTheme="light" defaultRadius="cornered">
          {children}
        </FujiProvider>
      </body>
    </html>
  );
}
```

`RootLayout` above stays a Server Component. `FujiProvider` is a Client
Component internally, but a Server Component is allowed to _render_ a Client
Component directly; React handles the boundary. You do not need to add
`"use client"` to `layout.tsx` just to use Fuji.

Not every Fuji component is a Client Component - roughly half are not, and the
distinction matters for what you can pass them. The next section is the rule.

## Server Components can render most Fuji components directly

Fuji ships two kinds of components:

- **Presentational components** with no internal state/effects/browser APIs
  (`Icon`, `Typography`, `Box`, `Container`, `Divider`, `Kbd`, `Timeline`,
  `Card`, and others) - these have no `"use client"` boundary of their own, so
  a Server Component can render them directly, including passing them a
  **component reference** as a prop:

  ```tsx
  // app/page.tsx - a Server Component
  import { Icon } from "@fujiui/react";
  import { SearchX } from "lucide-react";

  export default function Page() {
    return <Icon icon={SearchX} label="No results" />;
  }
  ```

- **Interactive components** (`Button`, `Input`, `Dialog`, `Carousel`, form
  controls, anything with state/hooks) carry their own `"use client"` and are
  client boundaries - a Server Component can still render them as JSX
  (`<Button>Save</Button>`), it just can't pass a _raw reference_ to one of
  them as a prop into another client component (the same rule as any other
  third-party client component).

## The compound-component boundary rule

Compound components - `Dialog`, `Drawer`, `Popover`, `Tabs`, `Select`,
`Combobox`, `MultiSelect`, `DropdownMenu`, `NavigationMenu`,
`RadioGroup`, `SegmentedControl` - expose **named sub-exports** in addition to
dot-access:

```tsx
import { Dialog, DialogContent, DialogTrigger } from "@fujiui/react";
```

A Server Component may render the root compound (`<Dialog>...</Dialog>`), but
must not access a static property like `Dialog.Content` through the
client-module binding from within a Server Component - Next.js replaces a
`"use client"` module's exports with an opaque client reference that doesn't
carry extra static properties in that context. If you hit:

```
Error: Element type is invalid ... (Dialog.Content)
```

Either import the named sub-export directly (`DialogContent` instead of
`Dialog.Content`), or move that section of the tree behind your own
`"use client"` boundary.

## Where to put the CSS import

Import `@fujiui/react/styles.css` exactly once, in the root layout (as shown
above) - not per-page, and not per-component. Next.js deduplicates/merges
global CSS imports from `layout.tsx` automatically.
