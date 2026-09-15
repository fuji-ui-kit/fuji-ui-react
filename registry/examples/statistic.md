## Basic

```tsx
<Statistic label="Active users" value={1240} />
```

## Prefix and suffix

```tsx
<Statistic label="Revenue" value={12480} prefix="$" />
<Statistic label="Conversion" value={4.8} decimals={1} suffix="%" />
```

## With trend

```tsx
<Statistic label="Revenue" value={12480} prefix="$" trend={8.2} />
```

## Animated update

Digits roll to the new value and the trend re-colours with it. Press the button to replay the motion against fresh numbers.

```tsx
const [figures, setFigures] = React.useState({ revenue: 12480, trend: 8.2 });

<Statistic label="Revenue" value={figures.revenue} prefix="$" trend={figures.trend} />;
```

## Dashboard row

```tsx
<Stack direction="horizontal" gap={6}>
  <Statistic label="Revenue" value={12480} prefix="$" trend={8.2} />
  <Statistic label="Orders" value={342} trend={3.1} />
</Stack>
```

## As cards

Pass card to wrap each statistic in its own bordered surface - a ready-made KPI row.

```tsx
<Statistic card label="Revenue" value={92400} prefix="$" trend={4.2} trendLabel="MoM" />
```
