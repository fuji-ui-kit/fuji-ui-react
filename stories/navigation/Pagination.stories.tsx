import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { Pagination } from "@fujiui/react";

const meta = {
  title: "Navigation/Pagination",
  component: Pagination,
  tags: ["autodocs"],
  // `FirstPageDisabled` uses these directly; every other story owns its own
  // page state via `render` and ignores this stub.
  args: { page: 1, pageCount: 1, onPageChange: () => {} },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

function ControlledPagination(props: { pageCount: number; siblingCount?: number }) {
  const [page, setPage] = React.useState(1);
  return (
    <Pagination
      page={page}
      pageCount={props.pageCount}
      onPageChange={setPage}
      siblingCount={props.siblingCount}
    />
  );
}

export const Default: Story = {
  render: () => <ControlledPagination pageCount={5} />,
};

export const WithEllipsis: Story = {
  name: "Large range (ellipsis)",
  render: () => <ControlledPagination pageCount={24} />,
};

export const FirstPageDisabled: Story = {
  name: "Boundaries disabled",
  args: { page: 1, pageCount: 5, onPageChange: () => {} },
};

export const ClickingAdvancesPage: Story = {
  render: () => <ControlledPagination pageCount={5} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const next = canvas.getByRole("button", { name: "Next page" });
    await userEvent.click(next);
    const page2 = canvas.getByRole("button", { name: "2" });
    await expect(page2).toHaveAttribute("aria-current", "page");
  },
};
