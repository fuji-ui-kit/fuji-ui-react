## Basic

```tsx
<Pagination page={page} pageCount={10} onPageChange={setPage} />
```

## Compact

siblingCount={0} shows only the current page and the ellipsis-collapsed edges.

```tsx
<Pagination page={page} pageCount={20} siblingCount={0} onPageChange={setPage} />
```

## At the edges (disabled controls)

Previous/Next disable themselves automatically at page 1 and the last page.

```tsx
<Pagination page={1} pageCount={6} onPageChange={setPage} />
```

## In a table footer

```tsx
<Pagination page={page} pageCount={Math.ceil(total / pageSize)} onPageChange={setPage} />
```
