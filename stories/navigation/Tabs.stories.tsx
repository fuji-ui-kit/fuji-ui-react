import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
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

export const Pill: Story = {
  name: "Pill variant (raised indicator)",
  parameters: {
    docs: {
      description: {
        story:
          '`<Tabs.List variant="pill">` turns the list into a white pill with a raised black tile that slides between tabs - the navigation-style tab bar of the reference designs. Underline remains the default for document sections.',
      },
    },
  },
  render: () => (
    <Tabs defaultValue="storage" className="w-full max-w-md">
      <Tabs.List variant="pill">
        <Tabs.Tab value="storage">Storage</Tabs.Tab>
        <Tabs.Tab value="inactive">Inactive</Tabs.Tab>
        <Tabs.Tab value="archive">Archive</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="storage">You're using 68% of your 100 GB plan.</Tabs.Panel>
      <Tabs.Panel value="inactive">No inactive items.</Tabs.Panel>
      <Tabs.Panel value="archive">12 archived items.</Tabs.Panel>
    </Tabs>
  ),
};
