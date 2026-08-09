import type { Meta, StoryObj } from "@storybook/react";
import { Fieldset, FormField, Input } from "@fujiui/react";

const meta = {
  title: "Forms/Fieldset",
  component: Fieldset,
  tags: ["autodocs"],
} satisfies Meta<typeof Fieldset>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Fieldset className="w-full max-w-sm">
      <Fieldset.Legend>Contact details</Fieldset.Legend>
      <FormField>
        <FormField.Label>Full name</FormField.Label>
        <Input placeholder="Ada Lovelace" />
      </FormField>
      <FormField>
        <FormField.Label>Email</FormField.Label>
        <Input placeholder="you@example.com" />
        <FormField.Description>We'll never share your email.</FormField.Description>
      </FormField>
    </Fieldset>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Fieldset className="w-full max-w-sm" disabled>
      <Fieldset.Legend>Contact details</Fieldset.Legend>
      <FormField>
        <FormField.Label>Full name</FormField.Label>
        <Input placeholder="Ada Lovelace" />
      </FormField>
      <FormField>
        <FormField.Label>Email</FormField.Label>
        <Input placeholder="you@example.com" />
      </FormField>
    </Fieldset>
  ),
};
