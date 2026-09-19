import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Avatar, Card, DataTable, InfiniteScroll, List } from "@fujiui/react";

const meta = {
  title: "Data Display/InfiniteScroll",
  component: InfiniteScroll,
  tags: ["autodocs"],
  // `hasMore`/`onLoadMore` are required, so the meta has to satisfy them even
  // though every story below drives them from its own paging state.
  args: { hasMore: true, onLoadMore: () => {} },
} satisfies Meta<typeof InfiniteScroll>;

export default meta;
type Story = StoryObj<typeof meta>;

const ALL = Array.from({ length: 47 }, (_, index) => ({
  id: `evt-${index + 1}`,
  who: ["Priya Nair", "Kenji Sato", "Marco Rossi", "Ada Iwu"][index % 4],
  what: ["opened a PR", "left a review", "merged a branch", "closed an issue"][index % 4],
  when: `${index + 1}h ago`,
}));

const PAGE = 8;

/** Stands in for a paged request so the loading state is actually visible. */
function usePagedRows() {
  const [count, setCount] = React.useState(PAGE);
  const [loading, setLoading] = React.useState(false);
  const loadMore = React.useCallback(() => {
    setLoading(true);
    window.setTimeout(() => {
      setCount((current) => Math.min(current + PAGE, ALL.length));
      setLoading(false);
    }, 700);
  }, []);
  return { rows: ALL.slice(0, count), hasMore: count < ALL.length, loading, loadMore };
}

export const Default: Story = {
  name: "List",
  parameters: {
    docs: {
      description: {
        story:
          "Fetches the next page when the end of the list scrolls into view. The scroll container has to be bounded (here `max-h-80`) or there is nothing to scroll.",
      },
    },
  },
  render: () => <ListDemo />,
};

function ListDemo() {
  const { rows, hasMore, loading, loadMore } = usePagedRows();
  return (
    <Card className="w-full max-w-md p-0">
      <div className="max-h-80 overflow-y-auto">
        <InfiniteScroll
          hasMore={hasMore}
          loading={loading}
          onLoadMore={loadMore}
          endMessage="That's everything."
        >
          <List>
            {rows.map((row) => (
              <List.Item key={row.id} startSlot={<Avatar size="sm" fallback={row.who.slice(0, 2)} />}>
                <span className="font-medium">{row.who}</span> {row.what}
              </List.Item>
            ))}
          </List>
        </InfiniteScroll>
      </div>
    </Card>
  );
}

/**
 * Infinite loading replaces the pager, so `pageSize` must hold every fetched row, or DataTable
 * paginates the rows just appended.
 */
export const WithDataTable: Story = {
  name: "DataTable (instead of pagination)",
  render: () => <TableDemo />,
};

function TableDemo() {
  const { rows, hasMore, loading, loadMore } = usePagedRows();
  return (
    <div className="max-h-96 w-full overflow-y-auto">
      <InfiniteScroll
        hasMore={hasMore}
        loading={loading}
        onLoadMore={loadMore}
        endMessage={`All ${ALL.length} events loaded.`}
      >
        <DataTable
          columns={[
            { key: "who", header: "Person", render: (row) => row.who },
            { key: "what", header: "Event", render: (row) => row.what },
            { key: "when", header: "When", render: (row) => row.when },
          ]}
          data={rows}
          rowKey={(row) => row.id}
          pageSize={rows.length}
        />
      </InfiniteScroll>
    </div>
  );
}

/** Nothing left to fetch: the sentinel stops observing and the end message shows. */
export const Exhausted: Story = {
  render: () => (
    <Card className="w-full max-w-md p-0">
      <InfiniteScroll hasMore={false} onLoadMore={() => {}} endMessage="That's everything.">
        <List>
          {ALL.slice(0, 3).map((row) => (
            <List.Item key={row.id}>{row.who}</List.Item>
          ))}
        </List>
      </InfiniteScroll>
    </Card>
  ),
};
