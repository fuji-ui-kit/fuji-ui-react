import type { Meta, StoryObj } from "@storybook/react";
import { Container } from "@fujiui/react";

const meta = {
  title: "Foundation/Container",
  component: Container,
  tags: ["autodocs"],
  args: {
    size: "lg",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg", "xl"] },
  },
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Container {...args}>
      <div className="rounded-lg border border-dashed border-fuji-border-strong bg-fuji-surface-strong p-6">
        <h2 className="text-[length:var(--fuji-text-lg)] font-semibold text-fuji-foreground">Page heading</h2>
        <p className="mt-2 text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">
          Container centers this content and applies a responsive max-width plus gutters.
        </p>
      </div>
    </Container>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(["sm", "md", "lg", "xl"] as const).map((size) => (
        <Container key={size} size={size}>
          <div className="rounded-lg bg-fuji-surface-strong p-3 text-center text-[length:var(--fuji-text-xs)] text-fuji-foreground-muted">
            size="{size}"
          </div>
        </Container>
      ))}
    </div>
  ),
};
