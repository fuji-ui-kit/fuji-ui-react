import type { Meta, StoryObj } from "@storybook/react";
import { BottomNavigation } from "@fujiui/react";
import { Bell, Home, Plus, Search, User } from "lucide-react";

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

// Rendered inside a bounded "phone screen" box. `position="absolute"` is the
// prop for a contained parent; the previous `className="absolute"` override
// never applied, because Fuji's own positioning class lives in its cascade
// layer and won - the bar escaped the box and pinned to the preview's edge.
export const Default: Story = {
  render: (args) => (
    <div className="relative h-[28rem] w-full max-w-sm overflow-hidden rounded-fuji-panel border border-fuji-border">
      <BottomNavigation {...args} position="absolute" />
    </div>
  ),
};

export const Sticky: Story = {
  name: "Sticky (default) inside a scrolling panel",
  render: (args) => (
    <div className="h-[28rem] w-full max-w-sm overflow-y-auto rounded-fuji-panel border border-fuji-border bg-fuji-surface">
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 14 }, (_, i) => (
          <div key={i} className="h-12 rounded-fuji-control bg-fuji-surface-strong" />
        ))}
      </div>
      <BottomNavigation {...args} />
    </div>
  ),
};

export const FloatingWithAction: Story = {
  name: "Floating, notched, with centre action",
  parameters: {
    docs: {
      // Storybook's JSX pretty-printer recurses forever on the React element
      // inside the `action` object; show the literal source instead.
      source: { type: "code" },
      description: {
        story:
          '`variant="floating"` detaches the bar from the edge as a pill with the panel shadow; `action` places a raised button in a notch cut from the bar. Best seen with the toolbar\'s elevation set to `floating`.',
      },
    },
  },
  render: (args) => (
    <div className="relative h-[28rem] w-full max-w-sm overflow-hidden rounded-fuji-panel bg-fuji-background">
      <BottomNavigation
        {...args}
        position="absolute"
        variant="floating"
        items={[
          { label: "Bill", icon: <Home className="size-5" />, href: "#bill" },
          { label: "List", icon: <Search className="size-5" />, href: "#list" },
          { label: "Bag", icon: <Bell className="size-5" />, href: "#bag", active: true },
          { label: "My", icon: <User className="size-5" />, href: "#my" },
        ]}
        action={{ icon: <Plus className="size-6" />, "aria-label": "Create" }}
      />
    </div>
  ),
};

/**
 * The four ways an active item can be marked. Colour alone is not a sufficient
 * indicator (WCAG 1.4.1) - `aria-current="page"` is always set, and these add
 * a visible non-colour cue on top of it.
 */
export const ActiveIndicators: Story = {
  name: "Active indicators",
  render: (args) => (
    <div className="flex flex-col gap-6">
      {(["none", "dot", "pill", "circle"] as const).map((indicator) => (
        <div key={indicator} className="flex flex-col gap-2">
          <p className="m-0 text-[length:var(--fuji-text-xs)] font-medium text-fuji-foreground-muted uppercase">
            {indicator}
          </p>
          <div className="relative h-24 w-full max-w-sm overflow-hidden rounded-fuji-panel border border-fuji-border">
            <BottomNavigation {...args} position="absolute" indicator={indicator} />
          </div>
        </div>
      ))}
    </div>
  ),
};
