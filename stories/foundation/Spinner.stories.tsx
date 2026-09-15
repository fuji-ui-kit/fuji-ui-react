import type { Meta, StoryObj } from "@storybook/react";
import { Spinner } from "@fujiui/react";

const meta = {
  title: "Foundation/Spinner",
  component: Spinner,
  tags: ["autodocs"],
  args: {
    size: "md",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
    tone: {
      control: "select",
      options: ["default", "forest", "sun", "fire", "water"],
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <Spinner {...args} size="sm" />
      <Spinner {...args} size="md" />
      <Spinner {...args} size="lg" />
    </div>
  ),
};

export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      {(["default", "forest", "sun", "fire", "water"] as const).map((tone) => (
        <Spinner key={tone} tone={tone} />
      ))}
    </div>
  ),
};

export const CustomLabel: Story = {
  args: { label: "Fetching results" },
};
