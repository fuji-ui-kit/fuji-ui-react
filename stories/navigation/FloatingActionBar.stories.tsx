import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Copy, Pencil, Share2, Star, Trash2 } from "lucide-react";
import { FloatingActionBar } from "@fujiui/react";

const meta = {
  title: "Navigation/FloatingActionBar",
  component: FloatingActionBar,
  tags: ["autodocs"],
  args: {
    actions: [
      { icon: <Share2 />, label: "Share" },
      { icon: <Copy />, label: "Duplicate" },
      { icon: <Trash2 />, label: "Delete", destructive: true },
    ],
  },
} satisfies Meta<typeof FloatingActionBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "A single trigger that expands into a row of labelled actions. Not built on Popover: the actions are not an overlay layer, they are the same object changing shape, so the pill grows rather than a separate surface fading in. Escape or a click outside closes it.",
      },
    },
  },
};

export const Open: Story = {
  name: "Expanded",
  args: { defaultOpen: true },
};

export const ManyActions: Story = {
  args: {
    defaultOpen: true,
    actions: [
      { icon: <Star />, label: "Favourite" },
      { icon: <Pencil />, label: "Rename" },
      { icon: <Share2 />, label: "Share" },
      { icon: <Copy />, label: "Duplicate" },
      { icon: <Trash2 />, label: "Delete", destructive: true },
    ],
  },
};

/** Controlled: the bar reports intent via `onOpenChange` and shows only what `open` says. */
function ControlledDemo(args: React.ComponentProps<typeof FloatingActionBar>) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="flex flex-col items-start gap-3">
      <FloatingActionBar {...args} open={open} onOpenChange={setOpen} />
      <p className="m-0 text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">
        {open ? "Expanded" : "Collapsed"}
      </p>
    </div>
  );
}

export const Controlled: Story = {
  render: (args) => <ControlledDemo {...args} />,
};

export const PositionedByClassName: Story = {
  name: "Positioned with className",
  render: (args) => (
    // `transform` makes this box the containing block for the `fixed` dial,
    // so the demo stays inside the preview frame.
    <div className="relative h-80 w-full max-w-md translate-x-0 overflow-hidden rounded-fuji-panel border border-fuji-border">
      <FloatingActionBar {...args} className="fixed right-6 bottom-6" direction="up" />
    </div>
  ),
};
