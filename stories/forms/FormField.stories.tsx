import type { Meta, StoryObj } from "@storybook/react";
import { FormField, Input } from "@fujiui/react";

const meta = {
  title: "Forms/FormField",
  component: FormField,
  tags: ["autodocs"],
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <FormField className="w-full max-w-sm">
      <FormField.Label>Email</FormField.Label>
      <Input placeholder="you@example.com" />
      <FormField.Description>We'll never share your email.</FormField.Description>
    </FormField>
  ),
};

export const Invalid: Story = {
  render: () => (
    <FormField className="w-full max-w-sm" invalid>
      <FormField.Label>Email</FormField.Label>
      <Input defaultValue="not-an-email" />
      <FormField.Error>Enter a valid email address.</FormField.Error>
    </FormField>
  ),
};

export const Disabled: Story = {
  render: () => (
    <FormField className="w-full max-w-sm" disabled>
      <FormField.Label>Email</FormField.Label>
      <Input defaultValue="you@example.com" disabled />
      <FormField.Description>Managed by your organization.</FormField.Description>
    </FormField>
  ),
};
