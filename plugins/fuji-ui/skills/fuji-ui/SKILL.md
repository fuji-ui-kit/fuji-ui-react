---
name: fuji-ui
description: Build, set up and review React UI with Fuji UI (@fujiui/react). Use when a project depends on @fujiui/react, when the user wants to add Fuji UI to an existing app, or when writing, refactoring or reviewing components, forms, dialogs, layouts or theming that import from @fujiui/react.
license: MIT
metadata:
  author: fuji-ui-kit
  homepage: https://fujiui.com/
---

# Fuji UI

Fuji UI is a themeable, accessible React component library published as
`@fujiui/react`. Everything is imported from the package root, styled by one
pre-compiled stylesheet, and themed once on `FujiProvider`.

## Look components up before writing code

When the Fuji MCP tools are connected - `list_components`, `get_component` and
`review_usage`, possibly with a prefix such as `mcp__fuji__get_component` - use
them. They answer from the `@fujiui/react` version installed in this project,
which is what the code compiles against.

1. Before using a component you have not used yet in this session, call
   `get_component` with its name. Take props, allowed values, defaults and
   compound parts from the answer; do not guess them.
2. To find the right component for a job, call `list_components` with a `query`
   (for example `"date"`, `"select"`, `"table"`) or a `category`. Never call it
   without one - that returns the whole library.
3. After writing or editing a file that imports `@fujiui/react`, call
   `review_usage` with the file's contents and fix every finding before you
   finish.
4. For dark mode, a theme toggle, following the OS, remembering the choice,
   glass, or styling your own markup so it follows the theme, call
   `get_appearance` (omit `topic` for the list) before writing that code.
5. If a tool replies that it cannot find `@fujiui/react`, or that the installed
   version is too old, tell the user exactly what it said - the reply names the
   fix.

When the tools are not connected, read the installed package instead: its
`README.md`, the guides in `node_modules/@fujiui/react/docs/`, and the prop
types in `node_modules/@fujiui/react/dist/index.d.ts`. Suggest connecting the
Fuji MCP server as well - in Claude Code,
`claude mcp add fuji -- npx -y @fujiui/mcp` - because it also checks the code.

## Adding Fuji to an existing app

When the tools are connected, `get_component` for `FujiProvider` returns these
steps for the installed version.

1. Install it in the package that renders the UI - in a monorepo, that
   workspace package, not the repository root: `npm install @fujiui/react` (or
   `pnpm add` / `yarn add`). `react` and `react-dom` 18 or 19 are peer
   dependencies.
2. Import `@fujiui/react/styles.css` **once**, at the app root. It is
   pre-compiled - the app needs no Tailwind config and no PostCSS setup for
   Fuji. Without it every component renders unstyled, with no error.
3. Wrap the app in `FujiProvider` and set the appearance there.

Next.js App Router, in `app/layout.tsx` - which stays a Server Component; it may
render `FujiProvider` without `"use client"`:

```tsx
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

Vite, or any client-rendered React app, in `src/main.tsx`:

```tsx
import "@fujiui/react/styles.css";
import { FujiProvider } from "@fujiui/react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <FujiProvider defaultTheme="light">
    <App />
  </FujiProvider>,
);
```

Fuji can be adopted a screen at a time. Its stylesheet ships no global reset,
and every component still renders with default appearance when there is no
`FujiProvider` above it.

## Rules

These are the mistakes `review_usage` catches. Follow them when the tools are
not connected, too.

<!-- rule: single-entry-point -->

- **Import from the package root only**: `import { Button, DialogContent } from "@fujiui/react"`.
  There are no subpath imports such as `@fujiui/react/button`.

<!-- rule: provider-owned-appearance -->

- **Appearance lives on `FujiProvider`.** `theme` (`light` | `dark`), `material`
  (`solid` | `glass`), `radius` (`cornered` | `soft`) and `elevation`
  (`regular` | `floating`) are set once there. No component takes them as props.
  For a region that looks different, nest another `FujiProvider`.

<!-- rule: stylesheet-required -->

- **Import `@fujiui/react/styles.css` once at the app root.** Do not rely on the
  app's own Tailwind build to produce Fuji's classes.

<!-- rule: icons-are-components -->

- **Icons are component references**, imported individually:
  `import { Check } from "lucide-react"` then `<Icon icon={Check} />` - never
  `icon="check"`.

<!-- rule: icon-only-needs-a-name -->

- **Icon-only controls need an accessible name**:
  `<IconButton aria-label="Delete"><Trash /></IconButton>`.

<!-- rule: value-defaultvalue -->

- **Controlled or uncontrolled, not both**: `value` with `onValueChange` (or
  `onChange`), or `defaultValue` alone. Passing both ignores the default.

<!-- rule: server-component-subparts -->

- **In a Server Component, use named sub-exports** - `<DialogContent>`, not
  `<Dialog.Content>`. A static property read does not survive the client-module
  boundary. Presentational components such as `Icon`, `Typography`, `Card` and
  `Timeline` are Server Components; check with `get_component` before passing a
  component an event handler.

<!-- rule: theme-via-provider -->

- **Switch the theme through the provider**: `setTheme` / `setMaterial` from
  `useFujiConfig()`, or a controlled `theme` prop. Never toggle a `.dark` class
  or write `data-fuji-*` attributes yourself - Fuji ignores the class and the
  provider overwrites the attributes. There is no `theme="system"`; follow the
  OS by passing a controlled theme (`get_appearance` topic `system`).

<!-- rule: no-templated-classes -->

- **Never assemble class names at runtime.** Tailwind's scanner is static, so
  `` `bg-fuji-${tone}` `` is never compiled. Write full class strings and branch
  between them.

## Theming, dark mode and glass

Call `get_appearance` with a topic before writing appearance code; these are
the mistakes it prevents:

- **Fill the page.** `FujiProvider` paints only its own wrapper - give the root
  provider `className="min-h-dvh"` and `persist`, or a dark app shows the
  browser's white past short content (topic `page`).
- **Your own markup.** `bg-white`, `text-gray-900` and Tailwind's `dark:`
  variant do not follow the provider. Use `var(--fuji-surface)`,
  `var(--fuji-foreground)` and the other tokens, or point `dark:` at
  `[data-fuji-theme=dark]` with one `@custom-variant` line (topic `own-markup`).
- **Glass needs a backdrop.** `material="glass"` over the flat theme background
  is correct but subtle; wrap the app in `fuji-glass-atmosphere` or your own
  photo or gradient (topic `glass`).
- **No flash on reload.** `persist` on the root provider, plus the
  `buildAppearanceBootstrapScript()` script in `<head>` for server-rendered apps
  (topic `persist`).

For token values per theme and material, call `get_appearance` with topic
`tokens` and a `group` (`color`, `glass`, `radius`, ...). The full guide is
`node_modules/@fujiui/react/docs/theming.md`.
