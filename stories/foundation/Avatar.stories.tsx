import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "@fujiui/react";
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
      options: ["default", "forest", "sun", "fire", "water"],
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Lorem Picsum's numeric-ID endpoint is deterministic; these four IDs are
// portraits.
const PEOPLE = [
  { id: 64, name: "Ava Lindqvist", initials: "AL" },
  { id: 91, name: "Noah Okafor", initials: "NO" },
  { id: 1005, name: "Mateo Ruiz", initials: "MR" },
  { id: 1027, name: "Priya Nair", initials: "PN" },
];

/** Real photographs, in all three sizes, with the initials fallback behind each one. */
export const Photos: Story = {
  name: "With photo",
  render: () => (
    <div className="flex flex-col gap-5">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="flex items-center gap-3">
          {PEOPLE.map((person) => (
            <Avatar
              key={person.id}
              size={size}
              src={`https://picsum.photos/id/${person.id}/200/200`}
              alt={person.name}
              fallback={person.initials}
            />
          ))}
        </div>
      ))}
    </div>
  ),
};

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
      {(["default", "forest", "sun", "fire", "water"] as const).map((tone) => (
        <Avatar key={tone} tone={tone} src={undefined} fallback={tone.slice(0, 2).toUpperCase()} />
      ))}
    </div>
  ),
};
