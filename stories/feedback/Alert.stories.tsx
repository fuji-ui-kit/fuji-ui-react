import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Alert } from "@fujiui/react";

const meta = {
  title: "Feedback/Alert",
  component: Alert,
  tags: ["autodocs"],
  args: {
    title: "Update available",
    children: "A new version of the dashboard is ready to install.",
    variant: "info",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "success", "warning", "danger", "info"],
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex w-full max-w-96 flex-col gap-3">
      {(["success", "warning", "danger", "info"] as const).map((variant) => (
        <Alert key={variant} {...args} variant={variant} title={`${variant} alert`} />
      ))}
    </div>
  ),
};

function DismissibleAlert() {
  const [visible, setVisible] = React.useState(true);
  if (!visible) {
    return <p className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">Dismissed.</p>;
  }
  return (
    <Alert variant="warning" title="Unsaved changes" onDismiss={() => setVisible(false)}>
      You have edits that haven't been saved yet.
    </Alert>
  );
}

export const Dismissible: Story = {
  render: () => <DismissibleAlert />,
};

export const NoTitle: Story = {
  args: { title: undefined, children: "A simple, title-less inline message." },
};
