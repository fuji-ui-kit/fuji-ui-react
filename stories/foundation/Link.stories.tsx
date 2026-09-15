import type { Meta, StoryObj } from "@storybook/react";
import { ExternalLink } from "lucide-react";
import { Link } from "@fujiui/react";

const meta = {
  title: "Foundation/Link",
  component: Link,
  tags: ["autodocs"],
  args: {
    children: "Visit the documentation",
    href: "https://example.com",
    underline: "always",
    tone: "default",
  },
  argTypes: {
    underline: { control: "select", options: ["always", "hover", "none"] },
    tone: { control: "select", options: ["default", "blue"] },
  },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const UnderlineBehaviors: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2">
      {(["always", "hover", "none"] as const).map((underline) => (
        <Link key={underline} {...args} underline={underline}>
          {`underline="${underline}"`}
        </Link>
      ))}
    </div>
  ),
};

export const Colors: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2">
      <Link {...args} tone="default">
        Default color link
      </Link>
      <Link {...args} tone="blue">
        Blue color link
      </Link>
    </div>
  ),
};

export const External: Story = {
  render: (args) => (
    <Link {...args} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
      Open in new tab
      <ExternalLink className="size-3.5" />
    </Link>
  ),
};
