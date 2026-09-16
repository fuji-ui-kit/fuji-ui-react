import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { FormField, Input, MultiSelect, Select, type MultiSelectItem } from "@fujiui/react";

const SKILLS: MultiSelectItem[] = [
  { value: "react", label: "React" },
  { value: "typescript", label: "TypeScript" },
  { value: "graphql", label: "GraphQL" },
  { value: "node", label: "Node.js" },
  { value: "rust", label: "Rust" },
  { value: "go", label: "Go" },
];

const meta = {
  title: "Forms/MultiSelect",
  component: MultiSelect,
  tags: ["autodocs"],
  args: {
    items: SKILLS,
    placeholder: "Select skills…",
    size: "md",
    "aria-label": "Skills",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof MultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex w-full max-w-md flex-col gap-3">
      <MultiSelect {...args} size="sm" />
      <MultiSelect {...args} size="md" />
      <MultiSelect {...args} size="lg" />
    </div>
  ),
};

/** Each size matches the height of a `Select` and `Input` at the same size. */
export const SizesAlongsideFields: Story = {
  name: "Sizes alongside Select and Input",
  render: (args) => (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="grid grid-cols-3 items-start gap-2">
          <MultiSelect {...args} size={size} />
          <Select aria-label="Level" size={size} items={[{ value: "a", label: "Senior" }]} />
          <Input aria-label="Name" size={size} placeholder="Name" />
        </div>
      ))}
    </div>
  ),
};

/** `FormField.Label` names the input - no `aria-label` needed. */
export const InFormField: Story = {
  name: "In a FormField",
  render: () => (
    <div className="w-full max-w-md">
      <FormField>
        <FormField.Label>Skills</FormField.Label>
        <MultiSelect items={SKILLS} placeholder="Select skills…" />
      </FormField>
    </div>
  ),
};

export const Invalid: Story = {
  args: { invalid: true },
};

function ControlledMultiSelect() {
  // MultiSelect's controlled `value` is the array of selected item objects
  // (Base UI Combobox's `multiple` value model), not an array of strings.
  const [value, setValue] = React.useState<MultiSelectItem[]>([SKILLS[0], SKILLS[2]]);
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <MultiSelect items={SKILLS} aria-label="Skills" value={value} onValueChange={setValue} />
      <p className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">
        Selected: {value.length > 0 ? value.map((item) => item.label).join(", ") : "(none)"}
      </p>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledMultiSelect />,
};
