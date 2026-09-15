import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { Mail, Trash2 } from "lucide-react";
import { Button } from "@fujiui/react";

const meta = {
  title: "Inputs/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    children: "Save changes",
    tone: "default",
    appearance: "contained",
    size: "md",
  },
  argTypes: {
    tone: {
      control: "select",
      options: ["default", "forest", "sun", "fire", "water"],
    },
    appearance: { control: "select", options: ["contained", "bordered", "dashed", "ghost"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
};

export const Tones: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {(["default", "forest", "sun", "fire", "water"] as const).map((tone) => (
        <Button key={tone} {...args} tone={tone}>
          {tone}
        </Button>
      ))}
    </div>
  ),
};

export const Appearances: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {(["contained", "bordered", "dashed", "ghost"] as const).map((appearance) => (
        <Button key={appearance} {...args} appearance={appearance}>
          {appearance}
        </Button>
      ))}
    </div>
  ),
};

export const WithIcons: Story = {
  args: {
    startIcon: <Mail className="size-4" />,
    endIcon: <Trash2 className="size-4" />,
    children: "Send and discard",
  },
};

export const Loading: Story = {
  args: { loading: true, children: "Saving..." },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const AsChildLink: Story = {
  name: "asChild (renders as <a>)",
  args: {
    asChild: true,
    children: <a href="https://example.com">Visit docs</a>,
  },
};

export const Clickable: Story = {
  args: { children: "Click me" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Click me" });
    await userEvent.click(button);
    await expect(button).toBeEnabled();
  },
};

export const Ripple: Story = {
  name: "Ripple",
  args: { ripple: true, children: "Press and hold" },
  parameters: {
    docs: {
      description: {
        story:
          "The press ripple is on by default on every Button and IconButton - it is part of how a press is meant to feel, not a per-control flourish. A circle grows from the pointer and stays while the button is held, fading out on release, so a long press reads as held rather than as a flash. Each press gets its own wave, so a fast double-tap shows two. Pass `ripple={false}` to suppress it; it is skipped entirely under `prefers-reduced-motion: reduce`.",
      },
    },
  },
};
