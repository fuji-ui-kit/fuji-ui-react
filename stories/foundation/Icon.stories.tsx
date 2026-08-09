import type { Meta, StoryObj } from "@storybook/react";
import { Bell, Heart, Mail, Settings, Star, Trash2 } from "lucide-react";
import { Icon } from "@fuji-ui/react";

const meta = {
  title: "Foundation/Icon",
  component: Icon,
  tags: ["autodocs"],
  args: {
    icon: Heart,
    size: "md",
    tone: "default",
    background: "none",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
    tone: {
      control: "select",
      options: ["default", "muted", "subtle", "earth", "forest", "sun", "fire", "water"],
    },
    background: { control: "select", options: ["none", "subtle", "solid"] },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Gallery: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Icon icon={Heart} label="Heart" />
      <Icon icon={Star} label="Star" />
      <Icon icon={Settings} label="Settings" />
      <Icon icon={Bell} label="Notifications" />
      <Icon icon={Trash2} label="Delete" />
      <Icon icon={Mail} label="Mail" />
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-end gap-4">
      <Icon {...args} size="sm" />
      <Icon {...args} size="md" />
      <Icon {...args} size="lg" />
    </div>
  ),
};

export const Backgrounds: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      {(["none", "subtle", "solid"] as const).map((background) => (
        <Icon key={background} {...args} icon={Bell} background={background} />
      ))}
    </div>
  ),
};

export const Tones: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      {(["default", "muted", "subtle", "earth", "forest", "sun", "fire", "water"] as const).map((tone) => (
        <Icon key={tone} {...args} icon={Heart} tone={tone} background="subtle" />
      ))}
    </div>
  ),
};
