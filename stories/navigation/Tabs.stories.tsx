import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { Tabs } from "@fujiui/react";

const meta = {
  title: "Navigation/Tabs",
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-full max-w-sm">
      <Tabs.List>
        <Tabs.Tab value="overview">Overview</Tabs.Tab>
        <Tabs.Tab value="activity">Activity</Tabs.Tab>
        <Tabs.Tab value="settings">Settings</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="overview">Project summary and key metrics.</Tabs.Panel>
      <Tabs.Panel value="activity">Recent commits, deploys, and comments.</Tabs.Panel>
      <Tabs.Panel value="settings">Repository visibility, integrations, and danger zone.</Tabs.Panel>
    </Tabs>
  ),
};

export const DisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-full max-w-sm">
      <Tabs.List>
        <Tabs.Tab value="overview">Overview</Tabs.Tab>
        <Tabs.Tab value="billing" disabled>
          Billing
        </Tabs.Tab>
        <Tabs.Tab value="settings">Settings</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="overview">Project summary.</Tabs.Panel>
      <Tabs.Panel value="billing">Billing is only available on paid plans.</Tabs.Panel>
      <Tabs.Panel value="settings">Repository settings.</Tabs.Panel>
    </Tabs>
  ),
};

export const KeyboardNavigation: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-full max-w-sm">
      <Tabs.List>
        <Tabs.Tab value="overview">Overview</Tabs.Tab>
        <Tabs.Tab value="activity">Activity</Tabs.Tab>
        <Tabs.Tab value="settings">Settings</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="overview">Project summary.</Tabs.Panel>
      <Tabs.Panel value="activity">Recent activity.</Tabs.Panel>
      <Tabs.Panel value="settings">Settings.</Tabs.Panel>
    </Tabs>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const overview = canvas.getByRole("tab", { name: "Overview" });
    overview.focus();
    await userEvent.keyboard("{ArrowRight}");
    const activity = canvas.getByRole("tab", { name: "Activity" });
    await expect(activity).toHaveFocus();
  },
};
