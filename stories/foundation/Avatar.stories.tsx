import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "@fuji-ui/react";
import { placeholderAvatar } from "../lib/placeholder-image";

const meta = {
  title: "Foundation/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  args: {
    src: placeholderAvatar("jamie-rivera"),
    alt: "Jamie Rivera",
    fallback: "JR",
    size: "md",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
    tone: {
      control: "select",
      options: ["default", "earth", "forest", "sun", "fire", "water"],
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Fallback: Story = {
  args: { src: undefined, fallback: "JR" },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Avatar {...args} size="sm" />
      <Avatar {...args} size="md" />
      <Avatar {...args} size="lg" />
    </div>
  ),
};

export const BrokenImage: Story = {
  name: "Broken image (falls back)",
  args: { src: "https://example.com/does-not-exist.png", fallback: "JR" },
};

export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {(["default", "earth", "forest", "sun", "fire", "water"] as const).map((tone) => (
        <Avatar key={tone} tone={tone} src={undefined} fallback={tone.slice(0, 2).toUpperCase()} />
      ))}
    </div>
  ),
};
