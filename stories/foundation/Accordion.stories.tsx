import type { Meta, StoryObj } from "@storybook/react";
import { Accordion } from "@fujiui/react";

const meta = {
  title: "Foundation/Accordion",
  component: Accordion.Root,
  tags: ["autodocs"],
} satisfies Meta<typeof Accordion.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <Accordion defaultValue={["item-1"]} className="w-full max-w-md">
      <Accordion.Item value="item-1">
        <Accordion.Header>
          <Accordion.Trigger>What is Fuji UI?</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel>
          Fuji UI is a themeable, accessible React component system built on Base UI with support for
          light/dark themes and solid/glass materials.
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value="item-2">
        <Accordion.Header>
          <Accordion.Trigger>How do I get started?</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel>
          Install `@fujiui/react`, import the compiled stylesheet once at your app root, and wrap your
          application in `FujiProvider`.
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value="item-3">
        <Accordion.Header>
          <Accordion.Trigger>Can I customize styling?</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel>
          Yes. Every component accepts className merged through `cn`, and theme tokens can be customized using
          standard CSS custom properties.
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  ),
};

export const Multiple: Story = {
  render: () => (
    <Accordion multiple defaultValue={["features", "accessibility"]} className="w-full max-w-md">
      <Accordion.Item value="features">
        <Accordion.Header>
          <Accordion.Trigger>Core features</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel>
          Zero runtime style calculation, unbundled ESM for RSC boundary preservation, and automatic
          light/dark/glass theming.
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value="accessibility">
        <Accordion.Header>
          <Accordion.Trigger>Accessibility</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel>
          Full WAI-ARIA accordion pattern with keyboard navigation, explicit button types, and screen-reader
          tested roles.
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value="performance">
        <Accordion.Header>
          <Accordion.Trigger>Performance</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel>
          Smooth CSS-driven height reveal with zero layout jumps using Base UI height CSS variables.
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-6">
      <div>
        <h4 className="mb-2 text-sm font-semibold text-fuji-foreground">Individual item disabled</h4>
        <Accordion defaultValue={["active-1"]}>
          <Accordion.Item value="active-1">
            <Accordion.Header>
              <Accordion.Trigger>Available section</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>This item can be toggled normally.</Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="disabled-item" disabled>
            <Accordion.Header>
              <Accordion.Trigger>Disabled section</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>This content cannot be opened or closed.</Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-fuji-foreground">Entire accordion disabled</h4>
        <Accordion disabled defaultValue={["locked-1"]}>
          <Accordion.Item value="locked-1">
            <Accordion.Header>
              <Accordion.Trigger>Locked open section</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>The entire accordion is disabled, preventing interaction.</Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="locked-2">
            <Accordion.Header>
              <Accordion.Trigger>Locked closed section</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>This cannot be toggled.</Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </div>
    </div>
  ),
};
