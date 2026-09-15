## Basic table

```tsx
<Table>
  <Table.Header>
    <Table.Row>
      <Table.Head>Name</Table.Head>
      <Table.Head>Role</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    <Table.Row>
      <Table.Cell>Priya Nair</Table.Cell>
      <Table.Cell>Engineering</Table.Cell>
    </Table.Row>
  </Table.Body>
</Table>
```

## Borderless, with footer

```tsx
<Table bordered={false}>
  <Table.Body>
    <Table.Row>
      <Table.Cell>Priya Nair</Table.Cell>
      <Table.Cell>Engineering</Table.Cell>
    </Table.Row>
  </Table.Body>
  <Table.Footer>
    <Table.Row>
      <Table.Cell colSpan={2}>2 of 5 rows</Table.Cell>
    </Table.Row>
  </Table.Footer>
</Table>
```

## DataTable: search, sort, and pagination

```tsx
<DataTable
  columns={columns}
  data={filteredRows}
  rowKey={(r) => r.id}
  pageSize={pageSize}
  loading={isLoading}
/>
```

## Infinite loading instead of pagination

Appends the next page as the table's end comes into view. pageSize is set to the number of rows fetched so far, since infinite loading is what replaces the pager.

```tsx
<InfiniteScroll hasMore={hasMore} loading={loading} onLoadMore={loadMore}>
  <DataTable columns={columns} data={rows} rowKey={(r) => r.id} pageSize={rows.length} />
</InfiniteScroll>
```
