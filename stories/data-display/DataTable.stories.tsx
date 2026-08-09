import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Search } from "lucide-react";
import {
  Badge,
  Button,
  DataTable,
  type DataTableColumn,
  Input,
  Select,
  StatusIndicator,
} from "@fujiui/react";

interface Order {
  id: string;
  customer: string;
  total: number;
  status: "Fulfilled" | "Pending" | "Refunded";
}

const ORDERS: Order[] = [
  { id: "ORD-1042", customer: "Mia Torres", total: 128, status: "Fulfilled" },
  { id: "ORD-1041", customer: "Owen Baptiste", total: 64.5, status: "Pending" },
  { id: "ORD-1040", customer: "Priya Natarajan", total: 212.1, status: "Refunded" },
  { id: "ORD-1039", customer: "Kenji Watanabe", total: 39.99, status: "Fulfilled" },
  { id: "ORD-1038", customer: "Elena Kovacs", total: 501.25, status: "Fulfilled" },
  { id: "ORD-1037", customer: "Samuel Achebe", total: 18.75, status: "Pending" },
];

const STATUS_VARIANT = { Fulfilled: "success", Pending: "warning", Refunded: "danger" } as const;
const STATUS_TONE = { Fulfilled: "forest", Pending: "sun", Refunded: "fire" } as const;

const columns: DataTableColumn<Order>[] = [
  { key: "id", header: "Order", accessor: (row) => row.id, sortable: true },
  { key: "customer", header: "Customer", accessor: (row) => row.customer, sortable: true },
  {
    key: "total",
    header: "Total",
    accessor: (row) => row.total,
    sortable: true,
    render: (row) => `$${row.total.toFixed(2)}`,
  },
  {
    key: "status",
    header: "Status",
    render: (row) => <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>,
  },
];

// A larger, realistic dataset for the "Complete" story below - enough rows
// that search narrowing and page-size switching both do something visible.
const CUSTOMERS = [
  "Mia Torres",
  "Owen Baptiste",
  "Priya Natarajan",
  "Kenji Watanabe",
  "Elena Kovacs",
  "Samuel Achebe",
  "Noor Haddad",
  "Liam Sullivan",
  "Aiko Tanaka",
  "Diego Fernandez",
  "Freya Lindqvist",
  "Tariq Farouk",
];
const STATUSES: Order["status"][] = ["Fulfilled", "Pending", "Refunded"];
const ALL_ORDERS: Order[] = Array.from({ length: 34 }, (_, index) => ({
  id: `ORD-${1042 - index}`,
  customer: CUSTOMERS[index % CUSTOMERS.length],
  total: Math.round((35 + ((index * 47) % 480)) * 1.37 * 100) / 100,
  status: STATUSES[index % STATUSES.length],
}));

const completeColumns: DataTableColumn<Order>[] = [
  { key: "id", header: "Order", accessor: (row) => row.id, sortable: true },
  { key: "customer", header: "Customer", accessor: (row) => row.customer, sortable: true },
  {
    key: "total",
    header: "Total",
    accessor: (row) => row.total,
    sortable: true,
    render: (row) => `$${row.total.toFixed(2)}`,
  },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <StatusIndicator
        variant={STATUS_VARIANT[row.status]}
        label={row.status}
        pulse={row.status === "Pending"}
      />
    ),
  },
];

const PAGE_SIZE_OPTIONS = [
  { value: "5", label: "5 / page" },
  { value: "10", label: "10 / page" },
  { value: "20", label: "20 / page" },
];

/**
 * Search, page-size selection, result count, status indicators, pagination
 * (handled internally by `DataTable`), and a real loading toggle - wired
 * together the way a real order-management screen would, not just a static
 * showcase of props.
 */
function CompleteDataTable() {
  const [query, setQuery] = React.useState("");
  const [pageSize, setPageSize] = React.useState("10");
  const [loading, setLoading] = React.useState(false);

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return ALL_ORDERS;
    return ALL_ORDERS.filter(
      (order) => order.id.toLowerCase().includes(needle) || order.customer.toLowerCase().includes(needle),
    );
  }, [query]);

  function simulateRefresh() {
    setLoading(true);
    window.setTimeout(() => setLoading(false), 900);
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by order or customer…"
          startSlot={<Search className="size-4" />}
          aria-label="Search orders"
          className="w-full sm:w-64"
        />
        <div className="flex items-center gap-2">
          <Select
            aria-label="Rows per page"
            items={PAGE_SIZE_OPTIONS}
            value={pageSize}
            onValueChange={(value) => setPageSize(value as string)}
            size="sm"
          />
          <Button appearance="bordered" size="sm" onClick={simulateRefresh} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>
      <p className="m-0 box-border text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">
        {filtered.length} result{filtered.length === 1 ? "" : "s"}
        {query && ` for "${query}"`}
      </p>
      <DataTable
        columns={completeColumns}
        data={filtered}
        rowKey={(row) => row.id}
        pageSize={Number(pageSize)}
        loading={loading}
        emptyMessage="No orders match your search."
      />
    </div>
  );
}

const meta = {
  title: "Data Display/DataTable",
  component: DataTable,
  tags: ["autodocs"],
  // Every story below supplies its own real columns/data/rowKey via
  // `render` - this stub only exists to satisfy the required-prop types; it
  // is never actually rendered.
  args: { columns: [], data: [], rowKey: () => "" },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <DataTable columns={columns} data={ORDERS} rowKey={(row) => row.id} pageSize={4} />,
};

export const Loading: Story = {
  render: () => <DataTable columns={columns} data={ORDERS} rowKey={(row) => row.id} loading />,
};

export const Empty: Story = {
  render: () => (
    <DataTable columns={columns} data={[]} rowKey={(row) => row.id} emptyMessage="No orders yet." />
  ),
};

export const Complete: Story = {
  name: "Complete (search, page size, loading)",
  render: () => <CompleteDataTable />,
};
