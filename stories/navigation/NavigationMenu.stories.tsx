import type { Meta, StoryObj } from "@storybook/react";
import { NavigationMenu } from "@fujiui/react";

const meta = {
  title: "Navigation/NavigationMenu",
  component: NavigationMenu,
  tags: ["autodocs"],
} satisfies Meta<typeof NavigationMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenu.List>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <div className="flex w-64 flex-col gap-1">
              <NavigationMenu.Link href="#overview" className="text-[length:var(--fuji-text-sm)]">
                Overview
              </NavigationMenu.Link>
              <NavigationMenu.Link href="#pricing" className="text-[length:var(--fuji-text-sm)]">
                Pricing
              </NavigationMenu.Link>
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger>Resources</NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <div className="flex w-64 flex-col gap-1">
              <NavigationMenu.Link href="#docs" className="text-[length:var(--fuji-text-sm)]">
                Documentation
              </NavigationMenu.Link>
              <NavigationMenu.Link href="#blog" className="text-[length:var(--fuji-text-sm)]">
                Blog
              </NavigationMenu.Link>
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Link href="#about">About</NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
      <NavigationMenu.Portal />
    </NavigationMenu>
  ),
};
