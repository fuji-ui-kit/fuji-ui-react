import type { Meta, StoryObj } from "@storybook/react";
import { Grid } from "@fuji-ui/react";

function PlaceholderCard({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-fuji-border bg-fuji-surface-strong p-4 text-center text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">
      {label}
    </div>
  );
}

const meta = {
  title: "Foundation/Grid",
  component: Grid,
  tags: ["autodocs"],
  args: {
    columns: 3,
    gap: 4,
  },
  argTypes: {
    columns: { control: "select", options: [1, 2, 3, 4, 6, 12] },
    gap: { control: "select", options: [1, 2, 3, 4, 5, 6, 8, 10, 12, 16] },
  },
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Grid {...args} className="w-full">
      {Array.from({ length: 6 }, (_, index) => (
        <PlaceholderCard key={index} label={`Card ${index + 1}`} />
      ))}
    </Grid>
  ),
};

export const TwoColumns: Story = {
  render: () => (
    <Grid columns={2} className="w-full">
      {Array.from({ length: 4 }, (_, index) => (
        <PlaceholderCard key={index} label={`Card ${index + 1}`} />
      ))}
    </Grid>
  ),
};

export const FourColumns: Story = {
  render: () => (
    <Grid columns={4} gap={3} className="w-full">
      {Array.from({ length: 8 }, (_, index) => (
        <PlaceholderCard key={index} label={`Card ${index + 1}`} />
      ))}
    </Grid>
  ),
};
