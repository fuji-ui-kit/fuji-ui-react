import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "@fuji-ui/react";

const meta = {
  title: "Forms/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  args: {
    label: "Accept terms and conditions",
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Indeterminate: Story = {
  args: { indeterminate: true, label: "Select all" },
};

function ControlledCheckbox() {
  const [checked, setChecked] = React.useState(false);
  return (
    <div className="flex flex-col gap-2">
      <Checkbox label="Subscribe to newsletter" checked={checked} onCheckedChange={setChecked} />
      <p className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">
        Checked: {checked ? "yes" : "no"}
      </p>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledCheckbox />,
};
