## Basic

```tsx
<List>
  <List.Item>Row one</List.Item>
</List>
```

## With leading icon and metadata

```tsx
<List.Item startSlot={<Folder />} endSlot={<span>12 files</span>}>
  Design assets
</List.Item>
```

## With avatar

```tsx
<List.Item startSlot={<Avatar fallback="AC" size="sm" />} endSlot={<Badge>Active</Badge>}>
  Gean Lyka
</List.Item>
```

## Compact vs. comfortable

```tsx
<List.Item className="py-1.5">Compact row</List.Item>
<List.Item className="py-4">Comfortable row</List.Item>
```

## Without dividers

```tsx
<List className="divide-y-0">
  <List.Item startSlot={<Avatar fallback="PN" />}>Priya Nair</List.Item>
  <List.Item startSlot={<Avatar fallback="KS" />}>Kenji Sato</List.Item>
</List>
```

## Clickable, selected, and disabled

Only interactive rows get cursor-pointer and a hover state.

```tsx
<List.Item onClick={() => setSelected("draft")} className="hover:bg-fuji-surface-subtle">
  Draft
</List.Item>
```

## Infinite loading

Fetches the next page when the end of the list scrolls into view, instead of a pager or a 'load more' button. Scroll the list to the bottom.

```tsx
<InfiniteScroll hasMore={hasMore} loading={loading} onLoadMore={loadMore} endMessage="That's everything.">
  <List>
    {rows.map((row) => (
      <List.Item key={row.id}>{row.who}</List.Item>
    ))}
  </List>
</InfiniteScroll>
```
