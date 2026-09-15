## Basic

Mount once at the app root. Every appearance axis is set here, never per component.

```tsx
import { FujiProvider } from "@fujiui/react";
import "@fujiui/react/styles.css";

<FujiProvider defaultTheme="light" defaultRadius="soft" defaultElevation="regular">
  <App />
</FujiProvider>;
```

## Persisted

persist stores the choice and hydrates from it. Only the root provider should set it.

```tsx
<FujiProvider persist defaultTheme="dark">
  <App />
</FujiProvider>
```

## Glass material

material is a separate axis from theme - either theme can render in either
material.

```tsx
<FujiProvider defaultTheme="dark" defaultMaterial="glass">
  <App />
</FujiProvider>
```

## Glass tinted independently of the page theme

Glass has no separate tint prop - the active theme is the tint (light theme
-> light-tinted glass, dark theme -> dark-tinted glass). To show glass tinted
differently from the surrounding page, nest a scoped provider with its own
theme (and material re-declared - nested providers don't inherit unspecified
axes) around just that region.

```tsx
<FujiProvider defaultTheme="dark" defaultMaterial="glass">
  <App>
    <FujiProvider theme="light" material="glass">
      <BrightPhotoSection />
    </FujiProvider>
  </App>
</FujiProvider>
```
