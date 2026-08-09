import type { Meta, StoryObj } from "@storybook/react";
import { DescriptionList } from "@fuji-ui/react";

const meta = {
  title: "Data Display/DescriptionList",
  component: DescriptionList,
  tags: ["autodocs"],
  args: {
    items: [
      { term: "Order ID", description: "ORD-1042" },
      { term: "Customer", description: "Mia Torres" },
      { term: "Shipping address", description: "221B Baker Street, London" },
      { term: "Total", description: "$128.00" },
    ],
  },
} satisfies Meta<typeof DescriptionList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Stacked: Story = {
  name: "Single column",
  args: { columns: 1 },
};

export const ProfileSummary: Story = {
  name: "Profile summary",
  args: {
    items: [
      { term: "Full name", description: "Priya Natarajan" },
      { term: "Email", description: "priya.natarajan@example.com" },
      { term: "Role", description: "Workspace admin" },
      { term: "Member since", description: "March 2022" },
    ],
  },
};
