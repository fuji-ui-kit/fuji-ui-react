## Line chart

A highlighted trend with a second semantic series and accessible point labels.

```tsx
<LineChart title="Weekly signups" series={[{ name: "Signups", data }]} legend />
```

## Animated update

Series transition to their new shape when the data changes. Press the button to re-roll the values and watch the line and its area fill move.

```tsx
const [data, setData] = React.useState(randomWeek);
<LineChart series={[{ name: "Signups", data }]} area />
<Button onClick={() => setData(randomWeek())}>Randomise data</Button>
```

## Area fill

area draws a soft gradient under each line; curve defaults to a monotone 'smooth' cubic that never overshoots the data. strokeWidth sets the line weight.

```tsx
<LineChart area curve="smooth" strokeWidth={2} series={[{ name: "Revenue", data }]} />
```

## Bar chart

Use bars for compact comparisons between categories or periods.

```tsx
<BarChart title="New customers" series={[{ name: "Customers", data }]} />
```

## Highlight + average line

highlight emphasises one period and mutes the rest; average draws a dotted reference line with an optional averageLabel.

```tsx
<BarChart series={[{ name: "Customers", data }]} highlight="Sat" average={70} averageLabel="Avg" />
```

## Donut chart

A composition summary with a center total and compact legend.

```tsx
<DonutChart title="Team distribution" data={[{ label: "Design", value: 42 }]} />
```

## Loading and empty states

```tsx
<LineChart loading series={[]} />
<LineChart empty series={[]} />
```
