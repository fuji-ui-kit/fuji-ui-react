## Single selection

With items and a value the group becomes a radiogroup: the selected item takes the group's contained color, and arrow keys move the selection.

```tsx
const [range, setRange] = useState("week");
<ButtonGroup
  tone="default"
  value={range}
  onValueChange={setRange}
  items={[
    { value: "day", label: "Day" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
  ]}
/>;
```

## Grouping (no selection)

```tsx
<ButtonGroup>
  <Button appearance="bordered">Day</Button>
  <Button appearance="bordered">Week</Button>
</ButtonGroup>
```

## Vertical

```tsx
<ButtonGroup orientation="vertical">
  <Button appearance="bordered">Top</Button>
  <Button appearance="bordered">Middle</Button>
  <Button appearance="bordered">Bottom</Button>
</ButtonGroup>
```
