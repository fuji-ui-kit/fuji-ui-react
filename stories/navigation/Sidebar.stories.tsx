import * as React from "react";
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

const MAIN_ITEMS = [
  { label: "Home", icon: Home },
  { label: "Analytics", icon: BarChart3 },
  { label: "Team", icon: Users },
];

/**
 * Selection is the consumer's job (`active` is a plain prop), so the story keeps it in state and
 * clicking actually moves the highlight.
 */
function InteractiveSidebar() {
  const [selected, setSelected] = React.useState("Home");
  return (
    <div className="h-[28rem] w-full max-w-xs">
      <Sidebar>
        <Sidebar.Section label="Main">
          {MAIN_ITEMS.map(({ label, icon: Icon }) => (
            <Sidebar.Item
              key={label}
              icon={<Icon className="size-4" />}
              active={selected === label}
              onClick={(event) => {
                event.preventDefault();
                setSelected(label);
              }}
              href="#"
            >
              {label}
            </Sidebar.Item>
          ))}
        </Sidebar.Section>
        <Sidebar.Section label="Preferences">
          <Sidebar.Item
            icon={<Settings className="size-4" />}
            active={selected === "Settings"}
            onClick={(event) => {
              event.preventDefault();
              setSelected("Settings");
            }}
            href="#"
          >
            Settings
          </Sidebar.Item>
        </Sidebar.Section>
      </Sidebar>
    </div>
  );
}

export const Default: Story = {
  render: () => <InteractiveSidebar />,
};
