import type { Meta, StoryObj } from "@storybook/react";
import { Badge, Table } from "@fuji-ui/react";

const ORDERS = [
  { id: "ORD-1042", customer: "Mia Torres", total: "$128.00", status: "Fulfilled" as const },
  { id: "ORD-1041", customer: "Owen Baptiste", total: "$64.50", status: "Pending" as const },
  { id: "ORD-1040", customer: "Priya Natarajan", total: "$212.10", status: "Refunded" as const },
];

const STATUS_TONE = {
  Fulfilled: "forest",
  Pending: "sun",
  Refunded: "fire",
} as const;

const meta = {
  title: "Data Display/Table",
  component: Table,
  tags: ["autodocs"],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Table {...args}>
      <Table.Header>
        <Table.Row>
          <Table.Head>Order</Table.Head>
          <Table.Head>Customer</Table.Head>
          <Table.Head>Total</Table.Head>
          <Table.Head>Status</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {ORDERS.map((order) => (
          <Table.Row key={order.id}>
            <Table.Cell>{order.id}</Table.Cell>
            <Table.Cell>{order.customer}</Table.Cell>
            <Table.Cell>{order.total}</Table.Cell>
            <Table.Cell>
              <Badge tone={STATUS_TONE[order.status]}>{order.status}</Badge>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  ),
};

export const Interactive: Story = {
  name: "Interactive rows",
  render: () => (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.Head>Order</Table.Head>
          <Table.Head>Customer</Table.Head>
          <Table.Head>Status</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {ORDERS.map((order) => (
          <Table.Row key={order.id} interactive onClick={() => {}}>
            <Table.Cell>{order.id}</Table.Cell>
            <Table.Cell>{order.customer}</Table.Cell>
            <Table.Cell>
              <Badge tone={STATUS_TONE[order.status]}>{order.status}</Badge>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  ),
};

export const Borderless: Story = {
  render: () => (
    <Table bordered={false}>
      <Table.Header>
        <Table.Row>
          <Table.Head>Order</Table.Head>
          <Table.Head>Total</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {ORDERS.map((order) => (
          <Table.Row key={order.id}>
            <Table.Cell>{order.id}</Table.Cell>
            <Table.Cell>{order.total}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  ),
};
