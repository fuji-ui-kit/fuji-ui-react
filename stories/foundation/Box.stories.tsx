import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "@fujiui/react";

const meta = {
  title: "Foundation/Box",
  component: Box,
  tags: ["autodocs"],
  args: {
    children: "A plain Box",
    className: "rounded-lg border border-fuji-border bg-fuji-surface-strong p-4",
  },
} satisfies Meta<typeof Box>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AsSection: Story = {
  name: "as='section'",
  args: { as: "section", children: "Rendered as a <section> element" },
};
