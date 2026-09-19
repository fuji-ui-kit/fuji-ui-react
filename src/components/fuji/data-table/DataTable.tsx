"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "../../../lib/cn";
import { Table } from "../table/Table";
import { Pagination } from "../pagination/Pagination";
import { EmptyState } from "../empty-state/EmptyState";
import { Skeleton } from "../skeleton/Skeleton";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

export interface DataTableColumn<Row> {
  /** Identifies the column; also the sort key. */
  key: string;
  /** Header cell content. */
  header: React.ReactNode;
  /** Cell content for a row. Without it the row's `accessor` value is printed. */
  render?: (row: Row) => React.ReactNode;
  /** The sortable/printable value for a row. Required for a `sortable` column. */
  accessor?: (row: Row) => string | number;
  /** Makes the header a sort toggle. Needs `accessor` to have something to compare. */
  sortable?: boolean;
  /** Extra classes merged onto every cell in this column. */
  className?: string;
}

export interface DataTableProps<Row> extends React.HTMLAttributes<HTMLDivElement> {
  /** Column definitions, in display order. */
  columns: DataTableColumn<Row>[];
  /** Every row. Sorting and paging happen here, not in the consumer. */
  data: Row[];
  /** Stable React key per row - an id, not the array index. */
  rowKey: (row: Row) => string;
  /**
   * Rows per page. Wrapping the table in `InfiniteScroll` instead? Set this to
   * the number of rows fetched so far, so nothing is paged out of view.
   */
  pageSize?: number;
  /** Shown in place of the rows when `data` is empty. */
  emptyMessage?: string;
  /** Shows skeleton rows instead of data - for async loads. */
  loading?: boolean;
  /** Draws the table's cell borders. */
  bordered?: boolean;
}

/**
 * Table + client-side sorting and pagination - built on `Table`. Cast after `forwardRef` because
 * `forwardRef` isn't generic; without it `Row` collapses to `unknown` for every caller.
 */
export const DataTable = React.forwardRef(function DataTable<Row>(
  {
    columns,
    data,
    rowKey,
    pageSize = 8,
    emptyMessage = "No results.",
    loading = false,
    bordered = true,
    className,
    ...props
  }: DataTableProps<Row>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const [sort, setSort] = React.useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [page, setPage] = React.useState(1);

  const sorted = React.useMemo(() => {
    if (!sort) return data;
    const column = columns.find((c) => c.key === sort.key);
    if (!column?.accessor) return data;
    const accessor = column.accessor;
    return [...data].sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      const compared = av < bv ? -1 : av > bv ? 1 : 0;
      return sort.direction === "asc" ? compared : -compared;
    });
  }, [data, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const pageData = sorted.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);

  const toggleSort = (key: string) => {
    setSort((current) => {
      if (current?.key !== key) return { key, direction: "asc" };
      if (current.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };

  if (!loading && data.length === 0) {
    return (
      <div ref={ref} className={cn("fj:flex fj:flex-col fj:gap-3", className)} {...props}>
        <EmptyState title={emptyMessage} />
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("fj:flex fj:flex-col fj:gap-3", className)} {...props}>
      <Table bordered={bordered}>
        <Table.Header>
          <Table.Row>
            {columns.map((column) => {
              const active = sort?.key === column.key;
              return (
                <Table.Head
                  key={column.key}
                  className={column.className}
                  // `aria-sort` belongs on the header cell, where assistive tech looks; it is the
                  // only machine-readable record of the sort, not just the arrow glyph.
                  aria-sort={
                    column.sortable
                      ? active
                        ? sort.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                      : undefined
                  }
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className={cn(
                        NATIVE_CONTROL_RESET,
                        "fj:flex fj:cursor-pointer fj:items-center fj:gap-1 fj:uppercase fj:tracking-wide fj:hover:text-fuji-foreground",
                      )}
                    >
                      {column.header}
                      {/* The arrows are decoration; this span makes the button read "Revenue,
                          sorted ascending" rather than just "Revenue". */}
                      <span className="fj:sr-only">
                        {active
                          ? sort.direction === "asc"
                            ? ", sorted ascending"
                            : ", sorted descending"
                          : ", not sorted"}
                      </span>
                      {active ? (
                        sort.direction === "asc" ? (
                          <ArrowUp aria-hidden="true" className="fj:size-3" />
                        ) : (
                          <ArrowDown aria-hidden="true" className="fj:size-3" />
                        )
                      ) : (
                        <ArrowUpDown aria-hidden="true" className="fj:size-3 fj:opacity-50" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </Table.Head>
              );
            })}
          </Table.Row>
        </Table.Header>
        {/*
          Skeleton rows are visibly "not the data yet", but nothing said so
          non-visually - a screen reader read them as a table of empty cells.
        */}
        <Table.Body aria-busy={loading || undefined}>
          {loading
            ? Array.from({ length: Math.min(pageSize, 5) }, (_, index) => (
                <Table.Row key={index}>
                  {columns.map((column) => (
                    <Table.Cell key={column.key} className={column.className}>
                      <Skeleton shape="text" className="fj:w-full" />
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))
            : pageData.map((row) => (
                <Table.Row key={rowKey(row)}>
                  {columns.map((column) => (
                    <Table.Cell key={column.key} className={column.className}>
                      {column.render ? column.render(row) : column.accessor ? column.accessor(row) : null}
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))}
        </Table.Body>
      </Table>
      {!loading && pageCount > 1 && (
        <Pagination page={clampedPage} pageCount={pageCount} onPageChange={setPage} className="fj:self-end" />
      )}
    </div>
  );
}) as <Row>(props: DataTableProps<Row> & { ref?: React.ForwardedRef<HTMLDivElement> }) => React.ReactElement;
