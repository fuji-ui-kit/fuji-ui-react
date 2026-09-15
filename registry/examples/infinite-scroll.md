## List

Scroll to the bottom of the panel to pull the next page. The delay here stands in for a request so the loading state is visible.

```tsx
const [count, setCount] = React.useState(8);

<InfiniteScroll
  hasMore={count < all.length}
  loading={loading}
  onLoadMore={loadMore}
  endMessage="That's everything."
>
  <List>
    {rows.map((row) => (
      <List.Item key={row.id}>{row.who}</List.Item>
    ))}
  </List>
</InfiniteScroll>;
```

## DataTable, instead of pagination

Infinite loading is what replaces the pager, so pageSize is set to the number of rows fetched so far - otherwise DataTable would paginate the rows this has just appended.

```tsx
<InfiniteScroll hasMore={hasMore} loading={loading} onLoadMore={loadMore}>
  <DataTable columns={columns} data={rows} rowKey={(r) => r.id} pageSize={rows.length} />
</InfiniteScroll>
```

## Exhausted

Once hasMore is false the sentinel stops observing and endMessage takes the loader's place.

```tsx
<InfiniteScroll hasMore={false} onLoadMore={loadMore} endMessage="That's everything.">
```
