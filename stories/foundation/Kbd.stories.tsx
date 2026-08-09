import type { Meta, StoryObj } from "@storybook/react";
import { Kbd } from "@fuji-ui/react";

const meta = {
  title: "Foundation/Kbd",
  component: Kbd,
  tags: ["autodocs"],
  args: {
    children: "⌘K",
  },
  argTypes: {
    tone: {
      control: "select",
      options: ["default", "earth", "forest", "sun", "fire", "water"],
    },
  },
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleKeys: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Kbd>Esc</Kbd>
      <Kbd>Enter</Kbd>
      <Kbd>Tab</Kbd>
      <Kbd>↑</Kbd>
      <Kbd>↓</Kbd>
    </div>
  ),
};

export const Combo: Story = {
  name: "Multi-key combo",
  render: () => (
    <div className="flex items-center gap-1.5">
      <Kbd>⌘</Kbd>
      <span className="text-fuji-foreground-subtle">+</span>
      <Kbd>Shift</Kbd>
      <span className="text-fuji-foreground-subtle">+</span>
      <Kbd>P</Kbd>
    </div>
  ),
};

export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {(["default", "earth", "forest", "sun", "fire", "water"] as const).map((tone) => (
        <Kbd key={tone} tone={tone}>
          {tone}
        </Kbd>
      ))}
    </div>
  ),
};

export const InlineWithText: Story = {
  render: () => (
    <p className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">
      Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to open the command menu.
    </p>
  ),
};
