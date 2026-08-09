import type { Meta, StoryObj } from "@storybook/react";
import { NumberInput } from "@fujiui/react";

const meta = {
  title: "Forms/NumberInput",
  component: NumberInput,
  tags: ["autodocs"],
  args: {
    "aria-label": "Quantity",
    size: "md",
    defaultValue: 1,
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof NumberInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <NumberInput {...args} size="sm" />
      <NumberInput {...args} size="md" />
      <NumberInput {...args} size="lg" />
    </div>
  ),
};

export const MinMaxStep: Story = {
  name: "With min/max/step",
  args: { min: 0, max: 10, step: 2, defaultValue: 4 },
};

export const Invalid: Story = {
  args: { invalid: true, defaultValue: -1, min: 0 },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 5 },
};
