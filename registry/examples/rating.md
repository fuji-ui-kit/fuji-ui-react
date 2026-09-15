## Sizes

```tsx
<Rating label="Rating" defaultValue={3} size="lg" />
```

## Tones

Filled color resolves through Fuji semantic tokens.

```tsx
<Rating label="Rating" tone="fire" defaultValue={4} />
```

## Custom shape

Pass any individually imported Lucide icon.

```tsx
import { Heart } from "lucide-react";

<Rating label="Rating" icon={Heart} tone="fire" />;
```

## Custom max

```tsx
<Rating label="Rating" max={10} defaultValue={7} />
```

## Read-only and disabled

```tsx
<Rating label="Rating" value={4} readOnly />
<Rating label="Rating" defaultValue={2} disabled />
```

## Controlled

```tsx
const [value, setValue] = useState(3);
<Rating label="Rating" value={value} onChange={setValue} />;
```
