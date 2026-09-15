## Basic

Pass an individually imported icon component, never a string name.

```tsx
import { Check } from "lucide-react";

<Icon icon={Check} />;
```

## Tone and size

Colours resolve through Fuji tokens, so an icon follows the theme.

```tsx
<Icon icon={Check} size="lg" tone="forest" />
```

## Labelled

An icon with a label is exposed to assistive tech; without one it is decorative and hidden.

```tsx
<Icon icon={Check} label="Saved" />
```

## On a background

background puts the glyph on a tinted or solid tile.

```tsx
<Icon icon={Check} background="subtle" />
```
