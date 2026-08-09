import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { Mail, Search } from "lucide-react";
import { Input } from "@fujiui/react";

const meta = {
  title: "Inputs/Input",
  component: Input,
  tags: ["autodocs"],
  args: {
    placeholder: "you@example.com",
    size: "md",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Input {...args} size="sm" placeholder="Small" />
      <Input {...args} size="md" placeholder="Medium" />
      <Input {...args} size="lg" placeholder="Large" />
    </div>
  ),
};

export const WithSlots: Story = {
  name: "With start/end slots",
  args: {
    startSlot: <Mail className="size-4" />,
    endSlot: <span className="text-[length:var(--fuji-text-xs)]">kg</span>,
    placeholder: "Weight",
  },
};

function ClearableInput() {
  const [value, setValue] = React.useState("Ada Lovelace");
  return (
    <Input aria-label="Name" clearable value={value} onChange={(event) => setValue(event.target.value)} />
  );
}

/** Shows an unboxed "X" once there is a value; works controlled or uncontrolled. */
export const Clearable: Story = {
  render: () => <ClearableInput />,
};

export const Invalid: Story = {
  args: { invalid: true, defaultValue: "not-an-email" },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Read only value" },
};

/** Uncontrolled - the input owns its own value; only `defaultValue` is set. */
export const Uncontrolled: Story = {
  args: { defaultValue: "Ada Lovelace" },
};

function ControlledInput() {
  const [value, setValue] = React.useState("Ada Lovelace");
  return (
    <div className="flex flex-col gap-2">
      <Input
        startSlot={<Search className="size-4" />}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search…"
      />
      <p className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">
        Value: {value || "(empty)"}
      </p>
    </div>
  );
}

/** Controlled - value and onChange are owned by the story, matching a real form's pattern. */
export const Controlled: Story = {
  render: () => <ControlledInput />,
};

function NameInput() {
  const [value, setValue] = React.useState("");
  return <Input value={value} onChange={(event) => setValue(event.target.value)} aria-label="Name" />;
}

export const TypingUpdatesValue: Story = {
  render: () => <NameInput />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Name" });
    await userEvent.type(input, "Grace Hopper");
    await expect(input).toHaveValue("Grace Hopper");
  },
};
