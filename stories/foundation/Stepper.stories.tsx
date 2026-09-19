import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ArrowLeft, ArrowRight, User, FileText, CheckCircle2, PartyPopper } from "lucide-react";
import { Button, Stepper, type StepperStep } from "@fujiui/react";

const STEPS: StepperStep[] = [
  { label: "Account", description: "Create your login" },
  { label: "Profile", description: "Tell us about you" },
  { label: "Review", description: "Confirm details" },
  { label: "Done" },
];

const ICON_STEPS: StepperStep[] = [
  { label: "Account", description: "Create your login", icon: <User className="size-4" /> },
  { label: "Profile", description: "Tell us about you", icon: <FileText className="size-4" /> },
  { label: "Review", description: "Confirm details", icon: <CheckCircle2 className="size-4" /> },
  { label: "Done", icon: <PartyPopper className="size-4" /> },
];

const meta = {
  title: "Foundation/Stepper",
  component: Stepper,
  tags: ["autodocs"],
  args: {
    steps: STEPS,
    activeStep: 1,
  },
  argTypes: {
    tone: {
      control: "select",
      options: ["default", "forest", "sun", "fire", "water"],
    },
  },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every story is live: click a step to move there. `activeStep` sets the starting step;
 * `onStepClick` makes the circles buttons.
 */
function LiveStepper(props: React.ComponentProps<typeof Stepper>) {
  const [active, setActive] = React.useState(props.activeStep);
  const [seeded, setSeeded] = React.useState(props.activeStep);
  // Follow the control panel when it changes the starting step.
  if (seeded !== props.activeStep) {
    setSeeded(props.activeStep);
    setActive(props.activeStep);
  }
  return <Stepper {...props} activeStep={active} onStepClick={setActive} />;
}

export const Default: Story = {
  render: (args) => <LiveStepper {...args} />,
};

export const FirstStep: Story = {
  args: { activeStep: 0 },
  render: (args) => <LiveStepper {...args} />,
};

export const LastStep: Story = {
  args: { activeStep: STEPS.length - 1 },
  render: (args) => <LiveStepper {...args} />,
};

const CHECKOUT_STEPS: StepperStep[] = [
  { label: "Shopping basket" },
  { label: "Personal details" },
  { label: "Shipping details" },
  { label: "Payment", disabled: true },
  { label: "Confirmation" },
];

function StepperPlayground() {
  const [active, setActive] = React.useState(2);
  const last = CHECKOUT_STEPS.length - 1;
  return (
    <div className="flex w-full max-w-3xl flex-col gap-8">
      <Stepper tone="forest" steps={CHECKOUT_STEPS} activeStep={active} onStepClick={setActive} />
      <div className="flex items-center justify-between">
        <Button
          appearance="bordered"
          startIcon={<ArrowLeft className="size-4" />}
          disabled={active === 0}
          onClick={() => setActive((step) => Math.max(step - 1, 0))}
        >
          Back
        </Button>
        <span className="text-[length:var(--fuji-text-sm)] text-fuji-foreground-muted">
          Step {active + 1} of {CHECKOUT_STEPS.length}
        </span>
        <Button
          endIcon={<ArrowRight className="size-4" />}
          disabled={active === last}
          onClick={() => setActive((step) => Math.min(step + 1, last))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

/**
 * Every step is clickable except the `disabled` "Payment"; Back/Next move one at a time, animating
 * the connector, the filled circle and the check.
 */
export const Playground: Story = {
  name: "Playground (back / next)",
  render: () => <StepperPlayground />,
};

export const CustomIcons: Story = {
  name: "Custom step icons",
  args: { steps: ICON_STEPS },
  render: (args) => <LiveStepper {...args} />,
};

export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(["default", "forest", "sun", "fire", "water"] as const).map((tone) => (
        <LiveStepper key={tone} steps={STEPS} activeStep={1} tone={tone} />
      ))}
    </div>
  ),
};
