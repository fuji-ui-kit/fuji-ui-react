import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "@fujiui/react";

const ROLES = [
  { value: "engineer", label: "Engineer" },
  { value: "designer", label: "Designer" },
  { value: "product", label: "Product Manager" },
  { value: "support", label: "Support Specialist" },
];

const meta = {
  title: "Inputs/Select",
  component: Select,
  tags: ["autodocs"],
  args: {
    items: ROLES,
    placeholder: "Select a role…",
    size: "md",
    "aria-label": "Role",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Select {...args} size="sm" />
      <Select {...args} size="md" />
      <Select {...args} size="lg" />
    </div>
  ),
};

export const Invalid: Story = {
  args: { invalid: true },
};

export const Uncontrolled: Story = {
  args: { defaultValue: "designer" },
};

function ControlledSelect() {
  const [value, setValue] = React.useState("engineer");
  return (
    <div className="flex flex-col gap-2">
      <Select
        items={ROLES}
        aria-label="Role"
        value={value}
        onValueChange={(next) => setValue(next as string)}
      />
      <p className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">
        Selected: {ROLES.find((role) => role.value === value)?.label}
      </p>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledSelect />,
};
