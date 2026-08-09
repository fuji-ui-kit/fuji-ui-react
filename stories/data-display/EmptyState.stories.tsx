import type { Meta, StoryObj } from "@storybook/react";
import { Search } from "lucide-react";
import { Button, EmptyState } from "@fuji-ui/react";

const meta = {
  title: "Data Display/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  args: {
    title: "No orders yet",
    description: "Orders placed by your customers will show up here.",
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAction: Story = {
  name: "With action",
  args: {
    action: <Button appearance="contained">Create your first order</Button>,
  },
};

export const CustomIcon: Story = {
  name: "Custom icon",
  args: {
    icon: <Search className="size-5" />,
    title: "No results found",
    description: "Try adjusting your filters or search terms.",
  },
};
