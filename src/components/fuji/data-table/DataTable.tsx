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
  key: string;
  header: React.ReactNode;
  render?: (row: Row) => React.ReactNode;
  accessor?: (row: Row) => string | number;
  sortable?: boolean;
  className?: string;
}

export interface DataTableProps<Row> extends React.HTMLAttributes<HTMLDivElement> {
  columns: DataTableColumn<Row>[];
  data: Row[];
  rowKey: (row: Row) => string;
  pageSize?: number;
  emptyMessage?: string;
  /** Shows skeleton rows instead of data - for async loads. */
  loading?: boolean;
  bordered?: boolean;
}

/**
 * Table + client-side sorting and pagination - built on `Table`.
 *
 * Declared with `forwardRef` + an explicit cast (rather than plain
 * `React.forwardRef<HTMLDivElement, DataTableProps<Row>>`) because
 * `forwardRef` itself isn't generic - without the cast, `Row` would collapse
 * to `unknown` for every caller instead of being inferred per usage.
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
            {columns.map((column) => (
              <Table.Head key={column.key} className={column.className}>
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
                    {sort?.key === column.key ? (
                      sort.direction === "asc" ? (
                        <ArrowUp className="fj:size-3" />
                      ) : (
                        <ArrowDown className="fj:size-3" />
                      )
                    ) : (
                      <ArrowUpDown className="fj:size-3 fj:opacity-50" />
                    )}
                  </button>
                ) : (
                  column.header
                )}
              </Table.Head>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {loading
            ? Array.from({ length: Math.min(pageSize, 5) }, (_, index) => (
                <Table.Row key={index}>
                  {columns.map((column) => (
                    <Table.Cell key={column.key} className={column.className}>
                      <Skeleton variant="text" className="fj:w-full" />
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
