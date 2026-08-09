# Vite / standard React apps

Fuji has no router or meta-framework dependency, so it works in any React 18+
DOM tree: Vite, Create React App, or a bare Webpack/Rspack setup.

```tsx
// src/main.tsx
import "@fujiui/react/styles.css";
import { FujiProvider } from "@fujiui/react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <FujiProvider defaultTheme="light" defaultRadius="cornered">
    <App />
  </FujiProvider>,
);
```

Import the stylesheet once, at your entry point (as above) - or in your
top-level `App` component if you prefer; either works as long as it's a single
import, not one per page/route.

No Tailwind setup, PostCSS config, or bundler plugin is required - `styles.css`
is plain, pre-compiled CSS.

## TypeScript

If your `tsconfig.json` uses `"moduleResolution": "bundler"` or `"node16"`/
`"nodenext"`, the package's `exports` map (types, ESM, CJS) resolves
automatically. With older `"moduleResolution": "node"`, TypeScript falls back
to the `"types"` field, which points at the same consolidated declaration
file - no extra configuration needed either way.
