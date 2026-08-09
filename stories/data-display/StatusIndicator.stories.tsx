import type { Meta, StoryObj } from "@storybook/react";
import { StatusIndicator } from "@fujiui/react";

const meta = {
  title: "Data Display/StatusIndicator",
  component: StatusIndicator,
  tags: ["autodocs"],
  args: {
    variant: "success",
    label: "Fulfilled",
  },
} satisfies Meta<typeof StatusIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <StatusIndicator variant="success" label="Fulfilled" />
      <StatusIndicator variant="warning" label="Pending" />
      <StatusIndicator variant="danger" label="Refunded" />
      <StatusIndicator variant="info" label="Processing" />
      <StatusIndicator variant="default" label="Draft" />
    </div>
  ),
};

export const Pulse: Story = {
  name: "Pulse (live status)",
  args: { variant: "warning", label: "Pending", pulse: true },
};
