import type { Meta, StoryObj } from "@storybook/react";
import { BottomNavigation } from "@fuji-ui/react";
import { Bell, Home, Search, User } from "lucide-react";

const ITEMS = [
  { label: "Home", icon: <Home className="size-5" />, href: "#home", active: true },
  { label: "Search", icon: <Search className="size-5" />, href: "#search" },
  { label: "Alerts", icon: <Bell className="size-5" />, href: "#alerts" },
  { label: "Profile", icon: <User className="size-5" />, href: "#profile" },
];

const meta = {
  title: "Navigation/BottomNavigation",
  component: BottomNavigation,
  tags: ["autodocs"],
  args: { items: ITEMS },
} satisfies Meta<typeof BottomNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

// BottomNavigation is `position: fixed` to the viewport by default, so the
// story renders it inside a relatively-positioned, bounded "phone screen"
// box and overrides it to `absolute` there instead of pinning to the real
// preview canvas edge.
export const Default: Story = {
  render: (args) => (
    <div className="relative h-[28rem] w-full max-w-sm overflow-hidden rounded-fuji-panel border border-fuji-border">
      <BottomNavigation {...args} className="absolute" />
    </div>
  ),
};
