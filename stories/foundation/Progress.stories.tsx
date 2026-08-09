import type { Meta, StoryObj } from "@storybook/react";
import { Progress } from "@fujiui/react";

const meta = {
  title: "Foundation/Progress",
  component: Progress,
  tags: ["autodocs"],
  args: {
    value: 25,
    className: "w-full max-w-sm",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "success", "warning", "danger", "info"],
    },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabelAndValue: Story = {
  args: { value: 75, label: "Uploading files", showValue: true },
};

export const Indeterminate: Story = {
  args: { value: null, label: "Syncing" },
};

export const Variants: Story = {
  render: (args) => (
    <div className="flex w-full max-w-sm flex-col gap-4">
      {(["success", "warning", "danger", "info"] as const).map((variant) => (
        <Progress key={variant} {...args} variant={variant} label={variant} showValue />
      ))}
    </div>
  ),
};
