import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "@fujiui/react";

const meta = {
  title: "Foundation/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: {
    children: "New",
    tone: "default",
  },
  argTypes: {
    tone: {
      control: "select",
      options: ["default", "earth", "forest", "sun", "fire", "water"],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Tones: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {(["default", "earth", "forest", "sun", "fire", "water"] as const).map((tone) => (
        <Badge key={tone} {...args} tone={tone}>
          {tone}
        </Badge>
      ))}
    </div>
  ),
};

export const Counter: Story = {
  args: { children: "12", tone: "fire" },
};

export const AppearanceAndShape: Story = {
  name: "Appearance x shape",
  render: () => (
    <div className="flex flex-col gap-4">
      {(["rounded", "square"] as const).map((shape) => (
        <div key={shape} className="flex flex-wrap items-center gap-3">
          {(["soft", "solid", "bordered"] as const).map((appearance) => (
            <Badge key={appearance} tone="forest" appearance={appearance} shape={shape}>
              {shape} · {appearance}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  ),
};

function RemovableBadge() {
  return <Badge onRemove={() => {}}>Removable</Badge>;
}

export const Removable: Story = {
  render: () => <RemovableBadge />,
};
