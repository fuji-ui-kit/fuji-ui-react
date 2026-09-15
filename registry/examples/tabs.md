## Basic

```tsx
<Tabs defaultValue="a">
  <Tabs.List>
    <Tabs.Tab value="a">Overview</Tabs.Tab>
    <Tabs.Tab value="b">Activity</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="a">
    <p>Everything at a glance.</p>
  </Tabs.Panel>
  <Tabs.Panel value="b">
    <p>What changed recently.</p>
  </Tabs.Panel>
</Tabs>
```

## Icon tabs

```tsx
<Tabs.Tab value="home" className="gap-1.5">
  <Home className="size-4" /> Home
</Tabs.Tab>
```

## Disabled tab

```tsx
<Tabs.Tab value="b" disabled>
  Billing
</Tabs.Tab>
```

## Full-width (mobile)

```tsx
<Tabs.List className="grid grid-cols-2">
  <Tabs.Tab value="a" className="w-full">
    Overview
  </Tabs.Tab>
</Tabs.List>
```

## Controlled

```tsx
const [tab, setTab] = useState("overview");

<Tabs value={tab} onValueChange={setTab}>
  <Tabs.List>
    <Tabs.Tab value="overview">Overview</Tabs.Tab>
    <Tabs.Tab value="activity">Activity</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="overview">
    <p>Everything at a glance.</p>
  </Tabs.Panel>
  <Tabs.Panel value="activity">
    <p>What changed recently.</p>
  </Tabs.Panel>
</Tabs>;
```

## Segmented Control

Pill-shaped single-choice control, built on the same Tabs primitive; no panels rendered.

```tsx
<SegmentedControl defaultValue="grid" options={[{ label: "Grid", value: "grid" }]} />
```

## Segmented Control: disabled option

```tsx
<SegmentedControl options={[{ label: "Month", value: "month", disabled: true }]} />
```

## Segmented (pill)

variant='pill' renders the tabs as a segmented control with the active tile sliding between slots - the tab-select pattern. The indicator never overshoots its slot, so it cannot cross the neighbouring label mid-move.

```tsx
<Tabs defaultValue="overview">
  <Tabs.List variant="pill">
    <Tabs.Tab value="overview">Overview</Tabs.Tab>
    <Tabs.Tab value="activity">Activity</Tabs.Tab>
  </Tabs.List>
</Tabs>
```

## Floating action bar

A circular trigger that fans its actions out in a column. Not a popover - the actions belong to the trigger, and a portaled surface would lose the sense of them coming out of it.

```tsx
<FloatingActionBar
  actions={[
    { icon: <Share2 />, label: "Share", onSelect: share },
    { icon: <Trash2 />, label: "Delete", destructive: true, onSelect: remove },
  ]}
/>
```
