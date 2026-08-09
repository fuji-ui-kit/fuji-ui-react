import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "@fujiui/react";

const meta = {
  title: "Inputs/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  args: {
    placeholder: "Describe the issue…",
    size: "md",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Textarea {...args} size="sm" placeholder="Small" />
      <Textarea {...args} size="md" placeholder="Medium" />
      <Textarea {...args} size="lg" placeholder="Large" />
    </div>
  ),
};

export const Invalid: Story = {
  args: { invalid: true, defaultValue: "Too short." },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Locked for review." },
};

export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: "This ticket was closed as resolved on 2026-07-14." },
};
