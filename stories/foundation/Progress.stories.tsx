import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button, Progress } from "@fujiui/react";

const meta = {
  title: "Foundation/Progress",
  component: Progress,
  tags: ["autodocs"],
  args: {
    value: 25,
    className: "w-full max-w-sm",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "success", "warning", "danger", "info"],
    },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabelAndValue: Story = {
  args: { value: 75, label: "Uploading files", showValue: true },
};

export const Indeterminate: Story = {
  args: { value: null, label: "Syncing" },
};

export const Variants: Story = {
  render: (args) => (
    <div className="flex w-full max-w-sm flex-col gap-4">
      {(["success", "warning", "danger", "info"] as const).map((variant) => (
        <Progress key={variant} {...args} variant={variant} label={variant} showValue />
      ))}
    </div>
  ),
};

function LoadingDemo() {
  const [value, setValue] = React.useState(0);
  const [run, setRun] = React.useState(0);
  React.useEffect(() => {
    // The reference bumps the value by a random 0-20% every 500ms; the
    // spring on the fill turns those discrete jumps into one elastic motion.
    const id = window.setInterval(() => {
      setValue((current) => {
        const next = current + Math.random() * 20;
        if (next >= 100) window.clearInterval(id);
        return Math.min(next, 100);
      });
    }, 500);
    return () => window.clearInterval(id);
  }, [run]);
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <Progress value={value} label="Loading" showValue />
      <Button
        size="sm"
        appearance="bordered"
        className="self-start"
        onClick={() => {
          setValue(0);
          setRun((n) => n + 1);
        }}
      >
        Restart
      </Button>
    </div>
  );
}

/**
 * The fill uses `scaleX()` on the spring curve, so chunked values still move as one smooth,
 * slightly elastic bar (after motion.dev's loading bar).
 */
export const Loading: Story = {
  name: "Loading (spring)",
  render: () => <LoadingDemo />,
};
