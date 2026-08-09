import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "@fujiui/react";

const meta = {
  title: "Foundation/Label",
  component: Label,
  tags: ["autodocs"],
  args: {
    children: "Email address",
    htmlFor: "email",
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Required: Story = {
  args: { required: true },
};

export const WithInput: Story = {
  render: (args) => (
    <div className="flex w-full max-w-xs flex-col gap-1.5">
      <Label {...args} />
      <input
        id="email"
        type="email"
        placeholder="you@example.com"
        className="rounded-fuji-control border border-fuji-border-strong bg-fuji-surface px-3 py-1.5 text-[length:var(--fuji-text-sm)] text-fuji-foreground"
      />
    </div>
  ),
};

export const RequiredWithInput: Story = {
  render: (args) => (
    <div className="flex w-full max-w-xs flex-col gap-1.5">
      <Label {...args} htmlFor="name" required>
        Full name
      </Label>
      <input
        id="name"
        type="text"
        placeholder="Jane Doe"
        className="rounded-fuji-control border border-fuji-border-strong bg-fuji-surface px-3 py-1.5 text-[length:var(--fuji-text-sm)] text-fuji-foreground"
      />
    </div>
  ),
};
