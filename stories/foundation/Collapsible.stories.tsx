import type { Meta, StoryObj } from "@storybook/react";
import { Collapsible } from "@fujiui/react";

const meta = {
  title: "Foundation/Collapsible",
  component: Collapsible.Root,
  tags: ["autodocs"],
} satisfies Meta<typeof Collapsible.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Collapsible.Root className="w-full max-w-sm">
      <Collapsible.Trigger>What is Fuji UI?</Collapsible.Trigger>
      <Collapsible.Panel>
        <p className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">
          A themeable, accessible React component system built on Base UI.
        </p>
      </Collapsible.Panel>
    </Collapsible.Root>
  ),
};

export const InitiallyOpen: Story = {
  render: () => (
    <Collapsible.Root defaultOpen className="w-full max-w-sm">
      <Collapsible.Trigger>Billing details</Collapsible.Trigger>
      <Collapsible.Panel>
        <p className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">
          Invoices are issued monthly and sent to your account email.
        </p>
      </Collapsible.Panel>
    </Collapsible.Root>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Collapsible.Root disabled defaultOpen className="w-full max-w-sm">
      <Collapsible.Trigger>Locked section</Collapsible.Trigger>
      <Collapsible.Panel>
        <p className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">
          This content can't be toggled while disabled.
        </p>
      </Collapsible.Panel>
    </Collapsible.Root>
  ),
};
