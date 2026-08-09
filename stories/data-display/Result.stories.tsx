import type { Meta, StoryObj } from "@storybook/react";
import { Button, Result } from "@fuji-ui/react";

const meta = {
  title: "Data Display/Result",
  component: Result,
  tags: ["autodocs"],
  args: {
    variant: "success",
    title: "Payment successful",
    description: "Your order ORD-1042 has been confirmed and is being prepared.",
    actions: <Button appearance="contained">View order</Button>,
  },
} satisfies Meta<typeof Result>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ErrorResult: Story = {
  name: "Error",
  args: {
    variant: "danger",
    title: "Payment failed",
    description: "We couldn't charge your card. Please try another payment method.",
    actions: <Button appearance="contained">Retry payment</Button>,
  },
};

export const WarningResult: Story = {
  name: "Warning",
  args: {
    variant: "warning",
    title: "Action required",
    description: "Your subscription will be paused unless you update your billing details.",
    actions: <Button appearance="bordered">Update billing</Button>,
  },
};

export const InfoResult: Story = {
  name: "Info, no actions",
  args: {
    variant: "info",
    title: "No results found",
    description: "Try adjusting your filters or search terms.",
    actions: undefined,
  },
};
