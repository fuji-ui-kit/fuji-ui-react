import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { Button, Toaster, ToastProvider, useToast } from "@fujiui/react";

interface ToastConfig {
  title: string;
  description?: string;
  variant?: "success" | "warning" | "danger" | "info";
}

/**
 * Adds the given toasts once on mount, with `timeout: 0` (never
 * auto-dismisses) - so the story renders the toast's actual open state
 * directly in the canvas/Docs page, rather than requiring a click that then
 * disappears after Base UI's default 5s.
 */
function AutoToasts({ toasts }: { toasts: ToastConfig[] }) {
  const toast = useToast();
  const added = React.useRef(false);
  React.useEffect(() => {
    if (added.current) return;
    added.current = true;
    for (const { title, description, variant } of toasts) {
      toast.add({ title, description, timeout: 0, data: { variant } });
    }
  }, [toast, toasts]);
  return null;
}

const meta = {
  title: "Feedback/Toast",
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
        <Toaster />
      </ToastProvider>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function ToastTriggers() {
  const toast = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        tone="forest"
        onClick={() => toast.add({ title: "Changes saved", data: { variant: "success" } })}
      >
        Success
      </Button>
      <Button
        size="sm"
        tone="sun"
        onClick={() => toast.add({ title: "Storage almost full", data: { variant: "warning" } })}
      >
        Warning
      </Button>
      <Button
        size="sm"
        tone="fire"
        onClick={() =>
          toast.add({
            title: "Upload failed",
            description: "Check your connection and try again.",
            data: { variant: "danger" },
          })
        }
      >
        Danger
      </Button>
    </div>
  );
}

export const Default: Story = {
  render: () => <ToastTriggers />,
};

export const ClickShowsToast: Story = {
  render: () => <ToastTriggers />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Success" });
    await userEvent.click(button);
    await expect(canvas.getByRole("button", { name: "Success" })).toBeEnabled();
  },
};

/** Renders an already-open toast directly, rather than only a trigger button. */
export const Open: Story = {
  name: "Open (with description)",
  render: () => (
    <AutoToasts
      toasts={[
        {
          title: "Upload failed",
          description: "Check your connection and try again.",
          variant: "danger",
        },
      ]}
    />
  ),
};

/** All four variants shown stacked, as they'd appear if raised in quick succession. */
export const Stacked: Story = {
  render: () => (
    <AutoToasts
      toasts={[
        { title: "Changes saved", variant: "success" },
        { title: "Storage almost full", variant: "warning" },
        { title: "Sync in progress", variant: "info" },
        { title: "Upload failed", description: "Check your connection and try again.", variant: "danger" },
      ]}
    />
  ),
};
