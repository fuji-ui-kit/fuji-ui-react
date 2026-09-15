## Basic

```tsx
<Slider defaultValue={40} label="Volume" showValue />
```

## Range

Pass a two-number defaultValue for a dual-thumb range.

```tsx
<Slider defaultValue={[20, 80]} label="Price range" showValue />
```

## Min / max / step

Constrain the range and snap to a step.

```tsx
<Slider min={0} max={10} step={0.5} defaultValue={6.5} label="Rating" showValue />
```

## Sizes

```tsx
<Slider size="sm" defaultValue={60} label="Small" showValue />
<Slider size="md" defaultValue={60} label="Medium" showValue />
<Slider size="lg" defaultValue={60} label="Large" showValue />
```

## Tones

tone recolors the filled track and thumb with the decorative palette.

```tsx
<Slider tone="forest" defaultValue={60} label="Volume" showValue />
```
