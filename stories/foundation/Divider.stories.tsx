import type { Meta, StoryObj } from "@storybook/react";
import { Divider } from "@fuji-ui/react";

const meta = {
  title: "Foundation/Divider",
  component: Divider,
  tags: ["autodocs"],
  args: {
    orientation: "horizontal",
  },
  argTypes: {
    orientation: { control: "select", options: ["horizontal", "vertical"] },
  },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-full max-w-sm">
      <p className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">Section one</p>
      <Divider {...args} className="my-3" />
      <p className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">Section two</p>
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-full max-w-sm">
      <Divider label="OR" />
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-12 items-center gap-3">
      <span className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">Profile</span>
      <Divider orientation="vertical" />
      <span className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">Settings</span>
      <Divider orientation="vertical" />
      <span className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">Sign out</span>
    </div>
  ),
};
