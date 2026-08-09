import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Combobox, type ComboboxItem } from "@fuji-ui/react";

const FRAMEWORKS: ComboboxItem[] = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "svelte", label: "Svelte" },
  { value: "solid", label: "Solid" },
  { value: "angular", label: "Angular" },
];

const meta = {
  title: "Inputs/Combobox",
  component: Combobox,
  tags: ["autodocs"],
  args: {
    items: FRAMEWORKS,
    placeholder: "Search frameworks…",
    size: "md",
    "aria-label": "Framework",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Combobox {...args} size="sm" />
      <Combobox {...args} size="md" />
      <Combobox {...args} size="lg" />
    </div>
  ),
};

export const Invalid: Story = {
  args: { invalid: true },
};

function ControlledCombobox() {
  // Combobox's controlled `value` is the selected item object itself (not its
  // string `.value`) - Select uses a string-keyed model, Combobox does not,
  // so the two aren't interchangeable here.
  const [value, setValue] = React.useState<ComboboxItem | null>(FRAMEWORKS[0]);
  return (
    <div className="flex flex-col gap-2">
      <Combobox items={FRAMEWORKS} aria-label="Framework" value={value} onValueChange={setValue} />
      <p className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">
        Selected: {value?.label ?? "(none)"}
      </p>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledCombobox />,
};
