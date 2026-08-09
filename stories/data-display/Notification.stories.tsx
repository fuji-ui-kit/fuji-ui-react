import type { Meta, StoryObj } from "@storybook/react";
import { Bell } from "lucide-react";
import { Notification } from "@fujiui/react";

const meta = {
  title: "Data Display/Notification",
  component: Notification,
  tags: ["autodocs"],
  args: {
    icon: <Bell className="size-4" />,
    title: "New comment on your order",
    description: "Priya Natarajan left a comment on ORD-1042.",
    timestamp: "2 minutes ago",
  },
} satisfies Meta<typeof Notification>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Unread: Story = {
  args: { unread: true },
};

export const List: Story = {
  name: "Notification list",
  render: () => (
    <div className="flex w-full max-w-md flex-col divide-y divide-fuji-border">
      <Notification
        icon={<Bell className="size-4" />}
        title="New comment on your order"
        description="Priya Natarajan left a comment on ORD-1042."
        timestamp="2 minutes ago"
        unread
      />
      <Notification
        icon={<Bell className="size-4" />}
        title="Payment confirmed"
        description="Your payment of $128.00 was successful."
        timestamp="1 hour ago"
      />
      <Notification
        icon={<Bell className="size-4" />}
        title="Shipment delivered"
        description="ORD-1039 was delivered at 2:05 PM."
        timestamp="Yesterday"
      />
    </div>
  ),
};
