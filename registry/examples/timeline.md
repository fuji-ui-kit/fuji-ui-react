## Left-aligned (default)

layout='left': the line sits on the left, content to its right.

```tsx
<Timeline
  items={[
    {
      title: "Order confirmed",
      description: "Payment captured in full.",
      timestamp: "Mon 9:02 AM",
      variant: "success",
    },
    { title: "Delivered", description: "Awaiting courier confirmation.", timestamp: "Pending" },
  ]}
/>
```

## Right-aligned

layout='right': the line moves to the right, content sits to its left - useful when the timeline anchors a right-hand rail.

```tsx
<Timeline layout="right" items={orderItems} />
```

## Alternating

layout='alternating': a centered line with content flipping sides per entry - reads well for a wide, narrative history. Collapses to left below the sm breakpoint, since alternating needs width a phone screen doesn't have.

```tsx
<Timeline layout="alternating" items={milestones} />
```

## Activity feed with status dots

variant (StatusTone: default | success | warning | danger | info) colors each entry's dot - the same semantic vocabulary as Alert and Toast, not the decorative ComponentTone used by Button or Badge.

```tsx
<Timeline
  items={[
    { title: "Build failed on main", description: "3 tests failed", timestamp: "1h ago", variant: "danger" },
  ]}
/>
```

## Grouped history

groups renders a history timeline: each group's label sits on a centred axis, its media on the left and its items on the right. Timestamps share one column sized to the widest stamp in the group, so dates and times ("Sep 14", "9:41 AM") fit without truncating and titles stay aligned.

```tsx
<Timeline
  groups={[
    {
      label: "This week",
      items: [
        { timestamp: "Sep 14", title: "Glass material shipped" },
        { timestamp: "9:41 AM", title: "Release candidate tagged" },
      ],
    },
  ]}
/>
```
