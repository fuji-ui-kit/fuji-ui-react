import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { Heart, Trash2 } from "lucide-react";
import { IconButton } from "@fujiui/react";

const meta = {
  title: "Inputs/IconButton",
  component: IconButton,
  tags: ["autodocs"],
  // No decorator on purpose: a card-recipe wrapper read as part of the component. Ghost has full
  // foreground contrast; only its boundary is invisible, by design - see `Appearances`.
  args: {
    "aria-label": "Like",
    children: <Heart className="size-4" />,
    tone: "default",
    appearance: "ghost",
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
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <IconButton {...args} size="sm" />
      <IconButton {...args} size="md" />
      <IconButton {...args} size="lg" />
    </div>
  ),
};

export const Appearances: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {(["contained", "bordered", "dashed", "ghost"] as const).map((appearance) => (
        <IconButton key={appearance} {...args} appearance={appearance} aria-label={`${appearance} like`} />
      ))}
    </div>
  ),
};

export const Destructive: Story = {
  args: { "aria-label": "Delete", children: <Trash2 className="size-4" />, tone: "fire" },
};

export const Loading: Story = {
  args: { loading: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Clickable: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Like" });
    await userEvent.click(button);
    await expect(button).toBeEnabled();
  },
};
