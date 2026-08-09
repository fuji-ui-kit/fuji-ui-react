import type { Meta, StoryObj } from "@storybook/react";
import { Timeline } from "@fuji-ui/react";

const meta = {
  title: "Data Display/Timeline",
  component: Timeline,
  tags: ["autodocs"],
  args: {
    items: [
      { title: "Order placed", description: "Order ORD-1042 was created.", timestamp: "Jan 4, 9:12 AM" },
      {
        title: "Payment confirmed",
        description: "Charge of $128.00 succeeded.",
        timestamp: "Jan 4, 9:13 AM",
        variant: "success",
      },
      {
        title: "Shipment delayed",
        description: "Carrier reported a weather delay.",
        timestamp: "Jan 5, 4:47 PM",
        variant: "warning",
      },
      {
        title: "Delivered",
        description: "Package left at front door.",
        timestamp: "Jan 7, 2:05 PM",
        variant: "success",
      },
    ],
  },
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithFailure: Story = {
  name: "With a failed step",
  args: {
    items: [
      { title: "Deployment started", timestamp: "10:02 AM" },
      { title: "Build succeeded", timestamp: "10:04 AM", variant: "success" },
      {
        title: "Health check failed",
        description: "3 of 5 instances did not respond.",
        timestamp: "10:06 AM",
        variant: "danger",
      },
    ],
  },
};

export const RightLayout: Story = {
  name: 'Right layout ("right")',
  render: (args) => (
    <div className="w-full max-w-md">
      <Timeline {...args} layout="right" />
    </div>
  ),
};

export const AlternatingLayout: Story = {
  name: 'Alternating layout ("alternating")',
  render: (args) => (
    <div className="w-full max-w-2xl">
      <Timeline {...args} layout="alternating" />
    </div>
  ),
};
