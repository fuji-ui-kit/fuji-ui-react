## Linear: semantic colors

```tsx
<Progress value={62} showValue label="Uploading" />
<Progress value={100} variant="success" label="Complete" />
```

## Loading (spring)

The fill is driven by transform: scaleX() on the spring curve, so a value arriving in discrete chunks still moves as one smooth, slightly elastic bar.

```tsx
const [value, setValue] = React.useState(0);
// bump by a random 0-20% every 500ms
<Progress value={value} label="Loading" showValue />;
```

## Linear: without a label

```tsx
<Progress value={45} />
```

## Linear: indeterminate

Pass value={null} for an unknown-duration task.

```tsx
<Progress value={null} label="Loading" />
```

## Circular: determinate & indeterminate

```tsx
<CircularProgress value={62} showValue />
<CircularProgress />
```

## Circular: sizes

```tsx
<CircularProgress value={70} size="lg" />
```
