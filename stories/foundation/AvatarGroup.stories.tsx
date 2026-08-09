import type { Meta, StoryObj } from "@storybook/react";
import { AvatarGroup } from "@fuji-ui/react";
import { placeholderAvatar } from "../lib/placeholder-image";

const team = [
  { src: placeholderAvatar("jamie-rivera"), alt: "Jamie Rivera", fallback: "JR" },
  { src: placeholderAvatar("sam-okafor"), alt: "Sam Okafor", fallback: "SO" },
  { src: placeholderAvatar("priya-nair"), alt: "Priya Nair", fallback: "PN" },
  { alt: "Lee Chen", fallback: "LC" },
  { alt: "Morgan Blake", fallback: "MB" },
  { alt: "Ana Torres", fallback: "AT" },
];

const meta = {
  title: "Foundation/AvatarGroup",
  component: AvatarGroup,
  tags: ["autodocs"],
  args: {
    avatars: team.slice(0, 3),
    size: "md",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof AvatarGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Overflow: Story = {
  args: { avatars: team, max: 4 },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-3">
      <AvatarGroup {...args} size="sm" />
      <AvatarGroup {...args} size="md" />
      <AvatarGroup {...args} size="lg" />
    </div>
  ),
};
