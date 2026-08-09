import type { Meta, StoryObj } from "@storybook/react";
import { Sidebar } from "@fujiui/react";
import { BarChart3, Home, Settings, Users } from "lucide-react";

const meta = {
  title: "Navigation/Sidebar",
  component: Sidebar,
  tags: ["autodocs"],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="h-[28rem] w-full max-w-xs">
      <Sidebar>
        <Sidebar.Section label="Main">
          <Sidebar.Item icon={<Home className="size-4" />} active>
            Home
          </Sidebar.Item>
          <Sidebar.Item icon={<BarChart3 className="size-4" />}>Analytics</Sidebar.Item>
          <Sidebar.Item icon={<Users className="size-4" />}>Team</Sidebar.Item>
        </Sidebar.Section>
        <Sidebar.Section label="Preferences">
          <Sidebar.Item icon={<Settings className="size-4" />}>Settings</Sidebar.Item>
        </Sidebar.Section>
      </Sidebar>
    </div>
  ),
};
