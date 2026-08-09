import type { Meta, StoryObj } from "@storybook/react";
import { ChevronRight, CreditCard, Globe, Shield } from "lucide-react";
import { List } from "@fuji-ui/react";

const meta = {
  title: "Data Display/List",
  component: List,
  tags: ["autodocs"],
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <List className="w-full max-w-md">
      <List.Item
        startSlot={<Shield className="size-4 text-fuji-foreground-muted" />}
        endSlot={
          <span className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">Enabled</span>
        }
      >
        Two-factor authentication
      </List.Item>
      <List.Item
        startSlot={<Globe className="size-4 text-fuji-foreground-muted" />}
        endSlot={<span className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">Public</span>}
      >
        Profile visibility
      </List.Item>
      <List.Item
        startSlot={<CreditCard className="size-4 text-fuji-foreground-muted" />}
        endSlot={
          <span className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">Visa •••• 4242</span>
        }
      >
        Payment method
      </List.Item>
    </List>
  ),
};

export const ClickableRows: Story = {
  name: "Clickable rows",
  render: () => (
    <List className="w-full max-w-md">
      <List.Item
        startSlot={<Shield className="size-4 text-fuji-foreground-muted" />}
        endSlot={<ChevronRight className="size-4 text-fuji-foreground-subtle" />}
        onClick={() => {}}
      >
        Security settings
      </List.Item>
      <List.Item
        startSlot={<Globe className="size-4 text-fuji-foreground-muted" />}
        endSlot={<ChevronRight className="size-4 text-fuji-foreground-subtle" />}
        onClick={() => {}}
      >
        Privacy settings
      </List.Item>
      <List.Item
        startSlot={<CreditCard className="size-4 text-fuji-foreground-muted" />}
        endSlot={<ChevronRight className="size-4 text-fuji-foreground-subtle" />}
        onClick={() => {}}
      >
        Billing settings
      </List.Item>
    </List>
  ),
};
