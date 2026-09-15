## Basic

```tsx
<Notification
  title="New comment"
  description="Priya replied on the pricing page draft."
  timestamp="2m ago"
  unread
/>
```

## Activity inbox

avatar shows who, badge marks the event kind, media is a thumbnail of the thing it happened to, and layout='inline' runs the name into the event text.

```tsx
<Notification
  layout="inline"
  avatar={<Avatar fallback="PN" />}
  badge={<Heart className="size-3" />}
  title="Priya liked your post"
  timestamp="2 min"
  unread
/>
```
