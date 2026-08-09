import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Switch } from "@fuji-ui/react";

const meta = {
  title: "Forms/Switch",
  component: Switch,
  tags: ["autodocs"],
  args: {
    label: "Enable notifications",
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const On: Story = {
  args: { defaultChecked: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledOn: Story = {
  args: { disabled: true, defaultChecked: true },
};

function ControlledSwitch() {
  const [checked, setChecked] = React.useState(false);
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <Switch label="Airplane mode" checked={checked} onCheckedChange={setChecked} />
      <p className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">{checked ? "On" : "Off"}</p>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledSwitch />,
};
