import type { Meta, StoryObj } from "@storybook/react";
import { Breadcrumb } from "@fujiui/react";

const ITEMS = [{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }, { label: "Profile" }];

const meta = {
  title: "Navigation/Breadcrumb",
  component: Breadcrumb,
  tags: ["autodocs"],
  args: { items: ITEMS },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongTrail: Story = {
  args: {
    items: [
      { label: "Home", href: "/" },
      { label: "Components", href: "/components" },
      { label: "Navigation", href: "/components/navigation" },
      { label: "Breadcrumb" },
    ],
  },
};

export const ExternalLink: Story = {
  args: {
    items: [{ label: "Docs", href: "https://fuji-ui.dev/docs" }, { label: "Breadcrumb" }],
  },
};
