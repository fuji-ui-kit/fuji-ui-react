import type { Meta, StoryObj } from "@storybook/react";
import { CircularProgress } from "@fujiui/react";

const meta = {
  title: "Foundation/CircularProgress",
  component: CircularProgress,
  tags: ["autodocs"],
  args: {
    value: 65,
    size: "md",
    variant: "default",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
    variant: {
      control: "select",
      options: ["default", "success", "warning", "danger", "info"],
    },
  },
} satisfies Meta<typeof CircularProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValueLabel: Story = {
  args: { showValue: true },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <CircularProgress {...args} size="sm" />
      <CircularProgress {...args} size="md" />
      <CircularProgress {...args} size="lg" />
    </div>
  ),
};

export const Indeterminate: Story = {
  args: { value: undefined },
};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      {(["default", "success", "warning", "danger", "info"] as const).map((variant) => (
        <CircularProgress key={variant} {...args} variant={variant} />
      ))}
    </div>
  ),
};
